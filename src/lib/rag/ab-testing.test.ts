/**
 * Unit tests for A/B Testing Engine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ScoredDocument } from '@/lib/rag/types';

// Mock evaluator dependencies
vi.mock('@/lib/groq', () => ({
  callGroq: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      claims: [{ claim: 'Test', verdict: 'SUPPORTED', evidence: 'Doc' }],
      totalClaims: 1,
      supportedClaims: 1,
      partiallySupportedClaims: 0,
      faithfulnessScore: 0.9,
    }),
  }),
  parseGroqJson: vi.fn().mockImplementation((content: string) => {
    try { return JSON.parse(content); } catch { return null; }
  }),
}));

vi.mock('@/lib/rag/self-rag', () => ({
  gradeRetrievals: vi.fn().mockResolvedValue({
    relevant: [{ id: '1', title: 'Doc', content: 'content', source: 'test', score: 0.8 }],
    irrelevant: [],
    avgScore: 0.8,
    needsMoreRetrieval: false,
  }),
  detectHallucinations: vi.fn().mockResolvedValue({
    hasHallucinations: false,
    score: 0.1,
    problematicSentences: [],
    suggestions: [],
  }),
}));

vi.mock('@/lib/rag/confidence-scorer', () => ({
  getConfidenceScorer: vi.fn().mockReturnValue({
    quickScore: vi.fn().mockReturnValue({
      overall: 0.8,
      dimensions: { retrieval: 0.8, generation: 0.8, attribution: 0.8, factual: 0.8, temporal: 0.8 },
      level: 'high',
      explanation: 'Good',
      warnings: [],
    }),
  }),
}));

// ═══════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════

function makeDocs(count = 1): ScoredDocument[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `doc-${i}`,
    title: `Doc ${i}`,
    content: `Content ${i}`,
    source: 'test',
    score: 0.85,
  }));
}

function makeVariantPipeline(quality: 'good' | 'bad') {
  return async (query: string) => ({
    answer: quality === 'good' ? `Detailed answer about ${query}` : 'I dont know',
    documents: makeDocs(quality === 'good' ? 3 : 1),
    processingTime: quality === 'good' ? 200 : 50,
  });
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('ABTestingEngine', () => {
  let ABTestingEngine: typeof import('@/lib/rag/ab-testing').ABTestingEngine;
  let getABTestingEngine: typeof import('@/lib/rag/ab-testing').getABTestingEngine;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/rag/ab-testing');
    ABTestingEngine = mod.ABTestingEngine;
    getABTestingEngine = mod.getABTestingEngine;
  });

  describe('createExperiment', () => {
    it('creates an experiment with equal traffic split', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Test Experiment',
        description: 'Testing',
        variants: [
          { id: 'a', name: 'Variant A', description: 'Control', pipeline: makeVariantPipeline('good') },
          { id: 'b', name: 'Variant B', description: 'Treatment', pipeline: makeVariantPipeline('bad') },
        ],
      });

      expect(exp.id).toMatch(/^exp_/);
      expect(exp.status).toBe('draft');
      expect(exp.variants).toHaveLength(2);
      expect(exp.trafficSplit.a).toBeCloseTo(0.5);
      expect(exp.trafficSplit.b).toBeCloseTo(0.5);
    });

    it('accepts custom traffic split', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Weighted',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
          { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
        ],
        trafficSplit: { a: 0.8, b: 0.2 },
      });

      expect(exp.trafficSplit.a).toBe(0.8);
      expect(exp.trafficSplit.b).toBe(0.2);
    });

    it('rejects traffic split not summing to 1.0', () => {
      const engine = new ABTestingEngine();
      expect(() =>
        engine.createExperiment({
          name: 'Bad',
          description: 'Test',
          variants: [
            { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
            { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
          ],
          trafficSplit: { a: 0.6, b: 0.6 },
        })
      ).toThrow('Traffic split must sum to 1.0');
    });

    it('initializes empty results for each variant', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Init',
        description: 'Test',
        variants: [
          { id: 'v1', name: 'V1', description: 'V1', pipeline: makeVariantPipeline('good') },
        ],
      });

      expect(exp.results.v1).toBeDefined();
      expect(exp.results.v1.samples).toBe(0);
      expect(exp.results.v1.evalResults).toHaveLength(0);
    });
  });

  describe('startExperiment', () => {
    it('transitions draft to running', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Start',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });

      const started = engine.startExperiment(exp.id);
      expect(started.status).toBe('running');
      expect(started.startedAt).toBeTruthy();
    });

    it('fails for completed experiments', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Done',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });

      // Manually set to completed
      engine.getExperiment(exp.id).status = 'completed';

      expect(() => engine.startExperiment(exp.id)).toThrow('Cannot start');
    });
  });

  describe('assignVariant', () => {
    it('assigns based on random traffic split', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Assign',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
          { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
        ],
      });
      engine.startExperiment(exp.id);

      // Run many assignments and check distribution
      const counts: Record<string, number> = { a: 0, b: 0 };
      for (let i = 0; i < 100; i++) {
        const variant = engine.assignVariant(exp.id);
        counts[variant.id]++;
      }

      // With 50/50 split, both should get some assignments
      expect(counts.a).toBeGreaterThan(0);
      expect(counts.b).toBeGreaterThan(0);
    });

    it('deterministic with userId', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Deterministic',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
          { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
        ],
      });
      engine.startExperiment(exp.id);

      const v1 = engine.assignVariant(exp.id, 'user-123');
      const v2 = engine.assignVariant(exp.id, 'user-123');

      // Same user should always get same variant
      expect(v1.id).toBe(v2.id);
    });

    it('throws if experiment not running', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'NotRunning',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });

      expect(() => engine.assignVariant(exp.id)).toThrow('not running');
    });
  });

  describe('recordResult', () => {
    it('updates running averages', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Record',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });

      engine.recordResult(exp.id, 'a', {
        testCaseId: 't1',
        query: 'Q1',
        timestamp: new Date().toISOString(),
        faithfulness: { score: 0.8, details: '' },
        answerRelevance: { score: 0.7, details: '' },
        contextPrecision: { score: 0.9, details: '' },
        contextRecall: { score: 0.6, details: '' },
        hallucinationRate: { score: 0.1, details: '' },
        overallScore: 0.78,
        answer: 'Test',
        documentsUsed: 2,
        processingTime: 100,
      });

      const result = exp.results.a;
      expect(result.samples).toBe(1);
      expect(result.avgOverallScore).toBe(0.78);
      expect(result.avgFaithfulness).toBe(0.8);
    });

    it('throws for unknown variant', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Unknown',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });

      expect(() =>
        engine.recordResult(exp.id, 'nonexistent', {
          testCaseId: 't1',
          query: 'Q1',
          timestamp: '',
          faithfulness: { score: 0, details: '' },
          answerRelevance: { score: 0, details: '' },
          contextPrecision: { score: 0, details: '' },
          contextRecall: { score: 0, details: '' },
          hallucinationRate: { score: 0, details: '' },
          overallScore: 0,
          answer: '',
          documentsUsed: 0,
        })
      ).toThrow('Variant nonexistent not found');
    });
  });

  describe('generateReport', () => {
    it('generates a report with winner', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Report',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
          { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
        ],
        minSamplesPerVariant: 2,
      });
      engine.startExperiment(exp.id);

      // Add good results for A
      for (let i = 0; i < 5; i++) {
        engine.recordResult(exp.id, 'a', makeEvalResult(0.85 + Math.random() * 0.1));
      }

      // Add bad results for B
      for (let i = 0; i < 5; i++) {
        engine.recordResult(exp.id, 'b', makeEvalResult(0.3 + Math.random() * 0.1));
      }

      const report = engine.generateReport(exp.id);

      expect(report.experimentId).toBe(exp.id);
      expect(report.variants).toHaveLength(2);
      expect(report.winner).toBe('a');
      expect(report.confidence).toBeGreaterThan(0.5);
      expect(report.recommendation).toBeTruthy();
    });

    it('reports insufficient data when below min samples', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'InsufficientData',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
          { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
        ],
        minSamplesPerVariant: 30,
      });
      engine.startExperiment(exp.id);

      // Only 1 sample each
      engine.recordResult(exp.id, 'a', makeEvalResult(0.9));
      engine.recordResult(exp.id, 'b', makeEvalResult(0.3));

      const report = engine.generateReport(exp.id);

      expect(report.recommendation).toContain('Need at least');
    });
  });

  describe('lifecycle', () => {
    it('pauses a running experiment', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Pause',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });
      engine.startExperiment(exp.id);
      engine.pauseExperiment(exp.id);

      expect(engine.getExperiment(exp.id).status).toBe('paused');
    });

    it('cancels an experiment', () => {
      const engine = new ABTestingEngine();
      const exp = engine.createExperiment({
        name: 'Cancel',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });
      engine.cancelExperiment(exp.id);

      expect(engine.getExperiment(exp.id).status).toBe('cancelled');
    });

    it('lists all experiments', () => {
      const engine = new ABTestingEngine();
      engine.createExperiment({
        name: 'E1',
        description: 'Test',
        variants: [
          { id: 'a', name: 'A', description: 'A', pipeline: makeVariantPipeline('good') },
        ],
      });
      engine.createExperiment({
        name: 'E2',
        description: 'Test',
        variants: [
          { id: 'b', name: 'B', description: 'B', pipeline: makeVariantPipeline('bad') },
        ],
      });

      expect(engine.listExperiments()).toHaveLength(2);
    });
  });

  describe('getABTestingEngine', () => {
    it('returns singleton', () => {
      const a = getABTestingEngine();
      const b = getABTestingEngine();
      expect(a).toBe(b);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function makeEvalResult(overallScore: number) {
  return {
    testCaseId: `t-${Math.random().toString(36).slice(2, 6)}`,
    query: 'Test query',
    timestamp: new Date().toISOString(),
    faithfulness: { score: overallScore, details: '' },
    answerRelevance: { score: overallScore, details: '' },
    contextPrecision: { score: overallScore, details: '' },
    contextRecall: { score: overallScore, details: '' },
    hallucinationRate: { score: 1 - overallScore, details: '' },
    overallScore,
    answer: 'Test answer',
    documentsUsed: 2,
    processingTime: 100,
  };
}
