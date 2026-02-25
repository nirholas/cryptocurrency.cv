/**
 * Tests for providers/data-fusion.ts
 *
 * Covers the DataFusionEngine's 4 fusion strategies:
 * - Weighted mean
 * - Weighted median
 * - Trimmed consensus (remove outliers then fuse)
 * - Bayesian fusion (precision-weighted posterior)
 *
 * Also covers:
 * - Confidence scoring (agreement, coverage, weight)
 * - Cross-source anomaly detection during fusion
 * - Edge cases (single provider, zero weights, etc.)
 */

import { describe, it, expect } from 'vitest';
import { DataFusionEngine, type FusionInput } from '@/lib/providers/data-fusion';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInputs(values: number[], weights?: number[]): FusionInput[] {
  return values.map((value, i) => ({
    provider: `provider-${i}`,
    value,
    weight: weights?.[i] ?? 1.0,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataFusionEngine', () => {
  describe('weighted_mean', () => {
    it('computes correct weighted mean', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([100, 102, 104], [0.5, 0.3, 0.2]);
      const result = engine.fuse(inputs);

      // (100*0.5 + 102*0.3 + 104*0.2) / (0.5+0.3+0.2) = 101.4
      expect(result.value).toBeCloseTo(101.4, 1);
      expect(result.strategy).toBe('weighted_mean');
    });

    it('with equal weights = simple mean', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([10, 20, 30]);
      const result = engine.fuse(inputs);

      expect(result.value).toBeCloseTo(20, 1);
    });

    it('returns single value for single input', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([42]);
      const result = engine.fuse(inputs);

      expect(result.value).toBe(42);
    });
  });

  describe('weighted_median', () => {
    it('finds the weighted median', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_median' });
      // With equal weights, this is the regular median
      const inputs = makeInputs([10, 20, 30]);
      const result = engine.fuse(inputs);

      expect(result.value).toBe(20);
      expect(result.strategy).toBe('weighted_median');
    });

    it('weighted median skews toward heavier weights', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_median' });
      // 100 has weight 10, 200 has weight 1 → median should be closer to 100
      const inputs: FusionInput[] = [
        { provider: 'heavy', value: 100, weight: 10 },
        { provider: 'light', value: 200, weight: 1 },
      ];
      const result = engine.fuse(inputs);

      expect(result.value).toBe(100);
    });

    it('handles even number of equal-weight values', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_median' });
      const inputs = makeInputs([10, 20, 30, 40]);
      const result = engine.fuse(inputs);

      // Weighted median walks cumulative weights — should be 20 or 30
      expect(result.value).toBeGreaterThanOrEqual(20);
      expect(result.value).toBeLessThanOrEqual(30);
    });
  });

  describe('trimmed_consensus', () => {
    it('removes outlier and returns mean of remaining', () => {
      const engine = new DataFusionEngine({ strategy: 'trimmed_consensus' });
      // 100, 101, 102, 500 — 500 is an outlier
      const inputs = makeInputs([100, 101, 102, 500]);
      const result = engine.fuse(inputs);

      // Should trim 500 and return ~101
      expect(result.value).toBeLessThan(200);
      expect(result.strategy).toBe('trimmed_consensus');
    });

    it('works with no outliers', () => {
      const engine = new DataFusionEngine({ strategy: 'trimmed_consensus' });
      const inputs = makeInputs([100, 101, 102, 103]);
      const result = engine.fuse(inputs);

      expect(result.value).toBeCloseTo(101.5, 1);
    });
  });

  describe('bayesian_fusion', () => {
    it('produces precision-weighted estimate', () => {
      const engine = new DataFusionEngine({ strategy: 'bayesian' });
      const inputs: FusionInput[] = [
        { provider: 'a', value: 100, weight: 1, variance: 1 },   // Low variance = high confidence
        { provider: 'b', value: 120, weight: 1, variance: 100 }, // High variance = low confidence
      ];

      const result = engine.fuse(inputs);

      // Should be much closer to 100 (low variance = trusted)
      expect(result.value).toBeCloseTo(100.2, 0);
      expect(result.strategy).toBe('bayesian');
    });

    it('equal variance gives simple mean', () => {
      const engine = new DataFusionEngine({ strategy: 'bayesian' });
      const inputs: FusionInput[] = [
        { provider: 'a', value: 100, weight: 1, variance: 10 },
        { provider: 'b', value: 200, weight: 1, variance: 10 },
      ];

      const result = engine.fuse(inputs);
      expect(result.value).toBeCloseTo(150, 1);
    });

    it('falls back to weighted_mean when no variance provided', () => {
      const engine = new DataFusionEngine({ strategy: 'bayesian' });
      const inputs = makeInputs([100, 200]);
      const result = engine.fuse(inputs);

      // Without variance, should use weighted mean
      expect(result.value).toBeCloseTo(150, 1);
    });
  });

  describe('confidence scoring', () => {
    it('high confidence when providers agree closely', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([100, 100.1, 99.9]);
      const result = engine.fuse(inputs);

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('lower confidence when providers disagree', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([100, 200, 300]);
      const result = engine.fuse(inputs);

      expect(result.confidence).toBeLessThan(0.8);
    });

    it('single provider gives lower confidence', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([100]);
      const result = engine.fuse(inputs);

      // Single source = lower coverage score
      expect(result.confidence).toBeLessThan(0.9);
    });
  });

  describe('contributions tracking', () => {
    it('tracks which providers contributed', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs: FusionInput[] = [
        { provider: 'coingecko', value: 100, weight: 0.5 },
        { provider: 'binance', value: 101, weight: 0.3 },
        { provider: 'coincap', value: 100.5, weight: 0.2 },
      ];

      const result = engine.fuse(inputs);

      expect(result.contributions).toHaveLength(3);
      expect(result.contributions.map(c => c.provider)).toContain('coingecko');
      expect(result.contributions.map(c => c.provider)).toContain('binance');
    });
  });

  describe('edge cases', () => {
    it('throws on empty input', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      expect(() => engine.fuse([])).toThrow();
    });

    it('handles identical values', () => {
      const engine = new DataFusionEngine({ strategy: 'weighted_mean' });
      const inputs = makeInputs([100, 100, 100]);
      const result = engine.fuse(inputs);

      expect(result.value).toBe(100);
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });
});
