/**
 * Provider Framework — Core Types
 *
 * A production-grade data provider abstraction inspired by Netflix Hystrix,
 * DefiLlama's LlamaProvider, and distributed systems consensus algorithms.
 *
 * This type system enables:
 * - Multi-source data fetching with automatic fallback
 * - Circuit breaker protection against cascading failures
 * - Cross-source data validation via weighted consensus
 * - Statistical anomaly detection on incoming data
 * - Real-time provider health monitoring
 * - Data lineage tracking (every value knows where it came from)
 *
 * @module providers/types
 * @see {@link https://github.com/Netflix/Hystrix} Circuit breaker inspiration
 * @see {@link https://github.com/DefiLlama/defillama-sdk} LlamaProvider patterns
 */

// =============================================================================
// DATA PROVIDER — The core abstraction
// =============================================================================

/**
 * A DataProvider is a single source of a specific type of data.
 *
 * Each provider wraps one external API (e.g., CoinGecko, Binance, Mempool.space)
 * and implements a standard interface so providers can be swapped, chained,
 * and composed without changing consuming code.
 *
 * @example
 * ```ts
 * const coingecko: DataProvider<TokenPrice[]> = {
 *   name: 'coingecko',
 *   priority: 1,
 *   weight: 0.4,
 *   rateLimit: { maxRequests: 30, windowMs: 60_000 },
 *   fetch: async (params) => {
 *     const res = await fetch(`https://api.coingecko.com/api/v3/...`);
 *     return res.json();
 *   },
 *   healthCheck: async () => {
 *     const res = await fetch('https://api.coingecko.com/api/v3/ping');
 *     return res.ok;
 *   },
 * };
 * ```
 */
export interface DataProvider<T = unknown> {
  /** Unique identifier (e.g., 'coingecko', 'binance-futures') */
  readonly name: string;

  /** Human-readable description of this data source */
  readonly description?: string;

  /**
   * Priority order: lower = tried first.
   * Providers with equal priority are tried in parallel (race mode).
   */
  readonly priority: number;

  /**
   * Weight for data fusion consensus (0–1).
   * Higher weight = more trusted source.
   * Used when merging results from multiple providers.
   */
  readonly weight: number;

  /**
   * Rate limit configuration for this provider.
   * The framework enforces this automatically.
   */
  readonly rateLimit?: RateLimitConfig;

  /**
   * Supported data categories this provider can serve.
   * Used for automatic routing in the registry.
   */
  readonly capabilities?: string[];

  /**
   * Fetch data from this provider.
   * Should throw on failure (the framework handles retries/fallback).
   */
  fetch(params: FetchParams): Promise<T>;

  /**
   * Optional health check endpoint.
   * Return true if the provider is operational.
   * Default: provider is assumed healthy until a fetch fails.
   */
  healthCheck?(): Promise<boolean>;

  /**
   * Optional: Transform raw API response into normalized format.
   * If not provided, the raw response is used as-is.
   */
  normalize?(raw: unknown): T;

  /**
   * Optional: Validate that the response looks correct.
   * Return false to trigger fallback to next provider.
   * Useful for detecting stale data, empty responses, etc.
   */
  validate?(data: T): boolean;
}

// =============================================================================
// FETCH PARAMS — What data to fetch
// =============================================================================

/**
 * Parameters passed to every provider's fetch() method.
 * Providers ignore params they don't understand.
 */
export interface FetchParams {
  /** Coin IDs to fetch (CoinGecko format) */
  coinIds?: string[];

  /** Trading symbols (e.g., 'BTCUSDT') */
  symbols?: string[];

  /** Target chain (e.g., 'ethereum', 'bitcoin') */
  chain?: string;

  /** Time range for historical data */
  timeRange?: TimeRange;

  /** Maximum number of results */
  limit?: number;

  /** Currency for price denomination */
  vsCurrency?: string;

  /** Category filter */
  category?: string;

  /** Arbitrary extra params for provider-specific needs */
  extra?: Record<string, unknown>;
}

export interface TimeRange {
  from: number; // Unix timestamp (seconds)
  to: number;   // Unix timestamp (seconds)
}

// =============================================================================
// PROVIDER RESPONSE — Enriched with lineage metadata
// =============================================================================

/**
 * Every response from the provider framework includes lineage metadata.
 * This answers: "Where did this data come from? How fresh is it? How confident are we?"
 */
export interface ProviderResponse<T> {
  /** The actual data */
  data: T;

  /** Which provider(s) produced this data */
  lineage: DataLineage;

  /** Was this served from cache? */
  cached: boolean;

  /** Time taken to resolve (ms) */
  latencyMs: number;
}

/**
 * Data lineage — full provenance chain for every data point.
 *
 * In a world where API data can be stale, wrong, or manipulated,
 * knowing exactly where a number came from is critical.
 */
export interface DataLineage {
  /** Primary provider that produced this data */
  provider: string;

  /** Timestamp when the data was fetched (ms since epoch) */
  fetchedAt: number;

