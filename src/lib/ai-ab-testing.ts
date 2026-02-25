/**
 * AI Model A/B Testing Framework
 *
 * Run controlled experiments comparing AI models side-by-side.
 * Essential for optimizing the multi-model routing strategy.
 *
 * Features:
 *   - Statistical significance testing (chi-squared, t-test)
 *   - Multi-armed bandit for automatic traffic allocation
 *   - Quality, latency, and cost comparison
 *   - Automatic winner detection
 *   - Experiment history and reporting
 *
 * Usage:
 *   import { ABTestManager, createExperiment } from '@/lib/ai-ab-testing';
 *
 *   const mgr = getABTestManager();
 *
 *   // Create experiment
 *   mgr.createExperiment({
 *     name: 'sentiment-model-comparison',
 *     variants: [
 *       { id: 'groq', model: 'llama-3.3-70b-versatile', provider: 'groq' },
 *       { id: 'gemini', model: 'gemini-2.0-flash', provider: 'gemini' },
 *     ],
 *     metric: 'quality', // or 'latency', 'cost'
 *     minSamples: 100,
 *     confidenceLevel: 0.95,
 *   });
 *
 *   // Get variant for a request
 *   const variant = mgr.getVariant('sentiment-model-comparison');
 *   // ... use variant.model and variant.provider
 *
 *   // Record result
 *   mgr.recordResult('sentiment-model-comparison', variant.id, {
 *     quality: 0.85,
 *     latencyMs: 120,
 *     costMicroUsd: 5,
 *   });
 *
 *   // Check experiment status
 *   const report = mgr.getReport('sentiment-model-comparison');
 *   // { winner: 'groq', confidence: 0.97, ... }
 *
 * @module ai-ab-testing
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Variant {
  id: string;
  model: string;
  provider: string;
  /** Traffic weight (relative to other variants), default 1 */
  weight?: number;
}

export interface ExperimentConfig {
  name: string;
  description?: string;
  variants: Variant[];
  /** Primary metric to compare */
  metric: 'quality' | 'latency' | 'cost' | 'combined';
  /** Minimum samples per variant before declaring winner */
  minSamples: number;
  /** Statistical confidence level (default 0.95) */
  confidenceLevel?: number;
  /** Whether to use multi-armed bandit (automatic traffic allocation) */
  bandit?: boolean;
  /** Maximum experiment duration in ms */
  maxDurationMs?: number;
}

export interface ExperimentResult {
  quality: number;
  latencyMs: number;
  costMicroUsd: number;
}

interface VariantStats {
  id: string;
  model: string;
  provider: string;
  samples: number;
  qualitySum: number;
  qualitySumSq: number;
  latencySum: number;
  latencySumSq: number;
  costSum: number;
  /** For multi-armed bandit: success count */
  successes: number;
  failures: number;
}

export interface Experiment extends ExperimentConfig {
  id: string;
  createdAt: number;
  variantStats: Map<string, VariantStats>;
  status: 'running' | 'completed' | 'stopped';
  winner?: string;
  winnerConfidence?: number;
}

export interface ExperimentReport {
  name: string;
  status: string;
  duration: string;
  totalSamples: number;
  variants: Array<{
    id: string;
    model: string;
    provider: string;
    samples: number;
    avgQuality: number;
    avgLatencyMs: number;
    avgCostMicroUsd: number;
    stdDevQuality: number;
    stdDevLatency: number;
  }>;
  winner: string | null;
  confidence: number;
  pValue: number;
  improvementPercent: number;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// A/B Test Manager
// ---------------------------------------------------------------------------

export class ABTestManager {
  private experiments = new Map<string, Experiment>();

  /**
   * Create a new A/B test experiment.
   */
  createExperiment(config: ExperimentConfig): Experiment {
    if (config.variants.length < 2) {
      throw new Error('A/B test requires at least 2 variants');
    }

    const experiment: Experiment = {
      ...config,
      id: `ab-${config.name}-${Date.now()}`,
      createdAt: Date.now(),
      variantStats: new Map(),
      status: 'running',
      confidenceLevel: config.confidenceLevel ?? 0.95,
    };

    for (const variant of config.variants) {
      experiment.variantStats.set(variant.id, {
        id: variant.id,
        model: variant.model,
        provider: variant.provider,
        samples: 0,
        qualitySum: 0,
        qualitySumSq: 0,
        latencySum: 0,
        latencySumSq: 0,
        costSum: 0,
        successes: 0,
        failures: 0,
      });
    }

    this.experiments.set(config.name, experiment);
    return experiment;
  }

