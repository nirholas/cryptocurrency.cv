/**
 * @fileoverview Unit tests for international-sources.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseInternationalRSSFeed,
  getInternationalNews,
  getNewsByLanguage,
  getNewsByRegion,
  getInternationalSources,
  getSourceHealthStats,
  resetSourceHealth,
  INTERNATIONAL_SOURCES,
  KOREAN_SOURCES,
  CHINESE_SOURCES,
  JAPANESE_SOURCES,
  SPANISH_SOURCES,
  SOURCES_BY_LANGUAGE,
  SOURCES_BY_REGION,
  InternationalSource,
} from './international-sources';
import { newsCache } from './cache';

// Mock fetch

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('International Sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSourceHealth();
    newsCache.clear(); // Clear cache before each test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════
  // SOURCE CONFIGURATION TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Source configuration', () => {
    it('should have 9 Korean sources', () => {
      expect(KOREAN_SOURCES).toHaveLength(9);
      expect(KOREAN_SOURCES.every((s) => s.language === 'ko')).toBe(true);
    });

    it('should have 10 Chinese sources', () => {
      expect(CHINESE_SOURCES).toHaveLength(10);
      expect(CHINESE_SOURCES.every((s) => s.language === 'zh')).toBe(true);
    });

    it('should have 6 Japanese sources', () => {
      expect(JAPANESE_SOURCES).toHaveLength(6);
      expect(JAPANESE_SOURCES.every((s) => s.language === 'ja')).toBe(true);
    });

    it('should have 5 Spanish sources', () => {
      expect(SPANISH_SOURCES).toHaveLength(5);
      expect(SPANISH_SOURCES.every((s) => s.language === 'es')).toBe(true);
    });

    it('should have 76 total international sources', () => {
      expect(INTERNATIONAL_SOURCES).toHaveLength(76);
    });

    it('should have valid URLs for all sources', () => {
      for (const source of INTERNATIONAL_SOURCES) {
        expect(source.url).toMatch(/^https?:\/\//);
        expect(source.rss).toMatch(/^https?:\/\//);
      }
    });

    it('should have unique keys for all sources', () => {
      const keys = INTERNATIONAL_SOURCES.map((s) => s.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should correctly map sources by language', () => {
      expect(SOURCES_BY_LANGUAGE['ko']).toEqual(KOREAN_SOURCES);
      expect(SOURCES_BY_LANGUAGE['zh']).toEqual(CHINESE_SOURCES);
      expect(SOURCES_BY_LANGUAGE['ja']).toEqual(JAPANESE_SOURCES);
      expect(SOURCES_BY_LANGUAGE['es']).toEqual(SPANISH_SOURCES);
    });

    it('should correctly map sources by region', () => {
      expect(SOURCES_BY_REGION['asia']).toHaveLength(30); // 9 Korean + 10 Chinese + 6 Japanese + 5 Hindi
      expect(SOURCES_BY_REGION['latam']).toHaveLength(10); // 5 Spanish + 5 Portuguese
      expect(SOURCES_BY_REGION['europe']).toHaveLength(23); // 4 German + 4 French + 3 Russian + 3 Turkish + 3 Italian + 3 Dutch + 3 Polish
      expect(SOURCES_BY_REGION['mena']).toHaveLength(6); // 2 Arabic + 4 Persian
      expect(SOURCES_BY_REGION['sea']).toHaveLength(7); // 3 Indonesian + 2 Vietnamese + 2 Thai
    });

    it('should have proper region assignments', () => {
      expect(KOREAN_SOURCES.every((s) => s.region === 'asia')).toBe(true);
      expect(CHINESE_SOURCES.every((s) => s.region === 'asia')).toBe(true);
      expect(JAPANESE_SOURCES.every((s) => s.region === 'asia')).toBe(true);
      expect(SPANISH_SOURCES.every((s) => s.region === 'latam')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RSS PARSING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('RSS Parsing', () => {
    const mockSource: InternationalSource = {
      key: 'testsource',
      name: 'Test Source',
      url: 'https://test.com',
      rss: 'https://test.com/rss',
      language: 'ko',
      category: 'general',
      region: 'asia',
    };

    it('should parse standard RSS format', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>비트코인 가격 상승</title>
              <link>https://test.com/article1</link>
              <description>비트코인이 새로운 고점에 도달했습니다.</description>
              <pubDate>Mon, 15 Jan 2024 10:30:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('비트코인 가격 상승');
      expect(articles[0].link).toBe('https://test.com/article1');
      expect(articles[0].description).toBe('비트코인이 새로운 고점에 도달했습니다.');
      expect(articles[0].source).toBe('Test Source');
      expect(articles[0].sourceKey).toBe('testsource');
      expect(articles[0].language).toBe('ko');
      expect(articles[0].region).toBe('asia');
    });

    it('should parse RSS with CDATA sections', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title><![CDATA[이더리움 업그레이드 예정]]></title>
              <link>https://test.com/article2</link>
              <description><![CDATA[이더리움 네트워크가 <strong>중요한</strong> 업그레이드를 앞두고 있습니다.]]></description>
              <pubDate>Tue, 16 Jan 2024 14:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('이더리움 업그레이드 예정');
      // HTML tags should be stripped from description
      expect(articles[0].description).not.toContain('<strong>');
    });

    it('should handle multiple items', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Article 1</title>
              <link>https://test.com/1</link>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
            </item>
            <item>
              <title>Article 2</title>
              <link>https://test.com/2</link>
              <pubDate>Mon, 15 Jan 2024 11:00:00 GMT</pubDate>
            </item>
            <item>
              <title>Article 3</title>
              <link>https://test.com/3</link>
              <pubDate>Mon, 15 Jan 2024 12:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles).toHaveLength(3);
    });

    it('should skip items without title or link', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Valid Article</title>
              <link>https://test.com/valid</link>
            </item>
            <item>
              <title>Missing Link</title>
            </item>
            <item>
              <link>https://test.com/missing-title</link>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Valid Article');
    });

    it('should decode HTML entities', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Bitcoin &amp; Ethereum: The Future</title>
              <link>https://test.com/article</link>
              <description>Is $BTC &gt; $ETH? Let&apos;s find out.</description>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles[0].title).toBe('Bitcoin & Ethereum: The Future');
      expect(articles[0].description).toContain("Let's find out");
    });

    it('should generate unique IDs for articles', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Article 1</title>
              <link>https://test.com/article1</link>
            </item>
            <item>
              <title>Article 2</title>
              <link>https://test.com/article2</link>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles[0].id).toBeTruthy();
      expect(articles[1].id).toBeTruthy();
      expect(articles[0].id).not.toBe(articles[1].id);
    });

    it('should parse Chinese RSS content', () => {
      const chineseSource: InternationalSource = {
        key: '8btc',
        name: '8BTC',
        url: 'https://8btc.com',
        rss: 'https://8btc.com/feed',
        language: 'zh',
        category: 'general',
        region: 'asia',
      };

      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>比特币突破新高</title>
              <link>https://8btc.com/article1</link>
              <description>加密货币市场继续上涨</description>
              <pubDate>Wed, 17 Jan 2024 08:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, chineseSource);

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('比特币突破新高');
      expect(articles[0].language).toBe('zh');
    });

    it('should parse Japanese RSS content', () => {
      const japaneseSource: InternationalSource = {
        key: 'coinpost',
        name: 'CoinPost',
        url: 'https://coinpost.jp',
        rss: 'https://coinpost.jp/rss',
        language: 'ja',
        category: 'general',
        region: 'asia',
      };

      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>ビットコインが史上最高値を更新</title>
              <link>https://coinpost.jp/article1</link>
              <description>仮想通貨市場で活発な取引が続く</description>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, japaneseSource);

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('ビットコインが史上最高値を更新');
      expect(articles[0].language).toBe('ja');
    });

    it('should parse Spanish RSS content', () => {
      const spanishSource: InternationalSource = {
        key: 'criptonoticias',
        name: 'CriptoNoticias',
        url: 'https://criptonoticias.com',
        rss: 'https://criptonoticias.com/feed',
        language: 'es',
        category: 'general',
        region: 'latam',
      };

      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Bitcoin alcanza nuevo máximo histórico</title>
              <link>https://criptonoticias.com/article1</link>
              <description>El mercado de criptomonedas continúa su tendencia alcista</description>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, spanishSource);

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('Bitcoin alcanza nuevo máximo histórico');
      expect(articles[0].language).toBe('es');
      expect(articles[0].region).toBe('latam');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FETCH TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Fetching international news', () => {
    beforeEach(() => {
      mockFetch.mockReset();
    });

    it('should fetch and aggregate news from multiple sources', async () => {
      const mockXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Test Article</title>
              <link>https://test.com/article</link>
              <description>Test description</description>
              <pubDate>Mon, 15 Jan 2024 10:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(mockXml).buffer),
        headers: new Map([['content-type', 'application/xml; charset=UTF-8']]),
      });

      const result = await getInternationalNews({ limit: 5 });

      expect(result.articles).toBeDefined();
      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.translated).toBe(false);
    });

    it('should filter by language', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () =>
          Promise.resolve(
            new TextEncoder().encode(`
          <?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <item>
                <title>Korean Article</title>
                <link>https://test.com/ko</link>
              </item>
            </channel>
          </rss>
        `).buffer
          ),
        headers: new Map([['content-type', 'application/xml']]),
      });

      const result = await getNewsByLanguage('ko', 10);

      // Should have articles from the mocked response
      expect(result.articles.length).toBeGreaterThan(0);
      // All articles should be from Korean sources
      expect(result.articles.every(a => a.language === 'ko')).toBe(true);
    });

    it('should filter by region', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () =>
          Promise.resolve(
            new TextEncoder().encode(`
          <?xml version="1.0" encoding="UTF-8"?>
          <rss version="2.0">
            <channel>
              <item>
                <title>LatAm Article</title>
                <link>https://test.com/latam</link>
              </item>
            </channel>
          </rss>
        `).buffer
          ),
        headers: new Map([['content-type', 'application/xml']]),
      });

      const result = await getNewsByRegion('latam', 10);

      // Should have articles from the mocked response
      expect(result.articles.length).toBeGreaterThan(0);
      // All articles should be from LatAm region
      expect(result.articles.every(a => a.region === 'latam')).toBe(true);
    });

    it('should handle fetch failures gracefully', async () => {
      // Clear cache and reset mocks
      newsCache.clear();
      mockFetch.mockReset();
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getInternationalNews({ limit: 10 });

      // Should not throw and should handle gracefully
      expect(result).toBeDefined();
      expect(Array.isArray(result.articles)).toBe(true);
    });

    it('should handle non-200 responses', async () => {
      // Clear cache and reset mocks
      newsCache.clear();
      mockFetch.mockReset();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getInternationalNews({ limit: 10 });

      // Should not throw
      expect(result).toBeDefined();
      expect(Array.isArray(result.articles)).toBe(true);
    });

    it('should deduplicate articles with same link', async () => {
      // Simulate same article appearing in multiple feeds
      const mockXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Duplicate Article</title>
              <link>https://shared-link.com/article</link>
            </item>
          </channel>
        </rss>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(mockXml).buffer),
        headers: new Map([['content-type', 'application/xml']]),
      });

      const result = await getInternationalNews({ limit: 100 });

      // Check that duplicates are removed
      const links = result.articles.map((a) => a.link);
      const uniqueLinks = new Set(links);
      expect(links.length).toBe(uniqueLinks.size);
    });

    it('should respect limit parameter', async () => {
      const mockXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            ${Array(20)
              .fill(0)
              .map(
                (_, i) => `
              <item>
                <title>Article ${i}</title>
                <link>https://test.com/article${i}</link>
              </item>
            `
              )
              .join('')}
          </channel>
        </rss>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(mockXml).buffer),
        headers: new Map([['content-type', 'application/xml']]),
      });

      const result = await getInternationalNews({ limit: 5 });

      expect(result.articles.length).toBeLessThanOrEqual(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SOURCE HEALTH TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Source health monitoring', () => {
    it('should track source health stats', () => {
      const stats = getSourceHealthStats();

      expect(stats).toHaveProperty('healthy');
      expect(stats).toHaveProperty('degraded');
      expect(stats).toHaveProperty('unhealthy');
      expect(stats).toHaveProperty('total');
      expect(stats.total).toBe(INTERNATIONAL_SOURCES.length);
    });

    it('should start with all sources healthy', () => {
      resetSourceHealth();
      const stats = getSourceHealthStats();

      expect(stats.healthy).toBe(INTERNATIONAL_SOURCES.length);
      expect(stats.degraded).toBe(0);
      expect(stats.unhealthy).toBe(0);
    });

    it('should return sources with status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode('<rss></rss>').buffer),
        headers: new Map(),
      });

      const result = await getInternationalSources();

      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);

      for (const source of result.sources) {
        expect(['active', 'unavailable', 'degraded']).toContain(source.status);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ENCODING TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Encoding handling', () => {
    it('should handle UTF-8 encoded content', async () => {
      // Clear cache for fresh test
      newsCache.clear();
      mockFetch.mockReset();
      
      const utf8Content = '비트코인 가격 상승';
      const mockXml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>${utf8Content}</title>
              <link>https://test.com/utf8-article</link>
            </item>
          </channel>
        </rss>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(mockXml).buffer),
        headers: new Map([['content-type', 'application/xml; charset=UTF-8']]),
      });

      const result = await getNewsByLanguage('ko', 10);

      // Should have fetched the articles
      expect(result.articles.length).toBeGreaterThan(0);
      // At least one article should have the Korean content
      const hasKoreanContent = result.articles.some(a => a.title === utf8Content);
      expect(hasKoreanContent).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TIME AGO TESTS
  // ═══════════════════════════════════════════════════════════════

  describe('Time ago formatting', () => {
    it('should include timeAgo field in articles', () => {
      const mockSource: InternationalSource = {
        key: 'test',
        name: 'Test',
        url: 'https://test.com',
        rss: 'https://test.com/rss',
        language: 'ko',
        category: 'general',
        region: 'asia',
      };

      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <item>
              <title>Recent Article</title>
              <link>https://test.com/recent</link>
              <pubDate>${new Date().toUTCString()}</pubDate>
            </item>
          </channel>
        </rss>
      `;

      const articles = parseInternationalRSSFeed(xml, mockSource);

      expect(articles[0].timeAgo).toBeDefined();
      expect(typeof articles[0].timeAgo).toBe('string');
    });
  });
});
