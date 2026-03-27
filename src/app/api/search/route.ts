/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { validateQuery } from '@/lib/validation-middleware';
import { searchQuerySchema } from '@/lib/schemas';
import { ApiError } from '@/lib/api-error';
import { generateEmbedding, cosineSimilarity } from '@/lib/embeddings';
import { isDbAvailable, pgFullTextSearch } from '@/lib/db/queries';
import { instrumented } from '@/lib/telemetry-middleware';

export const runtime = 'edge';

// ---------------------------------------------------------------------------
// Semantic search helpers
// ---------------------------------------------------------------------------

interface StoredArticleEmbedding {
  embedding: number[];
  title: string;
  url: string;
  date: string;
  tags: string[];
}

/**
 * Scan KV for up to `maxKeys` article embedding keys using cursor-based iteration.
 * Returns the raw keys (e.g. "article_emb:abc123").
 */
async function scanArticleEmbeddingKeys(
  kv: import('@vercel/kv').VercelKV,
  maxKeys = 200,
): Promise<string[]> {
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [nextCursor, batch] = await kv.scan(cursor, {
      match: 'article_emb:*',
      count: 100,
    });
    keys.push(...(batch as string[]));
    cursor = Number(nextCursor);
  } while (cursor !== 0 && keys.length < maxKeys);
  return keys.slice(0, maxKeys);
}

/**
 * Run semantic search:
 *  1. Generate an embedding for the query.
 *  2. Fetch up to 200 stored article embeddings from KV.
 *  3. Rank by cosine similarity.
 *  4. Return the top 10 results.
 *
 * Returns null if KV is unavailable or OPENAI_API_KEY is not configured.
 */
async function semanticSearch(query: string): Promise<StoredArticleEmbedding[] | null> {
  let kv: import('@vercel/kv').VercelKV;
  try {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
  } catch {
    // @vercel/kv not available or env vars not set — expected in local dev
    return null;
  }

  try {
    // Generate embedding for the query (uses KV cache internally)
    const queryEmbedding = await generateEmbedding(query);

    // Fetch candidate keys
    const keys = await scanArticleEmbeddingKeys(kv, 200);
    if (keys.length === 0) return null;

    // Bulk-fetch stored embeddings
    const values = await kv.mget<StoredArticleEmbedding[]>(...keys);

    // Score and rank
    const scored: Array<{ score: number; article: StoredArticleEmbedding }> = [];
    for (const value of values) {
      if (!value || !Array.isArray(value.embedding)) continue;
      const score = cosineSimilarity(queryEmbedding, value.embedding);
      scored.push({ score, article: value });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map((s) => s.article);
  } catch (err) {
    console.warn('[search] Semantic search failed, falling back to keyword search', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const GET = instrumented(
  async function GET(request: NextRequest) {
    // Validate query parameters
    const validation = validateQuery(request, searchQuerySchema);
    if (!validation.success) {
      return validation.error;
    }

    const { q: sanitizedQuery, limit, lang } = validation.data;

    // Read semantic flag directly from URL (not schema-validated to avoid breaking changes)
    const url = new URL(request.url);
    const useSemantic = url.searchParams.get('semantic') === 'true';

    // Validate language parameter
    if (lang !== 'en' && !isLanguageSupported(lang)) {
      return NextResponse.json(
        {
          error: 'Unsupported language',
          message: `Language '${lang}' is not supported`,
          supported: Object.keys(SUPPORTED_LANGUAGES),
        },
        { status: 400 },
      );
    }

    // --- Parallel search: run semantic, Postgres FTS, and keyword search concurrently ---
    // Whichever returns results first wins. This eliminates the ~3-layer sequential
    // waterfall that was causing 25s TTFB on /api/search.
    type SearchResult = { articles: unknown[]; search_type: string; total: number } | null;

    const searchPromises: Array<Promise<SearchResult>> = [];

    // Semantic search (only when explicitly requested)
    if (useSemantic) {
      searchPromises.push(
        semanticSearch(sanitizedQuery)
          .then(
            (results): SearchResult =>
              results && results.length > 0
                ? {
                    articles: results.map((r) => ({
                      title: r.title,
                      url: r.url,
                      date: r.date,
                      tags: r.tags,
                    })),
                    search_type: 'semantic',
                    total: results.length,
                  }
                : null,
          )
          .catch(() => null),
      );
    }

    // Postgres full-text search
    if (isDbAvailable()) {
      searchPromises.push(
        pgFullTextSearch(sanitizedQuery, { limit })
          .then(
            (pgResult): SearchResult =>
              pgResult.total > 0
                ? {
                    articles: pgResult.results.map((r) => ({
                      title: r.title,
                      link: r.link,
                      description: r.description,
                      pubDate: r.pubDate?.toISOString() ?? r.firstSeen.toISOString(),
                      source: r.source,
                      sourceKey: r.sourceKey,
                      tickers: r.tickers,
                      tags: r.tags,
                      sentiment: r.sentimentLabel,
                      relevance: r.rank,
                    })),
                    search_type: 'fulltext',
                    total: pgResult.total,
                  }
                : null,
          )
          .catch(() => null),
      );
    }

    // If we have higher-priority search backends, race them before falling back
    if (searchPromises.length > 0) {
      const results = await Promise.allSettled(searchPromises);
      // Pick the first non-null result (semantic > fulltext priority)
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          let articles = r.value.articles;
          let resultLang = 'en';
          if (lang !== 'en' && articles.length > 0) {
            try {
              articles = await translateArticles(articles as any, lang);
              resultLang = lang;
            } catch {
              // continue with original
            }
          }
          return NextResponse.json(
            {
              query: sanitizedQuery,
              total: r.value.total,
              search_type: r.value.search_type,
              articles,
              lang: resultLang,
              availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
            },
            {
              headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                'Access-Control-Allow-Origin': '*',
              },
            },
          );
        }
      }
    }

    // --- Keyword search (default / fallback) ---
    try {
      const data = await searchNews(sanitizedQuery, limit);

      // Translate articles if language is not English
      let articles = data.articles;
      let translatedLang = 'en';

      if (lang !== 'en' && articles.length > 0) {
        try {
          articles = await translateArticles(articles, lang);
          translatedLang = lang;
        } catch (translateError) {
          console.error('Translation failed:', translateError);
        }
      }

      return NextResponse.json(
        {
          ...data,
          search_type: 'keyword',
          articles,
          lang: translatedLang,
          availableLanguages: Object.keys(SUPPORTED_LANGUAGES),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    } catch {
      return NextResponse.json({ error: 'Failed to search news' }, { status: 500 });
    }
  },
  { name: 'search' },
);
