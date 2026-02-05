/**
 * Archive V2 Library
 * 
 * Enhanced archive system with full enrichment support.
 * Provides query capabilities for the new JSONL-based archive format.
 */

import { NewsArticle, getLatestNews } from './crypto-news';

// ============================================================================
// SLUG UTILITIES
// ============================================================================

/**
 * Generate a URL-friendly slug from article title and date
 * Format: "bitcoin-hits-new-all-time-high-2026-01-24"
 * 
 * This creates human-readable, SEO-friendly URLs for archived articles.
 */
export function generateArticleSlug(title: string, date?: string): string {
  // Clean and slugify the title
  let slug = title
    .toLowerCase()
    .replace(/['']/g, '')                    // Remove apostrophes
    .replace(/[^a-z0-9\s-]/g, '')           // Remove special chars
    .replace(/\s+/g, '-')                    // Spaces to dashes
    .replace(/-+/g, '-')                     // Collapse multiple dashes
    .replace(/^-|-$/g, '')                   // Trim leading/trailing dashes
    .slice(0, 60);                           // Limit length
  
  // Remove trailing dash if we cut mid-word
  slug = slug.replace(/-$/, '');
  
  // Add date suffix for uniqueness (YYYY-MM-DD)
  if (date) {
    const dateStr = new Date(date).toISOString().split('T')[0];
    slug = `${slug}-${dateStr}`;
  }
  
  return slug || 'untitled';
}

/**
 * Parse a slug to extract possible date suffix
 * Returns { baseSlug, date } if date found, otherwise just { baseSlug }
 */
export function parseArticleSlug(slug: string): { baseSlug: string; date?: string } {
  // Match date pattern at end: -YYYY-MM-DD
  const dateMatch = slug.match(/^(.+)-(\d{4}-\d{2}-\d{2})$/);
  if (dateMatch) {
    return { baseSlug: dateMatch[1], date: dateMatch[2] };
  }
  return { baseSlug: slug };
}

// Next.js fetch extension type
type NextFetchRequestConfig = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

// ============================================================================
// TYPES
// ============================================================================

export interface EnrichedArticle {
  id: string;
  slug?: string;              // SEO-friendly URL slug (e.g., "bitcoin-hits-ath-2026-01-24")
  schema_version: string;
  title: string;
  link: string;
  canonical_link: string;
  description: string;
  source: string;
  source_key: string;
  category: string;
  pub_date: string | null;
  first_seen: string;
  last_seen: string;
  fetch_count: number;
  tickers: string[];
  entities: {
    people: string[];
    companies: string[];
    protocols: string[];
  };
  tags: string[];
  sentiment: {
    score: number;
    label: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    confidence: number;
  };
  market_context: {
    btc_price: number | null;
    eth_price: number | null;
    sol_price?: number | null;
    total_market_cap?: number | null;
    btc_dominance?: number | null;
    fear_greed_index: number | null;
  } | null;
  content_hash: string;
  meta: {
    word_count: number;
    has_numbers: boolean;
    is_breaking: boolean;
    is_opinion: boolean;
  };
}

export interface ArchiveSnapshot {
  timestamp: string;
  hour: number;
  article_count: number;
  top_articles: string[];
  top_tickers: { ticker: string; mention_count: number }[];
  source_counts: Record<string, number>;
  market_state: {
    btc_price: number | null;
    eth_price: number | null;
    fear_greed_index: number | null;
  } | null;
}

export interface ArchiveV2Stats {
  version: string;
  total_articles: number;
  total_fetches: number;
  first_fetch: string | null;
  last_fetch: string | null;
  sources: Record<string, number>;
  tickers: Record<string, number>;
  daily_counts: Record<string, number>;
}

/**
 * Get all archived article slugs for static page generation
 * Returns slugs from KV archive for SEO
 */
