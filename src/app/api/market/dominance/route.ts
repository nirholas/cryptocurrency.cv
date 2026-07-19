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
import { getGlobalMarketData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/dominance
 * Returns crypto market cap dominance percentages
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getGlobalMarketData();
    if (!data) {
      // getGlobalMarketData already falls back to CoinPaprika, so null means
      // every upstream is down. Degrade to a 200 empty payload so the
      // dominance widget renders an empty state instead of a 5xx.
      return NextResponse.json(
        { dominance: {}, totalMarketCap: 0, timestamp: Date.now() },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { market_cap_percentage, total_market_cap } = data;
    const totalMarketCapUsd = total_market_cap?.usd ?? 0;

    return NextResponse.json(
      {
        dominance: market_cap_percentage,
        totalMarketCap: totalMarketCapUsd,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dominance data' },
      { status: 500 }
    );
  }
}
