import { NextRequest, NextResponse } from 'next/server';
import { getRecentSales } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/nft/sales/recent
 * Returns recent NFT sales across all collections.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  try {
    const data = await getRecentSales(limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recent NFT sales', message: String(error) },
      { status: 500 }
    );
  }
}
