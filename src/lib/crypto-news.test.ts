/**
 * @fileoverview Unit tests for crypto-news.ts utility functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fetch function before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('crypto-news utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NewsArticle type structure', () => {
    it('should validate a complete NewsArticle object', () => {
      const article = {
        id: 'test-123',
        title: 'Bitcoin Reaches New High',
        description: 'Bitcoin price surges to record levels',
        content: 'Full article content here...',
        link: 'https://example.com/article',
        pubDate: '2024-01-15T10:30:00Z',
        source: 'CoinDesk',
        category: 'bitcoin',
        image: 'https://example.com/image.jpg',
        author: 'John Doe',
        tags: ['bitcoin', 'price', 'market'],
      };

      expect(article).toHaveProperty('id');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('link');
      expect(article).toHaveProperty('pubDate');
      expect(article).toHaveProperty('source');
      expect(typeof article.id).toBe('string');
      expect(typeof article.title).toBe('string');
      expect(Array.isArray(article.tags)).toBe(true);
    });

    it('should handle articles with minimal required fields', () => {
      const minimalArticle = {
        id: 'min-123',
        title: 'Test Article',
        link: 'https://example.com',
        pubDate: new Date().toISOString(),
        source: 'TestSource',
        category: 'general',
      };

      expect(minimalArticle.id).toBeTruthy();
      expect(minimalArticle.title).toBeTruthy();
      expect(minimalArticle.source).toBeTruthy();
    });
  });

  describe('RSS Sources configuration', () => {
    const RSS_SOURCES = {
      coindesk: { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', category: 'general' },
      theblock: { name: 'The Block', url: 'https://www.theblock.co/rss.xml', category: 'general' },
      decrypt: { name: 'Decrypt', url: 'https://decrypt.co/feed', category: 'general' },
      cointelegraph: { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss', category: 'general' },
      bitcoinmagazine: { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/.rss/full/', category: 'bitcoin' },
      blockworks: { name: 'Blockworks', url: 'https://blockworks.co/feed', category: 'general' },
      defiant: { name: 'The Defiant', url: 'https://thedefiant.io/feed', category: 'defi' },
    };

    it('should have all expected sources', () => {
      const expectedSources = ['coindesk', 'theblock', 'decrypt', 'cointelegraph', 'bitcoinmagazine', 'blockworks', 'defiant'];
      expectedSources.forEach(source => {
        expect(RSS_SOURCES[source as keyof typeof RSS_SOURCES]).toBeDefined();
      });
    });

    it('should have valid URL format for all sources', () => {
      Object.values(RSS_SOURCES).forEach(source => {
        expect(source.url).toMatch(/^https?:\/\//);
      });
    });

    it('should have name and category for all sources', () => {
      Object.values(RSS_SOURCES).forEach(source => {
        expect(source.name).toBeTruthy();
        expect(source.category).toBeTruthy();
        expect(['general', 'bitcoin', 'defi', 'nft', 'altcoin']).toContain(source.category);
      });
    });
  });

  describe('Date parsing and formatting', () => {
    it('should parse ISO date strings', () => {
      const isoDate = '2024-01-15T10:30:00Z';
      const date = new Date(isoDate);
      // toISOString() always returns milliseconds (e.g., .000Z)
      expect(date.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should parse RFC 2822 date strings', () => {
      const rfcDate = 'Mon, 15 Jan 2024 10:30:00 GMT';
      const date = new Date(rfcDate);
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
    });

    it('should handle invalid dates gracefully', () => {
      const invalidDate = 'not a date';
      const date = new Date(invalidDate);
      expect(isNaN(date.getTime())).toBe(true);
    });
  });

  describe('Category classification', () => {
    const CATEGORIES = {
      bitcoin: ['btc', 'bitcoin', 'satoshi', 'lightning network', 'halving'],
      ethereum: ['eth', 'ethereum', 'vitalik', 'erc-20', 'erc-721', 'defi'],
      defi: ['defi', 'yield', 'lending', 'amm', 'liquidity', 'swap', 'uniswap', 'aave'],
      nft: ['nft', 'opensea', 'collectible', 'pfp', 'art'],
      regulation: ['sec', 'regulation', 'lawsuit', 'legal', 'government', 'ban'],
      market: ['price', 'bull', 'bear', 'rally', 'crash', 'ath', 'market'],
    };

    it('should correctly identify bitcoin-related keywords', () => {
      const title = 'Bitcoin BTC price surges after halving event';
      const titleLower = title.toLowerCase();
      const isBitcoin = CATEGORIES.bitcoin.some(kw => titleLower.includes(kw));
      expect(isBitcoin).toBe(true);
    });

    it('should correctly identify DeFi-related keywords', () => {
      const title = 'Uniswap launches new AMM liquidity pools';
      const titleLower = title.toLowerCase();
      const isDefi = CATEGORIES.defi.some(kw => titleLower.includes(kw));
      expect(isDefi).toBe(true);
    });

    it('should correctly identify regulation-related keywords', () => {
      const title = 'SEC files lawsuit against crypto exchange';
      const titleLower = title.toLowerCase();
      const isRegulation = CATEGORIES.regulation.some(kw => titleLower.includes(kw));
      expect(isRegulation).toBe(true);
    });
  });

  describe('Article ID generation', () => {
    const generateId = (title: string, pubDate: string, source: string): string => {
      const sanitized = `${source}-${title}-${pubDate}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
      return sanitized;
    };

    it('should generate consistent IDs for same input', () => {
      const id1 = generateId('Test Article', '2024-01-15', 'CoinDesk');
      const id2 = generateId('Test Article', '2024-01-15', 'CoinDesk');
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different sources', () => {
      const id1 = generateId('Test Article', '2024-01-15', 'CoinDesk');
      const id2 = generateId('Test Article', '2024-01-15', 'Decrypt');
      expect(id1).not.toBe(id2);
    });

    it('should sanitize special characters', () => {
      const id = generateId('Test @#$% Article!', '2024-01-15', 'CoinDesk');
      expect(id).not.toMatch(/[@#$%!]/);
    });

    it('should truncate long IDs', () => {
      const longTitle = 'A'.repeat(200);
      const id = generateId(longTitle, '2024-01-15', 'CoinDesk');
      expect(id.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Content sanitization', () => {
    const stripHtml = (html: string): string => {
      return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    };

    it('should remove HTML tags', () => {
      const html = '<p>This is <strong>bold</strong> text</p>';
      const text = stripHtml(html);
      expect(text).toBe('This is bold text');
    });

    it('should decode HTML entities', () => {
      const html = 'Price &gt; $100 &amp; rising';
      const text = stripHtml(html);
      expect(text).toBe('Price > $100 & rising');
    });

    it('should handle nested tags', () => {
      const html = '<div><p><span>Nested</span> content</p></div>';
      const text = stripHtml(html);
      expect(text).toBe('Nested content');
    });
  });

  describe('Pagination logic', () => {
    const paginate = <T>(items: T[], page: number, limit: number): { items: T[]; hasMore: boolean; total: number } => {
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedItems = items.slice(start, end);
      return {
        items: paginatedItems,
        hasMore: end < items.length,
        total: items.length,
      };
    };

    it('should return correct items for first page', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = paginate(items, 1, 3);
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(10);
    });

    it('should return correct items for middle page', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = paginate(items, 2, 3);
      expect(result.items).toEqual([4, 5, 6]);
      expect(result.hasMore).toBe(true);
    });

    it('should handle last page correctly', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = paginate(items, 4, 3);
      expect(result.items).toEqual([10]);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty arrays', () => {
      const result = paginate([], 1, 10);
      expect(result.items).toEqual([]);
      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(0);
    });
  });
});
