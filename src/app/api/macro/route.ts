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
 * GET /api/macro
 *
 * Returns macro/tradfi indicators (DXY, VIX, S&P 500, NASDAQ, Gold, Oil,
 * Treasury yields, Fed Funds rate) plus a composite risk-appetite score.
 *
 * Uses the macro provider chain (FRED + Alpha Vantage + Twelve Data).
 */

import { NextResponse } from 'next/server';
import { macroChain } from '@/lib/providers/adapters/macro';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await macroChain.fetch({});

    return NextResponse.json({
      ...result.data,
      _lineage: result.lineage,
      _cached: result.cached,
      _latencyMs: result.latencyMs,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[Macro] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch macro data', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
