/**
 * Blockchain.com Mining Adapter
 *
 * Uses public Blockchain.com chart APIs for BTC mining metrics.
 * No API key required.
 *
 * @module providers/adapters/mining/blockchain-mining
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MiningStats } from './types';

const BASE = 'https://api.blockchain.info';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 30, windowMs: 60_000 };

export const blockchainMiningAdapter: DataProvider<MiningStats> = {
  name: 'blockchain-mining',
  description: 'Blockchain.com — BTC hash rate, difficulty, block reward',
  priority: 1,
  weight: 0.50,
  rateLimit: RATE_LIMIT,
  capabilities: ['mining'],

  async fetch(_params: FetchParams): Promise<MiningStats> {
    const [statsRes, hashRateRes, diffRes] = await Promise.all([
      fetch(`${BASE}/stats`),
      fetch(`${BASE}/charts/hash-rate?timespan=1days&format=json`),
      fetch(`${BASE}/charts/difficulty?timespan=1days&format=json`),
    ]);

    if (!statsRes.ok) throw new Error(`Blockchain.info stats: ${statsRes.status}`);

    const stats = await statsRes.json();
    const now = new Date().toISOString();

    // Hash rate from stats (in TH/s)
    const hashRateThS = stats.hash_rate ?? 0;

    // Difficulty
    const difficulty = stats.difficulty ?? 0;

    // Next retarget
    const nextRetarget = stats.nextretarget ?? 0;
    const currentHeight = stats.n_blocks_total ?? 0;
    const blocksUntil = nextRetarget > currentHeight ? nextRetarget - currentHeight : 0;

    // Block time
    const blockTime = stats.minutes_between_blocks ? stats.minutes_between_blocks * 60 : 600;

    // Miners revenue
    const dailyRevenue = stats.miners_revenue_usd ?? 0;

    return {
      network: 'bitcoin',
      hashRate: hashRateThS,
      hashRateUnit: 'TH/s',
      difficulty,
      nextDifficultyAdjustment: stats.estimated_difficulty_adjustment ?? 0,
      blocksUntilAdjustment: blocksUntil,
      blockTime,
      blockReward: 3.125, // Post-halving 2024
      dailyRevenueUsd: dailyRevenue,
      dailyFeesBtc: stats.total_fees_btc ? stats.total_fees_btc / 1e8 : 0,
      hashPrice: hashRateThS > 0 ? dailyRevenue / hashRateThS : 0,
      source: 'blockchain-mining',
      timestamp: now,
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/stats`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: MiningStats): boolean {
    return typeof data.hashRate === 'number' && data.hashRate > 0;
  },
};
