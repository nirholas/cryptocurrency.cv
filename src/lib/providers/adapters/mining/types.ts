/**
 * Mining Types
 *
 * @module providers/adapters/mining/types
 */

export interface MiningStats {
  /** Network (bitcoin, ethereum-pow, etc.) */
  network: string;
  /** Hash rate (TH/s for BTC) */
  hashRate: number;
  /** Hash rate unit */
  hashRateUnit: string;
  /** Mining difficulty */
  difficulty: number;
  /** Estimated next difficulty adjustment % */
  nextDifficultyAdjustment: number;
  /** Blocks until next adjustment */
  blocksUntilAdjustment: number;
  /** Average block time (seconds) */
  blockTime: number;
  /** Block reward (BTC) */
  blockReward: number;
  /** Network revenue (24h USD) */
  dailyRevenueUsd: number;
  /** Transaction fees (24h BTC) */
  dailyFeesBtc: number;
  /** Hash price (USD/TH/day) */
  hashPrice: number;
  source: string;
  timestamp: string;
}

export interface MiningPool {
  name: string;
  hashRate: number;
  hashRateShare: number;
  blocksFound24h: number;
  url: string;
  source: string;
  timestamp: string;
}
