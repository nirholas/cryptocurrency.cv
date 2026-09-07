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
  /**
   * Percent change in mentions between the newer and older half of the
   * window, or null when the older half has nothing to compare against.
   * Consumers used to invent this number client-side.
   */
  change: number | null;
}

// Common crypto topics to track.
//
// Every pattern is word-anchored on purpose. The unanchored versions matched
// inside ordinary words and made the feed nonsense: /ai/ hit "pair", "said" and
// "against", /sec/ hit "second" and "sector", /ada/ hit "Canada", /sol/ hit
// "resolve", and /eth(?!er)/ hit "method". A regulator's pension notice was
// ranking as the day's top "AI" story.
const TRACKED_TOPICS = [
  { pattern: /\b(bitcoin|btc)\b/i, name: 'Bitcoin' },
  { pattern: /\b(ethereum|eth)\b/i, name: 'Ethereum' },
  { pattern: /\b(solana|sol)\b/i, name: 'Solana' },
  { pattern: /\b(xrp|ripple)\b/i, name: 'XRP' },
  { pattern: /\b(cardano|ada)\b/i, name: 'Cardano' },
  { pattern: /\b(dogecoin|doge)\b/i, name: 'Dogecoin' },
  { pattern: /\b(polygon|matic)\b/i, name: 'Polygon' },
  { pattern: /\b(avalanche|avax)\b/i, name: 'Avalanche' },
  { pattern: /\b(chainlink|link token)\b/i, name: 'Chainlink' },
  { pattern: /\b(defi|decentrali[sz]ed finance)\b/i, name: 'DeFi' },
  { pattern: /\b(nfts?|non.?fungible)\b/i, name: 'NFTs' },
  { pattern: /\betfs?\b/i, name: 'ETF' },
  { pattern: /\b(sec|securities and exchange|regulator[sy]|regulation)\b/i, name: 'SEC/Regulation' },
  { pattern: /\b(stablecoins?|usdt|usdc|tether)\b/i, name: 'Stablecoins' },
  { pattern: /\b(layer.?2|l2|rollups?|optimism|arbitrum)\b/i, name: 'Layer 2' },
  { pattern: /\b(ai|artificial intelligence|machine learning)\b/i, name: 'AI' },
  { pattern: /\b(hacks?|hacked|exploits?|breach(es)?)\b/i, name: 'Security' },
  { pattern: /\bairdrops?\b/i, name: 'Airdrops' },
  { pattern: /\b(memecoins?|meme coins?)\b/i, name: 'Memecoins' },
  { pattern: /\b(binance|bnb)\b/i, name: 'Binance' },
  { pattern: /\bcoinbase\b/i, name: 'Coinbase' },
  { pattern: /\b(blackrock|fidelity|grayscale)\b/i, name: 'Institutions' },
];

// Sentiment keywords
const BULLISH_WORDS = [
  'surge',
  'soar',
  'rally',
  'bullish',
  'gains',
  'ath',
  'high',
  'pump',
  'moon',
  'breakthrough',
  'adoption',
  'approval',
  'launch',
  'partnership',
];
const BEARISH_WORDS = [
  'crash',
  'plunge',
  'bearish',
  'dump',
  'decline',
  'drop',
  'low',
  'sell',
  'fear',
  'hack',
  'exploit',
  'lawsuit',
  'ban',
  'delay',
  'reject',
];

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

export const GET = instrumented(
  async function GET(request: NextRequest) {
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
      const recentArticles = articles.filter((a) => {
        try {
          return new Date(a.pubDate) > cutoffTime;
        } catch {
          return false;
        }
      });

      // Count topic mentions, split at the midpoint of the window so momentum
      // is measured rather than guessed.
      const midpoint = new Date(Date.now() - (hours / 2) * 60 * 60 * 1000);
      const topicCounts = new Map<
        string,
        { count: number; recent: number; earlier: number; headlines: string[]; texts: string[] }
      >();

      for (const article of recentArticles) {
        const searchText = `${article.title} ${article.description || ''}`;
        const isRecentHalf = new Date(article.pubDate) > midpoint;

        for (const { pattern, name } of TRACKED_TOPICS) {
          if (pattern.test(searchText)) {
            const existing =
              topicCounts.get(name) ||
              { count: 0, recent: 0, earlier: 0, headlines: [] as string[], texts: [] as string[] };
            existing.count++;
            if (isRecentHalf) existing.recent++;
            else existing.earlier++;
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
          change:
            data.earlier > 0
              ? Math.round(((data.recent - data.earlier) / data.earlier) * 100)
              : null,
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
          },
        );
      }

      return ApiError.internal('Failed to get trending topics', error);
    }
  },
  { name: 'trending' },
);
