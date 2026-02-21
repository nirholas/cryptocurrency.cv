import { NextRequest, NextResponse } from 'next/server';
import { getTopCoins } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/movers
 * Returns both top gainers and losers in one response
 *
 * Query params:
 * - limit: number of results per side (default 5, max 25)
 * - timeframe: '1h' | '24h' | '7d' (default '24h')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 25);
  const timeframe = searchParams.get('timeframe') || '24h';

  const sortField = timeframe === '1h'
    ? 'price_change_percentage_1h_in_currency'
    : timeframe === '7d'
    ? 'price_change_percentage_7d_in_currency'
    : 'price_change_percentage_24h';

  try {
    const coins = await getTopCoins(limit * 10);
    const filtered = coins.filter(c => (c[sortField as keyof typeof c] as number | undefined) != null);

    const gainers = [...filtered]
      .sort((a, b) =>
        ((b[sortField as keyof typeof b] as number) || 0) -
        ((a[sortField as keyof typeof a] as number) || 0)
      )
      .slice(0, limit);

    const losers = [...filtered]
      .sort((a, b) =>
        ((a[sortField as keyof typeof a] as number) || 0) -
        ((b[sortField as keyof typeof b] as number) || 0)
      )
      .slice(0, limit);

    return NextResponse.json(
      { gainers, losers, timeframe, timestamp: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch movers', message: String(error) },
      { status: 500 }
    );
  }
}
