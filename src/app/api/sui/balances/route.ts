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
import { getAllBalances, getBalance } from '@/lib/apis/sui';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/sui/balances?address=<addr>
 * GET /api/sui/balances?address=<addr>&coin=<coin_type>
 * Returns coin balances for a Sui address.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    if (!address) {
      return NextResponse.json(
        { error: 'Missing required parameter: address' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const coinType = searchParams.get('coin');

    if (coinType) {
      const data = await getBalance(address, coinType);
      return NextResponse.json({
        address,
        data,
        source: 'sui-rpc',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    const data = await getAllBalances(address);

    return NextResponse.json({
      address,
      count: data.length,
      data,
      source: 'sui-rpc',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Sui balances' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
