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
 * RAG Ask API — Full Ultimate RAG endpoint
 *
 * POST /api/rag/ask
 * Run a query through the Ultimate RAG pipeline with all optional features.
 *
 * Uses: query routing, hybrid search, HyDE, self-RAG, contextual compression,
 *       answer attribution, confidence scoring, suggested questions, related articles,
 *       conversation memory, multi-layer caching, and full observability.
 *
 * Request body matches AskRequestSchema (see ../schemas.ts).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { askUltimate } from '@/lib/rag/ultimate-rag-service';
import { AskRequestSchema, formatValidationError, buildRagOptions } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimitResponse = applyRateLimit(request, 'ask');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    logRequest(request, 'ask', body);

    // Validate
    const parsed = AskRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { query, options } = parsed.data;

    const ragOptions = buildRagOptions(options);

    const start = Date.now();
    const result = await askUltimate(query, ragOptions);
    const processingTime = Date.now() - start;

    const response = NextResponse.json({
      ...result,
      processingTime,
    });

    return withRateLimitHeaders(response, request, 'ask');
  } catch (error) {
    return handleAPIError(error, 'ask');
  }
}
