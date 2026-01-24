/**
 * RSS Feed Generator
 * Generates RSS 2.0 feed at /feed.xml
 */

import { NextResponse } from 'next/server';

const BASE_URL = 'https://free-crypto-news.vercel.app';

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

/**
 * Generate SEO-friendly slug from article title and date
 */
function generateArticleSlug(title: string, date?: string): string {
  let slug = title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
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
    // Fetch latest news
    const response = await fetch(`${BASE_URL}/api/news?limit=50`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();
    const articles: Article[] = data.articles || [];

    const now = new Date().toUTCString();

    const rssItems = articles
      .map((article) => {
        const articleSlug = generateArticleSlug(article.title, article.pubDate);
        const pubDate = new Date(article.pubDate).toUTCString();
        const internalLink = `${BASE_URL}/article/${articleSlug}`;

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
    <title>Free Crypto News</title>
    <link>${BASE_URL}</link>
    <description>Real-time cryptocurrency news from 7 trusted sources. 100% FREE - No API keys required.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>5</ttl>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE_URL}/icons/icon-192x192.png</url>
      <title>Free Crypto News</title>
      <link>${BASE_URL}</link>
      <width>192</width>
      <height>192</height>
    </image>
    <copyright>MIT License - Free Crypto News ${new Date().getFullYear()}</copyright>
    <managingEditor>noreply@free-crypto-news.vercel.app (Free Crypto News)</managingEditor>
    <webMaster>noreply@free-crypto-news.vercel.app (Free Crypto News)</webMaster>
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
