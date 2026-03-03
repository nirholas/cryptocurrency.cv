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
 * Search Engine Abstraction Layer
 *
 * Provides a unified interface for full-text search, supporting:
 *   1. **PostgreSQL FTS** (default) — GIN-indexed tsvector with websearch_to_tsquery
 *   2. **Meilisearch** (optional) — Sub-50ms typo-tolerant search
 *   3. **Elasticsearch** (optional) — Enterprise-grade search at scale
 *
 * The active engine is selected via SEARCH_ENGINE env var:
 *   - "postgres" (default) — zero additional infra
 *   - "meilisearch" — requires MEILISEARCH_URL + MEILISEARCH_API_KEY
 *   - "elasticsearch" — requires ELASTICSEARCH_URL (+ ELASTICSEARCH_API_KEY)
 *
 * All engines implement the same SearchEngine interface so callers
 * are engine-agnostic.
 *
 * @module lib/search-engine
 */

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  content?: string;
  source: string;
  sourceKey: string;
  category: string;
  tickers: string[];
  tags: string[];
  sentimentLabel: string;
  publishedAt: string;
  link: string;
}

export interface SearchQuery {
  q: string;
  limit?: number;
  offset?: number;
  filters?: {
    ticker?: string;
    source?: string;
    category?: string;
    sentiment?: string;
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
  };
  sort?: 'relevance' | 'date' | 'sentiment';
  facets?: boolean;
}

export interface SearchHit {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceKey: string;
  category: string;
  tickers: string[];
  tags: string[];
  sentimentLabel: string;
  publishedAt: string;
  link: string;
  score: number;
  highlights?: {
    title?: string;
    description?: string;
  };
}

export interface SearchFacets {
  sources: { value: string; count: number }[];
  categories: { value: string; count: number }[];
  tickers: { value: string; count: number }[];
  sentiments: { value: string; count: number }[];
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  offset: number;
  limit: number;
  processingTimeMs: number;
  facets?: SearchFacets;
  query: string;
  engine: string;
}

export interface SearchEngine {
  /** Engine identifier */
  readonly name: string;

  /** Initialize connection / index */
  initialize(): Promise<void>;

  /** Search documents */
  search(query: SearchQuery): Promise<SearchResult>;

  /** Index a single document */
  index(doc: SearchDocument): Promise<void>;

  /** Index multiple documents in bulk */
  indexBulk(docs: SearchDocument[]): Promise<{ indexed: number; errors: number }>;

  /** Delete a document by ID */
  delete(id: string): Promise<void>;

  /** Get engine health */
  health(): Promise<{ ok: boolean; indexedDocs: number; latencyMs: number }>;

  /** Suggest completions (typeahead) */
  suggest(prefix: string, limit?: number): Promise<string[]>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PostgreSQL Full-Text Search Engine
// ─────────────────────────────────────────────────────────────────────────────

export class PostgresSearchEngine implements SearchEngine {
  readonly name = 'postgres';

