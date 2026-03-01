/**
 * Regulatory & News APIs Integration
 * 
 * Real-time regulatory news, SEC filings, and crypto-specific news feeds.
 * Professional news sources for institutional-grade intelligence.
 * 
 * @see https://newsapi.org/
 * @see https://cryptopanic.com/developers/api/
 * @module lib/apis/news-feeds
 */

const CRYPTOPANIC_URL = 'https://cryptopanic.com/api/v1';
const NEWSAPI_URL = 'https://newsapi.org/v2';
const CRYPTOPANIC_API_KEY = process.env.CRYPTOPANIC_API_KEY || '';
const NEWSAPI_API_KEY = process.env.NEWSAPI_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: {
    id: string;
    name: string;
    domain?: string;
  };
  author: string | null;
  publishedAt: string;
  imageUrl: string | null;
  categories: string[];
  currencies?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  votes?: {
    positive: number;
    negative: number;
    important: number;
    liked: number;
    disliked: number;
    lol: number;
    toxic: number;
    saved: number;
  };
  metadata?: Record<string, unknown>;
}

export interface RegulatoryUpdate {
  id: string;
  title: string;
  summary: string;
  body: string;
  source: string;
  agency: string;
  country: string;
  type: 'legislation' | 'guidance' | 'enforcement' | 'ruling' | 'proposal' | 'speech';
  status: 'proposed' | 'pending' | 'enacted' | 'rejected' | 'under_review';
  effectiveDate?: string;
  publishedAt: string;
  url: string;
  impactedAssets: string[];
  impactLevel: 'high' | 'medium' | 'low';
}

export interface NewsFeed {
  articles: NewsArticle[];
  totalResults: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  lastUpdated: string;
}

export interface NewsFilters {
  currencies?: string[];
  categories?: string[];
  sources?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  sentiment: number; // -1 to 1
  momentum: number; // Change in mentions
  relatedArticles: NewsArticle[];
}

export interface NewsSummary {
  topStories: NewsArticle[];
  regulatoryUpdates: RegulatoryUpdate[];
  trendingTopics: TrendingTopic[];
  sentimentOverview: {
    overall: number; // -1 to 1
    bitcoin: number;
    ethereum: number;
    altcoins: number;
  };
  sourceDistribution: Record<string, number>;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from CryptoPanic API
 */
async function cryptoPanicFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  if (!CRYPTOPANIC_API_KEY) {
    console.warn('CryptoPanic API key not configured');
    return null;
  }

  try {
    const url = new URL(`${CRYPTOPANIC_URL}${endpoint}`);
    url.searchParams.append('auth_token', CRYPTOPANIC_API_KEY);
    url.searchParams.append('public', 'true');
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`CryptoPanic API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('CryptoPanic API request failed:', error);
    return null;
  }
}

/**
 * Fetch from NewsAPI
 */
async function newsApiFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
  if (!NEWSAPI_API_KEY) {
    console.warn('NewsAPI key not configured');
    return null;
  }

  try {
    const url = new URL(`${NEWSAPI_URL}${endpoint}`);
    url.searchParams.append('apiKey', NEWSAPI_API_KEY);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`NewsAPI error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('NewsAPI request failed:', error);
    return null;
  }
}

/**
 * Get crypto news from CryptoPanic
 */
