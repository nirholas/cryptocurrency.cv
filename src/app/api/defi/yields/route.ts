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
import { getAllPools, getTopYields } from '@/lib/defi-yields';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/defi/yields
 * Returns top DeFi yield pools with optional filtering.
 * Use ?type=all to get all pools instead of filtered top yields.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const chain = searchParams.get('chain') || undefined;
  const project = searchParams.get('project') || undefined;
  const stableParam = searchParams.get('stable');
  const stable = stableParam !== null ? stableParam === 'true' : undefined;
  const minTvl = searchParams.get('min_tvl') ? parseFloat(searchParams.get('min_tvl')!) : undefined;
  const minApy = searchParams.get('min_apy') ? parseFloat(searchParams.get('min_apy')!) : undefined;
  const maxApy = searchParams.get('max_apy') ? parseFloat(searchParams.get('max_apy')!) : undefined;

  try {
    let data;
    if (type === 'all') {
      data = await getAllPools();
    } else {
      data = await getTopYields({ limit, chain, project, stablecoin: stable, minTvl });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch DeFi yields' },
      { status: 500 }
    );
  }
}
