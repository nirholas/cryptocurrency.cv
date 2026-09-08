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
import { getCompoundV3Markets } from '@/lib/apis/thegraph';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/onchain/compound/markets
 * Returns Compound V3 lending markets from The Graph
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getCompoundV3Markets();
    return NextResponse.json({
      protocol: 'Compound V3',
      data,
      count: data.length,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch Compound V3 markets' }, { status: 500 });
  }
}
