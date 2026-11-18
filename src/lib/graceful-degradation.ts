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
 * Graceful Degradation Engine
 *
 * Ensures the API remains responsive even when upstream providers fail.
 * This is critical for 1M+ user scale — any hard dependency on an external
 * API becomes a single point of failure.
 *
 * ## Strategy Layers
 *
 * 1. **Primary** — Fetch from the best available provider
 * 2. **Fallback Chain** — Try alternative providers in priority order
 * 3. **Stale Cache** — Serve cached data (even if expired) with a warning
 * 4. **Static Snapshot** — Return last-known-good data from disk/archive
 * 5. **Synthetic** — Generate reasonable estimates from correlated data
 * 6. **Graceful Error** — Rich error with self-healing ETA and alternatives
 *
 * ## Circuit States
 *
 * Each provider has its own circuit breaker state:
 *   CLOSED → HALF_OPEN → OPEN
 *
 * @module graceful-degradation
 */

// =============================================================================
// TYPES
// =============================================================================

export type DegradationLevel =
  | 'full'       // All data from primary source
  | 'fallback'   // Data from fallback source
  | 'stale'      // Cached but expired data
  | 'snapshot'   // Historical snapshot
  | 'synthetic'  // AI/estimated data
  | 'unavailable'; // Complete failure

export interface DegradedResponse<T> {
  data: T;
  degradation: {
    level: DegradationLevel;
    source: string;
    staleness?: number; // seconds since data was fresh
    confidence: number; // 0-1, how reliable the data is
    message?: string;
    retryAfter?: number; // seconds until fresh data expected
  };
  timestamp: string;
}

type CircuitState = 'closed' | 'half_open' | 'open';

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  lastSuccess: number;
  openUntil: number;
}

interface ProviderConfig<T> {
  name: string;
  priority: number;
  fetch: () => Promise<T>;
  healthCheck?: () => Promise<boolean>;
}

interface DegradationConfig<T> {
  /** The data category (for cache key) */
  category: string;
  /** Primary + fallback providers in priority order */
  providers: ProviderConfig<T>[];
  /** Cache TTL in seconds */
  cacheTtlSeconds: number;
  /** Stale cache max age in seconds (how old can stale data be?) */
  staleCacheMaxAge: number;
  /** Static snapshot fallback */
  snapshotFetcher?: () => Promise<T | null>;
  /** Synthetic data generator */
  syntheticGenerator?: () => Promise<T | null>;
}

// =============================================================================
// CACHE + CIRCUIT STATE
// =============================================================================

const _cache = new Map<string, { data: unknown; fetchedAt: number; source: string }>();
const _circuits = new Map<string, CircuitBreaker>();

const CIRCUIT_THRESHOLD = 3; // failures before opening
const CIRCUIT_RESET_MS = 30_000; // 30s before half-open retry
const CACHE_CLEANUP_INTERVAL = 60_000; // prune every 60s

// Periodic cleanup
let _cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of _cache) {
      // Remove entries older than 24 hours
      if (now - entry.fetchedAt > 86_400_000) {
        _cache.delete(key);
      }
    }
  }, CACHE_CLEANUP_INTERVAL);
}

function getCircuit(name: string): CircuitBreaker {
  let circuit = _circuits.get(name);
  if (!circuit) {
    circuit = {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      lastSuccess: Date.now(),
      openUntil: 0,
    };
    _circuits.set(name, circuit);
  }

  // Auto transition: open → half_open when timeout expires
  if (circuit.state === 'open' && Date.now() > circuit.openUntil) {
    circuit.state = 'half_open';
  }

  return circuit;
}

function recordSuccess(name: string): void {
  const circuit = getCircuit(name);
  circuit.state = 'closed';
  circuit.failures = 0;
  circuit.lastSuccess = Date.now();
}

function recordFailure(name: string): void {
  const circuit = getCircuit(name);
  circuit.failures++;
  circuit.lastFailure = Date.now();

  if (circuit.failures >= CIRCUIT_THRESHOLD) {
    circuit.state = 'open';
    circuit.openUntil = Date.now() + CIRCUIT_RESET_MS;
  }
}

function isCircuitAllowed(name: string): boolean {
  const circuit = getCircuit(name);
  return circuit.state !== 'open';
}

// =============================================================================
// DEGRADATION ENGINE
// =============================================================================

/**
 * Execute a request with full degradation chain.
 * Guarantees a response (or at least a rich error) even when all providers are down.
 */
