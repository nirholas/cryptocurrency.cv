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
import {
  articleAffectsAsset,
  keywordSentiment,
  normalizeAsset,
  type MarketSentiment,
  type SentimentAnalysis,
  type SentimentArticle,
} from '@/lib/news-sentiment';
import { instrumented } from '@/lib/telemetry-middleware';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * How long one AI analysis of the latest news is reused. Every `?asset=` and
 * every poll shares it: the analysis covers the whole feed and the asset
 * filter runs on the result. Before this, each request re-ran a ~7k-token
 * prompt, and one client polling a single asset spent the AI provider's whole
 * daily token budget on its own.
 */
const ANALYSIS_TTL_SECONDS = 300;

/** Edge cache lifetime for a keyword answer, kept short so AI output returns as soon as it can. */
const DEGRADED_CACHE_SECONDS = 60;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface AISentimentResponse {
  articles: SentimentArticle[];
  market: MarketSentiment;
}

const SYSTEM_PROMPT = `You are a cryptocurrency market sentiment analyst. Analyze news articles for market sentiment and potential impact.

For each article:
- sentiment: very_bullish, bullish, neutral, bearish, very_bearish
- confidence: 0-100 how confident you are in this assessment
- reasoning: Brief explanation of why this is bullish/bearish
- impactLevel: high (market-moving), medium, low (minor news)
- timeHorizon: immediate (<24h), short_term (1-7 days), long_term (>1 week)
- affectedAssets: Uppercase ticker symbols of the cryptocurrencies this news affects

Also provide overall market sentiment:
- overall: Aggregated market mood
- score: -100 (extremely bearish) to +100 (extremely bullish)
- confidence: How confident in overall assessment
- summary: 1-2 sentence market summary
- keyDrivers: Top 3 factors driving sentiment

Be objective. Don't overreact to minor news. Consider the source reliability.

Respond with JSON: { "articles": [...], "market": {...} }`;

function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

async function analyzeWithAI(articles: NewsArticle[]): Promise<SentimentAnalysis> {
  const articlesForAnalysis = articles.map((a) => ({
    title: a.title,
    link: a.link,
    source: a.source,
    description: a.description || '',
    timeAgo: a.timeAgo,
  }));

  const userPrompt = `Analyze sentiment for these ${articlesForAnalysis.length} crypto news articles:

${JSON.stringify(articlesForAnalysis, null, 2)}`;

  const result = await promptAIJson<AISentimentResponse>(SYSTEM_PROMPT, userPrompt, {
    maxTokens: 4000,
    temperature: 0.3,
  });

  if (!result?.market || !Array.isArray(result.articles)) {
    throw new Error('AI sentiment response is missing articles or market');
  }

  return {
    articles: result.articles,
    market: result.market,
    articlesAnalyzed: articles.length,
    analyzedAt: new Date().toISOString(),
    method: 'ai',
  };
}

/**
 * The AI analysis when a provider can give one (fresh, or the last good one
 * for up to an hour via the cache's stale-on-error), otherwise the keyword
 * reading of the same articles.
 */
async function analyze(
  articles: NewsArticle[],
  limit: number,
  asset: string | undefined,
): Promise<{ analysis: SentimentAnalysis; degradedReason?: string }> {
  if (!isAIConfigured()) {
    return { analysis: keywordSentiment(articles, asset), degradedReason: 'ai_not_configured' };
  }
  try {
    const analysis = await withCache(
      aiCache,
      generateCacheKey('sentiment-analysis', { limit }),
      ANALYSIS_TTL_SECONDS,
      () => analyzeWithAI(articles),
    );
    return { analysis };
  } catch (error) {
    console.warn('[sentiment] AI analysis unavailable, answering from headline keywords:', String(error));
    return { analysis: keywordSentiment(articles, asset), degradedReason: 'ai_unavailable' };
  }
}

export const GET = instrumented(
  async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseLimit(searchParams.get('limit'));
    const asset = normalizeAsset(searchParams.get('asset'));

    if (asset === null) {
      return NextResponse.json(
        {
          error: 'Invalid asset',
          message: 'asset must be a ticker symbol of 1-15 letters or digits.',
        },
        { status: 400 },
      );
    }

    let news;
    try {
      news = await getLatestNews(limit);
    } catch (error) {
      console.error('[sentiment] news fetch failed:', error);
      return NextResponse.json(
        {
          error: 'News temporarily unavailable',
          message: 'The news feed could not be read. Please retry shortly.',
        },
        { status: 503, headers: { 'Retry-After': '60' } },
      );
    }

    if (news.articles.length === 0) {
      return NextResponse.json({
        articles: [],
        market: {
          overall: 'neutral',
          score: 0,
          confidence: 0,
          summary: 'No articles to analyze',
          keyDrivers: [],
        },
      });
    }

    const { analysis, degradedReason } = await analyze(news.articles, limit, asset);

    const articles = asset
      ? analysis.articles.filter((a) => articleAffectsAsset(a, asset))
      : analysis.articles;

    const distribution = {
      very_bullish: articles.filter((a) => a.sentiment === 'very_bullish').length,
      bullish: articles.filter((a) => a.sentiment === 'bullish').length,
      neutral: articles.filter((a) => a.sentiment === 'neutral').length,
      bearish: articles.filter((a) => a.sentiment === 'bearish').length,
      very_bearish: articles.filter((a) => a.sentiment === 'very_bearish').length,
    };

    const maxAge = degradedReason ? DEGRADED_CACHE_SECONDS : ANALYSIS_TTL_SECONDS;

    return NextResponse.json(
      {
        articles,
        market: analysis.market,
        distribution,
        highImpactNews: articles.filter((a) => a.impactLevel === 'high'),
        meta: {
          articlesAnalyzed: analysis.articlesAnalyzed,
          asset: asset || 'all',
          analyzedAt: analysis.analyzedAt,
          method: analysis.method,
          ...(degradedReason && { degraded: true, degradedReason }),
        },
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  },
  { name: 'sentiment' },
);
