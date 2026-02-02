/**
 * Flash Briefing API
 * 
 * Ultra-short AI-generated summary of top crypto stories.
 * Perfect for voice assistants, widgets, or quick catch-up.
 * 
 * GET /api/ai/flash-briefing
 * GET /api/ai/flash-briefing?stories=3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { generateFlashBriefing, type NewsArticle } from '@/lib/ai-intelligence';
import { isGroqConfigured } from '@/lib/groq';

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
    return NextResponse.json(
      { error: 'Failed to generate flash briefing', details: String(error) },
      { status: 500 }
    );
  }
}
