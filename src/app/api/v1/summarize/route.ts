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
 * GET /api/v1/summarize
 *
 * Premium API v1 - News Summarization Endpoint
 * Returns AI-generated summaries of crypto news articles.
 * Requires x402 payment or valid API key.
 *
 * @price $0.003 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getLatestNews } from '@/lib/crypto-news';
import { promptAIJson, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';

export const runtime = 'edge';
export const revalidate = 60;

const ENDPOINT = '/api/v1/summarize';

interface ArticleSummary {
  title: string;
  link: string;
  source: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface SummaryResponse {
  summaries: ArticleSummary[];
}

const STYLES: Record<string, string> = {
  brief: 'Provide a 1-2 sentence summary for each article.',
  detailed: 'Provide a detailed 3-5 sentence summary with key facts and figures.',
  bullet: 'Provide 3-5 bullet point summaries for each article.',
};

const SYSTEM_PROMPT = `You are a crypto news summarizer. Summarize the provided articles concisely and accurately.
For each article provide: summary, keyPoints (array of 2-4 key takeaways), and sentiment.
Respond with JSON: { "summaries": [...] }`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);
  const source = searchParams.get('source') || undefined;
  const style = searchParams.get('style') || 'brief';

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  const styleInstruction = STYLES[style] || STYLES.brief;

  try {
    logger.info('Summarizing articles', { limit, source, style });

    const data = await getLatestNews(limit, source);

    if (data.articles.length === 0) {
      return NextResponse.json({
        summaries: [],
        version: 'v1',
        meta: { endpoint: ENDPOINT, count: 0, timestamp: new Date().toISOString() },
      });
    }

    const articlesInput = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
      description: a.description || '',
    }));

    const result = await promptAIJson<SummaryResponse>(
      SYSTEM_PROMPT,
      `${styleInstruction}\n\nArticles:\n${JSON.stringify(articlesInput, null, 2)}`,
      { maxTokens: 3000, temperature: 0.3 }
    );

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        summaries: result.summaries || [],
        style,
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          count: (result.summaries || []).length,
          style,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
          'X-Data-Source': 'AI',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to summarize articles', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return ApiError.internal('Failed to summarize articles', error);
  }
}
