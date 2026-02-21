import { NextRequest, NextResponse } from 'next/server';
import { getNFTMarketOverview, getTrendingCollections } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/nft
 * Returns NFT market overview and top trending collections.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const [market, trending] = await Promise.all([
      getNFTMarketOverview(),
      getTrendingCollections({ limit: 5 }),
    ]);
    return NextResponse.json(
      { market, trending },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch NFT data', message: String(error) },
      { status: 500 }
    );
  }
}
