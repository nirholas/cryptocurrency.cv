/**
 * A/B Testing Framework for RAG Pipeline
 *
 * Compare two or more RAG configurations side-by-side to determine
 * which performs better across quality metrics. Supports:
 * - Traffic splitting (experiment assignment)
 * - Metric collection per variant
 * - Statistical significance testing
 * - Experiment lifecycle management
 *
 * @module lib/rag/ab-testing
 */

import type { EvalResult, EvalRunResult, EvalConfig } from './evaluator';
import { RAGEvaluator } from './evaluator';
import type { ScoredDocument } from './types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  /** RAG pipeline function — takes query, returns answer + docs */
  pipeline: (query: string) => Promise<{ answer: string; documents: ScoredDocument[]; processingTime?: number }>;
  /** Optional evaluator config overrides for this variant */
  evalConfig?: Partial<EvalConfig>;
}

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  variants: ABVariant[];
  /** Traffic split per variant (must sum to 1.0). Defaults to equal split. */
  trafficSplit: Record<string, number>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  /** Min samples per variant before results are considered valid */
  minSamplesPerVariant: number;
  /** Results indexed by variant ID */
  results: Record<string, VariantResult>;
}

export interface VariantResult {
  variantId: string;
  samples: number;
  evalResults: EvalResult[];
  avgOverallScore: number;
  avgFaithfulness: number;
  avgAnswerRelevance: number;
  avgContextPrecision: number;
  avgContextRecall: number;
  avgHallucinationRate: number;
  avgProcessingTime: number;
}

export interface ExperimentReport {
  experimentId: string;
  name: string;
  status: ExperimentStatus;
  duration: string;
  variants: VariantReportEntry[];
  winner: string | null;
  confidence: number;
  recommendation: string;
}

interface VariantReportEntry {
  id: string;
  name: string;
  samples: number;
  avgOverallScore: number;
  avgFaithfulness: number;
  avgAnswerRelevance: number;
  avgContextPrecision: number;
  avgContextRecall: number;
  avgHallucinationRate: number;
  avgProcessingTime: number;
  isWinner: boolean;
}

// ═══════════════════════════════════════════════════════════════
// A/B TESTING ENGINE
// ═══════════════════════════════════════════════════════════════

export class ABTestingEngine {
  private experiments: Map<string, Experiment> = new Map();

  /**
   * Create a new experiment
   */
  createExperiment(params: {
    name: string;
    description: string;
    variants: ABVariant[];
    trafficSplit?: Record<string, number>;
    minSamplesPerVariant?: number;
  }): Experiment {
    const id = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Default to equal traffic split
    const trafficSplit =
      params.trafficSplit ??
      Object.fromEntries(params.variants.map((v) => [v.id, 1 / params.variants.length]));

    // Validate traffic split
    const totalTraffic = Object.values(trafficSplit).reduce((a, b) => a + b, 0);
    if (Math.abs(totalTraffic - 1.0) > 0.01) {
      throw new Error(`Traffic split must sum to 1.0, got ${totalTraffic}`);
    }

    const experiment: Experiment = {
      id,
      name: params.name,
      description: params.description,
      status: 'draft',
      variants: params.variants,
      trafficSplit,
      createdAt: new Date().toISOString(),
      minSamplesPerVariant: params.minSamplesPerVariant ?? 30,
      results: Object.fromEntries(
        params.variants.map((v) => [
          v.id,
          {
            variantId: v.id,
            samples: 0,
            evalResults: [],
            avgOverallScore: 0,
            avgFaithfulness: 0,
            avgAnswerRelevance: 0,
            avgContextPrecision: 0,
            avgContextRecall: 0,
            avgHallucinationRate: 0,
            avgProcessingTime: 0,
          },
        ])
      ),
    };

    this.experiments.set(id, experiment);
    return experiment;
  }

  /**
   * Start an experiment
   */
  startExperiment(experimentId: string): Experiment {
    const exp = this.getExperiment(experimentId);
    if (exp.status !== 'draft' && exp.status !== 'paused') {
      throw new Error(`Cannot start experiment in ${exp.status} state`);
    }
    exp.status = 'running';
    exp.startedAt = exp.startedAt ?? new Date().toISOString();
    return exp;
  }

