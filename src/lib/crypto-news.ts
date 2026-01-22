/**
 * Free Crypto News - RSS Feed Aggregator
 * 
 * 100% FREE - no API keys required!
 * Aggregates news from 7 major crypto sources.
 */

import sanitizeHtml from 'sanitize-html';

// RSS Feed URLs for crypto news sources (12 sources)
const RSS_SOURCES = {
  coindesk: {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'general',
  },
  theblock: {
    name: 'The Block',
    url: 'https://www.theblock.co/rss.xml',
    category: 'general',
  },
  decrypt: {
    name: 'Decrypt',
    url: 'https://decrypt.co/feed',
    category: 'general',
  },
  cointelegraph: {
    name: 'CoinTelegraph',
    url: 'https://cointelegraph.com/rss',
    category: 'general',
  },
  bitcoinmagazine: {
    name: 'Bitcoin Magazine',
    url: 'https://bitcoinmagazine.com/.rss/full/',
    category: 'bitcoin',
  },
  blockworks: {
    name: 'Blockworks',
    url: 'https://blockworks.co/feed',
    category: 'general',
  },
  defiant: {
    name: 'The Defiant',
    url: 'https://thedefiant.io/feed',
    category: 'defi',
  },
  // New sources added
  bitcoinist: {
    name: 'Bitcoinist',
    url: 'https://bitcoinist.com/feed/',
    category: 'bitcoin',
  },
  cryptoslate: {
    name: 'CryptoSlate',
    url: 'https://cryptoslate.com/feed/',
    category: 'general',
  },
  newsbtc: {
    name: 'NewsBTC',
    url: 'https://www.newsbtc.com/feed/',
    category: 'general',
  },
  cryptonews: {
    name: 'Crypto.news',
    url: 'https://crypto.news/feed/',
    category: 'general',
  },
  cryptopotato: {
    name: 'CryptoPotato',
    url: 'https://cryptopotato.com/feed/',
    category: 'general',
  },
} as const;

type SourceKey = keyof typeof RSS_SOURCES;

