/**
 * Data Fusion Engine — Weighted consensus from multiple data sources
 *
 * When you have N providers each reporting a slightly different number
 * (e.g., BTC price from CoinGecko, Binance, CoinCap), how do you
 * determine the "true" value?
 *
 * This engine implements multiple fusion strategies:
 *
 * 1. **Weighted Mean** — Simple weighted average using provider trust weights.
 *    Fast, but sensitive to outliers.
 *
 * 2. **Weighted Median** — Robust alternative that ignores outliers.
 *    The median weighted by provider trust scores.
 *
 * 3. **Trimmed Consensus** — Remove statistical outliers, then weighted mean.
 *    Best of both worlds: uses all good data, ignores bad.
 *
 * 4. **Bayesian Fusion** — Treats each provider as a noisy observation and
 *    computes the posterior estimate. Most theoretically sound but requires
 *    variance estimates per provider.
 *
 * The engine also computes a **confidence score** based on:
 * - Agreement between providers (low spread = high confidence)
 * - Number of providers reporting (more = higher confidence)
 * - Individual provider weights (trusted sources contribute more)
 *
 * @module providers/data-fusion
 */

import type { AnomalyFlag, DataLineage } from './types';
import { AnomalyDetector } from './anomaly-detector';

// =============================================================================
// TYPES
// =============================================================================

/**
 * A single provider's contribution to the fusion.
 */
export interface FusionInput {
  /** Provider name */
  provider: string;

  /** The reported value */
  value: number;

  /** Provider trust weight (0–1) */
  weight: number;

  /** Optional: estimated variance of this provider's readings */
  variance?: number;
}

/**
 * Result of a data fusion operation.
 */
export interface FusionResult {
  /** The fused "consensus" value */
  value: number;

  /** Confidence score (0–1) */
  confidence: number;

  /** Which strategy was used */
  strategy: FusionStrategy;

  /** Per-provider contribution details */
  contributions: Array<{
    provider: string;
    value: number;
    weight: number;
    normalizedWeight: number;
    deviation: number;
    agreedWithConsensus: boolean;
  }>;

  /** Any anomalies detected during fusion */
  anomalies: AnomalyFlag[];
}

export type FusionStrategy =
  | 'weighted_mean'
  | 'weighted_median'
  | 'trimmed_consensus'
  | 'bayesian';

export interface FusionConfig {
  /** Which strategy to use */
  strategy: FusionStrategy;

  /**
   * Maximum acceptable coefficient of variation (std/mean) before
   * confidence is penalized. Default: 0.02 (2%)
   */
  maxCoefficientOfVariation: number;

  /**
   * What fraction of outliers to trim (each side) in trimmed_consensus.
   * Default: 0.1 (remove top and bottom 10%)
   */
  trimFraction: number;

  /**
   * Minimum number of providers needed for meaningful consensus.
   * Default: 2
   */
  minProviders: number;

  /**
   * Whether to run anomaly detection on inputs.
   * Default: true
   */
  detectAnomalies: boolean;
}

const DEFAULT_FUSION_CONFIG: FusionConfig = {
  strategy: 'trimmed_consensus',
  maxCoefficientOfVariation: 0.02,
  trimFraction: 0.1,
  minProviders: 2,
  detectAnomalies: true,
};

// =============================================================================
// DATA FUSION ENGINE
// =============================================================================

/**
 * Fuses data from multiple providers into a single consensus value.
 *
 * @example
 * ```ts
 * const engine = new DataFusionEngine();
 *
 * const result = engine.fuse([
 *   { provider: 'coingecko',   value: 95000, weight: 0.4 },
 *   { provider: 'binance',     value: 95050, weight: 0.35 },
 *   { provider: 'coincap',     value: 94900, weight: 0.15 },
 *   { provider: 'coinpaprika', value: 94950, weight: 0.10 },
 * ]);
 *
 * console.log(result.value);       // ~95002 (weighted consensus)
 * console.log(result.confidence);  // 0.97 (high agreement)
 * ```
 */
