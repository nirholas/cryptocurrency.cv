import { NextRequest, NextResponse } from 'next/server';
import { getGlobalMarketData } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/market/dominance
 * Returns crypto market cap dominance percentages
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getGlobalMarketData();
    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 503 }
      );
    }

    const { market_cap_percentage, total_market_cap } = data;
    const totalMarketCapUsd = total_market_cap?.usd ?? 0;

    return NextResponse.json(
      {
        dominance: market_cap_percentage,
        totalMarketCap: totalMarketCapUsd,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dominance data', message: String(error) },
      { status: 500 }
    );
  }
}