export async function getCryptoNews(filters?: NewsFilters): Promise<NewsFeed> {
  const params: Record<string, string> = {};

  if (filters?.currencies?.length) {
    params.currencies = filters.currencies.join(',');
  }
  if (filters?.categories?.length) {
    params.filter = filters.categories.join(',');
  }
  if (filters?.page) {
    params.page = String(filters.page);
  }

  const data = await cryptoPanicFetch<{
    count: number;
    next: string | null;
    results: Array<{
      id: number;
      title: string;
      published_at: string;
      url: string;
      source: { domain: string; title: string };
      currencies: Array<{ code: string; title: string }>;
      votes: {
        positive: number;
        negative: number;
        important: number;
        liked: number;
        disliked: number;
        lol: number;
        toxic: number;
        saved: number;
      };
    }>;
  }>('/posts/', params);

  if (!data?.results) {
    return {
      articles: [],
      totalResults: 0,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 20,
      hasMore: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  const articles: NewsArticle[] = data.results.map(post => ({
    id: String(post.id),
    title: post.title,
    description: '',
    content: '',
    url: post.url,
    source: {
      id: post.source.domain,
      name: post.source.title,
      domain: post.source.domain,
    },
    author: null,
    publishedAt: post.published_at,
    imageUrl: null,
    categories: [],
    currencies: post.currencies?.map(c => c.code) || [],
    sentiment: determineSentiment(post.votes),
    votes: post.votes,
  }));

  return {
    articles,
    totalResults: data.count,
    page: filters?.page || 1,
    pageSize: filters?.pageSize || 20,
    hasMore: !!data.next,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Determine sentiment from CryptoPanic votes
 */
function determineSentiment(votes: { positive: number; negative: number }): 'positive' | 'negative' | 'neutral' {
  const score = votes.positive - votes.negative;
  if (score > 5) return 'positive';
  if (score < -5) return 'negative';
  return 'neutral';
}

/**
 * Get general crypto news from NewsAPI
 */
export async function getGeneralCryptoNews(options?: {
  query?: string;
  sources?: string[];
  from?: string;
  to?: string;
  sortBy?: 'publishedAt' | 'relevancy' | 'popularity';
  page?: number;
  pageSize?: number;
}): Promise<NewsFeed> {
  const params: Record<string, string> = {
    q: options?.query || 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
    language: 'en',
    sortBy: options?.sortBy || 'publishedAt',
    pageSize: String(options?.pageSize || 50),
    page: String(options?.page || 1),
  };

  if (options?.sources?.length) {
    params.sources = options.sources.join(',');
  }
  if (options?.from) {
    params.from = options.from;
  }
  if (options?.to) {
    params.to = options.to;
  }

  const data = await newsApiFetch<{
    status: string;
    totalResults: number;
    articles: Array<{
      source: { id: string | null; name: string };
      author: string | null;
      title: string;
      description: string;
      url: string;
      urlToImage: string | null;
      publishedAt: string;
      content: string;
    }>;
  }>('/everything', params);

  if (!data?.articles) {
    return {
      articles: [],
      totalResults: 0,
      page: options?.page || 1,
      pageSize: options?.pageSize || 50,
      hasMore: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  const articles: NewsArticle[] = data.articles.map((article, index) => ({
    id: `newsapi-${options?.page || 1}-${index}`,
    title: article.title,
    description: article.description || '',
    content: article.content || '',
    url: article.url,
    source: {
      id: article.source.id || article.source.name.toLowerCase().replace(/\s+/g, '-'),
      name: article.source.name,
    },
    author: article.author,
    publishedAt: article.publishedAt,
    imageUrl: article.urlToImage,
    categories: categorizeArticle(article.title, article.description || ''),
    currencies: extractMentionedCurrencies(article.title, article.description || ''),
    sentiment: 'neutral',
  }));

  return {
    articles,
    totalResults: data.totalResults,
    page: options?.page || 1,
    pageSize: options?.pageSize || 50,
    hasMore: (options?.page || 1) * (options?.pageSize || 50) < data.totalResults,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Extract mentioned cryptocurrencies from text
 */
function extractMentionedCurrencies(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const currencies: string[] = [];
  
  const cryptoMentions: Record<string, string[]> = {
    BTC: ['bitcoin', 'btc'],
    ETH: ['ethereum', 'eth', 'ether'],
    SOL: ['solana', 'sol'],
    XRP: ['ripple', 'xrp'],
    ADA: ['cardano', 'ada'],
    DOGE: ['dogecoin', 'doge'],
    BNB: ['binance coin', 'bnb'],
    AVAX: ['avalanche', 'avax'],
    MATIC: ['polygon', 'matic'],
    DOT: ['polkadot', 'dot'],
  };

  for (const [symbol, keywords] of Object.entries(cryptoMentions)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      currencies.push(symbol);
    }
  }

  return currencies;
}

/**
 * Categorize article based on content
 */
function categorizeArticle(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const categories: string[] = [];

  const categoryKeywords: Record<string, string[]> = {
    'regulation': ['sec', 'regulation', 'regulatory', 'law', 'legal', 'legislation', 'compliance', 'ban', 'approved'],
    'defi': ['defi', 'decentralized finance', 'yield', 'lending', 'borrowing', 'liquidity'],
    'nft': ['nft', 'nfts', 'non-fungible', 'collectible', 'opensea', 'blur'],
    'exchange': ['exchange', 'binance', 'coinbase', 'kraken', 'ftx', 'trading'],
    'security': ['hack', 'hacked', 'exploit', 'vulnerability', 'security', 'breach', 'stolen'],
    'market': ['price', 'market', 'bull', 'bear', 'rally', 'crash', 'surge', 'plunge'],
    'adoption': ['adoption', 'partnership', 'integration', 'launch', 'accept', 'payment'],
    'technology': ['upgrade', 'fork', 'protocol', 'layer 2', 'scalability', 'development'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      categories.push(category);
    }
  }

  return categories.length > 0 ? categories : ['general'];
}

/**
 * Get regulatory updates
 * Aggregates from multiple sources including official feeds
 */
export async function getRegulatoryUpdates(options?: {
  country?: string;
  type?: RegulatoryUpdate['type'];
  limit?: number;
}): Promise<RegulatoryUpdate[]> {
  // Get news with regulatory filter
  const regulatoryNews = await getCryptoNews({
    categories: ['regulation'],
    pageSize: options?.limit || 20,
  });

  // Map news to regulatory update format
  const updates: RegulatoryUpdate[] = regulatoryNews.articles.map((article, index) => ({
    id: `reg-${article.id}-${index}`,
    title: article.title,
    summary: article.description,
    body: article.content,
    source: article.source.name,
    agency: inferAgency(article.title, article.source.name),
    country: options?.country || inferCountry(article.title),
    type: inferRegulatoryType(article.title),
    status: 'under_review',
    publishedAt: article.publishedAt,
    url: article.url,
    impactedAssets: article.currencies || [],
    impactLevel: inferImpactLevel(article.title),
  }));

  // Filter by type if specified
  if (options?.type) {
    return updates.filter(u => u.type === options.type);
  }

  return updates;
}

function inferAgency(title: string, source: string): string {
  const text = `${title} ${source}`.toLowerCase();
  
  if (text.includes('sec')) return 'SEC';
  if (text.includes('cftc')) return 'CFTC';
  if (text.includes('fed') || text.includes('federal reserve')) return 'Federal Reserve';
  if (text.includes('treasury')) return 'Treasury Department';
  if (text.includes('fca')) return 'FCA';
  if (text.includes('mica') || text.includes('european')) return 'EU';
  
  return 'Unknown';
}

function inferCountry(title: string): string {
  const text = title.toLowerCase();
  
  if (text.includes('us') || text.includes('sec') || text.includes('cftc') || text.includes('american')) return 'US';
  if (text.includes('eu') || text.includes('european') || text.includes('mica')) return 'EU';
  if (text.includes('uk') || text.includes('fca') || text.includes('british')) return 'UK';
  if (text.includes('china') || text.includes('chinese')) return 'China';
  if (text.includes('japan') || text.includes('japanese')) return 'Japan';
  if (text.includes('korea') || text.includes('korean')) return 'South Korea';
  
  return 'Global';
}

function inferRegulatoryType(title: string): RegulatoryUpdate['type'] {
  const text = title.toLowerCase();
  
  if (text.includes('lawsuit') || text.includes('sue') || text.includes('charge') || text.includes('enforcement')) return 'enforcement';
  if (text.includes('bill') || text.includes('legislation') || text.includes('law')) return 'legislation';
  if (text.includes('guidance') || text.includes('framework')) return 'guidance';
  if (text.includes('ruling') || text.includes('court') || text.includes('judge')) return 'ruling';
  if (text.includes('proposal') || text.includes('propose') || text.includes('consider')) return 'proposal';
  if (text.includes('speech') || text.includes('says') || text.includes('warns')) return 'speech';
  
  return 'guidance';
}

function inferImpactLevel(title: string): RegulatoryUpdate['impactLevel'] {
  const text = title.toLowerCase();
  
  const highImpactKeywords = ['ban', 'lawsuit', 'criminal', 'fraud', 'shutdown', 'major', 'all crypto'];
  const lowImpactKeywords = ['consider', 'may', 'could', 'explore', 'discuss', 'minor'];
  
  if (highImpactKeywords.some(k => text.includes(k))) return 'high';
  if (lowImpactKeywords.some(k => text.includes(k))) return 'low';
  
  return 'medium';
}

/**
 * Get trending topics from news
 */
export async function getTrendingTopics(limit: number = 10): Promise<TrendingTopic[]> {
  const recentNews = await getCryptoNews({ pageSize: 100 });
  
  // Extract and count topics
  const topicCounts: Record<string, { mentions: number; sentiment: number; articles: NewsArticle[] }> = {};
  
  for (const article of recentNews.articles) {
    const topics = [...(article.currencies || []), ...article.categories];
    const sentimentValue = article.sentiment === 'positive' ? 1 : article.sentiment === 'negative' ? -1 : 0;
    
    for (const topic of topics) {
      if (!topicCounts[topic]) {
        topicCounts[topic] = { mentions: 0, sentiment: 0, articles: [] };
      }
      topicCounts[topic].mentions++;
      topicCounts[topic].sentiment += sentimentValue;
      topicCounts[topic].articles.push(article);
    }
  }
  
  // Convert to trending topics
  const trending: TrendingTopic[] = Object.entries(topicCounts)
    .map(([topic, data]) => ({
      topic,
      mentions: data.mentions,
      sentiment: data.mentions > 0 ? data.sentiment / data.mentions : 0,
      momentum: (() => {
        // Calculate momentum: compare recent article density vs older
        // Split articles by timestamp, compare first half vs second half
        if (data.articles.length < 2) return 0;
        const sorted = [...data.articles].sort((a, b) =>
          new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
        );
        const half = Math.floor(sorted.length / 2);
        const recentCount = half;
        const olderCount = sorted.length - half;
        // Momentum: ratio of recent to older, normalized to -1..1
        return olderCount > 0 ? Math.round(((recentCount / olderCount) - 1) * 100) / 100 : 0;
      })(),
      relatedArticles: data.articles.slice(0, 5),
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, limit);
  
  return trending;
}

/**
 * Get comprehensive news summary
 */
export async function getNewsSummary(): Promise<NewsSummary> {
  const [cryptoNews, generalNews, regulatoryNews, trending] = await Promise.all([
    getCryptoNews({ pageSize: 50 }),
    getGeneralCryptoNews({ pageSize: 30 }),
    getRegulatoryUpdates({ limit: 10 }),
    getTrendingTopics(10),
  ]);
  
  // Combine and deduplicate articles
  const allArticles = [...cryptoNews.articles, ...generalNews.articles];
  const uniqueArticles = allArticles.filter((article, index, self) =>
    index === self.findIndex(a => a.url === article.url)
  );
  
  // Sort by publish date
  uniqueArticles.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  
  // Calculate sentiment overview
  const calculateSentiment = (articles: NewsArticle[], currency?: string): number => {
    const relevant = currency 
      ? articles.filter(a => a.currencies?.includes(currency))
      : articles;
    
    if (relevant.length === 0) return 0;
    
    const sentimentSum = relevant.reduce((sum, a) => {
      if (a.sentiment === 'positive') return sum + 1;
      if (a.sentiment === 'negative') return sum - 1;
      return sum;
    }, 0);
    
    return sentimentSum / relevant.length;
  };
  
  // Source distribution
  const sourceDistribution: Record<string, number> = {};
  uniqueArticles.forEach(article => {
    sourceDistribution[article.source.name] = (sourceDistribution[article.source.name] || 0) + 1;
  });
  
  return {
    topStories: uniqueArticles.slice(0, 20),
    regulatoryUpdates: regulatoryNews,
    trendingTopics: trending,
    sentimentOverview: {
      overall: calculateSentiment(uniqueArticles),
      bitcoin: calculateSentiment(uniqueArticles, 'BTC'),
      ethereum: calculateSentiment(uniqueArticles, 'ETH'),
      altcoins: calculateSentiment(uniqueArticles.filter(a => 
        a.currencies?.some(c => !['BTC', 'ETH'].includes(c))
      )),
    },
    sourceDistribution,
    timestamp: new Date().toISOString(),
  };
}
