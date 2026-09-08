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
import { getTickers } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/coinpaprika/tickers
 * Returns price/volume/market cap for all coins.
 * Query params:
 *   - quotes: comma-separated quote currencies (default: 'USD', e.g. 'USD,BTC,ETH')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quotes = searchParams.get('quotes') || 'USD';

    const data = await getTickers(quotes);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika tickers' },
      { status: 500 }
    );
  }
}
