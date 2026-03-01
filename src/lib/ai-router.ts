/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Multi-Model AI Router
 *
 * Intelligent routing layer that picks the optimal LLM for every request
 * based on task type, latency budget, cost constraints, and provider health.
 *
 * Architecture:
 *   ┌──────────────┐
 *   │  AI Request   │
 *   └──────┬───────┘
 *          ▼
 *   ┌──────────────┐   ┌──────────────────────────────┐
 *   │  Task Router  │──▶│ Select best model for task    │
 *   └──────┬───────┘   └──────────────────────────────┘
 *          ▼
 *   ┌──────────────┐   ┌──────────────────────────────┐
 *   │  Circuit      │──▶│ Skip if provider is degraded  │
 *   │  Breaker      │   └──────────────────────────────┘
 *   └──────┬───────┘
 *          ▼
 *   ┌──────────────┐   ┌──────────────────────────────┐
 *   │  Execute &    │──▶│ Stream or batch completion    │
 *   │  Fallback     │   └──────────────────────────────┘
 *   └──────┬───────┘
 *          ▼
 *   ┌──────────────┐   ┌──────────────────────────────┐
 *   │  Telemetry    │──▶│ Latency, tokens, cost, score  │
 *   └──────────────┘   └──────────────────────────────┘
 *
 * Supported providers:
 *   - Google Gemini (Flash 2.0 / Pro) — $100k GCP credits
 *   - Anthropic Claude (Opus 4.6 / Sonnet 4)
 *   - Groq (Llama 3.3 70B) — ultra-fast inference
 *   - OpenAI (GPT-4o / o3-mini)
 *   - OpenRouter (access to 200+ models)
 *
 * @module ai-router
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AITaskType =
  | 'summarize'       // News summarization
  | 'sentiment'       // Sentiment analysis
  | 'extract'         // Entity/fact extraction
  | 'classify'        // Event classification
  | 'generate'        // Content generation (reports, briefs)
  | 'reason'          // Complex multi-step reasoning (RAG, research)
  | 'translate'       // Translation
  | 'code'            // Code generation / analysis
  | 'vision'          // Image/chart analysis
  | 'embed'           // Text embeddings
  | 'chat'            // Conversational (Oracle, MCP)
  | 'fast-json'       // Quick structured JSON extraction
  | 'long-context'    // >100k token context window
  | 'realtime';       // Sub-200ms latency critical

export type ModelProvider = 'gemini' | 'anthropic' | 'openai' | 'groq' | 'openrouter';

export interface ModelSpec {
  provider: ModelProvider;
  model: string;
  displayName: string;
  /** Max input tokens */
  contextWindow: number;
  /** Max output tokens */
  maxOutput: number;
  /** Cost per million input tokens (USD) */
  inputCostPer1M: number;
  /** Cost per million output tokens (USD) */
  outputCostPer1M: number;
  /** Estimated tokens per second */
  tokensPerSecond: number;
  /** Which task types this model excels at */
  strengths: AITaskType[];
  /** Required env var for API key */
  envKey: string;
  /** Whether this model supports streaming */
  supportsStreaming: boolean;
  /** Whether this model supports JSON mode */
  supportsJsonMode: boolean;
  /** Whether this model supports vision */
  supportsVision: boolean;
  /** Whether this model supports function calling */
  supportsFunctions: boolean;
}

export interface RouteRequest {
  task: AITaskType;
  messages: ChatMessage[];
  /** Maximum acceptable latency in ms (default: no limit) */
  latencyBudgetMs?: number;
  /** Maximum acceptable cost per request in USD (default: no limit) */
  costBudgetUsd?: number;
  /** Preferred provider (override routing) */
  preferProvider?: ModelProvider;
  /** Preferred model (override routing) */
  preferModel?: string;
  /** Request JSON output */
  jsonMode?: boolean;
  /** Include images in the request */
  images?: Array<{ url: string; mimeType?: string }>;
  /** Max tokens for completion */
  maxTokens?: number;
  /** Temperature (0-2) */
  temperature?: number;
  /** Abort signal */
  signal?: AbortSignal;
  /** Whether to stream the response */
  stream?: boolean;
  /** Custom metadata for telemetry */
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessagePart[];
}

export type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

