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
 * Flash Briefing API
 * 
 * Ultra-short AI-generated summary of top crypto stories.
 * Perfect for voice assistants, widgets, or quick catch-up.
 * 
 * GET /api/ai/flash-briefing
 * GET /api/ai/flash-briefing?stories=3
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { generateFlashBriefing, type NewsArticle } from '@/lib/ai-intelligence';
import { isAIConfigured, isAIUnavailableError } from '@/lib/ai-provider';
import { aiAuthErrorResponse, aiNotConfiguredResponse } from '@/app/api/_utils';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 120;

export async function GET(request: NextRequest) {
  if (!isAIConfigured()) {
    return aiNotConfiguredResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const stories = intParam(searchParams, 'stories', { fallback: 5, min: 1, max: 10 });

  try {
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

    // Generate flash briefing
    const briefing = await generateFlashBriefing(articles, stories);

    return NextResponse.json({
      success: true,
      ...briefing,
      articlesAnalyzed: articles.length,
    });
  } catch (error) {
    console.error('Flash briefing API error:', error);

    // Every provider out of quota or rejecting the key: retryable upstream outage, not a handler fault.
    if (isAIUnavailableError(error)) return aiAuthErrorResponse((error as Error).message);
    return NextResponse.json(
      { error: 'Failed to generate flash briefing', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
