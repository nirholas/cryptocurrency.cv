/**
 * Circuit Breaker — Production-grade failure protection
 *
 * Implements the Circuit Breaker pattern (popularized by Netflix Hystrix)
 * to prevent cascading failures when external data providers go down.
 *
 * State machine:
 * ```
 *   CLOSED ──(failure rate exceeds threshold)──> OPEN
 *     ^                                            │
 *     │                                            v
 *     └──(probe succeeds N times)── HALF_OPEN <──(reset timeout expires)
 * ```
 *
 * Key innovation over basic circuit breakers:
 * - **Sliding window** failure rate (not just consecutive failures)
 * - **Adaptive reset timeout** — doubles on repeated failures (exponential backoff)
 * - **Half-open probe limiting** — only allows 1 request through at a time
 * - **Observable state changes** via callback
 *
 * @module providers/circuit-breaker
 */

import type { CircuitBreakerConfig, CircuitBreakerState } from './types';
import { DEFAULT_CIRCUIT_BREAKER_CONFIG } from './types';

/**
 * Outcome of a single request through the circuit breaker.
 */
interface RequestOutcome {
  success: boolean;
  timestamp: number;
  latencyMs: number;
  error?: string;
}

/**
 * A Circuit Breaker wraps a provider and monitors its health.
 *
 * @example
 * ```ts
 * const breaker = new CircuitBreaker('coingecko', {
 *   failureThreshold: 5,
 *   resetTimeoutMs: 30_000,
 * });
 *
 * // Wrap your fetch call
 * const data = await breaker.execute(async () => {
 *   return fetch('https://api.coingecko.com/api/v3/ping');
 * });
 *
 * // Check state
 * console.log(breaker.state);       // 'CLOSED'
 * console.log(breaker.metrics());   // { successRate: 1.0, ... }
 * ```
 */
export class CircuitBreaker {
  private _state: CircuitBreakerState = 'CLOSED';
  private _config: CircuitBreakerConfig;
  private _providerName: string;

  /** Sliding window of recent request outcomes */
  private _window: RequestOutcome[] = [];

  /** When the circuit was last opened */
  private _lastOpenedAt = 0;

  /** Number of successful probes in HALF_OPEN state */
  private _halfOpenSuccesses = 0;

  /** Whether a probe is currently in flight (HALF_OPEN state) */
  private _probeInFlight = false;

  /** Adaptive backoff multiplier — increases on repeated failures */
  private _backoffMultiplier = 1;

  /** Lifetime counters */
  private _totalRequests = 0;
  private _totalFailures = 0;
  private _totalSuccesses = 0;
  private _startedAt = Date.now();

