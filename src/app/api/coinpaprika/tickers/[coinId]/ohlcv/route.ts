import { NextRequest, NextResponse } from 'next/server';
import { getOHLCVLatest, getOHLCVHistorical } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/coinpaprika/tickers/[coinId]/ohlcv
 * Returns OHLCV (candlestick) data for a specific coin.
 * - Without ?start: returns last 7 days (latest OHLCV)
 * - With ?start=2024-01-01: returns historical OHLCV
 * Query params:
 *   - quote: quote currency (default: 'usd')
 *   - start: ISO date string for historical data (e.g. '2024-01-01')
 *   - end: ISO date string (optional)
 *   - limit: max number of data points (default: 365, max: 5000)
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
    const quote = searchParams.get('quote') || 'usd';
    const start = searchParams.get('start');
    const end = searchParams.get('end') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '365', 10), 5000);

    let data;
    if (start) {
      data = await getOHLCVHistorical(coinId, start, end, limit, quote);
    } else {
      data = await getOHLCVLatest(coinId, quote);
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
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
      { error: 'Failed to fetch OHLCV data', message },
      { status: 500 }
    );
  }
}
