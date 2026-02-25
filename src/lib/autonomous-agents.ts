/**
 * Autonomous News Agent System
 *
 * A multi-agent architecture where specialized AI agents collaborate to
 * provide comprehensive crypto market intelligence. Each agent has a
 * specific expertise and communicates through a shared message bus.
 *
 * Agents:
 *   1. Scout Agent      — Discovers breaking news from multiple sources
 *   2. Analyst Agent    — Deep-dives into market implications
 *   3. Sentiment Agent  — Gauges community and market sentiment
 *   4. Risk Agent       — Identifies risks, FUD, and potential scams
 *   5. Synthesis Agent  — Combines insights into actionable briefings
 *   6. Critic Agent     — Challenges conclusions, plays devil's advocate
 *
 * Architecture:
 *   Source Feeds → Scout → [Analyst, Sentiment, Risk] → Synthesis → Critic → Output
 *
 * Message Bus:
 *   Agents communicate via typed messages. Each agent subscribes to
 *   relevant message types and publishes its outputs.
 *
 * Usage:
 *   import { AgentOrchestrator } from '@/lib/autonomous-agents';
 *
 *   const orchestrator = new AgentOrchestrator();
 *   const briefing = await orchestrator.processTopic('Bitcoin ETF inflows hit record');
 *   // Returns: { summary, analysis, sentiment, risks, recommendation, confidence }
 *
 * @module autonomous-agents
 */

import { getAICostTracker } from './ai-cost-dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentRole = 'scout' | 'analyst' | 'sentiment' | 'risk' | 'synthesis' | 'critic';

export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'all';
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  /** Track message chain for debugging */
  parentId?: string;
}

export interface AgentConfig {
  role: AgentRole;
  systemPrompt: string;
  /** Model preference (uses AI router if not specified) */
  model?: string;
  provider?: string;
  /** Maximum tokens for this agent's output */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
}

export interface AgentResult {
  role: AgentRole;
  output: string;
  structured?: Record<string, unknown>;
  latencyMs: number;
  model: string;
  tokensUsed: number;
}

export interface BriefingResult {
  topic: string;
  timestamp: string;
  agents: AgentResult[];
  /** Final synthesized output */
  briefing: {
    summary: string;
    keyInsights: string[];
    sentiment: string;
    sentimentScore: number;
    risks: string[];
    opportunities: string[];
    recommendation: string;
    confidence: number;
    timeHorizon: string;
  };
  /** Critic's challenges */
  critique: {
    weaknesses: string[];
    alternatives: string[];
    blindSpots: string[];
    adjustedConfidence: number;
  };
  totalLatencyMs: number;
  totalCostMicroUsd: number;
}

// ---------------------------------------------------------------------------
// Agent Definitions
// ---------------------------------------------------------------------------

const AGENT_CONFIGS: Record<AgentRole, AgentConfig> = {
  scout: {
    role: 'scout',
    systemPrompt: `You are a Crypto Scout Agent. Your job is to identify the key facts and context in breaking crypto news.

For every piece of news, extract:
1. The core event (what happened?)
2. Key entities involved (tokens, protocols, people, organizations)
3. Immediate market implications
4. Historical context (has something similar happened before?)
5. Related ongoing narratives

Be factual and concise. Do not speculate. Return JSON.`,
    maxTokens: 1000,
    temperature: 0.1,
  },

  analyst: {
    role: 'analyst',
    systemPrompt: `You are a Crypto Market Analyst Agent. Given a news event and its core facts, provide deep technical and fundamental analysis.

Your analysis should include:
1. Price impact assessment (immediate and medium-term)
2. Technical level implications (support/resistance affected)
3. On-chain metrics that might confirm/deny the trend
4. Correlated assets and sectors affected
5. Historical precedents and their outcomes
6. Volume and liquidity implications

Be quantitative where possible. Cite specific levels or percentages. Return JSON.`,
    maxTokens: 1500,
    temperature: 0.3,
  },

  sentiment: {
    role: 'sentiment',
    systemPrompt: `You are a Crypto Sentiment Agent. Analyze the sentiment implications of a news event across multiple dimensions.

Evaluate:
1. Overall market sentiment (very bearish to very bullish, -1 to +1)
2. Social media likely reaction (Twitter/X, Reddit, Telegram)
3. Institutional vs retail perspective
4. Fear & Greed implications
5. Narrative alignment (does this reinforce or challenge current market narrative?)
6. Contrarian signals (is overwhelming consensus a counter-indicator?)

Return JSON with numeric scores and explanations.`,
    maxTokens: 1000,
    temperature: 0.2,
  },

  risk: {
    role: 'risk',
    systemPrompt: `You are a Crypto Risk Assessment Agent. Identify all potential risks, concerns, and red flags in a news event.

Evaluate:
1. Regulatory risk (SEC, CFTC, international regulators)
2. Smart contract / technical risk
3. Counterparty risk
4. Market manipulation indicators
5. Rug pull or scam indicators
6. Systemic risk (could this cascade?)
7. Information quality (is the source reliable? could this be FUD?)

Rate each risk 1-10 severity. Be skeptical but fair. Return JSON.`,
    maxTokens: 1000,
    temperature: 0.2,
  },

  synthesis: {
    role: 'synthesis',
    systemPrompt: `You are a Crypto Synthesis Agent. Combine inputs from the Analyst, Sentiment, and Risk agents into a coherent actionable briefing.

Your briefing should include:
1. Executive summary (2-3 sentences)
2. Key insights (list)
3. Overall sentiment assessment
4. Top risks
5. Opportunities identified
6. Recommended position/action
7. Confidence level (0-100%)
8. Time horizon for the analysis

Resolve any contradictions between agents by weighing evidence. Be concise and actionable. Return JSON.`,
    maxTokens: 1500,
    temperature: 0.3,
  },

  critic: {
    role: 'critic',
    systemPrompt: `You are a Crypto Critic Agent. Your job is to challenge the Synthesis Agent's conclusions and identify potential blind spots.

For every briefing, evaluate:
1. What assumptions are being made?
2. What alternative interpretations exist?
3. What information might be missing?
4. Is the confidence level justified?
5. What could go wrong with the recommended action?
6. Are there confirmation biases?

Provide an adjusted confidence score. Be constructive but rigorous. Return JSON.`,
    maxTokens: 1000,
    temperature: 0.4,
  },
};

