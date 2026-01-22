/**
 * International Crypto News Sources
 * 
 * Aggregates news from Korean, Chinese, Japanese, and Spanish crypto news sources.
 * Supports automatic translation to English via the source-translator module.
 */

import sanitizeHtml from 'sanitize-html';
import { newsCache, withCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface InternationalSource {
  key: string;
  name: string;
  url: string;
  rss: string;
  language: 'ko' | 'zh' | 'ja' | 'es';
  category: string;
  region: 'asia' | 'europe' | 'latam';
  encoding?: string;
}

export interface InternationalArticle {
  id: string;
  title: string;
  titleEnglish?: string;
  description: string;
  descriptionEnglish?: string;
  link: string;
  source: string;
  sourceKey: string;
  language: string;
  pubDate: string;
  category: string;
  region: 'asia' | 'europe' | 'latam';
  timeAgo: string;
}

export interface InternationalNewsResponse {
  articles: InternationalArticle[];
  total: number;
  languages: string[];
  regions: string[];
  translated: boolean;
}

// ═══════════════════════════════════════════════════════════════
// SOURCE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const KOREAN_SOURCES: InternationalSource[] = [
  {
    key: 'blockmedia',
    name: 'Block Media',
    url: 'https://www.blockmedia.co.kr',
    rss: 'https://www.blockmedia.co.kr/feed/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'tokenpost',
    name: 'TokenPost',
    url: 'https://www.tokenpost.kr',
    rss: 'https://www.tokenpost.kr/rss',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coindeskkorea',
    name: 'CoinDesk Korea',
    url: 'https://www.coindeskkorea.com',
    rss: 'https://www.coindeskkorea.com/feed/',
    language: 'ko',
    category: 'general',
    region: 'asia',
  },
];

const CHINESE_SOURCES: InternationalSource[] = [
  {
    key: '8btc',
    name: '8BTC (巴比特)',
    url: 'https://www.8btc.com',
    rss: 'https://www.8btc.com/feed',
    language: 'zh',
    category: 'general',
    region: 'asia',
    encoding: 'UTF-8',
  },
  {
    key: 'jinse',
    name: 'Jinse Finance (金色财经)',
    url: 'https://www.jinse.com',
    rss: 'https://www.jinse.com/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'odaily',
    name: 'Odaily (星球日报)',
    url: 'https://www.odaily.news',
    rss: 'https://www.odaily.news/rss',
    language: 'zh',
    category: 'general',
    region: 'asia',
  },
];

