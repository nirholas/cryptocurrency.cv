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
import { getBridges } from '@/lib/apis/defillama';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/bridges
 * Returns cross-chain bridge data from DefiLlama.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await getBridges();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch bridge data' },
      { status: 500 }
    );
  }
}
