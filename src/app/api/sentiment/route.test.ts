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
 * @fileoverview Unit tests for GET /api/sentiment route
 *
 * The sentiment route uses Groq AI to analyse the latest news and returns
 * per-article sentiment classifications plus an overall market sentiment score.
 *
 * Note: The route is a GET handler (no POST). It accepts optional query params:
 *   ?limit=<number>  &asset=<ticker>
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Module mocks — use vi.hoisted so refs are available inside vi.mock factories
// ---------------------------------------------------------------------------

const { mockIsGroqConfigured, mockPromptGroqJson, mockGetLatestNews } = vi.hoisted(
  () => ({
    mockIsGroqConfigured: vi.fn(() => false),
    mockPromptGroqJson: vi.fn(),
    mockGetLatestNews: vi.fn(),
  })
);

vi.mock('@/lib/groq', () => ({
  isGroqConfigured: mockIsGroqConfigured,
  promptGroqJson: mockPromptGroqJson,
}));

vi.mock('@/lib/ai-provider', () => ({
  isAIConfigured: mockIsGroqConfigured,
  promptAIJson: mockPromptGroqJson,
  AIAuthError: class AIAuthError extends Error {
    constructor(msg: string) { super(msg); this.name = 'AIAuthError'; }
  },
}));

vi.mock('@/lib/crypto-news', () => ({
  getLatestNews: mockGetLatestNews,
}));

