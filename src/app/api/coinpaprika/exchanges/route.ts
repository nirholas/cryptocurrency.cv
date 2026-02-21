import { NextRequest, NextResponse } from 'next/server';
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika exchanges', message: String(error) },
      { status: 500 }
    );
  }
}
