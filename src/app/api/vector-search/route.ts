import { NextRequest, NextResponse } from 'next/server';
import {
  vectorSearch,
  findSimilarArticles,
  discoverTopics,
  getVectorSearchStats,
  getVectorSearchIndex,
} from '@/lib/vector-search';
import { jsonResponse, errorResponse, withTiming, CACHE_CONTROL } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * GET /api/vector-search
 * Semantic search across the article archive
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const action = searchParams.get('action');
  const articleId = searchParams.get('articleId');
  const topKRaw = parseInt(searchParams.get('topK') || '10', 10);
  const alphaRaw = parseFloat(searchParams.get('alpha') || '0.7');
  const temporalDecayRaw = parseFloat(searchParams.get('temporalDecay') || '0');
  const minScoreRaw = parseFloat(searchParams.get('minScore') || '0.3');
  const topK = Number.isNaN(topKRaw) ? 10 : Math.max(1, Math.min(topKRaw, 100));
  const alpha = Number.isNaN(alphaRaw) ? 0.7 : Math.max(0, Math.min(alphaRaw, 1));
  const temporalDecay = Number.isNaN(temporalDecayRaw) ? 0 : Math.max(0, Math.min(temporalDecayRaw, 1));
  const minScore = Number.isNaN(minScoreRaw) ? 0.3 : Math.max(0, Math.min(minScoreRaw, 1));

  // Special actions
  if (action === 'stats') {
    const stats = getVectorSearchStats();
    return jsonResponse(withTiming({ success: true, stats }, startTime), {
      cacheControl: CACHE_CONTROL.standard,
    });
  }

  if (action === 'similar' && articleId) {
    const results = await findSimilarArticles(articleId, topK);
    return jsonResponse(withTiming({
      success: true,
      action: 'similar',
      articleId,
      results,
      count: results.length,
    }, startTime), {
      cacheControl: CACHE_CONTROL.ai,
    });
  }

  if (action === 'topics') {
    const numTopics = parseInt(searchParams.get('numTopics') || '8', 10);
    const clusters = await discoverTopics(undefined, numTopics);
    return jsonResponse(withTiming({
      success: true,
      action: 'topics',
      clusters,
      count: clusters.length,
    }, startTime), {
      cacheControl: CACHE_CONTROL.ai,
    });
  }

  // If no query, return API docs
  if (!query) {
    return jsonResponse(withTiming({
      endpoint: '/api/vector-search',
      description: 'Semantic vector search across 662k+ crypto news articles with hybrid BM25 + embedding similarity',
      methods: {
        GET: {
          params: {
            q: 'Search query (natural language)',
            topK: 'Number of results (default: 10, max: 100)',
            alpha: 'Vector vs keyword weight (0=keyword only, 1=vector only, default: 0.7)',
            temporalDecay: 'Recency bias (0=none, 1=strong, default: 0)',
            minScore: 'Minimum similarity threshold (0-1, default: 0.3)',
            action: 'stats | similar | topics',
            articleId: '(for action=similar) Find articles similar to this one',
            numTopics: '(for action=topics) Number of topic clusters (default: 8)',
          },
        },
        POST: {
          description: 'Index new documents or batch search',
          body: {
            action: 'index | batch-search',
            documents: '(index) Array of { id, text, metadata: { title, source, publishedAt } }',
            queries: '(batch-search) Array of query strings',
          },
        },
      },
      features: [
        'Hybrid search: BM25 keyword + cosine vector similarity',
        'Configurable alpha blending between search methods',
        'Temporal decay for recency-weighted results',
        'Article similarity: "find articles like this one"',
        'Topic discovery via K-means clustering with k-means++ init',
        'Real-time search highlight generation',
        'Metadata filtering by date range, category, source',
      ],
      stats: getVectorSearchStats(),
    }, startTime), {
      cacheControl: CACHE_CONTROL.standard,
    });
  }

  // Perform search
  try {
    const dateStart = searchParams.get('dateStart') || undefined;
    const dateEnd = searchParams.get('dateEnd') || undefined;
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || undefined;
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || undefined;

    const results = await vectorSearch(query, {
      topK: Math.min(topK, 100),
      alpha: Math.max(0, Math.min(1, alpha)),
      temporalDecay: Math.max(0, Math.min(1, temporalDecay)),
      minScore: Math.max(0, Math.min(1, minScore)),
      dateRange: dateStart || dateEnd ? { start: dateStart, end: dateEnd } : undefined,
      categories,
      sources,
    });

    return jsonResponse(withTiming({
      success: true,
      query,
      results,
      count: results.length,
      searchParams: { topK, alpha, temporalDecay, minScore },
    }, startTime), {
      cacheControl: CACHE_CONTROL.ai,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return errorResponse(message, undefined, 500);
  }
}

/**
 * POST /api/vector-search
 * Index documents or batch search
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'index') {
      const { documents } = body as {
        documents?: Array<{
          id: string;
          text: string;
          metadata: { title: string; source?: string; publishedAt?: string };
        }>;
      };

      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return errorResponse('documents array is required', undefined, 400);
      }

      const index = getVectorSearchIndex();
      const result = await index.addDocuments(
        documents.map((d) => ({
          id: d.id,
          text: d.text,
          metadata: d.metadata,
        }))
      );

      return jsonResponse(withTiming({
        success: true,
        action: 'index',
        ...result,
        stats: index.getStats(),
      }, startTime));
    }

    if (action === 'batch-search') {
      const { queries, options } = body as {
        queries?: string[];
        options?: { topK?: number; alpha?: number };
      };

      if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return errorResponse('queries array is required', undefined, 400);
      }

      if (queries.length > 10) {
        return errorResponse('Maximum 10 queries per batch', undefined, 400);
      }

      const results = await Promise.all(
        queries.map((q) => vectorSearch(q, options))
      );

      return jsonResponse(withTiming({
        success: true,
        action: 'batch-search',
        results: queries.map((q, i) => ({
          query: q,
          results: results[i],
          count: results[i].length,
        })),
      }, startTime), {
        cacheControl: CACHE_CONTROL.ai,
      });
    }

    return errorResponse('Unknown action. Use: index or batch-search', undefined, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return errorResponse(message, undefined, 500);
  }
}