  async initialize(): Promise<void> {
    // Postgres FTS is always available via Drizzle — no extra setup needed
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const start = performance.now();
    const { pgFullTextSearch } = await import('@/lib/db/queries');

    const result = await pgFullTextSearch(query.q, {
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      ticker: query.filters?.ticker,
      source: query.filters?.source,
    });

    const hits: SearchHit[] = result.results.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      source: r.source,
      sourceKey: r.sourceKey,
      category: '',
      tickers: r.tickers ?? [],
      tags: r.tags ?? [],
      sentimentLabel: r.sentimentLabel ?? 'neutral',
      publishedAt: r.pubDate?.toISOString() ?? r.firstSeen.toISOString(),
      link: r.link,
      score: r.rank,
    }));

    return {
      hits,
      total: result.total,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
      processingTimeMs: Math.round(performance.now() - start),
      query: query.q,
      engine: this.name,
    };
  }

  async index(_doc: SearchDocument): Promise<void> {
    // Postgres FTS is handled by the search_vector trigger on INSERT/UPDATE
  }

  async indexBulk(_docs: SearchDocument[]): Promise<{ indexed: number; errors: number }> {
    // Handled by Drizzle INSERT — search_vector is auto-generated
    return { indexed: _docs.length, errors: 0 };
  }

  async delete(_id: string): Promise<void> {
    const { getDb, articles } = await import('@/lib/db');
    const { eq } = await import('drizzle-orm');
    const db = getDb();
    if (db) {
      await db.delete(articles).where(eq(articles.id, _id));
    }
  }

  async health(): Promise<{ ok: boolean; indexedDocs: number; latencyMs: number }> {
    const start = performance.now();
    try {
      const { getDb } = await import('@/lib/db');
      const { sql } = await import('drizzle-orm');
      const db = getDb();
      if (!db) return { ok: false, indexedDocs: 0, latencyMs: 0 };

      const result = await db.execute<{ count: number }>(
        sql`SELECT count(*)::int as count FROM articles WHERE search_vector IS NOT NULL`
      );
      const count = (Array.isArray(result) ? result[0]?.count : (result as { rows: { count: number }[] }).rows?.[0]?.count) ?? 0;
      return {
        ok: true,
        indexedDocs: count ?? 0,
        latencyMs: Math.round(performance.now() - start),
      };
    } catch {
      return { ok: false, indexedDocs: 0, latencyMs: Math.round(performance.now() - start) };
    }
  }

  async suggest(prefix: string, limit = 5): Promise<string[]> {
    try {
      const { getDb, articles } = await import('@/lib/db');
      const { ilike } = await import('drizzle-orm');
      const db = getDb();
      if (!db) return [];

      // Escape LIKE wildcards in user input to prevent wildcard injection
      const escapedPrefix = prefix.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const rows = await db
        .selectDistinct({ title: articles.title })
        .from(articles)
        .where(ilike(articles.title, `%${escapedPrefix}%`))
        .limit(limit);

      return rows.map((r) => r.title);
    } catch {
      return [];
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Meilisearch Engine
// ─────────────────────────────────────────────────────────────────────────────

export class MeilisearchEngine implements SearchEngine {
  readonly name = 'meilisearch';
  private baseUrl: string;
  private apiKey: string;
  private indexName = 'articles';

  constructor() {
    this.baseUrl = (process.env.MEILISEARCH_URL ?? 'http://localhost:7700').replace(/\/$/, '');
    this.apiKey = process.env.MEILISEARCH_API_KEY ?? '';
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    return h;
  }

  async initialize(): Promise<void> {
    // Create index with primary key
    await fetch(`${this.baseUrl}/indexes`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ uid: this.indexName, primaryKey: 'id' }),
    });

    // Configure searchable/filterable attributes
    await fetch(`${this.baseUrl}/indexes/${this.indexName}/settings`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({
        searchableAttributes: ['title', 'description', 'content', 'tickers', 'tags'],
        filterableAttributes: ['source', 'sourceKey', 'category', 'sentimentLabel', 'tickers', 'tags', 'publishedAt'],
        sortableAttributes: ['publishedAt', 'score'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 },
        },
        faceting: { maxValuesPerFacet: 100 },
        pagination: { maxTotalHits: 10000 },
      }),
    });
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const start = performance.now();
    const filters: string[] = [];

    if (query.filters?.ticker) filters.push(`tickers = "${query.filters.ticker}"`);
    if (query.filters?.source) filters.push(`sourceKey = "${query.filters.source}"`);
    if (query.filters?.category) filters.push(`category = "${query.filters.category}"`);
    if (query.filters?.sentiment) filters.push(`sentimentLabel = "${query.filters.sentiment}"`);
    if (query.filters?.dateFrom) filters.push(`publishedAt >= "${query.filters.dateFrom}"`);
    if (query.filters?.dateTo) filters.push(`publishedAt <= "${query.filters.dateTo}"`);

    const body: Record<string, unknown> = {
      q: query.q,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
    };

    if (filters.length > 0) body['filter'] = filters.join(' AND ');
    if (query.sort === 'date') body['sort'] = ['publishedAt:desc'];
    if (query.facets) body['facets'] = ['source', 'category', 'tickers', 'sentimentLabel'];

    const res = await fetch(`${this.baseUrl}/indexes/${this.indexName}/search`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Meilisearch error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json() as {
      hits: Array<SearchDocument & { _rankingScore?: number; _formatted?: Record<string, string> }>;
      estimatedTotalHits: number;
      facetDistribution?: Record<string, Record<string, number>>;
    };

    const hits: SearchHit[] = data.hits.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      source: h.source,
      sourceKey: h.sourceKey,
      category: h.category,
      tickers: h.tickers,
      tags: h.tags,
      sentimentLabel: h.sentimentLabel,
      publishedAt: h.publishedAt,
      link: h.link,
      score: h._rankingScore ?? 0,
      highlights: {
        title: h._formatted?.title,
        description: h._formatted?.description,
      },
    }));

    const facets: SearchFacets | undefined = data.facetDistribution
      ? {
          sources: Object.entries(data.facetDistribution.source ?? {}).map(([v, c]) => ({ value: v, count: c })),
          categories: Object.entries(data.facetDistribution.category ?? {}).map(([v, c]) => ({ value: v, count: c })),
          tickers: Object.entries(data.facetDistribution.tickers ?? {}).map(([v, c]) => ({ value: v, count: c })),
          sentiments: Object.entries(data.facetDistribution.sentimentLabel ?? {}).map(([v, c]) => ({ value: v, count: c })),
        }
      : undefined;

    return {
      hits,
      total: data.estimatedTotalHits,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
      processingTimeMs: Math.round(performance.now() - start),
      facets,
      query: query.q,
      engine: this.name,
    };
  }

  async index(doc: SearchDocument): Promise<void> {
    await fetch(`${this.baseUrl}/indexes/${this.indexName}/documents`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify([doc]),
    });
  }

  async indexBulk(docs: SearchDocument[]): Promise<{ indexed: number; errors: number }> {
    const BATCH = 1000;
    let indexed = 0;
    let errors = 0;

    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      const res = await fetch(`${this.baseUrl}/indexes/${this.indexName}/documents`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(batch),
      });
      if (res.ok) {
        indexed += batch.length;
      } else {
        errors += batch.length;
      }
    }

    return { indexed, errors };
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/indexes/${this.indexName}/documents/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }

  async health(): Promise<{ ok: boolean; indexedDocs: number; latencyMs: number }> {
    const start = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/indexes/${this.indexName}/stats`, {
        headers: this.headers(),
      });
      if (!res.ok) return { ok: false, indexedDocs: 0, latencyMs: Math.round(performance.now() - start) };
      const stats = await res.json() as { numberOfDocuments: number };
      return {
        ok: true,
        indexedDocs: stats.numberOfDocuments,
        latencyMs: Math.round(performance.now() - start),
      };
    } catch {
      return { ok: false, indexedDocs: 0, latencyMs: Math.round(performance.now() - start) };
    }
  }

  async suggest(prefix: string, limit = 5): Promise<string[]> {
    const result = await this.search({ q: prefix, limit });
    return result.hits.map((h) => h.title);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Elasticsearch Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ElasticsearchEngine implements SearchEngine {
  readonly name = 'elasticsearch';
  private baseUrl: string;
  private apiKey: string;
  private indexName = 'crypto-news-articles';

  constructor() {
    this.baseUrl = (process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200').replace(/\/$/, '');
    this.apiKey = process.env.ELASTICSEARCH_API_KEY ?? '';
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['Authorization'] = `ApiKey ${this.apiKey}`;
    return h;
  }

  async initialize(): Promise<void> {
    // Create index with mapping
    const mapping = {
      settings: {
        number_of_shards: 2,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            crypto_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'stop', 'snowball'],
            },
          },
        },
        index: {
          max_result_window: 50000,
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'crypto_analyzer', fields: { keyword: { type: 'keyword' } } },
          description: { type: 'text', analyzer: 'crypto_analyzer' },
          content: { type: 'text', analyzer: 'crypto_analyzer' },
          source: { type: 'keyword' },
          sourceKey: { type: 'keyword' },
          category: { type: 'keyword' },
          tickers: { type: 'keyword' },
          tags: { type: 'keyword' },
          sentimentLabel: { type: 'keyword' },
          publishedAt: { type: 'date' },
          link: { type: 'keyword' },
          suggest: {
            type: 'completion',
            analyzer: 'simple',
            preserve_separators: true,
            preserve_position_increments: true,
            max_input_length: 50,
          },
        },
      },
    };

    await fetch(`${this.baseUrl}/${this.indexName}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(mapping),
    }).catch(() => {
      // Index may already exist — that's fine
    });
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const start = performance.now();

    const must: unknown[] = [
      {
        multi_match: {
          query: query.q,
          fields: ['title^3', 'description^2', 'content', 'tickers^2', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      },
    ];

    const filter: unknown[] = [];

    if (query.filters?.ticker) filter.push({ term: { tickers: query.filters.ticker.toUpperCase() } });
    if (query.filters?.source) filter.push({ term: { sourceKey: query.filters.source } });
    if (query.filters?.category) filter.push({ term: { category: query.filters.category } });
    if (query.filters?.sentiment) filter.push({ term: { sentimentLabel: query.filters.sentiment } });

    if (query.filters?.dateFrom || query.filters?.dateTo) {
      const range: Record<string, string> = {};
      if (query.filters.dateFrom) range['gte'] = query.filters.dateFrom;
      if (query.filters.dateTo) range['lte'] = query.filters.dateTo;
      filter.push({ range: { publishedAt: range } });
    }

    const sort: unknown[] = [];
    if (query.sort === 'date') sort.push({ publishedAt: 'desc' });
    else if (query.sort === 'sentiment') sort.push({ sentimentLabel: 'asc' });
    else sort.push('_score');

    const body: Record<string, unknown> = {
      query: { bool: { must, filter } },
      from: query.offset ?? 0,
      size: query.limit ?? 20,
      sort,
      highlight: {
        fields: {
          title: { number_of_fragments: 0 },
          description: { number_of_fragments: 1, fragment_size: 200 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
    };

    if (query.facets) {
      body['aggs'] = {
        sources: { terms: { field: 'sourceKey', size: 20 } },
        categories: { terms: { field: 'category', size: 20 } },
        tickers: { terms: { field: 'tickers', size: 30 } },
        sentiments: { terms: { field: 'sentimentLabel', size: 5 } },
      };
    }

    const res = await fetch(`${this.baseUrl}/${this.indexName}/_search`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Elasticsearch error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json() as {
      hits: {
        total: { value: number };
        hits: Array<{
          _id: string;
          _score: number;
          _source: SearchDocument;
          highlight?: { title?: string[]; description?: string[] };
        }>;
      };
      aggregations?: Record<string, { buckets: Array<{ key: string; doc_count: number }> }>;
    };

    const hits: SearchHit[] = data.hits.hits.map((h) => ({
      ...h._source,
      score: h._score,
      highlights: {
        title: h.highlight?.title?.[0],
        description: h.highlight?.description?.[0],
      },
    }));

    const facets: SearchFacets | undefined = data.aggregations
      ? {
          sources: data.aggregations.sources?.buckets.map((b) => ({ value: b.key, count: b.doc_count })) ?? [],
          categories: data.aggregations.categories?.buckets.map((b) => ({ value: b.key, count: b.doc_count })) ?? [],
          tickers: data.aggregations.tickers?.buckets.map((b) => ({ value: b.key, count: b.doc_count })) ?? [],
          sentiments: data.aggregations.sentiments?.buckets.map((b) => ({ value: b.key, count: b.doc_count })) ?? [],
        }
      : undefined;

    return {
      hits,
      total: data.hits.total.value,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
      processingTimeMs: Math.round(performance.now() - start),
      facets,
      query: query.q,
      engine: this.name,
    };
  }

  async index(doc: SearchDocument): Promise<void> {
    const body = {
      ...doc,
      suggest: { input: [doc.title, ...doc.tickers, ...doc.tags] },
    };

    await fetch(`${this.baseUrl}/${this.indexName}/_doc/${doc.id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
  }

  async indexBulk(docs: SearchDocument[]): Promise<{ indexed: number; errors: number }> {
    const BATCH = 500;
    let indexed = 0;
    let errors = 0;

    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      const lines: string[] = [];

      for (const doc of batch) {
        lines.push(JSON.stringify({ index: { _index: this.indexName, _id: doc.id } }));
        lines.push(JSON.stringify({
          ...doc,
          suggest: { input: [doc.title, ...doc.tickers, ...doc.tags] },
        }));
      }

      const res = await fetch(`${this.baseUrl}/_bulk`, {
        method: 'POST',
        headers: { ...this.headers(), 'Content-Type': 'application/x-ndjson' },
        body: lines.join('\n') + '\n',
      });

      if (res.ok) {
        const result = await res.json() as { errors: boolean; items: Array<{ index: { status: number } }> };
        if (result.errors) {
          const failed = result.items.filter((item) => item.index.status >= 400).length;
          errors += failed;
          indexed += batch.length - failed;
        } else {
          indexed += batch.length;
        }
      } else {
        errors += batch.length;
      }
    }

    return { indexed, errors };
  }

  async delete(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${this.indexName}/_doc/${id}`, {
      method: 'DELETE',
      headers: this.headers(),
    });
  }

  async health(): Promise<{ ok: boolean; indexedDocs: number; latencyMs: number }> {
    const start = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/${this.indexName}/_count`, {
        headers: this.headers(),
      });
      if (!res.ok) return { ok: false, indexedDocs: 0, latencyMs: Math.round(performance.now() - start) };
      const data = await res.json() as { count: number };
      return {
        ok: true,
        indexedDocs: data.count,
        latencyMs: Math.round(performance.now() - start),
      };
    } catch {
      return { ok: false, indexedDocs: 0, latencyMs: Math.round(performance.now() - start) };
    }
  }

  async suggest(prefix: string, limit = 5): Promise<string[]> {
    const body = {
      suggest: {
        article_suggest: {
          prefix,
          completion: { field: 'suggest', size: limit, fuzzy: { fuzziness: 'AUTO' } },
        },
      },
    };

    try {
      const res = await fetch(`${this.baseUrl}/${this.indexName}/_search`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) return [];
      const data = await res.json() as {
        suggest: { article_suggest: Array<{ options: Array<{ text: string }> }> };
      };
      return data.suggest.article_suggest[0]?.options.map((o) => o.text) ?? [];
    } catch {
      return [];
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory + Singleton
// ─────────────────────────────────────────────────────────────────────────────

let _engine: SearchEngine | null = null;

/**
 * Get the active search engine based on SEARCH_ENGINE env var.
 * Defaults to 'postgres'.
 */
export function getSearchEngine(): SearchEngine {
  if (_engine) return _engine;

  const engineType = (process.env.SEARCH_ENGINE ?? 'postgres').toLowerCase();

  switch (engineType) {
    case 'meilisearch':
      _engine = new MeilisearchEngine();
      break;
    case 'elasticsearch':
    case 'elastic':
      _engine = new ElasticsearchEngine();
      break;
    default:
      _engine = new PostgresSearchEngine();
  }

  return _engine;
}

/**
 * Reset engine singleton (used in tests).
 */
export function resetSearchEngine(): void {
  _engine = null;
}
