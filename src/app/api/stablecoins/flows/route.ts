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
 * GET /api/stablecoins/flows — Stablecoin supply flows & changes
 *
 * Returns top stablecoins with circulating supply, 24h/7d changes,
 * and per-chain distribution.
 *
 * Query: ?limit=20
 */

import { type NextRequest, NextResponse } from 'next/server';
import { stablecoinFlowsChain } from '@/lib/providers/adapters/stablecoin-flows';

export const revalidate = 300; // ISR 5 min

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? '20');

    const result = await stablecoinFlowsChain.fetch({ limit: Math.min(limit, 100) });
    const data = result.data;

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
    console.error('stablecoins/flows route error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 502 },
    );
  }
}
