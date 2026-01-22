/**
 * Chart Data API Endpoint
 * 
 * Fetches historical price and OHLC data for coins
 * Supports multiple time ranges: 1h, 24h, 7d, 30d, 90d, 1y, all
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 60; // Cache for 60 seconds

interface CoinGeckoMarketChart {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Map time range to CoinGecko days parameter
const TIME_RANGE_TO_DAYS: Record<string, number | 'max'> = {
  '1h': 1,       // Will filter to last hour
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  'all': 'max',
};

// Get CoinGecko interval based on days
function getInterval(days: number | 'max'): string | undefined {
  if (days === 'max' || days > 90) return 'daily';
  if (days > 1) return undefined; // Auto
  return undefined;
}

// Fetch market chart data from CoinGecko
async function fetchMarketChart(
  coinId: string,
  days: number | 'max'
): Promise<CoinGeckoMarketChart | null> {
  try {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      days: days.toString(),
    });

    const interval = getInterval(days);
    if (interval) {
      params.set('interval', interval);
    }

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch market chart:', error);
    return null;
  }
}

// Fetch OHLC data from CoinGecko
async function fetchOHLC(
  coinId: string,
  days: number
): Promise<number[][] | null> {
  try {
    // CoinGecko OHLC only supports 1, 7, 14, 30, 90, 180, 365, max
    const validDays = [1, 7, 14, 30, 90, 180, 365];
    const ohlcDays = validDays.find(d => d >= days) || 'max';

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${ohlcDays}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko OHLC API error: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to fetch OHLC:', error);
    return null;
  }
}

// Transform OHLC data
function transformOHLC(data: number[][]): OHLCData[] {
  return data.map(([timestamp, open, high, low, close]) => ({
    timestamp,
    open,
    high,
    low,
    close,
  }));
}

// Filter data to specific time range
function filterByTimeRange(
  data: [number, number][],
  range: string
): [number, number][] {
  if (range !== '1h') return data;
  
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return data.filter(([timestamp]) => timestamp >= oneHourAgo);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coin');
    const range = searchParams.get('range') || '24h';

    if (!coinId) {
      return NextResponse.json(
        { error: 'Missing coin parameter' },
        { status: 400 }
      );
    }

    // Validate time range
    const days = TIME_RANGE_TO_DAYS[range];
    if (days === undefined) {
      return NextResponse.json(
        { error: 'Invalid time range' },
        { status: 400 }
      );
    }

    // Fetch both market chart and OHLC data in parallel
    const [marketChart, ohlcRaw] = await Promise.all([
      fetchMarketChart(coinId, days),
      typeof days === 'number' && days <= 365 
        ? fetchOHLC(coinId, days) 
        : null,
    ]);

    if (!marketChart) {
      return NextResponse.json(
        { error: 'Failed to fetch chart data' },
        { status: 502 }
      );
    }

    // Filter and transform data
    const prices = filterByTimeRange(marketChart.prices, range);
    const volumes = filterByTimeRange(marketChart.total_volumes, range);

    // Combine prices with volumes
    const priceData = prices.map((price, i) => ({
      timestamp: price[0],
      price: price[1],
      volume: volumes[i]?.[1] || 0,
    }));

    // Transform OHLC
    const ohlc = ohlcRaw ? transformOHLC(ohlcRaw) : [];

    // Calculate stats
    const allPrices = prices.map(p => p[1]);
    const stats = {
      high: Math.max(...allPrices),
      low: Math.min(...allPrices),
      open: allPrices[0],
      close: allPrices[allPrices.length - 1],
      change: allPrices.length > 0 
        ? allPrices[allPrices.length - 1] - allPrices[0] 
        : 0,
      changePercent: allPrices.length > 0 && allPrices[0] !== 0
        ? ((allPrices[allPrices.length - 1] - allPrices[0]) / allPrices[0]) * 100
        : 0,
    };

    return NextResponse.json({
      coinId,
      range,
      prices: priceData,
      ohlc,
      stats,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
