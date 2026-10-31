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
 * Returns top blockchain games.
 *
 * Query: `limit` (1-100, default 25), `chain` (e.g. `Ronin`; `all` for every
 * chain) and `sort` (`dau`, `players`, `volume` or `tvl`; default is the
 * provider's own ranking, reported as `sortBy`). Games missing the sort
 * metric are listed last.
 */

import { NextResponse } from 'next/server';
import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';
import { parseGameSort, sortGames } from '@/lib/providers/adapters/gaming-data/rank';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(parsed, 1), MAX_LIMIT);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get('limit'));
    const sortParam = searchParams.get('sort');
    const sortKey = parseGameSort(sortParam);
    if (sortParam && !sortKey) {
      return NextResponse.json(
        { error: 'Invalid sort. Use dau, players, volume or tvl.' },
        { status: 400 },
      );
    }
    const chainParam = searchParams.get('chain')?.trim();
    const chain = chainParam && chainParam.toLowerCase() !== 'all' ? chainParam : undefined;

    const result = await gamingDataChain.fetch({ limit, chain });
    const games = result.data.topGames;
    const sorted = (sortKey ? sortGames(games, sortKey) : games).slice(0, limit);

    return NextResponse.json(
      {
        data: sorted,
        count: sorted.length,
        sortBy: sortKey ?? result.data.rankedBy,
        chain: chain || 'all',
        _lineage: result.lineage,
        _cached: result.cached,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      },
    );
  } catch (error) {
    console.error('[Gaming/Top] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top games' },
      { status: 502 },
    );
  }
}
