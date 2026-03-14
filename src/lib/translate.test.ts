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
 * Translation Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  translateArticles,
  isTranslationEnabled,
  isLanguageSupported,
  SUPPORTED_LANGUAGES,
  getTranslationCacheStats,
  clearTranslationCache,
  TranslationCache,
  SlidingWindowRateLimiter,
  translationCache,
  rateLimiter,
} from './translate';
import { callGroq, isGroqConfigured, parseGroqJson } from './groq';

// Mock the shared Groq client
vi.mock('./groq', () => ({
  callGroq: vi.fn(),
  isGroqConfigured: vi.fn(),
  parseGroqJson: vi.fn(),
}));

const mockCallGroq = vi.mocked(callGroq);
const mockIsGroqConfigured = vi.mocked(isGroqConfigured);
const mockParseGroqJson = vi.mocked(parseGroqJson);

// Sample articles for testing
const sampleArticles = [
  {
    title: 'Bitcoin hits new all-time high above $100K',
    description: 'BTC surges past $100,000 as institutional demand grows',
    link: 'https://example.com/btc-ath',
  },
  {
    title: 'Ethereum staking reaches record levels',
    description: 'Over 30M ETH now staked on the beacon chain',
    link: 'https://example.com/eth-staking',
  },
];

const translatedResponse = {
  translations: [
    {
      title: 'Bitcoin alcanza nuevo máximo histórico por encima de $100K',
      description: 'BTC supera los $100,000 a medida que crece la demanda institucional',
    },
    {
      title: 'El staking de Ethereum alcanza niveles récord',
      description: 'Más de 30M ETH ahora en staking en la beacon chain',
    },
  ],
};

