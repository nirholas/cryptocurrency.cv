import { NextRequest, NextResponse } from 'next/server';
import { getCollectionActivity } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/nft/collections/[slug]/activity
 * Returns recent activity (sales, bids, listings) for a specific NFT collection.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const eventType = searchParams.get('event_type') || undefined;

  try {
    const data = await getCollectionActivity(slug, { limit, eventType });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch collection activity', message: String(error) },
      { status: 500 }
    );
  }
}
