/**
 * NewsData.io Adapter — Global crypto news API
 *
 * NewsData.io provides:
 * - News from 75+ countries in 10+ languages
 * - Crypto-specific category filtering
 * - Sentiment analysis (pro feature)
 * - Full-text search
 *
 * Free tier: 200 credits/day (~200 requests).
 * env: NEWSDATA_API_KEY (required)
 *
 * API: https://newsdata.io/documentation
 *
 * @module providers/adapters/news/newsdata
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { NewsArticle } from './types';

const BASE = 'https://newsdata.io/api/1/crypto';
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000,
};

export const newsdataAdapter: DataProvider<NewsArticle[]> = {
  name: 'newsdata',
  description: 'NewsData.io — Global crypto news from 75+ countries with sentiment analysis',
  priority: 2,
  weight: 0.40,
  rateLimit: RATE_LIMIT,
  capabilities: ['news'],

  async fetch(params: FetchParams): Promise<NewsArticle[]> {
    if (!NEWSDATA_API_KEY) {
      throw new Error('NewsData.io API key not configured (NEWSDATA_API_KEY)');
    }

    const limit = Math.min(params.limit ?? 50, 50); // Max 50 per request
    let url = `${BASE}?apikey=${NEWSDATA_API_KEY}&size=${limit}`;

    // Filter by coin symbols
    if (params.symbols && params.symbols.length > 0) {
      const coins = params.symbols.map(s => SYMBOL_TO_COIN[s.toUpperCase()] ?? s.toLowerCase());
      url += `&coin=${coins.join(',')}`;
    }

    // Language filter
    if (params.extra?.language) {
      url += `&language=${params.extra.language}`;
    }

    // Search query
    if (params.extra?.query) {
      url += `&q=${encodeURIComponent(String(params.extra.query))}`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 429) {
      throw new Error('NewsData.io rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`NewsData.io API error: ${response.status}`);
    }

    const json = await response.json();
    const articles: NDArticle[] = json?.results ?? [];

    return articles.map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    if (!NEWSDATA_API_KEY) return false;
    try {
      const res = await fetch(`${BASE}?apikey=${NEWSDATA_API_KEY}&size=1`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: NewsArticle[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(a =>
      typeof a.title === 'string' &&
      typeof a.url === 'string',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

const SYMBOL_TO_COIN: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'bnb',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche',
  DOT: 'polkadot',
  MATIC: 'polygon',
  LINK: 'chainlink',
};

function normalize(article: NDArticle): NewsArticle {
  const sentimentMap: Record<string, number> = {
    positive: 0.5,
    negative: -0.5,
    neutral: 0,
  };

  return {
    id: article.article_id ?? '',
    title: article.title ?? '',
    url: article.link ?? '',
    source: article.source_name ?? 'Unknown',
    author: article.creator?.[0] ?? undefined,
    publishedAt: article.pubDate ?? new Date().toISOString(),
    description: article.description ?? undefined,
    imageUrl: article.image_url ?? undefined,
    currencies: (article.coin ?? []).map(c => c.toUpperCase()),
    categories: article.category ?? ['crypto'],
    sentiment: sentimentMap[article.sentiment ?? 'neutral'] ?? 0,
    kind: 'news',
    provider: 'newsdata',
  };
}

interface NDArticle {
  article_id: string;
  title: string;
  link: string;
  source_name: string;
  creator: string[] | null;
  pubDate: string;
  description: string | null;
  image_url: string | null;
  coin: string[];
  category: string[];
  sentiment: string | null;
}
