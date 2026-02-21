import { NextRequest, NextResponse } from 'next/server';
import { getStablecoinYields } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/yields/stablecoins
 * Returns stablecoin yield pools filtered by minimum TVL.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const minTvl = parseFloat(searchParams.get('min_tvl') || '1000000');

  try {
    const data = await getStablecoinYields(minTvl);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stablecoin yields', message: String(error) },
      { status: 500 }
    );
  }
}
