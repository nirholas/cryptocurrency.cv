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
 * RAG Batch API — Parallel multi-query endpoint
 *
 * POST /api/rag/batch
 * Execute 1-10 queries in parallel with configurable concurrency.
 * Useful for dashboard widgets, multi-topic briefings, etc.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { askFast } from '@/lib/rag/ultimate-rag-service';
import type { UltimateRAGResponse } from '@/lib/rag/ultimate-rag-service';
import { BatchRequestSchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';
export const maxDuration = 120;

interface BatchResult {
  query: string;
  status: 'success' | 'error';
  result?: UltimateRAGResponse;
  error?: string;
  processingTime: number;
}

/**
 * Run tasks with at most `limit` in flight. Results keep the input order, so
 * duplicate queries each get their own answer.
 */
async function parallelLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, worker));
  return results;
}

export async function POST(request: NextRequest) {
  // Rate limit (strict — 5/min)
  const rateLimitResponse = applyRateLimit(request, 'batch');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    logRequest(request, 'batch', body);

    // Validate
    const parsed = BatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { queries, options } = parsed.data;
    const parallelism = options?.parallelism ?? 3;

    const batchStart = Date.now();

    // Build tasks
    const tasks = queries.map((query) => async (): Promise<BatchResult> => {
      const start = Date.now();
      try {
        const result = await askFast(query);
        return {
          query,
          status: 'success',
          result,
          processingTime: Date.now() - start,
        };
      } catch (error) {
        console.error('[rag/batch] query failed:', error);
        return {
          query,
          status: 'error',
          error: 'Query failed',
          processingTime: Date.now() - start,
        };
      }
    });

    // Execute with concurrency limit
    const orderedResults = await parallelLimit(tasks, parallelism);

    const succeeded = orderedResults.filter((r) => r.status === 'success').length;
    const failed = orderedResults.length - succeeded;
    const totalTime = Date.now() - batchStart;

    const response = NextResponse.json({
      results: orderedResults,
      summary: {
        total: queries.length,
        succeeded,
        failed,
        totalProcessingTime: totalTime,
        avgProcessingTime: totalTime / queries.length,
      },
    });

    return withRateLimitHeaders(response, request, 'batch');
  } catch (error) {
    return handleAPIError(error, 'batch');
  }
}
