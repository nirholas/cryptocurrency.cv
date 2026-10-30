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
 *   - Effective Federal Funds Rate (daily and monthly average)
 *   - Fed Balance Sheet size
 *   - Treasury yields (2Y, 5Y, 10Y, 30Y)
 *   - Yield curve inversion status
 *
 * Data sourced from FRED (St. Louis Fed).
 */

import { NextResponse } from 'next/server';
import { fetchFredSeries } from '@/lib/providers/adapters/macro/fred.adapter';

export const revalidate = 3600; // ISR: Fed data changes infrequently (1 hour)

const FED_SERIES: Record<string, { name: string; unit: string }> = {
  DFF: { name: 'Effective Federal Funds Rate (daily)', unit: '%' },
  FEDFUNDS: { name: 'Effective Federal Funds Rate (monthly average)', unit: '%' },
  DGS2: { name: '2-Year Treasury Yield', unit: '%' },
  DGS5: { name: '5-Year Treasury Yield', unit: '%' },
  DGS10: { name: '10-Year Treasury Yield', unit: '%' },
  DGS30: { name: '30-Year Treasury Yield', unit: '%' },
  WALCL: { name: 'Fed Total Assets (balance sheet)', unit: 'millions USD' },
};

interface FedSeries {
  series: string;
  name: string;
  value: number;
  previousValue: number | null;
  change: number | null;
  unit: string;
  date: string;
}

export async function GET() {
  try {
    const ids = Object.keys(FED_SERIES);
    // 90 days covers at least two observations of the monthly FEDFUNDS series
    const results = await Promise.allSettled(ids.map((id) => fetchFredSeries(id, 90)));

    const fedData: FedSeries[] = [];
    results.forEach((r, i) => {
      if (r.status !== 'fulfilled' || r.value.length === 0) return;
      const [latest, previous] = r.value;
      const value = Number(latest.value);
      const previousValue = previous ? Number(previous.value) : null;
      fedData.push({
        series: ids[i],
        ...FED_SERIES[ids[i]],
        value,
        previousValue,
        change: previousValue !== null ? value - previousValue : null,
        date: latest.date,
      });
    });

    if (fedData.length === 0) throw new Error('No FRED data returned');

    const t2y = fedData.find((d) => d.series === 'DGS2')?.value;
    const t10y = fedData.find((d) => d.series === 'DGS10')?.value;
    const yieldCurve =
      t2y !== undefined && t10y !== undefined
        ? { spread2s10s: Math.round((t10y - t2y) * 100) / 100, inverted: t10y < t2y }
        : { spread2s10s: null, inverted: null };

    return NextResponse.json(
      {
        data: fedData,
        yieldCurve,
        count: fedData.length,
        source: 'fred',
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
      },
    );
  } catch (error) {
    console.error('[Macro/Fed] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Fed data',
        message: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 502 },
    );
  }
}