  /**
   * Assign a request to a variant based on traffic split
   */
  assignVariant(experimentId: string, userId?: string): ABVariant {
    const exp = this.getExperiment(experimentId);
    if (exp.status !== 'running') {
      throw new Error(`Experiment ${experimentId} is not running`);
    }

    // Deterministic assignment if userId is provided (consistent experience)
    if (userId) {
      const hash = simpleHash(userId + experimentId);
      const normalized = (hash % 10000) / 10000;
      let cumulative = 0;
      for (const variant of exp.variants) {
        cumulative += exp.trafficSplit[variant.id] ?? 0;
        if (normalized < cumulative) {
          return variant;
        }
      }
    }

    // Random assignment
    const rand = Math.random();
    let cumulative = 0;
    for (const variant of exp.variants) {
      cumulative += exp.trafficSplit[variant.id] ?? 0;
      if (rand < cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    return exp.variants[0];
  }

  /**
   * Record an evaluation result for a variant
   */
  recordResult(experimentId: string, variantId: string, result: EvalResult): void {
    const exp = this.getExperiment(experimentId);
    const variantResult = exp.results[variantId];
    if (!variantResult) {
      throw new Error(`Variant ${variantId} not found in experiment ${experimentId}`);
    }

    variantResult.evalResults.push(result);
    variantResult.samples += 1;

    // Recalculate running averages
    const results = variantResult.evalResults;
    const n = results.length;
    variantResult.avgOverallScore = results.reduce((s, r) => s + r.overallScore, 0) / n;
    variantResult.avgFaithfulness = results.reduce((s, r) => s + r.faithfulness.score, 0) / n;
    variantResult.avgAnswerRelevance = results.reduce((s, r) => s + r.answerRelevance.score, 0) / n;
    variantResult.avgContextPrecision = results.reduce((s, r) => s + r.contextPrecision.score, 0) / n;
    variantResult.avgContextRecall = results.reduce((s, r) => s + r.contextRecall.score, 0) / n;
    variantResult.avgHallucinationRate = results.reduce((s, r) => s + r.hallucinationRate.score, 0) / n;
    variantResult.avgProcessingTime = results.reduce((s, r) => s + (r.processingTime ?? 0), 0) / n;
  }

  /**
   * Run a full A/B test: execute both variants on a set of queries and evaluate
   */
  async runExperiment(
    experimentId: string,
    queries: Array<{ id: string; query: string; expectedAnswer?: string }>
  ): Promise<ExperimentReport> {
    const exp = this.startExperiment(experimentId);
    const evaluator = new RAGEvaluator();

    for (const variant of exp.variants) {
      for (const q of queries) {
        try {
          const output = await variant.pipeline(q.query);
          const evalResult = await evaluator.evaluateOne(
            {
              id: q.id,
              query: q.query,
              expectedAnswer: q.expectedAnswer,
            },
            {
              query: q.query,
              answer: output.answer,
              documents: output.documents,
              processingTime: output.processingTime,
            }
          );
          this.recordResult(experimentId, variant.id, evalResult);
        } catch {
          // Skip failed queries
        }
      }
    }

    exp.status = 'completed';
    exp.completedAt = new Date().toISOString();

    return this.generateReport(experimentId);
  }

  /**
   * Generate a summary report for an experiment
   */
  generateReport(experimentId: string): ExperimentReport {
    const exp = this.getExperiment(experimentId);

    const variantEntries: VariantReportEntry[] = exp.variants.map((v) => {
      const r = exp.results[v.id]!;
      return {
        id: v.id,
        name: v.name,
        samples: r.samples,
        avgOverallScore: round(r.avgOverallScore),
        avgFaithfulness: round(r.avgFaithfulness),
        avgAnswerRelevance: round(r.avgAnswerRelevance),
        avgContextPrecision: round(r.avgContextPrecision),
        avgContextRecall: round(r.avgContextRecall),
        avgHallucinationRate: round(r.avgHallucinationRate),
        avgProcessingTime: round(r.avgProcessingTime),
        isWinner: false,
      };
    });

    // Determine winner
    const sorted = [...variantEntries].sort((a, b) => b.avgOverallScore - a.avgOverallScore);
    let winner: string | null = null;
    let confidence = 0;
    let recommendation = 'Insufficient data to determine a winner.';

    if (sorted.length >= 2 && sorted[0].samples > 0 && sorted[1].samples > 0) {
      const best = sorted[0];
      const runnerUp = sorted[1];
      const delta = best.avgOverallScore - runnerUp.avgOverallScore;

      // Simple confidence estimation based on sample size and effect size
      const minSamples = Math.min(best.samples, runnerUp.samples);
      const hasSufficientSamples = minSamples >= exp.minSamplesPerVariant;

      if (hasSufficientSamples && delta > 0.05) {
        // Run a simple z-test approximation
        const bestScores = exp.results[best.id]!.evalResults.map((r) => r.overallScore);
        const runnerUpScores = exp.results[runnerUp.id]!.evalResults.map((r) => r.overallScore);

        const bestStdDev = standardDeviation(bestScores);
        const runnerUpStdDev = standardDeviation(runnerUpScores);

        const pooledSE = Math.sqrt(
          (bestStdDev ** 2) / best.samples + (runnerUpStdDev ** 2) / runnerUp.samples
        );

        const zScore = pooledSE > 0 ? delta / pooledSE : 0;
        // Approximate p-value from z-score (one-tailed)
        confidence = Math.min(0.99, normalCDF(zScore));

        winner = best.id;
        best.isWinner = true;

        if (confidence >= 0.95) {
          recommendation = `${best.name} is the clear winner with ${(confidence * 100).toFixed(1)}% confidence. Deploy with high confidence.`;
        } else if (confidence >= 0.80) {
          recommendation = `${best.name} shows promise (${(confidence * 100).toFixed(1)}% confidence) but more data may be needed for definitive conclusions.`;
        } else {
          recommendation = `Results are inconclusive. ${best.name} leads but confidence is only ${(confidence * 100).toFixed(1)}%. Continue the experiment.`;
        }
      } else if (!hasSufficientSamples) {
        recommendation = `Need at least ${exp.minSamplesPerVariant} samples per variant. Current: ${sorted.map((s) => `${s.name}=${s.samples}`).join(', ')}.`;
      } else {
        recommendation = `Variants are performing similarly (delta: ${delta.toFixed(3)}). No significant difference detected.`;
      }
    }

    const duration = exp.startedAt
      ? `${((Date.now() - new Date(exp.startedAt).getTime()) / 1000).toFixed(0)}s`
      : 'N/A';

    return {
      experimentId: exp.id,
      name: exp.name,
      status: exp.status,
      duration,
      variants: variantEntries,
      winner,
      confidence: round(confidence),
      recommendation,
    };
  }

  getExperiment(id: string): Experiment {
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment ${id} not found`);
    return exp;
  }

  listExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  pauseExperiment(id: string): void {
    const exp = this.getExperiment(id);
    if (exp.status !== 'running') throw new Error(`Cannot pause experiment in ${exp.status} state`);
    exp.status = 'paused';
  }

  cancelExperiment(id: string): void {
    const exp = this.getExperiment(id);
    exp.status = 'cancelled';
  }
}

// ═══════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/**
 * Approximate normal CDF using Abramowitz and Stegun formula
 */
function normalCDF(z: number): number {
  if (z < -6) return 0;
  if (z > 6) return 1;

  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;

  const a = Math.abs(z);
  const t = 1.0 / (1.0 + a * p);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const cdf = 1.0 - pdf * (b1 * t + b2 * t2 + b3 * t3 + b4 * t4 + b5 * t5);

  return z >= 0 ? cdf : 1 - cdf;
}

function round(n: number, decimals = 4): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════

let _engine: ABTestingEngine | null = null;

export function getABTestingEngine(): ABTestingEngine {
  if (!_engine) _engine = new ABTestingEngine();
  return _engine;
}
