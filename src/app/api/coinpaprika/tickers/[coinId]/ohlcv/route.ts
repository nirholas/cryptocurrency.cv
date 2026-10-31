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
import { getOHLCVLatest, getOHLCVHistorical } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 3600;

/** Quote currencies CoinPaprika's OHLCV endpoints accept. */
const OHLCV_QUOTES: ReadonlySet<string> = new Set(['usd', 'btc']);

/** Most rows CoinPaprika returns from one historical OHLCV request. */
const MAX_OHLCV_LIMIT = 366;

function isOhlcvDate(value: string): boolean {
  if (/^\d{1,10}$/.test(value)) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

/**
 * GET /api/coinpaprika/tickers/[coinId]/ohlcv
 * Returns OHLCV (candlestick) data for a specific coin.
 * - Without ?start: returns last 7 days (latest OHLCV)
 * - With ?start=2024-01-01: returns historical OHLCV
 * Query params:
 *   - quote: quote currency, 'usd' or 'btc' (default: 'usd')
 *   - start: YYYY-MM-DD date or Unix timestamp for historical data (e.g. '2024-01-01')
 *   - end: YYYY-MM-DD date or Unix timestamp (optional)
 *   - limit: max number of data points (default and max: 366, CoinPaprika's cap)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
): Promise<NextResponse> {
  const { coinId } = await params;
  if (!coinId || !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(coinId)) {
    return NextResponse.json({ error: 'A valid coin ID is required (e.g. btc-bitcoin)' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const quote = (searchParams.get('quote') || 'usd').toLowerCase();
  if (!OHLCV_QUOTES.has(quote)) {
    return NextResponse.json({ error: "quote must be 'usd' or 'btc'" }, { status: 400 });
  }
  const start = searchParams.get('start') || undefined;
  const end = searchParams.get('end') || undefined;
  if ((start !== undefined && !isOhlcvDate(start)) || (end !== undefined && !isOhlcvDate(end))) {
    return NextResponse.json(
      { error: 'start and end must be YYYY-MM-DD dates or Unix timestamps' },
      { status: 400 }
    );
  }
  const limit = Number(searchParams.get('limit') || MAX_OHLCV_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) {
    return NextResponse.json({ error: 'limit must be a positive integer' }, { status: 400 });
  }

  try {
    let data;
    if (start) {
      data = await getOHLCVHistorical(coinId, start, end, Math.min(limit, MAX_OHLCV_LIMIT), quote);
    } else {
      data = await getOHLCVLatest(coinId, quote);
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
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
      { error: 'Failed to fetch OHLCV data' },
      { status: 502 }
    );
  }
}
