/**
 * Premium API v1 - List Coins Endpoint
 *
 * Returns paginated list of cryptocurrencies with market data
 * Requires x402 payment or valid API key
 *
 * @price $0.001 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/coins';

export async function GET(request: NextRequest) {
  // Check authentication (API key or x402 payment)
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(250, Math.max(1, parseInt(searchParams.get('per_page') || '100')));
  const order = searchParams.get('order') || 'market_cap_desc';
  const ids = searchParams.get('ids');
  const sparkline = searchParams.get('sparkline') === 'true';

  try {
    // Build CoinGecko API URL
    let url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=${order}&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=24h,7d,30d`;

    if (ids) {
      url += `&ids=${ids}`;
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CryptoDataAggregator/1.0',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          endpoint: ENDPOINT,
          page,
          perPage,
          count: data.length,
          total: 10000, // Approximate total coins
          hasMore: data.length === perPage,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    console.error('[API] /v1/coins error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch coin data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    );
  }
}
