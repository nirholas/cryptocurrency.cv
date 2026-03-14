/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Derivatives Provider Chains — Centralized chain exports for derivatives data
 *
 * Re-exports pre-configured chains from the adapter layer and provides
 * convenience aliases for use in API routes and background jobs.
 *
 * Chains:
 * - `fundingRateChain` — Funding rates from Binance, Bybit, OKX, dYdX, Hyperliquid, CoinGlass
 * - `derivativesChain` — Open interest from Hyperliquid, CoinGlass, Bybit, OKX, dYdX
 * - `liquidationsChain` — Liquidation data from Binance + Hyperliquid
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
  derivativesFallbackChain,
  derivativesConsensusChain,
  createDerivativesChain,
  liquidationsChain,
  createLiquidationsChain,
} from '../adapters/derivatives';

export type { FundingRate, FundingRateHistory } from '../adapters/funding-rate';
export type {
  OpenInterest,
  LiquidationSummary,
  Liquidation,
  ExchangeOI,
} from '../adapters/derivatives';
