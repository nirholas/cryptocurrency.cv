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
 * Groq AI Client
 *
 * Shared client for all AI-powered features using Groq's free API.
 * Uses Llama 3.3 70B for high-quality, fast inference.
 * Includes response caching for efficiency.
 *
 * Get your free API key at: https://console.groq.com/keys
 */

import { aiCache, generateCacheKey, withCache } from './cache';
import { GROQ_MODEL } from './ai-models';
import { withSpan, metrics } from '@/lib/telemetry';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Model chain.
 *
 * Groq retires models without notice: `llama-3.3-70b-versatile` was hardcoded
 * here and silently stopped existing for our account, which turned every
 * AI-backed endpoint on the site into a 500 (`/api/signals` among them). The
 * model is now configurable, and a `model_not_found` / `model_decommissioned`
 * response falls through to the next entry instead of failing the request.
 *
 * Set GROQ_MODEL to pin a specific model; it is tried first.
 */
const MODEL_CHAIN: readonly string[] = [
  GROQ_MODEL,
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'groq/compound-mini',
];

const DEFAULT_MODEL = MODEL_CHAIN[0];

/** Upper bound on a single Groq request. Without it a slow model hangs the route. */
const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS) || 30_000;

/** Models this process has already seen rejected, so we skip them next time. */
const retiredModels = new Set<string>();

/** True when Groq is telling us the model itself is gone, not that the request was bad. */
function isModelGoneError(status: number, body: string): boolean {
  if (status !== 404 && status !== 400) return false;
  return /model_not_found|model_decommissioned|does not exist|has been decommissioned/i.test(body);
}

/**
 * The models to try for a request, most preferred first: the caller's choice,
 * then the rest of the chain, minus anything already known to be retired.
 */
function modelsToTry(requested?: string): string[] {
  const ordered = requested ? [requested, ...MODEL_CHAIN] : [...MODEL_CHAIN];
  const seen = new Set<string>();
  const usable = ordered.filter((m) => {
    if (!m || seen.has(m)) return false;
    seen.add(m);
    return !retiredModels.has(m);
  });
  // Everything is marked retired (a bad key looks like this): try the chain
  // anyway rather than failing without contacting the API.
  return usable.length > 0 ? usable : [...new Set(ordered)];
}

// Cache TTLs (in seconds) — short TTLs since we have unlimited AI credits
const CACHE_TTL = {
  summarize: 60, // 1 minute
  sentiment: 60, // 1 minute
  entities: 120, // 2 minutes
  digest: 120, // 2 minutes
  narratives: 120, // 2 minutes
  default: 60, // 1 minute
};

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface GroqResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Typed error for Groq authentication failures (401).
 * Callers can catch this to distinguish auth errors from other failures
 * and fall back to alternative AI providers.
 */
export class GroqAuthError extends Error {
  public readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'GroqAuthError';
  }
}

/**
 * Typed error for Groq quota and rate-limit responses (402 / 429).
 *
 * The free tier caps requests per day, and once it is spent Groq answers 429 to
 * everything. Untyped, that reached callers as a generic `Error` and every route
 * built on this client answered 500 — a server fault, for an upstream that is
 * simply out of quota. `aiComplete` already keys its provider failover off this
 * error name, so typing it also lets the chain move on to the next provider.
 */
export class GroqRateLimitError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 429) {
    super(message);
    this.name = 'GroqRateLimitError';
    this.statusCode = statusCode;
  }
}

/**
 * Check if Groq API is configured
 */
export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Call Groq API with messages
 */
export async function callGroq(
  messages: GroqMessage[],
  options: GroqOptions = {},
): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys');
  }

  const { model: requestedModel, temperature = 0.3, maxTokens = 2048, jsonMode = false } = options;
  const candidates = modelsToTry(requestedModel);

  return withSpan(
    'ai.inference.groq',
    {
      'ai.model': candidates[0],
      'ai.provider': 'groq',
      'ai.temperature': temperature,
    },
    async (span) => {
      const start = Date.now();

      let response: Response | undefined;
      let model = candidates[0];

      for (const candidate of candidates) {
        model = candidate;
        const body: Record<string, unknown> = {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        };
        if (jsonMode) {
          body.response_format = { type: 'json_object' };
        }

        const attempt = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
        });

        if (attempt.ok) {
          response = attempt;
          break;
        }

        const error = await attempt.text();
        metrics.aiErrors.add(1, { model, provider: 'groq' });

        if (attempt.status === 401) {
          throw new GroqAuthError(`Groq API authentication failed: ${error}`);
        }

        if (attempt.status === 429 || attempt.status === 402) {
          throw new GroqRateLimitError(
            `Groq rate-limited / out of quota (${attempt.status}): ${error}`,
            attempt.status,
          );
        }

        if (isModelGoneError(attempt.status, error) && candidate !== candidates.at(-1)) {
          retiredModels.add(candidate);
          console.warn(`[groq] model ${candidate} is unavailable, falling back to the next model`);
          continue;
        }

        throw new Error(`Groq API error: ${attempt.status} - ${error}`);
      }

      if (!response) {
        throw new Error(`Groq API error: no model in the chain answered (tried ${candidates.join(', ')})`);
      }

      span.setAttribute('ai.model', model);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const usage = data.usage || {};
      const latencyMs = Date.now() - start;

      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || 0;

      span.setAttribute('ai.prompt_tokens', promptTokens);
      span.setAttribute('ai.completion_tokens', completionTokens);
      span.setAttribute('ai.total_tokens', totalTokens);
      span.setAttribute('ai.latency_ms', latencyMs);
      metrics.aiInferences.add(1, { model, provider: 'groq' });
      metrics.aiLatency.record(latencyMs, { model });
      metrics.aiTokens.add(totalTokens, { model });

      return {
        content,
        usage: { promptTokens, completionTokens, totalTokens },
      };
    },
  );
}