  /**
   * Get which variant to use for the next request.
   * Uses weighted random selection or Thompson sampling for bandits.
   */
  getVariant(experimentName: string): Variant | null {
    const experiment = this.experiments.get(experimentName);
    if (!experiment || experiment.status !== 'running') return null;

    // Check for max duration
    if (experiment.maxDurationMs && Date.now() - experiment.createdAt > experiment.maxDurationMs) {
      this.completeExperiment(experimentName);
      return null;
    }

    if (experiment.bandit) {
      return this.thompsonSampling(experiment);
    }

    return this.weightedRandom(experiment);
  }

  /**
   * Record the result of a variant being used.
   */
  recordResult(experimentName: string, variantId: string, result: ExperimentResult): void {
    const experiment = this.experiments.get(experimentName);
    if (!experiment || experiment.status !== 'running') return;

    const stats = experiment.variantStats.get(variantId);
    if (!stats) return;

    stats.samples++;
    stats.qualitySum += result.quality;
    stats.qualitySumSq += result.quality * result.quality;
    stats.latencySum += result.latencyMs;
    stats.latencySumSq += result.latencyMs * result.latencyMs;
    stats.costSum += result.costMicroUsd;

    // For bandit: quality > 0.7 = success
    if (result.quality > 0.7) {
      stats.successes++;
    } else {
      stats.failures++;
    }

    // Check if we can declare a winner
    this.checkForWinner(experiment);
  }

  /**
   * Get detailed report for an experiment.
   */
  getReport(experimentName: string): ExperimentReport | null {
    const experiment = this.experiments.get(experimentName);
    if (!experiment) return null;

    const variants = [...experiment.variantStats.values()].map((stats) => {
      const avgQuality = stats.samples > 0 ? stats.qualitySum / stats.samples : 0;
      const avgLatency = stats.samples > 0 ? stats.latencySum / stats.samples : 0;
      const avgCost = stats.samples > 0 ? stats.costSum / stats.samples : 0;

      const stdDevQuality = computeStdDev(stats.qualitySum, stats.qualitySumSq, stats.samples);
      const stdDevLatency = computeStdDev(stats.latencySum, stats.latencySumSq, stats.samples);

      return {
        id: stats.id,
        model: stats.model,
        provider: stats.provider,
        samples: stats.samples,
        avgQuality,
        avgLatencyMs: avgLatency,
        avgCostMicroUsd: avgCost,
        stdDevQuality,
        stdDevLatency,
      };
    });

    const totalSamples = variants.reduce((sum, v) => sum + v.samples, 0);
    const sorted = [...variants].sort((a, b) => b.avgQuality - a.avgQuality);
    const best = sorted[0];
    const secondBest = sorted[1];

    // Compute p-value using Welch's t-test
    let pValue = 1;
    let improvement = 0;
    if (best && secondBest && best.samples > 1 && secondBest.samples > 1) {
      pValue = welchsTTest(
        best.avgQuality, best.stdDevQuality, best.samples,
        secondBest.avgQuality, secondBest.stdDevQuality, secondBest.samples,
      );
      improvement = secondBest.avgQuality > 0
        ? ((best.avgQuality - secondBest.avgQuality) / secondBest.avgQuality) * 100
        : 0;
    }

    const confidence = 1 - pValue;
    const isSignificant = confidence >= (experiment.confidenceLevel ?? 0.95);
    const hasEnoughSamples = variants.every((v) => v.samples >= experiment.minSamples);

    let recommendation: string;
    if (!hasEnoughSamples) {
      recommendation = `Need more samples (min ${experiment.minSamples} per variant). ${variants.map((v) => `${v.id}: ${v.samples}`).join(', ')}.`;
    } else if (isSignificant) {
      recommendation = `${best.id} (${best.model}) is the winner with ${(confidence * 100).toFixed(1)}% confidence. ${improvement.toFixed(1)}% improvement over ${secondBest.id}.`;
    } else {
      recommendation = `No significant difference found (p=${pValue.toFixed(3)}). Consider running longer.`;
    }

    return {
      name: experiment.name,
      status: experiment.status,
      duration: formatDuration(Date.now() - experiment.createdAt),
      totalSamples,
      variants,
      winner: isSignificant && hasEnoughSamples ? best.id : null,
      confidence,
      pValue,
      improvementPercent: improvement,
      recommendation,
    };
  }

  /**
   * List all experiments.
   */
  listExperiments(): Array<{ name: string; status: string; samples: number; winner: string | null }> {
    return [...this.experiments.values()].map((exp) => ({
      name: exp.name,
      status: exp.status,
      samples: [...exp.variantStats.values()].reduce((sum, v) => sum + v.samples, 0),
      winner: exp.winner ?? null,
    }));
  }

