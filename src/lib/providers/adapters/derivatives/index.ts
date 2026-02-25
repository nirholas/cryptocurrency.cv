/**
 * Derivatives Chain — Provider chain for derivatives market data
 *
 * | Provider      | Priority | Weight | Rate Limit    | Coverage              |
 * |---------------|----------|--------|---------------|-----------------------|
 * | Hyperliquid   | 1        | 0.40   | 120/min (free)| 100+ perp markets     |
 * | CoinGlass     | 2        | 0.35   | 30/min (key)  | 10+ exchange aggregate|
 *
 * Default strategy: `fallback` (Hyperliquid → CoinGlass)
 *
 * For aggregated multi-exchange data, use `consensus` strategy.
 *
 * @module providers/adapters/derivatives
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { OpenInterest, LiquidationSummary } from './types';
import { hyperliquidAdapter } from './hyperliquid.adapter';
import { coinglassAdapter } from './coinglass.adapter';

export type { OpenInterest, LiquidationSummary, Liquidation, ExchangeOI } from './types';

// =============================================================================
// OPEN INTEREST CHAIN
// =============================================================================

export interface DerivativesChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeCoinglass?: boolean;
}

export function createDerivativesChain(
  options: DerivativesChainOptions = {},
): ProviderChain<OpenInterest[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 30,
    staleWhileError = true,
    includeCoinglass = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<OpenInterest[]>('derivatives', config);

  chain.addProvider(hyperliquidAdapter);

  if (includeCoinglass) {
    chain.addProvider(coinglassAdapter);
  }

  return chain;
}

/** Default derivatives chain (fallback: Hyperliquid → CoinGlass) */
export const derivativesChain = createDerivativesChain();

/** Consensus chain for cross-exchange OI verification */
export const derivativesConsensusChain = createDerivativesChain({
  strategy: 'consensus',
  cacheTtlSeconds: 15,
});
