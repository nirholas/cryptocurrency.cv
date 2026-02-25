/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures when upstream APIs (CoinGecko, Binance, etc.)
 * are degraded or unreachable. Three states:
 *
 *   CLOSED  → requests flow normally; failures are counted
 *   OPEN    → requests are immediately rejected; no upstream calls
 *   HALF_OPEN → one probe request is allowed through to test recovery
 *
 * When the failure threshold is exceeded the breaker trips OPEN for a
 * configurable cooldown window. After the cooldown one probe request is
 * allowed. If it succeeds the breaker resets to CLOSED; if it fails the
 * breaker returns to OPEN.
 *
 * Usage:
 *   const breaker = CircuitBreaker.for('coingecko');
 *   const data = await breaker.call(() => fetch('https://api.coingecko.com/...'));
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Name used for logging and the singleton registry */
  name: string;
  /** Number of consecutive failures before tripping to OPEN (default 5) */
  failureThreshold?: number;
  /** Time in ms the breaker stays OPEN before allowing a probe (default 30 000) */
  cooldownMs?: number;
  /** Time in ms after which the failure counter resets if no new failures occur (default 60 000) */
  resetTimeoutMs?: number;
  /** Abort a single request after this many ms — 0 to disable (default 0) */
  timeoutMs?: number;
  /** Optional callback fired when the state changes */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;
}

export class CircuitBreaker {
  // ── Singleton registry ────────────────────────────────────────────────────
  static readonly registry = new Map<string, CircuitBreaker>();

  /**
   * Get (or create) a named breaker. This ensures every part of the app that
   * talks to the same upstream shares the same failure state.
   */
  static for(name: string, opts?: Omit<CircuitBreakerOptions, 'name'>): CircuitBreaker {
    let breaker = CircuitBreaker.registry.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker({ name, ...opts });
      CircuitBreaker.registry.set(name, breaker);
    }
    return breaker;
  }

  /** Reset every breaker (useful in tests) */
  static resetAll(): void {
    CircuitBreaker.registry.forEach((b) => b.reset());
  }

  // ── Instance ──────────────────────────────────────────────────────────────
  readonly name: string;
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureAt = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly resetTimeoutMs: number;
  private readonly timeoutMs: number;
  private readonly onStateChange?: CircuitBreakerOptions['onStateChange'];

  private constructor(opts: CircuitBreakerOptions) {
    this.name = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 60_000;
    this.timeoutMs = opts.timeoutMs ?? 0;
    this.onStateChange = opts.onStateChange;
  }

  /** Current state of the breaker */
  getState(): CircuitState {
    return this.state;
  }

  /** Number of recorded consecutive failures */
  getFailures(): number {
    return this.failures;
  }

  /**
   * Execute `fn` through the circuit breaker.
   *
   * Throws `CircuitOpenError` when the breaker is OPEN and the cooldown has
   * not elapsed, so callers can fall back to cached / degraded data.
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    // Auto-reset the failure count if enough time passed without new failures
    if (
      this.state === CircuitState.CLOSED &&
      this.failures > 0 &&
      Date.now() - this.lastFailureAt > this.resetTimeoutMs
    ) {
      this.failures = 0;
    }

    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureAt >= this.cooldownMs) {
        this.transition(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitOpenError(this.name);
      }
    }

    try {
      const result = this.timeoutMs > 0 ? await this.withTimeout(fn(), this.timeoutMs) : await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /** Reset the breaker to CLOSED with zero failures */
  reset(): void {
    this.failures = 0;
    this.lastFailureAt = 0;
    this.transition(CircuitState.CLOSED);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.failures = 0;
      this.transition(CircuitState.CLOSED);
    } else {
      // Single success in CLOSED doesn't reset the counter — consecutive
      // failures are what matter. But if state is CLOSED, reset on success.
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureAt = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transition(CircuitState.OPEN);
    } else if (this.failures >= this.failureThreshold) {
      this.transition(CircuitState.OPEN);
    }
  }

  private transition(to: CircuitState): void {
    if (this.state === to) return;
    const from = this.state;
    this.state = to;
    this.onStateChange?.(this.name, from, to);
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new CircuitTimeoutError(this.name, ms)),
        ms,
      );
      promise.then(
        (v) => { clearTimeout(timer); resolve(v); },
        (e) => { clearTimeout(timer); reject(e); },
      );
    });
  }
}

/**
 * Thrown when a circuit breaker is OPEN and the cooldown hasn't elapsed.
 * Callers should catch this and serve stale / cached data.
 */
export class CircuitOpenError extends Error {
  readonly serviceName: string;
  constructor(name: string) {
    super(`Circuit breaker OPEN for "${name}" — upstream is degraded`);
    this.name = 'CircuitOpenError';
    this.serviceName = name;
  }
}

/**
 * Thrown when a request through the circuit breaker exceeds `timeoutMs`.
 */
export class CircuitTimeoutError extends Error {
  readonly serviceName: string;
  constructor(name: string, ms: number) {
    super(`Request to "${name}" timed out after ${ms} ms`);
    this.name = 'CircuitTimeoutError';
    this.serviceName = name;
  }
}

// =============================================================================
// Pre-configured breakers for common upstreams (1 M-user scale)
// =============================================================================

/** CoinGecko / Binance price APIs */
export const priceCircuit = CircuitBreaker.for('prices', {
  failureThreshold: 5,
  cooldownMs: 30_000,
  timeoutMs: 8_000,
});

/** RSS / Atom feed fetches — many sources, tolerate more failures */
export const feedCircuit = CircuitBreaker.for('feeds', {
  failureThreshold: 10,
  cooldownMs: 60_000,
  timeoutMs: 15_000,
});

/** OpenAI / Groq AI calls — expensive; trip early */
export const aiCircuit = CircuitBreaker.for('ai', {
  failureThreshold: 3,
  cooldownMs: 60_000,
  timeoutMs: 30_000,
});

/** Generic external API calls */
export const externalCircuit = CircuitBreaker.for('external', {
  failureThreshold: 5,
  cooldownMs: 30_000,
  timeoutMs: 10_000,
});

// =============================================================================
// Health summary (exposed by /api/health)
// =============================================================================

/**
 * Returns the current state and failure count for every registered breaker.
 * Useful for dashboards (Grafana, Datadog) and the /api/health endpoint.
 */
export function getCircuitBreakerHealth(): Record<string, { state: CircuitState; failures: number }> {
  const health: Record<string, { state: CircuitState; failures: number }> = {};
  for (const [name, breaker] of CircuitBreaker.registry) {
    health[name] = { state: breaker.getState(), failures: breaker.getFailures() };
  }
  return health;
}
