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
import { getTransactionBlock, getTransactionsByAddress } from '@/lib/apis/sui';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/sui/transactions?address=<addr>   — transactions from address
 * GET /api/sui/transactions?digest=<digest>  — single transaction lookup
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const digest = searchParams.get('digest');

    if (digest) {
      const data = await getTransactionBlock(digest);
      return NextResponse.json({
        data,
        source: 'sui-rpc',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address or digest' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const cursor = searchParams.get('cursor') || undefined;
    const data = await getTransactionsByAddress(address, { limit, cursor });

    return NextResponse.json({
      address,
      ...data,
      source: 'sui-rpc',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Sui transactions' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
