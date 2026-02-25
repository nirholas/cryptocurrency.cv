/**
 * Provider Chain — Multi-provider orchestrator with 4 resolution strategies
 *
 * This is the core of the provider framework. A ProviderChain wraps N
 * DataProviders and resolves data using one of four strategies:
 *
 * | Strategy    | Behavior                                           | Best For              |
 * |-------------|----------------------------------------------------|-----------------------|
 * | `fallback`  | Try providers in priority order, return first success | Most API calls      |
 * | `race`      | Try all in parallel, return fastest success          | Latency-critical    |
 * | `consensus` | Fetch from all, fuse via weighted voting              | Price data accuracy |
 * | `broadcast` | Fetch from all, return all results                    | Auditing/comparison |
 *
 * Built-in protections:
 * - **Circuit breakers** per provider (auto-disable broken providers)
 * - **Rate limiting** per provider (respect API quotas)
 * - **Stale-while-revalidate caching** (serve stale on total failure)
 * - **Anomaly detection** on incoming data
 * - **Health monitoring** with real-time metrics
 * - **Observable events** for logging, alerting, dashboards
 *
 * @module providers/provider-chain
 */

import type {
  DataProvider,
  FetchParams,
  ProviderResponse,
  DataLineage,
  ProviderChainConfig,
  ProviderChainInstance,
  ChainHealth,
  ProviderEvent,
  ProviderEventListener,
  RateLimitConfig,
} from './types';
import { DEFAULT_CHAIN_CONFIG } from './types';
import { CircuitBreaker, CircuitOpenError } from './circuit-breaker';
import { DataFusionEngine, type FusionInput } from './data-fusion';
import { HealthMonitor } from './health-monitor';

// =============================================================================
// CACHE — Stale-while-revalidate
// =============================================================================

interface CacheEntry<T> {
  data: T;
  lineage: DataLineage;
  createdAt: number;
  expiresAt: number;
}

// =============================================================================
// RATE LIMITER — Token bucket per provider
// =============================================================================

class TokenBucketRateLimiter {
  private _tokens: number;
  private _maxTokens: number;
  private _refillRate: number; // tokens per ms
  private _lastRefill: number;

  constructor(config: RateLimitConfig) {
    this._maxTokens = config.maxRequests;
    this._tokens = config.maxRequests;
    this._refillRate = config.maxRequests / config.windowMs;
    this._lastRefill = Date.now();
  }

  tryConsume(): boolean {
    this._refill();
    if (this._tokens >= 1) {
      this._tokens -= 1;
      return true;
    }
    return false;
  }

  get availableTokens(): number {
    this._refill();
    return Math.floor(this._tokens);
  }

  private _refill(): void {
    const now = Date.now();
    const elapsed = now - this._lastRefill;
    this._tokens = Math.min(this._maxTokens, this._tokens + elapsed * this._refillRate);
    this._lastRefill = now;
  }
}

// =============================================================================
// PROVIDER CHAIN
// =============================================================================

/**
 * Orchestrates data fetching across multiple providers with
 * circuit breakers, caching, rate limiting, and data fusion.
 *
 * @example
 * ```ts
 * // Create a price chain with fallback strategy
 * const priceChain = new ProviderChain<TokenPrice[]>('market-prices', {
 *   strategy: 'fallback',
 *   cacheTtlSeconds: 30,
 * });
 *
 * // Register providers (tried in priority order)
 * priceChain.addProvider(coingeckoProvider);   // priority: 1
 * priceChain.addProvider(binanceProvider);     // priority: 2
 * priceChain.addProvider(coincapProvider);     // priority: 3
 *
 * // Fetch — automatically handles fallback, caching, circuit breakers
 * const result = await priceChain.fetch({ coinIds: ['bitcoin'] });
 * console.log(result.data);             // TokenPrice[]
 * console.log(result.lineage.provider); // 'coingecko' (or fallback)
 * console.log(result.lineage.confidence); // 0.95
 * console.log(result.cached);           // false
 * console.log(result.latencyMs);        // 142
 * ```
 *
 * @example
 * ```ts
 * // Create a price chain with consensus strategy (data fusion)
 * const consensusChain = new ProviderChain<number>('btc-price-consensus', {
 *   strategy: 'consensus',
 *   maxDeviation: 0.02, // Flag if providers disagree by >2%
 * });
 *
 * // All providers are queried and results are fused
 * const result = await consensusChain.fetch({ symbols: ['BTCUSDT'] });
 * console.log(result.lineage.contributors); // Shows each provider's contribution
 * ```
 */
