import { NextRequest, NextResponse } from 'next/server';
import { getGlobal } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/coinpaprika
 * Returns CoinPaprika global crypto market stats (market cap, volume, BTC dominance, etc.)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getGlobal();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika global data', message: String(error) },
      { status: 500 }
    );
  }
}
