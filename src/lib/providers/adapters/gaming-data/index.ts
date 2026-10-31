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
 * Gaming Data Chain — Pre-wired provider chain for blockchain gaming data
 *
 * | Provider   | Priority | Weight | Rate Limit | Coverage                          |
 * |------------|----------|--------|------------|-----------------------------------|
 * | Footprint  | 1        | 0.50   | 20/min     | Players, volume (FOOTPRINT_API_KEY) |
 * | DefiLlama  | 2        | 0.50   | 300/min    | Value locked, keyless             |
 *
 * Default strategy: `fallback` (Footprint → DefiLlama). Footprint joins the
 * chain only when FOOTPRINT_API_KEY is set. DappRadar's API and the
 * PlayToEarn host were shut down, so they are no longer providers.
 *
 * @example
 * ```ts
 * import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';
 *
 * const result = await gamingDataChain.fetch({ chain: 'all', limit: 25 });
 * console.log(result.data.topGames);
 * console.log(result.data.rankedBy); // 'tvl' without a Footprint key
 * ```
 *
 * @module providers/adapters/gaming-data
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { GamingOverview } from './types';
import { defillamaGamingAdapter } from './defillama.adapter';
import { footprintAdapter } from './footprint.adapter';

export type { GamingOverview, GameData, GamingRanking } from './types';

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
  /** Whether to include the DefiLlama adapter. Default: true */
  includeDefiLlama?: boolean;
  /** Whether to include Footprint Analytics. Default: true when FOOTPRINT_API_KEY is set */
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
    includeDefiLlama = true,
    includeFootprint = Boolean(process.env.FOOTPRINT_API_KEY),
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<GamingOverview>('gaming-data', config);

  if (includeFootprint) {
    chain.addProvider(footprintAdapter);
  }

  if (includeDefiLlama) {
    chain.addProvider(defillamaGamingAdapter);
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
