import { NextRequest, NextResponse } from 'next/server';
import { getYieldStatsByChain } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/defi/yields/stats
 * Returns yield statistics grouped by chain.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getYieldStatsByChain();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch yield stats', message: String(error) },
      { status: 500 }
    );
  }
}
