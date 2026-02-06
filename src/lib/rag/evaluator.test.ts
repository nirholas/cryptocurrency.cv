/**
 * Unit tests for RAG Evaluator
 *
 * Tests evaluation metrics, composite scoring, and batch evaluation.
 * Uses mocked LLM calls for deterministic results.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ScoredDocument } from '@/lib/rag/types';
import type { EvalTestCase, EvalPipelineOutput, MetricScore } from '@/lib/rag/evaluator';

// ═══════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════

// Mock LLM calls
vi.mock('@/lib/groq', () => ({
  callGroq: vi.fn().mockResolvedValue({
    content: JSON.stringify({
      claims: [
        { claim: 'Bitcoin is decentralized', verdict: 'SUPPORTED', evidence: 'Doc 1' },
        { claim: 'Created in 2009', verdict: 'SUPPORTED', evidence: 'Doc 1' },
      ],
      totalClaims: 2,
      supportedClaims: 2,
      partiallySupportedClaims: 0,
      faithfulnessScore: 1.0,
    }),
  }),
  parseGroqJson: vi.fn().mockImplementation((content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }),
}));

// Mock Self-RAG
vi.mock('@/lib/rag/self-rag', () => ({
  gradeRetrievals: vi.fn().mockResolvedValue({
    relevant: [{ id: '1', title: 'Doc 1', content: 'content', source: 'test', score: 0.8 }],
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

// Mock Confidence Scorer
vi.mock('@/lib/rag/confidence-scorer', () => ({
  getConfidenceScorer: vi.fn().mockReturnValue({
    quickScore: vi.fn().mockReturnValue({
      overall: 0.85,
      dimensions: {
        retrieval: 0.9,
        generation: 0.8,
        attribution: 0.85,
        factual: 0.9,
        temporal: 0.7,
      },
      level: 'high',
      explanation: 'Good confidence',
      warnings: [],
    }),
  }),
}));

// ═══════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════

function makeDocs(count = 2): ScoredDocument[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `doc-${i + 1}`,
    title: `Test Document ${i + 1}`,
    content: `This is test content for document ${i + 1} about Bitcoin and cryptocurrency.`,
    source: 'test-source',
    score: 0.9 - i * 0.1,
  }));
}

const testCase: EvalTestCase = {
  id: 'test-001',
  query: 'What is Bitcoin?',
  expectedAnswer: 'Bitcoin is a decentralized digital cryptocurrency.',
  tags: ['factual', 'basic'],
  difficulty: 'easy',
};

const testOutput: EvalPipelineOutput = {
  query: 'What is Bitcoin?',
  answer: 'Bitcoin is a decentralized digital cryptocurrency created in 2009.',
  documents: makeDocs(2),
  processingTime: 150,
};

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('RAGEvaluator', () => {
  let RAGEvaluator: typeof import('@/lib/rag/evaluator').RAGEvaluator;
  let evaluateRAGResponse: typeof import('@/lib/rag/evaluator').evaluateRAGResponse;
  let getRAGEvaluator: typeof import('@/lib/rag/evaluator').getRAGEvaluator;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to ensure mocks are applied
    const mod = await import('@/lib/rag/evaluator');
    RAGEvaluator = mod.RAGEvaluator;
    evaluateRAGResponse = mod.evaluateRAGResponse;
    getRAGEvaluator = mod.getRAGEvaluator;
  });

  describe('constructor', () => {
    it('creates with default config', () => {
      const evaluator = new RAGEvaluator();
      expect(evaluator).toBeDefined();
    });

    it('accepts partial config overrides', () => {
      const evaluator = new RAGEvaluator({ passThreshold: 0.8, concurrency: 5 });
      expect(evaluator).toBeDefined();
    });
  });

  describe('evaluateOne', () => {
    it('returns all RAGAS metric scores', async () => {
      const evaluator = new RAGEvaluator();
      const result = await evaluator.evaluateOne(testCase, testOutput);

      expect(result.testCaseId).toBe('test-001');
      expect(result.query).toBe('What is Bitcoin?');
      expect(result.answer).toBe(testOutput.answer);
      expect(result.documentsUsed).toBe(2);
      expect(result.processingTime).toBe(150);
      expect(result.timestamp).toBeTruthy();

      // All metrics should be present
      expect(result.faithfulness).toBeDefined();
      expect(result.answerRelevance).toBeDefined();
      expect(result.contextPrecision).toBeDefined();
      expect(result.contextRecall).toBeDefined();
      expect(result.hallucinationRate).toBeDefined();

      // Scores should be 0-1
      assertScoreInRange(result.faithfulness);
      assertScoreInRange(result.answerRelevance);
      assertScoreInRange(result.contextPrecision);
      assertScoreInRange(result.contextRecall);
      assertScoreInRange(result.hallucinationRate);

      // Overall should be computed
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });

    it('includes confidence scores when available', async () => {
      const evaluator = new RAGEvaluator();
      const result = await evaluator.evaluateOne(testCase, testOutput);

      expect(result.confidence).toBeDefined();
      expect(result.confidence?.overall).toBe(0.85);
      expect(result.confidence?.level).toBe('high');
    });

    it('carries through expectedAnswer', async () => {
      const evaluator = new RAGEvaluator();
      const result = await evaluator.evaluateOne(testCase, testOutput);

      expect(result.expectedAnswer).toBe('Bitcoin is a decentralized digital cryptocurrency.');
    });
  });

  describe('evaluateBatch', () => {
    it('evaluates multiple test cases', async () => {
      const evaluator = new RAGEvaluator({ concurrency: 2 });

      const cases: EvalTestCase[] = [
        { id: 'b-1', query: 'What is Bitcoin?' },
        { id: 'b-2', query: 'What is Ethereum?' },
        { id: 'b-3', query: 'What is Solana?' },
      ];

      const pipelineFn = async (query: string): Promise<EvalPipelineOutput> => ({
        query,
        answer: `Answer about ${query}`,
        documents: makeDocs(2),
        processingTime: 100,
      });

      const run = await evaluator.evaluateBatch(cases, pipelineFn);

      expect(run.runId).toMatch(/^eval_/);
      expect(run.totalCases).toBe(3);
      expect(run.results).toHaveLength(3);
      expect(run.durationMs).toBeGreaterThanOrEqual(0);
      expect(run.avgOverallScore).toBeGreaterThanOrEqual(0);
      expect(run.avgOverallScore).toBeLessThanOrEqual(1);
    });

    it('handles pipeline errors gracefully', async () => {
      const evaluator = new RAGEvaluator({ concurrency: 1 });

      const cases: EvalTestCase[] = [
        { id: 'e-1', query: 'Good query' },
        { id: 'e-2', query: 'Bad query' },
      ];

      let callCount = 0;
      const pipelineFn = async (query: string): Promise<EvalPipelineOutput> => {
        callCount++;
        if (callCount === 2) throw new Error('Pipeline failed');
        return { query, answer: 'An answer', documents: makeDocs(1), processingTime: 50 };
      };

      const run = await evaluator.evaluateBatch(cases, pipelineFn);

      // Should still have 2 results (one real, one failed)
      expect(run.totalCases).toBe(2);
      expect(run.results.length).toBe(2);
    });

    it('computes aggregated metrics', async () => {
      const evaluator = new RAGEvaluator({ passThreshold: 0.5 });

      const cases: EvalTestCase[] = [
        { id: 'a-1', query: 'Q1' },
        { id: 'a-2', query: 'Q2' },
      ];

      const pipelineFn = async (query: string): Promise<EvalPipelineOutput> => ({
        query,
        answer: 'Answer',
        documents: makeDocs(2),
      });

      const run = await evaluator.evaluateBatch(cases, pipelineFn);

      expect(run.avgFaithfulness).toBeGreaterThanOrEqual(0);
      expect(run.avgAnswerRelevance).toBeGreaterThanOrEqual(0);
      expect(run.avgContextPrecision).toBeGreaterThanOrEqual(0);
      expect(run.avgContextRecall).toBeGreaterThanOrEqual(0);
      expect(run.avgHallucinationRate).toBeGreaterThanOrEqual(0);
      expect(run.p50OverallScore).toBeDefined();
      expect(run.p95OverallScore).toBeDefined();
      expect(run.passedCases + run.failedCases).toBe(run.totalCases);
    });
  });

  describe('evaluateOutputs', () => {
    it('evaluates pre-computed outputs', async () => {
      const evaluator = new RAGEvaluator();

      const pairs = [
        { testCase: { id: 'o-1', query: 'Q1' }, output: testOutput },
        { testCase: { id: 'o-2', query: 'Q2' }, output: { ...testOutput, answer: 'Different answer' } },
      ];

      const run = await evaluator.evaluateOutputs(pairs);

      expect(run.totalCases).toBe(2);
      expect(run.results).toHaveLength(2);
    });
  });

  describe('getRAGEvaluator', () => {
    it('returns singleton', () => {
      const a = getRAGEvaluator();
      const b = getRAGEvaluator();
      expect(a).toBe(b);
    });

    it('creates new instance with config', () => {
      const a = getRAGEvaluator();
      const b = getRAGEvaluator({ passThreshold: 0.9 });
      // New config creates new instance
      expect(b).toBeDefined();
    });
  });

  describe('evaluateRAGResponse', () => {
    it('provides quick single-query evaluation', async () => {
      const result = await evaluateRAGResponse(
        'What is Bitcoin?',
        'Bitcoin is a cryptocurrency.',
        makeDocs(2)
      );

      expect(result.testCaseId).toMatch(/^quick_/);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });
  });

  describe('overall score computation', () => {
    it('inverts hallucination rate in composite', async () => {
      const evaluator = new RAGEvaluator();
      const result = await evaluator.evaluateOne(testCase, testOutput);

      // With hallucination score of 0.1 (low = good),
      // the composite should use (1 - 0.1) = 0.9 for the hallucination weight
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('clamps to 0-1 range', async () => {
      const evaluator = new RAGEvaluator();
      const result = await evaluator.evaluateOne(testCase, testOutput);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function assertScoreInRange(metric: MetricScore) {
  expect(metric.score).toBeGreaterThanOrEqual(0);
  expect(metric.score).toBeLessThanOrEqual(1);
  expect(metric.details).toBeTruthy();
}
