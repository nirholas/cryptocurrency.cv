/**
 * In-Memory Cache with TTL
 * 
 * Simple but effective caching layer for API responses.
 * Reduces redundant RSS fetches and AI API calls.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set a cached value with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a cached value
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict oldest entries when at capacity
   */
  private evictOldest(): void {
    let oldest: { key: string; createdAt: number } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = { key, createdAt: entry.createdAt };
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  /**
   * Destroy the cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Singleton instances for different cache purposes
export const newsCache = new MemoryCache(500);      // RSS feed cache
export const aiCache = new MemoryCache(200);        // AI response cache
export const translationCache = new MemoryCache(300); // Translation cache
export const cache = new MemoryCache(500);          // General purpose cache (for binance.ts, derivatives.ts)

/**
 * Stale cache — stores "last known good" data with a much longer TTL.
 * When upstream APIs fail, this cache is checked as a fallback.
 * Default max size is generous because entries only matter when things break.
 */
export const staleCache = new MemoryCache(2000);

/**
 * In-flight promise map for request deduplication.
 * When multiple callers request the same cache key simultaneously (e.g. cold start),
 * they share a single in-flight fetch instead of all firing separate requests.
 */
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Cache wrapper for async functions with request deduplication.
 * Concurrent callers for the same key share one fetch instead of duplicating work.
 *
 * When `serveStaleOnError` is true (default), a failed fetch will return the
 * last-known-good value from `staleCache` instead of throwing — so callers
 * never see an error as long as at least one successful fetch has occurred.
 */
export async function withCache<T>(
  cache: MemoryCache,
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
  options?: { serveStaleOnError?: boolean },
): Promise<T> {
  const serveStale = options?.serveStaleOnError ?? true;

  // Check cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Deduplicate: if another caller is already fetching this key, reuse its promise
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // Start fetch and register as in-flight
  const fetchPromise = fetchFn()
    .then((data) => {
      cache.set(key, data, ttlSeconds);
      // Also persist into stale cache with a much longer TTL (1 hour)
      staleCache.set(key, data, 3600);
      return data;
    })
    .catch((err) => {
      // Stale-on-error: return last-known-good data if available
      if (serveStale) {
        const stale = staleCache.get<T>(key);
        if (stale !== null) {
          return stale;
        }
      }
      throw err;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Generate a cache key from request parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .filter(k => params[k] !== undefined && params[k] !== null)
    .map(k => `${k}=${params[k]}`)
    .join('&');
  
  return `${prefix}:${sortedParams || 'default'}`;
}

export default MemoryCache;
