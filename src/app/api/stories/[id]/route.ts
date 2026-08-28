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
 * GET /api/stories/{id}
 *
 * One story's full propagation chain: who published it first, and every outlet
 * that followed, with how far behind each one was.
 *
 * Story ids are derived from the originating article's URL and stay stable while
 * the story remains in the analysis window. They are not permanent archive
 * identifiers, and a story that has aged out returns 404 saying exactly that
 * rather than pretending to a permanence this endpoint does not have.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getStory } from '@/lib/provenance';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!/^[a-z0-9]{1,16}$/i.test(id)) {
    return NextResponse.json(
      {
        error: 'invalid_id',
        message: 'A story id is a short alphanumeric token from /api/stories.',
      },
      { status: 400 },
    );
  }

  try {
    const story = await getStory(id);
    if (!story) {
      return NextResponse.json(
        {
          error: 'story_not_found',
          message:
            'No story with that id is in the current analysis window. Story ids are stable while a story is live, not permanent archive identifiers.',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { story },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    console.error('[stories/id] lookup failed:', error);
    return NextResponse.json(
      { error: 'stories_unavailable', message: 'The story index could not be built right now.' },
      { status: 503, headers: { 'Retry-After': '30' } },
    );
  }
}
