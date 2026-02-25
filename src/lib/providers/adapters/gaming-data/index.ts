/**
 * Gaming Data Chain — Pre-wired provider chain for blockchain gaming data
 *
 * | Provider    | Priority | Weight | Rate Limit  | Coverage             |
 * |-------------|----------|--------|-------------|----------------------|
 * | DappRadar   | 1        | 0.60   | 30/min      | 15,000+ dApps        |
 * | PlayToEarn  | 2        | 0.40   | 60/min      | Community-curated    |
 *
 * Default strategy: `fallback` (DappRadar → PlayToEarn)
 *
 * @example
 * ```ts
 * import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';
 *
 * const result = await gamingDataChain.fetch({ chain: 'all', limit: 25 });
 * console.log(result.data.topGames);
 * console.log(result.lineage.provider); // 'dappradar'
 * ```
 *
 * @module providers/adapters/gaming-data
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { GamingOverview } from './types';
import { dappradarAdapter } from './dappradar.adapter';
import { playtoearnAdapter } from './playtoearn.adapter';
import { footprintAdapter } from './footprint.adapter';

export type { GamingOverview, GameData } from './types';

// =============================================================================
// TYPES
// =============================================================================

export interface GamingDataChainOptions {
  /** Resolution strategy. Default: 'fallback' */
  strategy?: ResolutionStrategy;
  /** Cache TTL in seconds. Default: 300 */
  cacheTtlSeconds?: number;
  /** Whether to serve stale cache on total failure. Default: true */
  staleWhileError?: boolean;
  /** Whether to include DappRadar adapter. Default: true */
  includeDappRadar?: boolean;
  /** Whether to include PlayToEarn adapter. Default: true */
  includePlayToEarn?: boolean;
  /** Whether to include Footprint Analytics adapter. Default: true */
  includeFootprint?: boolean;
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a new ProviderChain for blockchain gaming data with custom configuration.
 */
export function createGamingDataChain(
  options: GamingDataChainOptions = {},
): ProviderChain<GamingOverview> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 300,
    staleWhileError = true,
    includeDappRadar = true,
    includePlayToEarn = true,
    includeFootprint = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<GamingOverview>('gaming-data', config);

  if (includeDappRadar) {
    chain.addProvider(dappradarAdapter);
  }

  if (includePlayToEarn) {
    chain.addProvider(playtoearnAdapter);
  }

  if (includeFootprint) {
    chain.addProvider(footprintAdapter);
  }

  return chain;
}

// =============================================================================
// DEFAULT INSTANCE — Singleton for common use
// =============================================================================

/**
 * Default gaming data chain.
 *
 * Uses fallback strategy with 300s cache TTL. This is the recommended way
 * to fetch blockchain gaming data throughout the application.
 */
export const gamingDataChain = createGamingDataChain();

// =============================================================================
// CONVENIENCE — Pre-configured consensus chain
// =============================================================================

/**
 * Gaming data chain configured for consensus strategy.
 *
 * Fetches from all providers and fuses results using weighted median.
 * Higher confidence but higher latency.
 */
export const gamingDataConsensusChain = createGamingDataChain({
  strategy: 'consensus',
  cacheTtlSeconds: 120,
});
