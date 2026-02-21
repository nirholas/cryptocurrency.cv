import { NextRequest, NextResponse } from 'next/server';
import { getCoins } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/coinpaprika/coins
 * Returns the full list of coins with basic info (id, name, symbol, rank, is_active, type).
 * Query params:
 *   - limit: max number of coins to return (default: all, max: 500)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : undefined;

    const data = await getCoins();
    const result = limit ? data.slice(0, limit) : data;

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika coins', message: String(error) },
      { status: 500 }
    );
  }
}
