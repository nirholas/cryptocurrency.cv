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
import { getUniswapSwaps } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/onchain/uniswap/swaps
 * Returns recent Uniswap V3 swaps from The Graph
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const poolAddress = searchParams.get('pool') || undefined;
  const minUsdParam = searchParams.get('min_usd');
  const minAmountUSD = minUsdParam ? parseFloat(minUsdParam) : undefined;

  try {
    let data = await getUniswapSwaps('ethereum', { first: limit, poolId: poolAddress });
    if (minAmountUSD !== undefined) {
      data = data.filter((swap) => parseFloat(swap.amountUSD) >= minAmountUSD);
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Uniswap swaps' },
      { status: 500 }
    );
  }
}
