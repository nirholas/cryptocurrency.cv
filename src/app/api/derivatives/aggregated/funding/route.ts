import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedFundingRates } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/aggregated/funding
 * Returns funding rates aggregated across Binance, Bybit, OKX, and dYdX
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getAggregatedFundingRates();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch aggregated funding rates', message: String(error) },
      { status: 500 }
    );
  }
}
