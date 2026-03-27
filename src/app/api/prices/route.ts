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
 * Simple price lookup API route
 * GET /api/prices?coins=bitcoin,ethereum,solana
 * Returns { bitcoin: { usd: 50000, usd_24h_change: 1.5 }, ... }
 *
 * Fallback chain (never returns an error):
 *   1. Short-lived in-memory cache (60 s)
 *   2. CoinGecko via fetchCoinGecko (which already has CoinCap/CoinPaprika fallbacks)
 *   3. Stale cache (last-known-good, up to 1 hour old)
 *   4. Snapshot fallback via KV / /tmp (persisted by /api/internal/snapshot)
 *   5. Emergency hardcoded data (always available)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE, PREMIUM_URL } from '@/lib/constants';
import { staleCache, cache, generateCacheKey } from '@/lib/cache';
import { getPricesFallback } from '@/lib/fallback';
import { getPipelinePrices } from '@/lib/data-pipeline';
import { ApiError } from '@/lib/api-error';
import { instrumented } from '@/lib/telemetry-middleware';

export const revalidate = 120;

export const GET = instrumented(
  async function GET(request: NextRequest) {
    const isFreeTier = request.headers.get('x-free-tier') === '1';
    const coins = request.nextUrl.searchParams.get('coins');

    if (!coins) {
      return ApiError.badRequest('Missing "coins" query parameter');
    }

    const coinIds = coins
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, isFreeTier ? 3 : 20); // Free tier capped at 3 coins

    if (coinIds.length === 0) {
      return NextResponse.json({});
    }

    const cacheKey = generateCacheKey('prices', { coins: coinIds.join(',') });

    // 0. Pipeline cache (Redis / memory — populated by background data pipeline)
    try {
      const pipelineData = await getPipelinePrices();
      if (pipelineData) {
        // Extract only the requested coins from the bulk pipeline cache
        const filtered: Record<string, unknown> = {};
        let hits = 0;
        for (const id of coinIds) {
          if (pipelineData[id]) {
            filtered[id] = pipelineData[id];
            hits++;
          }
        }
        if (hits === coinIds.length) {
          return NextResponse.json(
            isFreeTier ? { ...filtered, free_tier: true, upgrade: PREMIUM_URL } : filtered,
            {
              headers: {
                'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
                'X-Cache': 'PIPELINE',
              },
            },
          );
        }
      }
    } catch (err) {
      console.warn('[prices] Pipeline miss, falling back to CoinGecko', err);
    }

    // 1. Short-lived in-memory cache
    const cached = cache.get<Record<string, unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json(
        isFreeTier ? { ...cached, free_tier: true, upgrade: PREMIUM_URL } : cached,
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
      { revalidate: 120 },
    );

    if (data) {
      // Persist into short-lived and stale caches
      cache.set(cacheKey, data as Record<string, unknown>, 60);
      staleCache.set(cacheKey, data as Record<string, unknown>, 3600);

      // Fire-and-forget: persist snapshot to KV / /tmp so fallback survives restarts
      try {
        fetch(new URL('/api/internal/snapshot', request.nextUrl.origin), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-snapshot': '1' },
          body: JSON.stringify({ type: 'prices', data }),
        }).catch(() => {
          /* best-effort */
        });
      } catch {
        /* ignore */
      }

      return NextResponse.json(
        isFreeTier ? { ...(data as object), free_tier: true, upgrade: PREMIUM_URL } : data,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
          },
        },
      );
    }

    // 3. All upstreams failed — serve stale data if available
    const stale = staleCache.get<Record<string, unknown>>(cacheKey);
    if (stale) {
      return NextResponse.json(
        isFreeTier ? { ...stale, free_tier: true, upgrade: PREMIUM_URL } : stale,
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            'X-Stale': '1',
          },
        },
      );
    }

    // 4. Snapshot fallback → emergency (never returns an error)
    const fallback = await getPricesFallback(request.nextUrl.origin);
    const fallbackData = fallback.data;
    return NextResponse.json(
      isFreeTier ? { ...fallbackData, free_tier: true, upgrade: PREMIUM_URL } : fallbackData,
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Stale': '1',
          'X-Fallback-Level': fallback.level,
        },
      },
    );
  },
  { name: 'prices' },
);
