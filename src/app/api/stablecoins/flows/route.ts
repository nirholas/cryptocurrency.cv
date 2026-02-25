/**
 * GET /api/stablecoins/flows — Stablecoin supply flows & changes
 *
 * Returns top stablecoins with circulating supply, 24h/7d changes,
 * and per-chain distribution.
 *
 * Query: ?limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

export const revalidate = 300; // ISR 5 min

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? '20');

    const data = await stablecoinFlowsChain.resolve({ limit: Math.min(limit, 100) });

    return NextResponse.json(
      {
        status: 'ok',
        count: data.length,
        data,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Source': 'stablecoin-flows-chain',
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
