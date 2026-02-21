import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/lib/coinpaprika';

export const runtime = 'edge';
export const revalidate = 0;

/**
 * GET /api/coinpaprika/search
 * Searches for coins, exchanges, ICOs, people, and tags.
 * Query params:
 *   - q: search query (required)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Search query 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const data = await search(q);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search CoinPaprika', message: String(error) },
      { status: 500 }
    );
  }
}
