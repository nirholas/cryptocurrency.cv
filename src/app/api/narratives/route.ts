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
import { promptAIJson, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';

export const runtime = 'edge';
export const revalidate = 300;

interface Narrative {
  id: string;
  name: string;
  description: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100, how dominant this narrative is
  articles: {
    title: string;
    link: string;
    source: string;
  }[];
  relatedTickers: string[];
  keyPhrases: string[];
  emerging: boolean; // Is this a new/emerging narrative?
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '40'), 80);
  const emerging = searchParams.get('emerging') === 'true';

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    let data;
    try {
      data = await getLatestNews(limit);
    } catch (fetchErr) {
      console.error('Failed to fetch latest news for narratives:', fetchErr);
      return NextResponse.json(
        { error: 'News fetch temporarily unavailable', narratives: [] },
        { status: 503, headers: { 'Retry-After': '60' } }
      );
    }
    
    if (data.articles.length === 0) {
      return NextResponse.json({
        narratives: [],
        message: 'No articles to analyze',
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

    // Filter and sort narratives
    let narratives = result.narratives || [];
    
    if (emerging) {
      narratives = narratives.filter(n => n.emerging);
    }
    
    // Sort by strength
    narratives.sort((a, b) => b.strength - a.strength);

    // Calculate narrative diversity
    const bullishCount = narratives.filter(n => n.sentiment === 'bullish').length;
    const bearishCount = narratives.filter(n => n.sentiment === 'bearish').length;
    const neutralCount = narratives.filter(n => n.sentiment === 'neutral').length;

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
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Narrative analysis error:', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return NextResponse.json(
      { error: 'Failed to analyze narratives', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
