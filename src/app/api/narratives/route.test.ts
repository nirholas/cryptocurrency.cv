/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockIsAIConfigured, mockPromptAIJson, mockGetLatestNews } = vi.hoisted(() => ({
  mockIsAIConfigured: vi.fn(() => true),
  mockPromptAIJson: vi.fn(),
  mockGetLatestNews: vi.fn(),
}));

vi.mock('@/lib/ai-provider', () => ({
  isAIConfigured: mockIsAIConfigured,
  promptAIJson: mockPromptAIJson,
  AIAuthError: class AIAuthError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = 'AIAuthError';
    }
  },
}));

vi.mock('@/lib/crypto-news', () => ({
  getLatestNews: mockGetLatestNews,
}));

import { GET } from './route';
import { aiCache, staleCache } from '@/lib/cache';

function article(n: number) {
  return {
    title: `Synthetic headline ${n}`,
    link: `https://example.com/${n}`,
    description: `Synthetic summary ${n}`,
    pubDate: '2026-10-08T09:00:00.000Z',
    source: 'Example Wire',
    sourceKey: 'example',
    category: 'general',
    timeAgo: '1h ago',
  };
}

function newsOf(articles: ReturnType<typeof article>[]) {
  return { articles, totalCount: articles.length, sources: ['example'], fetchedAt: new Date().toISOString() };
}

const narrativeResult = {
  narratives: [
    {
      id: 'synthetic_theme',
      name: 'Synthetic theme',
      description: 'A synthetic narrative.',
      sentiment: 'bullish',
      strength: 60,
      articleIndexes: [0],
      relatedTickers: [],
      keyPhrases: [],
      emerging: false,
    },
  ],
};

function makeRequest(url = 'http://localhost/api/narratives') {
  return new NextRequest(url);
}

describe('GET /api/narratives', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiCache.clear();
    staleCache.clear();
    mockIsAIConfigured.mockReturnValue(true);
  });

  it('reuses one analysis across requests instead of re-prompting', async () => {
    mockGetLatestNews.mockResolvedValue(newsOf([article(0), article(1)]));
    mockPromptAIJson.mockResolvedValue(narrativeResult);

    const first = await GET(makeRequest());
    const second = await GET(makeRequest());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mockPromptAIJson).toHaveBeenCalledTimes(1);
  });

  it('keeps the articles a cached analysis was built from when the feed moves on', async () => {
    mockGetLatestNews.mockResolvedValueOnce(newsOf([article(0), article(1)]));
    mockPromptAIJson.mockResolvedValueOnce(narrativeResult);
    await GET(makeRequest());

    mockGetLatestNews.mockResolvedValueOnce(newsOf([article(7), article(8)]));
    const response = await GET(makeRequest());
    const body = await response.json();

    expect(body.narratives[0].articles[0].link).toBe('https://example.com/0');
  });

  it('serves the last good analysis while every AI provider is down', async () => {
    mockGetLatestNews.mockResolvedValue(newsOf([article(0)]));
    mockPromptAIJson.mockResolvedValueOnce(narrativeResult);
    await GET(makeRequest());

    aiCache.clear();
    mockPromptAIJson.mockRejectedValueOnce(new Error('every configured provider is out of quota'));
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    expect((await response.json()).narratives).toHaveLength(1);
  });

  it('answers 503 with Retry-After when no provider answers and nothing is cached', async () => {
    mockGetLatestNews.mockResolvedValue(newsOf([article(0)]));
    mockPromptAIJson.mockRejectedValueOnce(new Error('every configured provider is out of quota'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(makeRequest());

    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBeTruthy();
    error.mockRestore();
  });

  it('falls back to the default limit when limit is not a number', async () => {
    mockGetLatestNews.mockResolvedValue(newsOf([article(0)]));
    mockPromptAIJson.mockResolvedValue(narrativeResult);

    await GET(makeRequest('http://localhost/api/narratives?limit=abc'));

    expect(mockGetLatestNews).toHaveBeenCalledWith(40);
  });
});
