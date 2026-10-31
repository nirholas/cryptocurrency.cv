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
 * GET /api/stablecoins/dominance — Stablecoin market dominance chart data
 *
 * Returns market share percentages for top stablecoins.
 *
 * Query: ?limit=10
 */

import { type NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? '10');

    const result = await stablecoinFlowsChain.fetch({ limit: 100 });
    const data = result.data;

    const totalMcap = data.reduce((sum: number, s: { circulatingUsd: number }) => sum + s.circulatingUsd, 0);

    const dominance = data
      .sort((a: { circulatingUsd: number }, b: { circulatingUsd: number }) => b.circulatingUsd - a.circulatingUsd)
      .slice(0, limit)
      .map((s: { symbol: string; name: string; circulatingUsd: number }) => ({
        symbol: s.symbol,
        name: s.name,
        circulatingUsd: s.circulatingUsd,
        dominancePct: totalMcap > 0 ? Math.round((s.circulatingUsd / totalMcap) * 10000) / 100 : 0,
      }));

    const topTotalPct = dominance.reduce((sum: number, d: { dominancePct: number }) => sum + d.dominancePct, 0);

    return NextResponse.json(
      {
        status: 'ok',
        totalMarketCap: totalMcap,
        count: dominance.length,
        dominance,
        otherPct: Math.round((100 - topTotalPct) * 100) / 100,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('stablecoins/dominance route error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 502 },
    );
  }
}