describe('Translation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTranslationCache();
    rateLimiter.reset();
    mockIsGroqConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── isTranslationEnabled ───────────────────────────────

  describe('isTranslationEnabled', () => {
    it('returns true when Groq is configured', () => {
      mockIsGroqConfigured.mockReturnValue(true);
      expect(isTranslationEnabled()).toBe(true);
    });

    it('returns false when Groq is not configured', () => {
      mockIsGroqConfigured.mockReturnValue(false);
      expect(isTranslationEnabled()).toBe(false);
    });
  });

  // ─── isLanguageSupported ────────────────────────────────

  describe('isLanguageSupported', () => {
    it('returns true for supported languages', () => {
      expect(isLanguageSupported('es')).toBe(true);
      expect(isLanguageSupported('ja')).toBe(true);
      expect(isLanguageSupported('zh-CN')).toBe(true);
      expect(isLanguageSupported('en')).toBe(true);
    });

    it('returns false for unsupported languages', () => {
      expect(isLanguageSupported('xx')).toBe(false);
      expect(isLanguageSupported('klingon')).toBe(false);
      expect(isLanguageSupported('')).toBe(false);
    });
  });

  // ─── SUPPORTED_LANGUAGES ───────────────────────────────

  describe('SUPPORTED_LANGUAGES', () => {
    it('contains 50+ languages', () => {
      const count = Object.keys(SUPPORTED_LANGUAGES).length;
      expect(count).toBeGreaterThanOrEqual(50);
    });

    it('includes English as source language', () => {
      expect(SUPPORTED_LANGUAGES.en).toBe('English');
    });

    it('includes all major crypto market languages', () => {
      const majorLangs = ['en', 'zh-CN', 'ja', 'ko', 'es', 'pt', 'de', 'fr', 'ru', 'ar', 'hi', 'tr', 'vi'];
      for (const lang of majorLangs) {
        expect(SUPPORTED_LANGUAGES[lang]).toBeDefined();
      }
    });
  });

  // ─── translateArticles ─────────────────────────────────

  describe('translateArticles', () => {
    it('returns original articles when Groq is not configured', async () => {
      mockIsGroqConfigured.mockReturnValue(false);
      const result = await translateArticles(sampleArticles, 'es');
      expect(result).toEqual(sampleArticles);
      expect(mockCallGroq).not.toHaveBeenCalled();
    });

    it('returns original articles when target language is English', async () => {
      const result = await translateArticles(sampleArticles, 'en');
      expect(result).toEqual(sampleArticles);
      expect(mockCallGroq).not.toHaveBeenCalled();
    });

    it('returns original articles when array is empty', async () => {
      const result = await translateArticles([], 'es');
      expect(result).toEqual([]);
      expect(mockCallGroq).not.toHaveBeenCalled();
    });

    it('throws for unsupported language', async () => {
      await expect(translateArticles(sampleArticles, 'klingon')).rejects.toThrow(
        /Unsupported language/,
      );
    });

    it('translates articles via Groq and caches results', async () => {
      mockCallGroq.mockResolvedValueOnce({
        content: JSON.stringify(translatedResponse),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      mockParseGroqJson.mockReturnValueOnce(translatedResponse);

      const result = await translateArticles(sampleArticles, 'es');

      expect(mockCallGroq).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe(translatedResponse.translations[0].title);
      expect(result[0].description).toBe(translatedResponse.translations[0].description);
      expect(result[1].title).toBe(translatedResponse.translations[1].title);

      // Verify original titles preserved
      expect((result[0] as Record<string, unknown>).originalTitle).toBe(sampleArticles[0].title);
      expect((result[0] as Record<string, unknown>).translatedLang).toBe('es');

      // Verify cached
      const stats = getTranslationCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.languages).toContain('es');
    });

    it('returns cached translations on second call', async () => {
      mockCallGroq.mockResolvedValueOnce({
        content: JSON.stringify(translatedResponse),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      mockParseGroqJson.mockReturnValueOnce(translatedResponse);

      // First call - hits Groq
      await translateArticles(sampleArticles, 'es');
      expect(mockCallGroq).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await translateArticles(sampleArticles, 'es');
      expect(mockCallGroq).toHaveBeenCalledTimes(1); // Not called again
      expect(result[0].title).toBe(translatedResponse.translations[0].title);
    });

    it('falls back to original text when Groq fails', async () => {
      mockCallGroq.mockRejectedValueOnce(new Error('API rate limited'));

      const result = await translateArticles(sampleArticles, 'es');

      // Should return original text, not throw
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe(sampleArticles[0].title);
    });

    it('handles direct array response format', async () => {
      const directArray = translatedResponse.translations;
      mockCallGroq.mockResolvedValueOnce({
        content: JSON.stringify(directArray),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      mockParseGroqJson.mockReturnValueOnce(directArray);

      const result = await translateArticles(sampleArticles, 'fr');
      expect(result[0].title).toBe(directArray[0].title);
    });

    it('translates different languages independently', async () => {
      // Spanish
      mockCallGroq.mockResolvedValueOnce({
        content: '{}',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      mockParseGroqJson.mockReturnValueOnce(translatedResponse);
      await translateArticles(sampleArticles, 'es');

      // Japanese (separate call)
      const jaResponse = {
        translations: [
          { title: 'ビットコイン、$100Kを超え史上最高値を更新', description: 'BTC、機関需要の高まりで$100,000を突破' },
          { title: 'イーサリアムステーキング、過去最高を記録', description: '3,000万以上のETHがビーコンチェーンにステーク' },
        ],
      };
      mockCallGroq.mockResolvedValueOnce({
        content: '{}',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      });
      mockParseGroqJson.mockReturnValueOnce(jaResponse);
      const result = await translateArticles(sampleArticles, 'ja');

      expect(result[0].title).toBe(jaResponse.translations[0].title);
      expect(mockCallGroq).toHaveBeenCalledTimes(2);

      const stats = getTranslationCacheStats();
      expect(stats.languages).toContain('es');
      expect(stats.languages).toContain('ja');
    });
  });

  // ─── TranslationCache ──────────────────────────────────

  describe('TranslationCache', () => {
    it('stores and retrieves entries', () => {
      const cache = new TranslationCache();
      const value = { title: 'Test', translatedAt: '2026-01-01', lang: 'es' };
      cache.set('key1', value);
      expect(cache.get('key1')).toEqual(value);
    });

    it('returns null for missing entries', () => {
      const cache = new TranslationCache();
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('expires entries after TTL', () => {
      const cache = new TranslationCache(100, 50); // 50ms TTL
      const value = { title: 'Test', translatedAt: '2026-01-01', lang: 'es' };
      cache.set('key1', value);
      expect(cache.get('key1')).toEqual(value);

      // Mock time advancing past TTL
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 100);
      expect(cache.get('key1')).toBeNull();
      vi.restoreAllMocks();
    });

    it('evicts oldest entries when over max size', () => {
      const cache = new TranslationCache(3, 60_000);
      const mkVal = (n: number) => ({ title: `Test ${n}`, translatedAt: '2026-01-01', lang: 'es' });

      cache.set('a', mkVal(1));
      cache.set('b', mkVal(2));
      cache.set('c', mkVal(3));
      expect(cache.size).toBe(3);

      // Adding 4th should evict 'a' (oldest)
      cache.set('d', mkVal(4));
      expect(cache.size).toBe(3);
      expect(cache.get('a')).toBeNull();
      expect(cache.get('d')).toEqual(mkVal(4));
    });

    it('promotes accessed entries in LRU order', () => {
      const cache = new TranslationCache(3, 60_000);
      const mkVal = (n: number) => ({ title: `Test ${n}`, translatedAt: '2026-01-01', lang: 'es' });

      cache.set('a', mkVal(1));
      cache.set('b', mkVal(2));
      cache.set('c', mkVal(3));

      // Access 'a' to promote it to most recently used
      cache.get('a');

      // Add new entry — should evict 'b' (now oldest), not 'a'
      cache.set('d', mkVal(4));
      expect(cache.get('a')).toEqual(mkVal(1)); // Still present
      expect(cache.get('b')).toBeNull(); // Evicted
    });

    it('clear removes all entries', () => {
      const cache = new TranslationCache();
      cache.set('k1', { title: 'T1', translatedAt: '2026-01-01', lang: 'es' });
      cache.set('k2', { title: 'T2', translatedAt: '2026-01-01', lang: 'fr' });
      expect(cache.size).toBe(2);
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  // ─── SlidingWindowRateLimiter ──────────────────────────

  describe('SlidingWindowRateLimiter', () => {
    it('allows requests within the limit', async () => {
      const limiter = new SlidingWindowRateLimiter(5, 1000);
      // Should complete immediately for first 5
      for (let i = 0; i < 5; i++) {
        await limiter.acquire();
      }
      expect(limiter.pending).toBe(5);
    });

    it('reports pending count accurately', async () => {
      const limiter = new SlidingWindowRateLimiter(10, 1000);
      await limiter.acquire();
      await limiter.acquire();
      expect(limiter.pending).toBe(2);
    });

    it('resets pending count', async () => {
      const limiter = new SlidingWindowRateLimiter(10, 1000);
      await limiter.acquire();
      await limiter.acquire();
      limiter.reset();
      expect(limiter.pending).toBe(0);
    });
  });

  // ─── getTranslationCacheStats ──────────────────────────

  describe('getTranslationCacheStats', () => {
    it('returns empty stats when cache is empty', () => {
      const stats = getTranslationCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.languages).toEqual([]);
    });

    it('tracks unique languages in cache', () => {
      translationCache.set('es:https://a.com', { title: 'T', translatedAt: '2026-01-01', lang: 'es' });
      translationCache.set('es:https://b.com', { title: 'T', translatedAt: '2026-01-01', lang: 'es' });
      translationCache.set('ja:https://a.com', { title: 'T', translatedAt: '2026-01-01', lang: 'ja' });

      const stats = getTranslationCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.languages).toContain('es');
      expect(stats.languages).toContain('ja');
      expect(stats.languages).toHaveLength(2);
    });
  });

  // ─── clearTranslationCache ─────────────────────────────

  describe('clearTranslationCache', () => {
    it('empties the global translation cache', () => {
      translationCache.set('es:https://a.com', { title: 'T', translatedAt: '2026-01-01', lang: 'es' });
      expect(translationCache.size).toBeGreaterThan(0);
      clearTranslationCache();
      expect(translationCache.size).toBe(0);
    });
  });
});
