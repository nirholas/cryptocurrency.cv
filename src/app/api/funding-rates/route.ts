/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import { getPipelineFundingRates } from '@/lib/data-pipeline';
import { registry } from '@/lib/providers/registry';
import type { FundingRate } from '@/lib/providers/adapters/funding-rate';
import { ApiError } from '@/lib/api-error';
import { BINANCE_FUTURES_BASE } from '@/lib/constants';

/**
 * Funding Rates API Proxy
 *
 * Serves pipeline-cached funding rates first, then uses the provider framework
 * (broadcast across Binance, Bybit, OKX with circuit breakers), then falls
 * back to direct Binance Futures premiumIndex endpoint.
 */
export async function GET() {
  try {
    // Layer 1: Pipeline cache-first
    try {
      const pipelineData = await getPipelineFundingRates();
      if (pipelineData && Array.isArray(pipelineData) && pipelineData.length > 0) {
        return NextResponse.json(pipelineData, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'PIPELINE',
          },
        });
      }
    } catch (pipelineErr) {
      // Logged rather than swallowed: a silent catch here is why a total
      // upstream outage surfaced only as an opaque 502 from layer 3.
      console.warn('Funding rates: pipeline cache miss:', (pipelineErr as Error).message);
    }

    // Layer 2: Provider framework (broadcast across Binance, Bybit, OKX,
    // dYdX, Hyperliquid and Coinglass)
    try {
      const result = await registry.fetch<FundingRate[]>('funding-rate');
      return NextResponse.json(result.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'PROVIDER',
          'X-Provider': result.lineage.provider,
          'X-Confidence': String(result.lineage.confidence),
        },
      });
    } catch (chainErr) {
      console.warn('Funding rates: provider chain exhausted:', (chainErr as Error).message);
    }

    // Layer 3: Direct Binance fallback, for the case where the provider
    // registry has not been initialised (no instrumentation hook ran).
    const response = await fetch(`${BINANCE_FUTURES_BASE}/fapi/v1/premiumIndex`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      // Every layer is out. That is an upstream availability problem, not a
      // malformed upstream reply, so it gets a 503 the client can retry rather
      // than a 502 that reads like a permanent gateway fault. Binance answers
      // 451 to requests from restricted regions, which is exactly the case the
      // other exchanges in the chain exist to cover.
      console.error(`Funding rates: direct Binance fallback failed (${response.status})`);
      return NextResponse.json(
        {
          error: 'Funding rate providers are temporarily unavailable',
          rates: [],
        },
        { status: 503, headers: { 'Retry-After': '30' } }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'DIRECT',
      },
    });
  } catch (error) {
    console.error('Funding rates proxy error:', error);
    return ApiError.internal('Failed to fetch funding rates');
  }
}
