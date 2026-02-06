import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, getDefiNews, getBitcoinNews } from '@/lib/crypto-news';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRSS(articles: any[], title: string, description: string, feedUrl: string): string {
  const items = articles.map(article => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${escapeXml(article.link)}</link>
      <description><![CDATA[${article.description || ''}]]></description>
      <pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>
      <source url="${escapeXml(article.link)}">${escapeXml(article.source)}</source>
      <guid isPermaLink="true">${escapeXml(article.link)}</guid>
      <category>${escapeXml(article.category)}</category>
    </item>`).join('\n');

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
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  
  try {
    let data;
    let title: string;
    let description: string;
    let feedUrl: string;
    
    switch (feed) {
      case 'defi':
        data = await getDefiNews(limit);
        title = 'Free Crypto News - DeFi Feed';
        description = 'DeFi news aggregated from top crypto sources';
        feedUrl = 'https://cryptocurrency.cv/api/rss?feed=defi';
        break;
      case 'bitcoin':
        data = await getBitcoinNews(limit);
        title = 'Free Crypto News - Bitcoin Feed';
        description = 'Bitcoin news aggregated from top crypto sources';
        feedUrl = 'https://cryptocurrency.cv/api/rss?feed=bitcoin';
        break;
      default:
        data = await getLatestNews(limit);
        title = 'Free Crypto News - All Sources';
        description = 'Crypto news aggregated from 130+ top sources - 100% FREE';
        feedUrl = 'https://cryptocurrency.cv/api/rss';
    }
    
    const rss = generateRSS(data.articles, title, description, feedUrl);
    
    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate RSS feed', message: String(error) },
      { status: 500 }
    );
  }
}
