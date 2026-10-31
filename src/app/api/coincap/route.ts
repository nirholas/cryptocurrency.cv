/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAssets, normalizeAsset } from '@/lib/coincap';
import { intParam } from '@/lib/query-params';

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
    const limit = intParam(searchParams, 'limit', { fallback: 100, min: 1, max: 2000 });
    const search = searchParams.get('search') || undefined;
    const offset = intParam(searchParams, 'offset', { fallback: 0, min: 0, max: 10000 });

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
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch CoinCap assets' },
      { status: 500 },
    );
  }
}
