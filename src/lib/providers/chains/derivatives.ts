/**
 * Derivatives Provider Chains — Centralized chain exports for derivatives data
 *
 * Re-exports pre-configured chains from the adapter layer and provides
 * convenience aliases for use in API routes and background jobs.
 *
 * Chains:
 * - `fundingRateChain` — Funding rates from Binance, Bybit, OKX, dYdX, Hyperliquid
 * - `derivativesChain` — Open interest from Hyperliquid + CoinGlass
 * - `liquidationsChain` — Liquidation data from Binance
 *
 * @module providers/chains/derivatives
 */

export {
  fundingRateChain,
  fundingRateFallbackChain,
  createFundingRateChain,
} from '../adapters/funding-rate';

export {
  derivativesChain,
  derivativesConsensusChain,
  createDerivativesChain,
  liquidationsChain,
  createLiquidationsChain,
} from '../adapters/derivatives';

export type { FundingRate, FundingRateHistory } from '../adapters/funding-rate';
export type { OpenInterest, LiquidationSummary, Liquidation, ExchangeOI } from '../adapters/derivatives';
