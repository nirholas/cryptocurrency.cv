/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Real-Time Data Ingestion Pipeline
 *
 * Background scheduler that continuously fetches and caches hot data so API
 * routes never need to call upstream on every request.
 *
 * Data sources & intervals:
 *   - Prices:        every 10 s  (Binance WS + CoinGecko fallback)
 *   - News:          every 60 s  (top 20 RSS feeds, parallel fetch)
 *   - Fear & Greed:  every 5 min (Alternative.me)
 *   - Gas:           every 15 s  (Etherscan)
 *   - Funding rates: every 1 min (Binance Futures)
 *
 * Results are persisted into Redis (REDIS_URL) with appropriate TTLs.
 * API routes read from Redis cache-first instead of fetching upstream.
 * Integrates with circuit breakers — if an upstream fails the pipeline
 * skips it and serves stale data.
 */

import { redisGet, redisSet, isRedisAvailable, initRedis } from './redis';
import { logger } from '@/lib/logger';
import {
  CircuitBreaker,
  CircuitOpenError,
  CircuitState,
} from './circuit-breaker';

// ─── Pipeline Redis Keys ────────────────────────────────────────────────────

export const pipelineKeys = {
  prices: 'pipeline:prices',
  news: 'pipeline:news',
  fearGreed: 'pipeline:fear-greed',
  gas: 'pipeline:gas',
  fundingRates: 'pipeline:funding-rates',
  status: 'pipeline:meta:status',
} as const;

// ─── Pipeline TTLs (seconds) — 3× the fetch interval as safety margin ─────

export const pipelineTTL = {
  prices: 60,         // fetched every 10 s → stale after 60 s
  news: 300,          // fetched every 60 s → stale after 5 min
  fearGreed: 1800,    // fetched every 5 min → stale after 30 min
  gas: 90,            // fetched every 15 s → stale after 90 s
  fundingRates: 300,  // fetched every 60 s → stale after 5 min
} as const;

// ─── Fetch Intervals (ms) ──────────────────────────────────────────────────

const INTERVALS = {
  prices: 10_000,         // 10 s
  news: 60_000,           // 60 s
  fearGreed: 300_000,     // 5 min
  gas: 15_000,            // 15 s
  fundingRates: 60_000,   // 60 s
} as const;

// ─── Dedicated Circuit Breakers ─────────────────────────────────────────────

const pipelineBreakers = {
  prices: CircuitBreaker.for('pipeline-prices', {
    failureThreshold: 5,
    cooldownMs: 30_000,
    timeoutMs: 8_000,
  }),
  news: CircuitBreaker.for('pipeline-news', {
    failureThreshold: 5,
    cooldownMs: 60_000,
    timeoutMs: 20_000,
  }),
  fearGreed: CircuitBreaker.for('pipeline-fear-greed', {
    failureThreshold: 3,
    cooldownMs: 120_000,
    timeoutMs: 10_000,
  }),
  gas: CircuitBreaker.for('pipeline-gas', {
    failureThreshold: 5,
    cooldownMs: 30_000,
    timeoutMs: 8_000,
  }),
  fundingRates: CircuitBreaker.for('pipeline-funding-rates', {
    failureThreshold: 5,
    cooldownMs: 30_000,
    timeoutMs: 8_000,
  }),
};

// ─── Per-Source Health Tracking ──────────────────────────────────────────────

export interface SourceHealth {
  lastFetchAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  consecutiveErrors: number;
  totalFetches: number;
  totalErrors: number;
  avgLatencyMs: number;
  circuitState: CircuitState;
}

export interface PipelineStatus {
  running: boolean;
  startedAt: string | null;
  uptime: number;
  sources: Record<string, SourceHealth>;
  redis: {
    available: boolean;
  };
}

type SourceName = 'prices' | 'news' | 'fearGreed' | 'gas' | 'fundingRates';

const healthMap = new Map<SourceName, SourceHealth>();

