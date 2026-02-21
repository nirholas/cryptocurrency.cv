import { NextRequest, NextResponse } from 'next/server';
import { getAssets, normalizeAsset } from '@/lib/coincap';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/coincap
 * Returns top assets from CoinCap API (alternative data source to CoinGecko).
 * Query params:
 *   - limit: number of assets to return (default 100, max 2000)
 *   - search: search query to filter assets
 *   - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 2000);
    const search = searchParams.get('search') || undefined;
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const assets = await getAssets({ limit, search, offset });

    const normalized = assets.map(normalizeAsset);

    return NextResponse.json(
      {
        data: normalized,
        count: normalized.length,
        source: 'coincap',
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch CoinCap assets', message: String(error) },
      { status: 500 },
    );
  }
}
