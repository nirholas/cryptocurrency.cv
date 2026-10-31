/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { escapeXml, resolveFeed, feedSlugs } from '@/app/api/_feed-utils';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

function generateRSS(articles: any[], title: string, description: string, feedUrl: string): string {
  const items = articles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${escapeXml(article.link)}</link>
      <description><![CDATA[${article.description || ''}]]></description>
      <pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>
      <source url="${escapeXml(article.link)}">${escapeXml(article.source)}</source>
      <guid isPermaLink="true">${escapeXml(article.link)}</guid>
      <category>${escapeXml(article.category)}</category>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>https://cryptocurrency.cv</link>
    <description>${escapeXml(description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <ttl>5</ttl>
    <image>
      <url>https://cryptocurrency.cv/icon.png</url>
      <title>${escapeXml(title)}</title>
      <link>https://cryptocurrency.cv</link>
    </image>
    ${items}
  </channel>
</rss>`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feed = searchParams.get('feed') || 'all';
  const limit = intParam(searchParams, 'limit', { fallback: 20, min: 1, max: 50 });

  try {
    const resolved = await resolveFeed(feed, 'rss', limit);
    if (!resolved) {
      // An unknown slug used to fall through to the firehose under the wrong
      // title. Naming the valid ones makes the mistake self-correcting.
      return NextResponse.json(
        { error: 'unknown_feed', feed, available: feedSlugs() },
        { status: 400 },
      );
    }
    const { articles, meta } = resolved;
    const rss = generateRSS(articles, meta.title, meta.description, meta.feedUrl);

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate RSS feed' }, { status: 500 });
  }
}
