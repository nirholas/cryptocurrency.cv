/**
 * L2 Data Types
 *
 * @module providers/adapters/l2-data/types
 */

export interface L2Stats {
  /** L2 chain name */
  name: string;
  /** Slug */
  slug: string;
  /** TVL in USD */
  tvl: number;
  /** TVL change 7d % */
  tvlChange7d: number;
  /** Daily TPS */
  tps: number;
  /** Type (optimistic rollup, zk rollup, validium, etc.) */
  type: string;
  /** Stage (0, 1, 2) per L2BEAT classification */
  stage: string;
  /** Number of transactions (24h) */
  dailyTxCount: number;
  /** Active addresses (24h) */
  dailyActiveAddresses: number;
  /** Batch posting cost (24h USD) */
  dailyCost: number;
  /** Canonical TVB (total value bridged) */
  canonicalTvl: number;
  /** External TVL */
  externalTvl: number;
  source: string;
  timestamp: string;
}
