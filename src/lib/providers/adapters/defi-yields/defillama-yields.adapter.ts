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
 * DefiLlama Yields Adapter — DeFi yield/APY data provider
 *
 * Uses DefiLlama's yield API (yields.llama.fi):
 * - 10,000+ yield pools tracked
 * - Free, no API key needed
 * - Covers lending, staking, LP, farming, etc.
 *
 * @module providers/adapters/defi-yields/defillama-yields
 */

import { getLlamaYieldPools, LLAMA_YIELDS_API } from '@/lib/apis/llama-bulk';
import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface DefiYield {
  /** Pool unique identifier */
  pool: string;
  /** Protocol name */
  project: string;
  /** Chain name */
  chain: string;
  /** Token symbol(s) */
  symbol: string;
  /** Current APY (annual percentage yield) */
  apy: number;
  /** Base APY (without reward tokens) */
  apyBase: number | null;
  /** Reward APY (from incentive tokens) */
  apyReward: number | null;
  /** Total Value Locked in the pool */
  tvlUsd: number;
  /** 1-day APY change */
  apyChange1d: number | null;
  /** 7-day APY change */
  apyChange7d: number | null;
  /** 30-day APY change */
  apyChange30d: number | null;
  /** Pool category (lending, dex, staking, etc.) */
  category: string;
  /** Whether the pool is stablecoin-only */
  stablecoin: boolean;
  /** Risk score if available */
  ilRisk: string | null;
  /** Reward tokens */
  rewardTokens: string[];
  /** Underlying tokens */
  underlyingTokens: string[];
  /** Last updated */
  lastUpdated: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const YIELDS_BASE = LLAMA_YIELDS_API;

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 200,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const defillamaYieldsAdapter: DataProvider<DefiYield[]> = {
  name: 'defillama-yields',
  description: 'DefiLlama Yields — 10,000+ DeFi yield pools across all chains',
  priority: 1,
  weight: 0.6,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields'],

  async fetch(params: FetchParams): Promise<DefiYield[]> {
    const chain = params.chain;
    const limit = params.limit ?? 100;
    const category = params.category;

    // Copy: the cached array is shared and sorted in place below.
    let pools: DefiLlamaPool[] = [...(await getLlamaYieldPools<DefiLlamaPool>())];

    // Filter by chain
    if (chain) {
      pools = pools.filter(p => p.chain?.toLowerCase() === chain.toLowerCase());
    }

    // Filter by category
    if (category) {
      pools = pools.filter(p =>
        p.project?.toLowerCase().includes(category.toLowerCase()),
      );
    }

    // Filter by minimum TVL
    const minTvl = (params.extra?.minTvl as number) ?? 100_000;
    pools = pools.filter(p => (p.tvlUsd ?? 0) >= minTvl);

    // Sort by APY descending
    pools.sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));

    return pools.slice(0, limit).map(normalizePool);
  },

  async healthCheck(): Promise<boolean> {
    try {
      // /median is ~140 KB; /pools is ~11 MB.
      const res = await fetch(`${YIELDS_BASE}/median`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: DefiYield[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.apy === 'number' && typeof item.tvlUsd === 'number',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface DefiLlamaPool {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  tvlUsd: number;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string | null;
  rewardTokens: string[] | null;
  underlyingTokens: string[] | null;
}

function normalizePool(raw: DefiLlamaPool): DefiYield {
  return {
    pool: raw.pool,
    project: raw.project,
    chain: raw.chain,
    symbol: raw.symbol,
    apy: raw.apy ?? 0,
    apyBase: raw.apyBase ?? null,
    apyReward: raw.apyReward ?? null,
    tvlUsd: raw.tvlUsd ?? 0,
    apyChange1d: raw.apyPct1D ?? null,
    apyChange7d: raw.apyPct7D ?? null,
    apyChange30d: raw.apyPct30D ?? null,
    category: raw.project,
    stablecoin: raw.stablecoin ?? false,
    ilRisk: raw.ilRisk ?? null,
    rewardTokens: raw.rewardTokens ?? [],
    underlyingTokens: raw.underlyingTokens ?? [],
    lastUpdated: new Date().toISOString(),
  };
}
