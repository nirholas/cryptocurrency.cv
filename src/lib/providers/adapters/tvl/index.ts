/**
 * TVL Chain — Pre-wired provider chain for Total Value Locked data
 *
 * | Provider      | Priority | Weight | Rate Limit     | Coverage          |
 * |---------------|----------|--------|----------------|-------------------|
 * | DefiLlama     | 1        | 0.60   | 300/min (free) | 2,000+ protocols  |
 *
 * @module providers/adapters/tvl
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { TVLData } from './defillama.adapter';
import { defillamaTvlAdapter } from './defillama.adapter';

export type { TVLData } from './defillama.adapter';

export interface TVLChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createTVLChain(options: TVLChainOptions = {}): ProviderChain<TVLData[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 60,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<TVLData[]>('tvl', config);
  chain.addProvider(defillamaTvlAdapter);
  return chain;
}

export const tvlChain = createTVLChain();
