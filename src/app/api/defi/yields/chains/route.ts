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
import { getChains } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 3600;

/**
 * GET /api/defi/yields/chains
 * Returns all chains with available yield pools.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getChains();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch chains' },
      { status: 500 }
    );
  }
}
