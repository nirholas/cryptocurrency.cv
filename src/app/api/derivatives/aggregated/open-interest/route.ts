/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { derivativesChain } from '@/lib/providers/chains/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/aggregated/open-interest
 * Returns open interest aggregated across Hyperliquid, CoinGlass, Bybit, OKX, and dYdX
 * via the provider chain framework (circuit breakers, caching, health monitoring)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || undefined;

  try {
    const params = symbol ? { symbols: [symbol] } : {};
    const result = await derivativesChain.fetch(params);

    return NextResponse.json(
      {
        data: result.data,
        provider: result.lineage.provider,
        providers: result.lineage.contributors?.map((c) => c.provider) ?? [result.lineage.provider],
        confidence: result.lineage.confidence,
        cached: result.cached,
        latencyMs: result.latencyMs,
        timestamp: result.lineage.fetchedAt,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch aggregated open interest' },
      { status: 500 },
    );
  }
}
