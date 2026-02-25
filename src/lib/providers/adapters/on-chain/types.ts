/**
 * On-Chain Types — Shared types for on-chain data adapters
 *
 * @module providers/adapters/on-chain/types
 */

/** On-chain metric data point */
export interface OnChainMetric {
  /** Metric identifier (e.g., 'active_addresses', 'hash_rate') */
  metricId: string;
  /** Human-readable metric name */
  name: string;
  /** Chain/asset (e.g., 'bitcoin', 'ethereum') */
  asset: string;
  /** Current value */
  value: number;
  /** Unit of measurement */
  unit: string;
  /** Time resolution (e.g., '24h', '1h') */
  resolution: string;
  /** Change over last period */
  change: number;
  /** Data source */
  source: string;
  /** Data timestamp */
  timestamp: string;
}

/** Whale transaction alert */
export interface WhaleAlert {
  /** Transaction hash */
  txHash: string;
  /** Chain */
  chain: string;
  /** Token symbol */
  symbol: string;
  /** USD value of transfer */
  amountUsd: number;
  /** Token amount */
  amount: number;
  /** From address ('' = mint, exchange name if known) */
  from: string;
  /** To address ('' = burn, exchange name if known) */
  to: string;
  /** Transfer type */
  type: 'transfer' | 'mint' | 'burn' | 'exchange-withdraw' | 'exchange-deposit';
  /** Event timestamp */
  timestamp: string;
}

/** Blockchain network stats */
export interface NetworkStats {
  /** Chain name */
  chain: string;
  /** Total transactions (24h) */
  transactions24h: number;
  /** Active addresses (24h) */
  activeAddresses24h: number;
  /** Average fee in native token */
  avgFeeNative: number;
  /** Average fee in USD */
  avgFeeUsd: number;
  /** Hash rate (PoW chains) */
  hashRate?: number;
  /** Staking rate (PoS chains) */
  stakingRate?: number;
  /** Block time (seconds) */
  blockTime: number;
  /** TPS (transactions per second) */
  tps: number;
  /** Data timestamp */
  timestamp: string;
}
