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
import { getLatestNews, type NewsArticle } from '@/lib/crypto-news';
import { promptAIJson, isAIConfigured } from '@/lib/ai-provider';
import { aiCache, generateCacheKey, withCache } from '@/lib/cache';
import { keywordNarratives, type Narrative } from '@/lib/keyword-narratives';

export const runtime = 'edge';
export const revalidate = 300;

/** A narrative as the model returns it, before article indexes are re-hydrated. */
interface ModelNarrative extends Omit<Narrative, 'articles'> {
  articleIndexes?: number[];
}

interface NarrativesResponse {
  narratives: ModelNarrative[];
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

/**
 * How long one narrative analysis is reused. The prompt costs ~4k tokens, so
 * re-running it on every request spent the provider's daily budget; the cache
 * also serves the last good analysis for up to an hour while providers are down.
 */
const ANALYSIS_TTL_SECONDS = 300;

/**
 * Edge cache time for a keyword answer, so callers pick up the AI analysis
 * soon after a provider recovers.
 */
const DEGRADED_CACHE_SECONDS = 60;

const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 80;

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}\u2026`;
}

interface NarrativeAnalysis {
  narratives: Narrative[];
  articlesAnalyzed: number;
  analyzedAt: string;
  method: 'ai' | 'keyword';
}

/**
 * Ask the model for the narratives in `articles` and re-hydrate its index
 * references into article objects. The result is what gets cached, so a cache
 * hit never resolves old indexes against a newer article list.
 */
async function analyzeNarratives(articles: NewsArticle[]): Promise<NarrativeAnalysis> {
  // Keep the prompt inside the smallest context window in the provider chain.
  // Sending 40 articles with full descriptions, absolute links and pretty-
  // printed JSON pushed the request to ~9.4k tokens, over the 8k/minute cap
  // on the free Groq tier, so every call 413'd and the page never rendered a
  // narrative. Articles are referenced by index and re-hydrated below, so the
  // model never has to echo a URL back.
  const articlesForAnalysis = articles.map((a, i) => ({
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

  const narratives = (result?.narratives || []).map(({ articleIndexes, ...n }) => ({
    ...n,
    articles: (Array.isArray(articleIndexes) ? articleIndexes : [])
      .map((i) => articles[i])
      .filter(Boolean)
      .map((a) => ({ title: a.title, link: a.link, source: a.source })),
  }));

  return { narratives, articlesAnalyzed: articles.length, analyzedAt: new Date().toISOString(), method: 'ai' };
}

function keywordAnalysis(articles: NewsArticle[]): NarrativeAnalysis {
  return {
    narratives: keywordNarratives(articles),
    articlesAnalyzed: articles.length,
    analyzedAt: new Date().toISOString(),
    method: 'keyword',
  };
}

/**
 * The AI analysis when a provider can give one (fresh, or the last good one
 * for up to an hour via the cache's stale-on-error), otherwise the keyword
 * grouping of the same articles.
 */
async function analyze(
  articles: NewsArticle[],
  limit: number,
): Promise<{ analysis: NarrativeAnalysis; degradedReason?: string }> {
  if (!isAIConfigured()) {
    return { analysis: keywordAnalysis(articles), degradedReason: 'ai_not_configured' };
  }
  try {
    const analysis = await withCache(
      aiCache,
      generateCacheKey('narratives-analysis', { limit }),
      ANALYSIS_TTL_SECONDS,
      () => analyzeNarratives(articles),
    );
    return { analysis };
  } catch (error) {
    console.warn('[narratives] AI analysis unavailable, answering from headline keywords:', String(error));
    return { analysis: keywordAnalysis(articles), degradedReason: 'ai_unavailable' };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseLimit(searchParams.get('limit'));
  const emerging = searchParams.get('emerging') === 'true';

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

    const { analysis, degradedReason } = await analyze(data.articles, limit);
    const maxAge = degradedReason ? DEGRADED_CACHE_SECONDS : ANALYSIS_TTL_SECONDS;

    const narratives = (emerging ? analysis.narratives.filter((n) => n.emerging) : [...analysis.narratives]).sort(
      (a, b) => b.strength - a.strength,
    );

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
        articlesAnalyzed: analysis.articlesAnalyzed,
        analyzedAt: analysis.analyzedAt,
        method: analysis.method,
        ...(degradedReason && { degraded: true, degradedReason }),
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    console.error('Narrative analysis error:', error);
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
