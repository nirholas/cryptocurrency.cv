/**
 * POST /api/search/semantic
 *
 * Semantic similarity search over a caller-supplied list of articles using
 * OpenAI text-embedding-3-small.  Falls back to the sparse TF-IDF embedding
 * when OPENAI_API_KEY is not set, so it always returns a result.
 *
 * Request body:
 *   {
 *     query: string,           // natural-language search query (required)
 *     articles: {              // corpus to search (required)
 *       id: string,
 *       title: string,
 *       summary?: string,
 *       content?: string,
 *     }[],
 *     topK?: number,           // max results to return (default 10, max 50)
 *   }
 *
 * Response:
 *   {
 *     results: { id: string; score: number }[],
 *     query: string,
 *     total: number,
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { semanticSearch, EmbeddingDocument } from '@/lib/ai-embeddings';

export const runtime = 'edge';

interface ArticleInput {
  id: string;
  title: string;
  summary?: string;
  content?: string;
}

interface SemanticSearchRequest {
  query: string;
  articles: ArticleInput[];
  topK?: number;
}

function buildDocumentText(article: ArticleInput): string {
  return [article.title, article.summary, article.content]
    .filter(Boolean)
    .join(' ')
    .slice(0, 4000); // keep representation compact; embeddings truncate anyway
}

export async function POST(request: NextRequest) {
  let body: SemanticSearchRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { query, articles, topK = 10 } = body;

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return NextResponse.json(
      { error: 'articles array is required and must not be empty' },
      { status: 400 }
    );
  }

  const k = Math.min(Math.max(1, topK), 50);

  const docs: EmbeddingDocument[] = articles.map((a) => ({
    id: a.id,
    text: buildDocumentText(a),
  }));

  try {
    const results = await semanticSearch(query, docs, k);

    return NextResponse.json({
      results,
      query: query.trim(),
      total: results.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Semantic search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
