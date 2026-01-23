/**
 * Premium API - Real-time WebSocket Streams
 *
 * GET /api/premium/streams/prices
 *
 * Premium WebSocket-like endpoint for real-time data:
 * - Server-Sent Events (SSE) for price updates
 * - Sub-second latency
 * - Multiple coins simultaneously
 *
 * Price: $0.10 per session (1 hour access)
 *
 * @module api/premium/streams/prices
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';
import { getPricesForCoins } from '@/lib/market-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handler for real-time price stream
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const coins = searchParams.get('coins')?.split(',').slice(0, 20) || ['bitcoin', 'ethereum'];
  const interval = Math.max(1000, parseInt(searchParams.get('interval') || '2000', 10));

  // Create SSE stream
  const encoder = new TextEncoder();
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const connectMsg = {
        type: 'connected',
        coins,
        interval,
        timestamp: Date.now(),
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`));

      // Heartbeat and price update loop
      const updatePrices = async () => {
        if (!isActive) return;

        try {
          const prices = await getPricesForCoins(coins, 'usd');

          const priceUpdate = {
            type: 'prices',
            data: prices,
            timestamp: Date.now(),
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(priceUpdate)}\n\n`));
        } catch (error) {
          const errorMsg = {
            type: 'error',
            message: 'Failed to fetch prices',
            timestamp: Date.now(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMsg)}\n\n`));
        }

        if (isActive) {
          setTimeout(updatePrices, interval);
        }
      };

      // Start updates
      updatePrices();

      // Heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(heartbeatInterval);
          return;
        }
        const heartbeat = { type: 'heartbeat', timestamp: Date.now() };
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
          isActive = false;
        }
      }, 30000);

      // Session timeout (1 hour)
      setTimeout(() => {
        isActive = false;
        clearInterval(heartbeatInterval);
        const endMsg = { type: 'session_ended', reason: 'timeout', timestamp: Date.now() };
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(endMsg)}\n\n`));
          controller.close();
        } catch {
          // Stream already closed
        }
      }, 3600000); // 1 hour
    },
    cancel() {
      isActive = false;
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

/**
 * GET /api/premium/streams/prices
 *
 * Premium SSE stream - requires x402 payment
 *
 * Query parameters:
 * - coins: Comma-separated coin IDs (max 20, default: 'bitcoin,ethereum')
 * - interval: Update interval in ms (min: 1000, default: 2000)
 *
 * SSE Events:
 * - connected: Initial connection confirmation
 * - prices: Price update for all subscribed coins
 * - heartbeat: Keep-alive signal every 30s
 * - session_ended: Stream terminated
 *
 * @example
 * GET /api/premium/streams/prices?coins=bitcoin,ethereum,solana&interval=1000
 */
export const GET = withX402(handler, getRouteConfig('/api/premium/streams/prices'), x402Server);