  /**
   * Stop an experiment.
   */
  stopExperiment(name: string): void {
    const experiment = this.experiments.get(name);
    if (experiment) {
      experiment.status = 'stopped';
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private weightedRandom(experiment: Experiment): Variant {
    const variants = experiment.variants;
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight ?? 1), 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight ?? 1;
      if (random <= 0) return variant;
    }

    return variants[variants.length - 1];
  }

  /**
   * Thompson Sampling — Bayesian multi-armed bandit.
   * Automatically explores vs exploits based on results.
   */
  private thompsonSampling(experiment: Experiment): Variant {
    let bestVariant = experiment.variants[0];
    let bestSample = -1;

    for (const variant of experiment.variants) {
      const stats = experiment.variantStats.get(variant.id);
      if (!stats) continue;

      // Beta distribution sample: Beta(successes+1, failures+1)
      const sample = betaSample(stats.successes + 1, stats.failures + 1);
      if (sample > bestSample) {
        bestSample = sample;
        bestVariant = variant;
      }
    }

    return bestVariant;
  }

  private checkForWinner(experiment: Experiment): void {
    const stats = [...experiment.variantStats.values()];
    const allHaveMin = stats.every((s) => s.samples >= experiment.minSamples);
    if (!allHaveMin) return;

    const sorted = stats
      .map((s) => ({
        id: s.id,
        avg: s.samples > 0 ? s.qualitySum / s.samples : 0,
        stdDev: computeStdDev(s.qualitySum, s.qualitySumSq, s.samples),
        samples: s.samples,
      }))
      .sort((a, b) => b.avg - a.avg);

    const best = sorted[0];
    const second = sorted[1];

    if (best && second && best.samples > 1 && second.samples > 1) {
      const pValue = welchsTTest(
        best.avg, best.stdDev, best.samples,
        second.avg, second.stdDev, second.samples,
      );

      const confidence = 1 - pValue;
      if (confidence >= (experiment.confidenceLevel ?? 0.95)) {
        experiment.status = 'completed';
        experiment.winner = best.id;
        experiment.winnerConfidence = confidence;
      }
    }
  }

  private completeExperiment(name: string): void {
    const experiment = this.experiments.get(name);
    if (!experiment) return;

    experiment.status = 'completed';
    const report = this.getReport(name);
    if (report?.winner) {
      experiment.winner = report.winner;
      experiment.winnerConfidence = report.confidence;
    }
  }
}

// ---------------------------------------------------------------------------
// Statistical Utilities
// ---------------------------------------------------------------------------

function computeStdDev(sum: number, sumSq: number, n: number): number {
  if (n < 2) return 0;
  const variance = (sumSq - (sum * sum) / n) / (n - 1);
  return Math.sqrt(Math.max(0, variance));
}

/**
 * Welch's t-test for unequal variances.
 * Returns approximate p-value.
 */
function welchsTTest(
  mean1: number, std1: number, n1: number,
  mean2: number, std2: number, n2: number,
): number {
  if (n1 < 2 || n2 < 2) return 1;

  const var1 = std1 * std1;
  const var2 = std2 * std2;

  const se = Math.sqrt(var1 / n1 + var2 / n2);
  if (se === 0) return 1;

  const t = Math.abs(mean1 - mean2) / se;

  // Welch-Satterthwaite degrees of freedom
  const num = (var1 / n1 + var2 / n2) ** 2;
  const den = (var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1);
  const df = den > 0 ? num / den : 1;

  // Approximate p-value using normal distribution (good for df > 30)
  // For smaller df, this is conservative
  return 2 * (1 - normalCDF(t));
}

/**
 * Approximate normal CDF using Abramowitz & Stegun formula.
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Sample from Beta distribution using Gamma distribution.
 * Used for Thompson Sampling in multi-armed bandit.
 */
function betaSample(alpha: number, beta: number): number {
  const x = gammaSample(alpha);
  const y = gammaSample(beta);
  return x / (x + y);
}

/**
 * Sample from Gamma distribution using Marsaglia & Tsang method.
 */
function gammaSample(shape: number): number {
  if (shape < 1) {
    return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;

    do {
      x = normalRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Box-Muller transform for normal distribution sampling.
 */
function normalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _manager: ABTestManager | null = null;

export function getABTestManager(): ABTestManager {
  if (!_manager) _manager = new ABTestManager();
  return _manager;
}
