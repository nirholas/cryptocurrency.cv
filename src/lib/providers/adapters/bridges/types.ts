/**
 * Bridge Types
 *
 * @module providers/adapters/bridges/types
 */

export interface BridgeVolume {
  /** Bridge name */
  name: string;
  /** Slug for URLs */
  slug: string;
  /** 24h volume in USD */
  volume24h: number;
  /** 7d volume in USD */
  volume7d: number;
  /** 30d volume in USD */
  volume30d: number;
  /** Current TVL (value locked in the bridge) */
  tvl: number;
  /** Chains supported */
  chains: string[];
  /** Number of unique depositors (24h) */
  depositors24h: number;
  source: string;
  timestamp: string;
}
