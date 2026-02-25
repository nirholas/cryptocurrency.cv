/**
 * Glassnode Adapter — Professional On-chain Analytics
 *
 * Glassnode is the gold standard for on-chain metrics:
 * - Active addresses, new addresses
 * - Exchange flows (inflow/outflow)
 * - NUPL, SOPR, MVRV ratios
 * - Miner revenue, hash rate
 * - Long/short term holder behavior
 *
 * Requires GLASSNODE_API_KEY env var.
 * Free tier: 10 API calls/minute, limited metrics
 *
 * API: https://docs.glassnode.com/
 * env: GLASSNODE_API_KEY
 *
 * @module providers/adapters/on-chain/glassnode
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OnChainMetric } from './types';

const GLASSNODE_BASE = 'https://api.glassnode.com/v1/metrics';
const GLASSNODE_API_KEY = process.env.GLASSNODE_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: GLASSNODE_API_KEY ? 10 : 0,
  windowMs: 60_000,
};

// Metrics to fetch (free tier compatible)
const METRICS = [
  { path: 'addresses/active_count', name: 'active_addresses', unit: 'addresses' },
  { path: 'addresses/new_non_zero_count', name: 'new_addresses', unit: 'addresses' },
  { path: 'transactions/count', name: 'transaction_count', unit: 'transactions' },
  { path: 'transactions/transfers_volume_sum', name: 'transfer_volume', unit: 'BTC' },
  { path: 'mining/hash_rate_mean', name: 'hash_rate', unit: 'TH/s' },
  { path: 'mining/revenue_sum', name: 'miner_revenue', unit: 'USD' },
  { path: 'market/mvrv', name: 'mvrv_ratio', unit: 'ratio' },
  { path: 'indicators/sopr', name: 'sopr', unit: 'ratio' },
  { path: 'supply/current', name: 'circulating_supply', unit: 'BTC' },
  { path: 'distribution/exchange_net_position_change', name: 'exchange_net_flow', unit: 'BTC' },
];

export const glassnodeAdapter: DataProvider<OnChainMetric[]> = {
  name: 'glassnode',
  description: 'Glassnode — Professional on-chain analytics: MVRV, SOPR, exchange flows, miner metrics',
  priority: 1,
  weight: 0.55,
  rateLimit: RATE_LIMIT,
  capabilities: ['on-chain'],

  async fetch(params: FetchParams): Promise<OnChainMetric[]> {
    if (!GLASSNODE_API_KEY) {
      throw new Error('GLASSNODE_API_KEY not configured');
    }

    const asset = params.symbols?.[0]?.toLowerCase() || 'btc';
    const now = new Date();
    const since = Math.floor((now.getTime() - 24 * 60 * 60 * 1000) / 1000);

    const results = await Promise.allSettled(
      METRICS.map(async (metric): Promise<OnChainMetric> => {
        const url = `${GLASSNODE_BASE}/${metric.path}?a=${asset}&s=${since}&api_key=${GLASSNODE_API_KEY}&f=JSON`;

        const res = await fetch(url, {
          headers: { 'User-Agent': 'free-crypto-news/2.0' },
        });

        if (!res.ok) throw new Error(`Glassnode ${metric.name}: ${res.status}`);

        const data: Array<{ t: number; v: number }> = await res.json();
        const latest = data[data.length - 1];

        return {
          metricId: metric.name,
          name: metric.name.replace(/_/g, ' '),
          value: latest?.v ?? 0,
          asset: asset.toUpperCase(),
          unit: metric.unit,
          resolution: '24h',
          change: 0,
          source: 'glassnode',
          timestamp: latest ? new Date(latest.t * 1000).toISOString() : now.toISOString(),
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<OnChainMetric> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    if (!GLASSNODE_API_KEY) return false;
    try {
      const res = await fetch(
        `${GLASSNODE_BASE}/addresses/active_count?a=btc&s=${Math.floor(Date.now() / 1000) - 86400}&api_key=${GLASSNODE_API_KEY}&f=JSON`,
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  normalize(data: OnChainMetric[]): OnChainMetric[] {
    return data;
  },
};

export default glassnodeAdapter;
