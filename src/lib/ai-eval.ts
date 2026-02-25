/**
 * AI Evaluation Framework
 *
 * Systematic quality measurement for all AI outputs in the platform.
 * Implements RAGAS-style metrics adapted for crypto news analysis.
 *
 * Metrics:
 *   - Faithfulness: Does the AI output align with the source data?
 *   - Relevance: Is the response relevant to the query?
 *   - Coherence: Is the output internally consistent?
 *   - Factuality: Are specific claims verifiable?
 *   - Latency: Response time against SLA targets
 *   - Cost Efficiency: Quality per dollar spent
 *
 * Modes:
 *   - Online: Evaluate responses in real-time (sampling)
 *   - Offline: Run evaluation suites against golden datasets
 *   - A/B: Compare two models on the same prompts
 *
 * Usage:
 *   import { AIEvaluator, EvalSuite } from '@/lib/ai-eval';
 *
 *   // Online evaluation (sample 10% of requests)
 *   const evaluator = new AIEvaluator({ sampleRate: 0.1 });
 *   const result = await evaluator.evaluate({
 *     query: 'What is the BTC trend?',
 *     response: aiOutput,
 *     context: sourceArticles,
 *     groundTruth: 'Bitcoin is trending upward...',
 *   });
 *
 *   // Offline evaluation suite
 *   const suite = new EvalSuite('sentiment-analysis');
 *   suite.addCase({ input: '...', expected: '...', tags: ['bullish'] });
 *   const report = await suite.run('groq', 'llama-3.3-70b-versatile');
 *
 * @module ai-eval
 */

import { metrics as telemetryMetrics } from './telemetry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvalInput {
  /** The user query or prompt */
  query: string;
  /** The AI-generated response to evaluate */
  response: string;
  /** Source context/documents used to generate the response */
  context?: string[];
  /** Known correct answer (for supervised evaluation) */
  groundTruth?: string;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface EvalScore {
  /** Metric name */
  metric: string;
  /** Score between 0 and 1 */
  score: number;
  /** Human-readable explanation */
  explanation: string;
  /** Raw details for debugging */
  details?: Record<string, unknown>;
}

export interface EvalResult {
  /** Input that was evaluated */
  input: EvalInput;
  /** Individual metric scores */
  scores: EvalScore[];
  /** Weighted aggregate score (0-1) */
  aggregateScore: number;
  /** Evaluation latency in ms */
  evalLatencyMs: number;
  /** Timestamp */
  timestamp: string;
  /** Evaluator model used */
  evaluatorModel: string;
}

export interface EvalSuiteResult {
  /** Suite name */
  suite: string;
  /** Model being evaluated */
  model: string;
  /** Provider being evaluated */
  provider: string;
  /** Individual case results */
  results: EvalResult[];
  /** Aggregate metrics across all cases */
  summary: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    avgScore: number;
    metricAverages: Record<string, number>;
    p50LatencyMs: number;
    p95LatencyMs: number;
    totalCostMicroUsd: number;
  };
  /** Timestamp */
  timestamp: string;
}

export interface EvalCase {
  /** Unique test case ID */
  id: string;
  /** Input prompt */
  input: string;
  /** Expected output (or pattern) */
  expected: string;
  /** Context documents */
  context?: string[];
  /** Tags for filtering */
  tags?: string[];
  /** Minimum acceptable score (0-1) */
  threshold?: number;
}

interface EvaluatorConfig {
  /** Sample rate for online evaluation (0-1), default 0.1 */
  sampleRate?: number;
  /** Model to use as evaluator (LLM-as-judge), default uses cheapest available */
  evaluatorModel?: string;
  /** Custom metric weights */
  weights?: Partial<Record<string, number>>;
  /** Minimum score to consider "passing" */
  passThreshold?: number;
}

// ---------------------------------------------------------------------------
// Default Metric Weights
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: Record<string, number> = {
  faithfulness: 0.25,
  relevance: 0.25,
  coherence: 0.20,
  factuality: 0.15,
  completeness: 0.15,
};

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

export class AIEvaluator {
  private config: Required<EvaluatorConfig>;
  private evalCount = 0;
  private totalScore = 0;

