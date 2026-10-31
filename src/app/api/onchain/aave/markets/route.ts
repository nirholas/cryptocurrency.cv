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
import { getAaveMarkets } from '@/lib/apis/thegraph';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/aave/markets
 * Returns Aave V3 lending markets from The Graph
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = intParam(searchParams, 'limit', { fallback: 20, min: 1, max: 100 });

  try {
    const data = await getAaveMarkets();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Aave markets' },
      { status: 500 }
    );
  }
}
