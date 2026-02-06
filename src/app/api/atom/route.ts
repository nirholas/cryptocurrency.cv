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

function generateAtom(articles: any[], title: string, subtitle: string, feedUrl: string): string {
  const updated = articles.length > 0 ? new Date(articles[0].pubDate).toISOString() : new Date().toISOString();
  
  const entries = articles.map(article => `
  <entry>
    <title><![CDATA[${article.title}]]></title>
    <link href="${escapeXml(article.link)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(article.link)}</id>
    <published>${new Date(article.pubDate).toISOString()}</published>
    <updated>${new Date(article.pubDate).toISOString()}</updated>
    <summary type="html"><![CDATA[${article.description || ''}]]></summary>
    <author>
      <name>${escapeXml(article.source)}</name>
    </author>
    <category term="${escapeXml(article.category)}"/>
  </entry>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(title)}</title>
  <subtitle>${escapeXml(subtitle)}</subtitle>
  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml"/>
  <link href="https://cryptocurrency.cv" rel="alternate" type="text/html"/>
  <id>https://cryptocurrency.cv/</id>
  <updated>${updated}</updated>
  <generator uri="https://github.com/nirholas/free-crypto-news" version="1.0">Free Crypto News</generator>
  <icon>https://cryptocurrency.cv/icon.png</icon>
  ${entries}
</feed>`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feed = searchParams.get('feed') || 'all';
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  
  try {
    let data;
    let title: string;
    let subtitle: string;
    let feedUrl: string;
    
    switch (feed) {
      case 'defi':
        data = await getDefiNews(limit);
        title = 'Free Crypto News - DeFi Feed';
        subtitle = 'DeFi news aggregated from top crypto sources';
        feedUrl = 'https://cryptocurrency.cv/api/atom?feed=defi';
        break;
      case 'bitcoin':
        data = await getBitcoinNews(limit);
        title = 'Free Crypto News - Bitcoin Feed';
        subtitle = 'Bitcoin news aggregated from top crypto sources';
        feedUrl = 'https://cryptocurrency.cv/api/atom?feed=bitcoin';
        break;
      default:
        data = await getLatestNews(limit);
        title = 'Free Crypto News - All Sources';
        subtitle = 'Crypto news aggregated from 130+ top sources - 100% FREE';
        feedUrl = 'https://cryptocurrency.cv/api/atom';
    }
    
    const atom = generateAtom(data.articles, title, subtitle, feedUrl);
    
    return new NextResponse(atom, {
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate Atom feed', message: String(error) },
      { status: 500 }
    );
  }
}
