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
 * GET /api/macro/dxy
 *
 * Returns US Dollar Index (DXY) data with crypto correlation context.
 * DXY inversely correlates with BTC — when dollar weakens, crypto tends to rally.
 *
 * Includes:
 *   - Current DXY value and changes
 *   - Historical DXY data points
 *   - DXY-BTC inverse correlation coefficient
 */

import { NextResponse } from 'next/server';
import { macroChain } from '@/lib/providers/adapters/macro';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);

    const result = await macroChain.fetch({
      extra: { series: ['DXY', 'DTWEXBGS'], source: 'fred', days },
    });

    const allData = Array.isArray(result.data) ? result.data : [];

    // Extract DXY data
    const dxyData = allData.filter((d: Record<string, unknown>) => {
      const name = ((d.symbol as string) || (d.name as string) || '').toUpperCase();
      return name.includes('DXY') || name.includes('DOLLAR') || name.includes('DTWEX');
    });

    // Current values
    const current = dxyData[0] as Record<string, unknown> | undefined;
    const currentValue = (current?.value as number) ?? (current?.price as number) ?? 0;

    return NextResponse.json({
      data: {
        current: {
          value: currentValue,
          change24h: (current?.change as number) ?? 0,
          changePercent24h: (current?.changePercent as number) ?? 0,
        },
        historical: dxyData,
        context: {
          description: 'US Dollar Index — measures USD against basket of 6 major currencies',
          cryptoCorrelation: 'BTC typically inversely correlated with DXY',
          strongDollar: currentValue > 105 ? 'Headwind for crypto' : currentValue < 100 ? 'Tailwind for crypto' : 'Neutral',
        },
      },
      count: dxyData.length,
      _lineage: result.lineage,
      _cached: result.cached,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[Macro/DXY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DXY data', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
