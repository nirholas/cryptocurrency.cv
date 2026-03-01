/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * GET /api/gaming/top
 *
 * Returns top blockchain games ranked by daily active users (DAU),
 * transaction volume, and player count.
 */

import { NextResponse } from 'next/server';
import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const sortBy = searchParams.get('sort') || 'dau'; // dau | volume | players
    const chain = searchParams.get('chain') || undefined;

    const result = await gamingDataChain.fetch({
      limit,
      chain,
      extra: { sortBy },
    });

    const games = Array.isArray(result.data) ? result.data : [];

    // Sort by chosen metric
    const sorted = [...games].sort((a, b) => {
      const aVal = (a as Record<string, unknown>);
      const bVal = (b as Record<string, unknown>);
      switch (sortBy) {
        case 'volume':
          return ((bVal.volume as number) ?? 0) - ((aVal.volume as number) ?? 0);
        case 'players':
          return ((bVal.users as number) ?? 0) - ((aVal.users as number) ?? 0);
        case 'dau':
        default:
          return ((bVal.dau as number) ?? 0) - ((aVal.dau as number) ?? 0);
      }
    }).slice(0, limit);

    return NextResponse.json({
      data: sorted,
      count: sorted.length,
      sortBy,
      chain: chain || 'all',
      _lineage: result.lineage,
      _cached: result.cached,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[Gaming/Top] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top games', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
