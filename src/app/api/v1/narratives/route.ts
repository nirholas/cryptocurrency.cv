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
 * GET /api/v1/narratives
 *
 * Premium API v1 - Market Narratives Analysis Endpoint
 * Uses AI to identify dominant narratives and themes in crypto news.
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

const ENDPOINT = '/api/v1/narratives';

interface Narrative {
  id: string;
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  articles: {
    title: string;
    link: string;
    source: string;
  }[];
  relatedTickers: string[];
  keyPhrases: string[];
  emerging: boolean;
}

interface NarrativesResponse {
  narratives: Narrative[];
}

const SYSTEM_PROMPT = `You are a crypto market narrative analyst. Identify the dominant narratives and themes in crypto news.

Narratives are recurring themes/stories that drive market sentiment, such as:
- "Institutional adoption" (BlackRock, ETFs, etc.)
- "Regulatory crackdown" (SEC lawsuits, etc.)
- "DeFi summer 2.0" (new protocols, yields)
- "Bitcoin as digital gold" (inflation hedge)
- "Layer 2 scaling" (Arbitrum, Optimism growth)
- "AI x Crypto convergence" (AI tokens, compute)

For each narrative you identify:
- id: Short snake_case identifier
- name: Human-readable name
- description: 1-2 sentence description
- sentiment: Market impact (bullish/bearish/neutral)
- strength: 0-100, based on how many articles mention it
- articles: Which articles support this narrative
- relatedTickers: Cryptocurrencies most affected
- keyPhrases: Common phrases used in this narrative
- emerging: true if this seems like a new/growing narrative

Identify 3-7 narratives. Group similar articles under the same narrative.

Respond with JSON: { "narratives": [...] }`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 80);
  const emerging = searchParams.get('emerging') === 'true';

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    logger.info('Fetching narrative analysis', { limit, emerging });

    const data = await getLatestNews(limit);

    if (data.articles.length === 0) {
      return NextResponse.json({
        narratives: [],
        message: 'No articles to analyze',
        version: 'v1',
      });
    }

    const articlesForAnalysis = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
      description: a.description || '',
    }));

    const userPrompt = `Identify dominant narratives in these ${articlesForAnalysis.length} crypto news articles:

${JSON.stringify(articlesForAnalysis, null, 2)}`;

    const result = await promptAIJson<NarrativesResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 4000, temperature: 0.4 }
    );

    let narratives = result.narratives || [];

    if (emerging) {
      narratives = narratives.filter(n => n.emerging);
    }

    narratives.sort((a, b) => b.strength - a.strength);

    const bullishCount = narratives.filter(n => n.sentiment === 'bullish').length;
    const bearishCount = narratives.filter(n => n.sentiment === 'bearish').length;
    const neutralCount = narratives.filter(n => n.sentiment === 'neutral').length;

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        narratives,
        summary: {
          total: narratives.length,
          emerging: narratives.filter(n => n.emerging).length,
          sentimentBalance: {
            bullish: bullishCount,
            bearish: bearishCount,
            neutral: neutralCount,
          },
          dominantNarrative: narratives[0]?.name || 'None identified',
        },
        articlesAnalyzed: data.articles.length,
        analyzedAt: new Date().toISOString(),
        version: 'v1',
        meta: {
          endpoint: ENDPOINT,
          timestamp: new Date().toISOString(),
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
    logger.error('Failed to analyze narratives', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return ApiError.internal('Failed to analyze narratives', error);
  }
}
