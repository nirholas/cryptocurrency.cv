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
 * Portfolio News Relevance API
 * 
 * Scores news articles by relevance to user's portfolio holdings.
 * Identifies which news matters most to your investments.
 * 
 * POST /api/ai/portfolio-news
 * Body: { holdings: [{ symbol, name, allocation }] }
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { scorePortfolioRelevance, type NewsArticle } from '@/lib/ai-intelligence';
import { isAIConfigured, isAIUnavailableError } from '@/lib/ai-provider';
import { aiAuthErrorResponse, aiNotConfiguredResponse } from '@/app/api/_utils';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'edge';
export const revalidate = 60;

interface HoldingInput {
  symbol: string;
  name: string;
  allocation: number; // 0-1
}

export async function POST(request: NextRequest) {
  if (!isAIConfigured()) {
    return aiNotConfiguredResponse();
  }

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { holdings } = body as { holdings: HoldingInput[] };

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return NextResponse.json(
        { 
          error: 'holdings array is required',
          example: {
            holdings: [
              { symbol: 'BTC', name: 'Bitcoin', allocation: 0.5 },
              { symbol: 'ETH', name: 'Ethereum', allocation: 0.3 },
              { symbol: 'SOL', name: 'Solana', allocation: 0.2 },
            ]
          }
        },
        { status: 400 }
      );
    }

    // Validate holdings
    const validHoldings = holdings.filter(h => 
      h.symbol && h.name && typeof h.allocation === 'number'
    );

    if (validHoldings.length === 0) {
      return NextResponse.json(
        { error: 'No valid holdings provided. Each holding needs symbol, name, and allocation.' },
        { status: 400 }
      );
    }

    // Fetch recent news
    const data = await getLatestNews(50);
    
    const articles: NewsArticle[] = data.articles.map(a => ({
      title: a.title,
      description: a.description,
      source: a.source,
      pubDate: a.pubDate,
      link: a.link,
      category: a.category,
    }));

    // Score articles by relevance
    const relevanceScores = await scorePortfolioRelevance(articles, validHoldings);

    // Sort by relevance score
    const sortedScores = relevanceScores.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Group by urgency
    const immediate = sortedScores.filter(s => s.urgency === 'immediate');
    const important = sortedScores.filter(s => s.urgency === 'important');
    const informational = sortedScores.filter(s => s.urgency === 'informational');

    return NextResponse.json({
      success: true,
      portfolioSize: validHoldings.length,
      articlesAnalyzed: articles.length,
      relevantArticles: sortedScores.length,
      byUrgency: {
        immediate: immediate.length,
        important: important.length,
        informational: informational.length,
      },
      articles: {
        immediate,
        important,
        informational,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Portfolio news API error:', error);
    // Every provider out of quota or rejecting the key: retryable upstream outage, not a handler fault.
    if (isAIUnavailableError(error)) return aiAuthErrorResponse((error as Error).message);
    return NextResponse.json(
      { error: 'Failed to analyze portfolio relevance', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for demo/testing
export async function GET(request: NextRequest) {
  // Demo portfolio for testing
  const demoHoldings: HoldingInput[] = [
    { symbol: 'BTC', name: 'Bitcoin', allocation: 0.4 },
    { symbol: 'ETH', name: 'Ethereum', allocation: 0.3 },
    { symbol: 'SOL', name: 'Solana', allocation: 0.15 },
    { symbol: 'LINK', name: 'Chainlink', allocation: 0.1 },
    { symbol: 'MATIC', name: 'Polygon', allocation: 0.05 },
  ];

  // Create a fake request with demo data
  const fakeRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify({ holdings: demoHoldings }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(fakeRequest as NextRequest);
}
