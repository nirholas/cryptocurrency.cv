import { NextRequest, NextResponse } from 'next/server';
import { getTopCoins } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/heatmap
 * Returns coins with sparkline data for visual heatmap display
 *
 * Query params:
 * - limit: number of coins (default 100, max 250)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 250);

  try {
    const coins = await getTopCoins(limit);
    const heatmapData = coins.map(c => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      current_price: c.current_price,
      price_change_percentage_24h: c.price_change_percentage_24h,
      market_cap: c.market_cap,
      sparkline_in_7d: c.sparkline_in_7d,
    }));

    return NextResponse.json(
      { coins: heatmapData, count: heatmapData.length, timestamp: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data', message: String(error) },
      { status: 500 }
    );
  }
}