vi.mock('@/app/api/_utils', () => ({
  groqNotConfiguredResponse: () =>
    new Response(
      JSON.stringify({ error: 'AI features not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    ),
  aiNotConfiguredResponse: () =>
    new Response(
      JSON.stringify({ error: 'AI features not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    ),
  aiAuthErrorResponse: (details?: string) =>
    new Response(
      JSON.stringify({ error: details || 'AI auth error' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    ),
}));

import { GET } from './route';
import { aiCache, staleCache } from '@/lib/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url = 'http://localhost/api/sentiment') {
  return new NextRequest(url);
}

const sampleArticles = [
  {
    title: 'Bitcoin Breaks $100k',
    link: 'https://coindesk.com/btc-100k',
    description: 'BTC hit a new ATH today.',
    pubDate: '2026-02-21T09:00:00.000Z',
    source: 'CoinDesk',
    sourceKey: 'coindesk',
    category: 'bitcoin',
    timeAgo: '2h ago',
  },
];

const sampleGroqResult = {
  articles: [
    {
      title: 'Bitcoin Breaks $100k',
      link: 'https://coindesk.com/btc-100k',
      source: 'CoinDesk',
      sentiment: 'very_bullish',
      confidence: 90,
      reasoning: 'All-time high price.',
      impactLevel: 'high',
      timeHorizon: 'immediate',
      affectedAssets: ['BTC'],
    },
  ],
  market: {
    overall: 'bullish',
    score: 65,
    confidence: 85,
    summary: 'The market is strongly bullish driven by BTC ATH.',
    keyDrivers: ['BTC ATH', 'ETF inflows', 'institutional buying'],
  },
};

/** Synthetic tickers, so no fixture names a real asset. */
const syntheticArticles = [
  {
    title: 'ZQXV network posts record growth after upgrade',
    link: 'https://example.com/zqxv-growth',
    description: 'Adoption of the synthetic ZQXV chain keeps climbing.',
    pubDate: '2026-10-08T09:00:00.000Z',
    source: 'Example Wire',
    sourceKey: 'example',
    category: 'general',
    timeAgo: '1h ago',
  },
  {
    title: 'Exchange hack triggers panic and a fraud investigation',
    link: 'https://example.com/hack',
    description: 'Regulators open a lawsuit after the collapse.',
    pubDate: '2026-10-08T08:00:00.000Z',
    source: 'Example Wire',
    sourceKey: 'example',
    category: 'general',
    timeAgo: '2h ago',
  },
];

function syntheticAIResult(assetsPerArticle: unknown[]) {
  return {
    articles: assetsPerArticle.map((affectedAssets, i) => ({
      title: `Synthetic article ${i}`,
      link: `https://example.com/${i}`,
      source: 'Example Wire',
      sentiment: 'bullish',
      confidence: 70,
      reasoning: 'synthetic',
      impactLevel: 'medium',
      timeHorizon: 'short_term',
      affectedAssets,
    })),
    market: {
      overall: 'bullish',
      score: 40,
      confidence: 70,
      summary: 'Synthetic summary.',
      keyDrivers: [],
    },
  };
}

function newsOf(articles: typeof syntheticArticles) {
  return {
    articles,
    totalCount: articles.length,
    sources: ['synthetic'],
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/sentiment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiCache.clear();
    staleCache.clear();
  });

  it('answers from the keyword reading when no AI provider is configured', async () => {
    mockIsGroqConfigured.mockReturnValue(false);
    mockGetLatestNews.mockResolvedValueOnce({
      articles: syntheticArticles,
      totalCount: syntheticArticles.length,
      sources: ['synthetic'],
      fetchedAt: new Date().toISOString(),
    });

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta.method).toBe('keyword');
    expect(body.meta.degraded).toBe(true);
    expect(body.meta.degradedReason).toBe('ai_not_configured');
    expect(mockPromptGroqJson).not.toHaveBeenCalled();
  });

  it('returns 200 with articles and market sentiment when Groq is configured', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce({
      articles: sampleArticles,
      totalCount: 1,
      sources: ['coindesk'],
      fetchedAt: new Date().toISOString(),
    });
    mockPromptGroqJson.mockResolvedValueOnce(sampleGroqResult);

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body.articles)).toBe(true);
    expect(body.market).toBeDefined();
    expect(body.market.score).toBe(65);
    expect(body.market.overall).toBe('bullish');
  });

  it('returns empty articles + neutral market when no news articles are available', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce({
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    });

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.articles).toEqual([]);
    expect(body.market.overall).toBe('neutral');
    expect(body.market.score).toBe(0);
  });

  it('answers from the keyword reading when every AI provider fails', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce({
      articles: syntheticArticles,
      totalCount: syntheticArticles.length,
      sources: ['synthetic'],
      fetchedAt: new Date().toISOString(),
    });
    mockPromptGroqJson.mockRejectedValueOnce(new Error('every configured provider is out of quota'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.meta.method).toBe('keyword');
    expect(body.meta.degradedReason).toBe('ai_unavailable');
    expect(body.market.confidence).toBeLessThanOrEqual(40);
    expect(body.market.overall).toBe('neutral');
    expect(body.articles).toHaveLength(syntheticArticles.length);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=60');
    warn.mockRestore();
  });

  it('filters articles by asset when ?asset= is provided', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce({
      articles: sampleArticles,
      totalCount: 1,
      sources: ['coindesk'],
      fetchedAt: new Date().toISOString(),
    });
    mockPromptGroqJson.mockResolvedValueOnce({
      ...sampleGroqResult,
      articles: [
        { ...sampleGroqResult.articles[0], affectedAssets: ['BTC'] },
        {
          title: 'ETH upgrade incoming',
          link: 'https://example.com/eth',
          source: 'Decrypt',
          sentiment: 'bullish',
          confidence: 70,
          reasoning: 'ETH upgrade',
          impactLevel: 'medium',
          timeHorizon: 'short_term',
          affectedAssets: ['ETH'],
        },
      ],
    });

    const response = await GET(
      makeRequest('http://localhost/api/sentiment?asset=BTC')
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    // Only BTC articles should be in the response
    expect(
      body.articles.every(
        (a: { affectedAssets: string[] }) =>
          a.affectedAssets.some((t: string) => t.toUpperCase().includes('BTC'))
      )
    ).toBe(true);
  });
  it('rejects an asset that cannot be a ticker symbol with 400', async () => {
    const response = await GET(makeRequest('http://localhost/api/sentiment?asset=%3Cscript%3E'));

    expect(response.status).toBe(400);
    expect(mockGetLatestNews).not.toHaveBeenCalled();
  });

  it('falls back to the default limit when limit is not a number', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce(newsOf(syntheticArticles));
    mockPromptGroqJson.mockResolvedValueOnce(syntheticAIResult([['ZQX']]));

    const response = await GET(makeRequest('http://localhost/api/sentiment?limit=abc'));

    expect(response.status).toBe(200);
    expect(mockGetLatestNews).toHaveBeenCalledWith(20);
  });

  it('reuses one AI analysis across polls and assets instead of re-prompting', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValue(newsOf(syntheticArticles));
    mockPromptGroqJson.mockResolvedValue(syntheticAIResult([['ZQX'], ['ZQXV']]));

    const first = await GET(makeRequest('http://localhost/api/sentiment?asset=ZQX'));
    const second = await GET(makeRequest('http://localhost/api/sentiment?asset=zqxv'));
    const third = await GET(makeRequest('http://localhost/api/sentiment'));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(200);
    expect(mockPromptGroqJson).toHaveBeenCalledTimes(1);
    expect((await first.json()).articles).toHaveLength(1);
    expect((await second.json()).meta.asset).toBe('ZQXV');
    expect((await third.json()).meta.method).toBe('ai');
  });

  it('matches the asset symbol exactly rather than as a substring', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce(newsOf(syntheticArticles));
    mockPromptGroqJson.mockResolvedValueOnce(syntheticAIResult([['ZQXV'], ['$zqx'], ['WZQ']]));

    const response = await GET(makeRequest('http://localhost/api/sentiment?asset=ZQX'));
    const body = await response.json();

    expect(body.articles.map((a: { link: string }) => a.link)).toEqual(['https://example.com/1']);
  });

  it('does not throw when the model omits affectedAssets on an article', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce(newsOf(syntheticArticles));
    mockPromptGroqJson.mockResolvedValueOnce(syntheticAIResult([undefined, ['ZQX']]));

    const response = await GET(makeRequest('http://localhost/api/sentiment?asset=ZQX'));

    expect(response.status).toBe(200);
    expect((await response.json()).articles).toHaveLength(1);
  });

  it('tags the requested asset on keyword-read articles that name it', async () => {
    mockIsGroqConfigured.mockReturnValue(false);
    mockGetLatestNews.mockResolvedValueOnce(newsOf(syntheticArticles));

    const response = await GET(makeRequest('http://localhost/api/sentiment?asset=zqxv'));
    const body = await response.json();

    expect(body.articles).toHaveLength(1);
    expect(body.articles[0].link).toBe('https://example.com/zqxv-growth');
    expect(body.articles[0].sentiment).toMatch(/bullish/);
    expect(body.articles[0].reasoning).toContain('growth');
  });

  it('answers 503 with Retry-After when the news feed itself is down', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockRejectedValueOnce(new Error('feed unreachable'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(makeRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('60');
    error.mockRestore();
  });
});
