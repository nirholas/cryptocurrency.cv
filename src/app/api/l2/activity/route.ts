import { NextRequest, NextResponse } from 'next/server';
import { getL2Activity } from '@/lib/apis/l2beat';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/l2/activity
 * Returns transaction counts and TPS per L2 project over recent period.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getL2Activity();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch L2 activity', message: String(error) },
      { status: 500 }
    );
  }
}
