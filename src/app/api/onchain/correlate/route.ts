/**
 * GET /api/onchain/correlate
 *
 * Detects statistically anomalous on-chain events from the local archive and
 * uses AI to find the matching news narratives for each anomaly.
 *
 * Cache: 30-minute in-memory
 */

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getLatestNews } from '@/lib/crypto-news';
import { OnchainEvent, CorrelationResult, correlateToNews, detectAnomalies } from '@/lib/onchainCorrelator';
import { getAIConfigOrNull } from '@/lib/ai-provider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CorrelationEntry {
  event: OnchainEvent;
  correlation: string;
  confidence: number;
  related_headlines: string[];
}

interface CacheEntry {
  data: { correlations: CorrelationEntry[]; computed_at: string };
  expiresAt: number;
}

// ---------------------------------------------------------------------------
// In-memory cache — 30 minutes
// ---------------------------------------------------------------------------
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

// ---------------------------------------------------------------------------
// Archive parsing helpers
// ---------------------------------------------------------------------------

interface OnchainSnapshot {
  timestamp?: string;
  bitcoin?: {
    network?: {
      hash_rate?: number;
      estimated_btc_sent_24h?: number;
      market_price_usd?: number;
      miners_revenue_usd?: number;
      difficulty?: number;
    };
    large_transactions?: Array<{
      hash?: string;
      value?: number;
      value_usd?: number;
    }>;
  };
  ethereum?: {
    network?: {
      hash_rate?: number;
      market_price_usd?: number;
    };
    large_transactions?: Array<{
      hash?: string;
      value?: number;
      value_usd?: number;
    }>;
  };
  defi?: {
    dex_volumes?: {
      total_24h?: number;
    };
    tvl?: {
      total?: number;
    };
  };
}

/**
 * Read the most recent JSONL files from archive/onchain/ and return snapshots
 * from the last `lookbackDays` days.
 */
function readArchiveSnapshots(lookbackDays = 7): OnchainSnapshot[] {
  const archiveDir = path.join(process.cwd(), 'archive', 'onchain');
  if (!fs.existsSync(archiveDir)) return [];

  const cutoff = Date.now() - lookbackDays * 24 * 60 * 60 * 1000;

  // Sort JSONL files descending; read the latest ones
  const files = fs
    .readdirSync(archiveDir)
    .filter(f => f.endsWith('.jsonl'))
    .sort()
    .reverse()
    .slice(0, 2); // current month + previous month is enough for 7 days

  const snapshots: OnchainSnapshot[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(archiveDir, file), 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed) as OnchainSnapshot;
        const ts = obj.timestamp ? new Date(obj.timestamp).getTime() : 0;
        if (ts >= cutoff) snapshots.push(obj);
      } catch {
        // skip malformed lines
      }
    }
  }

  return snapshots;
}

/**
 * Convert archive snapshots into a flat list of OnchainEvent objects.
 * Each snapshot produces one event per tracked metric.
 */
