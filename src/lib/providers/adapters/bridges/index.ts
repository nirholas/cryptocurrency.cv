/**
 * Bridges — Provider chain index
 *
 * @module providers/adapters/bridges
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { BridgeVolume } from './types';
import { defilllamaBridgesAdapter } from './defillama-bridges.adapter';

export type { BridgeVolume } from './types';

export interface BridgesChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createBridgesChain(
  options: BridgesChainOptions = {},
): ProviderChain<BridgeVolume[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 300,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<BridgeVolume[]>('bridges', config);
  chain.addProvider(defilllamaBridgesAdapter);
  return chain;
}

export const bridgesChain = createBridgesChain();
