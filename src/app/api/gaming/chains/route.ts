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
 * GET /api/gaming/chains
 *
 * Returns blockchain gaming activity per chain: number of games plus total
 * players, volume and value locked where the provider reports them (null
 * when no game on the chain does). Ordered by game count.
 */

import { NextResponse } from 'next/server';
import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';
import { aggregateByChain } from '@/lib/providers/adapters/gaming-data/rank';

export const revalidate = 300; // ISR: gaming chain data refreshes every 5 min

export async function GET() {
  try {
    const result = await gamingDataChain.fetch({ limit: 100 });
    const chains = aggregateByChain(result.data.topGames);

    return NextResponse.json(
      {
        data: chains,
        count: chains.length,
        _lineage: result.lineage,
        _cached: result.cached,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      },
    );
  } catch (error) {
    console.error('[Gaming/Chains] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaming chain data' },
      { status: 502 },
    );
  }
}
