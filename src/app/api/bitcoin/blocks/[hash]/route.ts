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
import { getBlock } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/bitcoin/blocks/[hash]
 * Returns a specific Bitcoin block by its hash
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
): Promise<NextResponse> {
  const { hash } = await params;

  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) {
    return NextResponse.json(
      { error: 'Block hash must be 64 hex characters' },
      { status: 400 }
    );
  }

  try {
    const data = await getBlock(hash);

    if (!data) {
      return NextResponse.json(
        { error: 'Block not found', message: `No block found for hash "${hash}"` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const errorMsg = String(error);
    if (errorMsg.includes('404') || errorMsg.includes('not found')) {
      return NextResponse.json(
        { error: 'Block not found', message: `No block found for hash "${hash}"` },
        { status: 404 }
      );
    }
    console.error('bitcoin/blocks route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block' },
      { status: 502 }
    );
  }
}
