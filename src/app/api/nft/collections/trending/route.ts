import { NextRequest, NextResponse } from 'next/server';
import { getTrendingCollections } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/nft/collections/trending
 * Returns trending NFT collections.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const chain = searchParams.get('chain') || undefined;
  const category = searchParams.get('category') || undefined;
  const sortBy = searchParams.get('sort_by') || undefined;

  try {
    const data = await getTrendingCollections({ limit, chain, category, sortBy });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trending collections', message: String(error) },
      { status: 500 }
    );
  }
}
