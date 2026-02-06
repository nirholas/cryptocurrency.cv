/**
 * RAG Batch API — Parallel multi-query endpoint
 *
 * POST /api/rag/batch
 * Execute 1-10 queries in parallel with configurable concurrency.
 * Useful for dashboard widgets, multi-topic briefings, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { askFast } from '@/lib/rag/ultimate-rag-service';
import type { UltimateRAGResponse } from '@/lib/rag/ultimate-rag-service';
import { BatchRequestSchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';

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
 * Execute promises with bounded concurrency
 */
async function parallelLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then((result) => {
      results.push(result);
    });
    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      // Remove settled promises
      const settled = executing.filter(
        (p) => {
          let done = false;
          p.then(() => { done = true; }).catch(() => { done = true; });
          return done;
        }
      );
      // Simpler: just await all when at limit
      if (executing.length >= limit) {
        await Promise.allSettled(executing);
        executing.length = 0;
      }
    }
  }

  await Promise.allSettled(executing);
  return results;
}

export async function POST(request: NextRequest) {
  // Rate limit (strict — 5/min)
  const rateLimitResponse = applyRateLimit(request, 'batch');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
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
        return {
          query,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - start,
        };
      }
    });

    // Execute with concurrency limit
    const results = await parallelLimit(tasks, parallelism);

    // Sort results to match input order
    const orderedResults = queries.map((q) =>
      results.find((r) => r.query === q) ?? {
        query: q,
        status: 'error' as const,
        error: 'Result not found',
        processingTime: 0,
      }
    );

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
