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
  /** Index references the model returns; re-hydrated into `articles` before responding. */
  articleIndexes?: number[];
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
- articleIndexes: The "i" indexes of the articles supporting this narrative (numbers only)
- relatedTickers: Cryptocurrencies most affected
- keyPhrases: Common phrases used in this narrative
- emerging: true if this seems like a new/growing narrative

Identify 3-7 narratives. Group similar articles under the same narrative.

Respond with JSON: { "narratives": [...] }`;

/** Longest article title kept in the prompt. */
const MAX_TITLE_CHARS = 140;
/** Longest article summary kept in the prompt. */
const MAX_DESCRIPTION_CHARS = 220;

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}\u2026`;
}

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
        { status: 503, headers: { 'Retry-After': '60' } },
      );
    }

    if (data.articles.length === 0) {
      return NextResponse.json({
        narratives: [],
        message: 'No articles to analyze',
      });
    }

    // Keep the prompt inside the smallest context window in the provider chain.
    // Sending 40 articles with full descriptions, absolute links and pretty-
    // printed JSON pushed the request to ~9.4k tokens, over the 8k/minute cap
    // on the free Groq tier, so every call 413'd and the page never rendered a
    // narrative. Articles are referenced by index and re-hydrated from
    // `data.articles` below, so the model never has to echo a URL back.
    const articlesForAnalysis = data.articles.map((a, i) => ({
      i,
      title: truncate(a.title, MAX_TITLE_CHARS),
      source: a.source,
      summary: truncate(a.description || '', MAX_DESCRIPTION_CHARS),
    }));

    const userPrompt = `Identify dominant narratives in these ${articlesForAnalysis.length} crypto news articles.
Reference each supporting article by its "i" index only.

${JSON.stringify(articlesForAnalysis)}`;

    const result = await promptAIJson<NarrativesResponse>(SYSTEM_PROMPT, userPrompt, {
      maxTokens: 2000,
      temperature: 0.4,
    });

    // Re-hydrate the index references into the full article shape the UI reads.
    let narratives = (result.narratives || []).map((n) => ({
      ...n,
      articles: (n.articleIndexes ?? [])
        .map((i) => data.articles[i])
        .filter(Boolean)
        .map((a) => ({ title: a.title, link: a.link, source: a.source })),
      articleIndexes: undefined,
    }));

    if (emerging) {
      narratives = narratives.filter((n) => n.emerging);
    }

    // Sort by strength
    narratives.sort((a, b) => b.strength - a.strength);

    // Calculate narrative diversity
    const bullishCount = narratives.filter((n) => n.sentiment === 'bullish').length;
    const bearishCount = narratives.filter((n) => n.sentiment === 'bearish').length;
    const neutralCount = narratives.filter((n) => n.sentiment === 'neutral').length;

    return NextResponse.json(
      {
        narratives,
        summary: {
          total: narratives.length,
          emerging: narratives.filter((n) => n.emerging).length,
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
      },
    );
  } catch (error) {
    console.error('Narrative analysis error:', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return NextResponse.json(
      {
        error: 'Failed to analyze narratives',
        narratives: [],
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 503, headers: { 'Retry-After': '120' } },
    );
  }
}
