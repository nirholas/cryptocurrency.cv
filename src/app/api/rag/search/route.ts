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
 * RAG Search API - Search news without generating response
 * 
 * POST /api/rag/search
 * Search the news archive without LLM response generation.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { searchNews, vectorStore } from '@/lib/rag';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { query, topK = 10, similarityThreshold = 0.5, dateRange, currencies } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const isEmpty = await vectorStore.isEmpty();
    if (isEmpty) {
      return NextResponse.json(
        { error: 'Vector store is empty. Run the ingestion script first.' },
        { status: 503 }
      );
    }

    const { results, extractedFilters } = await searchNews(query, {
      topK,
      similarityThreshold,
      dateRange,
      currencies,
    });

    return NextResponse.json({
      results: results.map(r => ({
        id: r.document.id,
        score: r.score,
        title: r.document.metadata.title,
        description: r.document.content,
        url: r.document.metadata.url,
        pubDate: r.document.metadata.pubDate,
        source: r.document.metadata.source,
        category: r.document.metadata.category,
        currencies: r.document.metadata.currencies,
        voteScore: r.document.metadata.voteScore,
      })),
      extractedFilters,
      count: results.length,
    });
  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
