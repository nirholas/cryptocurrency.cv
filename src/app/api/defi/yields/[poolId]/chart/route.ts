import { NextRequest, NextResponse } from 'next/server';
import { getPoolChart } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/defi/yields/[poolId]/chart
 * Returns historical chart data for a specific yield pool.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ poolId: string }> }
): Promise<NextResponse> {
  const { poolId } = await params;
  if (!poolId) {
    return NextResponse.json(
      { error: 'Pool ID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getPoolChart(poolId);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pool chart', message: String(error) },
      { status: 500 }
    );
  }
}
