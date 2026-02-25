/**
 * GET /api/stablecoins/dominance — Stablecoin market dominance chart data
 *
 * Returns market share percentages for top stablecoins.
 *
 * Query: ?limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? '10');

    const data = await stablecoinFlowsChain.resolve({ limit: 100 });

    const totalMcap = data.reduce((sum, s) => sum + s.circulatingUsd, 0);

    const dominance = data
      .sort((a, b) => b.circulatingUsd - a.circulatingUsd)
      .slice(0, limit)
      .map(s => ({
        symbol: s.symbol,
        name: s.name,
        circulatingUsd: s.circulatingUsd,
        dominancePct: totalMcap > 0 ? Math.round((s.circulatingUsd / totalMcap) * 10000) / 100 : 0,
      }));

    const topTotalPct = dominance.reduce((sum, d) => sum + d.dominancePct, 0);

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
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 },
    );
  }
}