export class ProviderChain<T = unknown> implements ProviderChainInstance<T> {
  readonly name: string;
  readonly strategy;

  private _config: ProviderChainConfig;
  private _providers: Array<{
    provider: DataProvider<T>;
    breaker: CircuitBreaker;
    rateLimiter: TokenBucketRateLimiter | null;
  }> = [];
  private _cache: Map<string, CacheEntry<T>> = new Map();
  private _healthMonitor: HealthMonitor;
  private _fusionEngine: DataFusionEngine;
  private _listeners: ProviderEventListener[] = [];

  constructor(name: string, config?: Partial<ProviderChainConfig>) {
    this.name = name;
    this._config = { ...DEFAULT_CHAIN_CONFIG, ...config };
    this.strategy = this._config.strategy;
    this._healthMonitor = new HealthMonitor(name);
    this._fusionEngine = new DataFusionEngine({
      strategy: 'trimmed_consensus',
      maxCoefficientOfVariation: this._config.maxDeviation ?? 0.03,
    });
  }

  // ===========================================================================
  // PROVIDER MANAGEMENT
  // ===========================================================================

  /**
   * Add a data provider to the chain.
   * Providers are automatically sorted by priority (lower = first).
   */
  addProvider(provider: DataProvider<T>): this {
    const breaker = new CircuitBreaker(provider.name, {
      ...this._config.circuitBreaker,
      onStateChange: (from, to, name) => {
        this._healthMonitor.updateCircuitState(name, to);
        const eventType = to === 'OPEN' ? 'circuit:open'
          : to === 'HALF_OPEN' ? 'circuit:half_open'
          : 'circuit:close';
        this._emit({
          type: eventType,
          provider: name,
          ...(to === 'OPEN' ? { failures: breaker.metrics().totalFailures } : {}),
          timestamp: Date.now(),
        } as ProviderEvent);
      },
    });

    const rateLimiter = provider.rateLimit
      ? new TokenBucketRateLimiter(provider.rateLimit)
      : null;

    this._providers.push({ provider, breaker, rateLimiter });

    // Keep sorted by priority
    this._providers.sort((a, b) => a.provider.priority - b.provider.priority);

    return this;
  }

  /**
   * Remove a provider from the chain.
   */
  removeProvider(name: string): this {
    this._providers = this._providers.filter(p => p.provider.name !== name);
    return this;
  }

  /**
   * Get the number of registered providers.
   */
  get providerCount(): number {
    return this._providers.length;
  }

  // ===========================================================================
  // FETCHING
  // ===========================================================================

  /**
   * Fetch data using the configured strategy.
   * This is the main entry point.
   */
  async fetch(params: FetchParams): Promise<ProviderResponse<T>> {
    const cacheKey = this._buildCacheKey(params);

    // Check cache first
    const cached = this._getFromCache(cacheKey);
    if (cached && !this._isExpired(cached)) {
      this._emit({ type: 'cache:hit', key: cacheKey, age: Date.now() - cached.createdAt, timestamp: Date.now() });
      return {
        data: cached.data,
        lineage: cached.lineage,
        cached: true,
        latencyMs: 0,
      };
    }

    const start = Date.now();

    try {
      let result: ProviderResponse<T>;

      switch (this._config.strategy) {
        case 'fallback':
          result = await this._fetchFallback(params);
          break;
        case 'race':
          result = await this._fetchRace(params);
          break;
        case 'consensus':
          result = await this._fetchConsensus(params);
          break;
        case 'broadcast':
          result = await this._fetchBroadcast(params);
          break;
        default:
          result = await this._fetchFallback(params);
      }

      result.latencyMs = Date.now() - start;

      // Cache the result
      this._setCache(cacheKey, result.data, result.lineage);

      return result;
    } catch (error) {
      // Stale-while-revalidate: serve stale cache on total failure
      if (this._config.staleWhileError && cached) {
        return {
          data: cached.data,
          lineage: {
            ...cached.lineage,
            confidence: cached.lineage.confidence * 0.5, // Halve confidence for stale data
          },
          cached: true,
          latencyMs: Date.now() - start,
        };
      }
      throw error;
    }
  }

