/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog';
import { SITE_URL } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET() {
  const posts = getAllPosts();
  
  const rssItems = posts.map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${post.author.name}</author>
      <category>${post.category}</category>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
    </item>`).join('\n');
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Free Crypto News Blog</title>
    <description>Learn about cryptocurrency, blockchain, DeFi, and trading with our comprehensive guides and expert analysis.</description>
    <link>${SITE_URL}/blog</link>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/icons/icon-192x192.png</url>
      <title>Free Crypto News Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;
  
  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  });
}
