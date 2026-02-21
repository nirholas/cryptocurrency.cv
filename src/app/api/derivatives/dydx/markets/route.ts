import { NextRequest, NextResponse } from 'next/server';
import { getDydxMarkets } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/derivatives/dydx/markets
 * Returns dYdX perpetual markets
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getDydxMarkets();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dYdX markets', message: String(error) },
      { status: 500 }
    );
  }
}
