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
import { getMempoolBlocks } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 15;

/**
 * GET /api/bitcoin/mempool/blocks
 * Returns projected mempool blocks with fee estimates
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMempoolBlocks();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch mempool blocks' },
      { status: 500 }
    );
  }
}
