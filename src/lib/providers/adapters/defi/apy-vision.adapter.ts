/**
 * APY.vision Adapter — DeFi yield analytics & impermanent loss tracking
 *
 * APY.vision provides detailed LP position analytics, APY tracking,
 * and impermanent loss data across multiple AMMs.
 *
 * @see https://apy.vision/
 * @module providers/adapters/defi/apy-vision
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { YieldPool } from './types';

const BASE = 'https://api.apy.vision/api/v1';
const APY_VISION_KEY = process.env.APY_VISION_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const apyVisionAdapter: DataProvider<YieldPool[]> = {
  name: 'apy-vision-yields',
  description: 'APY.vision — DeFi yield analytics & impermanent loss tracking',
  priority: 4,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['defi-yields'],

  async fetch(params: FetchParams): Promise<YieldPool[]> {
    if (!APY_VISION_KEY) throw new Error('APY_VISION_API_KEY not configured');

    const headers: Record<string, string> = {
      'APY-VISION-TOKEN': APY_VISION_KEY,
      Accept: 'application/json',
    };

    const res = await fetch(`${BASE}/pool_stats/top_pools?chain=ethereum&limit=${params.limit ?? 50}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`APY.vision API error: ${res.status}`);

    const json = await res.json();
    const pools: ApyPool[] = json?.data ?? json ?? [];
    const now = new Date().toISOString();

    const results: YieldPool[] = pools.map(p => ({
      poolId: p.pool_id ?? p.address ?? '',
      project: p.protocol ?? p.dex ?? '',
      chain: p.chain ?? 'Ethereum',
      symbol: p.symbol ?? p.tokens?.join('-') ?? '',
      apyBase: p.fee_apy ?? p.base_apy ?? 0,
      apyReward: p.reward_apy ?? 0,
      totalApy: (p.fee_apy ?? p.base_apy ?? 0) + (p.reward_apy ?? 0),
      tvl: p.tvl ?? p.liquidity_usd ?? 0,
      stablecoin: p.is_stable ?? false,
      exposure: p.pool_type ?? 'multi',
      ilRisk: p.il_7d != null ? (Math.abs(p.il_7d) > 5 ? 'high' : Math.abs(p.il_7d) > 1 ? 'medium' : 'low') : 'unknown',
      predictedClass: null,
      url: p.url ?? '',
    }));

    if (results.length === 0) throw new Error('No APY.vision data');
    return results;
  },

  async healthCheck(): Promise<boolean> {
    if (!APY_VISION_KEY) return false;
    try {
      const res = await fetch(`${BASE}/pool_stats/top_pools?chain=ethereum&limit=1`, {
        headers: { 'APY-VISION-TOKEN': APY_VISION_KEY },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch { return false; }
  },

  validate(data: YieldPool[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// Internal
interface ApyPool {
  pool_id?: string;
  address?: string;
  protocol?: string;
  dex?: string;
  chain?: string;
  symbol?: string;
  tokens?: string[];
  fee_apy?: number;
  base_apy?: number;
  reward_apy?: number;
  tvl?: number;
  liquidity_usd?: number;
  is_stable?: boolean;
  pool_type?: string;
  il_7d?: number;
  url?: string;
}