  // ===========================================================================
  // STRATEGY: FALLBACK
  // ===========================================================================

  /**
   * Try providers in priority order. Return the first successful result.
   * Skip providers with open circuit breakers or exhausted rate limits.
   */
  private async _fetchFallback(params: FetchParams): Promise<ProviderResponse<T>> {
    const errors: Array<{ provider: string; error: string }> = [];

    for (const { provider, breaker, rateLimiter } of this._providers) {
      // Skip rate-limited providers
      if (rateLimiter && !rateLimiter.tryConsume()) {
        errors.push({ provider: provider.name, error: 'Rate limited' });
        continue;
      }

      try {
        this._emit({ type: 'fetch:start', provider: provider.name, params, timestamp: Date.now() });
        const start = Date.now();

        const data = await breaker.execute(() =>
          this._fetchWithTimeout(provider, params),
        );

        const latencyMs = Date.now() - start;
        this._healthMonitor.recordSuccess(provider.name, latencyMs);
        this._emit({ type: 'fetch:success', provider: provider.name, latencyMs, timestamp: Date.now() });

        return {
          data,
          lineage: {
            provider: provider.name,
            fetchedAt: Date.now(),
            confidence: 0.8, // Single-source confidence
          },
          cached: false,
          latencyMs,
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isCircuitOpen = error instanceof CircuitOpenError;

        if (!isCircuitOpen) {
          this._healthMonitor.recordFailure(
            provider.name,
            errorMsg,
            Date.now(),
          );
        }

        this._emit({ type: 'fetch:failure', provider: provider.name, error: errorMsg, timestamp: Date.now() });
        errors.push({ provider: provider.name, error: errorMsg });
      }
    }

    throw new AllProvidersFailedError(this.name, errors);
  }

  // ===========================================================================
  // STRATEGY: RACE
  // ===========================================================================

  /**
   * Query all available providers in parallel. Return the fastest success.
   * Cancellation-safe: other in-flight requests are ignored (not aborted,
   * since fetch doesn't support true cancellation in all runtimes).
   */
  private async _fetchRace(params: FetchParams): Promise<ProviderResponse<T>> {
    const available = this._providers.filter(({ breaker, rateLimiter }) => {
      if (breaker.state === 'OPEN') return false;
      if (rateLimiter && !rateLimiter.tryConsume()) return false;
      return true;
    });

    if (available.length === 0) {
      throw new AllProvidersFailedError(this.name, [
        { provider: '*', error: 'No providers available (all circuit-breakers open or rate-limited)' },
      ]);
    }

    const racePromises = available.map(async ({ provider, breaker }) => {
      const start = Date.now();
      this._emit({ type: 'fetch:start', provider: provider.name, params, timestamp: Date.now() });

      const data = await breaker.execute(() =>
        this._fetchWithTimeout(provider, params),
      );

      const latencyMs = Date.now() - start;
      this._healthMonitor.recordSuccess(provider.name, latencyMs);
      this._emit({ type: 'fetch:success', provider: provider.name, latencyMs, timestamp: Date.now() });

      return { data, provider: provider.name, latencyMs };
    });

    // Promise.any returns the first resolved promise
    try {
      const winner = await Promise.any(racePromises);
      return {
        data: winner.data,
        lineage: {
          provider: winner.provider,
          fetchedAt: Date.now(),
          confidence: 0.75, // Race gives speed, not validation
        },
        cached: false,
        latencyMs: winner.latencyMs,
      };
    } catch (aggregateError) {
      // All providers failed
      const errors = (aggregateError as AggregateError).errors.map(
        (e: Error, i: number) => ({
          provider: available[i]?.provider.name ?? 'unknown',
          error: e.message,
        }),
      );
      throw new AllProvidersFailedError(this.name, errors);
    }
  }

  // ===========================================================================
  // STRATEGY: CONSENSUS (Data Fusion)
  // ===========================================================================

  /**
   * Query all providers, then fuse results using weighted consensus.
   * This is the most reliable strategy for numeric data (prices, rates).
   *
   * Requires that T is a number or has a numeric field that can be extracted.
   * For complex types, override the fusion logic.
   */
  private async _fetchConsensus(params: FetchParams): Promise<ProviderResponse<T>> {
    const available = this._providers.filter(({ breaker }) =>
      breaker.state !== 'OPEN',
    );

    if (available.length === 0) {
      throw new AllProvidersFailedError(this.name, [
        { provider: '*', error: 'No providers available for consensus' },
      ]);
    }

    // Fetch from all available providers in parallel
    const results = await Promise.allSettled(
      available.map(async ({ provider, breaker, rateLimiter }) => {
        if (rateLimiter && !rateLimiter.tryConsume()) {
          throw new Error('Rate limited');
        }

        const start = Date.now();
        this._emit({ type: 'fetch:start', provider: provider.name, params, timestamp: Date.now() });

        const data = await breaker.execute(() =>
          this._fetchWithTimeout(provider, params),
        );

        const latencyMs = Date.now() - start;
        this._healthMonitor.recordSuccess(provider.name, latencyMs);
        this._emit({ type: 'fetch:success', provider: provider.name, latencyMs, timestamp: Date.now() });

        return { data, provider: provider.name, weight: provider.weight };
      }),
    );

    // Collect successful results
    const successes = results
      .filter((r): r is PromiseFulfilledResult<{ data: T; provider: string; weight: number }> =>
        r.status === 'fulfilled',
      )
      .map(r => r.value);

    // Record failures
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const provider = available[i].provider.name;
        const error = r.reason instanceof Error ? r.reason.message : String(r.reason);
        this._healthMonitor.recordFailure(provider, error, Date.now());
        this._emit({ type: 'fetch:failure', provider, error, timestamp: Date.now() });
      }
    });

    if (successes.length === 0) {
      throw new AllProvidersFailedError(this.name, [
        { provider: '*', error: 'All providers failed during consensus' },
      ]);
    }

    // If only one succeeded, return it directly
    if (successes.length === 1) {
      return {
        data: successes[0].data,
        lineage: {
          provider: successes[0].provider,
          fetchedAt: Date.now(),
          confidence: 0.5,
        },
        cached: false,
        latencyMs: 0,
      };
    }

    // Attempt numeric fusion if data is a number
    if (typeof successes[0].data === 'number') {
      const inputs: FusionInput[] = successes.map(s => ({
        provider: s.provider,
        value: s.data as number,
        weight: s.weight,
      }));

      const fusionResult = this._fusionEngine.fuse(inputs);
      const lineage = this._fusionEngine.toLineage(fusionResult, successes[0].provider);

      this._emit({
        type: fusionResult.confidence > 0.5 ? 'consensus:reached' : 'consensus:failed',
        providers: successes.map(s => s.provider),
        ...(fusionResult.confidence > 0.5
          ? { confidence: fusionResult.confidence }
          : { reason: 'Low confidence' }),
        timestamp: Date.now(),
      } as ProviderEvent);

      return {
        data: fusionResult.value as T,
        lineage,
        cached: false,
        latencyMs: 0,
      };
    }

    // For non-numeric data, return the highest-weight provider's result
    const best = successes.sort((a, b) => b.weight - a.weight)[0];
    return {
      data: best.data,
      lineage: {
        provider: best.provider,
        fetchedAt: Date.now(),
        confidence: successes.length >= 2 ? 0.8 : 0.5,
        contributors: successes.map(s => ({
          provider: s.provider,
          weight: s.weight,
          agreedWithConsensus: true,
        })),
      },
      cached: false,
      latencyMs: 0,
    };
  }

  // ===========================================================================
  // STRATEGY: BROADCAST
  // ===========================================================================

  /**
   * Fetch from all providers and return ALL results.
   * The "data" field contains the highest-priority provider's result.
   * All results are available via lineage.contributors.
   */
  private async _fetchBroadcast(params: FetchParams): Promise<ProviderResponse<T>> {
    const available = this._providers.filter(({ breaker }) =>
      breaker.state !== 'OPEN',
    );

    const results = await Promise.allSettled(
      available.map(async ({ provider, breaker, rateLimiter }) => {
        if (rateLimiter && !rateLimiter.tryConsume()) {
          throw new Error('Rate limited');
        }

        const start = Date.now();
        const data = await breaker.execute(() =>
          this._fetchWithTimeout(provider, params),
        );
        const latencyMs = Date.now() - start;
        this._healthMonitor.recordSuccess(provider.name, latencyMs);

        return { data, provider: provider.name, weight: provider.weight };
      }),
    );

    const successes = results
      .filter((r): r is PromiseFulfilledResult<{ data: T; provider: string; weight: number }> =>
        r.status === 'fulfilled',
      )
      .map(r => r.value);

    if (successes.length === 0) {
      throw new AllProvidersFailedError(this.name, [
        { provider: '*', error: 'All providers failed during broadcast' },
      ]);
    }

    // Return highest-priority provider's data
    const primary = successes[0];
    return {
      data: primary.data,
      lineage: {
        provider: primary.provider,
        fetchedAt: Date.now(),
        confidence: successes.length / available.length,
        contributors: successes.map(s => ({
          provider: s.provider,
          weight: s.weight,
          agreedWithConsensus: true,
        })),
      },
      cached: false,
      latencyMs: 0,
    };
  }

  // ===========================================================================
  // HEALTH & MONITORING
  // ===========================================================================

  /**
   * Get aggregate health for this chain.
   */
  getHealth(): ChainHealth {
    return this._healthMonitor.getChainHealth();
  }

  /**
   * Get a human-readable health summary.
   */
  healthSummary(): string {
    return this._healthMonitor.summary();
  }

  /**
   * Subscribe to provider events (fetch, circuit, anomaly, cache, consensus).
   */
  on(listener: ProviderEventListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  // ===========================================================================
  // INTERNAL — Helpers
  // ===========================================================================

  /**
   * Fetch from a single provider with timeout and optional validation.
   */
  private async _fetchWithTimeout(
    provider: DataProvider<T>,
    params: FetchParams,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this._config.timeoutMs,
    );

    try {
      // Perform the actual fetch
      let data = await Promise.race([
        provider.fetch(params),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Timeout after ${this._config.timeoutMs}ms`)),
          );
        }),
      ]);

      // Normalize if the provider has a normalizer
      if (provider.normalize) {
        data = provider.normalize(data);
      }

      // Validate if the provider has a validator
      if (provider.validate && !provider.validate(data)) {
        throw new Error(`Validation failed for provider "${provider.name}"`);
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  private _buildCacheKey(params: FetchParams): string {
    return `${this.name}:${JSON.stringify(params)}`;
  }

  private _getFromCache(key: string): CacheEntry<T> | null {
    return this._cache.get(key) ?? null;
  }

  private _isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private _setCache(key: string, data: T, lineage: DataLineage): void {
    if (this._config.cacheTtlSeconds <= 0) return;

    this._cache.set(key, {
      data,
      lineage,
      createdAt: Date.now(),
      expiresAt: Date.now() + this._config.cacheTtlSeconds * 1000,
    });

    // Prune cache if too large (keep last 500 entries)
    if (this._cache.size > 500) {
      const entries = Array.from(this._cache.entries());
      entries
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, entries.length - 500)
        .forEach(([k]) => this._cache.delete(k));
    }
  }

  private _emit(event: ProviderEvent): void {
    for (const listener of this._listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break the chain
      }
    }
  }
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Thrown when all providers in a chain have failed.
 * Contains details about each provider's failure for debugging.
 */
export class AllProvidersFailedError extends Error {
  public readonly chainName: string;
  public readonly providerErrors: Array<{ provider: string; error: string }>;

  constructor(
    chainName: string,
    errors: Array<{ provider: string; error: string }>,
  ) {
    const summary = errors
      .map(e => `  ${e.provider}: ${e.error}`)
      .join('\n');
    super(
      `All providers failed for chain "${chainName}":\n${summary}`,
    );
    this.name = 'AllProvidersFailedError';
    this.chainName = chainName;
    this.providerErrors = errors;
  }
}
