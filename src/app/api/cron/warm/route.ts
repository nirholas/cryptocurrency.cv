/**
 * Cron Warmer — keeps critical API routes warm to eliminate cold starts.
 *
 * Hits the top-traffic routes so their aggregate cache (90 s TTL) and
 * CDN edge cache stay primed. This prevents users from ever seeing a
 * 25 s cold-start TTFB.
 *
 * Configured in vercel.json:  { "path": "/api/cron/warm", "schedule": "* * * * *" }
 *
 * The route is in EXEMPT_PATTERNS so it bypasses rate limiting and x402.
 */

import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BASE =
  process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

// Routes to warm, ordered by traffic volume & cold-start impact
const WARM_ROUTES = [
  '/api/news?limit=10',
  '/api/breaking?limit=5',
  '/api/trending?limit=10',
  '/api/stats',
  '/api/whale-alerts',
];

export async function GET(request: NextRequest) {
  // Verify cron secret — deny in production when CRON_SECRET is unset
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const start = Date.now();
  const results: Array<{ route: string; status: number; ms: number }> = [];

  // Fire all warm requests in parallel with a 15 s timeout
  const warmPromises = WARM_ROUTES.map(async (route) => {
    const routeStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(`${BASE}${route}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CronWarmer/1.0',
          'x-cron-warm': '1',
        },
      });
      clearTimeout(timeout);
      return { route, status: res.status, ms: Date.now() - routeStart };
    } catch {
      return { route, status: 0, ms: Date.now() - routeStart };
    }
  });

  const settled = await Promise.allSettled(warmPromises);
  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(r.value);
  }

  return NextResponse.json(
    {
      warmed: results.length,
      totalMs: Date.now() - start,
      results,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
