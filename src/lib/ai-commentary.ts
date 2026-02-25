/**
 * Real-time AI Commentary Engine
 *
 * Generates live, streaming market commentary by fusing:
 * - Latest news headlines
 * - Price movements (Fear & Greed, top movers)
 * - On-chain signals (whale alerts, funding rates)
 * - Narrative trends
 *
 * Designed to feel like a Bloomberg terminal's AI anchor desk —
 * concise, opinionated, data-driven commentary in real-time SSE.
 *
 * @module lib/ai-commentary
 */

import { aiComplete, aiCompleteStream, getAIConfigOrNull, type AICompleteOptions } from './ai-provider';
import { getLatestNews } from './crypto-news';
import { getTopCoins, getGlobalMarketData, getFearGreedIndex } from './market-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommentaryTone = 'anchor' | 'analyst' | 'trader' | 'degen';
export type CommentaryUrgency = 'flash' | 'breaking' | 'developing' | 'routine';

export interface CommentaryEvent {
  id: string;
  timestamp: string;
  type: 'commentary' | 'alert' | 'insight' | 'prediction' | 'recap';
  urgency: CommentaryUrgency;
  tone: CommentaryTone;
  headline: string;
  body: string;
  sources: string[];
  tickers: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  confidence: number; // 0-100
  tags: string[];
}

export interface MarketSnapshot {
  btcPrice: number;
  btcChange24h: number;
  ethPrice: number;
  ethChange24h: number;
  totalMarketCap: number;
  marketCapChange24h: number;
  fearGreed: number;
  fearGreedLabel: string;
  dominanceBtc: number;
  topMovers: { name: string; symbol: string; change: number }[];
  headlines: { title: string; source: string; timeAgo: string }[];
}

// ---------------------------------------------------------------------------
// Market Snapshot Builder
// ---------------------------------------------------------------------------

