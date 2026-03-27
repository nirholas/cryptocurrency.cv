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
 * Shared AI Provider Utilities
 * Centralises provider config and completion logic to avoid duplication
 * across ai-brief, ai-counter, ai-debate, ai-enhanced, claim-extractor, event-classifier.
 */

import { parseGroqJson, simpleHash } from './groq';
import { aiCache, generateCacheKey, withCache } from './cache';

export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter' | 'gemini';

/**
 * Typed error for AI provider authentication failures (401).
 * Thrown when a provider rejects the API key so callers can
 * distinguish auth errors from transient / other failures.
 */
export class AIAuthError extends Error {
  public readonly statusCode: number;
  public readonly provider: AIProvider;
  constructor(provider: AIProvider, statusCode: number, message: string) {
    super(message);
    this.name = 'AIAuthError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AICompleteOptions {
  maxTokens?: number;
  temperature?: number;
  /** When true, requests json_object response format (OpenAI-compatible providers only) */
  jsonMode?: boolean;
  /** X-Title header for OpenRouter attribution */
  title?: string;
  /** Signal to abort the request */
  signal?: AbortSignal;
}

/** Provider factory functions — each returns a config when the env var is set. */
const providerFactories: Record<AIProvider, () => AIConfig | null> = {
  openai: () =>
    process.env.OPENAI_API_KEY
      ? { provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4o', apiKey: process.env.OPENAI_API_KEY }
      : null,
  anthropic: () =>
    process.env.ANTHROPIC_API_KEY
      ? { provider: 'anthropic', model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022', apiKey: process.env.ANTHROPIC_API_KEY }
      : null,
  groq: () =>
    process.env.GROQ_API_KEY
      ? { provider: 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', apiKey: process.env.GROQ_API_KEY, baseUrl: 'https://api.groq.com/openai/v1' }
      : null,
  openrouter: () =>
    process.env.OPENROUTER_API_KEY
      ? { provider: 'openrouter', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct', apiKey: process.env.OPENROUTER_API_KEY, baseUrl: 'https://openrouter.ai/api/v1' }
      : null,
  gemini: () =>
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
      ? { provider: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.5-pro', apiKey: (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY)! }
      : null,
};

/** Returns the provider priority order based on preference. */
function getProviderOrder(preferGroq: boolean): AIProvider[] {
  return preferGroq
    ? ['groq', 'openai', 'anthropic', 'gemini', 'openrouter']
    : ['openai', 'anthropic', 'gemini', 'groq', 'openrouter'];
}

/**
 * Returns AI config or null when no provider is configured.
 *
 * @param preferGroq - When true, Groq is tried first (good for fast JSON tasks).
 *                     When false (default), OpenAI is tried first.
 */
export function getAIConfigOrNull(preferGroq = false): AIConfig | null {
  for (const provider of getProviderOrder(preferGroq)) {
    const cfg = providerFactories[provider]();
    if (cfg) return cfg;
  }
  return null;
}

/**
 * Returns ALL configured AI providers in priority order.
 * Used by aiComplete to fall back through providers on auth errors.
 */
export function getAllAIConfigs(preferGroq = false): AIConfig[] {
  const configs: AIConfig[] = [];
  for (const provider of getProviderOrder(preferGroq)) {
    const cfg = providerFactories[provider]();
    if (cfg) configs.push(cfg);
  }
  return configs;
}

/**
 * Returns AI config or throws when no provider is configured.
 */
export function getAIConfigOrThrow(preferGroq = false): AIConfig {
  const cfg = getAIConfigOrNull(preferGroq);
  if (!cfg) {
    throw new Error(
      'No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY'
    );
  }
  return cfg;
}

/**
 * Streaming AI completion — returns a ReadableStream<string> where each
 * chunk is a ready-to-send SSE string (`data: {"token":"..."}\n\n`).
 * The terminal frame is `data: [DONE]\n\n`.
 *
 * Currently supports OpenAI-compatible providers (OpenAI, Groq, OpenRouter).
 * Falls back to a single-chunk stream for Anthropic.
 */
export function aiCompleteStream(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = false
): ReadableStream<string> {
  const config = getAIConfigOrThrow(preferGroq);
  const { maxTokens = 2048, temperature = 0.3, title = 'Crypto News AI' } = options;

  const baseUrl =
    config.provider === 'anthropic'
      ? null
      : config.baseUrl || 'https://api.openai.com/v1';

  // Anthropic and Gemini don't share the same streaming format — fall back to a
  // buffered single-chunk stream.
  if (config.provider === 'anthropic' || config.provider === 'gemini' || !baseUrl) {
    return new ReadableStream<string>({
      async start(controller) {
        try {
          const text = await aiComplete(systemPrompt, userPrompt, options, preferGroq);
          controller.enqueue(`data: ${JSON.stringify({ token: text })}\n\n`);
        } catch (err) {
          controller.error(err);
          return;
        }
        controller.enqueue('data: [DONE]\n\n');
        controller.close();
      },
    });
  }

  const body = JSON.stringify({
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature,
    stream: true,
  });

  return new ReadableStream<string>({
    async start(controller) {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
            ...(config.provider === 'openrouter' && {
              'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
              'X-Title': title,
            }),
          },
          body,
        });
      } catch (err) {
        controller.error(err);
        return;
      }

      if (!response.ok || !response.body) {
        const msg = await response.text().catch(() => String(response.status));
        controller.error(new Error(`AI stream error: ${msg}`));
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
 * Generic AI completion request compatible with all supported providers.
 * Automatically falls back to the next configured provider on auth errors (401).
 */
export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = false
): Promise<string> {
  const configs = getAllAIConfigs(preferGroq);
  if (configs.length === 0) {
    throw new Error(
      'No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY'
    );
  }

  const authErrors: AIAuthError[] = [];

  for (const config of configs) {
    try {
      return await aiCompleteWithConfig(config, systemPrompt, userPrompt, options);
    } catch (err) {
      // Auth errors → try next provider
      if (err instanceof AIAuthError) {
        console.warn(`AI provider ${config.provider} auth failed, trying next provider...`, err.message);
        authErrors.push(err);
        continue;
      }
      // Import and check GroqAuthError dynamically to avoid circular deps
      if ((err as Error).name === 'GroqAuthError') {
        const authErr = new AIAuthError(config.provider, 401, (err as Error).message);
        console.warn(`AI provider ${config.provider} auth failed, trying next provider...`, authErr.message);
        authErrors.push(authErr);
        continue;
      }
      throw err; // non-auth errors propagate immediately
    }
  }

  // All providers failed with auth errors
  throw new AIAuthError(
    authErrors[0]?.provider ?? 'groq',
    401,
    `All configured AI providers failed authentication: ${authErrors.map(e => `${e.provider}: ${e.message}`).join('; ')}`
  );
}

/**
 * Internal: execute a completion against a specific provider config.
 */
async function aiCompleteWithConfig(
  config: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {}
): Promise<string> {
  const { maxTokens = 1000, temperature = 0.3, jsonMode = false, title = 'Crypto News AI' } = options;

  if (config.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AIAuthError('anthropic', 401, `Anthropic API authentication failed: ${response.status}`);
      }
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Google Gemini API
  if (config.provider === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
      model: config.model,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        ...(jsonMode && { responseMimeType: 'application/json' }),
      },
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  }

  // OpenAI-compatible API (OpenAI, Groq, OpenRouter)
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
        'X-Title': title,
      }),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new AIAuthError(config.provider, response.status, `${config.provider} API authentication failed (${response.status}): ${error}`);
    }
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Stream AI completion responses using Server-Sent Events.
 * Works with OpenAI, Groq, and OpenRouter (OpenAI-compatible).
 * Returns a ReadableStream of text chunks.
 */
export async function aiStream(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = false
): Promise<ReadableStream<Uint8Array>> {
  const config = getAIConfigOrThrow(preferGroq);
  const { maxTokens = 2000, temperature = 0.3, title = 'Crypto News AI' } = options;

  const encoder = new TextEncoder();

  // Anthropic streaming
  if (config.provider === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: options.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic streaming error: ${response.status}`);
    }

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = response.body!.getReader();
        const textDecoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = textDecoder.decode(value);
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.delta?.text || '';
                if (text) controller.enqueue(encoder.encode(text));
              } catch { /* skip malformed */ }
            }
          }
        } finally {
          controller.close();
          reader.releaseLock();
        }
      },
    });
  }

  // OpenAI-compatible streaming (OpenAI, Groq, OpenRouter)
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...(config.provider === 'openrouter' && {
        'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
        'X-Title': title,
      }),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    const error = await response.text();
    throw new Error(`AI streaming error: ${response.status} - ${error}`);
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = response.body!.getReader();
      const textDecoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = textDecoder.decode(value);
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content || '';
              if (text) controller.enqueue(encoder.encode(text));
            } catch { /* skip malformed SSE lines */ }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

/**
 * aiComplete with automatic retry + exponential back-off.
 * Useful for rate-limited providers (OpenAI, Anthropic) under heavy load.
 */
export async function aiCompleteWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = false,
  maxRetries = 3
): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await aiComplete(systemPrompt, userPrompt, options, preferGroq);
    } catch (err) {
      lastError = err as Error;
      const isRateLimit = lastError.message.includes('429') || lastError.message.includes('rate');
      const isTransient = lastError.message.includes('502') || lastError.message.includes('503') || lastError.message.includes('timeout');
      if (!isRateLimit && !isTransient) throw lastError; // non-retryable
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 500, 10000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// Cache TTLs (in seconds)
const AI_CACHE_TTL: Record<string, number> = {
  summarize: 60,
  sentiment: 60,
  entities: 120,
  digest: 120,
  narratives: 120,
  default: 60,
};

/**
 * JSON prompt helper — returns parsed JSON using the multi-provider fallback chain.
 * Drop-in replacement for `promptGroqJson` with automatic provider failover on auth errors.
 */
export async function promptAIJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = true
): Promise<T> {
  const raw = await aiComplete(
    systemPrompt + '\n\nAlways respond with valid JSON only, no markdown.',
    userPrompt,
    { ...options, jsonMode: true },
    preferGroq
  );
  return parseGroqJson<T>(raw);
}

/**
 * Cached JSON prompt helper — caches responses for efficiency.
 * Drop-in replacement for `promptGroqJsonCached` with automatic provider failover.
 */
export async function promptAIJsonCached<T>(
  cachePrefix: string,
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = true
): Promise<T> {
  const promptHash = simpleHash(systemPrompt + userPrompt);
  const cacheKey = generateCacheKey(cachePrefix, { hash: promptHash });
  const ttl = AI_CACHE_TTL[cachePrefix] || AI_CACHE_TTL.default;

  return withCache(aiCache, cacheKey, ttl, async () => {
    return promptAIJson<T>(systemPrompt, userPrompt, options, preferGroq);
  });
}

/**
 * Check if any AI provider is configured (Groq, OpenAI, Anthropic, Gemini, or OpenRouter).
 */
export function isAIConfigured(): boolean {
  return getAIConfigOrNull() !== null;
}