function initHealth(name: SourceName): SourceHealth {
  const h: SourceHealth = {
    lastFetchAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastError: null,
    consecutiveErrors: 0,
    totalFetches: 0,
    totalErrors: 0,
    avgLatencyMs: 0,
    circuitState: CircuitState.CLOSED,
  };
  healthMap.set(name, h);
  return h;
}

function getHealth(name: SourceName): SourceHealth {
  return healthMap.get(name) ?? initHealth(name);
}

function recordSuccess(name: SourceName, latencyMs: number): void {
  const h = getHealth(name);
  h.lastFetchAt = new Date().toISOString();
  h.lastSuccessAt = new Date().toISOString();
  h.consecutiveErrors = 0;
  h.totalFetches++;
  // Exponential moving average for latency
  h.avgLatencyMs = h.avgLatencyMs === 0
    ? latencyMs
    : h.avgLatencyMs * 0.8 + latencyMs * 0.2;
  h.circuitState = pipelineBreakers[name].getState();
}

function recordError(name: SourceName, error: unknown): void {
  const h = getHealth(name);
  h.lastFetchAt = new Date().toISOString();
  h.lastErrorAt = new Date().toISOString();
  h.lastError = error instanceof Error ? error.message : String(error);
  h.consecutiveErrors++;
  h.totalFetches++;
  h.totalErrors++;
  h.circuitState = pipelineBreakers[name].getState();
}

// ─── Top 30 RSS Feed URLs for pipeline pre-fetching ────────────────────────

const TOP_RSS_FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://www.theblock.co/rss.xml',
  'https://cointelegraph.com/rss',
  'https://bitcoinmagazine.com/.rss/full/',
  'https://decrypt.co/feed',
  'https://www.dlnews.com/arc/outboundfeeds/rss/',
  'https://blockworks.co/feed',
  'https://thedefiant.io/feed',
  'https://rekt.news/rss.xml',
  'https://messari.io/rss',
  'https://u.today/rss',
  'https://www.coinbase.com/blog/rss.xml',
  'https://solana.com/news/rss.xml',
  'https://insights.glassnode.com/rss/',
  'https://www.alchemy.com/blog/rss',
  'https://stacker.news/rss',
  'https://www.reuters.com/technology/cryptocurrency/rss',
  'https://www.cnbc.com/id/100727362/device/rss/rss.html',
  'https://finance.yahoo.com/rss/cryptocurrency',
  'https://l2beat.com/blog/rss.xml',
  // New high-signal sources
  'https://watcher.guru/news/feed',
  'https://www.cryptopolitan.com/feed/',
  'https://techcrunch.com/category/cryptocurrency/feed/',
  'https://www.coincenter.org/feed/',
  'https://dydx.exchange/blog/feed',
  'https://www.helius.dev/blog/feed',
  'https://blog.coinmarketcap.com/feed/',
  'https://blog.coingecko.com/feed/',
  'https://cryptoslate.com/feed/',
  // Wave 4 high-signal sources
  'https://www.theguardian.com/technology/rss',
  'https://fortune.com/section/crypto/feed/',
  'https://www.axios.com/pro/crypto-deals/feed',
  'https://santiment.net/blog/feed/',
  'https://www.fidelitydigitalassets.com/blog/rss.xml',
];

// ─── Default Coins for Price Pipeline ──────────────────────────────────────

const PIPELINE_COINS = [
  'bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple',
  'cardano', 'dogecoin', 'avalanche-2', 'polkadot', 'chainlink',
  'toncoin', 'shiba-inu', 'polygon-ecosystem-token', 'litecoin',
  'uniswap', 'near', 'stellar', 'aptos', 'arbitrum', 'sui',
];

// ─── Fetch Functions ────────────────────────────────────────────────────────

/**
 * Fetch prices from Binance ticker API with CoinGecko fallback
 */
