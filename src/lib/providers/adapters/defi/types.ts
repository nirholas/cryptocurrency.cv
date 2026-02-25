/**
 * DeFi Types — Shared types for all DeFi data adapters
 *
 * @module providers/adapters/defi/types
 */

/** Total Value Locked for a protocol */
export interface ProtocolTvl {
  /** Protocol identifier (e.g., 'aave', 'uniswap') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category (e.g., 'DEXes', 'Lending', 'Bridge') */
  category: string;
  /** Primary chain */
  chain: string;
  /** All chains this protocol operates on */
  chains: string[];
  /** Total TVL in USD */
  tvl: number;
  /** TVL change 1 day (percentage) */
  tvlChange1d: number;
  /** TVL change 7 days (percentage) */
  tvlChange7d: number;
  /** Protocol URL */
  url: string;
  /** Logo URL */
  logo: string;
  /** Timestamp */
  timestamp: string;
}

/** DeFi yield pool */
export interface YieldPool {
  /** Pool identifier */
  poolId: string;
  /** Protocol name */
  project: string;
  /** Chain name */
  chain: string;
  /** Pool symbol/name (e.g., 'USDC-ETH') */
  symbol: string;
  /** Base APY (from trading fees, etc.) */
  apyBase: number;
  /** Reward APY (from token emissions) */
  apyReward: number;
  /** Total APY */
  totalApy: number;
  /** TVL in USD */
  tvl: number;
  /** Is this a stablecoin pool? */
  stablecoin: boolean;
  /** Exposure type (e.g., 'single', 'multi') */
  exposure: string;
  /** IL risk — absent for single-sided */
  ilRisk: string;
  /** Predicted APY class (stable, up, down) */
  predictedClass: string | null;
  /** Pool URL */
  url: string;
}

/** Chain TVL aggregate */
export interface ChainTvl {
  /** Chain name */
  name: string;
  /** Total TVL in USD */
  tvl: number;
  /** Number of protocols */
  protocolCount: number;
  /** TVL change 1 day */
  tvlChange1d: number;
}