  /** Confidence score (0–1) based on cross-source validation */
  confidence: number;

  /**
   * If data fusion was used, lists all providers that contributed
   * and their individual weights in the final result.
   */
  contributors?: Array<{
    provider: string;
    weight: number;
    agreedWithConsensus: boolean;
  }>;

  /**
   * If anomaly detection flagged this data, contains the details.
   */
  anomalies?: AnomalyFlag[];
}

// =============================================================================
// CIRCUIT BREAKER — Protection against cascading failures
// =============================================================================

/**
 * Circuit breaker states follow the standard pattern:
 *
 * ```
 *   CLOSED ──(failures exceed threshold)──> OPEN
 *     ^                                       │
 *     │                                       v
 *     └──(probe succeeds)── HALF_OPEN <──(timeout expires)
 * ```
 *
 * - CLOSED: Normal operation, requests flow through
 * - OPEN: Provider is broken, requests fail immediately (fast-fail)
 * - HALF_OPEN: Testing if provider recovered, allowing one probe request
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit (default: 5) */
  failureThreshold: number;

  /** How long to stay OPEN before trying HALF_OPEN, in ms (default: 30_000) */
  resetTimeoutMs: number;

  /** Number of successes in HALF_OPEN needed to close circuit (default: 2) */
  halfOpenSuccessThreshold: number;

  /**
   * Sliding window size for failure rate calculation (default: 10).
   * The circuit opens when failures/window exceeds failureThreshold/window.
   */
  slidingWindowSize: number;

  /** Optional: callback when state changes */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState, provider: string) => void;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  maxRequests: number;

  /** Time window in milliseconds (e.g., 60_000 for 1 minute) */
  windowMs: number;
}

// =============================================================================
// PROVIDER CHAIN — Multi-provider orchestration
// =============================================================================

/**
 * Strategy for how the ProviderChain resolves data from multiple providers.
 *
 * - `fallback`: Try providers in priority order, return first success
 * - `race`: Try all providers in parallel, return fastest success
 * - `consensus`: Fetch from all, merge via weighted voting (data fusion)
 * - `broadcast`: Fetch from all, return all results (for comparison/audit)
 */
export type ResolutionStrategy = 'fallback' | 'race' | 'consensus' | 'broadcast';

export interface ProviderChainConfig {
  /** How to resolve data across providers */
  strategy: ResolutionStrategy;

  /** Overall timeout for the entire chain resolution (ms) */
  timeoutMs: number;

  /** Whether to serve stale cache on total failure */
  staleWhileError: boolean;

  /** Cache TTL in seconds (0 = no caching) */
  cacheTtlSeconds: number;

  /** Circuit breaker config (applied to each provider) */
  circuitBreaker: CircuitBreakerConfig;

  /**
   * Minimum number of providers that must agree for consensus strategy.
   * If fewer agree, the result is flagged as low-confidence.
   */
  minConsensusProviders?: number;

  /**
   * Maximum acceptable deviation between provider results (for numeric data).
   * If deviation exceeds this, anomaly detection is triggered.
   * Expressed as a fraction (e.g., 0.02 = 2% deviation).
   */
  maxDeviation?: number;
}

// =============================================================================
// HEALTH MONITORING
// =============================================================================

/**
 * Health snapshot for a single provider at a point in time.
 */
export interface ProviderHealth {
  /** Provider name */
  provider: string;

  /** Current circuit breaker state */
  circuitState: CircuitBreakerState;

  /** Is the provider currently operational? */
  isHealthy: boolean;

  /** Average response time over the last N requests (ms) */
  avgLatencyMs: number;

  /** p99 latency (ms) */
  p99LatencyMs: number;

  /** Success rate in the current sliding window (0–1) */
  successRate: number;

  /** Total requests made since startup */
  totalRequests: number;

  /** Total failures since startup */
  totalFailures: number;

  /** Last successful response time */
  lastSuccessAt: number | null;

  /** Last failure time */
  lastFailureAt: number | null;

  /** Last error message */
  lastError: string | null;

  /** Uptime percentage since startup (0–1) */
  uptime: number;
}

/**
 * Aggregated health across all providers in a chain.
 */
export interface ChainHealth {
  /** Name of the provider chain */
  chainName: string;

  /** Overall health status */
  status: 'healthy' | 'degraded' | 'critical';

  /** Number of providers available */
  availableProviders: number;

  /** Total number of providers */
  totalProviders: number;

  /** Per-provider health */
  providers: ProviderHealth[];

  /** Timestamp of this snapshot */
  timestamp: number;
}

// =============================================================================
// ANOMALY DETECTION
// =============================================================================

/**
 * Types of anomalies the detector can flag.
 */
export type AnomalyType =
  | 'outlier'           // Value is statistically unusual (z-score)
  | 'stale'             // Data hasn't changed when it should have
  | 'drift'             // Gradual deviation from other sources
  | 'spike'             // Sudden large change
  | 'missing'           // Expected data field is null/undefined
  | 'cross_source_mismatch'; // Significant disagreement between providers

