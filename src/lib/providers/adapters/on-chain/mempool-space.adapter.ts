/**
 * Mempool.space Adapter — Bitcoin mempool, fees & blocks
 *
 * The gold standard for Bitcoin mempool data:
 * - No API key required
 * - Real-time mempool status, fee estimates, block data
 * - Free, open-source, self-hostable
 * - Docs: https://mempool.space/docs/api
 *
 * @module providers/adapters/on-chain/mempool-space
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OnChainMetric } from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

const MEMPOOL_BASE = 'https://mempool.space/api';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

// =============================================================================
// ADAPTER
// =============================================================================

export const mempoolSpaceAdapter: DataProvider<OnChainMetric[]> = {
  name: 'mempool-space',
  description: 'Mempool.space — Bitcoin mempool, fees, blocks (no key required)',
  priority: 1,
  weight: 0.6,
  rateLimit: RATE_LIMIT,
  capabilities: ['mempool', 'gas-fees', 'on-chain'],

  async fetch(_params: FetchParams): Promise<OnChainMetric[]> {
    const [mempoolRes, feesRes, blockRes] = await Promise.all([
      fetch(`${MEMPOOL_BASE}/mempool`),
      fetch(`${MEMPOOL_BASE}/v1/fees/recommended`),
      fetch(`${MEMPOOL_BASE}/blocks/tip/height`),
    ]);

    if (!mempoolRes.ok || !feesRes.ok || !blockRes.ok) {
      throw new Error('Mempool.space API error: one or more endpoints failed');
    }

    const mempool: MempoolStatus = await mempoolRes.json();
    const fees: RecommendedFees = await feesRes.json();
    const blockHeight = parseInt(await blockRes.text(), 10);

    return normalize(mempool, fees, blockHeight);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${MEMPOOL_BASE}/v1/fees/recommended`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  validate(data: OnChainMetric[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface MempoolStatus {
  count: number;
  vsize: number;
  total_fee: number;
}

interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

function normalize(
  mempool: MempoolStatus,
  fees: RecommendedFees,
  blockHeight: number,
): OnChainMetric[] {
  const ts = new Date().toISOString();

  return [
    {
      metricId: 'mempool_size',
      name: 'Mempool Size (txns)',
      asset: 'bitcoin',
      value: mempool.count,
      unit: 'transactions',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
    {
      metricId: 'mempool_vsize',
      name: 'Mempool Virtual Size',
      asset: 'bitcoin',
      value: mempool.vsize,
      unit: 'vBytes',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
    {
      metricId: 'fee_fastest',
      name: 'Fastest Fee',
      asset: 'bitcoin',
      value: fees.fastestFee,
      unit: 'sat/vB',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
    {
      metricId: 'fee_half_hour',
      name: 'Half Hour Fee',
      asset: 'bitcoin',
      value: fees.halfHourFee,
      unit: 'sat/vB',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
    {
      metricId: 'fee_hour',
      name: 'Hour Fee',
      asset: 'bitcoin',
      value: fees.hourFee,
      unit: 'sat/vB',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
    {
      metricId: 'fee_economy',
      name: 'Economy Fee',
      asset: 'bitcoin',
      value: fees.economyFee,
      unit: 'sat/vB',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
    {
      metricId: 'block_height',
      name: 'Block Height',
      asset: 'bitcoin',
      value: blockHeight,
      unit: 'block',
      resolution: 'realtime',
      change: 0,
      source: 'mempool.space',
      timestamp: ts,
    },
  ];
}