const JAPANESE_SOURCES: InternationalSource[] = [
  {
    key: 'coinpost',
    name: 'CoinPost',
    url: 'https://coinpost.jp',
    rss: 'https://coinpost.jp/rss',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'coindeskjapan',
    name: 'CoinDesk Japan',
    url: 'https://www.coindeskjapan.com',
    rss: 'https://www.coindeskjapan.com/feed/',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
  {
    key: 'cointelegraphjp',
    name: 'Cointelegraph Japan',
    url: 'https://jp.cointelegraph.com',
    rss: 'https://jp.cointelegraph.com/rss',
    language: 'ja',
    category: 'general',
    region: 'asia',
  },
];

const SPANISH_SOURCES: InternationalSource[] = [
  {
    key: 'cointelegraphes',
    name: 'Cointelegraph Español',
    url: 'https://es.cointelegraph.com',
    rss: 'https://es.cointelegraph.com/rss',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'diariobitcoin',
    name: 'Diario Bitcoin',
    url: 'https://www.diariobitcoin.com',
    rss: 'https://www.diariobitcoin.com/feed/',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
  {
    key: 'criptonoticias',
    name: 'CriptoNoticias',
    url: 'https://www.criptonoticias.com',
    rss: 'https://www.criptonoticias.com/feed/',
    language: 'es',
    category: 'general',
    region: 'latam',
  },
];

// All international sources combined
export const INTERNATIONAL_SOURCES: InternationalSource[] = [
  ...KOREAN_SOURCES,
  ...CHINESE_SOURCES,
  ...JAPANESE_SOURCES,
  ...SPANISH_SOURCES,
];

// Source lookup by language
export const SOURCES_BY_LANGUAGE: Record<string, InternationalSource[]> = {
  ko: KOREAN_SOURCES,
  zh: CHINESE_SOURCES,
  ja: JAPANESE_SOURCES,
  es: SPANISH_SOURCES,
};

// Source lookup by region
export const SOURCES_BY_REGION: Record<string, InternationalSource[]> = {
  asia: [...KOREAN_SOURCES, ...CHINESE_SOURCES, ...JAPANESE_SOURCES],
  latam: SPANISH_SOURCES,
  europe: [], // Could add European sources in the future
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a unique article ID from source and link
 */
function generateArticleId(sourceKey: string, link: string): string {
  const hash = link
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  return `${sourceKey}-${Math.abs(hash).toString(36)}`;
}

/**
 * Calculate human-readable time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Sanitize and truncate description
 */
function sanitizeDescription(raw: string): string {
  if (!raw) return '';

  const sanitized = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return sanitized.trim().slice(0, 300);
}

/**
 * Decode HTML entities in text
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

  return decoded;
}

// ═══════════════════════════════════════════════════════════════
// RSS PARSING
// ═══════════════════════════════════════════════════════════════

/**
 * Parse RSS XML to extract articles for international sources
 * Handles different encodings and RSS formats
 */
export function parseInternationalRSSFeed(
  xml: string,
  source: InternationalSource
): InternationalArticle[] {
  const articles: InternationalArticle[] = [];

  // Regex patterns for RSS item extraction
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i;
  const linkRegex = /<link>(.*?)<\/link>|<link><!\[CDATA\[(.*?)\]\]>|<link[^>]*href="([^"]*)"[^>]*\/?>/i;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/i;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>|<dc:date>(.*?)<\/dc:date>|<published>(.*?)<\/published>/i;
  const contentRegex = /<content:encoded><!\[CDATA\[([\s\S]*?)\]\]>|<content:encoded>([\s\S]*?)<\/content:encoded>/i;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(titleRegex);
    const linkMatch = itemXml.match(linkRegex);
    const descMatch = itemXml.match(descRegex);
    const pubDateMatch = itemXml.match(pubDateRegex);
    const contentMatch = itemXml.match(contentRegex);

    let title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
    const link = (linkMatch?.[1] || linkMatch?.[2] || linkMatch?.[3] || '').trim();
    let description = sanitizeDescription(
      descMatch?.[1] || descMatch?.[2] || contentMatch?.[1] || contentMatch?.[2] || ''
    );
    const pubDateStr = pubDateMatch?.[1] || pubDateMatch?.[2] || pubDateMatch?.[3] || '';

    // Decode HTML entities
    title = decodeHtmlEntities(title);
    description = decodeHtmlEntities(description);

    if (title && link) {
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      const articleId = generateArticleId(source.key, link);

      articles.push({
        id: articleId,
        title,
        description,
        link,
        source: source.name,
        sourceKey: source.key,
        language: source.language,
        pubDate: pubDate.toISOString(),
        category: source.category,
        region: source.region,
        timeAgo: getTimeAgo(pubDate),
      });
    }
  }

  return articles;
}

// ═══════════════════════════════════════════════════════════════
// SOURCE FETCHING
// ═══════════════════════════════════════════════════════════════

// Track source health
const sourceHealth: Map<string, { failures: number; lastCheck: number }> = new Map();

/**
 * Check if a source is healthy (not too many recent failures)
 */
function isSourceHealthy(sourceKey: string): boolean {
  const health = sourceHealth.get(sourceKey);
  if (!health) return true;

  // Reset failures after 1 hour
  if (Date.now() - health.lastCheck > 3600000) {
    sourceHealth.delete(sourceKey);
    return true;
  }

  // Mark as unhealthy after 3 consecutive failures
  return health.failures < 3;
}

/**
 * Record a source fetch result
 */
function recordSourceResult(sourceKey: string, success: boolean): void {
  const health = sourceHealth.get(sourceKey) || { failures: 0, lastCheck: Date.now() };

  if (success) {
    health.failures = 0;
  } else {
    health.failures++;
  }
  health.lastCheck = Date.now();

  sourceHealth.set(sourceKey, health);
}

/**
 * Fetch RSS feed from an international source with caching
 */