export interface RouteResult {
  content: string;
  model: string;
  provider: ModelProvider;
  usage: TokenUsage;
  latencyMs: number;
  estimatedCostUsd: number;
  cached: boolean;
  fallbackUsed: boolean;
  /** The full chain of models attempted */
  attemptChain: string[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface StreamChunk {
  token: string;
  done: boolean;
  model?: string;
  provider?: ModelProvider;
  usage?: TokenUsage;
}

// ---------------------------------------------------------------------------
// Model Registry
// ---------------------------------------------------------------------------

export const MODEL_REGISTRY: ModelSpec[] = [
  // ── Google Gemini ($100k GCP credits) ──────────────────────────────
  {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    contextWindow: 1_048_576,
    maxOutput: 8_192,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    tokensPerSecond: 350,
    strengths: ['fast-json', 'summarize', 'classify', 'extract', 'sentiment', 'translate', 'realtime', 'long-context'],
    envKey: 'GOOGLE_AI_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsFunctions: true,
  },
  {
    provider: 'gemini',
    model: 'gemini-2.5-pro-preview-06-05',
    displayName: 'Gemini 2.5 Pro',
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    inputCostPer1M: 1.25,
    outputCostPer1M: 10.00,
    tokensPerSecond: 150,
    strengths: ['reason', 'generate', 'code', 'long-context', 'vision', 'chat'],
    envKey: 'GOOGLE_AI_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsFunctions: true,
  },

  // ── Anthropic Claude ───────────────────────────────────────────────
  {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet 4',
    contextWindow: 200_000,
    maxOutput: 16_384,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    tokensPerSecond: 120,
    strengths: ['reason', 'generate', 'code', 'chat', 'extract'],
    envKey: 'ANTHROPIC_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: false,
    supportsVision: true,
    supportsFunctions: true,
  },
  {
    provider: 'anthropic',
    model: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    contextWindow: 200_000,
    maxOutput: 32_000,
    inputCostPer1M: 15.00,
    outputCostPer1M: 75.00,
    tokensPerSecond: 60,
    strengths: ['reason', 'generate', 'code'],
    envKey: 'ANTHROPIC_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: false,
    supportsVision: true,
    supportsFunctions: true,
  },

  // ── Groq (Llama 3.3 — ultra fast) ─────────────────────────────────
  {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    displayName: 'Llama 3.3 70B (Groq)',
    contextWindow: 128_000,
    maxOutput: 8_192,
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    tokensPerSecond: 500,
    strengths: ['fast-json', 'summarize', 'sentiment', 'classify', 'extract', 'realtime'],
    envKey: 'GROQ_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: false,
    supportsFunctions: true,
  },

  // ── OpenAI ─────────────────────────────────────────────────────────
  {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
    contextWindow: 128_000,
    maxOutput: 16_384,
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    tokensPerSecond: 150,
    strengths: ['generate', 'code', 'chat', 'vision', 'extract', 'reason'],
    envKey: 'OPENAI_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsFunctions: true,
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    contextWindow: 128_000,
    maxOutput: 16_384,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    tokensPerSecond: 250,
    strengths: ['fast-json', 'summarize', 'classify', 'sentiment', 'translate', 'realtime'],
    envKey: 'OPENAI_API_KEY',
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: true,
    supportsFunctions: true,
  },
];

// ---------------------------------------------------------------------------
// Provider Health Tracking (per-process, lightweight)
// ---------------------------------------------------------------------------

interface ProviderHealth {
  failures: number;
  lastFailure: number;
  lastSuccess: number;
  avgLatencyMs: number;
  /** Exponentially weighted moving average of latency */
  ewmaLatencyMs: number;
  requestCount: number;
}

const providerHealth = new Map<ModelProvider, ProviderHealth>();

function getHealth(provider: ModelProvider): ProviderHealth {
  if (!providerHealth.has(provider)) {
    providerHealth.set(provider, {
      failures: 0,
      lastFailure: 0,
      lastSuccess: 0,
      avgLatencyMs: 0,
      ewmaLatencyMs: 0,
      requestCount: 0,
    });
  }
  return providerHealth.get(provider)!;
}

function recordSuccess(provider: ModelProvider, latencyMs: number): void {
  const h = getHealth(provider);
  h.failures = 0;
  h.lastSuccess = Date.now();
  h.requestCount++;
  // EWMA with α=0.3 (recent values weighted more)
  h.ewmaLatencyMs = h.requestCount === 1
    ? latencyMs
    : 0.3 * latencyMs + 0.7 * h.ewmaLatencyMs;
  h.avgLatencyMs = h.avgLatencyMs === 0
    ? latencyMs
    : (h.avgLatencyMs * (h.requestCount - 1) + latencyMs) / h.requestCount;
}

function recordFailure(provider: ModelProvider): void {
  const h = getHealth(provider);
  h.failures++;
  h.lastFailure = Date.now();
}

function isProviderHealthy(provider: ModelProvider): boolean {
  const h = getHealth(provider);
  // Cool down for 30s after 3 consecutive failures
  if (h.failures >= 3 && Date.now() - h.lastFailure < 30_000) {
    return false;
  }
  // Cool down for 2min after 5+ consecutive failures
  if (h.failures >= 5 && Date.now() - h.lastFailure < 120_000) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Cost Tracking (per-process accumulator, flushed to KV periodically)
// ---------------------------------------------------------------------------

interface CostAccumulator {
  totalUsd: number;
  byProvider: Record<ModelProvider, number>;
  byTask: Record<AITaskType, number>;
  requestCount: number;
  tokenCount: { input: number; output: number };
  windowStart: number;
}

const costs: CostAccumulator = {
  totalUsd: 0,
  byProvider: {} as Record<ModelProvider, number>,
  byTask: {} as Record<AITaskType, number>,
  requestCount: 0,
  tokenCount: { input: 0, output: 0 },
  windowStart: Date.now(),
};

function trackCost(provider: ModelProvider, task: AITaskType, usage: TokenUsage, spec: ModelSpec): number {
  const cost = (usage.inputTokens * spec.inputCostPer1M + usage.outputTokens * spec.outputCostPer1M) / 1_000_000;
  costs.totalUsd += cost;
  costs.byProvider[provider] = (costs.byProvider[provider] || 0) + cost;
  costs.byTask[task] = (costs.byTask[task] || 0) + cost;
  costs.requestCount++;
  costs.tokenCount.input += usage.inputTokens;
  costs.tokenCount.output += usage.outputTokens;
  return cost;
}

/** Get current cost metrics (useful for /api/health and dashboards) */
export function getAIRouterMetrics(): {
  costs: CostAccumulator;
  health: Record<string, ProviderHealth>;
  availableProviders: string[];
} {
  const health: Record<string, ProviderHealth> = {};
  for (const [k, v] of providerHealth) health[k] = v;
  return {
    costs: { ...costs },
    health,
    availableProviders: getAvailableProviders(),
  };
}

// ---------------------------------------------------------------------------
// Provider Availability
// ---------------------------------------------------------------------------

function isProviderConfigured(provider: ModelProvider): boolean {
  switch (provider) {
    case 'gemini': return !!process.env.GOOGLE_AI_API_KEY;
    case 'anthropic': return !!process.env.ANTHROPIC_API_KEY;
    case 'openai': return !!process.env.OPENAI_API_KEY;
    case 'groq': return !!process.env.GROQ_API_KEY;
    case 'openrouter': return !!process.env.OPENROUTER_API_KEY;
    default: return false;
  }
}

function getAvailableProviders(): ModelProvider[] {
  return (['gemini', 'anthropic', 'openai', 'groq', 'openrouter'] as ModelProvider[])
    .filter(isProviderConfigured);
}

function getAvailableModels(): ModelSpec[] {
  return MODEL_REGISTRY.filter(m => isProviderConfigured(m.provider));
}

// ---------------------------------------------------------------------------
// Intelligent Model Selection
// ---------------------------------------------------------------------------

interface ScoredModel {
  spec: ModelSpec;
  score: number;
  reasons: string[];
}

/**
 * Score and rank models for a given request.
 *
 * Scoring dimensions:
 *   1. Task fit (does the model excel at this task type?)
 *   2. Latency fit (can it meet the latency budget?)
 *   3. Cost efficiency (lower cost per token = higher score)
 *   4. Provider health (unhealthy providers penalised)
 *   5. Capability requirements (vision, JSON mode, context window)
 */
function scoreModels(req: RouteRequest): ScoredModel[] {
  const available = getAvailableModels();
  if (available.length === 0) return [];

  // Estimate input tokens (rough: ~4 chars per token)
  const inputChars = req.messages.reduce((sum, m) => {
    const text = typeof m.content === 'string' ? m.content : m.content.map(p => p.type === 'text' ? p.text : '').join('');
    return sum + text.length;
  }, 0);
  const estimatedInputTokens = Math.ceil(inputChars / 4);

  return available
    .map((spec): ScoredModel | null => {
      let score = 0;
      const reasons: string[] = [];

      // ── Hard constraints (eliminate if not met) ───────────────────
      if (req.images && req.images.length > 0 && !spec.supportsVision) return null;
      if (req.jsonMode && !spec.supportsJsonMode) {
        // Anthropic doesn't have JSON mode but can still output JSON via prompting
        if (spec.provider !== 'anthropic') return null;
      }
      if (estimatedInputTokens > spec.contextWindow * 0.9) return null;

      // ── Task fit (0-40 points) ────────────────────────────────────
      if (spec.strengths.includes(req.task)) {
        score += 40;
        reasons.push(`Strong at ${req.task}`);
      } else {
        score += 15; // all models can attempt any task
      }

      // ── Latency fit (0-25 points) ─────────────────────────────────
      if (req.latencyBudgetMs) {
        const estimatedOutputTokens = req.maxTokens || 1024;
        const estimatedMs = (estimatedOutputTokens / spec.tokensPerSecond) * 1000 + 500; // +500ms network
        if (estimatedMs <= req.latencyBudgetMs) {
          score += 25;
          reasons.push(`Meets ${req.latencyBudgetMs}ms budget`);
        } else if (estimatedMs <= req.latencyBudgetMs * 1.5) {
          score += 12;
          reasons.push('Marginal latency fit');
        } else {
          score -= 10;
          reasons.push('Exceeds latency budget');
        }
      } else {
        score += 15; // no constraint → moderate bonus
      }

      // ── Cost efficiency (0-20 points) ─────────────────────────────
      if (req.costBudgetUsd) {
        const estimatedCost = (estimatedInputTokens * spec.inputCostPer1M + (req.maxTokens || 1024) * spec.outputCostPer1M) / 1_000_000;
        if (estimatedCost <= req.costBudgetUsd) {
          score += 20;
          reasons.push(`Under $${req.costBudgetUsd} budget`);
        } else {
          return null; // hard eliminate
        }
      } else {
        // Prefer cheaper models all else being equal
        const costScore = Math.max(0, 20 - spec.inputCostPer1M * 2);
        score += costScore;
      }

      // ── Provider health (0-15 points) ─────────────────────────────
      if (isProviderHealthy(spec.provider)) {
        score += 15;
      } else {
        score -= 20;
        reasons.push('Provider degraded');
      }

      // ── Preference override (+50 points) ──────────────────────────
      if (req.preferProvider === spec.provider) {
        score += 50;
        reasons.push('Preferred provider');
      }
      if (req.preferModel === spec.model) {
        score += 100;
        reasons.push('Preferred model');
      }

      return { spec, score, reasons };
    })
    .filter((m): m is ScoredModel => m !== null)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// Provider-Specific API Calls
// ---------------------------------------------------------------------------

async function callGemini(
  spec: ModelSpec,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean; signal?: AbortSignal },
): Promise<{ content: string; usage: TokenUsage }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${spec.model}:generateContent?key=${apiKey}`;

  // Convert messages to Gemini format
  const systemInstruction = messages.find(m => m.role === 'system');
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: typeof m.content === 'string'
        ? [{ text: m.content }]
        : m.content.map(p =>
            p.type === 'text'
              ? { text: p.text }
              : { inlineData: { mimeType: p.image_url.url.startsWith('data:') ? p.image_url.url.split(';')[0].split(':')[1] : 'image/jpeg', data: p.image_url.url.split(',')[1] || '' } },
          ),
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.3,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemInstruction) {
    const text = typeof systemInstruction.content === 'string'
      ? systemInstruction.content
      : systemInstruction.content.filter(p => p.type === 'text').map(p => (p as { type: 'text'; text: string }).text).join('\n');
    body.systemInstruction = { parts: [{ text }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const json = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
  };

  const content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage: TokenUsage = {
    inputTokens: json.usageMetadata?.promptTokenCount || 0,
    outputTokens: json.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: json.usageMetadata?.totalTokenCount || 0,
  };

  return { content, usage };
}

async function callAnthropic(
  spec: ModelSpec,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean; signal?: AbortSignal },
): Promise<{ content: string; usage: TokenUsage }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const systemMsg = messages.find(m => m.role === 'system');
  const system = systemMsg
    ? typeof systemMsg.content === 'string' ? systemMsg.content : systemMsg.content.filter(p => p.type === 'text').map(p => (p as { type: 'text'; text: string }).text).join('\n')
    : undefined;

  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: typeof m.content === 'string'
        ? m.content
        : m.content.map(p =>
            p.type === 'text'
              ? { type: 'text' as const, text: p.text }
              : { type: 'image' as const, source: { type: 'url' as const, url: p.image_url.url } },
          ),
    }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: spec.model,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.3,
      ...(system ? { system } : {}),
      messages: anthropicMessages,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const json = await res.json() as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const content = json.content
    .filter(b => b.type === 'text')
    .map(b => b.text || '')
    .join('');

  return {
    content,
    usage: {
      inputTokens: json.usage.input_tokens,
      outputTokens: json.usage.output_tokens,
      totalTokens: json.usage.input_tokens + json.usage.output_tokens,
    },
  };
}

async function callOpenAI(
  spec: ModelSpec,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean; signal?: AbortSignal },
): Promise<{ content: string; usage: TokenUsage }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = spec.provider === 'openrouter'
    ? 'https://openrouter.ai/api/v1'
    : (spec.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
  const key = spec.provider === 'openrouter' ? process.env.OPENROUTER_API_KEY :
               spec.provider === 'groq' ? process.env.GROQ_API_KEY : apiKey;

  if (!key) throw new Error(`${spec.provider} API key not set`);

  const openaiMessages = messages.map(m => ({
    role: m.role,
    content: typeof m.content === 'string' ? m.content : m.content.map(p =>
      p.type === 'text' ? { type: 'text' as const, text: p.text } : { type: 'image_url' as const, image_url: p.image_url },
    ),
  }));

  const body: Record<string, unknown> = {
    model: spec.model,
    messages: openaiMessages,
    max_tokens: options.maxTokens || 2048,
    temperature: options.temperature ?? 0.3,
  };

  if (options.jsonMode && spec.supportsJsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };
  if (spec.provider === 'openrouter') {
    headers['X-Title'] = 'Free Crypto News';
    headers['HTTP-Referer'] = 'https://cryptocurrency.cv';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`${spec.provider} ${res.status}: ${err}`);
  }

  const json = await res.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  return {
    content: json.choices[0]?.message?.content || '',
    usage: {
      inputTokens: json.usage?.prompt_tokens || 0,
      outputTokens: json.usage?.completion_tokens || 0,
      totalTokens: json.usage?.total_tokens || 0,
    },
  };
}

async function callModel(
  spec: ModelSpec,
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number; jsonMode?: boolean; signal?: AbortSignal },
): Promise<{ content: string; usage: TokenUsage }> {
  switch (spec.provider) {
    case 'gemini':
      return callGemini(spec, messages, options);
    case 'anthropic':
      return callAnthropic(spec, messages, options);
    case 'openai':
    case 'groq':
    case 'openrouter':
      return callOpenAI(spec, messages, options);
    default:
      throw new Error(`Unknown provider: ${spec.provider}`);
  }
}

// ---------------------------------------------------------------------------
// Main Router
// ---------------------------------------------------------------------------

/**
 * Route an AI request to the optimal model with automatic failover.
 *
 * 1. Scores all available models for the given task
 * 2. Executes against the top-ranked model
 * 3. On failure, falls back to next-best model
 * 4. Tracks latency, cost, and provider health
 */
export async function routeAI(req: RouteRequest): Promise<RouteResult> {
  const ranked = scoreModels(req);

  if (ranked.length === 0) {
    throw new Error('No AI providers configured. Set at least one of: GOOGLE_AI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY');
  }

  const attemptChain: string[] = [];
  let lastError: Error | null = null;

  // Try up to 3 models in ranked order
  const maxAttempts = Math.min(ranked.length, 3);

  for (let i = 0; i < maxAttempts; i++) {
    const { spec } = ranked[i];
    attemptChain.push(`${spec.provider}/${spec.model}`);

    const start = Date.now();

    try {
      const { content, usage } = await callModel(spec, req.messages, {
        maxTokens: req.maxTokens,
        temperature: req.temperature,
        jsonMode: req.jsonMode,
        signal: req.signal,
      });

      const latencyMs = Date.now() - start;
      recordSuccess(spec.provider, latencyMs);

      const estimatedCost = trackCost(spec.provider, req.task, usage, spec);

      return {
        content,
        model: spec.model,
        provider: spec.provider,
        usage,
        latencyMs,
        estimatedCostUsd: estimatedCost,
        cached: false,
        fallbackUsed: i > 0,
        attemptChain,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      recordFailure(spec.provider);
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AI Router] ${spec.provider}/${spec.model} failed (${latencyMs}ms): ${lastError.message}`);
    }
  }

  throw lastError || new Error('All AI providers failed');
}

