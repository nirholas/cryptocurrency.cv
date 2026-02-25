/**
 * Derivatives Types — Shared types for derivatives data adapters
 *
 * Covers: open interest, liquidations, funding rates (aggregated)
 *
 * @module providers/adapters/derivatives/types
 */

/** Aggregated open interest for a symbol */
export interface OpenInterest {
  /** Trading symbol (e.g., 'BTC', 'ETH') */
  symbol: string;
  /** Total open interest in USD */
  openInterestUsd: number;
  /** Open interest in coin terms */
  openInterestCoin: number;
  /** 24h change percentage */
  change24h: number;
  /** Breakdown by exchange */
  exchanges: ExchangeOI[];
  /** Data timestamp */
  timestamp: string;
}

/** Per-exchange open interest */
export interface ExchangeOI {
  exchange: string;
  openInterestUsd: number;
  openInterestCoin: number;
}

/** Liquidation event */
export interface Liquidation {
  /** Trading symbol */
  symbol: string;
  /** Side: long or short */
  side: 'long' | 'short';
  /** Liquidation size in USD */
  sizeUsd: number;
  /** Liquidation price */
  price: number;
  /** Exchange where liquidation occurred */
  exchange: string;
  /** Event timestamp */
  timestamp: string;
}

/** Aggregated liquidation summary */
export interface LiquidationSummary {
  /** Trading symbol */
  symbol: string;
  /** Total long liquidations (24h) in USD */
  longLiquidationsUsd24h: number;
  /** Total short liquidations (24h) in USD */
  shortLiquidationsUsd24h: number;
  /** Count of liquidations */
  count24h: number;
  /** Largest single liquidation */
  largestSingleUsd: number;
  /** Data timestamp */
  timestamp: string;
}
