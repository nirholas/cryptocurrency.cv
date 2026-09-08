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
import { getFundingHistory } from '@/lib/funding-rates';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/funding/history/[symbol]
 * Returns historical funding rate data for a symbol on a given exchange
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
  const exchange = searchParams.get('exchange') || 'binance';
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 1000);

  try {
    const data = await getFundingHistory(symbol.toUpperCase(), exchange, limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch funding history' },
      { status: 500 }
    );
  }
}
