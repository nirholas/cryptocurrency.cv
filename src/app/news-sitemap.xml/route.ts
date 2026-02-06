/**
 * Google News Sitemap Generator
 * 
 * Generates a news-specific sitemap for Google News indexing
 * @see https://developers.google.com/search/docs/specialty/google-news-sitemap
 */

import { NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { generateArticleSlug } from '@/lib/archive-v2';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';

// Supported locales for Google News
const locales = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'zh-TW', 'pt', 'ru', 'ar', 'it', 'nl', 'pl', 'tr'];

// Language codes for Google News (ISO 639-1)
const googleNewsLangMap: Record<string, string> = {
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'ja': 'ja',
  'ko': 'ko',
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
  'pt': 'pt',
  'ru': 'ru',
  'ar': 'ar',
  'it': 'it',
  'nl': 'nl',
  'pl': 'pl',
  'tr': 'tr',
};

export async function GET() {
  try {
    // Get latest news (Google News only cares about articles from last 2 days)
    const { articles } = await getLatestNews(100);
    
    // Filter to articles from last 48 hours
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    const recentArticles = articles.filter(article => {
      const pubDate = new Date(article.pubDate);
      return pubDate >= twoDaysAgo;
    });

    // Build XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    for (const article of recentArticles) {
      const articleSlug = generateArticleSlug(article.title, article.pubDate);
      const pubDate = new Date(article.pubDate);
      
      // Skip if invalid date
      if (isNaN(pubDate.getTime())) continue;
      
      // Format date for Google News (YYYY-MM-DDTHH:MM:SS+00:00)
      const formattedDate = pubDate.toISOString();
      
      // Extract keywords from title (simple extraction)
      const keywords = extractKeywords(article.title);
      
      // Add entry for each locale
      for (const locale of locales) {
        const lang = googleNewsLangMap[locale] || 'en';
        const url = `${BASE_URL}/${locale}/article/${articleSlug}`;
        
        xml += `  <url>
    <loc>${escapeXml(url)}</loc>
    <news:news>
      <news:publication>
        <news:name>Free Crypto News</news:name>
        <news:language>${lang}</news:language>
      </news:publication>
      <news:publication_date>${formattedDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
      ${keywords.length > 0 ? `<news:keywords>${escapeXml(keywords.join(', '))}</news:keywords>` : ''}
    </news:news>
`;
        
        // Add hreflang alternates
        for (const altLocale of locales) {
          const altUrl = `${BASE_URL}/${altLocale}/article/${articleSlug}`;
          const altLang = googleNewsLangMap[altLocale] || 'en';
          xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${escapeXml(altUrl)}"/>
`;
        }
        
        xml += `  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minute cache
      },
    });
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}

/**
 * Extract relevant keywords from article title
 */
function extractKeywords(title: string): string[] {
  const cryptoTerms = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain',
    'defi', 'nft', 'web3', 'solana', 'sol', 'xrp', 'ripple',
    'cardano', 'ada', 'dogecoin', 'doge', 'polygon', 'matic',
    'avalanche', 'avax', 'chainlink', 'link', 'uniswap', 'aave',
    'binance', 'coinbase', 'sec', 'regulation', 'etf', 'stablecoin',
    'usdt', 'usdc', 'tether', 'bull', 'bear', 'market', 'price',
    'trading', 'exchange', 'wallet', 'mining', 'staking', 'yield',
  ];
  
  const words = title.toLowerCase().split(/\s+/);
  const keywords: string[] = [];
  
  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cryptoTerms.includes(cleaned) && !keywords.includes(cleaned)) {
      keywords.push(cleaned);
    }
  }
  
  return keywords.slice(0, 10); // Max 10 keywords
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
