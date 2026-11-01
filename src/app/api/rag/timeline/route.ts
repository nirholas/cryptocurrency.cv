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
 * Timeline Generation API — Phase 4.2
 *
 * POST /api/rag/timeline — Generate event timeline for a topic
 *
 * Uses RAG search to retrieve relevant articles, then extracts
 * events, clusters them, and returns a structured timeline.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getTimelineGenerator } from '@/lib/rag/timeline-generator';
import { getUltimateRAGService } from '@/lib/rag/ultimate-rag-service';
import { TimelineRequestSchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'ask');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    logRequest(request, 'timeline', body);

    const parsed = TimelineRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { topic, startDate, endDate, granularity, maxEvents, minImportance } = parsed.data;

    // 1. Retrieve relevant documents via RAG
    const ragService = getUltimateRAGService();
    const ragResult = await ragService.ask(topic, {
      limit: 30,
      useHybridSearch: true,
      useAdvancedReranking: true,
      useSelfRAG: false, // skip self-RAG for speed
      useAttributedAnswers: false,
      useConfidenceScoring: false,
      useSuggestedQuestions: false,
      useRelatedArticles: false,
    });

    const documents = (ragResult.sources || []).map((s, i) => ({
      id: `src-${i}`,
      title: s.title,
      content: s.title, // use title as content since we don't have full text in sources
      publishedAt: s.pubDate ? new Date(s.pubDate) : undefined,
      source: s.source,
      url: s.url,
      score: 1 - i * 0.02, // approximate score from rank
    }));

    // 2. Generate timeline
    const generator = getTimelineGenerator();
    const timeline = await generator.generateTimeline(topic, documents, {
      startDate,
      endDate,
      granularity,
      maxEvents,
      minImportance,
    });

    const response = NextResponse.json({
      success: true,
      timeline,
      meta: {
        documentsRetrieved: documents.length,
        eventsExtracted: timeline.events.length,
        clustersFormed: timeline.clusters.length,
      },
    });

    return withRateLimitHeaders(response, request, 'ask');
  } catch (error) {
    return handleAPIError(error, 'timeline');
  }
}
