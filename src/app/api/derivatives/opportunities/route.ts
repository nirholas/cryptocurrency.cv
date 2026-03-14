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
import { fundingRateChain } from '@/lib/providers/chains/derivatives';
import type { FundingRate } from '@/lib/providers/chains/derivatives';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/derivatives/opportunities
 * Returns top funding rate opportunities (highest positive and lowest negative) across exchanges
 * Uses the provider chain framework for resilient multi-exchange data fetching
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

  try {
    const result = await fundingRateChain.fetch({});
    const rates = result.data as FundingRate[];

    const sorted = [...rates].sort((a, b) => b.fundingRate - a.fundingRate);

    return NextResponse.json(
      {
        highest: sorted.slice(0, limit),
        lowest: sorted.slice(-limit).reverse(),
        providers: result.lineage.contributors?.map((c) => c.provider) ?? [result.lineage.provider],
        confidence: result.lineage.confidence,
        cached: result.cached,
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
    return NextResponse.json({ error: 'Failed to fetch funding opportunities' }, { status: 500 });
  }
}
