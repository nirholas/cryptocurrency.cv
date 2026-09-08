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
import { getUniswapPools } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/uniswap/pools
 * Returns Uniswap V3 liquidity pools from The Graph
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const orderBy = searchParams.get('order_by') || 'totalValueLockedUSD';
  const orderDirection = (searchParams.get('order_direction') || 'desc') as 'asc' | 'desc';
  const minLiquidityParam = searchParams.get('min_liquidity');
  const minLiquidity = minLiquidityParam ? parseFloat(minLiquidityParam) : undefined;

  try {
    const data = await getUniswapPools('ethereum', { first: limit, orderBy });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Uniswap pools' },
      { status: 500 }
    );
  }
}
