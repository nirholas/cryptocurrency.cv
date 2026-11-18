/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * JSON Feed 1.1 Generator
 *
 * Generates a JSON Feed at /feed.json for modern feed readers,
 * LLM training pipelines, and aggregators.
 *
 * @see https://www.jsonfeed.org/version/1.1/
 */

import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/constants';
import { getLatestNews } from '@/lib/crypto-news';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
  category?: string;
}

function generateArticleSlug(title: string, date?: string): string {
  let slug = title
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');

  if (date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    slug = `${slug}-${dateStr}`;
  }

  return slug || 'untitled';
}

export async function GET() {
  try {
    // Read the aggregator directly rather than fetching our own public API.
    // That round-trip made the feed an anonymous caller of the site, so it
    // inherited the free-tier cap and published a 3-item (in production, an
    // empty) JSON feed to every subscriber.
    const data = await getLatestNews(50);
    const articles: Article[] = data.articles || [];

    const items = articles.map((article) => {
      const slug = generateArticleSlug(article.title, article.pubDate);
      const id = `${SITE_URL}/en/article/${slug}`;

      return {
        id,
        url: id,
        external_url: article.link,
        title: article.title,
        content_text: article.description || article.title,
        summary: article.description,
        date_published: new Date(article.pubDate).toISOString(),
        ...(article.imageUrl ? { image: article.imageUrl } : {}),
        tags: [
          'cryptocurrency',
          ...(article.category ? [article.category] : []),
        ],
        authors: [{ name: article.source }],
      };
    });

    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Crypto Vision',
      home_page_url: SITE_URL,
      feed_url: `${SITE_URL}/feed.json`,
      description:
        'Real-time cryptocurrency prices, news, and market data. Bitcoin, Ethereum, DeFi & altcoins. Free API — no key required.',
      icon: `${SITE_URL}/icons/icon-512x512.png`,
      favicon: `${SITE_URL}/favicon.ico`,
      language: 'en',
      authors: [
        {
          name: 'Crypto Vision',
          url: SITE_URL,
        },
      ],
      items,
    };

    return NextResponse.json(feed, {
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('JSON Feed error:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
