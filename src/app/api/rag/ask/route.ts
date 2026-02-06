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

import { NextRequest, NextResponse } from 'next/server';
import { askUltimate } from '@/lib/rag/ultimate-rag-service';
import type { UltimateRAGOptions } from '@/lib/rag/ultimate-rag-service';
import { AskRequestSchema, formatValidationError } from '../schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from '../middleware';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimitResponse = applyRateLimit(request, 'ask');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    logRequest(request, 'ask', body);

    // Validate
    const parsed = AskRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { query, options } = parsed.data;

    // Map validated request to UltimateRAGOptions
    const ragOptions: UltimateRAGOptions = {
      limit: options?.limit ?? 10,
      similarityThreshold: options?.similarityThreshold ?? 0.5,
      useRouting: options?.useRouting ?? true,
      useHybridSearch: options?.useHybridSearch ?? true,
      useHyDE: options?.useHyDE ?? true,
      useQueryDecomposition: options?.useQueryDecomposition ?? false,
      useAdvancedReranking: options?.useAdvancedReranking ?? true,
      useConversationMemory: options?.useConversationMemory ?? !!options?.conversationId,
      useSelfRAG: options?.useSelfRAG ?? false,
      useContextualCompression: options?.useContextualCompression ?? true,
      useAttributedAnswers: options?.useAttributedAnswers ?? true,
      useConfidenceScoring: options?.useConfidenceScoring ?? true,
      useSuggestedQuestions: options?.useSuggestedQuestions ?? true,
      useRelatedArticles: options?.useRelatedArticles ?? true,
      useCaching: options?.useCaching ?? true,
      useTracing: options?.useTracing ?? true,
      conversationId: options?.conversationId,
    };

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
