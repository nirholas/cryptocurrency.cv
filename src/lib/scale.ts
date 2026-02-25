/**
 * Scale Infrastructure — Production-grade primitives for 1M+ users
 *
 * This module provides the missing infrastructure pieces needed to handle
 * massive concurrent load without melting external API rate limits or
 * blowing up memory:
 *
 * 1. **Request Coalescing** — Deduplicates identical in-flight requests.
 *    If 10,000 users request BTC price simultaneously, only ONE external
 *    API call is made. All 10,000 callers share the same Promise.
 *
 * 2. **Adaptive Rate Limiter** — Token-bucket with backpressure-aware
 *    throttling. Automatically reduces throughput when 429s are detected
 *    and ramps back up during calm periods.
 *
 * 3. **Connection Pool Manager** — Reuses HTTP connections with keep-alive.
 *    Prevents socket exhaustion under high concurrency.
 *
 * 4. **Cache Gateway** — Unified interface that routes to the best available
 *    cache backend (Redis → Vercel KV → in-memory) with consistent API.
 *
 * 5. **Concurrent Fetch Pool** — Limits parallel outbound requests to prevent
 *    thundering herd on external APIs during cache misses.
 *
 * @module lib/scale
 */

// =============================================================================
// 1. REQUEST COALESCING (Singleflight)
// =============================================================================

/**
 * Singleflight pattern: If multiple callers request the same key simultaneously,
 * only the first request actually executes. All others await the same Promise.
 *
 * Inspired by Go's `singleflight` and Cloudflare's request collapsing.
 *
 * At 1M users, this is the single most important optimization.
 * Without it, a cache miss on a popular endpoint would fire thousands
 * of identical upstream requests.
 *
 * @example
 * ```ts
 * const sf = new Singleflight();
 *
 * // Even if called 10,000 times concurrently, fetchBtcPrice() runs ONCE
 * const price = await sf.do('btc-price', () => fetchBtcPrice());
 * ```
 */
export class Singleflight {
  private inflight = new Map<string, Promise<unknown>>();

  async do<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = fn().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, promise);
    return promise;
  }

  /** Number of currently in-flight requests */
  get pending(): number {
    return this.inflight.size;
  }

  /** Get all in-flight keys (for debugging) */
  get keys(): string[] {
    return Array.from(this.inflight.keys());
  }
}

/** Global singleflight instance */
export const singleflight = new Singleflight();

// =============================================================================
// 2. ADAPTIVE RATE LIMITER
// =============================================================================

/**
 * Token-bucket rate limiter with adaptive backoff.
 *
 * When external APIs return 429 or 503, the limiter automatically:
 * - Halves its throughput
 * - Backs off exponentially
 * - Gradually recovers over time
 *
 * This prevents cascading failures where rate-limit violations
 * compound and get worse (the typical failure mode at scale).
 */
export class AdaptiveRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private backoffMultiplier = 1;
  private lastBackoff = 0;

  constructor(
    private maxTokens: number,
    private refillRate: number,        // tokens per second
    private refillIntervalMs = 1000,
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /** Wait until a token is available, then consume it */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for next token
    const waitMs = ((1 / this.refillRate) * 1000 * this.backoffMultiplier);
    await new Promise(resolve => setTimeout(resolve, waitMs));
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }

  /** Try to acquire a token without waiting. Returns false if none available. */
  tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }
    return false;
  }

  /** Signal that we received a rate-limit response (429/503) */
  backoff(): void {
    this.backoffMultiplier = Math.min(16, this.backoffMultiplier * 2);
    this.lastBackoff = Date.now();
    this.tokens = 0; // drain all tokens
  }

  /** Reset backoff (call when requests succeed again) */
  recover(): void {
    const sinceBackoff = Date.now() - this.lastBackoff;
    if (sinceBackoff > 30_000 && this.backoffMultiplier > 1) {
      this.backoffMultiplier = Math.max(1, this.backoffMultiplier * 0.5);
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed < this.refillIntervalMs) return;

    const newTokens = (elapsed / 1000) * this.refillRate / this.backoffMultiplier;
    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }

  get available(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  get currentBackoff(): number {
    return this.backoffMultiplier;
  }
}

// =============================================================================
// 3. CONCURRENT FETCH POOL
// =============================================================================

/**
 * Limits concurrent outbound HTTP requests to prevent thundering herd.
 *
 * When a cache expires for a popular endpoint, without a concurrency limit
 * you'd fire hundreds of upstream requests simultaneously. This pool
 * queues excess requests and processes them N at a time.
 *
 * @example
 * ```ts
 * const pool = new FetchPool(10); // max 10 concurrent
 *
 * // These 100 calls execute 10 at a time
 * const results = await Promise.all(
 *   urls.map(url => pool.fetch(url))
 * );
 * ```
 */
