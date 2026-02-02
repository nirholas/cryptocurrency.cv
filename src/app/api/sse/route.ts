/**
 * Server-Sent Events (SSE) for Real-time Updates
 * 
 * Vercel-compatible alternative to WebSocket.
 * Streams news updates to connected clients.
 */

import { NextRequest } from 'next/server';
import { getLatestNews, getBreakingNews } from '@/lib/crypto-news';

export const runtime = 'edge';

// Polling interval in milliseconds
const POLL_INTERVAL = 30000; // 30 seconds

export async function GET(request: NextRequest) {
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

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to SSE stream',
        timestamp: new Date().toISOString(),
        config: { sources, categories, includeBreaking },
      })}\n\n`;
      if (!safeEnqueue(controller, encoder.encode(connectEvent))) return;

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
