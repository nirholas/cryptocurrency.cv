/**
 * RAG Evaluation Framework (RAGAS-inspired)
 *
 * Comprehensive evaluation of RAG pipeline quality:
 * - Faithfulness: Is the answer supported by retrieved context?
 * - Answer Relevance: Does the answer address the question?
 * - Context Precision: Are retrieved docs actually relevant?
 * - Context Recall: Are all relevant docs retrieved?
 * - Hallucination Rate: Claims not grounded in context
 * - Overall Quality: Weighted composite score
 *
 * Integrates with existing Self-RAG grading and ConfidenceScorer.
 *
 * @module lib/rag/evaluator
 */

import { callGroq, parseGroqJson } from '../groq';
import type { GroqMessage } from '../groq';
import { gradeRetrievals } from './self-rag';
import { detectHallucinations } from './self-rag';
import type { ConfidenceScore } from './confidence-scorer';
import { getConfidenceScorer } from './confidence-scorer';
import type { ScoredDocument } from './types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * A single evaluation test case
 */
export interface EvalTestCase {
  id: string;
  query: string;
  /** Expected answer (ground truth). Optional for some metrics. */
  expectedAnswer?: string;
  /** Expected relevant document IDs for context recall */
  expectedDocIds?: string[];
  /** Tags for filtering/grouping (e.g., 'temporal', 'comparison', 'factual') */
  tags?: string[];
  /** Difficulty level */
  difficulty?: 'easy' | 'medium' | 'hard';
}

/**
 * The RAG output to evaluate
 */
export interface EvalPipelineOutput {
  query: string;
  answer: string;
  documents: ScoredDocument[];
  confidence?: ConfidenceScore;
  traceId?: string;
  processingTime?: number;
}

/**
 * Scores for a single metric (0-1 scale)
 */
export interface MetricScore {
  score: number;
  details: string;
  metadata?: Record<string, unknown>;
}

/**
 * Complete evaluation result for one test case
 */
export interface EvalResult {
  testCaseId: string;
  query: string;
  timestamp: string;

  // RAGAS-style metrics (0-1, higher is better)
  faithfulness: MetricScore;
  answerRelevance: MetricScore;
  contextPrecision: MetricScore;
  contextRecall: MetricScore;
  hallucinationRate: MetricScore; // 0 = no hallucinations, 1 = all hallucinated

  // Composite
  overallScore: number;

  // Metadata
  answer: string;
  expectedAnswer?: string;
  documentsUsed: number;
  processingTime?: number;
  confidence?: ConfidenceScore;
}

/**
 * Aggregated results across a full evaluation run
 */
export interface EvalRunResult {
  runId: string;
  timestamp: string;
  durationMs: number;
  totalCases: number;
  passedCases: number; // score >= threshold
  failedCases: number;

  // Aggregated metrics
  avgFaithfulness: number;
  avgAnswerRelevance: number;
  avgContextPrecision: number;
  avgContextRecall: number;
  avgHallucinationRate: number;
  avgOverallScore: number;

  // Percentiles
  p50OverallScore: number;
  p95OverallScore: number;
  minOverallScore: number;

  // By tag
  scoresByTag: Record<string, { avg: number; count: number }>;
  scoresByDifficulty: Record<string, { avg: number; count: number }>;

  // Individual results
  results: EvalResult[];

  // Config
  config: EvalConfig;
}

export interface EvalConfig {
  /** Minimum overall score to count as 'passed' */
  passThreshold: number;
  /** Weights for composite score */
  weights: {
    faithfulness: number;
    answerRelevance: number;
    contextPrecision: number;
    contextRecall: number;
    hallucinationRate: number;
  };
  /** LLM model for evaluation prompts */
  evalModel: string;
  /** Max concurrent evaluations */
  concurrency: number;
}

const DEFAULT_CONFIG: EvalConfig = {
  passThreshold: 0.6,
  weights: {
    faithfulness: 0.25,
    answerRelevance: 0.25,
    contextPrecision: 0.2,
    contextRecall: 0.15,
    hallucinationRate: 0.15,
  },
  evalModel: 'llama-3.3-70b-versatile',
  concurrency: 3,
};

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL METRIC SCORERS
// ═══════════════════════════════════════════════════════════════

