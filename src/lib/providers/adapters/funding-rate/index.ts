/**
 * Funding Rate Chain — Pre-wired provider chain for funding rate data
 *
 * Aggregates funding rates from the top 3 perpetual futures exchanges:
 * - Binance Futures (300+ contracts, highest volume)
 * - Bybit (400+ contracts, fast API)
 * - OKX (500+ contracts, global coverage)
 *
 * Funding rates are ephemeral — they reset every 8 hours and historical
 * data is limited. This makes real-time collection critical.
 *
 * @module providers/adapters/funding-rate
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import { binanceFundingAdapter } from './binance-futures.adapter';
import { bybitFundingAdapter } from './bybit.adapter';
import { okxFundingAdapter } from './okx.adapter';
import type { FundingRate } from './types';

export type { FundingRate, FundingRateHistory } from './types';

export interface FundingRateChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeBinance?: boolean;
  includeBybit?: boolean;
  includeOkx?: boolean;
}

export function createFundingRateChain(
  options: FundingRateChainOptions = {},
): ProviderChain<FundingRate[]> {
  const {
    strategy = 'broadcast',
    cacheTtlSeconds = 60,
    staleWhileError = true,
    includeBinance = true,
    includeBybit = true,
    includeOkx = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<FundingRate[]>('funding-rates', config);

  if (includeBinance) chain.addProvider(binanceFundingAdapter);
  if (includeBybit) chain.addProvider(bybitFundingAdapter);
  if (includeOkx) chain.addProvider(okxFundingAdapter);

  return chain;
}

/** Default funding rate chain — broadcast strategy (fetches from all exchanges) */
export const fundingRateChain = createFundingRateChain();

/** Fallback chain — tries Binance first, falls back to Bybit, then OKX */
export const fundingRateFallbackChain = createFundingRateChain({
  strategy: 'fallback',
  cacheTtlSeconds: 30,
});