export class DataFusionEngine {
  private _config: FusionConfig;
  private _detector: AnomalyDetector;

  constructor(config?: Partial<FusionConfig>) {
    this._config = { ...DEFAULT_FUSION_CONFIG, ...config };
    this._detector = new AnomalyDetector({
      zScoreThreshold: 2.0,
      crossSourceThreshold: 0.03,
    });
  }

  /**
   * Fuse multiple provider values into a single consensus value.
   */
  fuse(inputs: FusionInput[]): FusionResult {
    if (inputs.length === 0) {
      throw new Error('DataFusionEngine: No inputs provided');
    }

    // Single provider — no fusion needed
    if (inputs.length === 1) {
      return {
        value: inputs[0].value,
        confidence: 0.5, // Low confidence with single source
        strategy: this._config.strategy,
        contributions: [{
          provider: inputs[0].provider,
          value: inputs[0].value,
          weight: inputs[0].weight,
          normalizedWeight: 1,
          deviation: 0,
          agreedWithConsensus: true,
        }],
        anomalies: [],
      };
    }

    // Detect anomalies across sources
    let anomalies: AnomalyFlag[] = [];
    if (this._config.detectAnomalies) {
      const providerValues: Record<string, number> = {};
      for (const input of inputs) {
        providerValues[input.provider] = input.value;
      }
      anomalies = this._detector.checkCrossSource(providerValues);
    }

    // Apply fusion strategy
    let fusedValue: number;
    switch (this._config.strategy) {
      case 'weighted_mean':
        fusedValue = this._weightedMean(inputs);
        break;
      case 'weighted_median':
        fusedValue = this._weightedMedian(inputs);
        break;
      case 'trimmed_consensus':
        fusedValue = this._trimmedConsensus(inputs);
        break;
      case 'bayesian':
        fusedValue = this._bayesianFusion(inputs);
        break;
      default:
        fusedValue = this._weightedMean(inputs);
    }

    // Compute confidence score
    const confidence = this._computeConfidence(inputs, fusedValue);

    // Build contribution details
    const contributions = inputs.map(input => {
      const deviation = fusedValue !== 0
        ? Math.abs(input.value - fusedValue) / Math.abs(fusedValue)
        : 0;
      return {
        provider: input.provider,
        value: input.value,
        weight: input.weight,
        normalizedWeight: input.weight / inputs.reduce((sum, i) => sum + i.weight, 0),
        deviation,
        agreedWithConsensus: deviation < this._config.maxCoefficientOfVariation,
      };
    });

    return {
      value: fusedValue,
      confidence,
      strategy: this._config.strategy,
      contributions,
      anomalies,
    };
  }

  /**
   * Convenience: Build a DataLineage from a FusionResult.
   */
  toLineage(result: FusionResult, primaryProvider: string): DataLineage {
    return {
      provider: primaryProvider,
      fetchedAt: Date.now(),
      confidence: result.confidence,
      contributors: result.contributions.map(c => ({
        provider: c.provider,
        weight: c.normalizedWeight,
        agreedWithConsensus: c.agreedWithConsensus,
      })),
      anomalies: result.anomalies.length > 0 ? result.anomalies : undefined,
    };
  }

  // ===========================================================================
  // FUSION STRATEGIES
  // ===========================================================================

