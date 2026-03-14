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
import { getLatestNews } from '@/lib/crypto-news';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { staleCache, generateCacheKey } from '@/lib/cache';
import { instrumented } from '@/lib/telemetry-middleware';

export const runtime = 'edge';
export const revalidate = 300; // 5 minutes — trending topics don't change minute-to-minute

interface TrendingTopic {
  topic: string;
  count: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recentHeadlines: string[];
}

// Common crypto topics to track
const TRACKED_TOPICS = [
  { pattern: /bitcoin|btc/i, name: 'Bitcoin' },
  { pattern: /ethereum|eth(?!er)/i, name: 'Ethereum' },
  { pattern: /solana|sol(?!id|ution)/i, name: 'Solana' },
  { pattern: /xrp|ripple/i, name: 'XRP' },
  { pattern: /cardano|ada/i, name: 'Cardano' },
  { pattern: /dogecoin|doge/i, name: 'Dogecoin' },
  { pattern: /polygon|matic/i, name: 'Polygon' },
  { pattern: /avalanche|avax/i, name: 'Avalanche' },
  { pattern: /chainlink|link/i, name: 'Chainlink' },
  { pattern: /defi|decentralized finance/i, name: 'DeFi' },
  { pattern: /nft|non.?fungible/i, name: 'NFTs' },
  { pattern: /etf/i, name: 'ETF' },
  { pattern: /sec|securities/i, name: 'SEC/Regulation' },
  { pattern: /stablecoin|usdt|usdc|tether/i, name: 'Stablecoins' },
  { pattern: /layer.?2|l2|rollup/i, name: 'Layer 2' },
  { pattern: /ai|artificial intelligence/i, name: 'AI' },
  { pattern: /hack|exploit|breach/i, name: 'Security' },
  { pattern: /airdrop/i, name: 'Airdrops' },
  { pattern: /memecoin|meme coin/i, name: 'Memecoins' },
  { pattern: /binance|bnb/i, name: 'Binance' },
  { pattern: /coinbase/i, name: 'Coinbase' },
  { pattern: /blackrock|fidelity|grayscale/i, name: 'Institutions' },
];

// Sentiment keywords
const BULLISH_WORDS = ['surge', 'soar', 'rally', 'bullish', 'gains', 'ath', 'high', 'pump', 'moon', 'breakthrough', 'adoption', 'approval', 'launch', 'partnership'];
const BEARISH_WORDS = ['crash', 'plunge', 'bearish', 'dump', 'decline', 'drop', 'low', 'sell', 'fear', 'hack', 'exploit', 'lawsuit', 'ban', 'delay', 'reject'];

function analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const lowerText = text.toLowerCase();
  let bullishScore = 0;
  let bearishScore = 0;
  
  for (const word of BULLISH_WORDS) {
    if (lowerText.includes(word)) bullishScore++;
  }
  for (const word of BEARISH_WORDS) {
    if (lowerText.includes(word)) bearishScore++;
  }
  
  if (bullishScore > bearishScore + 1) return 'bullish';
  if (bearishScore > bullishScore + 1) return 'bearish';
  return 'neutral';
}

export const GET = instrumented(async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const limitRaw = parseInt(searchParams.get('limit') || '10');
  const hoursRaw = parseInt(searchParams.get('hours') || '24');
  const limit = Math.min(Number.isNaN(limitRaw) ? 10 : Math.max(1, limitRaw), 20);
  const hours = Math.min(Number.isNaN(hoursRaw) ? 24 : Math.max(1, hoursRaw), 72);
  
  logger.info('Fetching trending topics', { limit, hours });
  
  try {
    // Fetch recent news
    const data = await getLatestNews(100);
    const articles = data?.articles ?? [];
    
    // Filter by time window
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentArticles = articles.filter(a => {
      try {
        return new Date(a.pubDate) > cutoffTime;
      } catch {
        return false;
      }
    });
    
    // Count topic mentions
    const topicCounts = new Map<string, { count: number; headlines: string[]; texts: string[] }>();
    
    for (const article of recentArticles) {
      const searchText = `${article.title} ${article.description || ''}`;
      
      for (const { pattern, name } of TRACKED_TOPICS) {
        if (pattern.test(searchText)) {
          const existing = topicCounts.get(name) || { count: 0, headlines: [], texts: [] };
          existing.count++;
          if (existing.headlines.length < 3) {
            existing.headlines.push(article.title);
          }
          existing.texts.push(searchText);
          topicCounts.set(name, existing);
        }
      }
    }
    
    // Convert to array and sort by count
    const trending: TrendingTopic[] = Array.from(topicCounts.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sentiment: analyzeSentiment(data.texts.join(' ')),
        recentHeadlines: data.headlines,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
    
    const responseData = {
      trending,
      timeWindow: `${hours}h`,
      articlesAnalyzed: recentArticles.length,
      fetchedAt: new Date().toISOString(),
      _timing: { durationMs: Date.now() - startTime },
    };

    // Persist into stale cache for fallback on future errors
    const staleCacheKey = generateCacheKey('trending', { limit, hours });
    staleCache.set(staleCacheKey, responseData, 3600);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    logger.error('Failed to get trending topics', error);

    // Stale-on-error: serve last-known-good data
    const staleCacheKey = generateCacheKey('trending', { limit, hours });
    const stale = staleCache.get<Record<string, unknown>>(staleCacheKey);
    if (stale) {
      logger.info('Serving stale trending data after upstream failure');
      return NextResponse.json(
        { ...stale, _stale: true },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return ApiError.internal('Failed to get trending topics', error);
  }
}