/**
 * A flagged anomaly on a data point.
 */
export interface AnomalyFlag {
  /** What type of anomaly */
  type: AnomalyType;

  /** Severity: how far from normal (0–1, where 1 = extreme) */
  severity: number;

  /** Human-readable description */
  message: string;

  /** The value that triggered the flag */
  value: number;

  /** What we expected (mean, median, etc.) */
  expected: number;

  /** Which provider reported the anomalous value */
  provider?: string;

  /** Timestamp when detected */
  detectedAt: number;
}

/**
 * Configuration for the anomaly detector.
 */
export interface AnomalyDetectorConfig {
  /**
   * Z-score threshold for outlier detection.
   * Values with |z-score| > this are flagged.
   * Default: 2.5 (≈1.2% of normal distribution)
   */
  zScoreThreshold: number;

  /**
   * Maximum age (in seconds) before data is considered stale.
   * Default: 300 (5 minutes for real-time data)
   */
  staleThresholdSeconds: number;

  /**
   * Minimum number of historical data points needed for statistical detection.
   * Default: 10
   */
  minSampleSize: number;

  /**
   * Size of the rolling window for maintaining statistics.
   * Default: 100
   */
  windowSize: number;

  /**
   * Maximum deviation between providers before flagging cross-source mismatch.
   * Expressed as a fraction (e.g., 0.05 = 5%).
   * Default: 0.03 (3%)
   */
  crossSourceThreshold: number;
}

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

/**
 * Data categories that providers can serve.
 * Used for automatic routing in the registry.
 */
export type DataCategory =
  | 'market-price'
  | 'funding-rate'
  | 'open-interest'
  | 'order-book'
  | 'ohlcv'
  | 'tvl'
  | 'defi-yields'
  | 'dex'
  | 'on-chain'
  | 'mempool'
  | 'gas-fees'
  | 'social-metrics'
  | 'fear-greed'
  | 'liquidations'
  | 'derivatives'
  | 'whale-alerts'
  | 'stablecoin-flows'
  | 'nft-market'
  | 'gaming-data'
  | 'macro-data';

/**
 * Registry entry for a provider chain.
 */
export interface RegistryEntry<T = unknown> {
  /** Data category */
  category: DataCategory;

  /** Human-readable name */
  name: string;

  /** Description */
  description: string;

  /** The configured provider chain */
  chain: ProviderChainInstance<T>;

  /** When this entry was registered */
  registeredAt: number;
}

/**
 * Represents an instantiated ProviderChain (runtime reference).
 * The actual class is in provider-chain.ts; this is just the shape
 * for use in type signatures without circular imports.
 */
export interface ProviderChainInstance<T = unknown> {
  readonly name: string;
  readonly strategy: ResolutionStrategy;
  fetch(params: FetchParams): Promise<ProviderResponse<T>>;
  getHealth(): ChainHealth;
}

// =============================================================================
// EVENTS — Observable provider lifecycle
// =============================================================================

/**
 * Events emitted by the provider framework.
 * Subscribe to these for monitoring, logging, alerting.
 */
export type ProviderEvent =
  | { type: 'fetch:start'; provider: string; params: FetchParams; timestamp: number }
  | { type: 'fetch:success'; provider: string; latencyMs: number; timestamp: number }
  | { type: 'fetch:failure'; provider: string; error: string; timestamp: number }
  | { type: 'circuit:open'; provider: string; failures: number; timestamp: number }
  | { type: 'circuit:half_open'; provider: string; timestamp: number }
  | { type: 'circuit:close'; provider: string; timestamp: number }
  | { type: 'anomaly:detected'; provider: string; anomaly: AnomalyFlag; timestamp: number }
  | { type: 'cache:hit'; key: string; age: number; timestamp: number }
  | { type: 'cache:miss'; key: string; timestamp: number }
  | { type: 'consensus:reached'; providers: string[]; confidence: number; timestamp: number }
  | { type: 'consensus:failed'; providers: string[]; reason: string; timestamp: number };

/**
 * Event listener function type.
 */
export type ProviderEventListener = (event: ProviderEvent) => void;

// =============================================================================
// DEFAULTS
// =============================================================================

/** Default circuit breaker configuration */
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenSuccessThreshold: 2,
  slidingWindowSize: 10,
};

/** Default provider chain configuration */
export const DEFAULT_CHAIN_CONFIG: ProviderChainConfig = {
  strategy: 'fallback',
  timeoutMs: 10_000,
  staleWhileError: true,
  cacheTtlSeconds: 30,
  circuitBreaker: DEFAULT_CIRCUIT_BREAKER_CONFIG,
  maxDeviation: 0.03,
};

/** Default anomaly detector configuration */
export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectorConfig = {
  zScoreThreshold: 2.5,
  staleThresholdSeconds: 300,
  minSampleSize: 10,
  windowSize: 100,
  crossSourceThreshold: 0.03,
};
