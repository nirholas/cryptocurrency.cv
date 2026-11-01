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
 * RAG Evaluation API Route
 *
 * POST /api/rag/eval — Run evaluation suite against the RAG pipeline
 * GET  /api/rag/eval — Get the built-in test case catalog
 *
 * @module api/rag/eval
 */

import { type NextRequest, NextResponse } from 'next/server';
import { RAGEvaluator } from '@/lib/rag/evaluator';
import type { EvalTestCase, EvalPipelineOutput } from '@/lib/rag/evaluator';
import { askFast } from '@/lib/rag/ultimate-rag-service';
import { EvalRequestSchema, formatValidationError } from '../schemas';
import { applyRateLimit, handleAPIError } from '../middleware';
import testCaseData from '@/lib/rag/eval-test-cases.json';
import { readJsonBody } from '@/lib/json-body';

// ═══════════════════════════════════════════════════════════════
// GET — Return available test cases
// ═══════════════════════════════════════════════════════════════

export async function GET() {
  return NextResponse.json({
    version: testCaseData.version,
    description: testCaseData.description,
    totalCases: testCaseData.testCases.length,
    testCases: testCaseData.testCases,
    tags: [...new Set(testCaseData.testCases.flatMap((tc) => tc.tags ?? []))],
    difficulties: [...new Set(testCaseData.testCases.map((tc) => tc.difficulty))],
  });
}

// ═══════════════════════════════════════════════════════════════
// POST — Run evaluation
// ═══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    // Rate limit (very restrictive — evals are expensive)
    const rateLimitResponse = await applyRateLimit(request, 'batch');
    if (rateLimitResponse) return rateLimitResponse;

    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const parsed = EvalRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { testCases: inlineCases, config } = parsed.data;

    // Use inline test cases or fall back to built-in set
    const cases: EvalTestCase[] = (inlineCases ?? testCaseData.testCases).map((tc) => ({
      id: tc.id,
      query: tc.query,
      expectedAnswer: tc.expectedAnswer,
      expectedDocIds: 'expectedDocIds' in tc ? (tc as { expectedDocIds?: string[] }).expectedDocIds : undefined,
      tags: tc.tags,
      difficulty: tc.difficulty as EvalTestCase['difficulty'],
    }));

    // Create evaluator with optional config overrides
    const evaluator = new RAGEvaluator({
      passThreshold: config?.passThreshold,
      concurrency: config?.concurrency,
    });

    // Pipeline function: use askFast for speed
    const pipelineFn = async (query: string): Promise<EvalPipelineOutput> => {
      const pipeStart = Date.now();
      const result = await askFast(query);
      return {
        query,
        answer: result.answer,
        documents: result.sources.map((s, i) => ({
          id: `src-${i}`,
          title: s.title ?? 'Unknown',
          content: `${s.title} - ${s.source}`,
          source: s.source ?? 'unknown',
          score: s.voteScore ?? 0,
        })),
        processingTime: Date.now() - pipeStart,
      };
    };

    // Run batch evaluation
    const runResult = await evaluator.evaluateBatch(cases, pipelineFn);

    return NextResponse.json({
      ...runResult,
      processingTimeMs: Date.now() - start,
    });
  } catch (error) {
    return handleAPIError(error, 'eval');
  }
}
