/**
 * Mempool.space Mining Adapter
 *
 * Mempool.space provides detailed mining pool data:
 * - Mining pool distribution
 * - Difficulty adjustment estimation
 * - Block template analysis
 *
 * @module providers/adapters/mining/mempool-mining
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MiningPool } from './types';

const BASE = 'https://mempool.space/api/v1';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 60, windowMs: 60_000 };

export const mempoolMiningAdapter: DataProvider<MiningPool[]> = {
  name: 'mempool-mining',
  description: 'Mempool.space — BTC mining pool distribution',
  priority: 2,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['mining'],

  async fetch(params: FetchParams): Promise<MiningPool[]> {
    const timespan = (params.extra?.timespan as string) ?? '1w';

    const res = await fetch(`${BASE}/mining/pools/${timespan}`);
    if (!res.ok) throw new Error(`Mempool.space mining: ${res.status}`);

    const json = await res.json();
    const pools: MempoolPool[] = json.pools ?? [];
    const now = new Date().toISOString();

    return pools.map((p): MiningPool => ({
      name: p.name ?? 'Unknown',
      hashRate: p.estimatedHashrate ?? 0,
      hashRateShare: p.share ?? 0,
      blocksFound24h: p.blockCount ?? 0,
      url: p.link ?? '',
      source: 'mempool-mining',
      timestamp: now,
    }));
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/mining/pools/1w`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: MiningPool[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface MempoolPool {
  poolId?: number;
  name?: string;
  link?: string;
  blockCount?: number;
  rank?: number;
  emptyBlocks?: number;
  slug?: string;
  estimatedHashrate?: number;
  share?: number;
}
