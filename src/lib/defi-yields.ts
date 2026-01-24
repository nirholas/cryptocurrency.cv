/**
 * DeFi Yields Integration (Llama.fi)
 * Free DeFi yields data with no API key required
 *
 * Base URL: https://yields.llama.fi
 * Rate Limit: Very generous
 *
 * @module defi-yields
 */

import { EXTERNAL_APIS, CACHE_TTL, LlamaYieldPool } from './external-apis';
import { cache } from './cache';

const BASE_URL = EXTERNAL_APIS.LLAMA_YIELDS;

// =============================================================================
// Types
// =============================================================================

export interface YieldPool extends LlamaYieldPool {
  // Extended from LlamaYieldPool
}

export interface MedianYield {
  chain: string;
  medianAPY: number;
  uniquePools: number;
  timestamp: string;
}

export interface PoolChart {
  timestamp: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  il7d: number | null;
  apyBase7d: number | null;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get all yield pools
 */
export async function getAllPools(): Promise<YieldPool[]> {
  const cacheKey = 'llamayields:pools';
  const cached = cache.get<YieldPool[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/pools`);

  if (!response.ok) {
    throw new Error(`Llama Yields API error: ${response.status}`);
  }

  const result = await response.json();
  const data: YieldPool[] = result.data;
  cache.set(cacheKey, data, CACHE_TTL.yields);

  return data;
}

/**
 * Get pool chart data
 */
export async function getPoolChart(poolId: string): Promise<PoolChart[]> {
  const cacheKey = `llamayields:chart:${poolId}`;
  const cached = cache.get<PoolChart[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/chart/${poolId}`);

  if (!response.ok) {
    throw new Error(`Llama Yields API error: ${response.status}`);
  }

  const result = await response.json();
  const data: PoolChart[] = result.data;
  cache.set(cacheKey, data, CACHE_TTL.yields);

  return data;
}

/**
 * Get median yields by chain
 */
export async function getMedianYields(): Promise<MedianYield[]> {
  const cacheKey = 'llamayields:median';
  const cached = cache.get<MedianYield[]>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${BASE_URL}/median`);

  if (!response.ok) {
    throw new Error(`Llama Yields API error: ${response.status}`);
  }

  const data: MedianYield[] = await response.json();
  cache.set(cacheKey, data, CACHE_TTL.yields);

  return data;
}

// =============================================================================
// Aggregation Functions
// =============================================================================

/**
 * Get top yield pools by APY
 */
export async function getTopYields(options?: {
  chain?: string;
  project?: string;
  stablecoin?: boolean;
  minTvl?: number;
  limit?: number;
}): Promise<YieldPool[]> {
  const pools = await getAllPools();

  let filtered = pools.filter(
    (p) =>
      p.apy > 0 &&
      p.apy < 10000 && // Filter out unrealistic APYs
      !p.outlier
  );

  if (options?.chain) {
    filtered = filtered.filter((p) => p.chain.toLowerCase() === options.chain!.toLowerCase());
  }

  if (options?.project) {
    filtered = filtered.filter((p) => p.project.toLowerCase() === options.project!.toLowerCase());
  }

  if (options?.stablecoin !== undefined) {
    filtered = filtered.filter((p) => p.stablecoin === options.stablecoin);
  }

  if (options?.minTvl) {
    filtered = filtered.filter((p) => p.tvlUsd >= options.minTvl!);
  }

  return filtered.sort((a, b) => b.apy - a.apy).slice(0, options?.limit || 50);
}

/**
 * Get pools by chain
 */
export async function getPoolsByChain(chain: string): Promise<YieldPool[]> {
  const pools = await getAllPools();
  return pools.filter((p) => p.chain.toLowerCase() === chain.toLowerCase());
}

/**
 * Get pools by project
 */
export async function getPoolsByProject(project: string): Promise<YieldPool[]> {
  const pools = await getAllPools();
  return pools.filter((p) => p.project.toLowerCase() === project.toLowerCase());
}

/**
 * Get stablecoin yields
 */
export async function getStablecoinYields(minTvl = 1000000): Promise<YieldPool[]> {
  const pools = await getAllPools();
  return pools
    .filter(
      (p) =>
        p.stablecoin &&
        p.tvlUsd >= minTvl &&
        p.apy > 0 &&
        p.apy < 100 && // Realistic stablecoin APY
        !p.outlier
    )
    .sort((a, b) => b.apy - a.apy);
}

/**
 * Get yield stats by chain
 */
export async function getYieldStatsByChain(): Promise<
  Record<
    string,
    {
      totalTvl: number;
      poolCount: number;
      avgApy: number;
      topPool: YieldPool | null;
    }
  >
> {
  const pools = await getAllPools();
  const validPools = pools.filter((p) => p.apy > 0 && p.apy < 10000 && !p.outlier);

  const stats: Record<
    string,
    {
      totalTvl: number;
      poolCount: number;
      totalApy: number;
      topPool: YieldPool | null;
    }
  > = {};

  for (const pool of validPools) {
    if (!stats[pool.chain]) {
      stats[pool.chain] = { totalTvl: 0, poolCount: 0, totalApy: 0, topPool: null };
    }

    stats[pool.chain].totalTvl += pool.tvlUsd;
    stats[pool.chain].poolCount += 1;
    stats[pool.chain].totalApy += pool.apy;

    if (!stats[pool.chain].topPool || pool.apy > stats[pool.chain].topPool!.apy) {
      stats[pool.chain].topPool = pool;
    }
  }

  return Object.fromEntries(
    Object.entries(stats).map(([chain, s]) => [
      chain,
      {
        totalTvl: s.totalTvl,
        poolCount: s.poolCount,
        avgApy: s.totalApy / s.poolCount,
        topPool: s.topPool,
      },
    ])
  );
}

/**
 * Get unique chains
 */
export async function getChains(): Promise<string[]> {
  const pools = await getAllPools();
  return [...new Set(pools.map((p) => p.chain))].sort();
}

/**
 * Get unique projects
 */
export async function getProjects(): Promise<string[]> {
  const pools = await getAllPools();
  return [...new Set(pools.map((p) => p.project))].sort();
}

/**
 * Search pools
 */
export async function searchPools(query: string): Promise<YieldPool[]> {
  const pools = await getAllPools();
  const q = query.toLowerCase();

  return pools.filter(
    (p) =>
      p.symbol.toLowerCase().includes(q) ||
      p.project.toLowerCase().includes(q) ||
      p.chain.toLowerCase().includes(q)
  );
}
