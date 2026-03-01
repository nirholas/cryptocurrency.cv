/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CryptoNews,
  getCryptoNews,
  searchCryptoNews,
  CryptoNewsError,
  APIError,
  RateLimitError,
  NetworkError,
} from './index';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CryptoNews', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('should use default base URL', () => {
      const client = new CryptoNews();
      expect(client['baseUrl']).toBe('https://cryptocurrency.cv');
    });

    it('should accept custom base URL', () => {
      const client = new CryptoNews({ baseUrl: 'https://custom.com' });
      expect(client['baseUrl']).toBe('https://custom.com');
    });
  });

  describe('getLatest', () => {
    it('should fetch latest news', async () => {
      const mockResponse = {
        articles: [{ title: 'Test Article', link: 'https://test.com' }],
        totalCount: 1,
        sources: ['TestSource'],
        fetchedAt: '2025-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new CryptoNews();
      const articles = await client.getLatest(10);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cryptocurrency.cv/api/news?limit=10',
        expect.any(Object)
      );
      expect(articles).toEqual(mockResponse.articles);
    });

    it('should filter by source', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [], totalCount: 0 }),
      });

      const client = new CryptoNews();
      await client.getLatest(5, 'coindesk');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cryptocurrency.cv/api/news?limit=5&source=coindesk',
        expect.any(Object)
      );
    });
  });

  describe('search', () => {
    it('should search with keywords', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [], totalCount: 0 }),
      });

      const client = new CryptoNews();
      await client.search('bitcoin, ethereum');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cryptocurrency.cv/api/search?q=bitcoin%2C%20ethereum&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('getDefi', () => {
    it('should fetch DeFi news', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [], totalCount: 0 }),
      });

      const client = new CryptoNews();
      await client.getDefi(15);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cryptocurrency.cv/api/defi?limit=15',
        expect.any(Object)
      );
    });
  });

  describe('getBitcoin', () => {
    it('should fetch Bitcoin news', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [], totalCount: 0 }),
      });

      const client = new CryptoNews();
      await client.getBitcoin();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cryptocurrency.cv/api/bitcoin?limit=10',
        expect.any(Object)
      );
    });
  });

  describe('getBreaking', () => {
    it('should fetch breaking news', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ articles: [], totalCount: 0 }),
      });

      const client = new CryptoNews();
      await client.getBreaking();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://cryptocurrency.cv/api/breaking?limit=5',
        expect.any(Object)
      );
    });
  });

  describe('getSources', () => {
    it('should fetch sources list', async () => {
      const mockSources = [
        { key: 'coindesk', name: 'CoinDesk', status: 'active' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sources: mockSources }),
      });

      const client = new CryptoNews();
      const sources = await client.getSources();

      expect(sources).toEqual(mockSources);
    });
  });

  describe('getHealth', () => {
    it('should fetch health status', async () => {
      const mockHealth = {
        status: 'healthy',
        summary: { healthy: 7, degraded: 0, down: 0, total: 7 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const client = new CryptoNews();
      const health = await client.getHealth();

      expect(health.status).toBe('healthy');
    });
  });

  describe('getRSSUrl', () => {
    it('should return RSS URL for all feeds', () => {
      const client = new CryptoNews();
      expect(client.getRSSUrl()).toBe('https://cryptocurrency.cv/api/rss');
    });

    it('should return RSS URL for specific feed', () => {
      const client = new CryptoNews();
      expect(client.getRSSUrl('defi')).toBe('https://cryptocurrency.cv/api/rss?feed=defi');
    });
  });

  describe('error handling', () => {
    it('should throw APIError on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: { get: () => null },
      });

      const client = new CryptoNews();
      await expect(client.getLatest()).rejects.toThrow(APIError);
    });

    it('should throw RateLimitError on 429', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: { get: (h: string) => (h === 'Retry-After' ? '30' : null) },
      });

      const client = new CryptoNews();
      try {
        await client.getLatest();
        expect.unreachable('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        expect((err as RateLimitError).retryAfter).toBe(30);
      }
    });

    it('should throw NetworkError on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      const client = new CryptoNews();
      await expect(client.getLatest()).rejects.toThrow(NetworkError);
    });

    it('error hierarchy is correct', () => {
      expect(new NetworkError('test')).toBeInstanceOf(CryptoNewsError);
      expect(new APIError(500, 'test')).toBeInstanceOf(CryptoNewsError);
      expect(new RateLimitError()).toBeInstanceOf(APIError);
      expect(new RateLimitError()).toBeInstanceOf(CryptoNewsError);
    });
  });

  describe('getPrices', () => {
    it('should fetch prices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bitcoin: { usd: 100000 } }),
      });

      const client = new CryptoNews();
      const result = await client.getPrices('bitcoin');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/prices?coin=bitcoin'),
        expect.any(Object)
      );
      expect(result).toHaveProperty('bitcoin');
    });
  });

  describe('getMarket', () => {
    it('should fetch market overview', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalMarketCap: 3e12 }),
      });

      const client = new CryptoNews();
      const result = await client.getMarket();
      expect(result).toHaveProperty('totalMarketCap');
    });
  });

  describe('getFearGreed', () => {
    it('should fetch fear & greed index', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: 72, classification: 'Greed' }),
      });

      const client = new CryptoNews();
      const result = await client.getFearGreed();
      expect(result.value).toBe(72);
    });
  });

  describe('getGas', () => {
    it('should fetch gas prices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ fast: 50, standard: 30 }),
      });

      const client = new CryptoNews();
      const result = await client.getGas();
      expect(result).toHaveProperty('fast');
    });
  });
});

describe('convenience functions', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('getCryptoNews should work', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: [{ title: 'Test' }] }),
    });

    const result = await getCryptoNews(5);
    expect(result).toHaveLength(1);
  });

  it('searchCryptoNews should work', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: [] }),
    });

    await searchCryptoNews('test');
    expect(mockFetch).toHaveBeenCalled();
  });
});
