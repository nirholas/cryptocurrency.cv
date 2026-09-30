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
 * Gas Fees Chain — Pre-wired provider chain for gas price data
 *
 * | Provider       | Priority | Weight | Rate Limit     | Coverage              |
 * |----------------|----------|--------|----------------|-----------------------|
 * | Etherscan      | 1        | 0.50   | 300/min (keyed)| Ethereum mainnet      |
 * | eth_feeHistory | 2        | 0.50   | 60/min         | Any EIP-1559 chain    |
 * | Owlracle       | 3        |        |                | Multi-chain           |
 *
 * Default strategy: `fallback` (Etherscan → eth_feeHistory → Owlracle).
 * eth_feeHistory needs no key, so the chain has a live source even when no
 * third-party credential is configured.
 *
 * @module providers/adapters/gas
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { GasPrice } from './etherscan.adapter';
import { etherscanGasAdapter } from './etherscan.adapter';
import { feeHistoryGasAdapter } from './fee-history.adapter';
import { owlracleAdapter } from './owlracle.adapter';

export type { GasPrice } from './etherscan.adapter';
export {
  fetchFeeHistoryGas,
  isFeeHistoryNetwork,
  FEE_HISTORY_NETWORKS,
  type FeeHistoryNetwork,
  type FeeHistoryEstimate,
} from './fee-history.adapter';

export interface GasChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeFeeHistory?: boolean;
  includeOwlracle?: boolean;
}

export function createGasChain(options: GasChainOptions = {}): ProviderChain<GasPrice> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 15,
    staleWhileError = true,
    includeFeeHistory = true,
    includeOwlracle = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<GasPrice>('gas-fees', config);
  chain.addProvider(etherscanGasAdapter);

  if (includeFeeHistory) {
    chain.addProvider(feeHistoryGasAdapter);
  }

  if (includeOwlracle) {
    chain.addProvider(owlracleAdapter as any);  // Multi-chain gas estimates
  }

  return chain;
}

export const gasChain = createGasChain();
export const gasConsensusChain = createGasChain({ strategy: 'consensus', cacheTtlSeconds: 10 });
