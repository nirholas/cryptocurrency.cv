/**
 * Mining — Provider chain index
 *
 * @module providers/adapters/mining
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { MiningStats } from './types';
import { blockchainMiningAdapter } from './blockchain-mining.adapter';

export type { MiningStats, MiningPool } from './types';

export interface MiningChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createMiningChain(
  options: MiningChainOptions = {},
): ProviderChain<MiningStats> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 300,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<MiningStats>('mining', config);
  chain.addProvider(blockchainMiningAdapter);
  return chain;
}

export const miningChain = createMiningChain();
