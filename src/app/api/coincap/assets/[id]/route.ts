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
import { getAsset, getAssetMarkets, normalizeAsset } from '@/lib/coincap';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/coincap/assets/[id]
 * Returns asset details from CoinCap including price, supply, and market cap.
 * Query params:
 *   - include_markets: 'true' to include trading pair markets (default false)
 *   - markets_limit: number of markets to return (default 10, max 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id || !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(id)) {
      return NextResponse.json(
        { error: 'A valid asset ID is required (e.g. bitcoin)' },
        { status: 400 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const includeMarkets = searchParams.get('include_markets') === 'true';
    const marketsLimit = Math.min(parseInt(searchParams.get('markets_limit') || '10', 10), 50);

    const asset = await getAsset(id);
    const normalized = normalizeAsset(asset);

    const result: Record<string, unknown> = {
      ...normalized,
      raw: asset,
      source: 'coincap',
      timestamp: Date.now(),
    };

    if (includeMarkets) {
      const markets = await getAssetMarkets(id, marketsLimit);
      result.markets = markets;
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message = String(error);
    if (message.includes('404') || message.includes('not found')) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 },
      );
    }
    console.error('coincap/assets route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CoinCap asset' },
      { status: 502 },
    );
  }
}
