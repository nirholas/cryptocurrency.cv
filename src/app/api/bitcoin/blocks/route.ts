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
import { getRecentBlocks } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/bitcoin/blocks
 * Returns recent Bitcoin blocks
 * @query start_height - optional starting block height
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startHeightParam = searchParams.get('start_height');
    const startHeight = startHeightParam ? parseInt(startHeightParam, 10) : undefined;

    if (startHeightParam && isNaN(startHeight!)) {
      return NextResponse.json(
        { error: 'Invalid start_height', message: 'start_height must be a number' },
        { status: 400 }
      );
    }

    const data = await getRecentBlocks(startHeight);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch recent blocks' },
      { status: 500 }
    );
  }
}
