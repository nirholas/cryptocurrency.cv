import { NextRequest, NextResponse } from 'next/server';
import { searchNews } from '@/lib/crypto-news';
import { translateArticles, isLanguageSupported, SUPPORTED_LANGUAGES } from '@/lib/translate';
import { validateQuery } from '@/lib/validation-middleware';
import { searchQuerySchema } from '@/lib/schemas';
import { ApiError } from '@/lib/api-error';
import { generateEmbedding, cosineSimilarity } from '@/lib/embeddings';

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
async function scanArticleEmbeddingKeys(kv: import('@vercel/kv').VercelKV, maxKeys = 200): Promise<string[]> {
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
    // @vercel/kv not available or env vars not set
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
  } catch {
    // Any KV or API error — fall back to keyword search
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
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
      { status: 400 }
    );
  }
  
  // --- Semantic search branch ---
  if (useSemantic) {
    try {
      const semanticResults = await semanticSearch(sanitizedQuery);
      if (semanticResults) {
        return NextResponse.json(
          {
            query: sanitizedQuery,
            total: semanticResults.length,
            search_type: 'semantic',
            articles: semanticResults.map((r) => ({
              title: r.title,
              url: r.url,
              date: r.date,
              tags: r.tags,
            })),
            lang: 'en',
          },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
      // Fall through to keyword search if KV/API unavailable
    } catch {
      // Non-fatal — fall through to keyword search
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
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search news', message: String(error) },
      { status: 500 }
    );
  }
}
