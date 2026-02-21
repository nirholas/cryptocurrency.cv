/**
 * Whale Context Engine
 * Generates AI plain-language interpretation for large on-chain transactions.
 */

import { aiComplete, getAIConfigOrNull } from '@/lib/ai-provider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WhaleTxType =
  | 'transfer'
  | 'exchange_inflow'
  | 'exchange_outflow'
  | 'mint'
  | 'burn';

export interface WhaleTx {
  coin: string;
  amount: number;
  amountUsd: number;
  type: WhaleTxType;
  from?: string;
  to?: string;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  context: string;
  cached: boolean;
  expiresAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, CacheEntry>();

function cacheKey(tx: WhaleTx): string {
  // Round to nearest 10k USD to increase cache hits for near-identical amounts
  const roundedUsd = Math.round(tx.amountUsd / 10_000) * 10_000;
  return `${tx.coin.toUpperCase()}:${tx.type}:${roundedUsd}`;
}

// ---------------------------------------------------------------------------
// Amount tier helpers
// ---------------------------------------------------------------------------

type AmountTier = 'small' | 'medium' | 'large' | 'mega';

function getAmountTier(amountUsd: number): AmountTier {
  if (amountUsd >= 100_000_000) return 'mega';
  if (amountUsd >= 10_000_000) return 'large';
  if (amountUsd >= 1_000_000) return 'medium';
  return 'small';
}

const TIER_DESCRIPTORS: Record<AmountTier, string> = {
  small: 'minor',
  medium: 'significant',
  large: 'major',
  mega: 'extraordinary',
};

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

function formatAmountUsd(usd: number): string {
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(2)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(2)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(1)}K`;
  return `$${usd.toFixed(0)}`;
}

function fallbackContext(tx: WhaleTx): string {
  return `${tx.coin.toUpperCase()} ${tx.type.replace(/_/g, ' ')} of ${formatAmountUsd(tx.amountUsd)}.`;
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a concise crypto market analyst. Given a large on-chain transaction, write exactly 1-2 sentences of plain-language interpretation for a general crypto audience. Focus on what the transaction type typically signals (market sentiment, accumulation, distribution, liquidity, etc.). Be factual and avoid hype. Do not use bullet points or headers — plain prose only.`;

function buildUserPrompt(tx: WhaleTx): string {
  const tier = getAmountTier(tx.amountUsd);
  const tierDesc = TIER_DESCRIPTORS[tier];

  const fromPart = tx.from ? ` from ${tx.from}` : '';
  const toPart = tx.to ? ` to ${tx.to}` : '';

  return `Transaction details:
- Coin: ${tx.coin.toUpperCase()}
- Amount: ${tx.amount.toLocaleString()} ${tx.coin.toUpperCase()} (${formatAmountUsd(tx.amountUsd)})
- Type: ${tx.type.replace(/_/g, ' ')}
- Size tier: ${tierDesc} (${tier})${fromPart}${toPart}

Provide a 1-2 sentence market interpretation of what this ${tierDesc} ${tx.type.replace(/_/g, ' ')} typically signals.`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function getWhaleContext(tx: WhaleTx): Promise<{ context: string; cached: boolean }> {
  const key = cacheKey(tx);
  const now = Date.now();

  // Check cache
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return { context: hit.context, cached: true };
  }

  // Check AI availability
  if (!getAIConfigOrNull(true)) {
    const context = fallbackContext(tx);
    return { context, cached: false };
  }

  try {
    const context = await aiComplete(
      SYSTEM_PROMPT,
      buildUserPrompt(tx),
      { maxTokens: 120, temperature: 0.4, title: 'Whale Context Engine' },
      true // prefer Groq for speed
    );

    const trimmed = context.trim();

    cache.set(key, { context: trimmed, cached: false, expiresAt: now + CACHE_TTL_MS });

    return { context: trimmed, cached: false };
  } catch {
    // AI failed — return fallback, do not cache so next call can retry
    return { context: fallbackContext(tx), cached: false };
  }
}
