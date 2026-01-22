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

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        message: 'Connected to SSE stream',
        timestamp: new Date().toISOString(),
        config: { sources, categories, includeBreaking },
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

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
                controller.enqueue(encoder.encode(newsEvent));
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
              controller.enqueue(encoder.encode(breakingEvent));
            }
          }

          // Send heartbeat
          const heartbeat = `event: heartbeat\ndata: ${JSON.stringify({
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));

        } catch (error) {
          console.error('SSE poll error:', error);
          const errorEvent = `event: error\ndata: ${JSON.stringify({
            message: 'Error fetching news',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));
        }

        // Schedule next poll
        if (isConnected) {
          setTimeout(pollNews, POLL_INTERVAL);
        }
      };

      // Start polling
      await pollNews();
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
