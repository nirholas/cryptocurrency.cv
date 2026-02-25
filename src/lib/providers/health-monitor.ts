/**
 * Health Monitor — Real-time provider health tracking & degradation detection
 *
 * Continuously monitors all providers and computes aggregate health metrics.
 * Provides three key capabilities:
 *
 * 1. **Per-provider health** — Success rate, latency percentiles, error tracking
 * 2. **Chain health** — Overall status (healthy/degraded/critical) for a provider chain
 * 3. **Adaptive routing** — Rerank providers by real-time performance
 *
 * Health status thresholds:
 * - **Healthy**: ≥80% of providers operational, success rate >95%
 * - **Degraded**: 50–80% of providers operational, or success rate 70–95%
 * - **Critical**: <50% of providers operational, or success rate <70%
 *
 * @module providers/health-monitor
 */

import type { ProviderHealth, ChainHealth, CircuitBreakerState } from './types';

// =============================================================================
// HEALTH THRESHOLDS
// =============================================================================

const THRESHOLDS = {
  /** Minimum provider availability for "healthy" status */
  healthyAvailability: 0.8,
  /** Minimum provider availability for "degraded" (below = critical) */
  degradedAvailability: 0.5,
  /** Success rate threshold for "healthy" */
  healthySuccessRate: 0.95,
  /** Success rate threshold for "degraded" (below = critical) */
  degradedSuccessRate: 0.70,
} as const;

// =============================================================================
// LATENCY TRACKER — Efficient percentile computation
// =============================================================================

/**
 * Tracks latency measurements using a T-Digest-inspired approach.
 * Maintains a sorted buffer of recent measurements for percentile queries.
 */
class LatencyTracker {
  private _measurements: number[] = [];
  private _maxSize: number;

  constructor(maxSize = 200) {
    this._maxSize = maxSize;
  }

  record(latencyMs: number): void {
    this._measurements.push(latencyMs);
    if (this._measurements.length > this._maxSize) {
      this._measurements.shift(); // Remove oldest
    }
  }

  get average(): number {
    if (this._measurements.length === 0) return 0;
    return this._measurements.reduce((a, b) => a + b, 0) / this._measurements.length;
  }

  percentile(p: number): number {
    if (this._measurements.length === 0) return 0;
    const sorted = [...this._measurements].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  get count(): number {
    return this._measurements.length;
  }
}

// =============================================================================
// PROVIDER STATUS — Internal tracking state
// =============================================================================

interface ProviderStatus {
  name: string;
  circuitState: CircuitBreakerState;
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  latency: LatencyTracker;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
  lastError: string | null;
  startedAt: number;

  // Sliding window for recent success rate
  recentOutcomes: boolean[];
  windowSize: number;
}

// =============================================================================
// HEALTH MONITOR
// =============================================================================

/**
 * Monitors health of all providers in a chain.
 *
 * @example
 * ```ts
 * const monitor = new HealthMonitor('market-prices');
 *
 * // Record outcomes as they happen
 * monitor.recordSuccess('coingecko', 150);
 * monitor.recordSuccess('binance', 80);
 * monitor.recordFailure('coincap', 'timeout', 5000);
 *
 * // Get health snapshot
 * const health = monitor.getChainHealth();
 * console.log(health.status);  // 'healthy'
 * console.log(health.providers[0].successRate); // 1.0
 *
 * // Get provider ranking (best first)
 * const ranked = monitor.rankProviders();
 * // ['binance', 'coingecko', 'coincap']  (by latency + success rate)
 * ```
 */
export class HealthMonitor {
  private _chainName: string;
  private _providers: Map<string, ProviderStatus> = new Map();
  private _windowSize: number;

  constructor(chainName: string, windowSize = 50) {
    this._chainName = chainName;
    this._windowSize = windowSize;
  }

  // ===========================================================================
  // RECORDING
  // ===========================================================================

  /**
   * Record a successful request to a provider.
   */
  recordSuccess(providerName: string, latencyMs: number): void {
    const status = this._getOrCreateStatus(providerName);
    status.totalRequests++;
    status.totalSuccesses++;
    status.lastSuccessAt = Date.now();
    status.latency.record(latencyMs);
    this._pushOutcome(status, true);
  }

  /**
   * Record a failed request to a provider.
   */
  recordFailure(providerName: string, error: string, latencyMs: number): void {
    const status = this._getOrCreateStatus(providerName);
    status.totalRequests++;
    status.totalFailures++;
    status.lastFailureAt = Date.now();
    status.lastError = error;
    status.latency.record(latencyMs);
    this._pushOutcome(status, false);
  }

  /**
   * Update the circuit breaker state for a provider.
   */
  updateCircuitState(providerName: string, state: CircuitBreakerState): void {
    const status = this._getOrCreateStatus(providerName);
    status.circuitState = state;
  }

  // ===========================================================================
  // HEALTH QUERIES
  // ===========================================================================

