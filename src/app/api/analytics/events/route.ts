/**
 * Analytics Events Ingestion
 *
 * POST /api/analytics/events
 *
 * Receives client-side analytics events from the browser.
 * Privacy-focused: no personal data stored, no cookies.
 *
 * @module api/analytics/events
 */

import { type NextRequest, NextResponse } from 'next/server';
import { trackAPIRequest } from '@/lib/analytics';

export const runtime = 'edge';

// In-memory event buffer (flushed periodically or when full)
const EVENT_BUFFER_MAX = 5000;
const eventBuffer: Array<{
  event: string;
  properties?: Record<string, string | number | boolean>;
  receivedAt: string;
  ip?: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body?.event;

    if (!event || typeof event !== 'string') {
      return NextResponse.json({ error: 'Missing event name' }, { status: 400 });
    }

    // Sanitize properties — only allow primitives
    const properties: Record<string, string | number | boolean> = {};
    if (body.properties && typeof body.properties === 'object') {
      for (const [key, val] of Object.entries(body.properties)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          properties[key] = val;
        }
      }
    }

    // Buffer the event
    if (eventBuffer.length < EVENT_BUFFER_MAX) {
      eventBuffer.push({
        event,
        properties,
        receivedAt: new Date().toISOString(),
      });
    }

    // Track this as an API request for server-side metrics
    trackAPIRequest('/api/analytics/events', 200, 0, request.headers.get('user-agent') || '');

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

/**
 * GET /api/analytics/events
 *
 * Returns buffered event summary (admin use).
 */
export async function GET(request: NextRequest) {
  const adminToken = process.env.ADMIN_TOKEN;
  const authHeader = request.headers.get('authorization');
  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Aggregate event counts
  const counts: Record<string, number> = {};
  for (const evt of eventBuffer) {
    counts[evt.event] = (counts[evt.event] || 0) + 1;
  }

  return NextResponse.json({
    buffered: eventBuffer.length,
    maxBuffer: EVENT_BUFFER_MAX,
    eventCounts: counts,
    oldestEvent: eventBuffer[0]?.receivedAt || null,
    newestEvent: eventBuffer.length > 0 ? eventBuffer[eventBuffer.length - 1].receivedAt : null,
  });
}
