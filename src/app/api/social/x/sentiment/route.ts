/**
 * X/Twitter Sentiment Analysis API
 * 
 * Get real-time sentiment analysis from your influencer lists.
 * Uses Nitter RSS feeds (no API key required) + Groq AI for analysis.
 * 
 * GET /api/social/x/sentiment?list=default - Get sentiment for a list
 * GET /api/social/x/sentiment?list=default&refresh=true - Force refresh
 * 
 * @example Response:
 * {
 *   "aggregateSentiment": 0.42,
 *   "sentimentLabel": "bullish",
 *   "topTickers": [{ "ticker": "ETH", "mentions": 12, "sentiment": 0.6 }],
 *   "recentTweets": [...]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchListSentiment,
  getInfluencerList,
  SentimentResult,
  DEFAULT_CRYPTO_INFLUENCERS,
} from '@/lib/x-scraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer execution for scraping

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const listId = searchParams.get('list') || 'default';
  const forceRefresh = searchParams.get('refresh') === 'true';
  const tweetsPerUser = Math.min(
    parseInt(searchParams.get('tweets') || '10', 10),
    20
  );

  try {
    // Check if list exists
    const list = await getInfluencerList(listId);
    if (!list) {
      return NextResponse.json(
        {
          success: false,
          error: `List not found: ${listId}`,
          hint: 'Use GET /api/social/x/lists to see available lists',
        },
        { status: 404 }
      );
    }

    // Fetch and analyze sentiment
    const result = await fetchListSentiment(listId, {
      forceRefresh,
      tweetsPerUser,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sentiment' },
        { status: 500 }
      );
    }

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        listId: result.listId,
        listName: result.listName,
        sentiment: {
          score: parseFloat(result.aggregateSentiment.toFixed(3)),
          label: result.sentimentLabel,
          confidence: parseFloat(result.confidence.toFixed(2)),
          description: getSentimentDescription(result.aggregateSentiment),
        },
        stats: {
          tweetsAnalyzed: result.tweetCount,
          influencersTracked: result.userBreakdown.length,
          lastUpdated: result.lastUpdated,
        },
        topTickers: result.topTickers,
        userBreakdown: result.userBreakdown,
        recentTweets: result.recentTweets.map((t) => ({
          id: t.id,
          username: t.username,
          content: t.content,
          timestamp: t.timestamp,
          sentiment: t.sentiment,
        })),
      },
      meta: {
        cached: !forceRefresh,
        endpoint: '/api/social/x/sentiment',
        refreshParam: '?refresh=true to force fresh data',
        cronEndpoint: '/api/cron/x-sentiment',
      },
    });
  } catch (error) {
    console.error('Sentiment API error:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch sentiment data',
      message: 'X/Twitter API or Nitter instances unavailable',
      meta: {
        endpoint: '/api/social/x/sentiment',
      },
    }, { status: 503 });
  }
}

function getSentimentDescription(score: number): string {
  if (score >= 0.6) return 'Very bullish - Strong positive momentum in influencer sentiment';
  if (score >= 0.3) return 'Bullish - Positive outlook from tracked influencers';
  if (score >= 0.1) return 'Slightly bullish - Mild optimism in the market';
  if (score >= -0.1) return 'Neutral - Mixed signals from influencers';
  if (score >= -0.3) return 'Slightly bearish - Some caution in the market';
  if (score >= -0.6) return 'Bearish - Negative sentiment trending';
  return 'Very bearish - Strong negative momentum in influencer sentiment';
}
