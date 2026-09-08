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
import { getBybitFundingHistory } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/bybit/funding/[symbol]
 * Returns Bybit funding rate history for a symbol
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
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 200);

  try {
    const data = await getBybitFundingHistory(symbol.toUpperCase(), limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Bybit funding history' },
      { status: 500 }
    );
  }
}
