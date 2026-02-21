import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedOpenInterest } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/aggregated/open-interest
 * Returns open interest aggregated across major derivatives exchanges
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getAggregatedOpenInterest();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch aggregated open interest', message: String(error) },
      { status: 500 }
    );
  }
}