/**
 * Faithfulness: Is every claim in the answer supported by the retrieved context?
 * Uses LLM to extract claims, then checks each against context.
 */
async function scoreFaithfulness(
  answer: string,
  documents: ScoredDocument[]
): Promise<MetricScore> {
  if (!answer || documents.length === 0) {
    return { score: 0, details: 'No answer or no documents to evaluate' };
  }

  const context = documents
    .slice(0, 5)
    .map((d, i) => `[Doc ${i + 1}] ${d.title}\n${d.content.slice(0, 600)}`)
    .join('\n\n');

  const prompt = `You are evaluating the faithfulness of an AI-generated answer to its source documents.

Answer to evaluate:
"""
${answer.slice(0, 1500)}
"""

Source documents:
"""
${context}
"""

Instructions:
1. Extract each factual claim from the answer (statements that can be verified)
2. For each claim, determine if it is SUPPORTED, PARTIALLY_SUPPORTED, or NOT_SUPPORTED by the source documents
3. Calculate the faithfulness score = supported_claims / total_claims

Respond with JSON:
{
  "claims": [
    { "claim": "...", "verdict": "SUPPORTED" | "PARTIALLY_SUPPORTED" | "NOT_SUPPORTED", "evidence": "brief note" }
  ],
  "totalClaims": <number>,
  "supportedClaims": <number>,
  "partiallySupportedClaims": <number>,
  "faithfulnessScore": <0-1>
}`;

  try {
    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await callGroq(messages, { temperature: 0.1, maxTokens: 1200 });
    const parsed = parseGroqJson<{
      claims: Array<{ claim: string; verdict: string; evidence: string }>;
      totalClaims: number;
      supportedClaims: number;
      partiallySupportedClaims: number;
      faithfulnessScore: number;
    }>(response.content);

    if (!parsed || typeof parsed.faithfulnessScore !== 'number') {
      return { score: 0.5, details: 'Failed to parse faithfulness evaluation' };
    }

    const score = Math.max(0, Math.min(1, parsed.faithfulnessScore));
    return {
      score,
      details: `${parsed.supportedClaims}/${parsed.totalClaims} claims supported, ${parsed.partiallySupportedClaims} partial`,
      metadata: {
        claims: parsed.claims,
        totalClaims: parsed.totalClaims,
        supportedClaims: parsed.supportedClaims,
      },
    };
  } catch {
    return { score: 0.5, details: 'Faithfulness evaluation failed (LLM error)' };
  }
}

/**
 * Answer Relevance: Does the answer actually address the question?
 * Uses LLM to judge if the answer is on-topic and complete.
 */
async function scoreAnswerRelevance(
  query: string,
  answer: string
): Promise<MetricScore> {
  if (!answer) {
    return { score: 0, details: 'No answer provided' };
  }

  const prompt = `You are evaluating whether an AI-generated answer is relevant to the user's question.

Question: "${query}"

Answer:
"""
${answer.slice(0, 1500)}
"""

Rate the answer on these dimensions:
1. Topicality: Does it address the specific question asked? (0-1)
2. Completeness: Does it provide a thorough response? (0-1)  
3. Conciseness: Is it appropriately focused without unnecessary tangents? (0-1)

Respond with JSON:
{
  "topicality": <0-1>,
  "completeness": <0-1>,
  "conciseness": <0-1>,
  "overallRelevance": <0-1>,
  "explanation": "brief explanation"
}`;

  try {
    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await callGroq(messages, { temperature: 0.1, maxTokens: 500 });
    const parsed = parseGroqJson<{
      topicality: number;
      completeness: number;
      conciseness: number;
      overallRelevance: number;
      explanation: string;
    }>(response.content);

    if (!parsed || typeof parsed.overallRelevance !== 'number') {
      return { score: 0.5, details: 'Failed to parse relevance evaluation' };
    }

    return {
      score: Math.max(0, Math.min(1, parsed.overallRelevance)),
      details: parsed.explanation,
      metadata: {
        topicality: parsed.topicality,
        completeness: parsed.completeness,
        conciseness: parsed.conciseness,
      },
    };
  } catch {
    return { score: 0.5, details: 'Relevance evaluation failed (LLM error)' };
  }
}

