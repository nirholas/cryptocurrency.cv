/**
 * Stablecoin Flows Types — Shared types for stablecoin data
 *
 * @module providers/adapters/stablecoin-flows/types
 */

/** Stablecoin market data */
export interface StablecoinFlow {
  /** Stablecoin identifier */
  id: string;
  /** Name (e.g., 'Tether', 'USDC') */
  name: string;
  /** Symbol (e.g., 'USDT', 'USDC') */
  symbol: string;
  /** Peg type (e.g., 'peggedUSD', 'peggedEUR') */
  pegType: string;
  /** Total circulating supply in USD */
  circulatingUsd: number;
  /** 24h change in circulating supply */
  circulatingChange24h: number;
  /** 7d change in circulating supply */
  circulatingChange7d: number;
  /** Chain distribution */
  chainDistribution: { chain: string; amount: number }[];
  /** Price (should be ~1.00 for USD pegged) */
  price: number;
  /** Market cap rank among stablecoins */
  rank: number;
  /** Data timestamp */
  timestamp: string;
}

/** Aggregate stablecoin market stats */
export interface StablecoinMarketStats {
  /** Total stablecoin market cap */
  totalMarketCap: number;
  /** 24h change in total market cap */
  marketCapChange24h: number;
  /** Number of stablecoins tracked */
  count: number;
  /** Top stablecoins by market cap */
  top: StablecoinFlow[];
  /** Per-chain stablecoin TVL */
  chainBreakdown: { chain: string; tvl: number }[];
  /** Data timestamp */
  timestamp: string;
}
