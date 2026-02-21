/**
 * GET /api/news/stream
 * SSE endpoint for live news updates.
 *
 * Polls for new articles every ~60 seconds and pushes them via SSE.
 *
 * Query params:
 *   categories — comma-separated list of categories to filter (optional)
 *   limit      — max articles per poll (default 5, max 20)
 */

import { NextRequest } from 'next/server';
import { getLatestNews, getBreakingNews } from '@/lib/crypto-news';

export const dynamic = 'force-dynamic';

const POLL_INTERVAL = 60000; // 60 seconds

export async function GET(request: NextRequest): Promise<Response> {
  const searchParams = request.nextUrl.searchParams;
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '5', 10)), 20);

  const encoder = new TextEncoder();
  let isConnected = true;
  let lastArticleId = '';

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
        message: 'Connected to news stream',
        config: { categories, limit },
        timestamp: new Date().toISOString(),
      })}\n\n`;
      if (!safeEnqueue(controller, encoder.encode(connectEvent))) return;

      const pollNews = async () => {
        if (!isConnected) return;

        try {
          const news = await getLatestNews(limit);

          if (news.articles.length > 0) {
            const latestId = news.articles[0].link;

            if (latestId !== lastArticleId) {
              lastArticleId = latestId;

              let articles = news.articles;
              if (categories.length > 0) {
                articles = articles.filter((a) => categories.includes(a.category));
              }

              if (articles.length > 0) {
                const newsEvent = `event: news\ndata: ${JSON.stringify({
                  type: 'news',
                  articles: articles.slice(0, limit),
                  timestamp: new Date().toISOString(),
                })}\n\n`;
                if (!safeEnqueue(controller, encoder.encode(newsEvent))) return;
              }
            }
          }

          // Also check for breaking news
          const breaking = await getBreakingNews(3);
          if (breaking.articles.length > 0) {
            const breakingEvent = `event: breaking\ndata: ${JSON.stringify({
              type: 'breaking',
              articles: breaking.articles,
              timestamp: new Date().toISOString(),
            })}\n\n`;
            if (!safeEnqueue(controller, encoder.encode(breakingEvent))) return;
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

          console.error('News stream poll error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: 'Error fetching news',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          safeEnqueue(controller, encoder.encode(errorEvent));
        }

        if (isConnected) {
          setTimeout(pollNews, POLL_INTERVAL);
        }
      };

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
      'X-Accel-Buffering': 'no',
    },
  });
}
