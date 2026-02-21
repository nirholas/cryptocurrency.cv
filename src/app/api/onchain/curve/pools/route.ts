import { NextRequest, NextResponse } from 'next/server';
import { getCurvePools } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/curve/pools
 * Returns Curve Finance liquidity pools from The Graph
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getCurvePools();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Curve pools', message: String(error) },
      { status: 500 }
    );
  }
}
