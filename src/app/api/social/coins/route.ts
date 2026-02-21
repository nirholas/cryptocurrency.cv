import { NextRequest, NextResponse } from 'next/server';
import { getTopSocialCoins, getBulkSocialMetrics } from '@/lib/apis/lunarcrush';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/social/coins
 * Returns top social coins or bulk metrics for specific symbols.
 * Query params:
 *   - limit: number (default 50, max 100) — used when no symbols provided
 *   - symbols: comma-separated (e.g. "BTC,ETH,SOL") — triggers bulk fetch
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols');

  try {
    let data;

    if (symbolsParam) {
      const symbols = symbolsParam
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      data = await getBulkSocialMetrics(symbols);
    } else {
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
      data = await getTopSocialCoins(limit);
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch social coins', message: String(error) },
      { status: 500 }
    );
  }
}
