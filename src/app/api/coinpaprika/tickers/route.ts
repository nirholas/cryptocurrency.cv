import { NextRequest, NextResponse } from 'next/server';
import { getTickers } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/coinpaprika/tickers
 * Returns price/volume/market cap for all coins.
 * Query params:
 *   - quotes: comma-separated quote currencies (default: 'USD', e.g. 'USD,BTC,ETH')
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const quotes = searchParams.get('quotes') || 'USD';

    const data = await getTickers(quotes);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika tickers', message: String(error) },
      { status: 500 }
    );
  }
}
