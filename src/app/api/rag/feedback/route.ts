/**
 * RAG Feedback API — User feedback collection
 *
 * POST /api/rag/feedback
 * Collect user feedback (thumbs up/down) and optional category/comment
 * for a given RAG query response. Links feedback to trace via queryId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ragTracer, ragLogger } from '@/lib/rag/observability';
import { FeedbackRequestSchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';

export const runtime = 'nodejs';

// In-memory feedback store — swap for a database in production
interface FeedbackEntry {
  queryId: string;
  rating: 'positive' | 'negative';
  category?: string;
  comment?: string;
  ip: string;
  timestamp: string;
}

const feedbackStore: FeedbackEntry[] = [];
const MAX_FEEDBACK = 10_000;

export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimitResponse = applyRateLimit(request, 'feedback');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    logRequest(request, 'feedback', body);

    // Validate
    const parsed = FeedbackRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { queryId, rating, category, comment } = parsed.data;

    // Verify queryId exists in traces (optional — trace might have expired)
    const trace = ragTracer.getTrace(queryId);

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const entry: FeedbackEntry = {
      queryId,
      rating,
      category,
      comment,
      ip,
      timestamp: new Date().toISOString(),
    };

    feedbackStore.push(entry);

    // Trim oldest entries
    if (feedbackStore.length > MAX_FEEDBACK) {
      feedbackStore.splice(0, feedbackStore.length - MAX_FEEDBACK);
    }

    // Log feedback for observability
    ragLogger.info(
      `Feedback: ${rating} for ${queryId}${category ? ` [${category}]` : ''}`,
      queryId,
      { rating, category, comment: comment?.slice(0, 100) }
    );

    const response = NextResponse.json({
      success: true,
      queryId,
      traceFound: !!trace,
    });

    return withRateLimitHeaders(response, request, 'feedback');
  } catch (error) {
    return handleAPIError(error, 'feedback');
  }
}

/**
 * GET /api/rag/feedback — Retrieve feedback summary (admin)
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'metrics');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    logRequest(request, 'feedback-stats');

    const total = feedbackStore.length;
    const positive = feedbackStore.filter((f) => f.rating === 'positive').length;
    const negative = total - positive;

    const categoryCounts: Record<string, number> = {};
    for (const entry of feedbackStore) {
      if (entry.category) {
        categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
      }
    }

    const recent = feedbackStore.slice(-20).reverse().map((f) => ({
      queryId: f.queryId,
      rating: f.rating,
      category: f.category,
      timestamp: f.timestamp,
    }));

    const response = NextResponse.json({
      total,
      positive,
      negative,
      satisfactionRate: total > 0 ? positive / total : 0,
      categoryCounts,
      recent,
    });

    return withRateLimitHeaders(response, request, 'metrics');
  } catch (error) {
    return handleAPIError(error, 'feedback-stats');
  }
}
