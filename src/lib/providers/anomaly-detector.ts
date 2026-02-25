/**
 * Anomaly Detector — Statistical outlier detection on streaming data
 *
 * Detects anomalies in real-time data using multiple statistical methods:
 *
 * 1. **Z-Score Detection** — Flags values that deviate significantly from
 *    the rolling mean. Uses Welford's online algorithm for numerically
 *    stable incremental variance computation.
 *
 * 2. **IQR (Interquartile Range)** — Robust outlier detection that is
 *    resistant to the outliers themselves (unlike z-score).
 *
 * 3. **Spike Detection** — Detects sudden changes between consecutive
 *    values that exceed a threshold.
 *
 * 4. **Staleness Detection** — Flags data that hasn't changed when
 *    it should be updating (e.g., a "live" price stuck for 5 minutes).
 *
 * 5. **Cross-Source Mismatch** — Compares values from multiple providers
 *    and flags significant disagreements.
 *
 * The detector maintains a rolling window of values using an efficient
 * ring buffer, so memory usage is constant regardless of data volume.
 *
 * @module providers/anomaly-detector
 * @see {@link https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm Welford's Algorithm}
 */

import type { AnomalyDetectorConfig, AnomalyFlag, AnomalyType } from './types';
import { DEFAULT_ANOMALY_CONFIG } from './types';

// =============================================================================
// RING BUFFER — Efficient fixed-size circular buffer
// =============================================================================

/**
 * A ring buffer that maintains the last N values with O(1) insertion.
 * No array shifting, no memory allocation after initialization.
 */
class RingBuffer<T> {
  private _buffer: (T | undefined)[];
  private _head = 0;
  private _size = 0;
  private _capacity: number;

  constructor(capacity: number) {
    this._capacity = capacity;
    this._buffer = new Array(capacity);
  }

  push(value: T): void {
    this._buffer[this._head] = value;
    this._head = (this._head + 1) % this._capacity;
    if (this._size < this._capacity) this._size++;
  }

  /** Get all values in insertion order (oldest first) */
  toArray(): T[] {
    if (this._size === 0) return [];
    const result: T[] = [];
    const start = this._size < this._capacity
      ? 0
      : this._head;
    for (let i = 0; i < this._size; i++) {
      const idx = (start + i) % this._capacity;
      result.push(this._buffer[idx] as T);
    }
    return result;
  }

  /** Get the most recently pushed value */
  latest(): T | undefined {
    if (this._size === 0) return undefined;
    const idx = (this._head - 1 + this._capacity) % this._capacity;
    return this._buffer[idx];
  }

  get size(): number { return this._size; }
  get capacity(): number { return this._capacity; }
}

// =============================================================================
// WELFORD'S ONLINE STATISTICS
// =============================================================================

/**
 * Numerically stable online algorithm for computing running mean and variance.
 * Does not require storing all values — updates incrementally.
 *
 * @see https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm
 */
class WelfordStats {
  private _count = 0;
  private _mean = 0;
  private _m2 = 0;

  update(value: number): void {
    this._count++;
    const delta = value - this._mean;
    this._mean += delta / this._count;
    const delta2 = value - this._mean;
    this._m2 += delta * delta2;
  }

  get count(): number { return this._count; }
  get mean(): number { return this._mean; }

  get variance(): number {
    if (this._count < 2) return 0;
    return this._m2 / (this._count - 1);
  }

  get standardDeviation(): number {
    return Math.sqrt(this.variance);
  }

  /**
   * Compute the z-score for a given value.
   * Returns 0 if insufficient data or zero variance.
   */
  zScore(value: number): number {
    const sd = this.standardDeviation;
    if (sd === 0 || this._count < 2) return 0;
    return (value - this._mean) / sd;
  }
}

// =============================================================================
// ANOMALY DETECTOR
// =============================================================================

/**
 * Timestamped data point for the anomaly detector.
 */
interface DataPoint {
  value: number;
  timestamp: number;
  provider: string;
}

/**
 * Detects anomalies in streaming numeric data using multiple statistical methods.
 *
 * @example
 * ```ts
 * const detector = new AnomalyDetector({ zScoreThreshold: 2.5 });
 *
 * // Feed it normal Bitcoin prices
 * detector.addValue(95000, 'coingecko');
 * detector.addValue(95100, 'coinpaprika');
 * detector.addValue(94900, 'coincap');
 *
 * // Now feed it a suspicious value
 * const flags = detector.addValue(85000, 'sketch-exchange');
 * // flags = [{ type: 'outlier', severity: 0.95, ... }]
 *
 * // Cross-source check
 * const mismatches = detector.checkCrossSource({
 *   coingecko: 95000,
 *   coinpaprika: 95100,
 *   sketch:      85000,  // ← flagged
 * });
 * ```
 */
export class AnomalyDetector {
  private _config: AnomalyDetectorConfig;
  private _history: RingBuffer<DataPoint>;
  private _stats: WelfordStats;
  private _lastValue: number | null = null;
  private _lastTimestamp: number | null = null;

