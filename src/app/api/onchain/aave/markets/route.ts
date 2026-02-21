import { NextRequest, NextResponse } from 'next/server';
import { getAaveMarkets } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/aave/markets
 * Returns Aave V3 lending markets from The Graph
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  try {
    const data = await getAaveMarkets({ limit });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Aave markets', message: String(error) },
      { status: 500 }
    );
  }
}
