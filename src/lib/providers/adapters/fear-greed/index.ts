/**
 * Fear & Greed Chain — Pre-wired provider chain for sentiment index
 *
 * | Provider       | Priority | Weight | Rate Limit | Data Frequency |
 * |----------------|----------|--------|------------|----------------|
 * | Alternative.me | 1        | 0.60   | 30/min     | Daily          |
 * | CoinStats      | 2        | 0.40   | 30/min     | Real-time      |
 *
 * Default strategy: `fallback` (Alternative.me → CoinStats)
 *
 * @module providers/adapters/fear-greed
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { FearGreedIndex } from './alternative-me.adapter';
import { alternativeMeFearGreedAdapter } from './alternative-me.adapter';
import { coinstatsFearGreedAdapter } from './coinstats.adapter';
import { compositeFearGreedAdapter } from './composite-fng.adapter';

export type { FearGreedIndex } from './alternative-me.adapter';

export interface FearGreedChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createFearGreedChain(
  options: FearGreedChainOptions = {},
): ProviderChain<FearGreedIndex> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 300,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<FearGreedIndex>('fear-greed', config);
  chain.addProvider(alternativeMeFearGreedAdapter);
  chain.addProvider(coinstatsFearGreedAdapter);
  chain.addProvider(compositeFearGreedAdapter);
  return chain;
}

export const fearGreedChain = createFearGreedChain();
export const fearGreedConsensusChain = createFearGreedChain({ strategy: 'consensus' });
