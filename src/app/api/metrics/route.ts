/**
 * Metrics Endpoint
 * 
 * Provides API usage metrics:
 * - Request counts
 * - Error rates
 * - Response times
 * - Rate limit stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { ApiError } from '@/lib/api-error';

export const runtime = 'edge';

interface Metrics {
  timestamp: string;
  period: {
    start: string;
    end: string;
    duration: string;
  };
  requests: {
    total: number;
    byStatus: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  rateLimits: {
    totalBlocked: number;
    topBlockedIps: Array<{ ip: string; count: number }>;
  };
  errors: {
    total: number;
    byCode: Record<string, number>;
  };
}

/**
 * GET /api/metrics
 * 
 * Query params:
 * - period: 1h, 24h, 7d (default: 1h)
 * - admin_key: Required for access
 */
export async function GET(request: NextRequest) {
  // Require admin authentication
  const adminKey = request.headers.get('X-Admin-Key') || 
                   request.nextUrl.searchParams.get('admin_key');
  
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return ApiError.unauthorized('Admin authentication required');
  }

  const period = request.nextUrl.searchParams.get('period') || '1h';
  const now = Date.now();
  
  // Calculate time window
  const windows: Record<string, number> = {
    '1h': 3600 * 1000,
    '24h': 24 * 3600 * 1000,
    '7d': 7 * 24 * 3600 * 1000,
  };
  
  const windowMs = windows[period] || windows['1h'];
  const startTime = now - windowMs;

  try {
    // Fetch metrics from KV (collected by middleware/routes)
    const [requestCountsRaw, errorCountsRaw, rateLimitBlocksRaw] = await Promise.all([
      kv.get<Record<string, number>>('metrics:requests'),
      kv.get<Record<string, number>>('metrics:errors'),
      kv.get<number>('metrics:rate_limit_blocks'),
    ]);
    
    const requestCounts = requestCountsRaw ?? {};
    const errorCounts = errorCountsRaw ?? {};
    const rateLimitBlocks = rateLimitBlocksRaw ?? 0;

    const metrics: Metrics = {
      timestamp: new Date().toISOString(),
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(now).toISOString(),
        duration: period,
      },
      requests: {
        total: Object.values(requestCounts).reduce((a, b) => a + b, 0),
        byStatus: requestCounts,
        byEndpoint: {}, // TODO: Implement endpoint tracking
      },
      performance: {
        avgResponseTime: 0, // TODO: Implement timing tracking
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      rateLimits: {
        totalBlocked: rateLimitBlocks,
        topBlockedIps: [], // TODO: Implement IP tracking
      },
      errors: {
        total: Object.values(errorCounts).reduce((a, b) => a + b, 0),
        byCode: errorCounts,
      },
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (error) {
    return ApiError.internal('Failed to fetch metrics', error);
  }
}
