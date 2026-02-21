import { NextRequest, NextResponse } from 'next/server';
import { searchPools } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 0;

/**
 * GET /api/defi/yields/search
 * Search yield pools by query string.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q') || '';

  if (!q) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  try {
    const data = await searchPools(q);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search pools', message: String(error) },
      { status: 500 }
    );
  }
}
