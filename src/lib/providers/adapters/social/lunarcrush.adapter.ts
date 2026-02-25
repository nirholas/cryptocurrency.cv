/**
 * LunarCrush Adapter — Social intelligence for crypto
 *
 * LunarCrush provides:
 * - Galaxy Score (social health metric)
 * - AltRank (social activity-to-market-cap ratio)
 * - Social volume, dominance, sentiment
 * - Real-time social media monitoring
 *
 * Requires LUNARCRUSH_API_KEY env var.
 *
 * @module providers/adapters/social/lunarcrush
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { SocialMetric } from './types';

const BASE = 'https://lunarcrush.com/api4/public';
const LUNARCRUSH_API_KEY = process.env.LUNARCRUSH_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

export const lunarcrushAdapter: DataProvider<SocialMetric[]> = {
  name: 'lunarcrush',
  description: 'LunarCrush — Social intelligence: Galaxy Score, AltRank, sentiment for 4,000+ coins',
  priority: 1,
  weight: 0.60,
  rateLimit: RATE_LIMIT,
  capabilities: ['social-metrics'],

  async fetch(params: FetchParams): Promise<SocialMetric[]> {
    if (!LUNARCRUSH_API_KEY) {
      throw new Error('LunarCrush API key not configured (LUNARCRUSH_API_KEY)');
    }

    const limit = params.limit ?? 50;
    const response = await fetch(
      `${BASE}/coins/list/v2?sort=galaxy_score&limit=${limit}`,
      { headers: { Authorization: `Bearer ${LUNARCRUSH_API_KEY}` } },
    );

    if (response.status === 429) {
      throw new Error('LunarCrush rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`LunarCrush API error: ${response.status}`);
    }

    const json = await response.json();
    const assets: LCAsset[] = json?.data ?? [];
    const now = new Date().toISOString();

    let results = assets.map((a): SocialMetric => ({
      symbol: a.symbol ?? '',
      name: a.name ?? '',
      socialScore: a.social_score ?? 0,
      socialVolume: a.social_volume ?? 0,
      socialDominance: a.social_dominance ?? 0,
      sentiment: (a.sentiment ?? 50) / 100, // Normalize 0-100 to 0-1
      galaxyScore: a.galaxy_score ?? 0,
      altRank: a.alt_rank ?? 0,
      source: 'lunarcrush',
      timestamp: now,
    }));

    // Filter by symbols if specified
    if (params.symbols && params.symbols.length > 0) {
      const symbols = new Set(params.symbols.map(s => s.toUpperCase()));
      results = results.filter(r => symbols.has(r.symbol.toUpperCase()));
    }

    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!LUNARCRUSH_API_KEY) return false;
    try {
      const res = await fetch(`${BASE}/coins/list/v2?limit=1`, {
        headers: { Authorization: `Bearer ${LUNARCRUSH_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: SocialMetric[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(m =>
      typeof m.symbol === 'string' &&
      typeof m.socialScore === 'number',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface LCAsset {
  symbol: string;
  name: string;
  galaxy_score: number;
  alt_rank: number;
  social_score: number;
  social_volume: number;
  social_dominance: number;
  sentiment: number;
}