/**
 * Context Precision: Are the retrieved documents actually relevant to the query?
 * Leverages existing Self-RAG gradeRetrievals.
 */
async function scoreContextPrecision(
  query: string,
  documents: ScoredDocument[]
): Promise<MetricScore> {
  if (documents.length === 0) {
    return { score: 0, details: 'No documents retrieved' };
  }

  try {
    const grading = await gradeRetrievals(query, documents, 0.5);
    const precision = grading.relevant.length / documents.length;

    return {
      score: precision,
      details: `${grading.relevant.length}/${documents.length} documents relevant (avg score: ${grading.avgScore.toFixed(2)})`,
      metadata: {
        relevantCount: grading.relevant.length,
        totalCount: documents.length,
        avgGradingScore: grading.avgScore,
        needsMore: grading.needsMoreRetrieval,
      },
    };
  } catch {
    // Fallback: use document similarity scores
    const avgScore = documents.reduce((s, d) => s + d.score, 0) / documents.length;
    const relevantCount = documents.filter((d) => d.score >= 0.5).length;

    return {
      score: relevantCount / documents.length,
      details: `Fallback scoring: ${relevantCount}/${documents.length} above threshold (avg: ${avgScore.toFixed(2)})`,
      metadata: { avgScore, relevantCount, fallback: true },
    };
  }
}

/**
 * Context Recall: Did we retrieve all the relevant documents?
 * If expectedDocIds are provided, checks overlap. Otherwise uses answer coverage heuristic.
 */
async function scoreContextRecall(
  query: string,
  answer: string,
  documents: ScoredDocument[],
  expectedDocIds?: string[]
): Promise<MetricScore> {
  // If we have ground truth doc IDs, use set overlap
  if (expectedDocIds && expectedDocIds.length > 0) {
    const retrievedIds = new Set(documents.map((d) => d.id));
    const hits = expectedDocIds.filter((id) => retrievedIds.has(id)).length;
    const recall = hits / expectedDocIds.length;

    return {
      score: recall,
      details: `${hits}/${expectedDocIds.length} expected documents retrieved`,
      metadata: { hits, expected: expectedDocIds.length, missed: expectedDocIds.filter((id) => !retrievedIds.has(id)) },
    };
  }

  // Heuristic: check if the answer's key statements can be found in the context
  const prompt = `You are evaluating context recall — whether the retrieved documents contain enough information to generate a complete answer.

Question: "${query}"

Answer (generated from the documents):
"""
${answer.slice(0, 1000)}
"""

Retrieved documents:
"""
${documents.slice(0, 5).map((d, i) => `[${i + 1}] ${d.title}: ${d.content.slice(0, 400)}`).join('\n')}
"""

Evaluate:
1. What key information in the answer came from the documents? (covered)
2. What key information in the answer has NO source in the documents? (uncovered)
3. What percentage of the answer's content is covered by the documents?

Respond with JSON:
{
  "coveredTopics": ["topic1", "topic2"],
  "uncoveredTopics": ["topic3"],
  "recallScore": <0-1>,
  "explanation": "brief"
}`;

  try {
    const messages: GroqMessage[] = [{ role: 'user', content: prompt }];
    const response = await callGroq(messages, { temperature: 0.1, maxTokens: 600 });
    const parsed = parseGroqJson<{
      coveredTopics: string[];
      uncoveredTopics: string[];
      recallScore: number;
      explanation: string;
    }>(response.content);

    if (!parsed || typeof parsed.recallScore !== 'number') {
      return { score: 0.5, details: 'Failed to parse recall evaluation' };
    }

    return {
      score: Math.max(0, Math.min(1, parsed.recallScore)),
      details: parsed.explanation,
      metadata: {
        coveredTopics: parsed.coveredTopics,
        uncoveredTopics: parsed.uncoveredTopics,
      },
    };
  } catch {
    return { score: 0.5, details: 'Context recall evaluation failed' };
  }
}

