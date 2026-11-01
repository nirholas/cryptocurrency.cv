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
 * Source Quality API
 * 
 * AI-powered scoring of news sources and articles.
 * 
 * GET /api/ai/source-quality?source=CoinDesk
 * GET /api/ai/source-quality/rankings?category=defi
 * POST /api/ai/source-quality/article - Score individual article
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { 
  analyzeSourceQuality,
  scoreArticleQuality,
  rankSourcesByCategory,
  detectClickbait,
  detectRehash,
} from '@/lib/source-quality-scorer';
import { isAIConfigured, isAIUnavailableError } from '@/lib/ai-provider';
import { aiAuthErrorResponse, aiNotConfiguredResponse } from '@/app/api/_utils';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'edge';
export const revalidate = 600; // 10 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sourceName = searchParams.get('source');
  const category = searchParams.get('category');
  const checkClickbait = searchParams.get('clickbait') === 'true';

  try {
    // Fetch recent news
    const data = await getLatestNews(100);

    // If checking for clickbait across all articles
    if (checkClickbait) {
      const clickbaitAnalysis = data.articles.slice(0, 50).map(a => ({
        title: a.title,
        source: a.source,
        ...detectClickbait(a.title),
      }));

      const clickbaitArticles = clickbaitAnalysis.filter(a => a.isClickbait);
      const avgScore = clickbaitAnalysis.reduce((sum, a) => sum + a.score, 0) / clickbaitAnalysis.length;

      return NextResponse.json({
        success: true,
        articlesAnalyzed: clickbaitAnalysis.length,
        clickbaitCount: clickbaitArticles.length,
        clickbaitPercentage: ((clickbaitArticles.length / clickbaitAnalysis.length) * 100).toFixed(1),
        averageClickbaitScore: avgScore.toFixed(1),
        worstOffenders: clickbaitArticles
          .sort((a, b) => b.score - a.score)
          .slice(0, 10),
        cleanArticles: clickbaitAnalysis
          .filter(a => a.score < 20)
          .slice(0, 10),
        generatedAt: new Date().toISOString(),
      });
    }

    // If analyzing specific source
    if (sourceName) {
      if (!isAIConfigured()) {
        return aiNotConfiguredResponse();
      }

      const sourceArticles = data.articles.filter(a => 
        a.source.toLowerCase().includes(sourceName.toLowerCase())
      );

      if (sourceArticles.length === 0) {
        return NextResponse.json({
          success: false,
          error: `No articles found from source "${sourceName}"`,
          availableSources: [...new Set(data.articles.map(a => a.source))].slice(0, 20),
        });
      }

      const quality = await analyzeSourceQuality(
        sourceName,
        sourceArticles.map(a => ({
          title: a.title,
          description: a.description,
          pubDate: a.pubDate,
        }))
      );

      return NextResponse.json({
        success: true,
        sourceQuality: quality,
        articlesAnalyzed: sourceArticles.length,
      });
    }

    // If ranking by category
    if (category) {
      if (!isAIConfigured()) {
        return aiNotConfiguredResponse();
      }

      // Group articles by source
      const sourceArticles: Record<string, Array<{ title: string; description?: string }>> = {};
      for (const article of data.articles) {
        if (!sourceArticles[article.source]) {
          sourceArticles[article.source] = [];
        }
        sourceArticles[article.source].push({
          title: article.title,
          description: article.description,
        });
      }

      const rankings = await rankSourcesByCategory(category, sourceArticles);

      return NextResponse.json({
        success: true,
        rankings,
      });
    }

    // Default: return overview of all sources
    const sourceCounts: Record<string, number> = {};
    const sourceClickbait: Record<string, number[]> = {};

    for (const article of data.articles) {
      sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
      
      if (!sourceClickbait[article.source]) {
        sourceClickbait[article.source] = [];
      }
      sourceClickbait[article.source].push(detectClickbait(article.title).score);
    }

    const sourceOverview = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        articleCount: count,
        avgClickbaitScore: (sourceClickbait[source].reduce((a, b) => a + b, 0) / count).toFixed(1),
      }))
      .sort((a, b) => b.articleCount - a.articleCount);

    return NextResponse.json({
      success: true,
      totalSources: sourceOverview.length,
      totalArticles: data.articles.length,
      sources: sourceOverview.slice(0, 30),
      hint: 'Add ?source=NAME for detailed analysis or ?clickbait=true for clickbait detection',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Source quality API error:', error);
    // Every provider out of quota or rejecting the key: retryable upstream outage, not a handler fault.
    if (isAIUnavailableError(error)) return aiAuthErrorResponse((error as Error).message);
    return NextResponse.json(
      { error: 'Failed to analyze source quality', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAIConfigured()) {
    return aiNotConfiguredResponse();
  }

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { title, description, source, content } = body;

    if (!title || !source) {
      return NextResponse.json(
        { error: 'title and source are required' },
        { status: 400 }
      );
    }

    // Quick clickbait check (no AI needed)
    const clickbait = detectClickbait(title);

    // AI-powered quality score
    const quality = await scoreArticleQuality(
      title,
      description || '',
      source,
      content
    );

    // Check for rehash against recent articles
    const data = await getLatestNews(50);
    const rehash = detectRehash(
      { title, description, pubDate: new Date().toISOString() },
      data.articles.map(a => ({
        title: a.title,
        description: a.description,
        pubDate: a.pubDate,
        source: a.source,
      }))
    );

    return NextResponse.json({
      success: true,
      quality,
      clickbait,
      originality: {
        isOriginal: rehash.isOriginal,
        similarArticles: rehash.similarArticles.slice(0, 5),
        possibleOriginalSource: rehash.originalSource,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Article quality API error:', error);
    // Every provider out of quota or rejecting the key: retryable upstream outage, not a handler fault.
    if (isAIUnavailableError(error)) return aiAuthErrorResponse((error as Error).message);
    return NextResponse.json(
      { error: 'Failed to score article quality', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
