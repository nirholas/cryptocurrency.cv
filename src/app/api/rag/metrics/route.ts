/**
 * RAG Metrics API — Observability metrics endpoint
 *
 * GET /api/rag/metrics?period=24h
 * Returns aggregated performance metrics from the RAG tracer.
 *
 * Supported periods: 1h, 6h, 24h, 7d, 30d
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragTracer, ragLogger } from '@/lib/rag/observability';
import { MetricsQuerySchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';

export const runtime = 'nodejs';

const PERIOD_TO_MINUTES: Record<string, number> = {
  '1h': 60,
  '6h': 360,
  '24h': 1440,
  '7d': 10080,
  '30d': 43200,
};

export async function GET(request: NextRequest) {
  // Rate limit
  const rateLimitResponse = applyRateLimit(request, 'metrics');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    logRequest(request, 'metrics');

    // Parse query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '24h';

    const parsed = MetricsQuerySchema.safeParse({ period });
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const periodMinutes = PERIOD_TO_MINUTES[parsed.data.period ?? '24h'] ?? 1440;
    const metrics = ragTracer.getAggregatedMetrics(periodMinutes);

    // Also include recent traces for detailed inspection
    const recentTraces = ragTracer.getRecentTraces(20).map((t) => ({
      id: t.id,
      query: t.query.slice(0, 120),
      status: t.status,
      duration: t.duration,
      startTime: new Date(t.startTime).toISOString(),
      tokens: t.metrics.totalTokens,
      confidence: t.metrics.answerConfidence,
      documentsUsed: t.metrics.documentsUsed,
    }));

    // Recent errors
    const recentErrors = ragLogger.getRecentLogs(20, 'error');

    const response = NextResponse.json({
      period: parsed.data.period,
      metrics,
      recentTraces,
      recentErrors: recentErrors.map((e) => ({
        timestamp: e.timestamp,
        message: e.message,
        traceId: e.traceId,
      })),
    });

    return withRateLimitHeaders(response, request, 'metrics');
  } catch (error) {
    return handleAPIError(error, 'metrics');
  }
}
