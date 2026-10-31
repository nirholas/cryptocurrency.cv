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
import { getTicker, MAX_QUOTES, parseQuotes } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/coinpaprika/tickers/[coinId]
 * Returns ticker data for a specific coin.
 * Query params:
 *   - quotes: quote currency (default: 'USD')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
): Promise<NextResponse> {
  const { coinId } = await params;
  if (!coinId || !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(coinId)) {
    return NextResponse.json({ error: 'A valid coin ID is required (e.g. btc-bitcoin)' }, { status: 400 });
  }

  const quotes = parseQuotes(request.nextUrl.searchParams.get('quotes'));
  if (!quotes) {
    return NextResponse.json(
      { error: `quotes must be up to ${MAX_QUOTES} comma-separated currency codes (e.g. USD,BTC)` },
      { status: 400 }
    );
  }

  try {
    const data = await getTicker(coinId, quotes);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message = String(error);
    if (message.includes('404') || message.includes('not found')) {
      return NextResponse.json(
        { error: 'Coin not found' },
        { status: 404 }
      );
    }
    console.error('coinpaprika route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika ticker' },
      { status: 502 }
    );
  }
}