// ---------------------------------------------------------------------------
// Agent Orchestrator
// ---------------------------------------------------------------------------

export class AgentOrchestrator {
  private messages: AgentMessage[] = [];
  private generateFn: (system: string, prompt: string, maxTokens: number, temperature: number) => Promise<{ text: string; model: string; tokens: number }>;

  /**
   * Create an orchestrator with a custom generation function.
   * If not provided, uses a default that throws (must be wired up to your AI provider).
   */
  constructor(
    generateFn?: (system: string, prompt: string, maxTokens: number, temperature: number) => Promise<{ text: string; model: string; tokens: number }>,
  ) {
    this.generateFn = generateFn ?? defaultGenerateFn;
  }

  /**
   * Process a topic through the full agent pipeline.
   */
  async processTopic(topic: string, additionalContext?: string): Promise<BriefingResult> {
    const start = Date.now();
    const results: AgentResult[] = [];
    let totalCost = 0;

    // Phase 1: Scout extracts facts
    const scoutResult = await this.runAgent('scout', topic, additionalContext);
    results.push(scoutResult);

    // Phase 2: Analyst, Sentiment, Risk run in parallel
    const phase2Input = `Topic: ${topic}\n\nScout Report:\n${scoutResult.output}`;
    const [analystResult, sentimentResult, riskResult] = await Promise.all([
      this.runAgent('analyst', phase2Input),
      this.runAgent('sentiment', phase2Input),
      this.runAgent('risk', phase2Input),
    ]);
    results.push(analystResult, sentimentResult, riskResult);

    // Phase 3: Synthesis combines all inputs
    const synthesisInput = [
      `Topic: ${topic}`,
      `\nScout Report:\n${scoutResult.output}`,
      `\nAnalyst Report:\n${analystResult.output}`,
      `\nSentiment Report:\n${sentimentResult.output}`,
      `\nRisk Report:\n${riskResult.output}`,
    ].join('\n');

    const synthesisResult = await this.runAgent('synthesis', synthesisInput);
    results.push(synthesisResult);

    // Phase 4: Critic reviews the synthesis
    const criticInput = `${synthesisInput}\n\nSynthesis Report:\n${synthesisResult.output}`;
    const criticResult = await this.runAgent('critic', criticInput);
    results.push(criticResult);

    // Parse structured outputs
    const briefing = safeParseJson(synthesisResult.output, {
      summary: synthesisResult.output.slice(0, 200),
      keyInsights: [],
      sentiment: 'neutral',
      sentimentScore: 0,
      risks: [],
      opportunities: [],
      recommendation: 'Hold',
      confidence: 50,
      timeHorizon: '24h',
    });

    const critique = safeParseJson(criticResult.output, {
      weaknesses: [],
      alternatives: [],
      blindSpots: [],
      adjustedConfidence: briefing.confidence * 0.8,
    });

    // Track costs
    for (const r of results) {
      totalCost += estimateCost(r.model, r.tokensUsed);
      getAICostTracker().record({
        timestamp: Date.now(),
        provider: r.model.includes('gemini') ? 'gemini' : r.model.includes('llama') ? 'groq' : 'openai',
        model: r.model,
        feature: `agent-${r.role}`,
        inputTokens: Math.floor(r.tokensUsed * 0.6),
        outputTokens: Math.floor(r.tokensUsed * 0.4),
        latencyMs: r.latencyMs,
        cached: false,
      });
    }

    return {
      topic,
      timestamp: new Date().toISOString(),
      agents: results,
      briefing,
      critique,
      totalLatencyMs: Date.now() - start,
      totalCostMicroUsd: totalCost,
    };
  }

