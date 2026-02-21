import { NextRequest, NextResponse } from 'next/server';
import { getCollectionStats } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/nft/collections/[slug]/stats
 * Returns stats for a specific NFT collection (floor price, volume, owners, etc.).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const data = await getCollectionStats(slug);
    if (!data) {
      return NextResponse.json({ error: 'Collection stats not found' }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch collection stats', message: String(error) },
      { status: 500 }
    );
  }
}
