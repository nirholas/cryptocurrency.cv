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
import { getBybitOpenInterest } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

const VALID_INTERVALS = ['5min', '15min', '30min', '1h', '4h', '1d'] as const;
type ValidInterval = typeof VALID_INTERVALS[number];

/**
 * GET /api/derivatives/bybit/open-interest/[symbol]
 * Returns Bybit open interest data for a symbol
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const intervalParam = searchParams.get('interval') || '1h';
  const interval = (VALID_INTERVALS.includes(intervalParam as ValidInterval)
    ? intervalParam
    : '1h') as ValidInterval;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  try {
    const data = await getBybitOpenInterest(symbol.toUpperCase(), interval, limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Bybit open interest' },
      { status: 500 }
    );
  }
}
