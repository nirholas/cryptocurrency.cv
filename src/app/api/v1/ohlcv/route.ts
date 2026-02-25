/**
 * GET /api/v1/ohlcv
 *
 * Premium API v1 — OHLCV (Candlestick) Data
 * Returns historical OHLCV candles from Binance and CryptoCompare.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   symbol   — Trading pair (e.g. "BTCUSDT", default: BTCUSDT)
 *   interval — Candle interval (1m,5m,15m,1h,4h,1d,1w — default: 1h)
 *   limit    — Number of candles (1-1000, default: 100)
 *
 * @price $0.002 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 30;

const ENDPOINT = '/api/v1/ohlcv';

const VALID_INTERVALS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;

interface OHLCVCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const symbol = (params.get('symbol') || 'BTCUSDT').toUpperCase();
  const interval = params.get('interval') || '1h';
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '100', 10) || 100, 1), 1000);

  if (!VALID_INTERVALS.includes(interval as typeof VALID_INTERVALS[number])) {
    return NextResponse.json(
      { error: 'Invalid interval', validIntervals: VALID_INTERVALS },
      { status: 400 },
    );
  }

  try {
    logger.info('Fetching OHLCV data', { symbol, interval, limit });

    const candles = await fetchBinanceOHLCV(symbol, interval, limit);

    return NextResponse.json({
      symbol,
      interval,
      count: candles.length,
      candles,
      source: 'binance',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=30',
      },
    });
  } catch (error) {
    logger.error('OHLCV fetch failed', { error: String(error) });

    // Fallback to CryptoCompare
    try {
      const candles = await fetchCryptoCompareOHLCV(symbol, interval, limit);
      return NextResponse.json({
        symbol,
        interval,
        count: candles.length,
        candles,
        source: 'cryptocompare',
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - start,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      });
    } catch (fallbackError) {
      return ApiError.upstream('OHLCV providers (Binance + CryptoCompare)');
    }
  }
}

// =============================================================================
// DATA FETCHERS
// =============================================================================

async function fetchBinanceOHLCV(
  symbol: string,
  interval: string,
  limit: number,
): Promise<OHLCVCandle[]> {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'free-crypto-news/2.0' },
    next: { revalidate: 30 },
  });

  if (!res.ok) throw new Error(`Binance OHLCV ${res.status}`);

  const data: unknown[][] = await res.json();
  return data.map((k) => ({
    timestamp: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }));
}

async function fetchCryptoCompareOHLCV(
  symbol: string,
  interval: string,
  limit: number,
): Promise<OHLCVCandle[]> {
  // CryptoCompare uses fsym/tsym format
  const fsym = symbol.replace(/USDT$|USD$|BUSD$/, '');
  const tsym = symbol.includes('USDT') ? 'USDT' : 'USD';

  // Map interval to CryptoCompare endpoint
  const endpointMap: Record<string, string> = {
    '1m': 'histominute',
    '5m': 'histominute',
    '15m': 'histominute',
    '30m': 'histominute',
    '1h': 'histohour',
    '4h': 'histohour',
    '1d': 'histoday',
    '1w': 'histoday',
  };
  const endpoint = endpointMap[interval] || 'histohour';

  // Adjust limit for aggregated intervals
  const aggregateMap: Record<string, number> = {
    '5m': 5, '15m': 15, '30m': 30, '4h': 4, '1w': 7,
  };
  const aggregate = aggregateMap[interval] || 1;
  const adjustedLimit = Math.min(limit * aggregate, 2000);

  const apiKey = process.env.CRYPTOCOMPARE_API_KEY || '';
  const url = `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${fsym}&tsym=${tsym}&limit=${adjustedLimit}&aggregate=${aggregate}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'free-crypto-news/2.0',
      ...(apiKey && { authorization: `Apikey ${apiKey}` }),
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`CryptoCompare OHLCV ${res.status}`);

  const json = await res.json();
  const candles: OHLCVCandle[] = (json.Data?.Data || []).map((d: Record<string, number>) => ({
    timestamp: d.time * 1000,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volumefrom,
  }));

  return candles.slice(-limit);
}
