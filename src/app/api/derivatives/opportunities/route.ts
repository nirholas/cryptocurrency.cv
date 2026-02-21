import { NextRequest, NextResponse } from 'next/server';
import { getTopFundingOpportunities } from '@/lib/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/opportunities
 * Returns top funding rate opportunities (highest positive and lowest negative) across exchanges
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  try {
    const data = await getTopFundingOpportunities(limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch funding opportunities', message: String(error) },
      { status: 500 }
    );
  }
}
