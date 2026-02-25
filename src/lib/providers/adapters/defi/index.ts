/**
 * DeFi Chain — Pre-wired provider chain for DeFi protocol data
 *
 * | Provider             | Priority | Weight | Rate Limit    | Coverage          |
 * |---------------------|----------|--------|---------------|-------------------|
 * | DefiLlama TVL       | 1        | 0.50   | 60/min (free) | 5,000+ protocols  |
 * | DefiLlama Yields    | 1        | 0.50   | 30/min (free) | 10,000+ pools     |
 *
 * Default strategy: `fallback`
 *
 * @module providers/adapters/defi
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { ProtocolTvl, YieldPool } from './types';
import { defillamaTvlAdapter } from './defillama-tvl.adapter';
import { defillamaYieldsAdapter } from './defillama-yields.adapter';

export type { ProtocolTvl, YieldPool } from './types';

// =============================================================================
// TVL CHAIN
// =============================================================================

export interface DefiTvlChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createDefiTvlChain(options: DefiTvlChainOptions = {}): ProviderChain<ProtocolTvl[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<ProtocolTvl[]>('defi-tvl', config);
  chain.addProvider(defillamaTvlAdapter);
  return chain;
}

export const defiTvlChain = createDefiTvlChain();

// =============================================================================
// YIELDS CHAIN
// =============================================================================

export interface DefiYieldsChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createDefiYieldsChain(options: DefiYieldsChainOptions = {}): ProviderChain<YieldPool[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<YieldPool[]>('defi-yields', config);
  chain.addProvider(defillamaYieldsAdapter);
  return chain;
}

export const defiYieldsChain = createDefiYieldsChain();
