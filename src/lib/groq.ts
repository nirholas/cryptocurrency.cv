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

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Cache TTLs (in seconds) — short TTLs since we have unlimited AI credits
const CACHE_TTL = {
  summarize: 60,     // 1 minute
  sentiment: 60,     // 1 minute
  entities: 120,     // 2 minutes
  digest: 120,       // 2 minutes
  narratives: 120,   // 2 minutes
  default: 60,       // 1 minute
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
  options: GroqOptions = {}
): Promise<GroqResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 2048,
    jsonMode = false,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new GroqAuthError(`Groq API authentication failed: ${error}`);
    }
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  return {
    content,
    usage: {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    },
  };
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
  options: GroqOptions = {}
): ReadableStream<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

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
  options: GroqOptions = {}
): Promise<string> {
  const response = await callGroq(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    options
  );
  return response.content;
}

/**
 * JSON prompt helper - returns parsed JSON
 */
export async function promptGroqJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options: GroqOptions = {}
): Promise<T> {
  const response = await callGroq(
    [
      { role: 'system', content: systemPrompt + '\n\nAlways respond with valid JSON only, no markdown.' },
      { role: 'user', content: userPrompt },
    ],
    { ...options, jsonMode: true }
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
  options: GroqOptions = {}
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
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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
  options: GroqOptions = {}
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured. Get a free key at https://console.groq.com/keys');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.3,
    maxTokens = 2048,
  } = options;

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
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new GroqAuthError(`Groq API authentication failed: ${error}`);
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

/**
 * Alias for promptGroq for backward compatibility
 */
export const generateGroqResponse = promptGroq;

/**
 * Alias for callGroq for backward compatibility
 */
export const askGroq = callGroq;

export { CACHE_TTL };