/**
 * Stream a Groq completion as an OpenAI-compatible SSE ReadableStream.
 * Each chunk emitted is a raw server-sent-events string ready to pipe.
 *
 * Format per chunk:  `data: {"token":"..."}\n\n`
 * Terminal chunk:   `data: [DONE]\n\n`
 */
export function callGroqStream(
  messages: GroqMessage[],
  options: GroqOptions = {},
): ReadableStream<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const { model = DEFAULT_MODEL, temperature = 0.3, maxTokens = 2048 } = options;

  const body = JSON.stringify({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  return new ReadableStream<string>({
    async start(controller) {
      let response: Response;
      try {
        response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body,
        });
      } catch (err) {
        controller.error(err);
        return;
      }

      if (!response.ok || !response.body) {
        const msg = await response.text().catch(() => String(response.status));
        if (response.status === 401) {
          controller.error(new GroqAuthError(`Groq stream authentication failed: ${msg}`));
          return;
        }
        controller.error(new Error(`Groq stream error: ${msg}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const text = line.trim();
            if (!text || text === 'data: [DONE]') continue;
            if (!text.startsWith('data: ')) continue;
            try {
              const json = JSON.parse(text.slice(6));
              const token = json.choices?.[0]?.delta?.content;
              if (token) {
                controller.enqueue(`data: ${JSON.stringify({ token })}\n\n`);
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      controller.enqueue('data: [DONE]\n\n');
      controller.close();
    },
  });
}

/**
 * Parse JSON from Groq response (handles markdown code blocks)
 */
export function parseGroqJson<T>(content: string): T {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Simple prompt helper for one-shot completions
 */
export async function promptGroq(
  systemPrompt: string,
  userPrompt: string,
  options: GroqOptions = {},
): Promise<string> {
  const response = await callGroq(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options,
  );
  return response.content;
}

/**
 * JSON prompt helper - returns parsed JSON
 */
export async function promptGroqJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options: GroqOptions = {},
): Promise<T> {
  const response = await callGroq(
    [
      {
        role: 'system',
        content: systemPrompt + '\n\nAlways respond with valid JSON only, no markdown.',
      },
      { role: 'user', content: userPrompt },
    ],
    { ...options, jsonMode: true },
  );
  return parseGroqJson<T>(response.content);
}

/**
 * Cached JSON prompt helper - caches responses for efficiency
 */
export async function promptGroqJsonCached<T>(
  cachePrefix: string,
  systemPrompt: string,
  userPrompt: string,
  options: GroqOptions = {},
): Promise<T> {
  // Create a hash of the prompts for cache key
  const promptHash = simpleHash(systemPrompt + userPrompt);
  const cacheKey = generateCacheKey(cachePrefix, { hash: promptHash });
  const ttl = CACHE_TTL[cachePrefix as keyof typeof CACHE_TTL] || CACHE_TTL.default;

  return withCache(aiCache, cacheKey, ttl, async () => {
    return promptGroqJson<T>(systemPrompt, userPrompt, options);
  });
}

/**
 * Simple string hash for cache keys
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Stream Groq API response
 * Returns an async generator that yields content chunks
 */
export async function* streamGroq(
  messages: GroqMessage[],
  options: GroqOptions = {},
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys');
  }

  const { model = DEFAULT_MODEL, temperature = 0.3, maxTokens = 2048 } = options;

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new GroqAuthError(`Groq API authentication failed: ${error}`);
    }
    if (response.status === 429 || response.status === 402) {
      throw new GroqRateLimitError(
        `Groq rate-limited / out of quota (${response.status}): ${error}`,
        response.status,
      );
    }
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export { CACHE_TTL };
