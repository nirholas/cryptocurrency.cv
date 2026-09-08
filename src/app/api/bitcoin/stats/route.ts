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
import { getBitcoinStats } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/bitcoin/stats
 * Returns comprehensive Bitcoin stats (fees, difficulty, network, mempool, block height)
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getBitcoinStats();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin stats' },
      { status: 500 }
    );
  }
}