  /**
   * Get the health status of a single provider.
   */
  getProviderHealth(providerName: string): ProviderHealth | null {
    const status = this._providers.get(providerName);
    if (!status) return null;
    return this._buildProviderHealth(status);
  }

  /**
   * Get aggregate health of the entire provider chain.
   */
  getChainHealth(): ChainHealth {
    const providers = Array.from(this._providers.values())
      .map(s => this._buildProviderHealth(s));

    const available = providers.filter(p => p.isHealthy).length;
    const total = providers.length;
    const availability = total > 0 ? available / total : 0;

    // Compute average success rate across all providers
    const avgSuccessRate = providers.length > 0
      ? providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length
      : 1;

    let status: 'healthy' | 'degraded' | 'critical';
    if (
      availability >= THRESHOLDS.healthyAvailability &&
      avgSuccessRate >= THRESHOLDS.healthySuccessRate
    ) {
      status = 'healthy';
    } else if (
      availability >= THRESHOLDS.degradedAvailability &&
      avgSuccessRate >= THRESHOLDS.degradedSuccessRate
    ) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return {
      chainName: this._chainName,
      status,
      availableProviders: available,
      totalProviders: total,
      providers,
      timestamp: Date.now(),
    };
  }

  /**
   * Rank providers by composite score (latency + reliability).
   * Returns provider names sorted best-first.
   *
   * Score formula: success_rate * 0.7 + (1 - normalized_latency) * 0.3
   * This weights reliability over speed, but fast+reliable wins.
   */
  rankProviders(): string[] {
    const providers = Array.from(this._providers.values());
    if (providers.length === 0) return [];

    // Find max latency for normalization
    const maxLatency = Math.max(
      ...providers.map(p => p.latency.average),
      1, // avoid division by zero
    );

    return providers
      .map(status => {
        const health = this._buildProviderHealth(status);
        const normalizedLatency = health.avgLatencyMs / maxLatency;
        const score = health.successRate * 0.7 + (1 - normalizedLatency) * 0.3;
        return { name: status.name, score, isHealthy: health.isHealthy };
      })
      // Healthy providers always rank above unhealthy
      .sort((a, b) => {
        if (a.isHealthy !== b.isHealthy) return a.isHealthy ? -1 : 1;
        return b.score - a.score;
      })
      .map(p => p.name);
  }

  /**
   * Get a summary string for logging/monitoring.
   */
  summary(): string {
    const health = this.getChainHealth();
    const lines = [
      `[${health.chainName}] Status: ${health.status.toUpperCase()} ` +
      `(${health.availableProviders}/${health.totalProviders} providers)`,
    ];

    for (const p of health.providers) {
      const state = p.circuitState.padEnd(9);
      const rate = (p.successRate * 100).toFixed(1).padStart(5) + '%';
      const latency = p.avgLatencyMs.toFixed(0).padStart(5) + 'ms';
      const status = p.isHealthy ? '✓' : '✗';
      lines.push(`  ${status} ${p.provider.padEnd(20)} ${state} ${rate} ${latency}`);
    }

    return lines.join('\n');
  }

  // ===========================================================================
  // INTERNAL
  // ===========================================================================

  private _getOrCreateStatus(name: string): ProviderStatus {
    let status = this._providers.get(name);
    if (!status) {
      status = {
        name,
        circuitState: 'CLOSED',
        totalRequests: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        latency: new LatencyTracker(),
        lastSuccessAt: null,
        lastFailureAt: null,
        lastError: null,
        startedAt: Date.now(),
        recentOutcomes: [],
        windowSize: this._windowSize,
      };
      this._providers.set(name, status);
    }
    return status;
  }

  private _pushOutcome(status: ProviderStatus, success: boolean): void {
    status.recentOutcomes.push(success);
    while (status.recentOutcomes.length > status.windowSize) {
      status.recentOutcomes.shift();
    }
  }

  private _buildProviderHealth(status: ProviderStatus): ProviderHealth {
    const recentSuccesses = status.recentOutcomes.filter(Boolean).length;
    const recentTotal = status.recentOutcomes.length;
    const successRate = recentTotal > 0 ? recentSuccesses / recentTotal : 1;

    const isHealthy = status.circuitState === 'CLOSED' && successRate >= THRESHOLDS.degradedSuccessRate;

    const elapsed = Date.now() - status.startedAt;
    // Approximate uptime: ratio of successes to total, weighted by time
    const uptime = status.totalRequests > 0
      ? status.totalSuccesses / status.totalRequests
      : 1;

    return {
      provider: status.name,
      circuitState: status.circuitState,
      isHealthy,
      avgLatencyMs: status.latency.average,
      p99LatencyMs: status.latency.percentile(99),
      successRate,
      totalRequests: status.totalRequests,
      totalFailures: status.totalFailures,
      lastSuccessAt: status.lastSuccessAt,
      lastFailureAt: status.lastFailureAt,
      lastError: status.lastError,
      uptime,
    };
  }
}