async function fetchPrices(): Promise<Record<string, unknown>> {
  // Try Binance first (faster, no rate limit issues)
  try {
    const binanceSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT',
      'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT',
      'TONUSDT', 'SHIBUSDT', 'POLUSDT', 'LTCUSDT', 'UNIUSDT',
      'NEARUSDT', 'XLMUSDT', 'APTUSDT', 'ARBUSDT', 'SUIUSDT'];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=' +
      encodeURIComponent(JSON.stringify(binanceSymbols)),
      { signal: controller.signal },
    );
    clearTimeout(timer);

    if (res.ok) {
      const tickers = await res.json();
      const result: Record<string, { usd: number; usd_24h_change: number }> = {};

      const symbolToCoinId: Record<string, string> = {
        BTCUSDT: 'bitcoin', ETHUSDT: 'ethereum', SOLUSDT: 'solana',
        BNBUSDT: 'binancecoin', XRPUSDT: 'ripple', ADAUSDT: 'cardano',
        DOGEUSDT: 'dogecoin', AVAXUSDT: 'avalanche-2', DOTUSDT: 'polkadot',
        LINKUSDT: 'chainlink', TONUSDT: 'toncoin', SHIBUSDT: 'shiba-inu',
        POLUSDT: 'polygon-ecosystem-token', LTCUSDT: 'litecoin',
        UNIUSDT: 'uniswap', NEARUSDT: 'near', XLMUSDT: 'stellar',
        APTUSDT: 'aptos', ARBUSDT: 'arbitrum', SUIUSDT: 'sui',
      };

      for (const ticker of tickers) {
        const coinId = symbolToCoinId[ticker.symbol];
        if (coinId) {
          result[coinId] = {
            usd: parseFloat(ticker.lastPrice),
            usd_24h_change: parseFloat(ticker.priceChangePercent),
          };
        }
      }

      if (Object.keys(result).length > 0) {
        return { ...result, _source: 'binance', _timestamp: new Date().toISOString() };
      }
    }
  } catch {
    // Fall through to CoinGecko
  }

  // CoinGecko fallback
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${PIPELINE_COINS.join(',')}&vs_currencies=usd&include_24hr_change=true`,
    { signal: controller.signal },
  );
  clearTimeout(timer);

  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = await res.json();
  return { ...data, _source: 'coingecko', _timestamp: new Date().toISOString() };
}

/**
 * Fetch news from top 20 RSS feeds in parallel
 */
async function fetchNews(): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);

  const results = await Promise.allSettled(
    TOP_RSS_FEEDS.map(async (url) => {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'free-crypto-news/1.0 (+https://github.com/nirholas/free-crypto-news)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
      const text = await res.text();
      return { url, ok: true, size: text.length, snippet: text.slice(0, 500) };
    }),
  );

  clearTimeout(timer);

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  // We store a lightweight summary — the actual parsing happens in the
  // existing getLatestNews() function which API routes call. The pipeline
  // pre-warms the RSS content so the next API call finds cached responses.
  return {
    feedsChecked: TOP_RSS_FEEDS.length,
    succeeded,
    failed,
    _timestamp: new Date().toISOString(),
    _source: 'rss-pipeline',
  };
}

/**
 * Fetch Fear & Greed index from Alternative.me
 */
async function fetchFearGreed(): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  const [currentRes, histRes] = await Promise.all([
    fetch('https://api.alternative.me/fng/', { signal: controller.signal }),
    fetch('https://api.alternative.me/fng/?limit=30', { signal: controller.signal }),
  ]);

  clearTimeout(timer);

  if (!currentRes.ok) throw new Error(`FNG current HTTP ${currentRes.status}`);
  if (!histRes.ok) throw new Error(`FNG history HTTP ${histRes.status}`);

  const currentData = await currentRes.json();
  const histData = await histRes.json();

  if (!currentData.data?.[0]) throw new Error('Invalid FNG response');

  const value = parseInt(currentData.data[0].value);
  const classification = value <= 20 ? 'Extreme Fear'
    : value <= 40 ? 'Fear'
    : value <= 60 ? 'Neutral'
    : value <= 80 ? 'Greed'
    : 'Extreme Greed';

  return {
    current: {
      value,
      valueClassification: classification,
      timestamp: parseInt(currentData.data[0].timestamp) * 1000,
      timeUntilUpdate: currentData.data[0].time_until_update || 'Unknown',
    },
    historical: (histData.data || []).map((item: { value: string; timestamp: string; time_until_update?: string }) => ({
      value: parseInt(item.value),
      timestamp: parseInt(item.timestamp) * 1000,
    })),
    _timestamp: new Date().toISOString(),
    _source: 'alternative.me',
  };
}

/**
 * Fetch Ethereum gas prices from Etherscan
 */
async function fetchGas(): Promise<Record<string, unknown>> {
  const etherscanKey = process.env.ETHERSCAN_API_KEY || '';
  const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle${etherscanKey ? `&apikey=${etherscanKey}` : ''}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);

  if (!res.ok) throw new Error(`Etherscan HTTP ${res.status}`);

  const data = await res.json();

  if (data.status === '1' && data.result) {
    return {
      network: 'ethereum',
      baseFee: parseFloat(data.result.suggestBaseFee) || null,
      low: { gwei: parseInt(data.result.SafeGasPrice), usd: null },
      medium: { gwei: parseInt(data.result.ProposeGasPrice), usd: null },
      high: { gwei: parseInt(data.result.FastGasPrice), usd: null },
      lastBlock: data.result.LastBlock,
      timestamp: new Date().toISOString(),
      source: 'etherscan',
      _source: 'pipeline',
    };
  }

  throw new Error('Etherscan returned unexpected status');
}

/**
 * Fetch funding rates from Binance Futures
 */
async function fetchFundingRates(): Promise<unknown[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  const res = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex', {
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (!res.ok) throw new Error(`Binance Futures HTTP ${res.status}`);

  const data = await res.json();
  return data;
}

// ─── Pipeline Runner ────────────────────────────────────────────────────────

type FetchFn = () => Promise<unknown>;

async function runFetchLoop(
  name: SourceName,
  key: string,
  ttl: number,
  fetchFn: FetchFn,
): Promise<void> {
  const start = Date.now();
  const breaker = pipelineBreakers[name];

  try {
    const data = await breaker.call(fetchFn);
    const latency = Date.now() - start;

    await redisSet(key, data, ttl);
    recordSuccess(name, latency);

     
    logger.info(`[Pipeline] ${name} OK (${latency}ms)`);
  } catch (error) {
    recordError(name, error);

    if (error instanceof CircuitOpenError) {
       
      logger.warn(`[Pipeline] ${name} SKIPPED — circuit open`);
    } else {
       
      logger.error(`[Pipeline] ${name} FAILED`, error instanceof Error ? error : undefined);
    }
    // Pipeline does NOT throw — stale data remains in Redis
  }
}

// ─── Singleton Pipeline Manager ─────────────────────────────────────────────

let _running = false;
let _startedAt: Date | null = null;
const _timers: NodeJS.Timeout[] = [];

/**
 * Start the data pipeline.
 * Safe to call multiple times — only the first call starts the loops.
 */
export async function startPipeline(): Promise<void> {
  if (_running) return;
  _running = true;
  _startedAt = new Date();

  // Ensure Redis is ready (falls back to memory if unavailable)
  await initRedis().catch(() => {});

   
  logger.info('[Pipeline] Starting real-time data pipeline…');

  // Initialize health entries
  for (const name of ['prices', 'news', 'fearGreed', 'gas', 'fundingRates'] as SourceName[]) {
    initHealth(name);
  }

  // ── Bootstrap: run all fetches immediately in parallel ──
  await Promise.allSettled([
    runFetchLoop('prices', pipelineKeys.prices, pipelineTTL.prices, fetchPrices),
    runFetchLoop('news', pipelineKeys.news, pipelineTTL.news, fetchNews),
    runFetchLoop('fearGreed', pipelineKeys.fearGreed, pipelineTTL.fearGreed, fetchFearGreed),
    runFetchLoop('gas', pipelineKeys.gas, pipelineTTL.gas, fetchGas),
    runFetchLoop('fundingRates', pipelineKeys.fundingRates, pipelineTTL.fundingRates, fetchFundingRates),
  ]);

  // ── Schedule recurring loops ──
  _timers.push(
    setInterval(
      () => runFetchLoop('prices', pipelineKeys.prices, pipelineTTL.prices, fetchPrices),
      INTERVALS.prices,
    ),
  );

  _timers.push(
    setInterval(
      () => runFetchLoop('news', pipelineKeys.news, pipelineTTL.news, fetchNews),
      INTERVALS.news,
    ),
  );

  _timers.push(
    setInterval(
      () => runFetchLoop('fearGreed', pipelineKeys.fearGreed, pipelineTTL.fearGreed, fetchFearGreed),
      INTERVALS.fearGreed,
    ),
  );

  _timers.push(
    setInterval(
      () => runFetchLoop('gas', pipelineKeys.gas, pipelineTTL.gas, fetchGas),
      INTERVALS.gas,
    ),
  );

  _timers.push(
    setInterval(
      () => runFetchLoop('fundingRates', pipelineKeys.fundingRates, pipelineTTL.fundingRates, fetchFundingRates),
      INTERVALS.fundingRates,
    ),
  );

   
  logger.info('[Pipeline] All fetch loops scheduled');
}

/**
 * Stop the pipeline (graceful shutdown, tests, hot-reload).
 */
export function stopPipeline(): void {
  for (const t of _timers) clearInterval(t);
  _timers.length = 0;
  _running = false;
  _startedAt = null;
   
  logger.info('[Pipeline] Stopped');
}

/**
 * Get full pipeline status for the admin endpoint.
 */
export function getPipelineStatus(): PipelineStatus {
  const sources: Record<string, SourceHealth> = {};

  for (const name of ['prices', 'news', 'fearGreed', 'gas', 'fundingRates'] as SourceName[]) {
    const h = getHealth(name);
    // Refresh circuit state
    h.circuitState = pipelineBreakers[name].getState();
    sources[name] = { ...h };
  }

  return {
    running: _running,
    startedAt: _startedAt?.toISOString() ?? null,
    uptime: _startedAt ? Date.now() - _startedAt.getTime() : 0,
    sources,
    redis: {
      available: isRedisAvailable(),
    },
  };
}

// ─── Cache-First Read Helpers (used by API routes) ──────────────────────────

/**
 * Read pipeline-cached prices. Returns null if no cached data is available.
 */
export async function getPipelinePrices(): Promise<Record<string, unknown> | null> {
  return redisGet<Record<string, unknown>>(pipelineKeys.prices);
}

/**
 * Read pipeline-cached news metadata. Returns null if unavailable.
 */
export async function getPipelineNews(): Promise<Record<string, unknown> | null> {
  return redisGet<Record<string, unknown>>(pipelineKeys.news);
}

/**
 * Read pipeline-cached Fear & Greed data. Returns null if unavailable.
 */
export async function getPipelineFearGreed(): Promise<Record<string, unknown> | null> {
  return redisGet<Record<string, unknown>>(pipelineKeys.fearGreed);
}

/**
 * Read pipeline-cached gas prices. Returns null if unavailable.
 */
export async function getPipelineGas(): Promise<Record<string, unknown> | null> {
  return redisGet<Record<string, unknown>>(pipelineKeys.gas);
}

/**
 * Read pipeline-cached funding rates. Returns null if unavailable.
 */
export async function getPipelineFundingRates(): Promise<unknown[] | null> {
  return redisGet<unknown[]>(pipelineKeys.fundingRates);
}

// ─── Auto-start in Node.js server environment ──────────────────────────────

if (typeof window === 'undefined' && process.env.ENABLE_PIPELINE === '1') {
  startPipeline().catch(console.error);
}
