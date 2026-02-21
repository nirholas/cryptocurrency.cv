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

vi.mock('@/lib/crypto-news', () => ({
  getLatestNews: mockGetLatestNews,
}));

vi.mock('@/app/api/_utils', () => ({
  groqNotConfiguredResponse: () =>
    new Response(
      JSON.stringify({ error: 'AI features not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    ),
}));

import { GET } from './route';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/sentiment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 503 when Groq is not configured', async () => {
    mockIsGroqConfigured.mockReturnValue(false);

    const response = await GET(makeRequest());

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBeDefined();
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

  it('returns 500 when Groq AI call fails', async () => {
    mockIsGroqConfigured.mockReturnValue(true);
    mockGetLatestNews.mockResolvedValueOnce({
      articles: sampleArticles,
      totalCount: 1,
      sources: ['coindesk'],
      fetchedAt: new Date().toISOString(),
    });
    mockPromptGroqJson.mockRejectedValueOnce(new Error('Groq rate limit'));

    const response = await GET(makeRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
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
});