async function fetchInternationalFeed(source: InternationalSource): Promise<InternationalArticle[]> {
  const cacheKey = `intl-feed:${source.key}`;

  // Skip unhealthy sources
  if (!isSourceHealthy(source.key)) {
    console.warn(`Skipping unhealthy source: ${source.name}`);
    return [];
  }

  return withCache(newsCache, cacheKey, 300, async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for international sources

      const response = await fetch(source.rss, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'User-Agent': 'FreeCryptoNews/1.0 (github.com/nirholas/free-crypto-news)',
          'Accept-Charset': 'UTF-8',
        },
        signal: controller.signal,
        next: { revalidate: 300 },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch ${source.name}: ${response.status}`);
        recordSourceResult(source.key, false);
        return [];
      }

      // Get response as array buffer to handle different encodings
      const buffer = await response.arrayBuffer();
      let xml: string;

      // Try to detect encoding from content-type header or XML declaration
      const contentType = response.headers.get('content-type') || '';
      const encodingMatch = contentType.match(/charset=([^\s;]+)/i);
      let encoding = encodingMatch?.[1]?.toUpperCase() || source.encoding || 'UTF-8';

      // Common encoding mappings
      const encodingMap: Record<string, string> = {
        'GB2312': 'GBK',
        'GB18030': 'GBK',
      };
      encoding = encodingMap[encoding] || encoding;

      try {
        const decoder = new TextDecoder(encoding);
        xml = decoder.decode(buffer);
      } catch {
        // Fallback to UTF-8
        const decoder = new TextDecoder('UTF-8');
        xml = decoder.decode(buffer);
      }

      const articles = parseInternationalRSSFeed(xml, source);
      recordSourceResult(source.key, true);
      return articles;
    } catch (error) {
      console.warn(`Error fetching ${source.name}:`, error);
      recordSourceResult(source.key, false);
      return [];
    }
  });
}

/**
 * Fetch from multiple international sources in parallel
 */
async function fetchMultipleInternationalSources(
  sources: InternationalSource[]
): Promise<InternationalArticle[]> {
  const results = await Promise.allSettled(sources.map((source) => fetchInternationalFeed(source)));

  const articles: InternationalArticle[] = [];
  const seenLinks = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const article of result.value) {
        // Deduplicate by link
        if (!seenLinks.has(article.link)) {
          seenLinks.add(article.link);
          articles.push(article);
        }
      }
    }
  }

  return articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface InternationalNewsOptions {
  language?: 'ko' | 'zh' | 'ja' | 'es' | 'all';
  region?: 'asia' | 'europe' | 'latam' | 'all';
  limit?: number;
}

/**
 * Get international news articles
 */
export async function getInternationalNews(
  options: InternationalNewsOptions = {}
): Promise<InternationalNewsResponse> {
  const { language = 'all', region = 'all', limit = 20 } = options;
  const normalizedLimit = Math.min(Math.max(1, limit), 100);

  // Determine which sources to fetch from
  let sources: InternationalSource[] = [];

  if (language !== 'all') {
    sources = SOURCES_BY_LANGUAGE[language] || [];
  } else if (region !== 'all') {
    sources = SOURCES_BY_REGION[region] || [];
  } else {
    sources = INTERNATIONAL_SOURCES;
  }

  // Apply region filter if both language and region specified
  if (language !== 'all' && region !== 'all') {
    sources = sources.filter((s) => s.region === region);
  }

  const articles = await fetchMultipleInternationalSources(sources);
  const limitedArticles = articles.slice(0, normalizedLimit);

  // Collect unique languages and regions
  const uniqueLanguages = [...new Set(limitedArticles.map((a) => a.language))];
  const uniqueRegions = [...new Set(limitedArticles.map((a) => a.region))];

  return {
    articles: limitedArticles,
    total: articles.length,
    languages: uniqueLanguages,
    regions: uniqueRegions,
    translated: false, // Will be set to true by the translator
  };
}

/**
 * Get news by specific language
 */
export async function getNewsByLanguage(
  language: 'ko' | 'zh' | 'ja' | 'es',
  limit: number = 20
): Promise<InternationalNewsResponse> {
  return getInternationalNews({ language, limit });
}

/**
 * Get news by region
 */
export async function getNewsByRegion(
  region: 'asia' | 'latam',
  limit: number = 20
): Promise<InternationalNewsResponse> {
  return getInternationalNews({ region, limit });
}

/**
 * Get all available international sources with their status
 */
export async function getInternationalSources(): Promise<{
  sources: Array<InternationalSource & { status: 'active' | 'unavailable' | 'degraded' }>;
}> {
  const sourceStatuses = INTERNATIONAL_SOURCES.map((source) => {
    const health = sourceHealth.get(source.key);
    let status: 'active' | 'unavailable' | 'degraded' = 'active';

    if (health) {
      if (health.failures >= 3) {
        status = 'unavailable';
      } else if (health.failures > 0) {
        status = 'degraded';
      }
    }

    return {
      ...source,
      status,
    };
  });

  return { sources: sourceStatuses };
}

/**
 * Get source health statistics
 */
export function getSourceHealthStats(): {
  healthy: number;
  degraded: number;
  unhealthy: number;
  total: number;
} {
  let healthy = 0;
  let degraded = 0;
  let unhealthy = 0;

  for (const source of INTERNATIONAL_SOURCES) {
    const health = sourceHealth.get(source.key);
    if (!health || health.failures === 0) {
      healthy++;
    } else if (health.failures >= 3) {
      unhealthy++;
    } else {
      degraded++;
    }
  }

  return {
    healthy,
    degraded,
    unhealthy,
    total: INTERNATIONAL_SOURCES.length,
  };
}

/**
 * Clear source health data (for testing or reset)
 */
export function resetSourceHealth(): void {
  sourceHealth.clear();
}

// Export source arrays for external use
export { KOREAN_SOURCES, CHINESE_SOURCES, JAPANESE_SOURCES, SPANISH_SOURCES };
