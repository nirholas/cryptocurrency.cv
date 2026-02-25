/**
 * News Chain — Pre-wired provider chain for crypto news articles
 *
 * | Provider       | Priority | Weight | Rate Limit    | Coverage           |
 * |----------------|----------|--------|---------------|--------------------|
 * | CryptoPanic    | 1        | 0.55   | 60/min (free) | 100+ sources       |
 * | NewsData.io    | 2        | 0.40   | 10/min (key)  | 75+ countries      |
 *
 * Default strategy: `fallback` (CryptoPanic → NewsData.io)
 *
 * @module providers/adapters/news
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { NewsArticle } from './types';
import { cryptoPanicNewsAdapter } from './cryptopanic-news.adapter';
import { newsdataAdapter } from './newsdata.adapter';

export type { NewsArticle, NewsFeedSummary } from './types';

export interface NewsChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeNewsData?: boolean;
}

export function createNewsChain(
  options: NewsChainOptions = {},
): ProviderChain<NewsArticle[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 120,
    staleWhileError = true,
    includeNewsData = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<NewsArticle[]>('news', config);
  chain.addProvider(cryptoPanicNewsAdapter);

  if (includeNewsData) {
    chain.addProvider(newsdataAdapter);
  }

  return chain;
}

/** Default news chain */
export const newsChain = createNewsChain();

/** Broadcast chain for cross-source news aggregation */
export const newsBroadcastChain = createNewsChain({
  strategy: 'broadcast',
  cacheTtlSeconds: 60,
});
