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
import { getTransactionHistory } from '@/lib/apis/helius';
import { getParsedTransactions } from '@/lib/apis/shyft';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * GET /api/solana/transactions?address=<wallet>
 * GET /api/solana/transactions?address=<wallet>&source=shyft  — parsed via Shyft
 * GET /api/solana/transactions?address=<wallet>&limit=50
 * Returns parsed transaction history for a Solana address.
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

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const source = searchParams.get('source');

    if (source === 'shyft') {
      const data = await getParsedTransactions(address, { limit });
      return NextResponse.json({
        address,
        count: data.length,
        data,
        source: 'shyft',
        timestamp: new Date().toISOString(),
      }, {
        headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
      });
    }

    const data = await getTransactionHistory(address, { limit });

    return NextResponse.json({
      address,
      count: data.length,
      data,
      source: 'helius',
      timestamp: new Date().toISOString(),
    }, {
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