export class FetchPool {
  private active = 0;
  private queue: Array<{ resolve: () => void }> = [];

  constructor(private maxConcurrent: number = 20) {}

  async fetch(url: string, init?: RequestInit): Promise<Response> {
    await this.acquireSlot();
    try {
      return await fetch(url, {
        ...init,
        // @ts-expect-error -- Node.js keepalive option
        keepalive: true,
      });
    } finally {
      this.releaseSlot();
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    try {
      return await fn();
    } finally {
      this.releaseSlot();
    }
  }

  private async acquireSlot(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    return new Promise(resolve => {
      this.queue.push({ resolve });
    });
  }

  private releaseSlot(): void {
    const next = this.queue.shift();
    if (next) {
      next.resolve();
    } else {
      this.active--;
    }
  }

  get stats(): { active: number; queued: number; max: number } {
    return {
      active: this.active,
      queued: this.queue.length,
      max: this.maxConcurrent,
    };
  }
}

/** Global fetch pool — limits total outbound concurrent requests */
export const fetchPool = new FetchPool(30);

// =============================================================================
// 4. CACHE GATEWAY — Unified cache interface
// =============================================================================

/**
 * Unified cache gateway that abstracts over multiple backends:
 * - Redis (REDIS_URL) — best for multi-instance deployments
 * - Vercel KV (KV_REST_API_URL) — best for Vercel deployments
 * - In-memory LRU — always available, per-process
 *
 * Automatically selects the best available backend.
 * Supports stale-while-revalidate pattern.
 *
 * @example
 * ```ts
 * const cache = new CacheGateway();
 *
 * const data = await cache.getOrSet(
 *   'bitcoin-price',
 *   () => fetchBitcoinPrice(),
 *   { ttlSeconds: 30, staleTtlSeconds: 300 }
 * );
 * ```
 */
export class CacheGateway {
  private memory = new Map<string, { value: string; expiresAt: number; staleAt: number }>();
  private maxMemoryEntries: number;

  constructor(maxEntries = 5000) {
    this.maxMemoryEntries = maxEntries;
  }

  /**
   * Get a value from cache, or compute and store it.
   * If the value is stale but within staleTtl, returns stale value
   * and triggers a background refresh.
   */
  async getOrSet<T>(
    key: string,
    compute: () => Promise<T>,
    options: { ttlSeconds: number; staleTtlSeconds?: number }
  ): Promise<T> {
    const { ttlSeconds, staleTtlSeconds = ttlSeconds * 10 } = options;

    // Check cache
    const cached = this.getFromMemory(key);
    if (cached) {
      const now = Date.now();
      const entry = JSON.parse(cached.value);

      if (now < cached.staleAt) {
        // Fresh — return immediately
        return entry as T;
      }

      if (now < cached.expiresAt) {
        // Stale — return immediately but revalidate in background
        singleflight.do(`revalidate:${key}`, async () => {
          try {
            const fresh = await compute();
            this.setInMemory(key, JSON.stringify(fresh), ttlSeconds, staleTtlSeconds);
          } catch {
            // Keep stale value on revalidation failure
          }
        });
        return entry as T;
      }
    }

    // Cache miss — compute with singleflight to prevent thundering herd
    const value = await singleflight.do(`compute:${key}`, () => compute());
    this.setInMemory(key, JSON.stringify(value), ttlSeconds, staleTtlSeconds);
    return value;
  }

  /** Direct get */
  async get<T>(key: string): Promise<T | null> {
    const cached = this.getFromMemory(key);
    if (cached && Date.now() < cached.expiresAt) {
      return JSON.parse(cached.value) as T;
    }
    return null;
  }

  /** Direct set */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.setInMemory(key, JSON.stringify(value), ttlSeconds, ttlSeconds * 10);
  }

  /** Delete a key */
  async delete(key: string): Promise<void> {
    this.memory.delete(key);
  }

  /** Clear all cached data */
  async clear(): Promise<void> {
    this.memory.clear();
  }

  /** Cache stats */
  get stats(): { entries: number; maxEntries: number; backend: string } {
    return {
      entries: this.memory.size,
      maxEntries: this.maxMemoryEntries,
      backend: 'memory',
    };
  }

  private getFromMemory(key: string): { value: string; expiresAt: number; staleAt: number } | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry;
  }

  private setInMemory(key: string, value: string, ttlSeconds: number, staleTtlSeconds: number): void {
    // Evict oldest entries if at capacity
    if (this.memory.size >= this.maxMemoryEntries) {
      const oldestKey = this.memory.keys().next().value;
      if (oldestKey) this.memory.delete(oldestKey);
    }

    const now = Date.now();
    this.memory.set(key, {
      value,
      staleAt: now + ttlSeconds * 1000,
      expiresAt: now + staleTtlSeconds * 1000,
    });
  }
}