  constructor(providerName: string, config?: Partial<CircuitBreakerConfig>) {
    this._providerName = providerName;
    this._config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /** Current circuit breaker state */
  get state(): CircuitBreakerState {
    // Check if OPEN should transition to HALF_OPEN
    if (this._state === 'OPEN' && this._shouldAttemptReset()) {
      this._transition('HALF_OPEN');
    }
    return this._state;
  }

  /** Provider this circuit breaker protects */
  get providerName(): string {
    return this._providerName;
  }

  /**
   * Execute a function through the circuit breaker.
   *
   * - CLOSED: Execute normally, track outcome
   * - OPEN: Fail immediately (fast-fail) without calling the function
   * - HALF_OPEN: Allow one probe request at a time
   *
   * @param fn - The async function to execute
   * @throws {CircuitOpenError} if the circuit is OPEN
   * @throws {Error} if the wrapped function throws
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.state; // triggers OPEN→HALF_OPEN check

    if (currentState === 'OPEN') {
      throw new CircuitOpenError(
        this._providerName,
        this._effectiveResetTimeout(),
      );
    }

    if (currentState === 'HALF_OPEN') {
      // Only allow one probe at a time
      if (this._probeInFlight) {
        throw new CircuitOpenError(this._providerName, 1000);
      }
      this._probeInFlight = true;
    }

    const start = Date.now();
    try {
      const result = await fn();
      this._recordSuccess(Date.now() - start);
      return result;
    } catch (error) {
      this._recordFailure(Date.now() - start, error);
      throw error;
    }
  }

  /**
   * Manually trip the circuit breaker to OPEN state.
   * Useful when external signals indicate the provider is down.
   */
  trip(): void {
    if (this._state !== 'OPEN') {
      this._transition('OPEN');
    }
  }

  /**
   * Manually reset the circuit breaker to CLOSED state.
   * Useful for admin intervention or testing.
   */
  reset(): void {
    this._state = 'CLOSED';
    this._halfOpenSuccesses = 0;
    this._probeInFlight = false;
    this._backoffMultiplier = 1;
    this._window = [];
  }

  /**
   * Get current metrics for this circuit breaker.
   */
  metrics(): CircuitBreakerMetrics {
    const windowSuccesses = this._window.filter(o => o.success).length;
    const windowTotal = this._window.length;
    const successRate = windowTotal > 0 ? windowSuccesses / windowTotal : 1;

    const latencies = this._window
      .filter(o => o.success)
      .map(o => o.latencyMs)
      .sort((a, b) => a - b);

    return {
      state: this.state,
      successRate,
      failureRate: 1 - successRate,
      totalRequests: this._totalRequests,
      totalSuccesses: this._totalSuccesses,
      totalFailures: this._totalFailures,
      windowSize: this._window.length,
      avgLatencyMs: latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0,
      p99LatencyMs: latencies.length > 0
        ? latencies[Math.floor(latencies.length * 0.99)]
        : 0,
      lastFailure: this._getLastFailure(),
      backoffMultiplier: this._backoffMultiplier,
      uptimeMs: Date.now() - this._startedAt,
    };
  }

  // ===========================================================================
  // INTERNAL — State transitions
  // ===========================================================================

  private _transition(to: CircuitBreakerState): void {
    const from = this._state;
    if (from === to) return;

    this._state = to;

    if (to === 'OPEN') {
      this._lastOpenedAt = Date.now();
      this._halfOpenSuccesses = 0;
      this._probeInFlight = false;
      // Exponential backoff: double the reset timeout on repeated failures
      this._backoffMultiplier = Math.min(this._backoffMultiplier * 2, 16);
    }

    if (to === 'CLOSED') {
      this._backoffMultiplier = 1;
      this._halfOpenSuccesses = 0;
      this._probeInFlight = false;
    }

    if (to === 'HALF_OPEN') {
      this._halfOpenSuccesses = 0;
      this._probeInFlight = false;
    }

    this._config.onStateChange?.(from, to, this._providerName);
  }

  private _shouldAttemptReset(): boolean {
    const elapsed = Date.now() - this._lastOpenedAt;
    return elapsed >= this._effectiveResetTimeout();
  }

  private _effectiveResetTimeout(): number {
    return this._config.resetTimeoutMs * this._backoffMultiplier;
  }

  // ===========================================================================
  // INTERNAL — Recording outcomes
  // ===========================================================================

  private _recordSuccess(latencyMs: number): void {
    this._totalRequests++;
    this._totalSuccesses++;

    this._addToWindow({ success: true, timestamp: Date.now(), latencyMs });

    if (this._state === 'HALF_OPEN') {
      this._probeInFlight = false;
      this._halfOpenSuccesses++;
      if (this._halfOpenSuccesses >= this._config.halfOpenSuccessThreshold) {
        this._transition('CLOSED');
      }
    }
  }

  private _recordFailure(latencyMs: number, error: unknown): void {
    this._totalRequests++;
    this._totalFailures++;

    const errorMsg = error instanceof Error ? error.message : String(error);
    this._addToWindow({
      success: false,
      timestamp: Date.now(),
      latencyMs,
      error: errorMsg,
    });

    if (this._state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN immediately reopens the circuit
      this._probeInFlight = false;
      this._transition('OPEN');
      return;
    }

    if (this._state === 'CLOSED') {
      // Check if failure rate exceeds threshold
      const failures = this._window.filter(o => !o.success).length;
      if (
        this._window.length >= this._config.slidingWindowSize &&
        failures >= this._config.failureThreshold
      ) {
        this._transition('OPEN');
      }
    }
  }

  private _addToWindow(outcome: RequestOutcome): void {
    this._window.push(outcome);
    // Trim to sliding window size
    while (this._window.length > this._config.slidingWindowSize) {
      this._window.shift();
    }
  }

  private _getLastFailure(): { error: string; timestamp: number } | null {
    for (let i = this._window.length - 1; i >= 0; i--) {
      const outcome = this._window[i];
      if (!outcome.success && outcome.error) {
        return { error: outcome.error, timestamp: outcome.timestamp };
      }
    }
    return null;
  }
}

// =============================================================================
// METRICS TYPE
// =============================================================================

export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  successRate: number;
  failureRate: number;
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  windowSize: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  lastFailure: { error: string; timestamp: number } | null;
  backoffMultiplier: number;
  uptimeMs: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Thrown when a request is rejected because the circuit is OPEN.
 * Contains the expected wait time until the next retry is allowed.
 */
export class CircuitOpenError extends Error {
  public readonly provider: string;
  public readonly retryAfterMs: number;

  constructor(provider: string, retryAfterMs: number) {
    super(
      `Circuit breaker OPEN for provider "${provider}". ` +
      `Retry after ${Math.round(retryAfterMs / 1000)}s.`,
    );
    this.name = 'CircuitOpenError';
    this.provider = provider;
    this.retryAfterMs = retryAfterMs;
  }
}
