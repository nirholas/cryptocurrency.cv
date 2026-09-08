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
import { getBybitTickers } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/derivatives/bybit/tickers
 * Returns Bybit perpetual tickers
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const categoryParam = searchParams.get('category') || 'linear';
  const category = (categoryParam === 'inverse' ? 'inverse' : 'linear') as 'linear' | 'inverse';

  try {
    const data = await getBybitTickers(category);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Bybit tickers' },
      { status: 500 }
    );
  }
}
