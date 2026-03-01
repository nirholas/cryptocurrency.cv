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
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';

export const revalidate = 120; // ISR: revalidate every 2 minutes

export async function GET() {
  try {
    const json = await fetchCoinGecko<{ data: unknown }>(
      `${COINGECKO_BASE}/global`,
      { revalidate: 120 }
    );

    if (!json?.data) {
      return NextResponse.json(
        { error: 'Failed to fetch global market data' },
        { status: 502 }
      );
    }

    return NextResponse.json(json.data, {
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
