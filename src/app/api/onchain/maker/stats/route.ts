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
import { getMakerStats } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/maker/stats
 * Returns Maker protocol stats (DAI supply, vaults) from The Graph
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getMakerStats();
    if (!data) {
      return NextResponse.json({ error: 'Failed to fetch Maker stats' }, { status: 503 });
    }
    return NextResponse.json({
      protocol: 'Maker',
      chain: 'ethereum',
      data,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Maker stats' }, { status: 500 });
  }
}
