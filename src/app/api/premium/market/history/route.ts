/**
 * Premium API - Extended Historical Price Data
 *
 * GET /api/premium/market/history
 *
 * Premium endpoint providing extended historical data:
 * - Up to 5 years of data (vs 90 days on free tier)
 * - Hourly resolution for any range
 * - OHLCV data included
 *
 * Price: $0.01 per request
 *
 * @module api/premium/market/history
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';
import { getHistoricalPrices, getOHLC } from '@/lib/market-data';

export const runtime = 'nodejs';

interface HistoricalDataPoint {
  timestamp: number;
  date: string;
  price: number;
  marketCap?: number;
  volume?: number;
}

interface OHLCDataPoint {
  timestamp: number;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PremiumHistoryResponse {
  coinId: string;
  currency: string;
  range: {
    from: string;
    to: string;
    days: number;
  };
  prices: HistoricalDataPoint[];
  ohlc?: OHLCDataPoint[];
  premium: true;
  metadata: {
    fetchedAt: string;
    dataPoints: number;
    includesOHLC: boolean;
    resolution: 'hourly' | 'daily';
  };
}

/**
 * Calculate days from range parameter
 */
function getDaysFromRange(range: string): number {
  const rangeMap: Record<string, number> = {
    '1d': 1,
    '7d': 7,
    '14d': 14,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '1y': 365,
    '2y': 730,
    '3y': 1095,
    '5y': 1825,
    max: 2000,
  };
  return rangeMap[range] || 365;
}

/**
 * Handler for premium history endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<PremiumHistoryResponse | { error: string; message: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const coinId = searchParams.get('coinId');
  const range = searchParams.get('range') || '1y';
  const currency = searchParams.get('currency') || 'usd';
  const includeOHLC = searchParams.get('ohlc') === 'true';

  if (!coinId) {
    return NextResponse.json(
      { error: 'Missing parameter', message: 'coinId is required' },
      { status: 400 }
    );
  }

  try {
    const days = getDaysFromRange(range);

    // Fetch historical prices
    const historicalData = await getHistoricalPrices(coinId, days);

    // Transform to structured format
    const prices: HistoricalDataPoint[] = (historicalData?.prices || []).map(
      ([timestamp, price]: [number, number]) => ({
        timestamp,
        date: new Date(timestamp).toISOString(),
        price,
      })
    );

    // Add market cap and volume if available
    const marketCaps = historicalData?.market_caps || [];
    const volumes = historicalData?.total_volumes || [];

    prices.forEach((point, index) => {
      if (marketCaps[index]) {
        point.marketCap = marketCaps[index][1];
      }
      if (volumes[index]) {
        point.volume = volumes[index][1];
      }
    });

    // Fetch OHLC data if requested
    let ohlcData: OHLCDataPoint[] | undefined;
    if (includeOHLC && days <= 365) {
      const ohlcRaw = await getOHLC(coinId, days);
      ohlcData = (ohlcRaw || []).map((item) => ({
          timestamp: item.timestamp,
          date: new Date(item.timestamp).toISOString(),
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        })
      );
    }

    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);

    return NextResponse.json(
      {
        coinId,
        currency,
        range: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          days,
        },
        prices,
        ohlc: ohlcData,
        premium: true,
        metadata: {
          fetchedAt: new Date().toISOString(),
          dataPoints: prices.length,
          includesOHLC: !!ohlcData,
          resolution: days <= 90 ? 'hourly' : 'daily',
        },
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error in premium history route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/premium/market/history
 *
 * Premium endpoint - requires x402 payment
 *
 * Query parameters:
 * - coinId: Coin ID (required, e.g., 'bitcoin', 'ethereum')
 * - range: Time range ('1d', '7d', '30d', '90d', '180d', '1y', '2y', '3y', '5y', 'max')
 * - currency: Price currency (default: 'usd')
 * - ohlc: Include OHLC data (true/false, only for ranges <= 1y)
 *
 * @example
 * GET /api/premium/market/history?coinId=bitcoin&range=5y
 * GET /api/premium/market/history?coinId=ethereum&range=1y&ohlc=true
 */
export const GET = withX402(handler, getRouteConfig('/api/premium/market/history'), x402Server);
