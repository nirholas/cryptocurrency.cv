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
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { validateQuery } from '@/lib/validation-middleware';
import { v1CoinsQuerySchema } from '@/lib/schemas';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';

const ENDPOINT = '/api/v1/coins';

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication (API key or x402 payment)
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  // Validate query parameters using Zod schema
  const validation = validateQuery(request, v1CoinsQuerySchema);
  if (!validation.success) {
    return validation.error;
  }
  
  const { page, per_page, order, ids, sparkline } = validation.data;
  const sparklineBoolean = sparkline === 'true';

  try {
    logger.info('Fetching coins data', { page, per_page, order });

    // Build CoinGecko API URL
    let url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=${order}&per_page=${per_page}&page=${page}&sparkline=${sparklineBoolean}&price_change_percentage=24h,7d,30d`;

    if (ids) {
      url += `&ids=${ids}`;
    }

    const response = await fetchCoinGecko<unknown[]>(url, { revalidate: 60 });

    if (!response) {
      throw new Error('Upstream API unavailable');
    }

    const data = response;

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          endpoint: ENDPOINT,
          page,
          perPage: per_page,
          count: data.length,
          total: 10000, // Approximate total coins
          hasMore: data.length === per_page,
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
    logger.error('Failed to fetch coin data', error);
    return ApiError.upstream('CoinGecko', error);
  }
}
