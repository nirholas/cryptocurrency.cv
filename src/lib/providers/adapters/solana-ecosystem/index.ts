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
 * Solana Ecosystem — Provider chain index
 *
 * @module providers/adapters/solana-ecosystem
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { SolanaToken } from './types';
import { jupiterAdapter } from './jupiter.adapter';
import { birdeyeAdapter } from './birdeye.adapter';

export type { SolanaToken, SolanaDeFiProtocol, SolanaNetworkStats } from './types';

export interface SolanaChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createSolanaChain(
  options: SolanaChainOptions = {},
): ProviderChain<SolanaToken[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 30,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<SolanaToken[]>('solana-ecosystem', config);
  chain.addProvider(jupiterAdapter);
  chain.addProvider(birdeyeAdapter);
  // heliusAdapter returns SolanaNetworkStats, not SolanaToken[] — registered as separate subchain
  return chain;
}

export const solanaChain = createSolanaChain();
export const solanaConsensusChain = createSolanaChain({ strategy: 'consensus' });
