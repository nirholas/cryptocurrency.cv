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
import { getTransaction } from '@/lib/bitcoin-onchain';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/bitcoin/tx/[txid]
 * Returns a Bitcoin transaction by its ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ txid: string }> }
): Promise<NextResponse> {
  const { txid } = await params;

  if (!txid || !/^[0-9a-f]{64}$/i.test(txid)) {
    return NextResponse.json(
      { error: 'Transaction ID must be 64 hex characters' },
      { status: 400 }
    );
  }

  try {
    const data = await getTransaction(txid);

    if (!data) {
      return NextResponse.json(
        { error: 'Transaction not found', message: `No transaction found for txid "${txid}"` },
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
        { error: 'Transaction not found', message: `No transaction found for txid "${txid}"` },
        { status: 404 }
      );
    }
    console.error('bitcoin/tx route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 502 }
    );
  }
}
