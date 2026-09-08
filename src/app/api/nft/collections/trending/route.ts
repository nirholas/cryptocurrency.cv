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
import { getTrendingCollections } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/nft/collections/trending
 * Returns trending NFT collections.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const chain = searchParams.get('chain') || undefined;
  const category = searchParams.get('category') || undefined;
  const sortBy = searchParams.get('sort_by') || undefined;

  try {
    const data = await getTrendingCollections('24h', limit);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch trending collections' },
      { status: 500 }
    );
  }
}
