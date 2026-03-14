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
 * GET /api/prices/stream
 * SSE endpoint that streams live price updates for specified symbols.
 *
 * Query params:
 *   symbols — comma-separated CoinGecko IDs (default "bitcoin,ethereum,binancecoin,solana,ripple")
 *
 * Streams a JSON price object every ~5 seconds.
 */

import { type NextRequest } from 'next/server';
import { getPricesForCoins } from '@/lib/market-data';

// force-dynamic required: SSE streaming response
export const dynamic = 'force-dynamic';

const DEFAULT_SYMBOLS = 'bitcoin,ethereum,binancecoin,solana,ripple';
const POLL_INTERVAL = 5000; // 5 seconds

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const symbolsParam = searchParams.get('symbols') || DEFAULT_SYMBOLS;
  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const encoder = new TextEncoder();
  let isConnected = true;

  const safeEnqueue = (controller: ReadableStreamDefaultController, data: Uint8Array): boolean => {
    if (!isConnected || controller.desiredSize === null) {
      isConnected = false;
      return false;
    }
    try {
      controller.enqueue(data);
      return true;
    } catch {
      isConnected = false;
      return false;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to price stream',
        symbols,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      if (!safeEnqueue(controller, encoder.encode(connectEvent))) return;

      const pollPrices = async () => {
        if (!isConnected) return;

        try {
          const prices = await getPricesForCoins(symbols);

          const updates = Object.entries(prices).map(([id, info]) => ({
            symbol: id,
            price: info.price,
            change24h: info.change_24h,
            timestamp: Date.now(),
          }));

          const priceEvent = `event: price\ndata: ${JSON.stringify(updates)}\n\n`;
          if (!safeEnqueue(controller, encoder.encode(priceEvent))) return;
        } catch (error) {
          if (!isConnected) return;

          const isControllerClosed =
            error instanceof TypeError &&
            (String(error.message).includes('Controller is already closed') ||
              String(error.message).includes('Invalid state'));

          if (isControllerClosed) {
            isConnected = false;
            return;
          }

          console.error('Price stream poll error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: 'Error fetching prices',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          safeEnqueue(controller, encoder.encode(errorEvent));
        }

        // Schedule next poll
        if (isConnected) {
          setTimeout(pollPrices, POLL_INTERVAL);
        }
      };

      // Kick off polling without blocking the stream
      setTimeout(() => pollPrices(), 0);
    },
    cancel() {
      isConnected = false;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