// ---------------------------------------------------------------------------
// Convenience Wrappers
// ---------------------------------------------------------------------------

/**
 * Quick JSON extraction — routes to fastest available model with JSON mode.
 */
export async function routeJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  options: Partial<RouteRequest> = {},
): Promise<T> {
  const result = await routeAI({
    task: 'fast-json',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    jsonMode: true,
    latencyBudgetMs: 3000,
    maxTokens: 2048,
    temperature: 0.1,
    ...options,
  });

  try {
    return JSON.parse(result.content) as T;
  } catch {
    // Try to extract JSON from the response
    const match = result.content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error(`Failed to parse JSON from ${result.provider}/${result.model}: ${result.content.slice(0, 200)}`);
  }
}

/**
 * Summarize text — routes to fast, cheap model.
 */
export async function routeSummarize(
  text: string,
  style: 'brief' | 'detailed' | 'bullets' | 'eli5' | 'technical' = 'brief',
  options: Partial<RouteRequest> = {},
): Promise<RouteResult> {
  const stylePrompts: Record<string, string> = {
    brief: 'Summarize in 2-3 sentences.',
    detailed: 'Provide a comprehensive summary covering all key points.',
    bullets: 'Summarize as bullet points.',
    eli5: 'Explain like I\'m 5 years old.',
    technical: 'Provide a technical summary for a crypto-native audience.',
  };

  return routeAI({
    task: 'summarize',
    messages: [
      { role: 'system', content: `You are a crypto news summarizer. ${stylePrompts[style]}` },
      { role: 'user', content: text },
    ],
    latencyBudgetMs: 5000,
    maxTokens: 1024,
    temperature: 0.2,
    ...options,
  });
}

