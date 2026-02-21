import { NextRequest, NextResponse } from 'next/server';
import { getSocialFeed } from '@/lib/apis/lunarcrush';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/social/coins/[symbol]/feed
 * Returns the social media feed for a specific cryptocurrency symbol.
 * Query params:
 *   - limit: number (default 50, max 200)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
): Promise<NextResponse> {
  const { symbol } = await params;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  try {
    const data = await getSocialFeed(symbol.toUpperCase(), limit);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch social feed', message: String(error) },
      { status: 500 }
    );
  }
}