  /**
   * Process a topic through a subset of agents for faster results.
   */
  async quickAnalysis(topic: string): Promise<{ summary: string; sentiment: number; risk: number; model: string }> {
    // Just run scout + synthesis for speed
    const scoutResult = await this.runAgent('scout', topic);
    const synthesisResult = await this.runAgent('synthesis', `Topic: ${topic}\n\nScout Report:\n${scoutResult.output}`);

    const parsed = safeParseJson(synthesisResult.output, {
      summary: synthesisResult.output.slice(0, 200),
      sentimentScore: 0,
      confidence: 50,
    });

    return {
      summary: parsed.summary,
      sentiment: parsed.sentimentScore,
      risk: 100 - parsed.confidence,
      model: synthesisResult.model,
    };
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async runAgent(role: AgentRole, input: string, additionalContext?: string): Promise<AgentResult> {
    const config = AGENT_CONFIGS[role];
    const start = Date.now();

    const prompt = additionalContext
      ? `${input}\n\nAdditional Context:\n${additionalContext}`
      : input;

    try {
      const { text, model, tokens } = await this.generateFn(
        config.systemPrompt,
        prompt,
        config.maxTokens ?? 1000,
        config.temperature ?? 0.3,
      );

      const result: AgentResult = {
        role,
        output: text,
        structured: safeParseJson(text, undefined),
        latencyMs: Date.now() - start,
        model,
        tokensUsed: tokens,
      };

      // Record message
      this.messages.push({
        id: `${role}-${Date.now()}`,
        from: role,
        to: 'all',
        type: 'report',
        payload: { output: text },
        timestamp: Date.now(),
      });

      return result;
    } catch (err) {
      return {
        role,
        output: `Agent ${role} failed: ${(err as Error).message}`,
        latencyMs: Date.now() - start,
        model: 'error',
        tokensUsed: 0,
      };
    }
  }

  /**
   * Get the full message history for debugging.
   */
  getMessageHistory(): AgentMessage[] {
    return [...this.messages];
  }
}

// ---------------------------------------------------------------------------
// Batch Processing
// ---------------------------------------------------------------------------

/**
 * Process multiple topics in parallel with the agent system.
 */
export async function batchProcessTopics(
  topics: string[],
  generateFn?: (system: string, prompt: string, maxTokens: number, temperature: number) => Promise<{ text: string; model: string; tokens: number }>,
  concurrency = 3,
): Promise<BriefingResult[]> {
  const results: BriefingResult[] = [];
  const chunks = chunkArray(topics, concurrency);

  for (const chunk of chunks) {
    const batchResults = await Promise.allSettled(
      chunk.map((topic) => {
        const orchestrator = new AgentOrchestrator(generateFn);
        return orchestrator.processTopic(topic);
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function safeParseJson<T>(text: string, fallback: T): T {
  try {
    // Strip markdown code fences if present
    let json = text.trim();
    if (json.startsWith('```json')) json = json.slice(7);
    if (json.startsWith('```')) json = json.slice(3);
    if (json.endsWith('```')) json = json.slice(0, -3);
    json = json.trim();

    const parsed = JSON.parse(json);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function estimateCost(model: string, tokens: number): number {
  // Rough average cost (input + output)
  const costPer1M: Record<string, number> = {
    'gpt-4o': 7.5,
    'gpt-4o-mini': 0.4,
    'gemini-2.0-flash': 0.25,
    'llama-3.3-70b-versatile': 0.7,
    'claude-sonnet-4-20250514': 9,
  };

  const rate = costPer1M[model] ?? 1;
  return Math.round((tokens / 1_000_000) * rate * 1_000_000);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Default generate function — throws if no AI provider is configured.
 * Wire this up to your AI router in production.
 */
async function defaultGenerateFn(
  system: string,
  prompt: string,
  maxTokens: number,
  temperature: number,
): Promise<{ text: string; model: string; tokens: number }> {
  // Try Groq first (fastest for agent tasks)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        model,
        tokens: data.usage?.total_tokens ?? maxTokens,
      };
    }
  }

  // Try Gemini Flash (cheap + fast)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (geminiKey) {
    const model = 'gemini-2.0-flash';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${system}\n\n${prompt}` }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const tokens = data.usageMetadata?.totalTokenCount ?? maxTokens;
      return { text, model, tokens };
    }
  }

  // Try OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        text: data.choices[0].message.content,
        model,
        tokens: data.usage?.total_tokens ?? maxTokens,
      };
    }
  }

  throw new Error('No AI provider available for agent system');
}
