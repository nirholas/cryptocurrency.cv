/**
 * Gas Fees Chain — Pre-wired provider chain for gas price data
 *
 * | Provider     | Priority | Weight | Rate Limit     | Coverage         |
 * |--------------|----------|--------|----------------|------------------|
 * | Etherscan    | 1        | 0.50   | 300/min (keyed)| Ethereum mainnet |
 * | Blocknative  | 2        | 0.50   | 30/min         | ETH + L2s        |
 *
 * Default strategy: `fallback` (Etherscan → Blocknative)
 *
 * @module providers/adapters/gas
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { GasPrice } from './etherscan.adapter';
import { etherscanGasAdapter } from './etherscan.adapter';
import { blocknativeGasAdapter } from './blocknative.adapter';
import { owlracleAdapter } from './owlracle.adapter';

export type { GasPrice } from './etherscan.adapter';

export interface GasChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeBlocknative?: boolean;
  includeOwlracle?: boolean;
}

export function createGasChain(options: GasChainOptions = {}): ProviderChain<GasPrice> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 15,
    staleWhileError = true,
    includeBlocknative = true,
    includeOwlracle = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<GasPrice>('gas-fees', config);
  chain.addProvider(etherscanGasAdapter);

  if (includeBlocknative) {
    chain.addProvider(blocknativeGasAdapter);
  }

  if (includeOwlracle) {
    chain.addProvider(owlracleAdapter as any);  // Multi-chain gas estimates
  }

  return chain;
}

export const gasChain = createGasChain();
export const gasConsensusChain = createGasChain({ strategy: 'consensus', cacheTtlSeconds: 10 });
