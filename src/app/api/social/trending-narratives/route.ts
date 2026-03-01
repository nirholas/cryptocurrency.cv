/**
 * Trending Narratives API
 *
 * GET /api/social/trending-narratives
 *
 * Detects emerging market narratives from recent news articles using AI,
 * computes velocity/momentum, and returns the top narratives with summaries.
 *
 * Cache: 2-hour in-memory cache to avoid hammering AI providers.
 */

import { NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { detectNarratives, getNarrativeSummary, type Narrative } from '@/lib/narrative-detector';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// In-memory 2-hour cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: { narratives: Narrative[]; generated_at: string };
  expiresAt: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  // Serve from cache if still fresh
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json(cache.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    // Fetch the latest 200 articles
    const newsData = await getLatestNews(200);
    const rawArticles = newsData.articles ?? [];

    // Map to the ArticleInput shape expected by detectNarratives
    const articleInputs = rawArticles.map((a) => ({
      title: a.title,
      summary: a.description ?? '',
      tags: [a.category, a.source].filter(Boolean),
      date: a.pubDate,
    }));

    // Detect narratives
    const narratives = await detectNarratives(articleInputs);

    // Fetch AI summaries for top 5 narratives by velocity
    const top5 = narratives.slice(0, 5);
    const summaryPromises = top5.map(async (narrative) => {
      // Collect up to 10 article titles for this narrative's prompt
      const relatedTitles = rawArticles
        .filter((a) => {
          const coinMatch =
            narrative.coins.length === 0 ||
            narrative.coins.some((coin) =>
              (a.title + ' ' + (a.description ?? '')).toUpperCase().includes(coin)
            );
          return coinMatch;
        })
        .slice(0, 10)
        .map((a) => a.title);

      const summary = await getNarrativeSummary(narrative, relatedTitles);
      return { ...narrative, summary };
    });

    const top5WithSummaries = await Promise.all(summaryPromises);

    // Merge summaries back in; others get no summary field
    const narrativesWithSummaries = narratives.map((n) => {
      const enriched = top5WithSummaries.find((t) => t.id === n.id);
      return enriched ?? n;
    });

    const payload = {
      narratives: narrativesWithSummaries,
      generated_at: new Date().toISOString(),
    };

    // Store in cache
    cache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('[trending-narratives] Error:', error);
    return NextResponse.json(
      { error: 'Failed to detect narratives', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
