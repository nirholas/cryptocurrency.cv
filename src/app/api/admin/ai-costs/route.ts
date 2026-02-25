/**
 * AI Cost Dashboard API
 *
 * GET /api/admin/ai-costs — Returns comprehensive cost analytics
 *
 * Query params:
 *   hours — lookback period (default: 24)
 *
 * Requires admin auth (ADMIN_API_KEY header or query param).
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getAICostTracker } from '@/lib/ai-cost-dashboard';

export async function GET(request: Request) {
  // Simple API key auth
  const url = new URL(request.url);
  const apiKey = request.headers.get('x-admin-key') || url.searchParams.get('key');
  const expectedKey = process.env.ADMIN_API_KEY;

  if (expectedKey && apiKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hours = parseInt(url.searchParams.get('hours') ?? '24', 10);
  const tracker = getAICostTracker();
  const dashboard = tracker.getDashboard(hours);

  return NextResponse.json(dashboard, {
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Total-Entries': String(tracker.getEntryCount()),
    },
  });
}
