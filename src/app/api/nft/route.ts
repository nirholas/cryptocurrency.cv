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
import { getNFTMarketOverview, getTrendingCollections } from '@/lib/apis/nft-markets';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/nft
 * Returns NFT market overview and top trending collections.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const [market, trending] = await Promise.all([
      getNFTMarketOverview(),
      getTrendingCollections('24h', 5),
    ]);
    return NextResponse.json(
      { market, trending },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch NFT data' },
      { status: 500 }
    );
  }
}