/**
 * Hallucination Rate: What fraction of the answer is hallucinated?
 * Leverages existing Self-RAG detectHallucinations.
 */
async function scoreHallucinationRate(
  answer: string,
  documents: ScoredDocument[]
): Promise<MetricScore> {
  if (!answer || documents.length === 0) {
    return { score: 1, details: 'No answer or no documents — cannot verify' };
  }

  try {
    const check = await detectHallucinations(answer, documents);

    return {
      score: check.score, // 0 = faithful, 1 = fully hallucinated
      details: check.hasHallucinations
        ? `${check.problematicSentences.length} problematic sentence(s) found`
        : 'No hallucinations detected',
      metadata: {
        hasHallucinations: check.hasHallucinations,
        problematicCount: check.problematicSentences.length,
        suggestions: check.suggestions,
        sentences: check.problematicSentences.slice(0, 5),
      },
    };
  } catch {
    return { score: 0.5, details: 'Hallucination detection failed' };
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPOSITE SCORING
// ═══════════════════════════════════════════════════════════════

function computeOverallScore(
  result: Pick<EvalResult, 'faithfulness' | 'answerRelevance' | 'contextPrecision' | 'contextRecall' | 'hallucinationRate'>,
  weights: EvalConfig['weights']
): number {
  // Hallucination rate is inverted (lower is better, so use 1 - rate)
  const hallucinationScore = 1 - result.hallucinationRate.score;

  const weighted =
    result.faithfulness.score * weights.faithfulness +
    result.answerRelevance.score * weights.answerRelevance +
    result.contextPrecision.score * weights.contextPrecision +
    result.contextRecall.score * weights.contextRecall +
    hallucinationScore * weights.hallucinationRate;

  return Math.max(0, Math.min(1, weighted));
}

// ═══════════════════════════════════════════════════════════════
// RAG EVALUATOR CLASS
// ═══════════════════════════════════════════════════════════════

export class RAGEvaluator {
  private config: EvalConfig;

  constructor(config: Partial<EvalConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate a single RAG pipeline output against a test case
   */
  async evaluateOne(
    testCase: EvalTestCase,
    output: EvalPipelineOutput
  ): Promise<EvalResult> {
    const [faithfulness, answerRelevance, contextPrecision, contextRecall, hallucinationRate] =
      await Promise.all([
        scoreFaithfulness(output.answer, output.documents),
        scoreAnswerRelevance(testCase.query, output.answer),
        scoreContextPrecision(testCase.query, output.documents),
        scoreContextRecall(testCase.query, output.answer, output.documents, testCase.expectedDocIds),
        scoreHallucinationRate(output.answer, output.documents),
      ]);

    const overallScore = computeOverallScore(
      { faithfulness, answerRelevance, contextPrecision, contextRecall, hallucinationRate },
      this.config.weights
    );

    // Optionally compute confidence score
    let confidence: ConfidenceScore | undefined;
    try {
      const scorer = getConfidenceScorer();
      confidence = scorer.quickScore({
        query: testCase.query,
        answer: output.answer,
        documents: output.documents,
        documentScores: output.documents.map((d) => d.score),
      });
    } catch {
      // Confidence scoring is optional
    }

    return {
      testCaseId: testCase.id,
      query: testCase.query,
      timestamp: new Date().toISOString(),
      faithfulness,
      answerRelevance,
      contextPrecision,
      contextRecall,
      hallucinationRate,
      overallScore,
      answer: output.answer,
      expectedAnswer: testCase.expectedAnswer,
      documentsUsed: output.documents.length,
      processingTime: output.processingTime,
      confidence,
    };
  }

  /**
   * Run evaluation on multiple test cases with concurrency control
   */
  async evaluateBatch(
    testCases: EvalTestCase[],
    pipelineFn: (query: string) => Promise<EvalPipelineOutput>
  ): Promise<EvalRunResult> {
    const runId = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const start = Date.now();
    const results: EvalResult[] = [];

    // Process with concurrency limit
    const batches: EvalTestCase[][] = [];
    for (let i = 0; i < testCases.length; i += this.config.concurrency) {
      batches.push(testCases.slice(i, i + this.config.concurrency));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (testCase) => {
          const output = await pipelineFn(testCase.query);
          return this.evaluateOne(testCase, output);
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create a failed result
          const tc = batch[batchResults.indexOf(result)];
          results.push({
            testCaseId: tc?.id ?? 'unknown',
            query: tc?.query ?? '',
            timestamp: new Date().toISOString(),
            faithfulness: { score: 0, details: `Error: ${result.reason}` },
            answerRelevance: { score: 0, details: 'Evaluation failed' },
            contextPrecision: { score: 0, details: 'Evaluation failed' },
            contextRecall: { score: 0, details: 'Evaluation failed' },
            hallucinationRate: { score: 1, details: 'Evaluation failed' },
            overallScore: 0,
            answer: '',
            expectedAnswer: tc?.expectedAnswer,
            documentsUsed: 0,
          });
        }
      }
    }

    return this.aggregateResults(runId, results, Date.now() - start);
  }

  /**
   * Evaluate pre-computed outputs (no pipeline function needed)
   */
  async evaluateOutputs(
    pairs: Array<{ testCase: EvalTestCase; output: EvalPipelineOutput }>
  ): Promise<EvalRunResult> {
    const runId = `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const start = Date.now();

    const batches: typeof pairs[] = [];
    for (let i = 0; i < pairs.length; i += this.config.concurrency) {
      batches.push(pairs.slice(i, i + this.config.concurrency));
    }

    const results: EvalResult[] = [];
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(({ testCase, output }) => this.evaluateOne(testCase, output))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    return this.aggregateResults(runId, results, Date.now() - start);
  }

  /**
   * Aggregate individual results into a run summary
   */
  private aggregateResults(
    runId: string,
    results: EvalResult[],
    durationMs: number
  ): EvalRunResult {
    const n = results.length || 1;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    const percentile = (arr: number[], p: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * p);
      return sorted[Math.min(idx, sorted.length - 1)] ?? 0;
    };

    const overallScores = results.map((r) => r.overallScore);
    const passed = results.filter((r) => r.overallScore >= this.config.passThreshold).length;

    // Group by tag
    const scoresByTag: Record<string, { avg: number; count: number }> = {};
    // Group by difficulty
    const scoresByDifficulty: Record<string, { avg: number; count: number }> = {};

    // We need to re-derive tags from test cases, but we only have results.
    // Tags are not stored in EvalResult, so we skip tag grouping here.
    // The caller can do this with the raw results.

    return {
      runId,
      timestamp: new Date().toISOString(),
      durationMs,
      totalCases: results.length,
      passedCases: passed,
      failedCases: results.length - passed,

      avgFaithfulness: avg(results.map((r) => r.faithfulness.score)),
      avgAnswerRelevance: avg(results.map((r) => r.answerRelevance.score)),
      avgContextPrecision: avg(results.map((r) => r.contextPrecision.score)),
      avgContextRecall: avg(results.map((r) => r.contextRecall.score)),
      avgHallucinationRate: avg(results.map((r) => r.hallucinationRate.score)),
      avgOverallScore: avg(overallScores),

      p50OverallScore: percentile(overallScores, 0.5),
      p95OverallScore: percentile(overallScores, 0.95),
      minOverallScore: Math.min(...overallScores, 0),

      scoresByTag,
      scoresByDifficulty,

      results,
      config: this.config,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON & CONVENIENCE
// ═══════════════════════════════════════════════════════════════

let _evaluator: RAGEvaluator | null = null;

export function getRAGEvaluator(config?: Partial<EvalConfig>): RAGEvaluator {
  if (!_evaluator || config) {
    _evaluator = new RAGEvaluator(config);
  }
  return _evaluator;
}

/**
 * Quick single-query evaluation
 */
export async function evaluateRAGResponse(
  query: string,
  answer: string,
  documents: ScoredDocument[],
  expectedAnswer?: string
): Promise<EvalResult> {
  const evaluator = getRAGEvaluator();
  return evaluator.evaluateOne(
    { id: `quick_${Date.now()}`, query, expectedAnswer },
    { query, answer, documents }
  );
}
