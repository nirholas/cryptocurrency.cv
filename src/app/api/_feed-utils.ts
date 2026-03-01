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
 * Shared utilities for RSS/Atom feed generation.
 */

import { getLatestNews, getDefiNews, getBitcoinNews } from '@/lib/crypto-news';

const BASE_URL = 'https://cryptocurrency.cv';

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface FeedMeta {
  title: string;
  description: string;
  feedUrl: string;
}

/**
 * Fetch articles and return metadata for the requested feed variant.
 * @param feed  "all" | "defi" | "bitcoin"
 * @param format  "rss" | "atom" — controls the feedUrl API path
 * @param limit  max articles to fetch
 */
export async function resolveFeed(
  feed: string,
  format: 'rss' | 'atom',
  limit: number
): Promise<{ articles: Awaited<ReturnType<typeof getLatestNews>>['articles']; meta: FeedMeta }> {
  const path = `/api/${format}`;
  switch (feed) {
    case 'defi': {
      const data = await getDefiNews(limit);
      return {
        articles: data.articles,
        meta: {
          title: 'Free Crypto News - DeFi Feed',
          description: 'DeFi news aggregated from top crypto sources',
          feedUrl: `${BASE_URL}${path}?feed=defi`,
        },
      };
    }
    case 'bitcoin': {
      const data = await getBitcoinNews(limit);
      return {
        articles: data.articles,
        meta: {
          title: 'Free Crypto News - Bitcoin Feed',
          description: 'Bitcoin news aggregated from top crypto sources',
          feedUrl: `${BASE_URL}${path}?feed=bitcoin`,
        },
      };
    }
    default: {
      const data = await getLatestNews(limit);
      return {
        articles: data.articles,
        meta: {
          title: 'Free Crypto News - All Sources',
          description: 'Crypto news aggregated from 200+ top sources - 100% FREE',
          feedUrl: `${BASE_URL}${path}`,
        },
      };
    }
  }
}