export async function withDegradation<T>(
  config: DegradationConfig<T>,
): Promise<DegradedResponse<T>> {
  ensureCleanup();

  const cacheKey = `degrade:${config.category}`;

  // === Layer 1–2: Try providers in priority order ===
  const sortedProviders = [...config.providers].sort((a, b) => a.priority - b.priority);

  for (const provider of sortedProviders) {
    if (!isCircuitAllowed(provider.name)) continue;

    try {
      const data = await Promise.race([
        provider.fetch(),
        timeout<T>(10_000, `${provider.name} timeout`),
      ]);

      recordSuccess(provider.name);

      // Cache the fresh data
      _cache.set(cacheKey, {
        data,
        fetchedAt: Date.now(),
        source: provider.name,
      });

      const level: DegradationLevel = provider.priority === 1 ? 'full' : 'fallback';

      return {
        data,
        degradation: {
          level,
          source: provider.name,
          confidence: level === 'full' ? 1 : 0.9,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      recordFailure(provider.name);
    }
  }

  // === Layer 3: Stale cache ===
  const cached = _cache.get(cacheKey);
  if (cached) {
    const age = (Date.now() - cached.fetchedAt) / 1000;
    if (age < config.staleCacheMaxAge) {
      return {
        data: cached.data as T,
        degradation: {
          level: 'stale',
          source: `cache:${cached.source}`,
          staleness: Math.round(age),
          confidence: Math.max(0.3, 1 - age / config.staleCacheMaxAge),
          message: `Data is ${Math.round(age)}s old. All providers temporarily unavailable.`,
          retryAfter: Math.ceil(CIRCUIT_RESET_MS / 1000),
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  // === Layer 4: Static snapshot ===
  if (config.snapshotFetcher) {
    try {
      const snapshot = await config.snapshotFetcher();
      if (snapshot) {
        return {
          data: snapshot,
          degradation: {
            level: 'snapshot',
            source: 'archive',
            confidence: 0.5,
            message: 'Serving historical snapshot. Live data temporarily unavailable.',
            retryAfter: Math.ceil(CIRCUIT_RESET_MS / 1000),
          },
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // Snapshot also failed
    }
  }

  // === Layer 5: Synthetic data ===
  if (config.syntheticGenerator) {
    try {
      const synthetic = await config.syntheticGenerator();
      if (synthetic) {
        return {
          data: synthetic,
          degradation: {
            level: 'synthetic',
            source: 'estimate',
            confidence: 0.2,
            message: 'Estimated data. All sources temporarily unavailable. Do not use for trading decisions.',
            retryAfter: Math.ceil(CIRCUIT_RESET_MS / 1000),
          },
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // Synthetic generation failed
    }
  }

  // === Layer 6: Graceful error ===
  // Find the next circuit that will re-open
  const nextRetry = Math.min(
    ...sortedProviders.map((p) => {
      const c = getCircuit(p.name);
      return c.state === 'open' ? c.openUntil - Date.now() : 0;
    }).filter((t) => t > 0),
    CIRCUIT_RESET_MS,
  );

  throw new DegradationError(
    `All ${config.providers.length} providers for '${config.category}' are unavailable`,
    {
      level: 'unavailable',
      providers: sortedProviders.map((p) => ({
        name: p.name,
        circuit: getCircuit(p.name).state,
      })),
      retryAfterMs: Math.max(1000, nextRetry),
      hasCachedData: !!cached,
    },
  );
}

// =============================================================================
// DEGRADATION ERROR
// =============================================================================

export class DegradationError extends Error {
  public readonly details: {
    level: 'unavailable';
    providers: { name: string; circuit: CircuitState }[];
    retryAfterMs: number;
    hasCachedData: boolean;
  };

  constructor(
    message: string,
    details: DegradationError['details'],
  ) {
    super(message);
    this.name = 'DegradationError';
    this.details = details;
  }

  toJSON() {
    return {
      error: this.message,
      code: 'ALL_PROVIDERS_UNAVAILABLE',
      degradation: this.details,
      retryAfter: Math.ceil(this.details.retryAfterMs / 1000),
      suggestion: this.details.hasCachedData
        ? 'Cached data was available but too old. Try again shortly.'
        : 'No cached data available. All upstream sources are down.',
    };
  }
}

// =============================================================================
// CIRCUIT STATUS API (for /api/v1/system/status)
// =============================================================================

export function getCircuitStatus(): Record<string, {
  state: CircuitState;
  failures: number;
  lastSuccess: string;
  lastFailure: string;
}> {
  const status: Record<string, {
    state: CircuitState;
    failures: number;
    lastSuccess: string;
    lastFailure: string;
  }> = {};

  for (const name of _circuits.keys()) {
    // Check for auto-transition
    const c = getCircuit(name);
    status[name] = {
      state: c.state,
      failures: c.failures,
      lastSuccess: new Date(c.lastSuccess).toISOString(),
      lastFailure: c.lastFailure ? new Date(c.lastFailure).toISOString() : 'never',
    };
  }

  return status;
}

export function getCacheStats(): {
  entries: number;
  categories: string[];
  oldestEntry: string;
  newestEntry: string;
} {
  const entries = _cache.size;
  const categories = [..._cache.keys()].map((k) => k.replace('degrade:', ''));
  let oldest = Date.now();
  let newest = 0;

  for (const entry of _cache.values()) {
    if (entry.fetchedAt < oldest) oldest = entry.fetchedAt;
    if (entry.fetchedAt > newest) newest = entry.fetchedAt;
  }

  return {
    entries,
    categories,
    oldestEntry: entries > 0 ? new Date(oldest).toISOString() : 'none',
    newestEntry: entries > 0 ? new Date(newest).toISOString() : 'none',
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function timeout<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  );
}
