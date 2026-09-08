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
import { getTopInfluencers } from '@/lib/apis/lunarcrush';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/social/influencers
 * Returns top crypto influencers ranked by social impact.
 * Query params:
 *   - limit: number (default 50, max 100)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  try {
    const data = await getTopInfluencers(limit);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch influencers' },
      { status: 500 }
    );
  }
}
