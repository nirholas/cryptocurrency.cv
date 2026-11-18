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
 * RSS Feed Generator
 * Generates RSS 2.0 feed at /feed.xml
 */

import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/constants';
import { getLatestNews } from '@/lib/crypto-news';
import { getArticleSlug } from '@/lib/article-url';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    // Read the aggregator directly rather than fetching our own public API:
    // that round-trip made the feed an anonymous caller of the site, so the
    // published RSS carried only the 3 articles of the free tier.
    const data = await getLatestNews(50);
    const articles: Article[] = data.articles || [];

    const now = new Date().toUTCString();

    const rssItems = articles
      .map((article) => {
        const articleSlug = getArticleSlug(article.title, article.pubDate);
        const pubDate = new Date(article.pubDate).toUTCString();
        const internalLink = `${SITE_URL}/article/${articleSlug}`;

        return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(internalLink)}</link>
      <guid isPermaLink="true">${escapeXml(internalLink)}</guid>
      <description>${escapeXml(article.description || article.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <source url="${escapeXml(article.link)}">${escapeXml(article.source)}</source>
      <category>Cryptocurrency</category>
    </item>`;
      })
      .join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Crypto Vision</title>
    <link>${SITE_URL}</link>
    <description>Real-time cryptocurrency prices, news, and market data. 350+ free API endpoints. Bitcoin, Ethereum, DeFi &amp; altcoins.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>5</ttl>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icons/icon-192x192.png</url>
      <title>Crypto Vision</title>
      <link>${SITE_URL}</link>
      <width>192</width>
      <height>192</height>
    </image>
    <copyright>MIT License - Crypto Vision ${new Date().getFullYear()}</copyright>
    <managingEditor>noreply@cryptocurrency.cv (Crypto Vision)</managingEditor>
    <webMaster>noreply@cryptocurrency.cv (Crypto Vision)</webMaster>
    <category>Technology</category>
    <category>Finance</category>
    <category>Cryptocurrency</category>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssFeed, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('RSS feed error:', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
