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
 * GET /api/macro/risk-appetite
 *
 * Composite risk-appetite signal combining VIX + DXY + yield spread + funding rates.
 * Score 0-100: 0 = extreme risk-off, 100 = extreme risk-on.
 */

import { NextResponse } from 'next/server';
import { macroChain } from '@/lib/providers/adapters/macro';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await macroChain.fetch({});

    return NextResponse.json({
      ...result.data.riskAppetite,
      indicators: result.data.indicators
        .filter(i => ['VIX', 'DXY', 'US10Y', 'US2Y', 'SP500'].includes(i.id))
        .map(i => ({ id: i.id, name: i.name, value: i.value, change: i.changePercent })),
      source: result.lineage.provider,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[Risk Appetite] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute risk appetite' },
      { status: 502 },
    );
  }
}
