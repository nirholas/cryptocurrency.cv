import { NextRequest, NextResponse } from 'next/server';
import { getNFTMarketOverview } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/nft/market
 * Returns overall NFT market stats (total volume, total sales, active collections, etc.).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getNFTMarketOverview();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFT market overview', message: String(error) },
      { status: 500 }
    );
  }
}
