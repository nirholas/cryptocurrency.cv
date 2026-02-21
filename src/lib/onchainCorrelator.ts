/**
 * Onchain-to-News Correlation utilities.
 *
 * Connects on-chain anomalies to news narratives using the shared AI provider.
 */

import { aiComplete, getAIConfigOrNull } from '@/lib/ai-provider';

export type OnchainEvent = {
  /** Category of on-chain activity, e.g. "hash_rate", "dex_volume", "whale_transfer" */
  type: string;
  /** Ticker / asset identifier, e.g. "BTC", "ETH", "DeFi" */
  coin: string;
  /** Numeric measurement value for this event */
  value: number;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Pre-classified significance level */
  significance: 'low' | 'medium' | 'high';
};

export type CorrelationResult = {
  /** Human-readable narrative explaining the news ↔ onchain link */
  correlation: string;
  /** 0–1 confidence score */
  confidence: number;
  /** Subset of input headlines that are thematically related */
  related_headlines: string[];
};

// ---------------------------------------------------------------------------
// correlateToNews
// ---------------------------------------------------------------------------

const CORRELATE_SYSTEM_PROMPT = `You are an expert crypto analyst that finds narrative connections between on-chain blockchain anomalies and news headlines.

Given a single on-chain event and a list of recent news headlines, identify which headlines are narratively connected to the event and explain WHY.

Respond ONLY with minified JSON matching this exact schema (no markdown, no extra text):
{
  "correlation": "<one-to-two sentence narrative explanation>",
  "confidence": <0.0–1.0 float>,
  "related_headlines": ["<exact headline text 1>", "<exact headline text 2>"]
}

Rules:
- Only include headlines that are genuinely related – do not hallucinate.
- confidence reflects how strong the narrative link is (0 = unrelated, 1 = direct cause).
- If no headlines are related, return correlation="" confidence=0 related_headlines=[].`;

/**
 * Uses the configured AI provider to find narrative connections between
 * a single on-chain event and a set of recent news headlines.
 *
 * @example
 * const result = await correlateToNews(event, headlines);
 * // { correlation: "Large ETH validator exits correlate with 3 articles about SEC staking pressure",
 * //   confidence: 0.82, related_headlines: ["SEC targets staking providers", ...] }
 */
export async function correlateToNews(
  event: OnchainEvent,
  recentHeadlines: string[],
): Promise<CorrelationResult> {
  const cfg = getAIConfigOrNull(/* preferGroq */ true);
  if (!cfg || recentHeadlines.length === 0) {
    return { correlation: '', confidence: 0, related_headlines: [] };
  }

  const userPrompt = `On-chain event:
- Type: ${event.type}
- Coin: ${event.coin}
- Value: ${event.value}
- Timestamp: ${event.timestamp}
- Significance: ${event.significance}

Recent news headlines (${recentHeadlines.length} total):
${recentHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Which headlines relate to this on-chain event? Provide the narrative connection and confidence score.`;

  try {
    const raw = await aiComplete(
      CORRELATE_SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 600, temperature: 0.2, jsonMode: true },
      /* preferGroq */ true,
    );

    const parsed: Record<string, unknown> = JSON.parse(raw);
    return {
      correlation: typeof parsed.correlation === 'string' ? parsed.correlation : '',
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence ?? 0))),
      related_headlines: Array.isArray(parsed.related_headlines)
        ? (parsed.related_headlines as unknown[]).filter((h): h is string => typeof h === 'string')
        : [],
    };
  } catch {
    return { correlation: '', confidence: 0, related_headlines: [] };
  }
}

// ---------------------------------------------------------------------------
// detectAnomalies
// ---------------------------------------------------------------------------

/**
 * Filters an array of on-chain events to those that are statistically unusual,
 * defined as having a value more than 2 standard deviations from the mean of
 * all events with the same (type, coin) pair.
 *
 * Standard deviation is computed inline with no external dependencies.
 * Requires at least 3 events per (type, coin) group to compute meaningful stats;
 * groups with fewer values are excluded.
 */
export async function detectAnomalies(events: OnchainEvent[]): Promise<OnchainEvent[]> {
  if (events.length < 3) return [];

  // Group values by type::coin key
  const groups = new Map<string, number[]>();
  for (const e of events) {
    const key = `${e.type}::${e.coin}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(e.value);
    } else {
      groups.set(key, [e.value]);
    }
  }

  // Pre-compute mean + stddev per group
  const stats = new Map<string, { mean: number; stddev: number }>();
  for (const [key, values] of groups) {
    if (values.length < 3) continue;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const stddev = Math.sqrt(variance);
    stats.set(key, { mean, stddev });
  }

  // Return events whose z-score exceeds the 2-stddev threshold
  const anomalies: OnchainEvent[] = [];
  for (const e of events) {
    const key = `${e.type}::${e.coin}`;
    const s = stats.get(key);
    if (!s || s.stddev === 0) continue;
    const zscore = Math.abs(e.value - s.mean) / s.stddev;
    if (zscore > 2) {
      anomalies.push(e);
    }
  }

  return anomalies;
}
