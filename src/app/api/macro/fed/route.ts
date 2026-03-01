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
 * GET /api/macro/fed
 *
 * Returns Federal Reserve related data:
 *   - Federal Funds Rate (current + target range)
 *   - Fed Balance Sheet size
 *   - Treasury yields (2Y, 5Y, 10Y, 30Y)
 *   - Yield curve inversion status
 *
 * Data sourced from FRED API (St. Louis Fed).
 */

import { NextResponse } from 'next/server';
import { macroChain } from '@/lib/providers/adapters/macro';

export const revalidate = 900; // 15min cache — Fed data changes infrequently
export const dynamic = 'force-dynamic';

const FED_SERIES = ['FEDFUNDS', 'DFF', 'DGS2', 'DGS5', 'DGS10', 'DGS30', 'WALCL'];

export async function GET() {
  try {
    const result = await macroChain.fetch({
      extra: { series: FED_SERIES, source: 'fred' },
    });

    const allData = Array.isArray(result.data) ? result.data : [];

    // Extract Fed-specific indicators
    const fedData: Record<string, unknown>[] = allData.filter((d: Record<string, unknown>) => {
      const name = ((d.symbol as string) || (d.name as string) || '').toUpperCase();
      return FED_SERIES.some(s => name.includes(s)) ||
        name.includes('FED') ||
        name.includes('TREASURY') ||
        name.includes('YIELD');
    });

    // Compute yield curve slope (10Y - 2Y)
    const t2y = fedData.find((d: Record<string, unknown>) =>
      ((d.symbol as string) || '').includes('DGS2') || ((d.name as string) || '').includes('2-Year'));
    const t10y = fedData.find((d: Record<string, unknown>) =>
      ((d.symbol as string) || '').includes('DGS10') || ((d.name as string) || '').includes('10-Year'));

    const yieldCurve = {
      spread2s10s: t2y && t10y
        ? ((t10y as Record<string, unknown>).value as number ?? 0) -
          ((t2y as Record<string, unknown>).value as number ?? 0)
        : null,
      inverted: t2y && t10y
        ? ((t10y as Record<string, unknown>).value as number ?? 0) <
          ((t2y as Record<string, unknown>).value as number ?? 0)
        : null,
    };

    return NextResponse.json({
      data: fedData,
      yieldCurve,
      count: fedData.length,
      _lineage: result.lineage,
      _cached: result.cached,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
    });
  } catch (error) {
    console.error('[Macro/Fed] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Fed data', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
