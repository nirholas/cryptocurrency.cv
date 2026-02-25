/**
 * CryptoPanic News Adapter — Aggregated crypto news with sentiment
 *
 * CryptoPanic aggregates news from 100+ crypto media sources:
 * - Real-time news feed with community voting
 * - Sentiment classification (bullish/bearish)
 * - Currency tagging for relevant coins
 * - Trending and hot news detection
 *
 * Free tier: 60 requests/minute (no key for basic).
 * Pro tier: Set CRYPTOPANIC_API_KEY for filter options and higher limits.
 *
 * API: https://cryptopanic.com/developers/api/
 * env: CRYPTOPANIC_API_KEY (optional, enables advanced filters)
 *
 * @module providers/adapters/news/cryptopanic
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { NewsArticle } from './types';

const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: CRYPTOPANIC_API_KEY ? 120 : 60,
  windowMs: 60_000,
};

export const cryptoPanicNewsAdapter: DataProvider<NewsArticle[]> = {
  name: 'cryptopanic-news',
  description: 'CryptoPanic — Aggregated crypto news from 100+ sources with community sentiment',
  priority: 1,
  weight: 0.55,
  rateLimit: RATE_LIMIT,
  capabilities: ['news'],

  async fetch(params: FetchParams): Promise<NewsArticle[]> {
    const limit = Math.min(params.limit ?? 50, 200);
    const filter = (params.extra?.filter as string) ?? 'hot';

    let url: string;
    if (CRYPTOPANIC_API_KEY) {
      url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&filter=${filter}&public=true&metadata=true`;
    } else {
      url = `https://cryptopanic.com/api/free/v1/posts/?filter=${filter}&public=true&metadata=true`;
    }

    // Filter by currencies
    if (params.symbols && params.symbols.length > 0) {
      url += `&currencies=${params.symbols.join(',')}`;
    }

    // Filter by kind (news, media, analysis)
    if (params.extra?.kind) {
      url += `&kind=${params.extra.kind}`;
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 429) {
      throw new Error('CryptoPanic rate limit exceeded (429)');
    }

    if (!response.ok) {
      throw new Error(`CryptoPanic News API error: ${response.status}`);
    }

    const json = await response.json();
    const posts: CPPost[] = json?.results ?? [];

    return posts.slice(0, limit).map(normalize);
  },

  async healthCheck(): Promise<boolean> {
    try {
      let url = 'https://cryptopanic.com/api/free/v1/posts/?filter=hot&public=true';
      if (CRYPTOPANIC_API_KEY) {
        url = `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&filter=hot&public=true`;
      }
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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

function normalize(post: CPPost): NewsArticle {
  const votes = post.votes ?? {};
  const net = (votes.positive ?? 0) - (votes.negative ?? 0);
  const total = (votes.positive ?? 0) + (votes.negative ?? 0);
  const sentiment = total > 0 ? net / total : 0;

  const kindMap: Record<string, NewsArticle['kind']> = {
    news: 'news',
    media: 'media',
    analysis: 'analysis',
    government: 'government',
  };

  return {
    id: String(post.id ?? ''),
    title: post.title ?? '',
    url: post.url ?? '',
    source: post.source?.title ?? 'Unknown',
    author: undefined,
    publishedAt: post.published_at ?? new Date().toISOString(),
    description: post.metadata?.description ?? undefined,
    imageUrl: post.metadata?.image ?? undefined,
    currencies: (post.currencies ?? []).map(c => c.code),
    categories: post.kind ? [post.kind] : ['news'],
    sentiment: Math.round(sentiment * 1000) / 1000,
    votes: {
      positive: votes.positive ?? 0,
      negative: votes.negative ?? 0,
      important: votes.important ?? 0,
    },
    kind: kindMap[post.kind ?? 'news'] ?? 'news',
    provider: 'cryptopanic',
  };
}

interface CPPost {
  id: number;
  title: string;
  url: string;
  published_at: string;
  kind: string;
  currencies: { code: string; title: string; slug: string }[] | null;
  source: { title: string; region: string; domain: string } | null;
  votes: {
    negative: number;
    positive: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
    comments: number;
  };
  metadata: {
    description: string | null;
    image: string | null;
  } | null;
}
