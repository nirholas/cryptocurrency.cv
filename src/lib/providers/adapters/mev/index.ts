/**
 * MEV — Provider chain index
 *
 * @module providers/adapters/mev
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { MEVStats } from './types';
import { flashbotsAdapter } from './flashbots.adapter';

export type { MEVStats, MEVBundle } from './types';

export interface MEVChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createMEVChain(
  options: MEVChainOptions = {},
): ProviderChain<MEVStats> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<MEVStats>('mev', config);
  chain.addProvider(flashbotsAdapter);
  return chain;
}

export const mevChain = createMEVChain();
