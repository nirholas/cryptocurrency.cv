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
 * GET /api/macro/indicators
 *
 * Returns individual macro indicators with current values, changes,
 * and metadata. Supports filtering by indicator name.
 *
 * Query params:
 *   - indicators: comma-separated list (e.g., "DXY,VIX,SPX")
 *   - period: time period for changes ("1d", "1w", "1m", "3m")
 */

import { NextResponse } from 'next/server';
import { macroChain } from '@/lib/providers/adapters/macro';
import type { MacroIndicator } from '@/lib/providers/adapters/macro/types';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterStr = searchParams.get('indicators');
    const period = searchParams.get('period') || '1d';

    const result = await macroChain.fetch({ extra: { period } });
    let indicators = result.data.indicators ?? [];

    // Filter by requested indicators
    if (filterStr) {
      const requested = filterStr.split(',').map(s => s.trim().toUpperCase());
      indicators = indicators.filter((ind: MacroIndicator) => {
        const sym = ((ind as MacroIndicator & { symbol?: string }).symbol || ind.name || '').toUpperCase();
        return requested.some(r => sym.includes(r));
      });
    }

    return NextResponse.json({
      data: indicators,
      count: indicators.length,
      period,
      _lineage: result.lineage,
      _cached: result.cached,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[Macro/Indicators] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch macro indicators', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