  constructor(config?: Partial<AnomalyDetectorConfig>) {
    this._config = { ...DEFAULT_ANOMALY_CONFIG, ...config };
    this._history = new RingBuffer<DataPoint>(this._config.windowSize);
    this._stats = new WelfordStats();
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /**
   * Add a new value and run all anomaly checks.
   *
   * @param value - The numeric value to check
   * @param provider - Which provider reported this value
   * @returns Array of anomaly flags (empty if clean)
   */
  addValue(value: number, provider: string): AnomalyFlag[] {
    const now = Date.now();
    const flags: AnomalyFlag[] = [];

    // Run detection BEFORE adding to stats (so the value doesn't influence its own check)
    if (this._stats.count >= this._config.minSampleSize) {
      // 1. Z-Score outlier detection
      const zFlag = this._checkZScore(value, provider, now);
      if (zFlag) flags.push(zFlag);

      // 2. Spike detection (sudden change from last value)
      const spikeFlag = this._checkSpike(value, provider, now);
      if (spikeFlag) flags.push(spikeFlag);
    }

    // 3. Staleness detection
    const staleFlag = this._checkStaleness(value, provider, now);
    if (staleFlag) flags.push(staleFlag);

    // 4. Missing value detection
    if (value === null || value === undefined || Number.isNaN(value)) {
      flags.push({
        type: 'missing',
        severity: 1.0,
        message: `Missing or NaN value from ${provider}`,
        value: NaN,
        expected: this._stats.mean,
        provider,
        detectedAt: now,
      });
      return flags; // Don't add NaN to stats
    }

    // Update statistics and history
    this._stats.update(value);
    this._history.push({ value, timestamp: now, provider });
    this._lastValue = value;
    this._lastTimestamp = now;

    return flags;
  }

  /**
   * Check for cross-source mismatches.
   * Call this with values from all providers for the same data point.
   *
   * @param providerValues - Map of provider name → reported value
   * @returns Array of anomaly flags for providers that disagree with consensus
   */
  checkCrossSource(providerValues: Record<string, number>): AnomalyFlag[] {
    const entries = Object.entries(providerValues).filter(
      ([, v]) => v !== null && v !== undefined && !Number.isNaN(v),
    );

    if (entries.length < 2) return [];

    const values = entries.map(([, v]) => v);
    const median = this._median(values);
    const flags: AnomalyFlag[] = [];
    const now = Date.now();

    for (const [provider, value] of entries) {
      const deviation = median !== 0
        ? Math.abs(value - median) / Math.abs(median)
        : 0;

      if (deviation > this._config.crossSourceThreshold) {
        flags.push({
          type: 'cross_source_mismatch',
          severity: Math.min(deviation / (this._config.crossSourceThreshold * 3), 1),
          message: `${provider} reports ${value.toFixed(2)}, ` +
            `${(deviation * 100).toFixed(1)}% from median ${median.toFixed(2)}`,
          value,
          expected: median,
          provider,
          detectedAt: now,
        });
      }
    }

    return flags;
  }

  /**
   * Perform IQR-based outlier detection on the current window.
   * More robust than z-score for skewed distributions.
   *
   * @returns Values in the window that are outliers
   */
  getIQROutliers(): Array<{ value: number; provider: string; isOutlier: boolean }> {
    const points = this._history.toArray();
    if (points.length < 4) return [];

    const sorted = [...points].sort((a, b) => a.value - b.value);
    const q1 = this._percentile(sorted.map(p => p.value), 25);
    const q3 = this._percentile(sorted.map(p => p.value), 75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;

    return points.map(p => ({
      value: p.value,
      provider: p.provider,
      isOutlier: p.value < lowerFence || p.value > upperFence,
    }));
  }

  /**
   * Get current statistics for monitoring/debugging.
   */
  getStats(): {
    mean: number;
    standardDeviation: number;
    sampleSize: number;
    windowSize: number;
    lastValue: number | null;
  } {
    return {
      mean: this._stats.mean,
      standardDeviation: this._stats.standardDeviation,
      sampleSize: this._stats.count,
      windowSize: this._history.size,
      lastValue: this._lastValue,
    };
  }

  // ===========================================================================
  // INTERNAL — Detection methods
  // ===========================================================================

  private _checkZScore(
    value: number,
    provider: string,
    now: number,
  ): AnomalyFlag | null {
    const z = this._stats.zScore(value);

    if (Math.abs(z) > this._config.zScoreThreshold) {
      return {
        type: 'outlier',
        severity: Math.min(Math.abs(z) / (this._config.zScoreThreshold * 2), 1),
        message: `z-score ${z.toFixed(2)} exceeds threshold ±${this._config.zScoreThreshold}`,
        value,
        expected: this._stats.mean,
        provider,
        detectedAt: now,
      };
    }

    return null;
  }

  private _checkSpike(
    value: number,
    provider: string,
    now: number,
  ): AnomalyFlag | null {
    if (this._lastValue === null) return null;

    const change = this._lastValue !== 0
      ? Math.abs(value - this._lastValue) / Math.abs(this._lastValue)
      : 0;

    // A >10% change between consecutive readings is suspicious
    const spikeThreshold = 0.10;
    if (change > spikeThreshold) {
      return {
        type: 'spike',
        severity: Math.min(change / (spikeThreshold * 3), 1),
        message: `${(change * 100).toFixed(1)}% change from previous value`,
        value,
        expected: this._lastValue,
        provider,
        detectedAt: now,
      };
    }

    return null;
  }

  private _checkStaleness(
    value: number,
    _provider: string,
    now: number,
  ): AnomalyFlag | null {
    if (this._lastValue === null || this._lastTimestamp === null) return null;

    const timeSinceLastUpdate = (now - this._lastTimestamp) / 1000;

    // Data is stale if: same value AND enough time has passed
    if (
      value === this._lastValue &&
      timeSinceLastUpdate > this._config.staleThresholdSeconds
    ) {
      return {
        type: 'stale',
        severity: Math.min(
          timeSinceLastUpdate / (this._config.staleThresholdSeconds * 3),
          1,
        ),
        message: `Value unchanged for ${timeSinceLastUpdate.toFixed(0)}s ` +
          `(threshold: ${this._config.staleThresholdSeconds}s)`,
        value,
        expected: value, // no expected different value, it's about time
        detectedAt: now,
      };
    }

    return null;
  }

  // ===========================================================================
  // INTERNAL — Statistical utilities
  // ===========================================================================

  private _median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private _percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}
