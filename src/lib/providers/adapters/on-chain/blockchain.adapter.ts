/**
 * Blockchain.info + Mempool.space Adapter — Bitcoin on-chain data
 *
 * Free, no API key required:
 * - Blockchain.info: hashrate, difficulty, block height
 * - Mempool.space: mempool stats, fee estimates
 *
 * @module providers/adapters/on-chain/blockchain
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OnChainMetric } from './types';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};

export const blockchainAdapter: DataProvider<OnChainMetric[]> = {
  name: 'blockchain-info',
  description: 'Blockchain.info + Mempool.space — Bitcoin network stats and mempool data',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['on-chain', 'mempool'],

  async fetch(_params: FetchParams): Promise<OnChainMetric[]> {
    const now = new Date().toISOString();

    // Fetch from both sources in parallel
    const [bcResponse, mempoolResponse] = await Promise.allSettled([
      fetch('https://api.blockchain.info/stats'),
      fetch('https://mempool.space/api/v1/fees/recommended'),
    ]);

    const metrics: OnChainMetric[] = [];

    // Blockchain.info stats
    if (bcResponse.status === 'fulfilled' && bcResponse.value.ok) {
      const bc = await bcResponse.value.json();

      metrics.push(
        {
          metricId: 'hash_rate',
          name: 'Bitcoin Hash Rate',
          asset: 'bitcoin',
          value: bc.hash_rate ?? 0,
          unit: 'TH/s',
          resolution: '24h',
          change: 0,
          source: 'blockchain.info',
          timestamp: now,
        },
        {
          metricId: 'difficulty',
          name: 'Bitcoin Mining Difficulty',
          asset: 'bitcoin',
          value: bc.difficulty ?? 0,
          unit: '',
          resolution: '24h',
          change: 0,
          source: 'blockchain.info',
          timestamp: now,
        },
        {
          metricId: 'block_height',
          name: 'Bitcoin Block Height',
          asset: 'bitcoin',
          value: bc.n_blocks_total ?? 0,
          unit: 'blocks',
          resolution: '24h',
          change: 0,
          source: 'blockchain.info',
          timestamp: now,
        },
        {
          metricId: 'transactions_24h',
          name: 'Bitcoin Transactions (24h)',
          asset: 'bitcoin',
          value: bc.n_tx ?? 0,
          unit: 'txs',
          resolution: '24h',
          change: 0,
          source: 'blockchain.info',
          timestamp: now,
        },
        {
          metricId: 'btc_mined_24h',
          name: 'BTC Mined (24h)',
          asset: 'bitcoin',
          value: (bc.n_btc_mined ?? 0) / 100_000_000, // satoshis to BTC
          unit: 'BTC',
          resolution: '24h',
          change: 0,
          source: 'blockchain.info',
          timestamp: now,
        },
      );
    }

    // Mempool.space fee estimates
    if (mempoolResponse.status === 'fulfilled' && mempoolResponse.value.ok) {
      const fees = await mempoolResponse.value.json();

      metrics.push(
        {
          metricId: 'mempool_fee_fastest',
          name: 'Bitcoin Fee (Fastest)',
          asset: 'bitcoin',
          value: fees.fastestFee ?? 0,
          unit: 'sat/vB',
          resolution: 'realtime',
          change: 0,
          source: 'mempool.space',
          timestamp: now,
        },
        {
          metricId: 'mempool_fee_halfhour',
          name: 'Bitcoin Fee (30 min)',
          asset: 'bitcoin',
          value: fees.halfHourFee ?? 0,
          unit: 'sat/vB',
          resolution: 'realtime',
          change: 0,
          source: 'mempool.space',
          timestamp: now,
        },
        {
          metricId: 'mempool_fee_economy',
          name: 'Bitcoin Fee (Economy)',
          asset: 'bitcoin',
          value: fees.economyFee ?? 0,
          unit: 'sat/vB',
          resolution: 'realtime',
          change: 0,
          source: 'mempool.space',
          timestamp: now,
        },
      );
    }

    return metrics;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://api.blockchain.info/stats', {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OnChainMetric[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(m => typeof m.value === 'number' && typeof m.metricId === 'string');
  },
};
