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
import { getHistoricalPrices } from '@/lib/market-data';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/portfolio/correlation
 * Compute a Pearson correlation matrix for a set of coins based on daily returns.
 *
 * Query params:
 *   coins — comma-separated CoinGecko IDs (required, 2–25)
 *   days  — look-back period in days (default 90, max 365)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const coinsParam = searchParams.get('coins');
    if (!coinsParam) {
      return NextResponse.json(
        { error: 'Missing required parameter', message: "'coins' query param is required (comma-separated CoinGecko IDs)" },
        { status: 400 },
      );
    }

    const coins = coinsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 25);
    if (coins.length < 2) {
      return NextResponse.json(
        { error: 'Invalid parameters', message: 'At least 2 coin IDs are required' },
        { status: 400 },
      );
    }

    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '90', 10) || 90, 7), 365);

    // Fetch historical prices in parallel
    const priceResults = await Promise.all(
      coins.map(async id => {
        const data = await getHistoricalPrices(id, days, 'daily');
        return { id, prices: data.prices };
      }),
    );

    // Compute daily returns for each coin
    const dailyReturnsMap = new Map<string, number[]>();
    let minLen = Infinity;

    for (const { id, prices } of priceResults) {
      if (prices.length < 3) {
        return NextResponse.json(
          { error: 'Insufficient data', message: `Not enough price history for "${id}"` },
          { status: 422 },
        );
      }
      const returns: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        const prev = prices[i - 1][1];
        returns.push(prev > 0 ? (prices[i][1] - prev) / prev : 0);
      }
      dailyReturnsMap.set(id, returns);
      minLen = Math.min(minLen, returns.length);
    }

    // Trim all return series to the same length
    for (const [id, ret] of dailyReturnsMap) {
      dailyReturnsMap.set(id, ret.slice(ret.length - minLen));
    }

    // Build correlation matrix
    const matrix: Record<string, Record<string, number>> = {};
    for (const a of coins) {
      matrix[a] = {};
      for (const b of coins) {
        const ra = dailyReturnsMap.get(a)!;
        const rb = dailyReturnsMap.get(b)!;
        matrix[a][b] = parseFloat(pearson(ra, rb).toFixed(4));
      }
    }

    // Identify strongly correlated and uncorrelated pairs
    const pairs: { a: string; b: string; correlation: number }[] = [];
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        pairs.push({ a: coins[i], b: coins[j], correlation: matrix[coins[i]][coins[j]] });
      }
    }
    pairs.sort((x, y) => Math.abs(y.correlation) - Math.abs(x.correlation));

    return NextResponse.json(
      {
        coins,
        days,
        dataPoints: minLen,
        matrix,
        stronglyCorrelated: pairs.filter(p => Math.abs(p.correlation) >= 0.7),
        weaklyCorrelated: pairs.filter(p => Math.abs(p.correlation) < 0.3),
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to compute correlation matrix' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}
