/**
 * Redis Cache Layer
 * Production-ready caching with Redis support
 * Falls back to existing memory cache if Redis unavailable
 */

import { newsCache, aiCache, translationCache, withCache as memoryWithCache } from './cache';

// Redis client placeholder - initialized lazily
let redisClient: any = null;
let redisAvailable = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<boolean> {
  if (!process.env.REDIS_URL) {
    console.log('[Redis] REDIS_URL not set, using memory cache');
    return false;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import to avoid bundling in edge runtime
      const { createClient } = await import('redis');
      
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            if (retries > 3) {
              console.error('[Redis] Max retries reached, falling back to memory');
              return new Error('Max retries');
            }
            return Math.min(retries * 200, 3000);
          },
        },
      });

      redisClient.on('error', (err: Error) => {
        console.error('[Redis] Error:', err.message);
        redisAvailable = false;
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected');
        redisAvailable = true;
      });

      redisClient.on('disconnect', () => {
        console.log('[Redis] Disconnected');
        redisAvailable = false;
      });

      await redisClient.connect();
      redisAvailable = true;
      console.log('[Redis] Initialization successful');
      return true;
    } catch (error) {
      console.error('[Redis] Init failed:', error);
      redisAvailable = false;
      return false;
    }
  })();

  return initPromise;
}

/**
 * Get value from Redis or memory cache
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    if (redisAvailable && redisClient?.isReady) {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    }
  } catch (error) {
    console.error('[Redis] Get error:', error);
  }
  
  // Fallback to memory cache
  return newsCache.get<T>(key);
}

/**
 * Set value in Redis and memory cache
 */
export async function redisSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<boolean> {
  const serialized = JSON.stringify(value);
  
  // Always set in memory cache as backup
  newsCache.set(key, value, ttlSeconds);

  try {
    if (redisAvailable && redisClient?.isReady) {
      await redisClient.setEx(key, ttlSeconds, serialized);
      return true;
    }
  } catch (error) {
    console.error('[Redis] Set error:', error);
  }

  return true; // Memory cache succeeded
}

/**
 * Delete value from both caches
 */
export async function redisDel(key: string): Promise<boolean> {
  newsCache.delete(key);

  try {
    if (redisAvailable && redisClient?.isReady) {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error('[Redis] Del error:', error);
  }

  return true;
}

/**
 * Delete keys matching pattern
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  let count = 0;

  try {
    if (redisAvailable && redisClient?.isReady) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        count = await redisClient.del(keys);
      }
    }
  } catch (error) {
    console.error('[Redis] Del pattern error:', error);
  }

  return count;
}

/**
 * Get Redis stats
 */
export async function getRedisStats(): Promise<{
  type: 'redis' | 'memory';
  connected: boolean;
  keys?: number;
  memoryUsage?: string;
  memoryCacheSize: number;
}> {
  const memoryCacheSize = newsCache.stats().size;

  if (redisAvailable && redisClient?.isReady) {
    try {
      const info = await redisClient.info('memory');
      const dbSize = await redisClient.dbSize();
      const memMatch = info.match(/used_memory_human:([^\r\n]+)/);

      return {
        type: 'redis',
        connected: true,
        keys: dbSize,
        memoryUsage: memMatch ? memMatch[1].trim() : undefined,
        memoryCacheSize,
      };
    } catch {
      // Fall through to memory stats
    }
  }

  return {
    type: 'memory',
    connected: true,
    memoryCacheSize,
  };
}

/**
 * Cache wrapper with Redis support
 */
export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await redisGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache result
  await redisSet(key, data, ttlSeconds);

  return data;
}

/**
 * Cache key builders
 */
export const redisKeys = {
  // News feeds
  newsFeed: (params?: { source?: string; category?: string; page?: number; limit?: number }) => {
    const parts = ['news'];
    if (params?.source) parts.push(`s:${params.source}`);
    if (params?.category) parts.push(`c:${params.category}`);
    if (params?.page) parts.push(`p:${params.page}`);
    if (params?.limit) parts.push(`l:${params.limit}`);
    return parts.join(':');
  },

  // Single article
  article: (id: string) => `article:${id}`,

  // Search results
  search: (query: string, page?: number) => {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, '-').slice(0, 50);
    return page ? `search:${normalized}:p${page}` : `search:${normalized}`;
  },

  // Trending/breaking
  trending: () => 'news:trending',
  breaking: () => 'news:breaking',

  // Sources list
  sources: () => 'sources:all',

  // Market data
  marketPrice: (coinId: string) => `market:price:${coinId}`,
  marketHistory: (coinId: string, days: number) => `market:history:${coinId}:${days}d`,

  // User data (use with userId prefix)
  userAlerts: (userId: string) => `user:${userId}:alerts`,
  userPortfolio: (userId: string) => `user:${userId}:portfolio`,
  userBookmarks: (userId: string) => `user:${userId}:bookmarks`,

  // AI responses
  aiSummary: (articleId: string) => `ai:summary:${articleId}`,
  aiSentiment: (articleId: string) => `ai:sentiment:${articleId}`,
  aiTranslation: (articleId: string, lang: string) => `ai:translate:${articleId}:${lang}`,
};

/**
 * TTL presets (in seconds)
 */
export const redisTTL = {
  // News content
  NEWS_FEED: 300,        // 5 minutes
  ARTICLE: 3600,         // 1 hour
  SEARCH: 600,           // 10 minutes
  TRENDING: 300,         // 5 minutes
  BREAKING: 60,          // 1 minute
  SOURCES: 3600,         // 1 hour

  // Market data
  MARKET_PRICE: 30,      // 30 seconds
  MARKET_HISTORY: 300,   // 5 minutes

  // User data
  USER_ALERTS: 300,      // 5 minutes
  USER_PORTFOLIO: 300,   // 5 minutes
  USER_BOOKMARKS: 600,   // 10 minutes

  // AI responses
  AI_SUMMARY: 86400,     // 24 hours
  AI_SENTIMENT: 86400,   // 24 hours
  AI_TRANSLATION: 86400, // 24 hours
};

// Auto-initialize in server environment
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  initRedis().catch(console.error);
}

export default {
  get: redisGet,
  set: redisSet,
  del: redisDel,
  delPattern: redisDelPattern,
  stats: getRedisStats,
  withCache: withRedisCache,
  keys: redisKeys,
  ttl: redisTTL,
  init: initRedis,
};
