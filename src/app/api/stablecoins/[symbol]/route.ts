/**
 * GET /api/stablecoins/[symbol] — Individual stablecoin detail
 *
 * Returns detailed data for a specific stablecoin including
 * chain distribution, price, and supply changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  try {
    const { symbol } = await params;
    const upperSymbol = symbol.toUpperCase();

    const result = await stablecoinFlowsChain.fetch({ limit: 100 });
    const coin = result.data.find((s: { symbol: string }) => s.symbol.toUpperCase() === upperSymbol);

    if (!coin) {
      return NextResponse.json(
        { status: 'error', message: `Stablecoin ${upperSymbol} not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        data: coin,
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
