/**
 * Server-Sent Events (SSE) for Real-time Updates
 * 
 * Vercel-compatible alternative to WebSocket.
 * Streams news updates to connected clients.
 * 
 * Scalability:
 *  - Global connection cap prevents edge function exhaustion
 *  - Per-client backpressure via desiredSize check
 *  - Auto-disconnect after MAX_CONNECTION_DURATION
 */

import { NextRequest } from 'next/server';
import { getLatestNews, getBreakingNews } from '@/lib/crypto-news';

export const runtime = 'edge';

// Polling interval in milliseconds
const POLL_INTERVAL = 30000; // 30 seconds

// --- Connection limits ---
const MAX_CONCURRENT_SSE = parseInt(process.env.SSE_MAX_CONNECTIONS ?? '500', 10);
const MAX_CONNECTION_DURATION = 30 * 60 * 1000; // 30 minutes hard cap
let activeConnections = 0;

export async function GET(request: NextRequest) {
  // --- Connection cap ---
  if (activeConnections >= MAX_CONCURRENT_SSE) {
    return new Response(
      JSON.stringify({ error: 'Too many SSE connections', code: 'SSE_CAPACITY', retryAfter: 30 }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } },
    );
  }
  activeConnections++;

  const searchParams = request.nextUrl.searchParams;
  const sources = searchParams.get('sources')?.split(',') || [];
  const categories = searchParams.get('categories')?.split(',') || [];
  const includeBreaking = searchParams.get('breaking') !== 'false';

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  let lastArticleId = '';
  let isConnected = true;

  // Helper to safely enqueue data to the controller
  const safeEnqueue = (controller: ReadableStreamDefaultController, data: Uint8Array): boolean => {
    // Check both our flag and the controller's state
    // desiredSize is null when the stream is closed or errored
    if (!isConnected || controller.desiredSize === null) {
      isConnected = false;
      return false;
    }
    try {
      controller.enqueue(data);
      return true;
    } catch {
      // Controller is closed, mark as disconnected (silently - this is expected)
      isConnected = false;
      return false;
    }
  };

  // Timer ref hoisted so cancel() can clear it
  let maxDurationTimer: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Auto-disconnect after MAX_CONNECTION_DURATION to prevent zombie connections
      maxDurationTimer = setTimeout(() => {
        if (isConnected) {
          const closeEvent = `event: close\ndata: ${JSON.stringify({
            reason: 'max_duration_reached',
            message: 'Connection closed after 30 minutes. Please reconnect.',
          })}\n\n`;
          safeEnqueue(controller, encoder.encode(closeEvent));
          isConnected = false;
          activeConnections = Math.max(0, activeConnections - 1);
          try { controller.close(); } catch { /* already closed */ }
        }
      }, MAX_CONNECTION_DURATION);

      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to SSE stream',
        timestamp: new Date().toISOString(),
        config: { sources, categories, includeBreaking },
      })}\n\n`;
      if (!safeEnqueue(controller, encoder.encode(connectEvent))) { clearTimeout(maxDurationTimer); return; }

      // Polling function
      const pollNews = async () => {
        if (!isConnected) return;

        try {
          // Fetch latest news
          const news = await getLatestNews(10, sources[0] || undefined);
          
          // Check for new articles
          if (news.articles.length > 0) {
            const latestId = news.articles[0].link;
            
            if (latestId !== lastArticleId) {
              lastArticleId = latestId;
              
              // Filter by categories if specified
              let articles = news.articles;
              if (categories.length > 0) {
                articles = articles.filter(a => categories.includes(a.category));
              }
              
              // Send news event
              if (articles.length > 0) {
                const newsEvent = `event: news\ndata: ${JSON.stringify({
                  type: 'news',
                  articles: articles.slice(0, 5),
                  timestamp: new Date().toISOString(),
                })}\n\n`;
                if (!safeEnqueue(controller, encoder.encode(newsEvent))) return;
              }
            }
          }

          // Check breaking news
          if (includeBreaking) {
            const breaking = await getBreakingNews(3);
            if (breaking.articles.length > 0) {
              const breakingEvent = `event: breaking\ndata: ${JSON.stringify({
                type: 'breaking',
                articles: breaking.articles,
                timestamp: new Date().toISOString(),
              })}\n\n`;
              if (!safeEnqueue(controller, encoder.encode(breakingEvent))) return;
            }
          }

          // Send heartbeat
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          if (!safeEnqueue(controller, encoder.encode(heartbeat))) return;

        } catch (error) {
          if (!isConnected) return;
          
          // Suppress controller closed errors - these are expected when clients disconnect
          const isControllerClosed = error instanceof TypeError && 
            (error.message.includes('Controller is already closed') || 
             error.message.includes('Invalid state'));
          
          if (isControllerClosed) {
            isConnected = false;
            return;
          }
          
          console.error('SSE poll error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: 'Error fetching news',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          safeEnqueue(controller, encoder.encode(errorEvent));
        }

        // Schedule next poll
        if (isConnected) {
          setTimeout(pollNews, POLL_INTERVAL);
        }
      };

      // Start polling asynchronously - don't block the stream from returning
      // Use setTimeout to defer the first poll so the stream returns immediately
      setTimeout(() => pollNews(), 0);
    },
    cancel() {
      isConnected = false;
      if (maxDurationTimer) { clearTimeout(maxDurationTimer); maxDurationTimer = null; }
      activeConnections = Math.max(0, activeConnections - 1);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
