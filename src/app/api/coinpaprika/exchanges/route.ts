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
import { getExchanges } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/coinpaprika/exchanges
 * Returns all exchanges with trading pairs and volume data.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getExchanges();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika exchanges' },
      { status: 500 }
    );
  }
}
