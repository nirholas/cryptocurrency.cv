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
import { withX402 } from '@/lib/x402';
import { getPricesForCoins } from '@/lib/market-data';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handler for real-time price stream
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();
  
  try {
    logger.info('Starting SSE price stream');
    const searchParams = request.nextUrl.searchParams;
    const coins = searchParams.get('coins')?.split(',').slice(0, 20) || ['bitcoin', 'ethereum'];
    const interval = Math.max(1000, parseInt(searchParams.get('interval') || '2000', 10));

  // Create SSE stream
  const encoder = new TextEncoder();
  let isActive = true;

  // Helper to safely enqueue data to the controller
  const safeEnqueue = (controller: ReadableStreamDefaultController, data: Uint8Array): boolean => {
    if (!isActive || controller.desiredSize === null) {
      isActive = false;
      return false;
    }
    try {
      controller.enqueue(data);
      return true;
    } catch {
      isActive = false;
      return false;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const connectMsg = {
        type: 'connected',
        coins,
        interval,
        timestamp: Date.now(),
      };
      if (!safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`))) return;

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

          if (!safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify(priceUpdate)}\n\n`))) return;
        } catch (error) {
          if (!isActive) return;
          
          // Suppress controller closed errors
          const isControllerClosed = error instanceof TypeError && 
            (error.message.includes('Controller is already closed') || 
             error.message.includes('Invalid state'));
          
          if (isControllerClosed) {
            isActive = false;
            return;
          }
          
          logger.error('Failed to fetch prices in stream', error);
          const errorMsg = {
            type: 'error',
            message: 'Failed to fetch prices',
            timestamp: Date.now(),
          };
          safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify(errorMsg)}\n\n`));
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
        if (!safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`))) {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Session timeout (1 hour)
      setTimeout(() => {
        isActive = false;
        clearInterval(heartbeatInterval);
        const endMsg = { type: 'session_ended', reason: 'timeout', timestamp: Date.now() };
        safeEnqueue(controller, encoder.encode(`data: ${JSON.stringify(endMsg)}\n\n`));
        try {
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

  logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
  } catch (error) {
    logger.error('Stream initialization failed', error);
    return ApiError.internal('Failed to start price stream', error);
  }
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
export const GET = withX402('/api/premium/streams/prices', handler);
