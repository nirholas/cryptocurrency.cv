/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import { getEthereumGasSnapshot } from '@/lib/gas-snapshot';

export const revalidate = 30;

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' };

/**
 * GET /api/gas
 *
 * Current Ethereum gas prices. See `getEthereumGasSnapshot` for the source
 * order and response shape. When every source is down it returns 503 rather
 * than guessing.
 */
export async function GET() {
  try {
    const snapshot = await getEthereumGasSnapshot();
    if (snapshot) return NextResponse.json(snapshot, { headers: CACHE_HEADERS });

    return NextResponse.json(
      {
        error: 'Gas prices are temporarily unavailable',
        message: 'Every gas source (Etherscan, eth_feeHistory, Owlracle) failed. Retry in a few seconds.',
      },
      { status: 503, headers: { 'Retry-After': '15' } },
    );
  } catch (error) {
    console.error('Gas API error:', error);
    return NextResponse.json({ error: 'Failed to fetch gas prices' }, { status: 500 });
  }
}
