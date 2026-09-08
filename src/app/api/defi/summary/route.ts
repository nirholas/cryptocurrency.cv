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
import { getDefiSummary } from '@/lib/apis/defillama';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/summary
 * Returns a comprehensive DeFi market summary including TVL, volume, and protocol counts.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getDefiSummary();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch DeFi summary' },
      { status: 500 }
    );
  }
}
