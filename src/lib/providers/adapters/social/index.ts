/**
 * Social Chain — Provider chain for social metrics data
 *
 * | Provider      | Priority | Weight | Rate Limit   | Coverage            |
 * |---------------|----------|--------|-------------|---------------------|
 * | LunarCrush    | 1        | 0.60   | 10/min (key)| 4,000+ coins        |
 *
 * Default strategy: `fallback`
 *
 * @module providers/adapters/social
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { SocialMetric } from './types';
import { lunarcrushAdapter } from './lunarcrush.adapter';

export type { SocialMetric } from './types';

export interface SocialChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createSocialChain(
  options: SocialChainOptions = {},
): ProviderChain<SocialMetric[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<SocialMetric[]>('social-metrics', config);
  chain.addProvider(lunarcrushAdapter);
  return chain;
}

/** Default social metrics chain */
export const socialChain = createSocialChain();
