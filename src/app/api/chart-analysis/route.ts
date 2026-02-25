/**
 * Multimodal Chart Analysis API
 *
 * POST /api/chart-analysis
 *   Body: { image: base64, mimeType: "image/png", symbol?: "BTC", timeframe?: "4H" }
 *   → Returns detailed technical analysis from vision AI
 *
 * GET /api/chart-analysis?symbol=bitcoin&timeframe=1d
 *   → Analyzes OHLC data from market data provider (no image upload needed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeChart, analyzeOHLCData } from '@/lib/ai-chart-analysis';
import { getOHLC } from '@/lib/market-data';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType, symbol, timeframe } = body;

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Missing required fields: image (base64), mimeType' },
        { status: 400 }
      );
    }

    // Validate image size (max 10MB base64)
    if (image.length > 10 * 1024 * 1024 * 1.37) {
      return NextResponse.json(
        { error: 'Image too large. Maximum 10MB.' },
        { status: 413 }
      );
    }

    const analysis = await analyzeChart(image, mimeType, symbol, timeframe);

    return NextResponse.json(
      { analysis },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[Chart Analysis API] POST error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      { error: message },
      { status: message.includes('No vision') ? 503 : 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const symbol = params.get('symbol') || 'bitcoin';
  const timeframe = params.get('timeframe') || '1d';
  const days = parseInt(params.get('days') || '30', 10);

  try {
    // Fetch OHLC data
    const ohlcData = await getOHLC(symbol, days);

    if (!ohlcData || (Array.isArray(ohlcData) && ohlcData.length === 0)) {
      return NextResponse.json(
        { error: 'Failed to fetch OHLC data for this symbol' },
        { status: 404 }
      );
    }

    // Convert to the format analyzeOHLCData expects
    const candles = (Array.isArray(ohlcData) ? ohlcData : []).map(
      (c: number[] | { timestamp: number; open: number; high: number; low: number; close: number }) => {
        if (Array.isArray(c)) {
          // CoinGecko OHLC format: [timestamp, open, high, low, close]
          return { timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4] };
        }
        return c;
      }
    );

    if (candles.length === 0) {
      return NextResponse.json(
        { error: 'No candle data available' },
        { status: 404 }
      );
    }

    const analysis = await analyzeOHLCData(candles, symbol.toUpperCase(), timeframe);

    return NextResponse.json(
      { analysis },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[Chart Analysis API] GET error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      { error: message },
      { status: message.includes('No AI') ? 503 : 500 }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
