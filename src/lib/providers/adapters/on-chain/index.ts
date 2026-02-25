/**
 * On-Chain Chain — Provider chain for on-chain network data
 *
 * | Provider         | Priority | Weight | Rate Limit    | Coverage           |
 * |-----------------|----------|--------|---------------|--------------------|
 * | Blockchain.info | 1        | 0.50   | 30/min (free) | Bitcoin metrics     |
 * | Etherscan       | 2        | 0.30   | 5/sec (key)   | Ethereum metrics    |
 * | Mempool.space   | 3        | 0.60   | 60/min (free) | Bitcoin mempool     |
 *
 * Whale Alerts:
 * | Provider         | Priority | Weight | Rate Limit    | Coverage           |
 * |-----------------|----------|--------|---------------|--------------------|
 * | Whale Alert     | 1        | 0.70   | 10/min (key)  | All major chains   |
 *
 * Default strategy: `broadcast` (fetch from all, merge results)
 *
 * Since BTC and ETH metrics come from different providers, broadcast
 * mode gives us a comprehensive view across chains.
 *
 * @module providers/adapters/on-chain
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { OnChainMetric, WhaleAlert } from './types';
import { blockchainAdapter } from './blockchain.adapter';
import { etherscanAdapter } from './etherscan.adapter';
import { mempoolSpaceAdapter } from './mempool-space.adapter';
import { whaleAlertAdapter } from './whale-alert.adapter';
import { arkhamAdapter } from './arkham.adapter';
import { glassnodeAdapter } from './glassnode.adapter';
import { cryptoquantAdapter } from './cryptoquant.adapter';
import { duneAdapter } from './dune.adapter';
import { santimentOnChainAdapter } from './santiment.adapter';
import { etherscanWhalesAdapter } from './etherscan-whales.adapter';

export type { OnChainMetric, WhaleAlert, NetworkStats } from './types';

export interface OnChainChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeEtherscan?: boolean;
  includeMempoolSpace?: boolean;
  includeGlassnode?: boolean;
  includeCryptoQuant?: boolean;
  includeDune?: boolean;
  includeSantiment?: boolean;
}

export function createOnChainChain(
  options: OnChainChainOptions = {},
): ProviderChain<OnChainMetric[]> {
  const {
    strategy = 'broadcast',
    cacheTtlSeconds = 60,
    staleWhileError = true,
    includeEtherscan = true,
    includeMempoolSpace = true,
    includeGlassnode = true,
    includeCryptoQuant = true,
    includeDune = true,
    includeSantiment = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<OnChainMetric[]>('on-chain', config);

  chain.addProvider(blockchainAdapter);

  if (includeEtherscan) {
    chain.addProvider(etherscanAdapter);
  }

  if (includeMempoolSpace) {
    chain.addProvider(mempoolSpaceAdapter);
  }

  if (includeGlassnode) {
    chain.addProvider(glassnodeAdapter);
  }

  if (includeCryptoQuant) {
    chain.addProvider(cryptoquantAdapter);
  }

  if (includeDune) {
    chain.addProvider(duneAdapter);
  }

  if (includeSantiment) {
    chain.addProvider(santimentOnChainAdapter);
  }

  return chain;
}

export function createWhaleAlertChain(
  options: Omit<OnChainChainOptions, 'includeEtherscan' | 'includeMempoolSpace'> = {},
): ProviderChain<WhaleAlert[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 60,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<WhaleAlert[]>('whale-alerts', config);
  chain.addProvider(whaleAlertAdapter);
  chain.addProvider(arkhamAdapter);
  chain.addProvider(etherscanWhalesAdapter);
  return chain;
}

/** Default on-chain chain (broadcast: fetches from all sources and merges) */
export const onChainChain = createOnChainChain();

/** Whale alert chain (requires WHALE_ALERT_API_KEY) */
export const whaleAlertChain = createWhaleAlertChain();
