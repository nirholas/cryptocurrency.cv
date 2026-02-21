import { NextRequest, NextResponse } from 'next/server';
import { getL2Summary } from '@/lib/apis/l2beat';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/l2
 * Returns L2 scaling ecosystem summary: total TVL, project count, activity metrics, risk distribution.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getL2Summary();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch L2 summary', message: String(error) },
      { status: 500 }
    );
  }
}
