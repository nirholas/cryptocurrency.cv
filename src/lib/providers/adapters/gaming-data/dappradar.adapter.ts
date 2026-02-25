/**
 * DappRadar Adapter — Primary blockchain gaming data provider
 *
 * DappRadar is the leading dApp analytics platform:
 * - Tracks 15,000+ dApps across 50+ chains
 * - Comprehensive gaming metrics (DAU, volume, transactions)
 * - Requires API key
 * - Rate limit: 30 requests/minute
 *
 * @module providers/adapters/gaming-data/dappradar
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { GamingOverview, GameData } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const DAPPRADAR_BASE = 'https://api.dappradar.com/4tsxo4vuhotaojtl';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

/**
 * DappRadar gaming data provider.
 *
 * Priority: 1 (primary — most comprehensive dApp/gaming analytics)
 * Weight: 0.6 (highest — authoritative gaming metrics)
 */
export const dappradarAdapter: DataProvider<GamingOverview> = {
  name: 'dappradar',
  description: 'DappRadar API — leading dApp analytics with comprehensive gaming metrics (15,000+ dApps)',
  priority: 1,
  weight: 0.6,
  rateLimit: RATE_LIMIT,
  capabilities: ['gaming-data'],

  async fetch(params: FetchParams): Promise<GamingOverview> {
    const apiKey = process.env.DAPPRADAR_API_KEY;
    if (!apiKey) {
      throw new Error('DAPPRADAR_API_KEY environment variable is required');
    }

    const limit = params.limit ?? 25;
    const chain = params.chain ?? 'all';

    const response = await fetch(
      `${DAPPRADAR_BASE}/dapps?chain=${chain}&category=games&sort=dau&order=desc&resultsPerPage=${limit}`,
      {
        headers: {
          'X-BLOBR-KEY': apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`DappRadar API error: ${response.status} ${response.statusText}`);
    }

    const data: DappRadarResponse = await response.json();
    const games = (data.results ?? []).map(normalizeGame);

    const totalDau = games.reduce((sum, g) => sum + g.dau, 0);
    const totalVolume24h = games.reduce((sum, g) => sum + g.volume24h, 0);

    // Aggregate volume by chain
    const byChain: Record<string, number> = {};
    for (const game of games) {
      byChain[game.chain] = (byChain[game.chain] ?? 0) + game.volume24h;
    }

    return {
      totalDau,
      totalVolume24h,
      topGames: games,
      byChain,
      timestamp: new Date().toISOString(),
    };
  },

  async healthCheck(): Promise<boolean> {
    const apiKey = process.env.DAPPRADAR_API_KEY;
    if (!apiKey) return false;

    try {
      const response = await fetch(
        `${DAPPRADAR_BASE}/dapps?chain=all&category=games&resultsPerPage=1`,
        {
          headers: { 'X-BLOBR-KEY': apiKey },
          signal: AbortSignal.timeout(5_000),
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: GamingOverview): boolean {
    if (!data || !Array.isArray(data.topGames)) return false;
    if (data.topGames.length === 0) return false;
    return data.topGames.every(
      (g) => typeof g.name === 'string' && g.name.length > 0,
    );
  },
};

// =============================================================================
// INTERNAL — Raw types and normalization
// =============================================================================

interface DappRadarDapp {
  dappId?: number;
  name?: string;
  slug?: string;
  logo?: string;
  link?: string;
  website?: string;
  chains?: string[];
  categories?: string[];
  metrics?: {
    dau?: number;
    transactions?: number;
    volume?: number;
    balance?: number;
  };
}

interface DappRadarResponse {
  results: DappRadarDapp[];
  page?: number;
  pageCount?: number;
  resultsPerPage?: number;
  totalResults?: number;
}

function normalizeGame(raw: DappRadarDapp): GameData {
  const metrics = raw.metrics ?? {};
  const chain = raw.chains?.[0] ?? 'unknown';
  const category = raw.categories?.[0] ?? 'game';

  return {
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    chain,
    dau: metrics.dau ?? 0,
    transactions24h: metrics.transactions ?? 0,
    volume24h: metrics.volume ?? 0,
    category,
    balance: metrics.balance ?? 0,
    timestamp: new Date().toISOString(),
  };
}
