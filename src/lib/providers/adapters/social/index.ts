/**
 * Social Chain — Provider chain for social metrics data
 *
 * | Provider      | Priority | Weight | Rate Limit    | Coverage            |
 * |---------------|----------|--------|---------------|---------------------|
 * | LunarCrush    | 1        | 0.60   | 10/min (key)  | 4,000+ coins        |
 * | Santiment     | 2        | 0.40   | 10-30/min     | On-chain + social   |
 * | CryptoPanic   | 3        | 0.30   | 60/min (free) | News sentiment      |
 *
 * Default strategy: `fallback`
 *
 * @module providers/adapters/social
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { SocialMetric } from './types';
import { lunarcrushAdapter } from './lunarcrush.adapter';
import { santimentAdapter } from './santiment.adapter';
import { cryptoPanicAdapter } from './cryptopanic.adapter';
import { cryptopanicSentimentAdapter } from './cryptopanic-sentiment.adapter';
import { farcasterAdapter } from './farcaster.adapter';
import { redditAdapter } from './reddit.adapter';

export type { SocialMetric } from './types';

export interface SocialChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeSantiment?: boolean;
  includeCryptoPanic?: boolean;
  includeFarcaster?: boolean;
  includeReddit?: boolean;
}

export function createSocialChain(
  options: SocialChainOptions = {},
): ProviderChain<SocialMetric[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
    includeSantiment = true,
    includeCryptoPanic = true,
    includeFarcaster = true,
    includeReddit = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<SocialMetric[]>('social-metrics', config);
  chain.addProvider(lunarcrushAdapter);

  if (includeSantiment) {
    chain.addProvider(santimentAdapter);
  }

  if (includeCryptoPanic) {
    chain.addProvider(cryptoPanicAdapter);
    chain.addProvider(cryptopanicSentimentAdapter);
  }

  if (includeFarcaster) {
    chain.addProvider(farcasterAdapter);
  }

  if (includeReddit) {
    chain.addProvider(redditAdapter);
  }

  return chain;
}

/** Default social metrics chain */
export const socialChain = createSocialChain();

/** Consensus chain for cross-source sentiment verification */
export const socialConsensusChain = createSocialChain({
  strategy: 'consensus',
  cacheTtlSeconds: 60,
});
