/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Enhanced RAG Feedback API — Phase 4.1
 *
 * POST /api/rag/feedback         — Submit enhanced feedback
 * GET  /api/rag/feedback          — Analytics summary + alerts + export
 *   ?alerts=true                 — Active quality alerts
 *   ?variant=<id>                — Variant-specific satisfaction
 *   ?compare=a,b                 — Compare two A/B variants
 *   ?export=true                 — Training data export
 *
 * Replaces the basic in-memory array with the full FeedbackStore.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { ragLogger } from '@/lib/rag/observability';
import { getFeedbackStore } from '@/lib/rag/feedback-system';
import {
  EnhancedFeedbackRequestSchema,
  FeedbackRequestSchema,
  formatValidationError,
} from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';
import { intParam } from '@/lib/query-params';

export const runtime = 'nodejs';

const store = getFeedbackStore();

// ─── POST: Submit Feedback ────────────────────────────────────

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'feedback');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    logRequest(request, 'feedback', body);

    // Try enhanced schema first, fallback to basic
    let queryId: string;
    let query = '';
    let answer = '';
    let rating: 'positive' | 'negative';
    let category: 'accuracy' | 'relevance' | 'completeness' | 'timeliness' | 'other' | undefined;
    let comment: string | undefined;
    let sources: string[] | undefined;
    let confidence: number | undefined;
    let experimentVariantId: string | undefined;
    let userId: string | undefined;

    const enhanced = EnhancedFeedbackRequestSchema.safeParse(body);
    if (enhanced.success) {
      ({
        queryId, query, answer, rating, category,
        comment, sources, confidence, experimentVariantId, userId,
      } = enhanced.data);
    } else {
      // Fallback to basic schema for backwards-compatibility
      const basic = FeedbackRequestSchema.safeParse(body);
      if (!basic.success) {
        return NextResponse.json(formatValidationError(enhanced.error), { status: 400 });
      }
      ({ queryId, rating, category, comment } = basic.data);
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const id = store.addFeedback({
      queryId,
      query,
      answer,
      rating,
      category,
      comment,
      sources,
      confidence,
      experimentVariantId,
      userId,
      ip,
      timestamp: new Date().toISOString(),
    });

    ragLogger.info(
      `Feedback: ${rating} for ${queryId}${category ? ` [${category}]` : ''}`,
      queryId,
      { rating, category, feedbackId: id }
    );

    const response = NextResponse.json({
      success: true,
      feedbackId: id,
      queryId,
    });

    return withRateLimitHeaders(response, request, 'feedback');
  } catch (error) {
    return handleAPIError(error, 'feedback');
  }
}

// ─── GET: Analytics / Alerts / Export ─────────────────────────

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'metrics');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    logRequest(request, 'feedback-stats');

    const { searchParams } = request.nextUrl;

    // ?alerts=true — quality alerts
    if (searchParams.get('alerts') === 'true') {
      const allAlerts = searchParams.get('all') === 'true';
      const alerts = allAlerts ? store.getAllAlerts() : store.getActiveAlerts();
      const response = NextResponse.json({ alerts, count: alerts.length });
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // ?variant=<id> — variant-specific satisfaction
    const variantId = searchParams.get('variant');
    if (variantId) {
      const satisfaction = store.getVariantSatisfaction(variantId);
      const response = NextResponse.json(satisfaction);
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // ?compare=a,b — compare two variants
    const compare = searchParams.get('compare');
    if (compare) {
      const [a, b] = compare.split(',');
      if (a && b) {
        const comparison = store.compareVariants(a.trim(), b.trim());
        const response = NextResponse.json(comparison);
        return withRateLimitHeaders(response, request, 'metrics');
      }
    }

    // ?export=true — training data export
    if (searchParams.get('export') === 'true') {
      const includeNegatives = searchParams.get('includeNegatives') !== 'false';
      const limit = intParam(searchParams, 'limit', { fallback: 5000, min: 1, max: 50000 });
      const data = store.exportTrainingData({ includeNegatives, limit });
      const response = NextResponse.json(data);
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // ?ack=<alertId> — acknowledge an alert
    const ackId = searchParams.get('ack');
    if (ackId) {
      const acknowledged = store.acknowledgeAlert(ackId);
      const response = NextResponse.json({ acknowledged });
      return withRateLimitHeaders(response, request, 'metrics');
    }

    // Default: full analytics
    const analytics = store.getAnalytics();
    const recent = store.getRecentFeedback(20);

    const response = NextResponse.json({
      ...analytics,
      recent: recent.map((f) => ({
        id: f.id,
        queryId: f.queryId,
        rating: f.rating,
        category: f.category,
        timestamp: f.timestamp,
      })),
    });

    return withRateLimitHeaders(response, request, 'metrics');
  } catch (error) {
    return handleAPIError(error, 'feedback-stats');
  }
}
