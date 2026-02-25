/**
 * Simple price lookup API route
 * GET /api/prices?coins=bitcoin,ethereum,solana
 * Returns { bitcoin: { usd: 50000, usd_24h_change: 1.5 }, ... }
 *
 * Fallback chain:
 *   1. Short-lived in-memory cache (60 s)
 *   2. CoinGecko via fetchCoinGecko (which already has CoinCap/CoinPaprika fallbacks)
 *   3. Stale cache (last-known-good, up to 1 hour old)
 *   4. Empty {} — never throw to the caller
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';
import { staleCache, cache, generateCacheKey } from '@/lib/cache';

export const revalidate = 120;

export async function GET(request: NextRequest) {
  const isFreeTier = request.headers.get('x-free-tier') === '1';
  const coins = request.nextUrl.searchParams.get('coins');

  if (!coins) {
    return NextResponse.json(
      { error: 'Missing "coins" query parameter' },
      { status: 400 }
    );
  }

  const coinIds = coins
    .split(',')
    .map(c => c.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, isFreeTier ? 3 : 20); // Free tier capped at 3 coins

  if (coinIds.length === 0) {
    return NextResponse.json({});
  }

  const cacheKey = generateCacheKey('prices', { coins: coinIds.join(',') });

  // 1. Short-lived in-memory cache
  const cached = cache.get<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(
      isFreeTier ? { ...cached, free_tier: true, upgrade: 'https://cryptocurrency.cv/premium' } : cached,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      },
    );
  }

  // 2. Fetch from CoinGecko (with its built-in CoinCap/CoinPaprika fallbacks)
  const data = await fetchCoinGecko(
    `${COINGECKO_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
    { revalidate: 120 }
  );

  if (data) {
    // Persist into short-lived and stale caches
    cache.set(cacheKey, data as Record<string, unknown>, 60);
    staleCache.set(cacheKey, data as Record<string, unknown>, 3600);

    return NextResponse.json(
      isFreeTier ? { ...data as object, free_tier: true, upgrade: 'https://cryptocurrency.cv/premium' } : data,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  }

  // 3. All upstreams failed — serve stale data if available
  const stale = staleCache.get<Record<string, unknown>>(cacheKey);
  if (stale) {
    return NextResponse.json(
      isFreeTier ? { ...stale, free_tier: true, upgrade: 'https://cryptocurrency.cv/premium' } : stale,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Stale': '1',
        },
      },
    );
  }

  // 4. Nothing available — graceful empty
  return NextResponse.json({}, { status: 200 });
}
