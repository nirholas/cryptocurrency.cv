/**
 * CoinStats Fear & Greed Adapter — Alternative sentiment source
 *
 * CoinStats provides their own Fear & Greed calculation:
 * - No API key required for basic endpoints
 * - Different methodology from Alternative.me
 * - Free tier available
 * - Docs: https://openapi.coinstats.app/
 *
 * @module providers/adapters/fear-greed/coinstats
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { FearGreedIndex } from './alternative-me.adapter';

// =============================================================================
// CONSTANTS
// =============================================================================

const COINSTATS_BASE = 'https://openapiv1.coinstats.app';
const COINSTATS_API_KEY = process.env.COINSTATS_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const coinstatsFearGreedAdapter: DataProvider<FearGreedIndex> = {
  name: 'coinstats-fear-greed',
  description: 'CoinStats — alternative Fear & Greed index with different methodology',
  priority: 2,
  weight: 0.4,
  rateLimit: RATE_LIMIT,
  capabilities: ['fear-greed'],

  async fetch(_params: FetchParams): Promise<FearGreedIndex> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (COINSTATS_API_KEY) {
      headers['X-API-KEY'] = COINSTATS_API_KEY;
    }

    const response = await fetch(`${COINSTATS_BASE}/markets`, { headers });

    if (!response.ok) {
      throw new Error(`CoinStats API error: ${response.status}`);
    }

    const data = await response.json();
    return normalize(data);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${COINSTATS_BASE}/markets`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: FearGreedIndex): boolean {
    return typeof data.value === 'number' && data.value >= 0 && data.value <= 100;
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

function classify(value: number): FearGreedIndex['classification'] {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

function normalize(raw: { fearGreedIndex?: number; btcDominance?: number }): FearGreedIndex {
  const value = raw.fearGreedIndex ?? 50;
  return {
    value,
    classification: classify(value),
    timestamp: new Date().toISOString(),
    previousClose: null,
    weekAgo: null,
    monthAgo: null,
    source: 'coinstats',
    lastUpdated: new Date().toISOString(),
  };
}
