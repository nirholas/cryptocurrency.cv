/**
 * Premium API v1 - Historical Price Data Endpoint
 *
 * Returns historical OHLCV data for a cryptocurrency
 * Requires x402 payment or valid API key
 *
 * @price $0.005 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

const ENDPOINT = '/api/v1/historical';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coinId: string }> }
) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const { coinId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const days = Math.min(365, Math.max(1, parseInt(searchParams.get('days') || '30')));
  const interval = searchParams.get('interval') || (days > 90 ? 'daily' : 'hourly');

  if (!coinId) {
    return ApiError.badRequest('Coin ID is required');
  }

  try {
    logger.info('Fetching historical data', { coinId, days, interval });

    // Fetch market chart data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${interval === 'daily' ? 'daily' : ''}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return ApiError.notFound(`Coin not found: ${coinId}`);
      }
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform to OHLCV-like structure
    const prices =
      data.prices?.map((p: [number, number]) => ({
        timestamp: p[0],
        date: new Date(p[0]).toISOString(),
        price: p[1],
      })) || [];

    const volumes =
      data.total_volumes?.map((v: [number, number]) => ({
        timestamp: v[0],
        volume: v[1],
      })) || [];

    const marketCaps =
      data.market_caps?.map((m: [number, number]) => ({
        timestamp: m[0],
        market_cap: m[1],
      })) || [];

    // Combine into unified structure
    const combined = prices.map(
      (p: { timestamp: number; date: string; price: number }, i: number) => ({
        timestamp: p.timestamp,
        date: p.date,
        price: p.price,
        volume: volumes[i]?.volume || null,
        market_cap: marketCaps[i]?.market_cap || null,
      })
    );

    // Calculate statistics
    const priceValues = prices.map((p: { price: number }) => p.price);
    const stats = {
      high: Math.max(...priceValues),
      low: Math.min(...priceValues),
      average: priceValues.reduce((a: number, b: number) => a + b, 0) / priceValues.length,
      start: priceValues[0],
      end: priceValues[priceValues.length - 1],
      change: ((priceValues[priceValues.length - 1] - priceValues[0]) / priceValues[0]) * 100,
    };

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        data: {
          coinId,
          currency: 'usd',
          days,
          interval,
          prices: combined,
          statistics: stats,
        },
        meta: {
          endpoint: ENDPOINT,
          coinId,
          dataPoints: combined.length,
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    logger.error('Failed to fetch historical data', error, { coinId });
    return ApiError.upstream('CoinGecko', error);
  }
}
