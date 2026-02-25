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
  const json = await fetchCoinGecko<{ data: unknown }>(
    `${COINGECKO_BASE}/global`,
    { revalidate: 120 }
  );

  if (!json || !json.data) {
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
}
