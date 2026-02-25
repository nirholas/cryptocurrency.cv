/**
 * Real-time AI Commentary SSE Endpoint
 *
 * Streams live AI-generated market commentary as Server-Sent Events.
 * Like having a Bloomberg terminal AI anchor desk in your browser.
 *
 * GET /api/commentary?tone=anchor&interval=60
 *
 * Query params:
 *   - tone: anchor|analyst|trader|degen (default: anchor)
 *   - interval: seconds between updates (default: 60, min: 30)
 *
 * SSE data format: CommentaryEvent JSON objects
 */

import { NextRequest } from 'next/server';
import {
  generateCommentary,
  buildMarketSnapshot,
  type CommentaryTone,
  type CommentaryEvent,
} from '@/lib/ai-commentary';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minute max

const MAX_CONCURRENT = 100;
let activeStreams = 0;

const VALID_TONES: CommentaryTone[] = ['anchor', 'analyst', 'trader', 'degen'];

export async function GET(request: NextRequest) {
  // Connection limiting
  if (activeStreams >= MAX_CONCURRENT) {
    return new Response(
      JSON.stringify({ error: 'Commentary stream at capacity', retryAfter: 30 }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '30' } }
    );
  }
  activeStreams++;

  const params = request.nextUrl.searchParams;
  const tone = (VALID_TONES.includes(params.get('tone') as CommentaryTone)
    ? params.get('tone')
    : 'anchor') as CommentaryTone;
  const intervalSec = Math.max(30, parseInt(params.get('interval') || '60', 10));
  const format = params.get('format') || 'sse'; // sse or json

  // JSON mode: return a single batch
  if (format === 'json') {
    activeStreams--;
    try {
      const events = await generateCommentary(tone);
      const snapshot = await buildMarketSnapshot();
      return new Response(
        JSON.stringify({
          commentary: events,
          snapshot,
          generatedAt: new Date().toISOString(),
          tone,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('[Commentary API] JSON generation failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate commentary' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // SSE streaming mode
  const encoder = new TextEncoder();
  let isConnected = true;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        if (!isConnected || controller.desiredSize === null) {
          isConnected = false;
          return false;
        }
        try {
          controller.enqueue(encoder.encode(data));
          return true;
        } catch {
          isConnected = false;
          return false;
        }
      };

      // Send initial commentary
      try {
        const snapshot = await buildMarketSnapshot();
        send(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);

        const events = await generateCommentary(tone);
        for (const event of events) {
          if (!isConnected) break;
          send(`event: commentary\ndata: ${JSON.stringify(event)}\n\n`);
        }
      } catch (err) {
        console.error('[Commentary SSE] Initial generation error:', err);
        send(`event: error\ndata: ${JSON.stringify({ error: 'Initial generation failed' })}\n\n`);
      }

      // Periodic updates
      intervalId = setInterval(async () => {
        if (!isConnected) {
          if (intervalId) clearInterval(intervalId);
          activeStreams--;
          return;
        }

        try {
          // Send heartbeat
          send(`: heartbeat ${new Date().toISOString()}\n\n`);

          // Generate new commentary
          const snapshot = await buildMarketSnapshot();
          send(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);

          const events = await generateCommentary(tone);
          for (const event of events) {
            if (!isConnected) break;
            send(`event: commentary\ndata: ${JSON.stringify(event)}\n\n`);
          }
        } catch (err) {
          console.error('[Commentary SSE] Update error:', err);
        }
      }, intervalSec * 1000);

      // Hard timeout cleanup
      setTimeout(() => {
        isConnected = false;
        if (intervalId) clearInterval(intervalId);
        activeStreams--;
        try {
          controller.close();
        } catch { /* already closed */ }
      }, 290000); // 290s (just under maxDuration)
    },

    cancel() {
      isConnected = false;
      if (intervalId) clearInterval(intervalId);
      activeStreams--;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
