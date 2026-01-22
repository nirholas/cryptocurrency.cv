/**
 * WebSocket API Route
 * 
 * Note: Vercel doesn't support native WebSocket in Edge functions.
 * This provides a polling fallback and instructions for WS setup.
 * For true WebSocket, deploy the standalone ws-server.ts to Railway/Render.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStats } from '@/lib/websocket';

export const runtime = 'edge';

// Server-Sent Events for real-time updates (Vercel-compatible)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode');

  // Stats endpoint
  if (mode === 'stats') {
    return NextResponse.json({
      message: 'WebSocket server stats',
      stats: getStats(),
      wsEndpoint: process.env.WS_ENDPOINT || 'wss://your-ws-server.railway.app',
      sseEndpoint: '/api/sse',
    });
  }

  // Instructions for WebSocket setup
  return NextResponse.json({
    message: 'WebSocket endpoint info',
    instructions: {
      vercel: 'Vercel Edge does not support WebSocket. Use SSE endpoint instead.',
      sse: '/api/sse - Server-Sent Events endpoint (Vercel compatible)',
      websocket: 'Deploy ws-server.ts to Railway/Render for full WebSocket support',
    },
    endpoints: {
      sse: '/api/sse',
      polling: '/api/news?limit=5',
      wsServer: process.env.WS_ENDPOINT || null,
    },
    example: {
      sse: `
const events = new EventSource('/api/sse?sources=coindesk,theblock');
events.onmessage = (e) => console.log(JSON.parse(e.data));
      `.trim(),
      websocket: `
const ws = new WebSocket('wss://your-ws-server.railway.app');
ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', payload: { sources: ['coindesk'] } }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
      `.trim(),
    },
  });
}