export async function buildMarketSnapshot(): Promise<MarketSnapshot> {
  const [newsResult, marketData, fearGreed, topCoins] = await Promise.all([
    getLatestNews(10).catch(() => ({ articles: [] })),
    getGlobalMarketData().catch(() => null),
    getFearGreedIndex().catch(() => null),
    getTopCoins(20).catch(() => []),
  ]);

  const btc = (topCoins as Record<string, unknown>[]).find(
    (c: Record<string, unknown>) => (c as { symbol: string }).symbol === 'btc'
  ) as Record<string, unknown> | undefined;
  const eth = (topCoins as Record<string, unknown>[]).find(
    (c: Record<string, unknown>) => (c as { symbol: string }).symbol === 'eth'
  ) as Record<string, unknown> | undefined;

  // Sort by absolute change to find top movers
  const movers = [...(topCoins as Record<string, unknown>[])]
    .sort(
      (a, b) =>
        Math.abs((b as { price_change_percentage_24h?: number }).price_change_percentage_24h ?? 0) -
        Math.abs((a as { price_change_percentage_24h?: number }).price_change_percentage_24h ?? 0)
    )
    .slice(0, 5)
    .map((c: Record<string, unknown>) => ({
      name: (c as { name: string }).name,
      symbol: ((c as { symbol: string }).symbol ?? '').toUpperCase(),
      change: (c as { price_change_percentage_24h?: number }).price_change_percentage_24h ?? 0,
    }));

  return {
    btcPrice: (btc as { current_price?: number })?.current_price ?? 0,
    btcChange24h: (btc as { price_change_percentage_24h?: number })?.price_change_percentage_24h ?? 0,
    ethPrice: (eth as { current_price?: number })?.current_price ?? 0,
    ethChange24h: (eth as { price_change_percentage_24h?: number })?.price_change_percentage_24h ?? 0,
    totalMarketCap: (marketData as { total_market_cap?: { usd?: number } })?.total_market_cap?.usd ?? 0,
    marketCapChange24h: (marketData as { market_cap_change_percentage_24h_usd?: number })?.market_cap_change_percentage_24h_usd ?? 0,
    fearGreed: (fearGreed as { value?: number })?.value ?? 50,
    fearGreedLabel: (fearGreed as { value_classification?: string })?.value_classification ?? 'Neutral',
    dominanceBtc: (marketData as { market_cap_percentage?: { btc?: number } })?.market_cap_percentage?.btc ?? 0,
    topMovers: movers,
    headlines: newsResult.articles.slice(0, 8).map(a => ({
      title: a.title,
      source: a.source,
      timeAgo: a.timeAgo,
    })),
  };
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const TONE_INSTRUCTIONS: Record<CommentaryTone, string> = {
  anchor:
    'You are a professional crypto news anchor. Speak with authority and clarity. Use broadcast news style — short, punchy sentences. Open with the most important development.',
  analyst:
    'You are a senior crypto market analyst. Provide data-driven insights with specific numbers. Reference price levels, support/resistance, and market structure. Be precise but accessible.',
  trader:
    'You are a veteran crypto trader giving real-time market updates. Focus on actionable observations — key levels, momentum shifts, volume patterns. Use trading terminology naturally.',
  degen:
    'You are a savvy crypto-native commentator. Mix deep market knowledge with crypto culture references. Use terms like "aping in", "diamond hands", "rekt" naturally. Be entertaining but still insightful.',
};

function buildCommentaryPrompt(
  snapshot: MarketSnapshot,
  tone: CommentaryTone,
  previousCommentary?: string
): { system: string; user: string } {
  const system = `${TONE_INSTRUCTIONS[tone]}

RULES:
- Generate 3–5 commentary items as a JSON array
- Each item: { "type": "commentary"|"alert"|"insight"|"prediction"|"recap", "urgency": "flash"|"breaking"|"developing"|"routine", "headline": "SHORT punchy headline (max 12 words)", "body": "2-3 sentences of analysis", "tickers": ["BTC", "ETH", ...], "sentiment": "bullish"|"bearish"|"neutral"|"mixed", "confidence": 0-100, "tags": ["tag1", "tag2"] }
- Include at least one "insight" connecting multiple data points
- If there's a clear signal, include one "prediction" (with conservative confidence)
- Reference specific numbers from the data
- Respond ONLY with a JSON array — no markdown, no extra text
${previousCommentary ? '\nAvoid repeating these recent points:\n' + previousCommentary : ''}`;

  const user = `LIVE MARKET DATA (${new Date().toISOString()}):

BTC: $${snapshot.btcPrice.toLocaleString()} (${snapshot.btcChange24h > 0 ? '+' : ''}${snapshot.btcChange24h.toFixed(2)}% 24h)
ETH: $${snapshot.ethPrice.toLocaleString()} (${snapshot.ethChange24h > 0 ? '+' : ''}${snapshot.ethChange24h.toFixed(2)}% 24h)
Total Market Cap: $${(snapshot.totalMarketCap / 1e12).toFixed(2)}T (${snapshot.marketCapChange24h > 0 ? '+' : ''}${snapshot.marketCapChange24h.toFixed(2)}%)
BTC Dominance: ${snapshot.dominanceBtc.toFixed(1)}%
Fear & Greed: ${snapshot.fearGreed}/100 (${snapshot.fearGreedLabel})

TOP MOVERS:
${snapshot.topMovers.map(m => `  ${m.symbol}: ${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}%`).join('\n')}

LATEST HEADLINES:
${snapshot.headlines.map(h => `  [${h.source}] ${h.title} (${h.timeAgo})`).join('\n')}

Generate real-time market commentary based on this data.`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// Commentary Generator
// ---------------------------------------------------------------------------

let recentHeadlines: string[] = [];

export async function generateCommentary(
  tone: CommentaryTone = 'anchor',
): Promise<CommentaryEvent[]> {
  const config = getAIConfigOrNull();
  if (!config) {
    return [createFallbackCommentary(await buildMarketSnapshot())];
  }

  const snapshot = await buildMarketSnapshot();
  const previousSummary = recentHeadlines.length > 0
    ? recentHeadlines.slice(0, 5).join('; ')
    : undefined;

  const { system, user } = buildCommentaryPrompt(snapshot, tone, previousSummary);

  try {
    const raw = await aiComplete(system, user, {
      maxTokens: 2000,
      temperature: 0.7,
      jsonMode: true,
    });

    // Parse the JSON array
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed.commentary || parsed.items || [parsed];

    const events: CommentaryEvent[] = items.map((item: Record<string, unknown>, i: number) => ({
      id: `commentary-${Date.now()}-${i}`,
      timestamp: new Date().toISOString(),
      type: item.type || 'commentary',
      urgency: item.urgency || 'routine',
      tone,
      headline: item.headline || 'Market Update',
      body: item.body || '',
      sources: snapshot.headlines.slice(0, 3).map(h => h.source),
      tickers: Array.isArray(item.tickers) ? item.tickers : [],
      sentiment: item.sentiment || 'neutral',
      confidence: typeof item.confidence === 'number' ? item.confidence : 50,
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));

    // Track recent headlines to avoid repetition
    recentHeadlines = [
      ...events.map(e => e.headline),
      ...recentHeadlines,
    ].slice(0, 20);

    return events;
  } catch (error) {
    console.error('[AI Commentary] Generation failed:', error);
    return [createFallbackCommentary(snapshot)];
  }
}

/**
 * Returns a streaming SSE ReadableStream of AI commentary.
 * Each event is a JSON-encoded CommentaryEvent sent as SSE `data:`.
 */
export function streamCommentary(
  tone: CommentaryTone = 'anchor',
  intervalMs = 60000
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // Send initial batch immediately
      try {
        const events = await generateCommentary(tone);
        for (const event of events) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
      } catch (err) {
        console.error('[AI Commentary] Initial stream error:', err);
      }

      // Then poll at interval
      const poll = async () => {
        try {
          const events = await generateCommentary(tone);
          for (const event of events) {
            if (controller.desiredSize === null) return; // stream closed
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          }
        } catch (err) {
          console.error('[AI Commentary] Stream poll error:', err);
        }
      };

      const interval = setInterval(poll, intervalMs);

      // Cleanup on cancel
      const originalCancel = controller.constructor.prototype.close;
      controller.close = () => {
        clearInterval(interval);
        originalCancel?.call(controller);
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Fallback (no AI provider)
// ---------------------------------------------------------------------------

function createFallbackCommentary(snapshot: MarketSnapshot): CommentaryEvent {
  const direction = snapshot.btcChange24h > 0 ? 'up' : 'down';
  const magnitude = Math.abs(snapshot.btcChange24h);
  const intensity = magnitude > 5 ? 'sharp' : magnitude > 2 ? 'notable' : 'modest';

  return {
    id: `fallback-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'recap',
    urgency: magnitude > 5 ? 'breaking' : 'routine',
    tone: 'anchor',
    headline: `BTC ${direction === 'up' ? 'Rallies' : 'Drops'} ${magnitude.toFixed(1)}% — Market ${snapshot.fearGreedLabel}`,
    body: `Bitcoin is trading at $${snapshot.btcPrice.toLocaleString()}, ${direction} ${magnitude.toFixed(2)}% in the last 24 hours. The Fear & Greed Index sits at ${snapshot.fearGreed}/100 (${snapshot.fearGreedLabel}). ${snapshot.topMovers[0] ? `Top mover: ${snapshot.topMovers[0].symbol} at ${snapshot.topMovers[0].change > 0 ? '+' : ''}${snapshot.topMovers[0].change.toFixed(2)}%.` : ''}`,
    sources: snapshot.headlines.slice(0, 2).map(h => h.source),
    tickers: ['BTC', 'ETH'],
    sentiment: snapshot.btcChange24h > 2 ? 'bullish' : snapshot.btcChange24h < -2 ? 'bearish' : 'neutral',
    confidence: 70,
    tags: ['market-recap', intensity],
  };
}
