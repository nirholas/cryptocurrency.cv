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
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 },
    );
  }
}
