import { NextRequest, NextResponse } from 'next/server';
import { getMarketSentiment } from '@/lib/apis/lunarcrush';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/social/sentiment
 * Returns overall crypto market sentiment derived from social data.
 * Shorthand alias for /api/social/sentiment/market.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMarketSentiment();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sentiment', message: String(error) },
      { status: 500 }
    );
  }
}
