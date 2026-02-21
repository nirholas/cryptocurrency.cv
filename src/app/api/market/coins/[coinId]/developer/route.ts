import { NextRequest, NextResponse } from 'next/server';
import { getCoinDeveloperData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/market/coins/[coinId]/developer
 * Returns developer/GitHub stats for a coin
 *
 * @param coinId - CoinGecko coin ID (e.g. "bitcoin", "ethereum")
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
): Promise<NextResponse> {
  const { coinId } = await params;

  if (!coinId) {
    return NextResponse.json(
      { error: 'coinId is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getCoinDeveloperData(coinId);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch developer data', message: String(error) },
      { status: 500 }
    );
  }
}