export async function getAllArchivedArticleIds(): Promise<string[]> {
  // Skip during Vercel build to avoid loading large JSON files
  if (process.env.VERCEL_ENV || process.env.CI) {
    return [];
  }
  try {
    const { getAllArticleSlugs } = await import('./archive-service');
    return await getAllArticleSlugs(5000);
  } catch {
    return [];
  }
}

export interface ArchiveV2Index {
  bySource: Record<string, string[]>;
  byTicker: Record<string, string[]>;
  byDate: Record<string, string[]>;
}

export interface ArchiveV2QueryOptions {
  startDate?: string;
  endDate?: string;
  source?: string;
  ticker?: string;
  search?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tags?: string[];
  limit?: number;
  offset?: number;
}

// ============================================================================
// GITHUB RAW CONTENT URLS
// ============================================================================

const GITHUB_BASE = 'https://raw.githubusercontent.com/nirholas/free-crypto-news/main/archive';
// Note: Files moved from archive/v2/* to archive/* - no longer need V2 prefix

// ============================================================================
// V2 ARCHIVE FUNCTIONS
// ============================================================================

/**
 * Fetch V2 archive stats
 */
export async function getArchiveV2Stats(): Promise<ArchiveV2Stats | null> {
  try {
    const response = await fetch(`${GITHUB_BASE}/meta/stats.json`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    } as NextFetchRequestConfig);
    
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetch V2 archive index (for fast lookups)
 */
export async function getArchiveV2Index(type: 'by-source' | 'by-ticker' | 'by-date'): Promise<Record<string, string[]> | null> {
  try {
    const response = await fetch(`${GITHUB_BASE}/indexes/${type}.json`, {
      next: { revalidate: 300 }
    } as NextFetchRequestConfig);
    
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Parse JSONL content into articles
 */
function parseJsonl(content: string): EnrichedArticle[] {
  const articles: EnrichedArticle[] = [];
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      articles.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }
  
  return articles;
}

/**
 * Fetch articles for a specific month
 */
export async function getArchiveV2Month(yearMonth: string): Promise<EnrichedArticle[]> {
  try {
    const response = await fetch(`${GITHUB_BASE}/articles/${yearMonth}.jsonl`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    } as NextFetchRequestConfig);
    
    if (!response.ok) return [];
    
    const content = await response.text();
    return parseJsonl(content);
  } catch {
    return [];
  }
}

/**
 * Fetch hourly snapshot
 */
export async function getArchiveV2Snapshot(
  year: string,
  month: string,
  day: string,
  hour: string
): Promise<ArchiveSnapshot | null> {
  try {
    const response = await fetch(
      `${GITHUB_BASE}/snapshots/${year}/${month}/${day}/${hour}.json`,
      { next: { revalidate: 3600 } } as NextFetchRequestConfig
    );
    
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Query V2 archive with filters
 */
export async function queryArchiveV2(options: ArchiveV2QueryOptions): Promise<{
  articles: EnrichedArticle[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> {
  const {
    startDate,
    endDate,
    source,
    ticker,
    search,
    sentiment,
    tags,
    limit = 50,
    offset = 0
  } = options;

  // Determine which months to fetch
  const now = new Date();
  const startMonth = startDate 
    ? startDate.substring(0, 7) 
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const endMonth = endDate 
    ? endDate.substring(0, 7) 
    : startMonth;

  // Generate list of months to fetch
  const months: string[] = [];
  let current = startMonth;
  while (current <= endMonth) {
    months.push(current);
    // Increment month
    const [year, month] = current.split('-').map(Number);
    if (month === 12) {
      current = `${year + 1}-01`;
    } else {
      current = `${year}-${String(month + 1).padStart(2, '0')}`;
    }
  }

  // Limit to 6 months to avoid too many requests
  const monthsToFetch = months.slice(-6);

  // Fetch articles from each month
  const articlePromises = monthsToFetch.map(m => getArchiveV2Month(m));
  const articleArrays = await Promise.all(articlePromises);
  
  let allArticles = articleArrays.flat();

  // Apply filters
  if (startDate) {
    allArticles = allArticles.filter(a => 
      (a.first_seen >= startDate) || (a.pub_date && a.pub_date >= startDate)
    );
  }

  if (endDate) {
    const endDatePlusOne = endDate + 'T23:59:59.999Z';
    allArticles = allArticles.filter(a => 
      (a.first_seen <= endDatePlusOne) || (a.pub_date && a.pub_date <= endDatePlusOne)
    );
  }

  if (source) {
    const sourceLower = source.toLowerCase();
    allArticles = allArticles.filter(a => 
      a.source.toLowerCase().includes(sourceLower) ||
      a.source_key.toLowerCase().includes(sourceLower)
    );
  }

  if (ticker) {
    const tickerUpper = ticker.toUpperCase();
    allArticles = allArticles.filter(a => 
      a.tickers.includes(tickerUpper)
    );
  }

  if (search) {
    const searchLower = search.toLowerCase();
    allArticles = allArticles.filter(a =>
      a.title.toLowerCase().includes(searchLower) ||
      a.description?.toLowerCase().includes(searchLower)
    );
  }

  if (sentiment) {
    allArticles = allArticles.filter(a => {
      if (sentiment === 'positive') {
        return a.sentiment.label === 'positive' || a.sentiment.label === 'very_positive';
      } else if (sentiment === 'negative') {
        return a.sentiment.label === 'negative' || a.sentiment.label === 'very_negative';
      } else {
        return a.sentiment.label === 'neutral';
      }
    });
  }

  if (tags && tags.length > 0) {
    allArticles = allArticles.filter(a =>
      tags.some(tag => a.tags.includes(tag))
    );
  }

  // Sort by first_seen descending
  allArticles.sort((a, b) => 
    new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime()
  );

  const total = allArticles.length;
  const paginatedArticles = allArticles.slice(offset, offset + limit);

  return {
    articles: paginatedArticles,
    total,
    pagination: {
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
}

/**
 * Get articles by ticker
 */
export async function getArticlesByTicker(
  ticker: string, 
  limit = 50
): Promise<EnrichedArticle[]> {
  const result = await queryArchiveV2({
    ticker: ticker.toUpperCase(),
    limit
  });
  return result.articles;
}

/**
 * Get articles by source
 */
export async function getArticlesBySource(
  source: string, 
  limit = 50
): Promise<EnrichedArticle[]> {
  const result = await queryArchiveV2({
    source,
    limit
  });
  return result.articles;
}

/**
 * Get trending tickers from recent snapshots
 */
export async function getTrendingTickers(hours = 24): Promise<{ ticker: string; count: number }[]> {
  const now = new Date();
  const tickerCounts: Record<string, number> = {};
  
  // Fetch recent snapshots
  for (let i = 0; i < Math.min(hours, 24); i++) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hour = String(date.getUTCHours()).padStart(2, '0');
    
    const snapshot = await getArchiveV2Snapshot(year, month, day, hour);
    
    if (snapshot?.top_tickers) {
      for (const { ticker, mention_count } of snapshot.top_tickers) {
        tickerCounts[ticker] = (tickerCounts[ticker] || 0) + mention_count;
      }
    }
  }
  
  return Object.entries(tickerCounts)
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

/**
 * Get market context history
 */
export async function getMarketHistory(yearMonth: string): Promise<Array<{
  timestamp: string;
  btc_price: number | null;
  eth_price: number | null;
  fear_greed_index: number | null;
}>> {
  try {
    const response = await fetch(`${GITHUB_BASE}/market/${yearMonth}.jsonl`, {
      next: { revalidate: 3600 }
    } as NextFetchRequestConfig);
    
    if (!response.ok) return [];
    
    const content = await response.text();
    const lines = content.trim().split('\n').filter(l => l.trim());
    
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Convert EnrichedArticle to NewsArticle for backwards compatibility
 */
export function toNewsArticle(enriched: EnrichedArticle): NewsArticle {
  return {
    title: enriched.title,
    link: enriched.link,
    description: enriched.description,
    pubDate: enriched.pub_date || enriched.first_seen,
    source: enriched.source,
    sourceKey: enriched.source_key,
    category: enriched.category as 'general' | 'bitcoin' | 'defi',
    timeAgo: getTimeAgo(enriched.first_seen)
  };
}

/**
 * Generate article ID from URL (consistent hash)
 * @deprecated Use generateArticleSlug for new articles
 */
export function generateArticleId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
}

/**
 * Check if an identifier is a legacy hash ID (hex string) or a slug
 */
export function isLegacyId(identifier: string): boolean {
  // Legacy IDs are 16-char hex strings
  return /^[0-9a-f]{16}$/i.test(identifier);
}

/**
 * Get a single article by ID or slug
 * Uses KV archive as primary source, live RSS as fallback for new articles
 */
export async function getArticleById(idOrSlug: string): Promise<EnrichedArticle | null> {
  try {
    // Primary: KV-based archive service
    const { getArticleById: kvGetById, getArticleBySlug: kvGetBySlug } = await import('./archive-service');
    
    const isLegacy = isLegacyId(idOrSlug);
    const kvArticle = isLegacy 
      ? await kvGetById(idOrSlug)
      : await kvGetBySlug(idOrSlug);
    
    if (kvArticle) {
      // Convert ArchivedArticle to EnrichedArticle format
      return {
        id: kvArticle.id,
        slug: kvArticle.slug,
        schema_version: '2.0.0',
        title: kvArticle.title,
        link: kvArticle.link,
        canonical_link: kvArticle.canonicalLink,
        description: kvArticle.description,
        source: kvArticle.source,
        source_key: kvArticle.sourceKey,
        category: kvArticle.category,
        pub_date: kvArticle.pubDate,
        first_seen: kvArticle.archivedAt,
        last_seen: kvArticle.lastSeen,
        fetch_count: kvArticle.fetchCount,
        tickers: kvArticle.tickers,
        entities: kvArticle.entities,
        tags: kvArticle.tags,
        sentiment: kvArticle.sentiment,
        market_context: kvArticle.marketContext ? {
          btc_price: kvArticle.marketContext.btcPrice,
          eth_price: kvArticle.marketContext.ethPrice,
          fear_greed_index: kvArticle.marketContext.fearGreedIndex,
        } : null,
        content_hash: kvArticle.contentHash,
        meta: {
          word_count: kvArticle.wordCount,
          has_numbers: /\d/.test(kvArticle.title),
          is_breaking: kvArticle.isBreaking,
          is_opinion: kvArticle.isOpinion,
        },
      };
    }
    
    // Fallback for very new articles: check live RSS
    const isLegacyId2 = isLegacyId(idOrSlug);
    const liveNews = await getLatestNews(100);
    const liveArticle = liveNews.articles.find(a => {
      if (isLegacyId2) {
        return generateArticleId(a.link) === idOrSlug;
      }
      const liveSlug = generateArticleSlug(a.title, a.pubDate);
      return liveSlug === idOrSlug;
    });
    
    if (liveArticle) {
      return newsArticleToEnriched(liveArticle);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a NewsArticle from live RSS to EnrichedArticle format
 */
function newsArticleToEnriched(article: NewsArticle): EnrichedArticle {
  return {
    id: generateArticleId(article.link),
    slug: generateArticleSlug(article.title, article.pubDate),
    schema_version: '2.0',
    title: article.title,
    link: article.link,
    canonical_link: article.link,
    description: article.description || '',
    source: article.source,
    source_key: article.sourceKey,
    category: article.category,
    pub_date: article.pubDate,
    first_seen: article.pubDate,
    last_seen: article.pubDate,
    fetch_count: 1,
    tickers: extractTickers(article.title + ' ' + (article.description || '')),
    entities: {
      people: [],
      companies: [],
      protocols: [],
    },
    tags: [],
    sentiment: {
      score: 0,
      label: 'neutral',
      confidence: 0.5,
    },
    market_context: null,
    content_hash: generateArticleId(article.link),
    meta: {
      word_count: (article.title + ' ' + (article.description || '')).split(/\s+/).length,
      has_numbers: /\d/.test(article.title),
      is_breaking: article.title.toLowerCase().includes('breaking'),
      is_opinion: false,
    },
  };
}

/**
 * Extract cryptocurrency tickers from text
 */
function extractTickers(text: string): string[] {
  const commonTickers = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'LTC', 'BCH', 'NEAR', 'APT', 'ARB', 'OP', 'SUI', 'SEI'];
  const found: string[] = [];
  const upperText = text.toUpperCase();
  
  for (const ticker of commonTickers) {
    // Match ticker as a word boundary
    const regex = new RegExp(`\\b${ticker}\\b`);
    if (regex.test(upperText)) {
      found.push(ticker);
    }
  }
  
  // Also check for full names
  const nameMap: Record<string, string> = {
    'BITCOIN': 'BTC',
    'ETHEREUM': 'ETH',
    'SOLANA': 'SOL',
    'RIPPLE': 'XRP',
    'CARDANO': 'ADA',
    'DOGECOIN': 'DOGE',
    'POLKADOT': 'DOT',
    'AVALANCHE': 'AVAX',
    'POLYGON': 'MATIC',
    'CHAINLINK': 'LINK',
    'UNISWAP': 'UNI',
  };
  
  for (const [name, ticker] of Object.entries(nameMap)) {
    if (upperText.includes(name) && !found.includes(ticker)) {
      found.push(ticker);
    }
  }
  
  return found;
}

/**
 * Get a single article by URL
 */
export async function getArticleByUrl(url: string): Promise<EnrichedArticle | null> {
  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const articles = await getArchiveV2Month(yearMonth);
    
    const article = articles.find(a => a.link === url || a.canonical_link === url);
    if (article) return article;
    
    // Try previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
    const prevArticles = await getArchiveV2Month(prevYearMonth);
    
    return prevArticles.find(a => a.link === url || a.canonical_link === url) || null;
  } catch {
    return null;
  }
}

/**
 * Get related articles based on tickers, entities, and tags
 */
export async function getRelatedArticles(
  article: EnrichedArticle,
  limit: number = 5
): Promise<EnrichedArticle[]> {
  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const allArticles = await getArchiveV2Month(yearMonth);
    
    // Score articles by relevance
    const scored = allArticles
      .filter(a => a.id !== article.id)
      .map(a => {
        let score = 0;
        
        // Ticker overlap (highest weight)
        const tickerOverlap = a.tickers.filter(t => article.tickers.includes(t)).length;
        score += tickerOverlap * 5;
        
        // Company overlap
        const companyOverlap = a.entities.companies.filter(c => 
          article.entities.companies.includes(c)
        ).length;
        score += companyOverlap * 3;
        
        // Protocol overlap
        const protocolOverlap = a.entities.protocols.filter(p => 
          article.entities.protocols.includes(p)
        ).length;
        score += protocolOverlap * 3;
        
        // People overlap
        const peopleOverlap = a.entities.people.filter(p => 
          article.entities.people.includes(p)
        ).length;
        score += peopleOverlap * 4;
        
        // Tag overlap
        const tagOverlap = a.tags.filter(t => article.tags.includes(t)).length;
        score += tagOverlap * 2;
        
        // Same source small bonus
        if (a.source === article.source) score += 1;
        
        // Recency bonus (within 48h)
        const hoursDiff = Math.abs(
          new Date(article.pub_date || article.first_seen).getTime() - 
          new Date(a.pub_date || a.first_seen).getTime()
        ) / (1000 * 60 * 60);
        if (hoursDiff < 48) score += 2;
        
        return { article: a, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.article);
    
    return scored;
  } catch {
    return [];
  }
}

/**
 * Helper to generate timeAgo string
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'just now';
}

// ============================================================================
// RE-EXPORTS for backwards compatibility
// ============================================================================

// Note: Import from './archive' directly for v1 functions
