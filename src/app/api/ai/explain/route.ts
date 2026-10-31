/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * "Why is X Trending?" API
 * 
 * AI-powered explanation for why a topic is trending in crypto news.
 * Provides context, background, and market implications.
 * 
 * GET /api/ai/explain?topic=Bitcoin
 * GET /api/ai/explain?topic=ETF&includePrice=true
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { explainTrending } from '@/lib/ai-intelligence';
import { isAIConfigured, isAIUnavailableError } from '@/lib/ai-provider';
import { aiAuthErrorResponse, aiNotConfiguredResponse } from '@/app/api/_utils';
import { getTopCoins } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 120;

// Topic patterns for matching
const TOPIC_PATTERNS: Record<string, RegExp> = {
  'bitcoin': /bitcoin|btc/i,
  'ethereum': /ethereum|eth(?!er)/i,
  'solana': /solana|sol(?!id|ution)/i,
  'xrp': /xrp|ripple/i,
  'cardano': /cardano|ada/i,
  'dogecoin': /dogecoin|doge/i,
  'polygon': /polygon|matic/i,
  'avalanche': /avalanche|avax/i,
  'chainlink': /chainlink|link/i,
  'defi': /defi|decentralized finance/i,
  'nft': /nft|non.?fungible/i,
  'etf': /etf/i,
  'sec': /sec|securities|regulation/i,
  'stablecoin': /stablecoin|usdt|usdc|tether/i,
  'layer2': /layer.?2|l2|rollup|optimism|arbitrum/i,
  'ai': /\bai\b|artificial intelligence/i,
  'security': /hack|exploit|breach|security/i,
  'airdrop': /airdrop/i,
  'memecoin': /memecoin|meme coin|pepe|shib/i,
  'binance': /binance|bnb/i,
  'coinbase': /coinbase/i,
  'institutions': /blackrock|fidelity|grayscale|institution/i,
};

export async function GET(request: NextRequest) {
  if (!isAIConfigured()) {
    return aiNotConfiguredResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get('topic');
  const includePrice = searchParams.get('includePrice') === 'true';

  if (!topic) {
    return NextResponse.json(
      { 
        error: 'topic parameter is required',
        example: '/api/ai/explain?topic=Bitcoin',
        availableTopics: Object.keys(TOPIC_PATTERNS),
      },
      { status: 400 }
    );
  }

  try {
    // Find matching pattern or create one
    const topicLower = topic.toLowerCase();
    const pattern = TOPIC_PATTERNS[topicLower] || new RegExp(topic, 'i');

    // Fetch recent news
    const data = await getLatestNews(100);
    
    // Filter articles mentioning this topic
    const relevantArticles = data.articles.filter(a => 
      pattern.test(a.title) || pattern.test(a.description || '')
    );

    if (relevantArticles.length === 0) {
      return NextResponse.json({
        success: false,
        topic,
        message: `No recent news found about "${topic}"`,
        suggestion: 'Try a different topic or check available topics',
        availableTopics: Object.keys(TOPIC_PATTERNS),
      });
    }

    const headlines = relevantArticles.map(a => a.title);

    // Get price data if requested
    let priceChange24h: number | undefined;
    if (includePrice) {
      try {
        const coins = await getTopCoins(100);
        const coin = coins.find(c => 
          c.symbol.toLowerCase() === topicLower ||
          c.name.toLowerCase() === topicLower ||
          pattern.test(c.name)
        );
        if (coin) {
          priceChange24h = coin.price_change_percentage_24h;
        }
      } catch {
        // Price data optional, continue without it
      }
    }

    // Generate explanation
    const explanation = await explainTrending(
      topic,
      headlines,
      relevantArticles.length,
      priceChange24h
    );

    return NextResponse.json({
      success: true,
      explanation,
      articleCount: relevantArticles.length,
      recentHeadlines: headlines.slice(0, 5),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Explain API error:', error);
    // Every provider out of quota or rejecting the key: retryable upstream outage, not a handler fault.
    if (isAIUnavailableError(error)) return aiAuthErrorResponse((error as Error).message);
    return NextResponse.json(
      { error: 'Failed to generate explanation', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
