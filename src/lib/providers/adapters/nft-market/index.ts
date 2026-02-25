/**
 * NFT Market Chain — Pre-wired provider chain for NFT market data
 *
 * | Provider    | Priority | Weight | Rate Limit       | Coverage          |
 * |-------------|----------|--------|------------------|-------------------|
 * | OpenSea     | 1        | 0.50   | 4/s              | Largest marketplace|
 * | Reservoir   | 2        | 0.30   | 120/min          | Aggregated volume |
 * | SimpleHash  | 3        | 0.20   | 1,000/day        | 50+ chains        |
 *
 * Default strategy: `fallback` (OpenSea → Reservoir → SimpleHash)
 *
 * @example
 * ```ts
 * import { nftMarketChain } from '@/lib/providers/adapters/nft-market';
 *
 * const result = await nftMarketChain.fetch({ chain: 'ethereum', limit: 25 });
 * console.log(result.data.topCollections);
 * console.log(result.lineage.provider); // 'opensea'
 * ```
 *
 * @module providers/adapters/nft-market
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { NFTMarketOverview } from './types';
import { openseaAdapter } from './opensea.adapter';
import { reservoirAdapter } from './reservoir.adapter';
import { simplehashAdapter } from './simplehash.adapter';

export type { NFTMarketOverview, NFTCollectionSummary } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface NFTMarketChainOptions {
  /** Resolution strategy. Default: 'fallback' */
  strategy?: ResolutionStrategy;
  /** Cache TTL in seconds. Default: 120 */
  cacheTtlSeconds?: number;
  /** Whether to serve stale cache on total failure. Default: true */
  staleWhileError?: boolean;
  /** Whether to include OpenSea adapter. Default: true */
  includeOpenSea?: boolean;
  /** Whether to include Reservoir adapter. Default: true */
  includeReservoir?: boolean;
  /** Whether to include SimpleHash adapter. Default: true */
  includeSimpleHash?: boolean;
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a new ProviderChain for NFT market data with custom configuration.
 */
export function createNFTMarketChain(
  options: NFTMarketChainOptions = {},
): ProviderChain<NFTMarketOverview> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
    includeOpenSea = true,
    includeReservoir = true,
    includeSimpleHash = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<NFTMarketOverview>('nft-market', config);

  if (includeOpenSea) {
    chain.addProvider(openseaAdapter);
  }

  if (includeReservoir) {
    chain.addProvider(reservoirAdapter);
  }

  if (includeSimpleHash) {
    chain.addProvider(simplehashAdapter);
  }

  return chain;
}

// =============================================================================
// DEFAULT INSTANCE — Singleton for common use
// =============================================================================

/**
 * Default NFT market chain.
 *
 * Uses fallback strategy with 120s cache TTL. This is the recommended way
 * to fetch NFT market data throughout the application.
 */
export const nftMarketChain = createNFTMarketChain();

// =============================================================================
// CONVENIENCE — Pre-configured consensus chain
// =============================================================================

/**
 * NFT market chain configured for consensus strategy.
 *
 * Fetches from all providers and fuses results using weighted median.
 * Higher confidence but higher latency.
 */
export const nftMarketConsensusChain = createNFTMarketChain({
  strategy: 'consensus',
  cacheTtlSeconds: 60,
});
