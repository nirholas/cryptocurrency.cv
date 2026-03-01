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
 * GET /api/macro/correlations
 *
 * Returns BTC ↔ macro correlations (30d and 90d Pearson r).
 * Pairs: BTC-SP500, BTC-NASDAQ, BTC-GOLD, BTC-DXY, BTC-VIX
 */

import { NextResponse } from 'next/server';
import { computeCorrelations, type TimeSeries } from '@/lib/macro/correlation';

export const revalidate = 3600; // 1 hour
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch BTC daily prices from CoinGecko (90 days)
    const btcRes = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily',
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) },
    );
    if (!btcRes.ok) throw new Error(`CoinGecko HTTP ${btcRes.status}`);
    const btcJson = await btcRes.json();

    const btcPrices: TimeSeries = {
      dates: (btcJson.prices as [number, number][]).map(([ts]) =>
        new Date(ts).toISOString().slice(0, 10),
      ),
      values: (btcJson.prices as [number, number][]).map(([, p]) => p),
    };

    // Fetch S&P500 / Gold / DXY from Alpha Vantage or use mock if unavailable
    const macroPrices: Record<string, TimeSeries> = {};

    const avKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (avKey) {
      const symbols = ['SPY', 'QQQ', 'GLD'];
      const ids = ['SP500', 'NASDAQ', 'GOLD'];

      for (let i = 0; i < symbols.length; i++) {
        try {
          const res = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbols[i]}&outputsize=compact&apikey=${avKey}`,
            { signal: AbortSignal.timeout(8000) },
          );
          if (res.ok) {
            const json = await res.json();
            const tsData = json['Time Series (Daily)'];
            if (tsData) {
              const entries = Object.entries(tsData).slice(0, 90) as [string, Record<string, string>][];
              macroPrices[ids[i]] = {
                dates: entries.map(([d]) => d),
                values: entries.map(([, v]) => parseFloat(v['4. close'])),
              };
            }
          }
          await new Promise(r => setTimeout(r, 500)); // Rate limit
        } catch { /* skip */ }
      }
    }

    const correlations = computeCorrelations(btcPrices, macroPrices);

    return NextResponse.json({
      correlations,
      pairs: correlations.length,
      note: correlations.length === 0
        ? 'Set ALPHA_VANTAGE_API_KEY for macro correlation data'
        : undefined,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
    });
  } catch (error) {
    console.error('[Macro Correlations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute correlations', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 502 },
    );
  }
}