  constructor(config: EvaluatorConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 0.1,
      evaluatorModel: config.evaluatorModel ?? 'auto',
      weights: { ...DEFAULT_WEIGHTS, ...config.weights },
      passThreshold: config.passThreshold ?? 0.7,
    };
  }

  /**
   * Evaluate an AI response against multiple quality dimensions.
   * Returns null if sampling decides to skip this request.
   */
  async evaluate(input: EvalInput): Promise<EvalResult | null> {
    // Probabilistic sampling
    if (Math.random() > this.config.sampleRate) return null;

    const start = Date.now();
    const scores: EvalScore[] = [];

    // Run evaluations in parallel
    const [faithfulness, relevance, coherence, factuality, completeness] = await Promise.allSettled([
      this.evaluateFaithfulness(input),
      this.evaluateRelevance(input),
      this.evaluateCoherence(input),
      this.evaluateFactuality(input),
      this.evaluateCompleteness(input),
    ]);

    if (faithfulness.status === 'fulfilled') scores.push(faithfulness.value);
    if (relevance.status === 'fulfilled') scores.push(relevance.value);
    if (coherence.status === 'fulfilled') scores.push(coherence.value);
    if (factuality.status === 'fulfilled') scores.push(factuality.value);
    if (completeness.status === 'fulfilled') scores.push(completeness.value);

    // Aggregate
    const weights = this.config.weights;
    let weightedSum = 0;
    let weightTotal = 0;

    for (const s of scores) {
      const w = weights[s.metric] ?? 0.1;
      weightedSum += s.score * w;
      weightTotal += w;
    }

    const aggregateScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

    const result: EvalResult = {
      input,
      scores,
      aggregateScore,
      evalLatencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      evaluatorModel: this.config.evaluatorModel,
    };

    // Track metrics
    this.evalCount++;
    this.totalScore += aggregateScore;
    telemetryMetrics.aiInferences.add(1, { type: 'eval', passed: aggregateScore >= this.config.passThreshold });

    return result;
  }

  /**
   * Get summary statistics for all evaluations run so far.
   */
  getStats(): { evalCount: number; avgScore: number } {
    return {
      evalCount: this.evalCount,
      avgScore: this.evalCount > 0 ? this.totalScore / this.evalCount : 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Individual Metric Evaluators
  // ---------------------------------------------------------------------------

  private async evaluateFaithfulness(input: EvalInput): Promise<EvalScore> {
    if (!input.context?.length) {
      return { metric: 'faithfulness', score: 1.0, explanation: 'No context provided — skipped' };
    }

    const score = computeFaithfulness(input.response, input.context);
    return {
      metric: 'faithfulness',
      score,
      explanation: score > 0.8
        ? 'Response is well-grounded in source context'
        : score > 0.5
        ? 'Response partially deviates from source context'
        : 'Response contains claims not supported by context',
    };
  }

  private async evaluateRelevance(input: EvalInput): Promise<EvalScore> {
    const score = computeRelevance(input.query, input.response);
    return {
      metric: 'relevance',
      score,
      explanation: score > 0.8
        ? 'Response directly addresses the query'
        : score > 0.5
        ? 'Response is partially relevant'
        : 'Response does not address the query',
    };
  }

  private async evaluateCoherence(input: EvalInput): Promise<EvalScore> {
    const score = computeCoherence(input.response);
    return {
      metric: 'coherence',
      score,
      explanation: score > 0.8
        ? 'Response is well-structured and coherent'
        : 'Response has structural or logical issues',
    };
  }

  private async evaluateFactuality(input: EvalInput): Promise<EvalScore> {
    if (!input.groundTruth) {
      return { metric: 'factuality', score: 1.0, explanation: 'No ground truth provided — skipped' };
    }

    const score = computeFactuality(input.response, input.groundTruth);
    return {
      metric: 'factuality',
      score,
      explanation: score > 0.8
        ? 'Response aligns with known facts'
        : 'Response contains factual discrepancies',
      details: { groundTruth: input.groundTruth },
    };
  }

  private async evaluateCompleteness(input: EvalInput): Promise<EvalScore> {
    const score = computeCompleteness(input.query, input.response);
    return {
      metric: 'completeness',
      score,
      explanation: score > 0.8
        ? 'Response thoroughly addresses the query'
        : 'Response is incomplete',
    };
  }
}

// ---------------------------------------------------------------------------
// Evaluation Suite (offline batch testing)
// ---------------------------------------------------------------------------

export class EvalSuite {
  private name: string;
  private cases: EvalCase[] = [];

  constructor(name: string) {
    this.name = name;
  }

  addCase(testCase: EvalCase): void {
    this.cases.push(testCase);
  }

  addCases(testCases: EvalCase[]): void {
    this.cases.push(...testCases);
  }

  /**
   * Run the evaluation suite against a specific AI model.
   *
   * @param generateFn - Function that generates a response given a prompt
   */
  async run(
    provider: string,
    model: string,
    generateFn: (prompt: string, context?: string[]) => Promise<string>,
  ): Promise<EvalSuiteResult> {
    const evaluator = new AIEvaluator({ sampleRate: 1.0 }); // Evaluate everything in offline mode
    const results: EvalResult[] = [];
    const latencies: number[] = [];

    for (const testCase of this.cases) {
      const start = Date.now();
      try {
        const response = await generateFn(testCase.input, testCase.context);
        const latency = Date.now() - start;
        latencies.push(latency);

        const evalResult = await evaluator.evaluate({
          query: testCase.input,
          response,
          context: testCase.context,
          groundTruth: testCase.expected,
          metadata: { caseId: testCase.id, tags: testCase.tags },
        });

        if (evalResult) results.push(evalResult);
      } catch (err) {
        // Record failed generation as zero score
        results.push({
          input: { query: testCase.input, response: '', groundTruth: testCase.expected },
          scores: [{ metric: 'error', score: 0, explanation: (err as Error).message }],
          aggregateScore: 0,
          evalLatencyMs: Date.now() - start,
          timestamp: new Date().toISOString(),
          evaluatorModel: 'error',
        });
      }
    }

    // Compute summary
    const metricSums: Record<string, { sum: number; count: number }> = {};
    let totalScore = 0;

    for (const r of results) {
      totalScore += r.aggregateScore;
      for (const s of r.scores) {
        if (!metricSums[s.metric]) metricSums[s.metric] = { sum: 0, count: 0 };
        metricSums[s.metric].sum += s.score;
        metricSums[s.metric].count++;
      }
    }

    const metricAverages: Record<string, number> = {};
    for (const [metric, { sum, count }] of Object.entries(metricSums)) {
      metricAverages[metric] = count > 0 ? sum / count : 0;
    }

    const sortedLatencies = latencies.sort((a, b) => a - b);

    return {
      suite: this.name,
      model,
      provider,
      results,
      summary: {
        totalCases: this.cases.length,
        passedCases: results.filter((r) => r.aggregateScore >= 0.7).length,
        failedCases: results.filter((r) => r.aggregateScore < 0.7).length,
        avgScore: results.length > 0 ? totalScore / results.length : 0,
        metricAverages,
        p50LatencyMs: sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] ?? 0,
        p95LatencyMs: sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] ?? 0,
        totalCostMicroUsd: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Heuristic Scoring Functions (fast, no AI calls needed)
// ---------------------------------------------------------------------------

/**
 * Faithfulness: Measures how much of the response is grounded in the context.
 * Uses n-gram overlap between response and context documents.
 */
function computeFaithfulness(response: string, context: string[]): number {
  const responseTokens = tokenize(response);
  if (responseTokens.length === 0) return 0;

  const contextText = context.join(' ').toLowerCase();
  const contextTokenSet = new Set(tokenize(contextText));

  // Bigram overlap for more robust matching
  const responseBigrams = getBigrams(responseTokens);
  const contextBigrams = new Set(getBigrams(Array.from(contextTokenSet)));

  let bigramMatches = 0;
  for (const bg of responseBigrams) {
    if (contextBigrams.has(bg)) bigramMatches++;
  }

  const bigramFaithfulness = responseBigrams.length > 0
    ? bigramMatches / responseBigrams.length
    : 0;

  // Unigram overlap
  let unigramMatches = 0;
  for (const token of responseTokens) {
    if (contextTokenSet.has(token)) unigramMatches++;
  }

  const unigramFaithfulness = unigramMatches / responseTokens.length;

  // Weighted combination
  return Math.min(1, bigramFaithfulness * 0.6 + unigramFaithfulness * 0.4);
}

/**
 * Relevance: Measures how relevant the response is to the query.
 * Uses keyword overlap and semantic proximity heuristics.
 */
function computeRelevance(query: string, response: string): number {
  const queryTokens = tokenize(query);
  const responseTokens = new Set(tokenize(response));

  if (queryTokens.length === 0) return 1;

  // What fraction of query terms appear in the response?
  let matches = 0;
  for (const token of queryTokens) {
    if (responseTokens.has(token)) matches++;
  }

  const termOverlap = matches / queryTokens.length;

  // Length penalty — very short responses are likely incomplete
  const lengthScore = Math.min(1, response.split(/\s+/).length / 20);

  return termOverlap * 0.7 + lengthScore * 0.3;
}

/**
 * Coherence: Measures structural quality of the response.
 */
function computeCoherence(response: string): number {
  if (!response.trim()) return 0;

  let score = 1.0;

  // Penalize very short responses
  const words = response.split(/\s+/);
  if (words.length < 10) score -= 0.2;

  // Penalize excessive repetition
  const sentences = response.split(/[.!?]+/).filter(Boolean);
  if (sentences.length > 2) {
    const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
    const repetitionRatio = uniqueSentences.size / sentences.length;
    if (repetitionRatio < 0.7) score -= 0.3;
  }

  // Penalize unfinished sentences (ends mid-word or with comma)
  if (response.trim().endsWith(',') || response.trim().endsWith('...')) {
    score -= 0.1;
  }

  // Penalize inconsistent formatting (e.g., markdown mixed with plain text)
  const hasMarkdown = /[*#`]/.test(response);
  const hasPlainNumberedSteps = /^\d+\./m.test(response);
  if (hasMarkdown && hasPlainNumberedSteps) {
    // Mixed formatting is fine, but check for broken markdown
    const openBackticks = (response.match(/```/g) || []).length;
    if (openBackticks % 2 !== 0) score -= 0.15;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Factuality: Measures alignment between response and ground truth.
 * Uses token overlap and key entity matching.
 */
function computeFactuality(response: string, groundTruth: string): number {
  const responseTokens = new Set(tokenize(response));
  const truthTokens = tokenize(groundTruth);

  if (truthTokens.length === 0) return 1;

  // How many ground truth tokens appear in the response?
  let matches = 0;
  for (const token of truthTokens) {
    if (responseTokens.has(token)) matches++;
  }

  const recall = matches / truthTokens.length;

  // Check for number matching (important for financial data)
  const responseNumbers = extractNumbers(response);
  const truthNumbers = extractNumbers(groundTruth);

  let numberAccuracy = 1.0;
  if (truthNumbers.length > 0) {
    let numMatches = 0;
    for (const num of truthNumbers) {
      // Allow 5% tolerance for numerical matching
      if (responseNumbers.some((rn) => Math.abs(rn - num) / Math.max(Math.abs(num), 1) < 0.05)) {
        numMatches++;
      }
    }
    numberAccuracy = numMatches / truthNumbers.length;
  }

  return recall * 0.5 + numberAccuracy * 0.5;
}

/**
 * Completeness: Does the response address all aspects of the query?
 */
function computeCompleteness(query: string, response: string): number {
  // Extract question aspects (words after question words)
  const questionWords = ['what', 'why', 'how', 'when', 'where', 'which', 'who'];
  const queryLower = query.toLowerCase();
  const aspects = queryLower.split(/\s+/).filter(
    (w) => !questionWords.includes(w) && w.length > 2,
  );

  if (aspects.length === 0) return 1;

  const responseLower = response.toLowerCase();
  let addressed = 0;

  for (const aspect of aspects) {
    if (responseLower.includes(aspect)) addressed++;
  }

  return aspects.length > 0 ? addressed / aspects.length : 1;
}

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function getBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/[-+]?\d*\.?\d+/g);
  if (!matches) return [];
  return matches.map(Number).filter((n) => !isNaN(n));
}

// ---------------------------------------------------------------------------
// Pre-built Evaluation Suites
// ---------------------------------------------------------------------------

/**
 * Golden dataset for crypto sentiment analysis evaluation.
 */
export function createSentimentEvalSuite(): EvalSuite {
  const suite = new EvalSuite('crypto-sentiment');

  suite.addCases([
    {
      id: 'sent-001',
      input: 'Bitcoin surges past $100,000 as institutional demand hits record levels',
      expected: 'bullish',
      tags: ['bitcoin', 'price', 'institutional'],
    },
    {
      id: 'sent-002',
      input: 'SEC files lawsuit against major crypto exchange, alleging securities violations',
      expected: 'bearish',
      tags: ['regulation', 'sec', 'exchange'],
    },
    {
      id: 'sent-003',
      input: 'Ethereum completes Dencun upgrade, reducing L2 fees by 90%',
      expected: 'bullish',
      tags: ['ethereum', 'upgrade', 'technical'],
    },
    {
      id: 'sent-004',
      input: 'Major stablecoin depegs to $0.95, triggering market-wide uncertainty',
      expected: 'bearish',
      tags: ['stablecoin', 'depeg', 'risk'],
    },
    {
      id: 'sent-005',
      input: 'Bitcoin hash rate reaches new all-time high as mining difficulty increases',
      expected: 'neutral',
      tags: ['bitcoin', 'mining', 'technical'],
    },
    {
      id: 'sent-006',
      input: 'BlackRock Bitcoin ETF sees $1B inflows in single day',
      expected: 'bullish',
      tags: ['bitcoin', 'etf', 'institutional'],
    },
    {
      id: 'sent-007',
      input: 'Major protocol suffers $200M exploit due to smart contract vulnerability',
      expected: 'bearish',
      tags: ['security', 'exploit', 'defi'],
    },
    {
      id: 'sent-008',
      input: 'Federal Reserve maintains interest rates unchanged, markets steady',
      expected: 'neutral',
      tags: ['macro', 'fed', 'rates'],
    },
  ]);

  return suite;
}

/**
 * Golden dataset for market analysis evaluation.
 */
export function createMarketAnalysisEvalSuite(): EvalSuite {
  const suite = new EvalSuite('market-analysis');

  suite.addCases([
    {
      id: 'mkt-001',
      input: 'Provide a technical analysis of BTC/USDT on the daily timeframe',
      expected: 'Analysis should include: support/resistance levels, trend direction, key indicators (RSI, MACD), volume analysis, potential entry/exit points',
      tags: ['technical-analysis', 'bitcoin'],
      threshold: 0.6,
    },
    {
      id: 'mkt-002',
      input: 'What are the key risk factors for the crypto market this week?',
      expected: 'Should mention: regulatory developments, macro events, technical levels, liquidation risks, on-chain metrics',
      tags: ['risk-analysis', 'macro'],
      threshold: 0.5,
    },
    {
      id: 'mkt-003',
      input: 'Compare Ethereum and Solana ecosystem growth in the last quarter',
      expected: 'Should include: TVL comparison, transaction volume, developer activity, new protocol launches, fee revenue',
      tags: ['ecosystem', 'comparison'],
      threshold: 0.5,
    },
  ]);

  return suite;
}

/**
 * Golden dataset for news summarization evaluation.
 */
export function createSummarizationEvalSuite(): EvalSuite {
  const suite = new EvalSuite('news-summarization');

  suite.addCases([
    {
      id: 'sum-001',
      input: 'Summarize the following crypto news article in 2-3 sentences.',
      context: [
        'Bitcoin has surged past the $100,000 mark for the first time in its history, ' +
        'driven by a combination of institutional demand from newly approved spot ETFs, ' +
        'growing adoption in emerging markets, and the upcoming halving event. ' +
        'Trading volume on major exchanges doubled compared to last month, ' +
        'with Coinbase and Binance reporting record trading activity. ' +
        'Analysts predict continued momentum toward $120,000 by year end.',
      ],
      expected: 'Bitcoin surpassed $100,000 driven by ETF demand, emerging market adoption, and halving anticipation. Exchange volume doubled with Coinbase and Binance seeing records. Analysts target $120,000.',
      tags: ['summarization', 'bitcoin'],
      threshold: 0.7,
    },
  ]);

  return suite;
}
