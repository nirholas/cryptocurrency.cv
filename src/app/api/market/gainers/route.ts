import { NextRequest, NextResponse } from 'next/server';
import { getTopCoins } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/gainers
 * Returns top gaining coins by price change percentage
 *
 * Query params:
 * - limit: number of results (default 10, max 50)
 * - timeframe: '1h' | '24h' | '7d' (default '24h')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
  const timeframe = searchParams.get('timeframe') || '24h';

  const sortField = timeframe === '1h'
    ? 'price_change_percentage_1h_in_currency'
    : timeframe === '7d'
    ? 'price_change_percentage_7d_in_currency'
    : 'price_change_percentage_24h';

  try {
    const coins = await getTopCoins(limit * 4);
    const gainers = coins
      .filter(c => (c[sortField as keyof typeof c] as number | undefined) != null)
      .sort((a, b) =>
        ((b[sortField as keyof typeof b] as number) || 0) -
        ((a[sortField as keyof typeof a] as number) || 0)
      )
      .slice(0, limit);

    return NextResponse.json(
      { gainers, timeframe, count: gainers.length, timestamp: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gainers', message: String(error) },
      { status: 500 }
    );
  }
}
