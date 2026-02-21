import { NextRequest, NextResponse } from 'next/server';
import { getMedianYields } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/defi/yields/median
 * Returns median yield data keyed by chain.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMedianYields();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch median yields', message: String(error) },
      { status: 500 }
    );
  }
}
