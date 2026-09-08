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
import { getAddress, getAddressTransactions } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 60;

/**
 * GET /api/bitcoin/address/[address]
 * Returns Bitcoin address info, optionally with transactions
 * @query include_txs - "true" to include transactions (default: false)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
): Promise<NextResponse> {
  const { address } = await params;

  if (!address) {
    return NextResponse.json(
      { error: 'Address is required' },
      { status: 400 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const includeTxs = searchParams.get('include_txs') === 'true';

  try {
    if (includeTxs) {
      const [addressData, transactions] = await Promise.all([
        getAddress(address),
        getAddressTransactions(address),
      ]);
      return NextResponse.json({ address: addressData, transactions }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await getAddress(address);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch address data' },
      { status: 500 }
    );
  }
}
