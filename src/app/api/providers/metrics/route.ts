import { NextResponse } from 'next/server';
import { toPrometheusText } from '@/lib/observability/metrics';

export const runtime = 'edge';

/**
 * Prometheus Metrics Endpoint
 *
 * GET /api/providers/metrics
 *
 * Returns metrics in Prometheus text format for scraping.
 * Admin key required.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminKey =
    request.headers.get('X-Admin-Key') ??
    url.searchParams.get('admin_key');

  if (adminKey !== process.env.ADMIN_API_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const text = toPrometheusText();

  return new NextResponse(text, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
