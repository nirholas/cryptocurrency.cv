/**
 * GET /api/stablecoins/chains — Per-chain stablecoin TVL breakdown
 *
 * Aggregates chain distribution across all stablecoins and returns
 * ranked chain-level totals.
 *
 * Query: ?limit=25
 */

import { NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

export const revalidate = 300;

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? '25');

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
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 502 },
    );
  }
}
