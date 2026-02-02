/**
 * Premium API v1 - Exchanges Endpoint
 *
 * Returns list of cryptocurrency exchanges
 * Requires x402 payment or valid API key
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

const ENDPOINT = '/api/v1/exchanges';

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '50')));

  try {
    logger.info('Fetching exchanges', { page, perPage });

    const response = await fetch(
      `https://api.coingecko.com/api/v3/exchanges?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform exchange data
    const exchanges = data.map(
      (e: {
        id: string;
        name: string;
        year_established: number;
        country: string;
        description: string;
        url: string;
        image: string;
        has_trading_incentive: boolean;
        trust_score: number;
        trust_score_rank: number;
        trade_volume_24h_btc: number;
        trade_volume_24h_btc_normalized: number;
      }) => ({
        id: e.id,
        name: e.name,
        year_established: e.year_established,
        country: e.country,
        url: e.url,
        image: e.image,
        trust_score: e.trust_score,
        trust_score_rank: e.trust_score_rank,
        trade_volume_24h_btc: e.trade_volume_24h_btc,
        trade_volume_24h_btc_normalized: e.trade_volume_24h_btc_normalized,
        has_trading_incentive: e.has_trading_incentive,
      })
    );

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        data: exchanges,
        meta: {
          endpoint: ENDPOINT,
          page,
          perPage,
          count: exchanges.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch exchanges', error);
    return ApiError.upstream('CoinGecko', error);
  }
}
