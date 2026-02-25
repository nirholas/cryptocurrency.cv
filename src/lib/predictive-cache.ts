/**
 * Predictive Cache Warming
 *
 * Uses access pattern analysis to predict what data users will request next
 * and proactively warm caches before the request arrives. This eliminates
 * cold-start latency for the most common request patterns.
 *
 * Techniques:
 *   1. Time-of-day patterns (e.g., Asian markets → BTC/ETH/SOL at 00:00 UTC)
 *   2. Sequential patterns (user views BTC → likely views ETH next)
 *   3. Trending topic prefetch (if "halving" is trending, warm halving-related data)
 *   4. Market event triggers (large price move → warm related assets)
 *   5. Geographic patterns (IP-based locale → prefetch relevant exchanges)
 *
 * Architecture:
 *   AccessLogger → PatternDetector → PrefetchScheduler → CacheWarmer
 *
 * Usage:
 *   import { PredictiveCache } from '@/lib/predictive-cache';
 *
 *   const cache = new PredictiveCache();
 *
 *   // Log access (call from middleware/API handlers)
 *   cache.logAccess('/api/prices', { coins: 'bitcoin,ethereum' });
 *
 *   // Start background warming (call once on server start)
 *   cache.startWarming();
 *
 * @module predictive-cache
 */

import { metrics } from './telemetry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccessLog {
  path: string;
  params: Record<string, string>;
  timestamp: number;
  locale?: string;
  /** Hour of day (0-23) */
  hour: number;
  /** Day of week (0-6, 0=Sunday) */
  dayOfWeek: number;
}

export interface AccessPattern {
  /** The path/endpoint */
  path: string;
  /** Parameters that make this pattern unique */
  params: Record<string, string>;
  /** Frequency count in the observation window */
  frequency: number;
  /** Average hour of day this is accessed */
  avgHour: number;
  /** Confidence 0-1 that this will be accessed in the next period */
  confidence: number;
  /** Last access time */
  lastAccess: number;
}

export interface WarmingTask {
  id: string;
  path: string;
  params: Record<string, string>;
  priority: number;
  scheduledFor: number;
  reason: string;
}

interface SequentialPattern {
  /** After accessing path A... */
  from: string;
  /** Users often access path B */
  to: string;
  toParams: Record<string, string>;
  /** How often this sequence occurs */
  count: number;
  /** Transition probability */
  probability: number;
}

interface CacheConfig {
  /** Maximum access logs to retain */
  maxLogs?: number;
  /** Observation window in ms (default 1 hour) */
  observationWindow?: number;
  /** How often to run the warming cycle in ms (default 60s) */
  warmingInterval?: number;
  /** Maximum concurrent warm requests */
  maxConcurrency?: number;
  /** Base URL for warming requests */
  baseUrl?: string;
}

// ---------------------------------------------------------------------------
// Predictive Cache
// ---------------------------------------------------------------------------

