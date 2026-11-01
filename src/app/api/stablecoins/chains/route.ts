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
 * GET /api/stablecoins/chains — Per-chain stablecoin TVL breakdown
 *
 * Aggregates chain distribution across all stablecoins and returns
 * ranked chain-level totals.
 *
 * Query: ?limit=25
 */

import { type NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';
import { intParam } from '@/lib/query-params';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  try {
    const limit = intParam(req.nextUrl.searchParams, 'limit', { fallback: 25, min: 1, max: 100 });

    const result = await stablecoinFlowsChain.fetch({ limit: 100 });
    const data = result.data;

    // Aggregate across chains
    const chainMap = new Map<string, number>();
    for (const sc of data) {
      for (const c of sc.chainDistribution) {
        chainMap.set(c.chain, (chainMap.get(c.chain) ?? 0) + c.amount);
      }
    }

    const chains = [...chainMap.entries()]
      .map(([chain, tvl]) => ({ chain, tvl }))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, limit);

    const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);

    return NextResponse.json(
      {
        status: 'ok',
        totalTvl,
        count: chains.length,
        chains,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('stablecoins/chains route error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 502 },
    );
  }
}
