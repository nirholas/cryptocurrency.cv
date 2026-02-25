/**
 * Alternative.me Fear & Greed Adapter — Crypto sentiment index
 *
 * The original Crypto Fear & Greed Index:
 * - No API key required
 * - Updated daily
 * - Historical data available
 * - Free, no rate limit published
 * - Docs: https://alternative.me/crypto/fear-and-greed-index/
 *
 * @module providers/adapters/fear-greed/alternative-me
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface FearGreedIndex {
  value: number;
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: string;
  previousClose: number | null;
  weekAgo: number | null;
  monthAgo: number | null;
  source: string;
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const API_BASE = 'https://api.alternative.me/fng';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const alternativeMeFearGreedAdapter: DataProvider<FearGreedIndex> = {
  name: 'alternative-me-fear-greed',
  description: 'Alternative.me — Crypto Fear & Greed Index (0–100 scale)',
  priority: 1,
  weight: 0.6,
  rateLimit: RATE_LIMIT,
  capabilities: ['fear-greed'],

  async fetch(params: FetchParams): Promise<FearGreedIndex> {
    // Fetch current + yesterday + week ago + month ago
    const limit = params.limit ?? 31;
    const url = `${API_BASE}/?limit=${limit}&format=json`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Alternative.me API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const entries: AlternativeMeEntry[] = data.data ?? [];

    if (entries.length === 0) {
      throw new Error('Alternative.me returned no data');
    }

    return normalize(entries);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/?limit=1&format=json`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: FearGreedIndex): boolean {
    return (
      typeof data.value === 'number' &&
      data.value >= 0 &&
      data.value <= 100 &&
      typeof data.classification === 'string'
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface AlternativeMeEntry {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

function normalize(entries: AlternativeMeEntry[]): FearGreedIndex {
  const current = entries[0];
  const yesterday = entries[1] ?? null;
  const weekAgo = entries[7] ?? null;
  const monthAgo = entries[30] ?? null;

  return {
    value: parseInt(current.value, 10),
    classification: current.value_classification as FearGreedIndex['classification'],
    timestamp: new Date(parseInt(current.timestamp, 10) * 1000).toISOString(),
    previousClose: yesterday ? parseInt(yesterday.value, 10) : null,
    weekAgo: weekAgo ? parseInt(weekAgo.value, 10) : null,
    monthAgo: monthAgo ? parseInt(monthAgo.value, 10) : null,
    source: 'alternative.me',
    lastUpdated: new Date().toISOString(),
  };
}
