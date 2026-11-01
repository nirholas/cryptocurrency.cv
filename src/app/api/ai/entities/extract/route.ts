/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest } from 'next/server';
import {
  extractFromArticle,
  extractFromArticles,
  disambiguateEntity,
} from '@/lib/entity-extractor';
import type { BatchExtractionResult } from '@/lib/entity-extractor';
import { jsonResponse, errorResponse, withTiming, CACHE_CONTROL } from '@/lib/api-utils';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'edge';

/**
 * GET /api/ai/entities/extract
 * Advanced entity, relationship, and event extraction
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'disambiguate') {
    const name = searchParams.get('name');
    const context = searchParams.get('context') || '';
    if (!name) return errorResponse('name parameter is required', undefined, 400);
    const result = await disambiguateEntity(name, context);
    return jsonResponse(withTiming({
      success: true,
      action: 'disambiguate',
      query: name,
      ...result,
    }, startTime), {
      cacheControl: CACHE_CONTROL.ai,
    });
  }

  // API docs
  return jsonResponse(withTiming({
    endpoint: '/api/ai/entities/extract',
    description: 'Advanced LLM-powered NER: entities, relationships, events, and claims from crypto articles. Two-pass extraction with confidence scoring.',
    methods: {
      GET: {
        params: {
          action: 'disambiguate',
          name: '(disambiguate) Entity name to resolve',
          context: '(disambiguate) Context text for disambiguation',
        },
      },
      POST: {
        description: 'Extract from single article or batch',
        body: {
          action: 'extract | batch-extract',
          articleId: '(extract) Article identifier',
          title: '(extract) Article title',
          content: '(extract) Article body text',
          source: '(extract, optional) Source name',
          articles: '(batch-extract) Array of { id, title, content, source? }',
        },
      },
    },
    extractionCapabilities: [
      'Entity types: person, organization, token, blockchain, protocol, exchange, fund, regulator, technology, event, concept, location',
      'Relationship detection: partnerships, investments, regulations, competition, acquisitions, lawsuits',
      'Event extraction: product launches, regulatory actions, market events, partnership announcements',
      'Claim detection: predictions, statements of fact, opinions from entities',
      'Entity disambiguation across articles',
      'Batch processing with cross-article aggregation',
    ],
    note: 'For simple entity extraction, use /api/ai/entities. This endpoint provides deep extraction with relationships and events.',
  }, startTime), {
    cacheControl: CACHE_CONTROL.standard,
  });
}

/**
 * POST /api/ai/entities/extract
 * Run extraction pipeline on articles
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { action } = body as { action?: string };

    // Single article extraction
    if (!action || action === 'extract') {
      const { articleId, title, content, source } = body as {
        articleId?: string;
        title?: string;
        content?: string;
        source?: string;
      };

      if (!articleId || !title || !content) {
        return errorResponse('articleId, title, and content are required', undefined, 400);
      }

      const result = await extractFromArticle(articleId, title, content, source);

      return jsonResponse(withTiming({
        success: true,
        action: 'extract',
        articleId,
        entities: result.entities,
        relationships: result.relationships,
        events: result.events,
        claims: result.claims,
        topics: result.topics,
        overallSentiment: result.overallSentiment,
        counts: {
          entities: result.entities.length,
          relationships: result.relationships.length,
          events: result.events.length,
          claims: result.claims.length,
        },
      }, startTime), {
        cacheControl: CACHE_CONTROL.ai,
      });
    }

    // Batch extraction
    if (action === 'batch-extract') {
      const { articles } = body as {
        articles?: Array<{ id: string; title: string; content: string; source?: string }>;
      };

      if (!articles || !Array.isArray(articles) || articles.length === 0) {
        return errorResponse('articles array is required (each with id, title, content)', undefined, 400);
      }

      if (articles.length > 20) {
        return errorResponse('Maximum 20 articles per batch', undefined, 400);
      }

      const batchResult: BatchExtractionResult = await extractFromArticles(articles);

      return jsonResponse(withTiming({
        success: true,
        action: 'batch-extract',
        aggregatedEntities: batchResult.aggregatedEntities,
        aggregatedRelationships: batchResult.aggregatedRelationships,
        eventTimeline: batchResult.eventTimeline,
        articles: batchResult.results.map((r) => ({
          articleId: r.articleId,
          entityCount: r.entities.length,
          relationshipCount: r.relationships.length,
          eventCount: r.events.length,
          claimCount: r.claims.length,
        })),
        summary: {
          articlesProcessed: batchResult.articlesProcessed,
          articlesFailed: batchResult.articlesFailed,
          totalEntities: batchResult.aggregatedEntities.length,
          totalRelationships: batchResult.aggregatedRelationships.length,
          totalEvents: batchResult.eventTimeline.length,
          processingTimeMs: batchResult.processingTimeMs,
        },
      }, startTime), {
        cacheControl: CACHE_CONTROL.ai,
      });
    }

    return errorResponse('Unknown action. Use: extract or batch-extract', undefined, 400);
  } catch (error) {
    console.error('[ai/entities/extract] extraction failed:', error);
    return errorResponse('Extraction failed', undefined, 500);
  }
}