/**
 * Analyze sentiment of crypto-related text.
 */
export async function routeSentiment(
  text: string,
  options: Partial<RouteRequest> = {},
): Promise<{ sentiment: number; confidence: number; reasoning: string }> {
  return routeJSON(
    `You are a crypto market sentiment analyzer. Analyze the sentiment of the given text.
Return JSON: {"sentiment": <number -1 to 1>, "confidence": <number 0 to 1>, "reasoning": "<brief explanation>"}
-1 = extremely bearish, 0 = neutral, 1 = extremely bullish.`,
    text,
    { task: 'sentiment', ...options },
  );
}

/**
 * Deep reasoning with the most capable available model.
 */
export async function routeReason(
  systemPrompt: string,
  userPrompt: string,
  options: Partial<RouteRequest> = {},
): Promise<RouteResult> {
  return routeAI({
    task: 'reason',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 4096,
    temperature: 0.4,
    ...options,
  });
}

/**
 * Analyze an image (chart, screenshot, etc.) using a vision model.
 */
export async function routeVision(
  imageUrl: string,
  prompt: string,
  options: Partial<RouteRequest> = {},
): Promise<RouteResult> {
  return routeAI({
    task: 'vision',
    messages: [
      { role: 'system', content: 'You are an expert crypto market analyst. Analyze the provided chart or image.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
    images: [{ url: imageUrl }],
    maxTokens: 2048,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// Exports for health endpoint
// ---------------------------------------------------------------------------

/** Available for /api/health or admin dashboards */
export function getAvailableModelList(): Array<{
  provider: ModelProvider;
  model: string;
  displayName: string;
  healthy: boolean;
  strengths: AITaskType[];
}> {
  return getAvailableModels().map(spec => ({
    provider: spec.provider,
    model: spec.model,
    displayName: spec.displayName,
    healthy: isProviderHealthy(spec.provider),
    strengths: spec.strengths,
  }));
}
