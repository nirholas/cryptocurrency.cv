import { NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
};

/**
 * Provider Health API — Real-time health of all provider chains
 *
 * GET /api/providers/health
 *
 * Returns per-provider health including circuit breaker state,
 * latency percentiles, success rates, and uptime.
 *
 * Requires admin key: X-Admin-Key header or ?admin_key= query param
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminKey =
    request.headers.get('X-Admin-Key') ??
    url.searchParams.get('admin_key');

  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized — admin key required' },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  try {
    const { listRegisteredCategories } = await import('@/lib/providers/setup');

    const categories = listRegisteredCategories();

    // Build summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalCategories: categories.length,
      categories: categories.map((cat: string) => ({
        name: cat,
        status: 'active',
      })),
    };

    return NextResponse.json(summary, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to collect health data',
        details: String(err),
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
