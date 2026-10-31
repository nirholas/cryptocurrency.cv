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
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';
import { getTopCoins, type TokenPrice } from '@/lib/market-data';
import { intParam } from '@/lib/query-params';

interface NewsOnChainCorrelation {
  article: {
    title: string;
    source: string;
    pub_date: string;
  };
  related_events: {
    type: string;
    asset: string;
    description: string;
    timestamp: string;
    magnitude: string;
  }[];
  correlation_score: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = intParam(searchParams, 'hours', { fallback: 24, min: 1, max: 168 });
    
    // Get recent news
    const newsResponse = await getLatestNews(50);
    const recentNews = newsResponse.articles;
    
    // Get market data for context
    const coins = await getTopCoins(20);
    
    // Find significant price movements (> 5% in 24h)
    const significantMoves = coins.filter((c: TokenPrice) => 
      Math.abs(c.price_change_percentage_24h || 0) > 5
    );
    
    // Correlate news with on-chain events
    const correlations: NewsOnChainCorrelation[] = recentNews.slice(0, 20).map((article: NewsArticle) => {
      const relatedEvents: NewsOnChainCorrelation['related_events'] = [];
      const titleLower = article.title.toLowerCase();
      
      // Check for price movement correlations
      significantMoves.forEach(coin => {
        if (titleLower.includes(coin.symbol.toLowerCase()) || 
            titleLower.includes(coin.name.toLowerCase())) {
          relatedEvents.push({
            type: 'price_movement',
            asset: coin.symbol,
            description: `${coin.price_change_percentage_24h > 0 ? '+' : ''}${coin.price_change_percentage_24h?.toFixed(2)}% in 24h`,
            timestamp: new Date().toISOString(),
            magnitude: Math.abs(coin.price_change_percentage_24h || 0) > 10 ? 'high' : 'medium'
          });
        }
      });
      
      // Check for keywords indicating on-chain events
      const eventKeywords = {
        'whale': { type: 'whale_movement', description: 'Large wallet activity detected' },
        'transfer': { type: 'transfer', description: 'Significant transfer reported' },
        'exchange': { type: 'exchange_flow', description: 'Exchange inflow/outflow' },
        'liquidat': { type: 'liquidation', description: 'Liquidation event' },
        'mint': { type: 'token_mint', description: 'Token minting activity' },
        'burn': { type: 'token_burn', description: 'Token burning activity' },
        'hack': { type: 'security', description: 'Security incident reported' },
        'bridge': { type: 'bridge', description: 'Cross-chain bridge activity' }
      };
      
      Object.entries(eventKeywords).forEach(([keyword, event]) => {
        if (titleLower.includes(keyword)) {
          relatedEvents.push({
            type: event.type,
            asset: 'CRYPTO',
            description: event.description,
            timestamp: article.pubDate || new Date().toISOString(),
            magnitude: 'medium'
          });
        }
      });
      
      return {
        article: {
          title: article.title,
          source: article.source || 'Unknown',
          pub_date: article.pubDate || new Date().toISOString()
        },
        related_events: relatedEvents,
        correlation_score: Math.min(relatedEvents.length * 0.25, 1)
      };
    }).filter(c => c.related_events.length > 0);
    
    return NextResponse.json({
      analysis_period: `${hours} hours`,
      total_news_analyzed: recentNews.length,
      correlations_found: correlations.length,
      significant_price_moves: significantMoves.length,
      correlations
    });
  } catch (error) {
    console.error('News-OnChain correlation error:', error);
    return NextResponse.json({ error: 'Correlation analysis failed' }, { status: 500 });
  }
}
