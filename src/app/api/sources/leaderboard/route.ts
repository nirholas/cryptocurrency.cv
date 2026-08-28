/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * GET /api/sources/leaderboard
 *
 * Which outlets break crypto stories, and which ones follow.
 *
 * Every "best crypto news sites" ranking in existence is a popularity poll or an
 * SEO traffic estimate. Neither measures reporting. This measures one narrow,
 * checkable thing: across the stories in the current window, how often did an
 * outlet publish first, and when it did not, how far behind was it?
 *
 * Query:
 *   ?limit=300     articles to pull into the corpus (20-300)
 *   ?category=defi restrict to one category
 *   ?minStories=5  hide outlets with less evidence than this
 *   ?ranked=1      return only outlets that have a measurable rate
 *
 * Read the caveats in `meta` before quoting any of this. The window is hours,
 * not history; publishing first is one virtue among many and says nothing about
 * accuracy; and an outlet that only ever runs exclusives shows a null rate
 * rather than a bad one, because nobody corroborated its timing.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getSourceLeaderboard, MIN_STORIES_FOR_RATE } from '@/lib/provenance';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 20), 300) : 300;
  const minStoriesRaw = Number(searchParams.get('minStories'));
  const minStories = Number.isFinite(minStoriesRaw) ? Math.max(0, minStoriesRaw) : 0;
  const rankedOnly = searchParams.get('ranked') === '1' || searchParams.get('ranked') === 'true';
  const category = searchParams.get('category') ?? undefined;

  try {
    const { scores, report } = await getSourceLeaderboard({ limit, category });

    let rows = scores;
    if (minStories > 0) rows = rows.filter((s) => s.storiesCovered >= minStories);
    if (rankedOnly) rows = rows.filter((s) => s.originationRate !== null);

    return NextResponse.json(
      {
        count: rows.length,
        sources: rows,
        meta: {
          storiesAnalysed: report.stories.length,
          articlesAnalysed: report.analysed,
          generatedAt: report.generatedAt,
          minStoriesForRate: MIN_STORIES_FOR_RATE,
          measures:
            'originated: published first with credible timing. followed: published after a credible originator. soloed: nobody else covered it, so the timing is uncorroborated and it counts toward neither.',
          caveats: [
            'The window is the current analysis corpus, a matter of hours, not a historical record.',
            'Ordering comes from the timestamps outlets publish in their own feeds, which are frequently wrong. Stories whose timing cannot be verified are excluded from origination counts entirely.',
            'Publishing first is one measurable virtue. This is not a ranking of accuracy, depth, or editorial quality.',
            `An outlet with fewer than ${MIN_STORIES_FOR_RATE} decided stories reports a null rate rather than a flattering percentage off a couple of articles.`,
          ],
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    console.error('[sources/leaderboard] failed:', error);
    return NextResponse.json(
      {
        error: 'leaderboard_unavailable',
        message: 'The source leaderboard could not be built right now.',
      },
      { status: 503, headers: { 'Retry-After': '30' } },
    );
  }
}
