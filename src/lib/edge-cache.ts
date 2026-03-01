/**
 * Edge Cache Layer — Multi-tier caching for 1M+ users at the edge
 *
 * Architecture:
 * ```
 * Request → Edge Cache (CDN) → In-Memory L1 → SWR L2 → Provider Chain → External API
 * ```
 *
 * Tiers:
 * - **L0 (CDN/Edge)**: Cache-Control + Stale-While-Revalidate headers for Vercel/Cloudflare
 * - **L1 (In-Memory)**: LRU cache with automatic eviction (fast, per-instance)
 * - **L2 (SWR)**: Stale-while-revalidate pattern for background refresh
 *
 * Designed for:
 * - 1M+ concurrent users
 * - Sub-millisecond L1 hits
 * - Zero-downtime cache invalidation
 * - Cache warming for popular endpoints
 * - Automatic deduplication of concurrent requests
 *
 * @module edge-cache
 */

// =============================================================================
// TYPES
// =============================================================================

export interface CacheConfig {
  /** L1 in-memory TTL in seconds */
  l1TtlSeconds: number;
  /** L2 stale-while-revalidate window in seconds */
  swrSeconds: number;
  /** CDN Cache-Control max-age in seconds */
  cdnMaxAge: number;
  /** CDN stale-while-revalidate in seconds */
  cdnSwr: number;
  /** Maximum L1 cache entries */
  maxEntries: number;
  /** Whether to deduplicate concurrent identical requests */
  dedup: boolean;
}

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  staleAt: number;
  hitCount: number;
  size: number;
}

export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  dedupSaved: number;
  totalSizeBytes: number;
}

// =============================================================================
// CACHE PROFILES — Pre-configured for common data types
// =============================================================================

export const CACHE_PROFILES: Record<string, CacheConfig> = {
  // Real-time data (prices, order book) — very short cache
  realtime: {
    l1TtlSeconds: 5,
    swrSeconds: 10,
    cdnMaxAge: 2,
    cdnSwr: 8,
    maxEntries: 1_000,
    dedup: true,
  },

  // Market data (market cap, volume) — short cache
  market: {
    l1TtlSeconds: 30,
    swrSeconds: 60,
    cdnMaxAge: 10,
    cdnSwr: 50,
    maxEntries: 5_000,
    dedup: true,
  },

  // News, articles — medium cache
  content: {
    l1TtlSeconds: 120,
    swrSeconds: 300,
    cdnMaxAge: 60,
    cdnSwr: 240,
    maxEntries: 10_000,
    dedup: true,
  },

  // Static reference data (categories, tags) — long cache
  reference: {
    l1TtlSeconds: 3600,
    swrSeconds: 7200,
    cdnMaxAge: 1800,
    cdnSwr: 5400,
    maxEntries: 1_000,
    dedup: false,
  },

  // Historical data — very long cache
  historical: {
    l1TtlSeconds: 86_400,
    swrSeconds: 172_800,
    cdnMaxAge: 43_200,
    cdnSwr: 86_400,
    maxEntries: 500,
    dedup: false,
  },

  // Fear & Greed, TVL — medium-short cache
  aggregated: {
    l1TtlSeconds: 60,
    swrSeconds: 180,
    cdnMaxAge: 30,
    cdnSwr: 150,
    maxEntries: 2_000,
    dedup: true,
  },
};

// =============================================================================
// ENDPOINT → PROFILE MAPPING
// =============================================================================

const ENDPOINT_PROFILES: Record<string, string> = {
  '/api/v1/coins': 'market',
  '/api/v1/market-data': 'market',
  '/api/v1/global': 'market',
  '/api/prices': 'realtime',
  '/api/trading/orderbook': 'realtime',
  '/api/v1/news': 'content',
  '/api/v1/trending': 'content',
  '/api/v1/search': 'content',
  '/api/rss': 'content',
  '/api/v1/fear-greed': 'aggregated',
  '/api/v1/defi': 'aggregated',
  '/api/yields': 'aggregated',
  '/api/v1/whale-alerts': 'market',
  '/api/v1/historical': 'historical',
  '/api/v1/categories': 'reference',
  '/api/v1/tags': 'reference',
  '/api/v1/sources': 'reference',
  '/api/v1/exchanges': 'market',
  '/api/v1/assets': 'market',
  '/api/v1/sentiment': 'aggregated',
};

// =============================================================================
// LRU CACHE — L1 In-Memory with LRU eviction
// =============================================================================

