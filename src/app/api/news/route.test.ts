/**
 * @fileoverview Unit tests for GET /api/news route
 *
 * Mocks archive/index reads via @/lib/crypto-news and validates
 * the route's response shaping, filtering, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks — use vi.hoisted so refs are available inside vi.mock factories
// ---------------------------------------------------------------------------

const { mockGetLatestNews, mockValidateQuery } = vi.hoisted(() => ({
  mockGetLatestNews: vi.fn(),
  mockValidateQuery: vi.fn(() => ({
    success: true,
    data: {
      limit: 20,
      source: undefined,
      category: undefined as string | undefined,
      from: undefined,
      to: undefined,
      page: 1,
      per_page: 20,
      lang: 'en',
    },
  })),
}));

vi.mock('@/lib/crypto-news', () => ({
  getLatestNews: mockGetLatestNews,
}));

vi.mock('@/lib/translate', () => ({
  translateArticles: vi.fn(async (articles: unknown[]) => articles),
  isLanguageSupported: vi.fn(() => true),
  SUPPORTED_LANGUAGES: { en: 'English', es: 'Spanish' },
}));

vi.mock('@/lib/api-utils', () => ({
  jsonResponse: (
    data: unknown,
    _opts?: object
  ) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  errorResponse: (
    _: string,
    detail: string,
    status: number
  ) => new Response(JSON.stringify({ error: detail }), { status, headers: { 'Content-Type': 'application/json' } }),
  withTiming: (data: unknown, _start: number) => ({ ...( data as object), _timing_ms: 0 }),
}));

vi.mock('@/lib/validation-middleware', () => ({
  validateQuery: mockValidateQuery,
}));

vi.mock('@/lib/schemas', () => ({
  newsQuerySchema: {},
}));

vi.mock('@/lib/api-error', () => ({
  ApiError: {
    internal: (_msg: string, _err: unknown) =>
      new Response(JSON.stringify({ error: 'internal' }), { status: 500 }),
  },
}));

vi.mock('@/lib/logger', () => ({
  createRequestLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { GET } from './route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url = 'http://localhost/api/news') {
  return new NextRequest(url);
}

function makeArticle(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Sample Crypto Article',
    link: 'https://example.com/article',
    description: 'A brief summary of crypto activity.',
    pubDate: '2026-02-21T08:00:00.000Z',
    source: 'CoinDesk',
    sourceKey: 'coindesk',
    category: 'general',
    timeAgo: '1h ago',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/news', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with an articles array', async () => {
    mockGetLatestNews.mockResolvedValueOnce({
      articles: [makeArticle(), makeArticle({ title: 'Second Article' })],
      totalCount: 2,
      sources: ['coindesk'],
      fetchedAt: new Date().toISOString(),
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.articles).toHaveLength(2);
  });

  it('returns articles respecting the limit parameter', async () => {
    // The route passes `limit` to getLatestNews as resolved by the middleware.
    mockValidateQuery.mockReturnValueOnce({
      success: true,
      data: {
        limit: 5,
        source: undefined,
        category: undefined,
        from: undefined,
        to: undefined,
        page: 1,
        per_page: 5,
        lang: 'en',
      },
    });

    mockGetLatestNews.mockResolvedValueOnce({
      articles: Array.from({ length: 5 }, (_, i) =>
        makeArticle({ title: `Article ${i + 1}` })
      ),
      totalCount: 5,
      sources: ['coindesk'],
      fetchedAt: new Date().toISOString(),
    });

    const response = await GET(makeRequest('http://localhost/api/news?limit=5'));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.articles).toHaveLength(5);
    expect(mockGetLatestNews).toHaveBeenCalledWith(5, undefined, expect.anything());
  });

  it('passes category filter to getLatestNews', async () => {
    mockValidateQuery.mockReturnValueOnce({
      success: true,
      data: {
        limit: 20,
        source: undefined,
        category: 'bitcoin',
        from: undefined,
        to: undefined,
        page: 1,
        per_page: 20,
        lang: 'en',
      },
    });

    mockGetLatestNews.mockResolvedValueOnce({
      articles: [makeArticle({ category: 'bitcoin' })],
      totalCount: 1,
      sources: ['bitcoinmagazine'],
      fetchedAt: new Date().toISOString(),
    });

    const response = await GET(
      makeRequest('http://localhost/api/news?category=bitcoin')
    );
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.articles[0].category).toBe('bitcoin');
    expect(mockGetLatestNews).toHaveBeenCalledWith(
      20,
      undefined,
      expect.objectContaining({ category: 'bitcoin' })
    );
  });

  it('returns empty articles array (not 500) when getLatestNews returns no articles', async () => {
    mockGetLatestNews.mockResolvedValueOnce({
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    });

    const response = await GET(makeRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.articles).toHaveLength(0);
  });

  it('returns 500 when getLatestNews throws', async () => {
    mockGetLatestNews.mockRejectedValueOnce(new Error('Index file not found'));

    const response = await GET(makeRequest());
    expect(response.status).toBe(500);
  });

  it('returns 400 when query validation fails', async () => {
    mockValidateQuery.mockReturnValueOnce({
      success: false,
      data: new Response(JSON.stringify({ error: 'invalid params' }), {
        status: 400,
      }),
    } as any);

    const response = await GET(
      makeRequest('http://localhost/api/news?limit=abc')
    );
    expect(response.status).toBe(400);
  });
});
