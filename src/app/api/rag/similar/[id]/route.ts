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
 * RAG Similar Articles API
 * 
 * GET /api/rag/similar/[id]
 * Find articles similar to a given article.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSimilarArticles } from '@/lib/rag';
import { intParam } from '@/lib/query-params';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const topK = intParam(searchParams, 'topK', { fallback: 5, min: 1, max: 50 });

    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const results = await getSimilarArticles(id, topK);

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Article not found or no similar articles' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      articleId: id,
      similar: results.map(r => ({
        id: r.document.id,
        score: r.score,
        title: r.document.metadata.title,
        url: r.document.metadata.url,
        pubDate: r.document.metadata.pubDate,
        source: r.document.metadata.source,
        category: r.document.metadata.category,
      })),
    });
  } catch (error) {
    console.error('RAG similar error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
