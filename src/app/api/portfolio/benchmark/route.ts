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
 * GET /api/portfolio/benchmark
 * Compare portfolio performance against BTC, ETH, and other benchmarks.
 *
 * Query params:
 *   coins  — comma-separated CoinGecko IDs in the portfolio (required)
 *   weights — comma-separated decimal weights matching `coins` order (required, must sum ≈ 1)
 *   days   — look-back period in days (default 30, max 365)
 *   benchmarks — comma-separated benchmark coin IDs (default "bitcoin,ethereum")
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;

    const coinsParam = searchParams.get('coins');
    const weightsParam = searchParams.get('weights');
    if (!coinsParam || !weightsParam) {
      return NextResponse.json(
        { error: 'Missing required parameters', message: "'coins' and 'weights' query params are required (comma-separated)" },
        { status: 400 },
      );
    }

    const coins = coinsParam.split(',').map(s => s.trim()).filter(Boolean);
    const weights = weightsParam.split(',').map(s => parseFloat(s.trim()));

    if (coins.length === 0 || coins.length !== weights.length) {
      return NextResponse.json(
        { error: 'Invalid parameters', message: "'coins' and 'weights' must have the same non-zero length" },
        { status: 400 },
      );
    }

    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 365);
    const benchmarkIds = (searchParams.get('benchmarks') || 'bitcoin,ethereum')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Fetch historical prices for portfolio coins and benchmarks in parallel
    const allIds = [...new Set([...coins, ...benchmarkIds])];
    const historicalMap = new Map<string, [number, number][]>();

    const results = await Promise.all(
      allIds.map(async id => {
        const data = await getHistoricalPrices(id, days, 'daily');
        return { id, prices: data.prices };
      }),
    );

    for (const r of results) {
      historicalMap.set(r.id, r.prices);
    }

    // Calculate normalised return series for the portfolio
    const portfolioReturns = calculateWeightedReturns(coins, weights, historicalMap);

    // Calculate normalised return series for each benchmark
    const benchmarkReturns: Record<string, { dates: string[]; returns: number[] }> = {};
    for (const bId of benchmarkIds) {
      const prices = historicalMap.get(bId);
      if (prices && prices.length >= 2) {
        const startPrice = prices[0][1];
        benchmarkReturns[bId] = {
          dates: prices.map(p => new Date(p[0]).toISOString().split('T')[0]),
          returns: prices.map(p => ((p[1] - startPrice) / startPrice) * 100),
        };
      }
    }

    // Summary statistics
    const portfolioPerf = portfolioReturns.returns.length > 0
      ? portfolioReturns.returns[portfolioReturns.returns.length - 1]
      : 0;

    const benchmarkSummary: Record<string, number> = {};
    for (const [bId, br] of Object.entries(benchmarkReturns)) {
      benchmarkSummary[bId] = br.returns.length > 0 ? br.returns[br.returns.length - 1] : 0;
    }

    const alpha: Record<string, number> = {};
    for (const [bId, bPerf] of Object.entries(benchmarkSummary)) {
      alpha[bId] = parseFloat((portfolioPerf - bPerf).toFixed(2));
    }

    return NextResponse.json(
      {
        days,
        portfolio: {
          coins,
          weights,
          performance: parseFloat(portfolioPerf.toFixed(2)),
          series: portfolioReturns,
        },
        benchmarks: Object.fromEntries(
          Object.entries(benchmarkReturns).map(([id, data]) => [
            id,
            {
              performance: parseFloat(benchmarkSummary[id].toFixed(2)),
              series: data,
            },
          ]),
        ),
        alpha,
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
      { error: 'Failed to compute benchmark comparison' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateWeightedReturns(
  coins: string[],
  weights: number[],
  historicalMap: Map<string, [number, number][]>,
): { dates: string[]; returns: number[] } {
  // Use the shortest price series length to keep arrays aligned
  let minLen = Infinity;
  const priceSeries: [number, number][][] = [];

  for (const id of coins) {
    const series = historicalMap.get(id);
    if (!series || series.length < 2) {
      return { dates: [], returns: [] };
    }
    priceSeries.push(series);
    minLen = Math.min(minLen, series.length);
  }

  const dates: string[] = [];
  const returns: number[] = [];

  for (let i = 0; i < minLen; i++) {
    let weightedReturn = 0;
    for (let j = 0; j < coins.length; j++) {
      const startPrice = priceSeries[j][0][1];
      const currentPrice = priceSeries[j][i][1];
      const coinReturn = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
      weightedReturn += coinReturn * weights[j];
    }

    dates.push(new Date(priceSeries[0][i][0]).toISOString().split('T')[0]);
    returns.push(parseFloat(weightedReturn.toFixed(2)));
  }

  return { dates, returns };
}
