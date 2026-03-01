/**
 * OHLC API Route - Multi-timeframe OHLC data for charts
 * GET /api/ohlc?coinId=bitcoin&days=30
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOHLC } from '@/lib/market-data';
import { ApiError } from '@/lib/api-error';

const VALID_DAYS = [1, 7, 14, 30, 90, 180, 365];
const COIN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coinId = searchParams.get('coinId');
  const daysParam = searchParams.get('days');

  if (!coinId) {
    return ApiError.badRequest('coinId is required');
  }

  if (!COIN_ID_PATTERN.test(coinId)) {
    return ApiError.badRequest('Invalid coinId format');
  }

  const days = daysParam ? parseInt(daysParam, 10) : 30;
  if (Number.isNaN(days) || !VALID_DAYS.includes(days)) {
    return ApiError.badRequest(`Invalid days. Must be one of: ${VALID_DAYS.join(', ')}`);
  }

  try {
    const data = await getOHLC(coinId, days);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('OHLC API error:', error);
    return ApiError.internal('Failed to fetch OHLC data');
  }
}
