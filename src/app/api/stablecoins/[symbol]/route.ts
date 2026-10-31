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
 * GET /api/stablecoins/[symbol] — Individual stablecoin detail
 *
 * Returns detailed data for a specific stablecoin including
 * chain distribution, price, and supply changes.
 */

import { type NextRequest, NextResponse } from 'next/server';
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
    console.error('stablecoins/[symbol] route error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 502 },
    );
  }
}
