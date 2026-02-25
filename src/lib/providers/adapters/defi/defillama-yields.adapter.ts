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

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { YieldPool } from './types';

const BASE = 'https://yields.llama.fi';

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
    const response = await fetch(`${BASE}/pools`);

    if (!response.ok) {
      throw new Error(`DefiLlama Yields API error: ${response.status}`);
    }

    const json: { data: LlamaPool[] } = await response.json();
    let pools = json.data ?? [];

    // Filter by chain
    if (params.chain) {
      const chain = params.chain.toLowerCase();
      pools = pools.filter(p => p.chain?.toLowerCase() === chain);
    }

    // Filter by project
    if (params.project) {
      const project = params.project.toLowerCase();
      pools = pools.filter(p => p.project?.toLowerCase() === project);
    }

    // Filter by stablecoin only
    if (params.stablecoin) {
      pools = pools.filter(p => p.stablecoin === true);
    }

    // Filter minimum TVL (default 100k for quality)
    const minTvl = params.minTvl ?? 100_000;
    pools = pools.filter(p => (p.tvlUsd ?? 0) >= minTvl);

    // Sort by APY descending
    pools.sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));

    const limit = params.limit ?? 100;
    pools = pools.slice(0, limit);

    return pools.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/pools`, {
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
    timestamp: new Date().toISOString(),
  };
}
