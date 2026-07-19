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
 * Global Market Data API Route
 * GET /api/global
 * 
 * Proxies CoinGecko /global endpoint with server-side caching.
 * Used by the header MarketWidget to avoid direct client→CoinGecko calls.
 */

import { NextResponse } from 'next/server';
import { getGlobalMarketData } from '@/lib/market-data';

export const revalidate = 120; // ISR: revalidate every 2 minutes

export async function GET() {
  try {
    // getGlobalMarketData has a CoinGecko -> CoinPaprika fallback chain, so this
    // header widget keeps working when the keyless CoinGecko tier is throttled.
    const data = await getGlobalMarketData();

    if (!data) {
      // Degrade to a 200 empty payload so the header MarketWidget renders an
      // empty state instead of surfacing a 5xx on every page.
      return NextResponse.json(
        {
          active_cryptocurrencies: 0,
          markets: 0,
          total_market_cap: {},
          total_volume: {},
          market_cap_percentage: {},
          market_cap_change_percentage_24h_usd: 0,
          updated_at: 0,
        },
        { headers: { 'Cache-Control': 'public, s-maxage=30' } },
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Global market data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global market data' },
      { status: 502 }
    );
  }
}