export interface NewsArticle {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  sourceKey: string;
  category: string;
  timeAgo: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  sources: string[];
  fetchedAt: string;
  pagination?: {
    page: number;
    perPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SourceInfo {
  key: string;
  name: string;
  url: string;
  category: string;
  status: 'active' | 'unavailable';
}

/**
 * Parse RSS XML to extract articles
 */
function parseRSSFeed(xml: string, sourceKey: string, sourceName: string, category: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i;
  const linkRegex = /<link>(.*?)<\/link>|<link><!\[CDATA\[(.*?)\]\]>/i;
  const descRegex = /<description><!\[CDATA\[([\s\S]*?)\]\]>|<description>([\s\S]*?)<\/description>/i;
  const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/i;
  
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = itemXml.match(titleRegex);
    const linkMatch = itemXml.match(linkRegex);
    const descMatch = itemXml.match(descRegex);
    const pubDateMatch = itemXml.match(pubDateRegex);
    
    const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
    const link = (linkMatch?.[1] || linkMatch?.[2] || '').trim();
    const description = sanitizeDescription(descMatch?.[1] || descMatch?.[2] || '');
    const pubDateStr = pubDateMatch?.[1] || '';
    
    if (title && link) {
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
      articles.push({
        title,
        link,
        description: description || undefined,
        pubDate: pubDate.toISOString(),
        source: sourceName,
        sourceKey,
        category,
        timeAgo: getTimeAgo(pubDate),
      });
    }
  }
  
  return articles;
}

function sanitizeDescription(raw: string): string {
  if (!raw) {
    return '';
  }

  const sanitized = sanitizeHtml(raw, {
    allowedTags: [],
    allowedAttributes: {},
  });

  return sanitized.trim().slice(0, 200);
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

import { newsCache, withCache } from './cache';

/**
 * Fetch RSS feed from a source with caching
 */
async function fetchFeed(sourceKey: SourceKey): Promise<NewsArticle[]> {
  const cacheKey = `feed:${sourceKey}`;
  
  return withCache(newsCache, cacheKey, 180, async () => {
    const source = RSS_SOURCES[sourceKey];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(source.url, {
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml',
          'User-Agent': 'FreeCryptoNews/1.0 (github.com/nirholas/free-crypto-news)',
        },
        signal: controller.signal,
        next: { revalidate: 300 },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${source.name}: ${response.status}`);
        return [];
      }
      
      const xml = await response.text();
      return parseRSSFeed(xml, sourceKey, source.name, source.category);
    } catch (error) {
      console.warn(`Error fetching ${source.name}:`, error);
      return [];
    }
  });
}

/**
 * Fetch from multiple sources in parallel with concurrency limit
 */
async function fetchMultipleSources(sourceKeys: SourceKey[]): Promise<NewsArticle[]> {
  // Fetch all sources in parallel
  const results = await Promise.allSettled(
    sourceKeys.map(key => fetchFeed(key))
  );
  
  const articles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      articles.push(...result.value);
    }
  }
  
  return articles.sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface NewsQueryOptions {
  limit?: number;
  source?: string;
  from?: Date | string;
  to?: Date | string;
  page?: number;
  perPage?: number;
}

function filterByDateRange(articles: NewsArticle[], from?: Date | string, to?: Date | string): NewsArticle[] {
  let filtered = articles.filter(a => a && a.pubDate);
  
  if (from) {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    filtered = filtered.filter(a => new Date(a.pubDate) >= fromDate);
  }
  
  if (to) {
    const toDate = typeof to === 'string' ? new Date(to) : to;
    filtered = filtered.filter(a => new Date(a.pubDate) <= toDate);
  }
  
  return filtered;
}

export async function getLatestNews(
  limit: number = 10,
  source?: string,
  options?: NewsQueryOptions
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 50);
  
  let sourceKeys: SourceKey[];
  if (source && source in RSS_SOURCES) {
    sourceKeys = [source as SourceKey];
  } else {
    sourceKeys = Object.keys(RSS_SOURCES) as SourceKey[];
  }
  
  let articles = await fetchMultipleSources(sourceKeys);
  
  // Apply date filtering
  if (options?.from || options?.to) {
    articles = filterByDateRange(articles, options.from, options.to);
  }
  
  // Handle pagination
  const page = options?.page || 1;
  const perPage = options?.perPage || normalizedLimit;
  const startIndex = (page - 1) * perPage;
  const paginatedArticles = articles.slice(startIndex, startIndex + perPage);
  
  return {
    articles: paginatedArticles,
    totalCount: articles.length,
    sources: sourceKeys.map(k => RSS_SOURCES[k].name),
    fetchedAt: new Date().toISOString(),
    ...(options?.page && {
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(articles.length / perPage),
        hasMore: startIndex + perPage < articles.length,
      }
    }),
  } as NewsResponse;
}

export async function searchNews(
  keywords: string,
  limit: number = 10
): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 30);
  const searchTerms = (keywords || '').toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
  
  // If no valid search terms, return empty result
  if (searchTerms.length === 0) {
    return {
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    };
  }
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  const matchingArticles = allArticles.filter(article => {
    if (!article || !article.title) return false;
    const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
    return searchTerms.some(term => searchText.includes(term));
  });
  
  return {
    articles: matchingArticles.slice(0, normalizedLimit),
    totalCount: matchingArticles.length,
    sources: [...new Set(matchingArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

export async function getBreakingNews(limit: number = 5): Promise<NewsResponse> {
  const normalizedLimit = Math.min(Math.max(1, limit), 20);
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  const recentArticles = allArticles.filter(article => 
    article && article.pubDate && new Date(article.pubDate) > twoHoursAgo
  );
  
  return {
    articles: recentArticles.slice(0, normalizedLimit),
    totalCount: recentArticles.length,
    sources: [...new Set(recentArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get news by category (bitcoin, ethereum, defi, nft, regulation, markets, etc.)
 */
export async function getNewsByCategory(
  category: string,
  limit: number = 30
): Promise<NewsResponse> {
  if (!category) {
    return {
      articles: [],
      totalCount: 0,
      sources: [],
      fetchedAt: new Date().toISOString(),
    };
  }
  
  const normalizedLimit = Math.min(Math.max(1, limit), 50);
  
  const allArticles = await fetchMultipleSources(Object.keys(RSS_SOURCES) as SourceKey[]);
  
  // Category keyword mappings
  const categoryKeywords: Record<string, string[]> = {
    bitcoin: ['bitcoin', 'btc', 'satoshi', 'lightning', 'halving', 'miner', 'ordinals', 'inscription', 'sats'],
    ethereum: ['ethereum', 'eth', 'vitalik', 'erc-20', 'erc-721', 'layer 2', 'l2', 'rollup', 'arbitrum', 'optimism', 'base'],
    defi: ['defi', 'yield', 'lending', 'liquidity', 'amm', 'dex', 'aave', 'uniswap', 'compound', 'curve', 'maker', 'lido', 'staking', 'vault', 'protocol', 'tvl'],
    nft: ['nft', 'non-fungible', 'opensea', 'blur', 'ordinals', 'inscription', 'collection', 'pfp', 'digital art'],
    regulation: ['regulation', 'sec', 'cftc', 'lawsuit', 'legal', 'compliance', 'tax', 'government', 'congress', 'senate', 'bill', 'law', 'policy', 'ban', 'restrict'],
    markets: ['market', 'price', 'trading', 'bull', 'bear', 'rally', 'crash', 'etf', 'futures', 'options', 'liquidation', 'volume', 'chart', 'analysis'],
    mining: ['mining', 'miner', 'hashrate', 'difficulty', 'pow', 'proof of work', 'asic', 'pool'],
    stablecoin: ['stablecoin', 'usdt', 'usdc', 'dai', 'tether', 'circle', 'peg', 'depeg'],
    exchange: ['exchange', 'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'trading', 'listing', 'delist'],
    layer2: ['layer 2', 'l2', 'rollup', 'arbitrum', 'optimism', 'base', 'zksync', 'polygon', 'scaling'],
  };
  
  const keywords = categoryKeywords[category.toLowerCase()] || [category.toLowerCase()];
  
  const filteredArticles = allArticles.filter(article => {
    if (!article || !article.title) return false;
    
    // Check source category first
    if (article.category === category.toLowerCase()) return true;
    if (category === 'bitcoin' && article.sourceKey === 'bitcoinmagazine') return true;
    if (category === 'defi' && article.sourceKey === 'defiant') return true;
    
    // Then check keywords
    const searchText = `${article.title} ${article.description || ''}`.toLowerCase();
    return keywords.some(term => searchText.includes(term));
  });
  
  return {
    articles: filteredArticles.slice(0, normalizedLimit),
    totalCount: filteredArticles.length,
    sources: [...new Set(filteredArticles.map(a => a.source))],
    fetchedAt: new Date().toISOString(),
  };
}

export async function getSources(): Promise<{ sources: SourceInfo[] }> {
  const sourceChecks = await Promise.allSettled(
    (Object.keys(RSS_SOURCES) as SourceKey[]).map(async key => {
      const source = RSS_SOURCES[key];
      try {
        const response = await fetch(source.url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'FreeCryptoNews/1.0' },
        });
        return {
          key,
          name: source.name,
          url: source.url,
          category: source.category,
          status: response.ok ? 'active' : 'unavailable',
        } as SourceInfo;
      } catch {
        return {
          key,
          name: source.name,
          url: source.url,
          category: source.category,
          status: 'unavailable',
        } as SourceInfo;
      }
    })
  );
  
  return {
    sources: sourceChecks
      .filter((r): r is PromiseFulfilledResult<SourceInfo> => r.status === 'fulfilled')
      .map(r => r.value),
  };
}

// Convenience function for DeFi-specific news
export async function getDefiNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory('defi', limit);
}

// Convenience function for Bitcoin-specific news  
export async function getBitcoinNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory('bitcoin', limit);
}

// Convenience function for Ethereum-specific news
export async function getEthereumNews(limit: number = 10): Promise<NewsResponse> {
  return getNewsByCategory('ethereum', limit);
}
