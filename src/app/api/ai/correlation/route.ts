/**
 * News-Price Correlation API
 * 
 * Detects potential correlations between news articles and price movements.
 * Helps identify which news may have caused market moves.
 * 
 * GET /api/ai/correlation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { detectNewsPriceCorrelation, type NewsArticle } from '@/lib/ai-intelligence';
import { isGroqConfigured } from '@/lib/groq';
import { getTopCoins } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 120;

export async function GET(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  try {
    // Fetch recent news and price data in parallel
    const [newsData, priceData] = await Promise.all([
      getLatestNews(50),
      getTopCoins(50),
    ]);

    const articles: NewsArticle[] = newsData.articles.map(a => ({
      title: a.title,
      description: a.description,
      source: a.source,
      pubDate: a.pubDate,
      link: a.link,
      category: a.category,
    }));

    const prices = priceData.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      change1h: coin.price_change_percentage_24h || 0,
      change24h: coin.price_change_percentage_24h || 0,
      price: coin.current_price,
    }));

    // Detect correlations
    const result = await detectNewsPriceCorrelation(articles, prices);

    // Find significant movers
    const significantMovers = prices
      .filter(p => Math.abs(p.change1h) > 3 || Math.abs(p.change24h) > 10)
      .sort((a, b) => Math.abs(b.change1h) - Math.abs(a.change1h))
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      correlations: result.correlations,
      summary: result.summary,
      significantMovers,
      articlesAnalyzed: articles.length,
      coinsAnalyzed: prices.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Correlation API error:', error);
    return NextResponse.json(
      { error: 'Failed to detect correlations', details: String(error) },
      { status: 500 }
    );
  }
}
