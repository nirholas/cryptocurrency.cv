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
 * Redis Cache Layer
 * Production-ready caching with Redis support
 * Falls back to existing memory cache if Redis unavailable
 */

import { newsCache, aiCache, translationCache, withCache as memoryWithCache } from './cache';
import { cacheLogger } from '@/lib/logger';

import type { RedisClientType } from 'redis';

// Redis client placeholder - initialized lazily
let _redisClient: RedisClientType | null = null;
let redisAvailable = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<boolean> {
  if (!process.env.REDIS_URL) {
    cacheLogger.info('REDIS_URL not set, using memory cache');
    return false;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import to avoid bundling in edge runtime
      const { createClient } = await import('redis');

      _redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          // Keep-alive prevents idle-timeout disconnects behind load balancers
          keepAlive: true,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              cacheLogger.error('Max retries reached, falling back to memory');
              return new Error('Max retries');
            }
            // Exponential back-off with jitter: 200, 400, 800 … capped at 5 s
            return Math.min(retries * 200 + Math.random() * 100, 5000);
          },
        },
        // Connection pool — allow up to MAX_POOL_SIZE concurrent commands
        // before queueing; prevents connection storms at 1 M+ users
        commandsQueueMaxLength: parseInt(process.env.REDIS_QUEUE_MAX ?? '2000', 10),
      });

      _redisClient.on('error', (err: Error) => {
        cacheLogger.error({ err }, 'Redis connection error');
        redisAvailable = false;
      });

      _redisClient.on('connect', () => {
        cacheLogger.info('Redis connected');
        redisAvailable = true;
      });

      _redisClient.on('disconnect', () => {
        cacheLogger.info('Redis disconnected');
        redisAvailable = false;
      });

      await _redisClient.connect();
      redisAvailable = true;
      cacheLogger.info('Redis initialization successful');
      return true;
    } catch (error) {
      cacheLogger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        'Redis init failed',
      );
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
    if (redisAvailable && _redisClient?.isReady) {
      const value = await _redisClient.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
    }
  } catch (error) {
    cacheLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Redis get error',
    );
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
  ttlSeconds: number = 300,
): Promise<boolean> {
  const serialized = JSON.stringify(value);

  // Always set in memory cache as backup
  newsCache.set(key, value, ttlSeconds);

  try {
    if (redisAvailable && _redisClient?.isReady) {
      await _redisClient.setEx(key, ttlSeconds, serialized);
      return true;
    }
  } catch (error) {
    cacheLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Redis set error',
    );
  }

  return true; // Memory cache succeeded
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && _redisClient?.isReady;
}

/**
 * Get Redis client (for advanced operations)
 */
export function getRedisClient(): any {
  return _redisClient;
}

// Alias for backward compatibility
export { getRedisClient as redisClient };

/**
 * Delete value from both caches
 */
export async function redisDel(key: string): Promise<boolean> {
  newsCache.delete(key);

  try {
    if (redisAvailable && _redisClient?.isReady) {
      await _redisClient.del(key);
    }
  } catch (error) {
    cacheLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Redis del error',
    );
  }

  return true;
}

/**
 * Delete keys matching pattern
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  let count = 0;

  try {
    if (redisAvailable && _redisClient?.isReady) {
      const keys = await _redisClient.keys(pattern);
      if (keys.length > 0) {
        count = await _redisClient.del(keys);
      }
    }
  } catch (error) {
    cacheLogger.error(
      { err: error instanceof Error ? error : new Error(String(error)) },
      'Redis del pattern error',
    );
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

  if (redisAvailable && _redisClient?.isReady) {
    try {
      const info = await _redisClient.info('memory');
      const dbSize = await _redisClient.dbSize();
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
  fetchFn: () => Promise<T>,
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
  NEWS_FEED: 300, // 5 minutes
  ARTICLE: 3600, // 1 hour
  SEARCH: 600, // 10 minutes
  TRENDING: 300, // 5 minutes
  BREAKING: 60, // 1 minute
  SOURCES: 3600, // 1 hour

  // Market data
  MARKET_PRICE: 30, // 30 seconds
  MARKET_HISTORY: 300, // 5 minutes

  // User data
  USER_ALERTS: 300, // 5 minutes
  USER_PORTFOLIO: 300, // 5 minutes
  USER_BOOKMARKS: 600, // 10 minutes

  // AI responses
  AI_SUMMARY: 86400, // 24 hours
  AI_SENTIMENT: 86400, // 24 hours
  AI_TRANSLATION: 86400, // 24 hours
};

// Auto-initialize in server environment
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  initRedis().catch((err) =>
    logger.error('[Redis] Auto-init failed', err instanceof Error ? err : undefined),
  );
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