class LRUCache<T> {
  private _cache = new Map<string, CacheEntry<T>>();
  private _maxEntries: number;
  private _stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    dedupSaved: 0,
  };

  constructor(maxEntries: number = 10_000) {
    this._maxEntries = maxEntries;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this._cache.get(key);
    if (!entry) {
      this._stats.misses++;
      return null;
    }

    const now = Date.now();

    // Expired and past SWR window — remove
    if (now > entry.staleAt) {
      this._cache.delete(key);
      this._stats.misses++;
      return null;
    }

    // Move to end (most recently used)
    this._cache.delete(key);
    this._cache.set(key, entry);
    entry.hitCount++;
    this._stats.hits++;

    return entry;
  }

  set(key: string, data: T, config: CacheConfig): void {
    // Evict if at capacity
    if (this._cache.size >= this._maxEntries) {
      const firstKey = this._cache.keys().next().value;
      if (firstKey) {
        this._cache.delete(firstKey);
        this._stats.evictions++;
      }
    }

    const now = Date.now();
    this._cache.set(key, {
      data,
      createdAt: now,
      expiresAt: now + config.l1TtlSeconds * 1000,
      staleAt: now + (config.l1TtlSeconds + config.swrSeconds) * 1000,
      hitCount: 0,
      size: estimateSize(data),
    });
  }

  has(key: string): boolean {
    const entry = this._cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.staleAt;
  }

  delete(key: string): boolean {
    return this._cache.delete(key);
  }

  clear(): void {
    this._cache.clear();
  }

  get stats(): CacheStats {
    const total = this._stats.hits + this._stats.misses;
    let totalSize = 0;
    for (const entry of this._cache.values()) {
      totalSize += entry.size;
    }
    return {
      entries: this._cache.size,
      hits: this._stats.hits,
      misses: this._stats.misses,
      hitRate: total > 0 ? this._stats.hits / total : 0,
      evictions: this._stats.evictions,
      dedupSaved: this._stats.dedupSaved,
      totalSizeBytes: totalSize,
    };
  }

  incrementDedupSaved(): void {
    this._stats.dedupSaved++;
  }
}

function estimateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
  } catch {
    return 1024; // Fallback estimate
  }
}

// =============================================================================
// REQUEST DEDUPLICATION
// =============================================================================

class RequestDeduplicator {
  private _inflight = new Map<string, Promise<unknown>>();

  /**
   * Deduplicate concurrent identical requests.
   * If a request with the same key is already in flight, return the same promise.
   */
  async dedup<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this._inflight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this._inflight.delete(key);
    });

    this._inflight.set(key, promise);
    return promise;
  }

  get inflightCount(): number {
    return this._inflight.size;
  }
}

// =============================================================================
// EDGE CACHE — Main API
// =============================================================================

export class EdgeCache {
  private _l1: LRUCache<unknown>;
  private _dedup = new RequestDeduplicator();
  private _warmingQueue: Array<{ key: string; fetcher: () => Promise<unknown>; profile: string }> = [];
  private _warmingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(maxEntries: number = 50_000) {
    this._l1 = new LRUCache<unknown>(maxEntries);
  }

  /**
   * Get data from cache or fetch it.
   *
   * @param key - Unique cache key (usually request URL + params hash)
   * @param fetcher - Function to call on cache miss
   * @param profile - Cache profile name (from CACHE_PROFILES)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    profile: string = 'market',
  ): Promise<{ data: T; cached: boolean; stale: boolean }> {
    const config = CACHE_PROFILES[profile] ?? CACHE_PROFILES.market;

    // L1 check
    const cached = this._l1.get(key) as CacheEntry<T> | null;
    if (cached) {
      const now = Date.now();
      const isStale = now > cached.expiresAt;

      if (isStale) {
        // SWR: serve stale and refresh in background
        this._refreshInBackground(key, fetcher, config);
        return { data: cached.data, cached: true, stale: true };
      }

      return { data: cached.data, cached: true, stale: false };
    }

    // Cache miss — fetch with deduplication
    if (config.dedup) {
      const data = await this._dedup.dedup(key, fetcher);
      this._l1.set(key, data, config);
      return { data: data as T, cached: false, stale: false };
    }

    const data = await fetcher();
    this._l1.set(key, data, config);
    return { data, cached: false, stale: false };
  }

  /**
   * Generate Cache-Control headers for CDN/edge caching.
   */
  getCacheHeaders(profile: string = 'market'): Record<string, string> {
    const config = CACHE_PROFILES[profile] ?? CACHE_PROFILES.market;
    return {
      'Cache-Control': `public, s-maxage=${config.cdnMaxAge}, stale-while-revalidate=${config.cdnSwr}`,
      'CDN-Cache-Control': `public, max-age=${config.cdnMaxAge}`,
      'Vercel-CDN-Cache-Control': `public, max-age=${config.cdnMaxAge}`,
    };
  }