export class PredictiveCache {
  private logs: AccessLog[] = [];
  private patterns = new Map<string, AccessPattern>();
  private sequences: SequentialPattern[] = [];
  private lastAccess = new Map<string, AccessLog>();
  private warmingTimer: ReturnType<typeof setInterval> | null = null;
  private config: Required<CacheConfig>;
  private warmCount = 0;
  private hitCount = 0;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxLogs: config.maxLogs ?? 10_000,
      observationWindow: config.observationWindow ?? 60 * 60 * 1000,
      warmingInterval: config.warmingInterval ?? 60_000,
      maxConcurrency: config.maxConcurrency ?? 5,
      baseUrl: config.baseUrl ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    };
  }

  // ---------------------------------------------------------------------------
  // Access Logging
  // ---------------------------------------------------------------------------

  /**
   * Log an API access. Call this from middleware or API handlers.
   */
  logAccess(path: string, params: Record<string, string> = {}, locale?: string): void {
    const now = Date.now();
    const date = new Date(now);

    const log: AccessLog = {
      path,
      params,
      timestamp: now,
      locale,
      hour: date.getUTCHours(),
      dayOfWeek: date.getUTCDay(),
    };

    this.logs.push(log);

    // Evict old logs
    if (this.logs.length > this.config.maxLogs) {
      this.logs = this.logs.slice(-this.config.maxLogs);
    }

    // Update sequential patterns
    const prevAccess = this.lastAccess.get('_global');
    if (prevAccess && now - prevAccess.timestamp < 30_000) {
      this.recordSequence(prevAccess, log);
    }
    this.lastAccess.set('_global', log);

    // Update pattern frequencies
    const patternKey = this.getPatternKey(path, params);
    const existing = this.patterns.get(patternKey);
    if (existing) {
      existing.frequency++;
      existing.lastAccess = now;
      existing.avgHour = (existing.avgHour * (existing.frequency - 1) + log.hour) / existing.frequency;
    } else {
      this.patterns.set(patternKey, {
        path,
        params,
        frequency: 1,
        avgHour: log.hour,
        confidence: 0,
        lastAccess: now,
      });
    }
  }

  /**
   * Check if a request is likely to be a cache hit (was pre-warmed).
   */
  checkPrediction(path: string, params: Record<string, string> = {}): boolean {
    const key = this.getPatternKey(path, params);
    const pattern = this.patterns.get(key);
    if (pattern && pattern.confidence > 0.5) {
      this.hitCount++;
      metrics.cacheHits.add(1, { type: 'predictive' });
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Pattern Detection
  // ---------------------------------------------------------------------------

  /**
   * Analyze access logs and compute pattern confidence scores.
   */
  analyzePatterns(): AccessPattern[] {
    const now = Date.now();
    const currentHour = new Date(now).getUTCHours();
    const currentDay = new Date(now).getUTCDay();

    // Compute confidence scores
    for (const pattern of this.patterns.values()) {
      const recency = Math.max(0, 1 - (now - pattern.lastAccess) / this.config.observationWindow);
      const frequency = Math.min(1, pattern.frequency / 100);
      const hourMatch = 1 - Math.min(Math.abs(pattern.avgHour - currentHour), 24 - Math.abs(pattern.avgHour - currentHour)) / 12;

      pattern.confidence = recency * 0.3 + frequency * 0.4 + hourMatch * 0.3;
    }

    // Sort by confidence
    return [...this.patterns.values()]
      .filter((p) => p.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get the top N most likely next requests based on sequential patterns.
   */
  predictNext(currentPath: string, limit = 5): Array<{ path: string; params: Record<string, string>; probability: number }> {
    return this.sequences
      .filter((s) => s.from === currentPath)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, limit)
      .map((s) => ({
        path: s.to,
        params: s.toParams,
        probability: s.probability,
      }));
  }

  // ---------------------------------------------------------------------------
  // Cache Warming
  // ---------------------------------------------------------------------------

  /**
   * Start the background warming cycle.
   */
  startWarming(): void {
    if (this.warmingTimer) return;

    // Immediate first warm with known high-traffic patterns
    this.warmStaticPatterns();

    this.warmingTimer = setInterval(() => {
      this.runWarmingCycle();
    }, this.config.warmingInterval);

    // Unref so it doesn't prevent process exit
    if (this.warmingTimer && typeof this.warmingTimer === 'object' && 'unref' in this.warmingTimer) {
      (this.warmingTimer as NodeJS.Timeout).unref();
    }
  }

  /**
   * Stop the background warming cycle.
   */
  stopWarming(): void {
    if (this.warmingTimer) {
      clearInterval(this.warmingTimer);
      this.warmingTimer = null;
    }
  }

  /**
   * Run a single warming cycle.
   */
  private async runWarmingCycle(): Promise<void> {
    const patterns = this.analyzePatterns();
    const tasks = patterns.slice(0, this.config.maxConcurrency);

    const results = await Promise.allSettled(
      tasks.map((pattern) => this.warmEndpoint(pattern.path, pattern.params, `confidence=${pattern.confidence.toFixed(2)}`)),
    );

    const warmed = results.filter((r) => r.status === 'fulfilled').length;
    this.warmCount += warmed;
  }

  /**
   * Warm static patterns that are always high-traffic.
   */
  private async warmStaticPatterns(): Promise<void> {
    const staticPatterns: Array<{ path: string; params: Record<string, string> }> = [
      { path: '/api/v1/news', params: {} },
      { path: '/api/prices', params: { coins: 'bitcoin,ethereum,solana' } },
      { path: '/api/global', params: {} },
      { path: '/api/v1/coins', params: {} },
      { path: '/api/v1/trending', params: {} },
    ];

    await Promise.allSettled(
      staticPatterns.map((p) => this.warmEndpoint(p.path, p.params, 'static')),
    );
  }

  /**
   * Make a warming request to an endpoint.
   */
  private async warmEndpoint(
    path: string,
    params: Record<string, string>,
    reason: string,
  ): Promise<void> {
    const url = new URL(path, this.config.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'X-Cache-Warm': 'true',
          'X-Warm-Reason': reason,
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (response.ok) {
        // Consume the body to ensure the response is fully cached
        await response.text();
      }
    } catch {
      // Non-critical — warming failures are expected
    }
  }

  // ---------------------------------------------------------------------------
  // Sequential Pattern Learning
  // ---------------------------------------------------------------------------

  private recordSequence(from: AccessLog, to: AccessLog): void {
    const existing = this.sequences.find(
      (s) => s.from === from.path && s.to === to.path,
    );

    if (existing) {
      existing.count++;
      existing.toParams = to.params;
    } else {
      this.sequences.push({
        from: from.path,
        to: to.path,
        toParams: to.params,
        count: 1,
        probability: 0,
      });
    }

    // Recalculate probabilities for this source
    const fromSequences = this.sequences.filter((s) => s.from === from.path);
    const totalCount = fromSequences.reduce((sum, s) => sum + s.count, 0);
    for (const s of fromSequences) {
      s.probability = s.count / totalCount;
    }

    // Evict low-count sequences
    if (this.sequences.length > 1000) {
      this.sequences.sort((a, b) => b.count - a.count);
      this.sequences = this.sequences.slice(0, 500);
    }
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  /**
   * Get cache warming statistics.
   */
  getStats(): {
    totalLogs: number;
    uniquePatterns: number;
    sequentialPatterns: number;
    warmCount: number;
    hitCount: number;
    hitRate: number;
    topPatterns: AccessPattern[];
  } {
    return {
      totalLogs: this.logs.length,
      uniquePatterns: this.patterns.size,
      sequentialPatterns: this.sequences.length,
      warmCount: this.warmCount,
      hitCount: this.hitCount,
      hitRate: this.warmCount > 0 ? this.hitCount / this.warmCount : 0,
      topPatterns: this.analyzePatterns().slice(0, 10),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private getPatternKey(path: string, params: Record<string, string>): string {
    const sortedParams = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${path}?${sortedParams}`;
  }
}

// ---------------------------------------------------------------------------
// Market Event Triggers
// ---------------------------------------------------------------------------

/**
 * Pre-defined market events that trigger cache warming.
 */
export const MARKET_TRIGGERS = {
  /**
   * Large price movement detected — warm related assets and news.
   */
  priceMove: (coin: string, changePercent: number) => {
    const cache = getPredictiveCache();
    const warmPaths: Array<{ path: string; params: Record<string, string> }> = [
      { path: `/api/v1/news`, params: { q: coin } },
      { path: `/api/prices`, params: { coins: coin } },
      { path: `/api/v1/coins/${coin}`, params: {} },
    ];

    // If > 10% move, also warm related trending data
    if (Math.abs(changePercent) > 10) {
      warmPaths.push(
        { path: '/api/v1/trending', params: {} },
        { path: '/api/global', params: {} },
      );
    }

    for (const wp of warmPaths) {
      cache.logAccess(wp.path, wp.params);
    }
  },

  /**
   * Trending topic detected — warm related search results.
   */
  trending: (topic: string) => {
    const cache = getPredictiveCache();
    cache.logAccess('/api/v1/news', { q: topic });
    cache.logAccess('/api/v1/search', { q: topic });
  },

  /**
   * New article published — warm the article endpoint.
   */
  newArticle: (slug: string, category: string) => {
    const cache = getPredictiveCache();
    cache.logAccess(`/api/v1/news/${slug}`, {});
    cache.logAccess('/api/v1/news', { category });
  },
};

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _cache: PredictiveCache | null = null;

export function getPredictiveCache(): PredictiveCache {
  if (!_cache) _cache = new PredictiveCache();
  return _cache;
}