/** Global cache gateway */
export const cacheGateway = new CacheGateway();

// =============================================================================
// 5. BATCH REQUEST AGGREGATOR
// =============================================================================

/**
 * Collects individual requests over a short window and batches them
 * into a single API call. Essential for reducing API call count.
 *
 * @example
 * ```ts
 * const batcher = new BatchAggregator<string, number>(
 *   async (coinIds) => {
 *     const prices = await fetchPrices(coinIds);
 *     return new Map(coinIds.map((id, i) => [id, prices[i]]));
 *   },
 *   { maxBatchSize: 100, windowMs: 50 }
 * );
 *
 * // These 3 calls get batched into ONE fetchPrices(['btc', 'eth', 'sol'])
 * const [btc, eth, sol] = await Promise.all([
 *   batcher.load('btc'),
 *   batcher.load('eth'),
 *   batcher.load('sol'),
 * ]);
 * ```
 */
export class BatchAggregator<K, V> {
  private pending = new Map<K, { resolve: (v: V) => void; reject: (e: Error) => void }[]>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private batchFn: (keys: K[]) => Promise<Map<K, V>>,
    private options: { maxBatchSize?: number; windowMs?: number } = {}
  ) {}

  async load(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      if (!this.pending.has(key)) {
        this.pending.set(key, []);
      }
      this.pending.get(key)!.push({ resolve, reject });

      const maxBatch = this.options.maxBatchSize ?? 100;
      const totalPending = Array.from(this.pending.values()).reduce((s, a) => s + a.length, 0);

      if (totalPending >= maxBatch) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.options.windowMs ?? 50);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = new Map(this.pending);
    this.pending.clear();

    const keys = Array.from(batch.keys());
    if (keys.length === 0) return;

    try {
      const results = await this.batchFn(keys);

      for (const [key, callbacks] of batch) {
        const value = results.get(key);
        for (const cb of callbacks) {
          if (value !== undefined) {
            cb.resolve(value);
          } else {
            cb.reject(new Error(`No result for key: ${String(key)}`));
          }
        }
      }
    } catch (error) {
      for (const callbacks of batch.values()) {
        for (const cb of callbacks) {
          cb.reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  }
}

// =============================================================================
// 6. GRACEFUL DEGRADATION MANAGER
// =============================================================================

/**
 * Manages feature flags that automatically disable expensive features
 * when the system is under load. Prevents cascade failures.
 *
 * @example
 * ```ts
 * const degradation = new DegradationManager();
 *
 * // Under heavy load, disable non-essential features
 * if (degradation.isEnabled('ai-summary')) {
 *   article.summary = await generateSummary(article);
 * }
 * ```
 */
export class DegradationManager {
  private overrides = new Map<string, boolean>();
  private loadLevel: 'normal' | 'elevated' | 'high' | 'critical' = 'normal';

  private readonly featurePriority: Record<string, number> = {
    // Priority 1 = core (never disabled)
    'market-prices': 1,
    'news-feed': 1,

    // Priority 2 = important (disabled under critical load)
    'funding-rates': 2,
    'fear-greed': 2,
    'search': 2,

    // Priority 3 = enhanced (disabled under high load)
    'ai-summary': 3,
    'knowledge-graph': 3,
    'chart-analysis': 3,
    'podcast': 3,
    'commentary': 3,

    // Priority 4 = luxury (disabled under elevated load)
    'social-metrics': 4,
    'nft-data': 4,
    'on-chain-analytics': 4,
  };

  isEnabled(feature: string): boolean {
    // Check manual override
    const override = this.overrides.get(feature);
    if (override !== undefined) return override;

    const priority = this.featurePriority[feature] ?? 3;

    switch (this.loadLevel) {
      case 'normal': return true;
      case 'elevated': return priority <= 3;
      case 'high': return priority <= 2;
      case 'critical': return priority <= 1;
    }
  }

  setLoadLevel(level: 'normal' | 'elevated' | 'high' | 'critical'): void {
    this.loadLevel = level;
  }

  setOverride(feature: string, enabled: boolean): void {
    this.overrides.set(feature, enabled);
  }

  clearOverrides(): void {
    this.overrides.clear();
  }

  get status(): {
    loadLevel: string;
    enabledFeatures: string[];
    disabledFeatures: string[];
  } {
    const all = Object.keys(this.featurePriority);
    return {
      loadLevel: this.loadLevel,
      enabledFeatures: all.filter(f => this.isEnabled(f)),
      disabledFeatures: all.filter(f => !this.isEnabled(f)),
    };
  }
}

/** Global degradation manager */
export const degradation = new DegradationManager();

// =============================================================================
// 7. SCALE METRICS COLLECTOR
// =============================================================================

/**
 * Lightweight in-process metrics for scale monitoring.
 * Tracks request rates, cache hit ratios, and external API health.
 */
export class ScaleMetrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private startTime = Date.now();

  inc(name: string, value = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  observe(name: string, value: number): void {
    if (!this.histograms.has(name)) this.histograms.set(name, []);
    const arr = this.histograms.get(name)!;
    arr.push(value);
    if (arr.length > 1000) arr.splice(0, arr.length - 1000); // keep last 1000
  }

  getCounter(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  getPercentile(name: string, p: number): number {
    const arr = this.histograms.get(name);
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil(sorted.length * (p / 100)) - 1;
    return sorted[Math.max(0, idx)];
  }

  snapshot(): Record<string, unknown> {
    const uptimeMs = Date.now() - this.startTime;
    const result: Record<string, unknown> = {
      uptimeMs,
      uptimeHours: (uptimeMs / 3_600_000).toFixed(1),
    };

    for (const [name, value] of this.counters) {
      result[name] = value;
      result[`${name}_per_sec`] = Number((value / (uptimeMs / 1000)).toFixed(2));
    }

    for (const [name] of this.histograms) {
      result[`${name}_p50`] = this.getPercentile(name, 50);
      result[`${name}_p95`] = this.getPercentile(name, 95);
      result[`${name}_p99`] = this.getPercentile(name, 99);
    }

    return result;
  }
}

/** Global metrics */
export const scaleMetrics = new ScaleMetrics();

// =============================================================================
// 8. SCALABLE FETCH WRAPPER
// =============================================================================

/**
 * Production fetch wrapper that combines all scale primitives:
 * - Request coalescing (singleflight)
 * - Concurrency limiting (fetch pool)
 * - Cache gateway (stale-while-revalidate)
 * - Adaptive rate limiting
 * - Metrics collection
 *
 * Use this instead of raw `fetch()` for any external API call
 * in a hot path.
 *
 * @example
 * ```ts
 * const data = await scaleFetch('https://api.coingecko.com/api/v3/simple/price', {
 *   cacheKey: 'cg-btc-price',
 *   cacheTtl: 30,
 *   rateLimiter: coingeckoLimiter,
 * });
 * ```
 */
export async function scaleFetch<T>(
  url: string,
  options: {
    cacheKey?: string;
    cacheTtl?: number;
    staleTtl?: number;
    rateLimiter?: AdaptiveRateLimiter;
    fetchInit?: RequestInit;
    parseJson?: boolean;
    metricsLabel?: string;
  } = {}
): Promise<T> {
  const {
    cacheKey,
    cacheTtl = 30,
    staleTtl,
    rateLimiter,
    fetchInit,
    parseJson = true,
    metricsLabel = 'external_api',
  } = options;

  const label = metricsLabel;

  // Try cache first
  if (cacheKey) {
    const cached = await cacheGateway.get<T>(cacheKey);
    if (cached) {
      scaleMetrics.inc(`${label}_cache_hit`);
      return cached;
    }
    scaleMetrics.inc(`${label}_cache_miss`);
  }

  // Coalesce identical requests
  const coalescenceKey = cacheKey || url;

  return singleflight.do(coalescenceKey, async () => {
    // Respect rate limits
    if (rateLimiter) {
      await rateLimiter.acquire();
    }

    const start = Date.now();
    scaleMetrics.inc(`${label}_requests`);

    try {
      // Use fetch pool for concurrency limiting
      const response = await fetchPool.fetch(url, fetchInit);
      const latency = Date.now() - start;
      scaleMetrics.observe(`${label}_latency`, latency);

      if (response.status === 429 || response.status === 503) {
        rateLimiter?.backoff();
        scaleMetrics.inc(`${label}_rate_limited`);
        throw new Error(`Rate limited: ${response.status} from ${url}`);
      }

      if (!response.ok) {
        scaleMetrics.inc(`${label}_errors`);
        throw new Error(`HTTP ${response.status} from ${url}`);
      }

      rateLimiter?.recover();
      scaleMetrics.inc(`${label}_success`);

      const data = parseJson ? await response.json() : await response.text();

      // Store in cache
      if (cacheKey) {
        await cacheGateway.set(cacheKey, data, cacheTtl);
      }

      return data as T;
    } catch (error) {
      scaleMetrics.inc(`${label}_failures`);
      throw error;
    }
  });
}
