import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CryptoNews, getCryptoNews, searchCryptoNews } from './index';

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
    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const client = new CryptoNews();
      await expect(client.getLatest()).rejects.toThrow('HTTP 500');
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