  /**
   * Get the cache profile for an endpoint.
   */
  getProfileForEndpoint(pathname: string): string {
    // Exact match
    if (ENDPOINT_PROFILES[pathname]) return ENDPOINT_PROFILES[pathname];

    // Prefix match
    for (const [pattern, profile] of Object.entries(ENDPOINT_PROFILES)) {
      if (pathname.startsWith(pattern)) return profile;
    }

    return 'market'; // Default
  }

  /**
   * Invalidate a specific cache key.
   */
  invalidate(key: string): void {
    this._l1.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern.
   */
  invalidatePattern(pattern: string): number {
    let count = 0;

    // Wildcard: clear everything
    if (pattern === '*') {
      const stats = this._l1.stats;
      this._l1.clear();
      return stats.entries;
    }

    // Convert glob-like pattern to regex
    // Supports: * (any chars), ? (single char)
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except * and ?
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexStr}$`);

    // Collect matching keys first to avoid mutation during iteration
    const keysToDelete: string[] = [];
    for (const key of this._l1.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    // Delete matching keys
    for (const key of keysToDelete) {
      if (this._l1.delete(key)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Register an endpoint for cache warming.
   * The warmer periodically refreshes these in the background.
   */
  registerWarmTarget(key: string, fetcher: () => Promise<unknown>, profile: string): void {
    this._warmingQueue.push({ key, fetcher, profile });
  }

  /**
   * Start the cache warming loop.
   * @param intervalMs - How often to warm (default: 30s)
   */
  startWarming(intervalMs: number = 30_000): void {
    if (this._warmingInterval) return;

    this._warmingInterval = setInterval(async () => {
      for (const target of this._warmingQueue) {
        try {
          const config = CACHE_PROFILES[target.profile] ?? CACHE_PROFILES.market;
          const data = await target.fetcher();
          this._l1.set(target.key, data, config);
        } catch {
          // Warming failures are non-critical
        }
      }
    }, intervalMs);
  }

  /**
   * Stop the cache warming loop.
   */
  stopWarming(): void {
    if (this._warmingInterval) {
      clearInterval(this._warmingInterval);
      this._warmingInterval = null;
    }
  }

  /**
   * Get cache statistics.
   */
  get stats(): CacheStats & { inflightRequests: number; warmTargets: number } {
    return {
      ...this._l1.stats,
      inflightRequests: this._dedup.inflightCount,
      warmTargets: this._warmingQueue.length,
    };
  }

  // ===========================================================================
  // PRIVATE
  // ===========================================================================

  private _refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig,
  ): void {
    // Fire and forget
    fetcher()
      .then(data => {
        this._l1.set(key, data, config);
      })
      .catch(() => {
        // SWR refresh failed — stale data continues being served
      });
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

/** Global edge cache instance */
export const edgeCache = new EdgeCache();

/**
 * Convenience: wrap a handler with edge caching.
 * Use in API routes:
 *
 * ```ts
 * import { withEdgeCache } from '@/lib/edge-cache';
 *
 * export async function GET(request: Request) {
 *   return withEdgeCache(request, async () => {
 *     const data = await fetchExpensiveData();
 *     return Response.json(data);
 *   });
 * }
 * ```
 */
export async function withEdgeCache(
  request: Request,
  handler: () => Promise<Response>,
  profileOverride?: string,
): Promise<Response> {
  const url = new URL(request.url);
  const cacheKey = `${url.pathname}${url.search}`;
  const profile = profileOverride ?? edgeCache.getProfileForEndpoint(url.pathname);

  const result = await edgeCache.getOrFetch(cacheKey, async () => {
    const response = await handler();
    const body = await response.text();
    return {
      body,
      status: response.status,
      contentType: response.headers.get('content-type') ?? 'application/json',
    };
  }, profile);

  const cacheHeaders = edgeCache.getCacheHeaders(profile);
  const response = new Response(result.data.body, {
    status: result.data.status,
    headers: {
      'Content-Type': result.data.contentType,
      ...cacheHeaders,
      'X-Cache': result.cached ? (result.stale ? 'STALE' : 'HIT') : 'MISS',
      'X-Cache-Profile': profile,
    },
  });

  return response;
}
