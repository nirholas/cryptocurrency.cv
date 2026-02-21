import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/nft/collections/[slug]
 * Returns details for a specific NFT collection.
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
    const data = await getCollection(slug);
    if (!data) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch collection', message: String(error) },
      { status: 500 }
    );
  }
}
