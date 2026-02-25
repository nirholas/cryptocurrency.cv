/**
 * GET /api/v1/orderbook
 *
 * Premium API v1 — Order Book Depth
 * Returns real-time order book data with bid/ask analysis.
 * Requires x402 payment or valid API key.
 *
 * Query parameters:
 *   symbol — Trading pair (e.g. "BTCUSDT", default: BTCUSDT)
 *   depth  — Depth levels (5, 10, 20, 50, 100 — default: 20)
 *
 * @price $0.003 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';

const ENDPOINT = '/api/v1/orderbook';
const VALID_DEPTHS = [5, 10, 20, 50, 100];

interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

interface OrderBookAnalysis {
  bidDepthUsd: number;
  askDepthUsd: number;
  bidAskRatio: number;
  spread: number;
  spreadBps: number;
  midPrice: number;
  imbalance: number;
  wallDetected: boolean;
  largestBidWall: { price: number; quantity: number } | null;
  largestAskWall: { price: number; quantity: number } | null;
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const start = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const params = request.nextUrl.searchParams;
  const symbol = (params.get('symbol') || 'BTCUSDT').toUpperCase();
  const depth = parseInt(params.get('depth') || '20', 10);

  if (!VALID_DEPTHS.includes(depth)) {
    return NextResponse.json(
      { error: 'Invalid depth', validDepths: VALID_DEPTHS },
      { status: 400 },
    );
  }

  try {
    logger.info('Fetching order book', { symbol, depth });

    // Fetch from Binance
    const url = `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${depth}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'free-crypto-news/2.0' },
    });

    if (!res.ok) throw new Error(`Binance depth ${res.status}`);

    const data = await res.json();

    const bids: OrderBookLevel[] = (data.bids || []).map(
      ([p, q]: [string, string]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        return { price, quantity, total: price * quantity };
      },
    );

    const asks: OrderBookLevel[] = (data.asks || []).map(
      ([p, q]: [string, string]) => {
        const price = parseFloat(p);
        const quantity = parseFloat(q);
        return { price, quantity, total: price * quantity };
      },
    );

    const analysis = analyzeOrderBook(bids, asks);

    return NextResponse.json({
      symbol,
      depth,
      lastUpdateId: data.lastUpdateId,
      bids,
      asks,
      analysis,
      source: 'binance',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - start,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
        'CDN-Cache-Control': 'public, s-maxage=5',
      },
    });
  } catch (error) {
    logger.error('Order book fetch failed', { error: String(error) });
    return ApiError.upstream('Order book (Binance)');
  }
}

// =============================================================================
// ANALYSIS
// =============================================================================

function analyzeOrderBook(
  bids: OrderBookLevel[],
  asks: OrderBookLevel[],
): OrderBookAnalysis {
  const bidDepthUsd = bids.reduce((sum, b) => sum + b.total, 0);
  const askDepthUsd = asks.reduce((sum, a) => sum + a.total, 0);
  const bidAskRatio = askDepthUsd > 0 ? bidDepthUsd / askDepthUsd : 0;

  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadBps = midPrice > 0 ? (spread / midPrice) * 10000 : 0;

  // Imbalance: positive = more buy pressure, negative = more sell pressure
  const totalDepth = bidDepthUsd + askDepthUsd;
  const imbalance = totalDepth > 0 ? (bidDepthUsd - askDepthUsd) / totalDepth : 0;

  // Wall detection: a level with >3x the average volume
  const avgBidQty = bids.reduce((s, b) => s + b.quantity, 0) / (bids.length || 1);
  const avgAskQty = asks.reduce((s, a) => s + a.quantity, 0) / (asks.length || 1);

  const largestBid = bids.reduce((max, b) => (b.quantity > max.quantity ? b : max), bids[0] || { price: 0, quantity: 0 });
  const largestAsk = asks.reduce((max, a) => (a.quantity > max.quantity ? a : max), asks[0] || { price: 0, quantity: 0 });

  const wallThreshold = 3;
  const wallDetected =
    largestBid.quantity > avgBidQty * wallThreshold ||
    largestAsk.quantity > avgAskQty * wallThreshold;

  return {
    bidDepthUsd: Math.round(bidDepthUsd * 100) / 100,
    askDepthUsd: Math.round(askDepthUsd * 100) / 100,
    bidAskRatio: Math.round(bidAskRatio * 1000) / 1000,
    spread: Math.round(spread * 100) / 100,
    spreadBps: Math.round(spreadBps * 100) / 100,
    midPrice: Math.round(midPrice * 100) / 100,
    imbalance: Math.round(imbalance * 1000) / 1000,
    wallDetected,
    largestBidWall: largestBid.quantity > avgBidQty * wallThreshold
      ? { price: largestBid.price, quantity: largestBid.quantity }
      : null,
    largestAskWall: largestAsk.quantity > avgAskQty * wallThreshold
      ? { price: largestAsk.price, quantity: largestAsk.quantity }
      : null,
  };
}
