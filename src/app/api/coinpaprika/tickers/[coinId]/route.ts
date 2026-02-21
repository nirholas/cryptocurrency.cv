import { NextRequest, NextResponse } from 'next/server';
import { getTicker } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/coinpaprika/tickers/[coinId]
 * Returns ticker data for a specific coin.
 * Query params:
 *   - quotes: quote currency (default: 'USD')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
): Promise<NextResponse> {
  const { coinId } = await params;
  if (!coinId) {
    return NextResponse.json({ error: 'Coin ID is required' }, { status: 400 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const quotes = searchParams.get('quotes') || 'USD';

    const data = await getTicker(coinId, quotes);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message = String(error);
    if (message.includes('404') || message.includes('not found')) {
      return NextResponse.json(
        { error: 'Coin not found', message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch CoinPaprika ticker', message },
      { status: 500 }
    );
  }
}
