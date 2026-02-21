import { NextRequest, NextResponse } from 'next/server';
import { getTrendingTopics } from '@/lib/apis/lunarcrush';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/social/topics/trending
 * Returns trending topics in the crypto social sphere.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getTrendingTopics();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trending topics', message: String(error) },
      { status: 500 }
    );
  }
}