  /**
   * Weighted arithmetic mean.
   * Each provider's value is multiplied by its weight.
   */
  private _weightedMean(inputs: FusionInput[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const input of inputs) {
      weightedSum += input.value * input.weight;
      totalWeight += input.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Weighted median — robust alternative to weighted mean.
   *
   * Algorithm: Sort by value, walk through cumulative weight until
   * we pass the 50% mark. Interpolate if needed.
   */
  private _weightedMedian(inputs: FusionInput[]): number {
    const sorted = [...inputs].sort((a, b) => a.value - b.value);
    const totalWeight = sorted.reduce((sum, i) => sum + i.weight, 0);
    const halfWeight = totalWeight / 2;

    let cumulative = 0;
    for (let i = 0; i < sorted.length; i++) {
      cumulative += sorted[i].weight;
      if (cumulative >= halfWeight) {
        // Found the weighted median position
        if (i === 0) return sorted[0].value;
        // Interpolate between this value and the previous
        const prevCumulative = cumulative - sorted[i].weight;
        const fraction = (halfWeight - prevCumulative) / sorted[i].weight;
        return sorted[i - 1].value + fraction * (sorted[i].value - sorted[i - 1].value);
      }
    }

    return sorted[sorted.length - 1].value;
  }

  /**
   * Trimmed consensus — remove outlier providers, then weighted mean.
   *
   * 1. Compute initial weighted mean
   * 2. Compute each provider's deviation from mean
   * 3. Remove the top and bottom `trimFraction` by deviation
   * 4. Recompute weighted mean with remaining providers
   */
  private _trimmedConsensus(inputs: FusionInput[]): number {
    if (inputs.length <= 2) {
      // Can't trim with ≤2 providers
      return this._weightedMean(inputs);
    }

    // Initial estimate
    const initialMean = this._weightedMean(inputs);

    // Compute deviations
    const withDeviation = inputs.map(input => ({
      ...input,
      deviation: initialMean !== 0
        ? Math.abs(input.value - initialMean) / Math.abs(initialMean)
        : Math.abs(input.value - initialMean),
    }));

    // Sort by deviation (most deviant last)
    withDeviation.sort((a, b) => a.deviation - b.deviation);

    // Trim the most deviant providers
    const trimCount = Math.max(1, Math.floor(inputs.length * this._config.trimFraction));
    const trimmed = withDeviation.slice(0, withDeviation.length - trimCount);

    if (trimmed.length === 0) {
      return this._weightedMean(inputs); // Safety fallback
    }

    return this._weightedMean(trimmed);
  }

  /**
   * Bayesian fusion — treats each provider as a noisy observation.
   *
   * Each provider reports: value ± variance
   * The posterior estimate is:
   *   μ_posterior = Σ(value_i / σ²_i) / Σ(1 / σ²_i)
   *
   * If variance is not provided, we estimate it from the provider's weight
   * (higher weight = lower assumed variance).
   */
  private _bayesianFusion(inputs: FusionInput[]): number {
    let numerator = 0;
    let denominator = 0;

    for (const input of inputs) {
      // Estimate variance from weight if not provided
      // Higher weight → lower variance (more trusted)
      const variance = input.variance ?? (1 / (input.weight * 10 + 0.01));
      const precision = 1 / variance;

      numerator += input.value * precision;
      denominator += precision;
    }

    return denominator > 0 ? numerator / denominator : this._weightedMean(inputs);
  }

  // ===========================================================================
  // CONFIDENCE SCORING
  // ===========================================================================

  /**
   * Compute a confidence score (0–1) for the fused result.
   *
   * Factors:
   * 1. Agreement: How close are providers to each other? (coefficient of variation)
   * 2. Coverage: How many providers reported? (more = better)
   * 3. Weight: Are the agreeing providers trustworthy?
   */
  private _computeConfidence(inputs: FusionInput[], fusedValue: number): number {
    // 1. Agreement score (based on coefficient of variation)
    const values = inputs.map(i => i.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
    const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;
    const agreementScore = Math.max(0, 1 - cv / this._config.maxCoefficientOfVariation);

    // 2. Coverage score (diminishing returns after minProviders)
    const coverageScore = Math.min(
      1,
      inputs.length / Math.max(this._config.minProviders, 2),
    );

    // 3. Weight score (how much total trust weight do we have?)
    const totalWeight = inputs.reduce((sum, i) => sum + i.weight, 0);
    const maxPossibleWeight = inputs.length; // If all providers had weight=1
    const weightScore = Math.min(1, totalWeight / (maxPossibleWeight * 0.5));

    // Combine with emphasis on agreement
    const confidence =
      agreementScore * 0.5 +
      coverageScore * 0.3 +
      weightScore * 0.2;

    return Math.max(0, Math.min(1, confidence));
  }
}
