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
import { isGroqConfigured, GroqAuthError, GroqRateLimitError } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 120;

export async function GET(request: NextRequest) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'AI features require GROQ_API_KEY configuration' },
      { status: 503 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const stories = Math.min(parseInt(searchParams.get('stories') || '5'), 10);

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

    // An exhausted quota or a rejected key is an upstream availability problem,
    // not a fault in this handler. It gets a 503 the client can retry rather
    // than a 500, which is what a spent Groq daily allowance used to produce.
    if (
      error instanceof GroqRateLimitError ||
      error instanceof GroqAuthError ||
      (error as Error).name === 'GroqRateLimitError' ||
      (error as Error).name === 'GroqAuthError' ||
      (error as Error).name === 'AIAuthError'
    ) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable', success: false },
        { status: 503, headers: { 'Retry-After': '120' } }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate flash briefing', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
