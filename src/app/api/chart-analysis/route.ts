/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

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

import { type NextRequest, NextResponse } from 'next/server';
import {
  analyzeChart,
  analyzeOHLCData,
  ChartAnalysisNotConfiguredError,
} from '@/lib/ai-chart-analysis';
import { AI_UNAVAILABLE_MESSAGE, isAIUnavailableError } from '@/lib/ai-provider';
import { getOHLC } from '@/lib/market-data';

export const runtime = 'edge';
export const maxDuration = 60;

/** Image types every supported vision provider accepts. */
const IMAGE_MIME_TYPES: ReadonlySet<string> = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
/** 10 MB of image data, base64-encoded (4/3 overhead). */
const MAX_IMAGE_BASE64_LENGTH = Math.ceil((10 * 1024 * 1024 * 4) / 3);
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const DATA_URL_PATTERN = /^data:([a-z]+\/[a-z0-9.+-]+);base64,/i;
/** CoinGecko coin ids: lowercase letters, digits and hyphens. */
const COIN_ID_PATTERN = /^[a-z0-9-]{1,100}$/;
const LABEL_PATTERN = /^[A-Za-z0-9 ./_-]{1,32}$/;
const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;

function errorResponse(error: string, status: number): NextResponse {
  return NextResponse.json(
    { error },
    { status, headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }
  );
}

/** Provider refusals and missing keys are 503s; bad model output is a 502; the rest is a generic 500. */
function analysisFailure(error: unknown, method: string): NextResponse {
  if (error instanceof ChartAnalysisNotConfiguredError) {
    return errorResponse('Chart analysis is not available: no AI provider is configured.', 503);
  }
  if (isAIUnavailableError(error)) {
    return errorResponse(AI_UNAVAILABLE_MESSAGE, 503);
  }
  if (error instanceof SyntaxError) {
    return errorResponse('The AI provider returned a malformed analysis. Please try again.', 502);
  }
  console.error(`[Chart Analysis API] ${method} error:`, error);
  return errorResponse('Chart analysis failed', 500);
}

/** Optional short text label (symbol, timeframe); `false` when present but invalid. */
function optionalLabel(value: unknown): string | undefined | false {
  if (value === undefined || value === null || value === '') return undefined;
  return typeof value === 'string' && LABEL_PATTERN.test(value.trim()) ? value.trim() : false;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Request body must be JSON', 400);
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return errorResponse('Request body must be a JSON object', 400);
  }

  const fields = body as Record<string, unknown>;
  if (typeof fields.image !== 'string' || !fields.image) {
    return errorResponse('Missing required fields: image (base64), mimeType', 400);
  }

  // Accept a data URL as well as bare base64; its media type fills in a missing mimeType.
  let image = fields.image;
  let mimeType = typeof fields.mimeType === 'string' ? fields.mimeType.trim().toLowerCase() : '';
  const dataUrl = DATA_URL_PATTERN.exec(image);
  if (dataUrl) {
    image = image.slice(dataUrl[0].length);
    mimeType ||= dataUrl[1].toLowerCase();
  }

  if (!mimeType) {
    return errorResponse('Missing required fields: image (base64), mimeType', 400);
  }
  if (!IMAGE_MIME_TYPES.has(mimeType)) {
    return errorResponse('Unsupported mimeType. Use image/png, image/jpeg, image/webp or image/gif.', 400);
  }
  if (image.length > MAX_IMAGE_BASE64_LENGTH) {
    return errorResponse('Image too large. Maximum 10MB.', 413);
  }
  if (!BASE64_PATTERN.test(image)) {
    return errorResponse('image must be base64-encoded', 400);
  }

  const symbol = optionalLabel(fields.symbol);
  const timeframe = optionalLabel(fields.timeframe);
  if (symbol === false || timeframe === false) {
    return errorResponse('symbol and timeframe must be short alphanumeric labels', 400);
  }

  try {
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
    return analysisFailure(error, 'POST');
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const symbol = (params.get('symbol') || 'bitcoin').trim().toLowerCase();
  const timeframe = optionalLabel(params.get('timeframe')) ?? '1d';
  const requestedDays = Number.parseInt(params.get('days') || '', 10);
  const days = Number.isFinite(requestedDays) ? Math.min(Math.max(requestedDays, 1), MAX_DAYS) : DEFAULT_DAYS;

  if (!COIN_ID_PATTERN.test(symbol)) {
    return errorResponse('symbol must be a CoinGecko coin id (letters, digits and hyphens)', 400);
  }
  if (timeframe === false) {
    return errorResponse('timeframe must be a short alphanumeric label', 400);
  }

  let ohlcData: Awaited<ReturnType<typeof getOHLC>>;
  try {
    ohlcData = await getOHLC(symbol, days);
  } catch (error) {
    console.error('[Chart Analysis API] OHLC fetch error:', error);
    return errorResponse('Market data is temporarily unavailable for this symbol', 502);
  }

  const candles = (Array.isArray(ohlcData) ? ohlcData : []).filter((c) =>
    [c.timestamp, c.open, c.high, c.low, c.close].every(Number.isFinite)
  );
  if (candles.length === 0) {
    return errorResponse('No candle data available for this symbol', 404);
  }

  try {
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
    return analysisFailure(error, 'GET');
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
