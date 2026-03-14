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
 * GET /api/alerts/stream
 * SSE endpoint for real-time alert notifications.
 *
 * Query params:
 *   user_id    — filter alerts for a specific user (optional)
 *   session_id — alternative session-based filter (optional)
 *
 * Checks price and keyword alerts every ~15 seconds and streams triggered alerts.
 */

import { type NextRequest } from 'next/server';
import { checkPriceAlerts, checkKeywordAlerts } from '@/lib/alerts';

// force-dynamic required: SSE streaming response
export const dynamic = 'force-dynamic';

const POLL_INTERVAL = 15000; // 15 seconds

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id') || searchParams.get('session_id') || '';

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
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to alerts stream',
        userId: userId || null,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      if (!safeEnqueue(controller, encoder.encode(connectEvent))) return;

      const pollAlerts = async () => {
        if (!isConnected) return;

        try {
          const [priceAlerts, keywordAlerts] = await Promise.all([
            checkPriceAlerts(),
            checkKeywordAlerts(),
          ]);

          // Optionally filter by userId
          let filteredPrice = priceAlerts;
          let filteredKeyword = keywordAlerts;

          if (userId) {
            filteredPrice = priceAlerts.filter(
              (a) => (a.data as Record<string, unknown>)?.userId === userId,
            );
            filteredKeyword = keywordAlerts.filter(
              (a) => (a.data as Record<string, unknown>)?.userId === userId,
            );
          }

          const allAlerts = [...filteredPrice, ...filteredKeyword];

          if (allAlerts.length > 0) {
            const alertEvent = `event: alert\ndata: ${JSON.stringify({
              type: 'alerts',
              alerts: allAlerts,
              count: allAlerts.length,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            if (!safeEnqueue(controller, encoder.encode(alertEvent))) return;
          }

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

          console.error('Alerts stream poll error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: 'Error checking alerts',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          safeEnqueue(controller, encoder.encode(errorEvent));
        }

        if (isConnected) {
          setTimeout(pollAlerts, POLL_INTERVAL);
        }
      };

      setTimeout(() => pollAlerts(), 0);
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
