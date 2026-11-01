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
import { getStablecoinYields } from '@/lib/defi-yields';
import { numParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/yields/stablecoins
 * Returns stablecoin yield pools filtered by minimum TVL.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const minTvl = numParam(searchParams, 'min_tvl', { fallback: 1000000, min: 0, max: 1e13 });

  try {
    const data = await getStablecoinYields(minTvl);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stablecoin yields' },
      { status: 500 }
    );
  }
}
