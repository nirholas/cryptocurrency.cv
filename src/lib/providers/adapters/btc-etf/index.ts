/**
 * BTC ETF — Provider chain index
 *
 * @module providers/adapters/btc-etf
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { BTCETFAggregate } from './types';
import { coinglassETFAdapter } from './coinglass-etf.adapter';
import { sosovalueETFAdapter } from './sosovalue.adapter';

export type { BTCETFFlow, BTCETFAggregate } from './types';

export interface BTCETFChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createBTCETFChain(
  options: BTCETFChainOptions = {},
): ProviderChain<BTCETFAggregate> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 600,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<BTCETFAggregate>('btc-etf', config);
  chain.addProvider(coinglassETFAdapter);
  chain.addProvider(sosovalueETFAdapter);
  return chain;
}

export const btcETFChain = createBTCETFChain();
