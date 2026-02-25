/**
 * BTC ETF Types
 *
 * @module providers/adapters/btc-etf/types
 */

export interface BTCETFFlow {
  /** ETF ticker symbol (e.g., IBIT, FBTC, GBTC) */
  ticker: string;
  /** ETF name */
  name: string;
  /** Issuer */
  issuer: string;
  /** Daily net flow in USD */
  dailyFlowUsd: number;
  /** 7-day cumulative flow */
  weeklyFlowUsd: number;
  /** Total AUM in USD */
  aumUsd: number;
  /** BTC holdings */
  btcHoldings: number;
  /** Market share % of total ETF AUM */
  marketShare: number;
  /** Fee in basis points */
  feeBps: number;
  source: string;
  timestamp: string;
}

export interface BTCETFAggregate {
  /** Total AUM across all ETFs */
  totalAumUsd: number;
  /** Total BTC held */
  totalBtcHoldings: number;
  /** Daily aggregate flow */
  dailyNetFlowUsd: number;
  /** Weekly aggregate flow */
  weeklyNetFlowUsd: number;
  /** Individual ETF data */
  etfs: BTCETFFlow[];
  source: string;
  timestamp: string;
}
