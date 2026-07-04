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
 * GET /api/v1/digest
 *
 * Premium API v1 - AI Daily Digest Endpoint
 * Returns an AI-generated daily digest of crypto market news and analysis.
 * Requires x402 payment or valid API key.
 *
 * @price $0.005 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getLatestNews } from '@/lib/crypto-news';
import { promptAIJson, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';

export const runtime = 'nodejs';
export const revalidate = 300;

const ENDPOINT = '/api/v1/digest';

interface DigestSection {
  title: string;
  summary: string;
  articles: { title: string; link: string; source: string }[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface DigestResponse {
  headline: string;
  tldr: string;
  sections: DigestSection[];
  mustRead: { title: string; link: string; source: string; why: string }[];
  marketMood: string;
  tickers: { symbol: string; sentiment: string; mention_count: number }[];
}

const SYSTEM_PROMPT = `You are a crypto market analyst creating a daily digest. Analyze the provided news articles and produce a structured daily digest.

Include:
- headline: A catchy one-line market headline
- tldr: 2-3 sentence executive summary
- sections: Group articles into thematic sections (Bitcoin, DeFi, Regulation, etc.)
- mustRead: Top 3-5 must-read articles with reasons why
- marketMood: One word/phrase capturing the day's mood
- tickers: Most mentioned tickers with sentiment

Respond with JSON matching the schema exactly.`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    logger.info('Generating daily digest', { limit });

    const data = await getLatestNews(limit);

    if (data.articles.length === 0) {
      return NextResponse.json({
        headline: 'No news available',
        tldr: 'No articles found for digest generation.',
        sections: [],
        mustRead: [],
        marketMood: 'quiet',
        tickers: [],
        version: 'v1',
        meta: { endpoint: ENDPOINT, articlesAnalyzed: 0, timestamp: new Date().toISOString() },
      });
    }

    const articlesForAnalysis = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
      description: a.description || '',
      timeAgo: a.timeAgo,
    }));

    const result = await promptAIJson<DigestResponse>(
      SYSTEM_PROMPT,
      `Create a daily digest from these ${articlesForAnalysis.length} articles:\n\n${JSON.stringify(articlesForAnalysis, null, 2)}`,
      { maxTokens: 4000, temperature: 0.4 }
    );

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        ...result,
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          articlesAnalyzed: data.articles.length,
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'AI',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to generate digest', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return ApiError.internal('Failed to generate digest', error);
  }
}
