import { NextRequest, NextResponse } from 'next/server';
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Uniswap swaps', message: String(error) },
      { status: 500 }
    );
  }
}
