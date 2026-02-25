/**
 * MEV (Maximal Extractable Value) Types
 *
 * @module providers/adapters/mev/types
 */

export interface MEVBundle {
  /** Block number */
  blockNumber: number;
  /** MEV extracted in ETH */
  mevRewardEth: number;
  /** MEV extracted in USD */
  mevRewardUsd: number;
  /** Builder that built the block */
  builder: string;
  /** Number of transactions in the bundle */
  txCount: number;
  /** Gas used */
  gasUsed: number;
  /** Block timestamp */
  timestamp: string;
  source: string;
}

export interface MEVStats {
  /** Time period */
  period: '24h' | '7d' | '30d';
  /** Total MEV extracted in ETH */
  totalMevEth: number;
  /** Total MEV extracted in USD */
  totalMevUsd: number;
  /** Number of MEV bundles */
  bundleCount: number;
  /** Top builders by MEV */
  topBuilders: Array<{ name: string; mevEth: number; share: number }>;
  /** Average MEV per block */
  avgMevPerBlock: number;
  source: string;
  timestamp: string;
}
