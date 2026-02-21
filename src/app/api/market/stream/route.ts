/**
 * GET /api/market/stream
 * SSE endpoint for market overview updates.
 *
 * Streams key market metrics every ~30 seconds:
 * total market cap, BTC dominance, fear & greed index, top 5 coin prices.
 */

import { NextRequest } from 'next/server';
import { getMarketOverview } from '@/lib/market-data';

export const dynamic = 'force-dynamic';

const POLL_INTERVAL = 30000; // 30 seconds

export async function GET(_request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder();
  let isConnected = true;

  const safeEnqueue = (
    controller: ReadableStreamDefaultController,
    data: Uint8Array,
  ): boolean => {
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
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to market stream',
        timestamp: new Date().toISOString(),
      })}\n\n`;
      if (!safeEnqueue(controller, encoder.encode(connectEvent))) return;

      const pollMarket = async () => {
        if (!isConnected) return;

        try {
          const overview = await getMarketOverview();

          const payload = {
            totalMarketCap: overview.global?.total_market_cap?.usd ?? null,
            btcDominance: overview.global?.market_cap_percentage?.btc ?? null,
            fearGreed: overview.fearGreed
              ? { value: overview.fearGreed.value, label: overview.fearGreed.value_classification }
              : null,
            btc: { price: overview.btcPrice, change24h: overview.btcChange24h },
            eth: { price: overview.ethPrice, change24h: overview.ethChange24h },
            topCoins: (overview.topCoins || []).slice(0, 5).map((c) => ({
              id: c.id,
              symbol: c.symbol,
              price: c.current_price,
              change24h: c.price_change_percentage_24h,
            })),
            timestamp: new Date().toISOString(),
          };

          const marketEvent = `event: market\ndata: ${JSON.stringify(payload)}\n\n`;
          if (!safeEnqueue(controller, encoder.encode(marketEvent))) return;

          // Heartbeat
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          if (!safeEnqueue(controller, encoder.encode(heartbeat))) return;
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

          console.error('Market stream poll error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: 'Error fetching market data',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          safeEnqueue(controller, encoder.encode(errorEvent));
        }

        if (isConnected) {
          setTimeout(pollMarket, POLL_INTERVAL);
        }
      };

      setTimeout(() => pollMarket(), 0);
    },
    cancel() {
      isConnected = false;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
