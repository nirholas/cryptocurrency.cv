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
 * Returns the Nominal Broad U.S. Dollar Index (FRED DTWEXBGS) with crypto
 * correlation context. A weaker dollar has historically coincided with
 * crypto rallies.
 *
 * Includes:
 *   - Latest index value and change from the previous observation
 *   - Daily observations for the requested window, newest first
 *   - Dollar strength relative to the window's own average
 */

import { NextResponse } from 'next/server';
import { dollarScore, fetchFredSeries } from '@/lib/providers/adapters/macro/fred.adapter';

export const revalidate = 300; // ISR: DXY data refreshes every 5 min

const SERIES = 'DTWEXBGS';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requested = parseInt(searchParams.get('days') || '30', 10);
    const days = Number.isFinite(requested) ? Math.min(Math.max(requested, 7), 365) : 30;

    const observations = await fetchFredSeries(SERIES, days);
    if (observations.length === 0) throw new Error(`No ${SERIES} observations in the last ${days} days`);

    const historical = observations.map((o) => ({ date: o.date, value: Number(o.value) }));
    const [latest, previous] = historical;
    const oldest = historical[historical.length - 1];
    const change = previous ? latest.value - previous.value : null;
    const score = dollarScore(observations);

    return NextResponse.json(
      {
        data: {
          current: {
            value: latest.value,
            date: latest.date,
            change24h: change,
            changePercent24h: previous && change !== null ? (change / previous.value) * 100 : null,
          },
          historical,
          context: {
            description:
              'Nominal Broad U.S. Dollar Index — USD against the currencies of major U.S. trading partners, trade-weighted (Jan 2006 = 100)',
            cryptoCorrelation: 'BTC typically inversely correlated with the dollar',
            periodChangePercent: ((latest.value - oldest.value) / oldest.value) * 100,
            strongDollar:
              score < 40
                ? `Headwind for crypto (dollar above its ${days}-day average)`
                : score > 60
                  ? `Tailwind for crypto (dollar below its ${days}-day average)`
                  : 'Neutral',
          },
        },
        count: historical.length,
        source: 'fred',
        series: SERIES,
      },
      {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      },
    );
  } catch (error) {
    console.error('[Macro/DXY] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch DXY data',
        message: error instanceof Error ? error.message : 'Unknown',
      },
      { status: 502 },
    );
  }
}
