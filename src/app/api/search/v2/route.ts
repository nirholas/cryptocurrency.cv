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
 * Advanced Search API v2
 *
 * Full-text search powered by the pluggable search engine layer.
 * Supports Postgres FTS (default), Meilisearch, or Elasticsearch.
 *
 * @route GET /api/search/v2?q=bitcoin&limit=20&offset=0&ticker=BTC&source=coindesk&facets=true
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSearchEngine } from '@/lib/search-engine';
import type { SearchQuery } from '@/lib/search-engine';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const start = performance.now();
  const params = request.nextUrl.searchParams;

  const q = params.get('q')?.trim();
  if (!q) {
    return NextResponse.json(
      { error: 'Missing required query parameter: q' },
      { status: 400 },
    );
  }

  const query: SearchQuery = {
    q,
    limit: Math.min(parseInt(params.get('limit') ?? '20', 10) || 20, 100),
    offset: parseInt(params.get('offset') ?? '0', 10) || 0,
    sort: (params.get('sort') as SearchQuery['sort']) ?? 'relevance',
    facets: params.get('facets') === 'true',
    filters: {},
  };

  // Parse filters
  const ticker = params.get('ticker');
  const source = params.get('source');
  const category = params.get('category');
  const sentiment = params.get('sentiment');
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');
  const tags = params.get('tags');

  if (ticker) query.filters!.ticker = ticker.toUpperCase();
  if (source) query.filters!.source = source;
  if (category) query.filters!.category = category;
  if (sentiment) query.filters!.sentiment = sentiment;
  if (dateFrom) query.filters!.dateFrom = dateFrom;
  if (dateTo) query.filters!.dateTo = dateTo;
  if (tags) query.filters!.tags = tags.split(',').map((t) => t.trim());

  try {
    const engine = getSearchEngine();
    const result = await engine.search(query);

    return NextResponse.json({
      ...result,
      _meta: {
        engine: result.engine,
        processingTimeMs: result.processingTimeMs,
        totalTimeMs: Math.round(performance.now() - start),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Search-Engine': result.engine,
        'X-Processing-Time': String(result.processingTimeMs),
      },
    });
  } catch (error) {
    console.error('[search/v2] Error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Typeahead / autocomplete suggestions
 *
 * @route GET /api/search/v2?suggest=true&q=bit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { q: string; limit?: number };
    if (!body.q) {
      return NextResponse.json({ error: 'Missing q' }, { status: 400 });
    }

    const engine = getSearchEngine();
    const suggestions = await engine.suggest(body.q, body.limit ?? 5);

    return NextResponse.json({ suggestions, engine: engine.name });
  } catch (error) {
    console.error('search/v2 route error:', error);
    return NextResponse.json(
      { error: 'Suggest failed', message: 'Internal server error' },
      { status: 500 },
    );
  }
}
