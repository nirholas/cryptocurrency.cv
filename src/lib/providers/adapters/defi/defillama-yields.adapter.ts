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
 * DefiLlama Yields Adapter — DeFi yield/APY data across protocols and chains
 *
 * DefiLlama Yields tracks 10,000+ yield pools:
 * - Lending, staking, LP, farming yields
 * - Risk classification (IL risk, exposure type)
 * - Predicted direction (up/down/stable)
 * - Completely free, no API key required
 *
 * @module providers/adapters/defi/defillama-yields
 */

import { getLlamaYieldPools, LLAMA_YIELDS_API } from '@/lib/apis/llama-bulk';
import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { YieldPool } from './types';

const BASE = LLAMA_YIELDS_API;

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

export const defillamaYieldsAdapter: DataProvider<YieldPool[]> = {
  name: 'defillama-yields',
  description: 'DefiLlama Yields — APY/yield data for 10,000+ DeFi pools',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['yields', 'apy'],

  async fetch(params: FetchParams): Promise<YieldPool[]> {
    // Copy: the cached array is shared and sorted in place below.
    let pools: LlamaPool[] = [...(await getLlamaYieldPools<LlamaPool>())];

    // Filter by chain
    if (params.chain) {
      const chain = params.chain.toLowerCase();
      pools = pools.filter(p => p.chain?.toLowerCase() === chain);
    }

    // Filter by project
    if (params.extra?.project) {
      const project = String(params.extra.project).toLowerCase();
      pools = pools.filter(p => p.project?.toLowerCase() === project);
    }

    // Filter by stablecoin only
    if (params.extra?.stablecoin) {
      pools = pools.filter(p => p.stablecoin === true);
    }

    // Filter minimum TVL (default 100k for quality)
    const minTvl = (params.extra?.minTvl as number) ?? 100_000;
    pools = pools.filter(p => (p.tvlUsd ?? 0) >= minTvl);

    // Sort by APY descending
    pools.sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));

    const limit = params.limit ?? 100;
    pools = pools.slice(0, limit);

    return pools.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      // /median is ~140 KB; /pools is ~11 MB.
      const res = await fetch(`${BASE}/median`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: YieldPool[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(item =>
      typeof item.totalApy === 'number' &&
      typeof item.tvl === 'number',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface LlamaPool {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictedClass: string | null;
  url: string;
}

function normalize(raw: LlamaPool): YieldPool {
  return {
    poolId: raw.pool,
    project: raw.project,
    chain: raw.chain,
    symbol: raw.symbol,
    apyBase: raw.apyBase ?? 0,
    apyReward: raw.apyReward ?? 0,
    totalApy: raw.apy ?? 0,
    tvl: raw.tvlUsd ?? 0,
    stablecoin: raw.stablecoin ?? false,
    exposure: raw.exposure ?? 'single',
    ilRisk: raw.ilRisk ?? 'no',
    predictedClass: raw.predictedClass ?? null,
    url: raw.url ?? '',
  };
}