function snapshotsToEvents(snapshots: OnchainSnapshot[]): OnchainEvent[] {
  const events: OnchainEvent[] = [];

  for (const snap of snapshots) {
    const ts = snap.timestamp ?? new Date().toISOString();
    const btcNet = snap.bitcoin?.network;
    const defi = snap.defi;

    if (btcNet?.hash_rate) {
      events.push({
        type: 'hash_rate',
        coin: 'BTC',
        value: btcNet.hash_rate,
        timestamp: ts,
        significance: btcNet.hash_rate > 8e11 ? 'high' : btcNet.hash_rate > 4e11 ? 'medium' : 'low',
      });
    }

    if (btcNet?.estimated_btc_sent_24h) {
      events.push({
        type: 'transfer_volume',
        coin: 'BTC',
        value: btcNet.estimated_btc_sent_24h,
        timestamp: ts,
        significance: btcNet.estimated_btc_sent_24h > 200_000 ? 'high' : btcNet.estimated_btc_sent_24h > 50_000 ? 'medium' : 'low',
      });
    }

    if (btcNet?.miners_revenue_usd) {
      events.push({
        type: 'miner_revenue',
        coin: 'BTC',
        value: btcNet.miners_revenue_usd,
        timestamp: ts,
        significance: btcNet.miners_revenue_usd > 5e7 ? 'high' : 'medium',
      });
    }

    if (defi?.dex_volumes?.total_24h) {
      events.push({
        type: 'dex_volume',
        coin: 'DeFi',
        value: defi.dex_volumes.total_24h,
        timestamp: ts,
        significance: defi.dex_volumes.total_24h > 5e9 ? 'high' : defi.dex_volumes.total_24h > 1e9 ? 'medium' : 'low',
      });
    }

    if (defi?.tvl?.total) {
      events.push({
        type: 'tvl',
        coin: 'DeFi',
        value: defi.tvl.total,
        timestamp: ts,
        significance: defi.tvl.total > 1e11 ? 'high' : 'medium',
      });
    }

    // Individual large BTC transactions
    for (const tx of snap.bitcoin?.large_transactions ?? []) {
      const valueUsd = tx.value_usd ?? 0;
      if (valueUsd > 1_000_000) {
        events.push({
          type: 'whale_transfer',
          coin: 'BTC',
          value: valueUsd,
          timestamp: ts,
          significance: valueUsd > 1e8 ? 'high' : valueUsd > 1e7 ? 'medium' : 'low',
        });
      }
    }

    // Individual large ETH transactions
    for (const tx of snap.ethereum?.large_transactions ?? []) {
      const valueUsd = tx.value_usd ?? 0;
      if (valueUsd > 1_000_000) {
        events.push({
          type: 'whale_transfer',
          coin: 'ETH',
          value: valueUsd,
          timestamp: ts,
          significance: valueUsd > 1e8 ? 'high' : valueUsd > 1e7 ? 'medium' : 'low',
        });
      }
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Synthetic fallback events — used when the archive has no data
// ---------------------------------------------------------------------------

function buildFallbackEvents(): OnchainEvent[] {
  const now = new Date().toISOString();
  return [
    { type: 'hash_rate',       coin: 'BTC',  value: 1.12e12, timestamp: now, significance: 'high' },
    { type: 'dex_volume',      coin: 'DeFi', value: 6.5e9,   timestamp: now, significance: 'high' },
    { type: 'transfer_volume', coin: 'BTC',  value: 86000,   timestamp: now, significance: 'medium' },
  ];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  // Serve from cache if still fresh
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json(cache.data);
  }

  try {
    // 1. Load and parse on-chain archive data
    const snapshots = readArchiveSnapshots(7);
    const allEvents = snapshots.length > 0 ? snapshotsToEvents(snapshots) : buildFallbackEvents();

    // 2. Detect statistically anomalous events
    let anomalies = await detectAnomalies(allEvents);

    // Upgrade significance for all anomalies (they passed the 2-stddev test)
    anomalies = anomalies.map(e => ({ ...e, significance: 'high' as const }));

    // 3. Fetch recent news headlines (direct import — no HTTP loopback)
    const newsData = await getLatestNews(50);
    const headlines = newsData.articles.map(a => a.title).filter(Boolean);

    // 4. Correlate each anomaly against headlines (only if AI is configured)
    const correlations: CorrelationEntry[] = [];
    const aiAvailable = getAIConfigOrNull(true) !== null;

    if (aiAvailable && headlines.length > 0 && anomalies.length > 0) {
      // Limit to 5 anomalies to avoid exhausting the AI budget per request
      const targets = anomalies.slice(0, 5);
      const results: CorrelationResult[] = await Promise.all(
        targets.map(event => correlateToNews(event, headlines)),
      );

      for (let i = 0; i < targets.length; i++) {
        const res = results[i];
        correlations.push({
          event: targets[i],
          correlation: res.correlation,
          confidence: res.confidence,
          related_headlines: res.related_headlines,
        });
      }
    } else if (anomalies.length > 0) {
      // AI not configured — return events with empty correlation fields
      for (const event of anomalies.slice(0, 5)) {
        correlations.push({ event, correlation: '', confidence: 0, related_headlines: [] });
      }
    }

    const payload = {
      correlations,
      computed_at: new Date().toISOString(),
    };

    cache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(payload);
  } catch (error) {
    console.error('[onchain/correlate] Error:', error);
    return NextResponse.json(
      { correlations: [], computed_at: new Date().toISOString(), error: 'Analysis unavailable' },
      { status: 500 },
    );
  }
}
