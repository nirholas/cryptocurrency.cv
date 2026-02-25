/**
 * Tests for providers/anomaly-detector.ts
 *
 * Covers statistical anomaly detection:
 * - Z-score detection on streaming data
 * - Spike detection (sudden large jumps)
 * - Staleness detection (stale data)
 * - Cross-source mismatch detection
 * - IQR outlier detection
 * - Ring buffer (O(1) circular buffer)
 * - Welford's online algorithm for mean/variance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnomalyDetector } from '@/lib/providers/anomaly-detector';
import type { AnomalyDetectorConfig } from '@/lib/providers/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAST_CONFIG: Partial<AnomalyDetectorConfig> = {
  zScoreThreshold: 2.0,
  minSampleSize: 5,
  windowSize: 20,
  staleThresholdSeconds: 10,
  crossSourceThreshold: 0.02, // 2% disagreement
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AnomalyDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns no anomalies for consistent data', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    // Feed 10 values around 100 with low variance
    const values = [100, 100.5, 99.5, 100.2, 99.8, 100.1, 99.9, 100.3, 99.7, 100.4];
    let anomalies: ReturnType<typeof det.addValue> = [];
    for (const v of values) {
      anomalies = det.addValue(v, 'test-provider');
    }

    expect(anomalies).toHaveLength(0);
  });

  it('detects z-score outliers', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    // Feed consistent data to build baseline
    for (let i = 0; i < 10; i++) {
      det.addValue(100 + (Math.random() - 0.5) * 0.1, 'test');
    }

    // Now add an extreme outlier
    const anomalies = det.addValue(200, 'test');
    const zScoreAnomaly = anomalies.find(a => a.type === 'outlier');
    expect(zScoreAnomaly).toBeDefined();
    expect(zScoreAnomaly!.severity).toBeGreaterThan(0);
  });

  it('detects spikes (sudden large jumps)', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    // Stable values
    for (let i = 0; i < 10; i++) {
      det.addValue(100, 'test');
    }

    // Add a 50% spike — should trigger spike detection
    const anomalies = det.addValue(150, 'test');
    const spike = anomalies.find(a => a.type === 'spike');
    expect(spike).toBeDefined();
  });

  it('detects staleness', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    // Add a value
    det.addValue(100, 'test');

    // Advance time beyond stale threshold
    vi.advanceTimersByTime(11_000);

    // Next value should report staleness
    const anomalies = det.addValue(100, 'test');
    const stale = anomalies.find(a => a.type === 'stale');
    expect(stale).toBeDefined();
  });

  it('detects cross-source mismatches', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    // 3% disagreement with 2% threshold → should flag
    const results = det.checkCrossSource({
      coingecko: 100,
      binance: 103.1, // 3.1% deviation
      coincap: 100.5,
    });

    const mismatch = results.find(a => a.type === 'cross_source_mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch!.message).toContain('binance');
  });

  it('does not flag cross-source when within threshold', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    const results = det.checkCrossSource({
      coingecko: 100,
      binance: 101, // 1% — within 2% threshold
      coincap: 100.5,
    });

    expect(results).toHaveLength(0);
  });

  it('getIQROutliers identifies extreme values', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    // Normal-ish data + one outlier
    const data = [10, 11, 12, 13, 14, 15, 16, 17, 18, 100];
    for (const v of data) {
      det.addValue(v, 'test');
    }

    const outliers = det.getIQROutliers();
    const outlierValues = outliers.filter(o => o.isOutlier).map(o => o.value);
    expect(outlierValues).toContain(100);
    expect(outlierValues).not.toContain(14);
  });

  it('getStats returns current mean and stddev', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    for (let i = 1; i <= 10; i++) {
      det.addValue(i * 10, 'test'); // 10, 20, 30, ..., 100
    }

    const stats = det.getStats();
    expect(stats.mean).toBeCloseTo(55, 0); // mean of 10..100
    expect(stats.sampleSize).toBe(10);
    expect(stats.standardDeviation).toBeGreaterThan(0);
  });

  it('respects minSampleSize — no z-score anomalies until enough data', () => {
    const det = new AnomalyDetector({ ...FAST_CONFIG, minSampleSize: 10 });

    // Add only 4 values then an extreme one
    for (let i = 0; i < 4; i++) {
      det.addValue(100, 'test');
    }

    const anomalies = det.addValue(999, 'test');
    // Should NOT have z-score anomaly because < minSampleSize
    // But MAY have spike anomaly
    const zScore = anomalies.find(a => a.type === 'outlier');
    expect(zScore).toBeUndefined();
  });

  it('handles single-source cross-source gracefully', () => {
    const det = new AnomalyDetector(FAST_CONFIG);

    const results = det.checkCrossSource({
      coingecko: 100,
    });

    // Single source = nothing to compare
    expect(results).toHaveLength(0);
  });
});
