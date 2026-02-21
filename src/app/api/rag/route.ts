/**
 * RAG API - Ask questions about crypto news
 *
 * POST /api/rag
 * Query the news archive using natural language with RAG.
 * Now powered by the Ultimate RAG Service with full pipeline features.
 *
 * GET /api/rag
 * Returns service status, vector store stats, and endpoint directory.
 */

import { NextRequest, NextResponse } from 'next/server';
import { vectorStore } from '@/lib/rag';
import { askUltimate } from '@/lib/rag/ultimate-rag-service';
import { AskRequestSchema, formatValidationError, buildRagOptions } from './schemas';
import { applyRateLimit, withRateLimitHeaders, handleAPIError, logRequest } from './middleware';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimitResponse = applyRateLimit(request, 'ask');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    logRequest(request, 'ask', body);

    // Validate with Zod schema
    const parsed = AskRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { query, options } = parsed.data;

    const ragOptions = buildRagOptions(options);

    const result = await askUltimate(query, ragOptions);

    const response = NextResponse.json(result);
    return withRateLimitHeaders(response, request, 'ask');
  } catch (error) {
    return handleAPIError(error, 'rag');
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = await vectorStore.getStats();

    return NextResponse.json({
      status: 'ok',
      message: 'RAG service is running — Ultimate RAG pipeline active',
      stats,
      endpoints: {
        ask: 'POST /api/rag - Ask questions (Ultimate RAG)',
        askAdvanced: 'POST /api/rag/ask - Ask with full feature toggles',
        search: 'POST /api/rag/search - Search without generating response',
        stream: 'POST /api/rag/stream - Streaming RAG response',
        similar: 'GET /api/rag/similar/:id - Find similar articles',
        summary: 'GET /api/rag/summary/:crypto - Summarize crypto news',
        stats: 'GET /api/rag/stats - Get vector store statistics',
        batch: 'POST /api/rag/batch - Batch parallel queries (1-10)',
        feedback: 'POST /api/rag/feedback - Submit feedback on responses',
        metrics: 'GET /api/rag/metrics - Observability metrics',
      },
    });
  } catch (error) {
    return handleAPIError(error, 'rag-status');
  }
}
