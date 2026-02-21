/**
 * Shared AI Provider Utilities
 * Centralises provider config and completion logic to avoid duplication
 * across ai-brief, ai-counter, ai-debate, ai-enhanced, claim-extractor, event-classifier.
 */

export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'openrouter';

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

/**
 * Returns AI config or null when no provider is configured.
 *
 * @param preferGroq - When true, Groq is tried first (good for fast JSON tasks).
 *                     When false (default), OpenAI is tried first.
 */
export function getAIConfigOrNull(preferGroq = false): AIConfig | null {
  const openai = (): AIConfig | null =>
    process.env.OPENAI_API_KEY
      ? { provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4o', apiKey: process.env.OPENAI_API_KEY }
      : null;

  const anthropic = (): AIConfig | null =>
    process.env.ANTHROPIC_API_KEY
      ? { provider: 'anthropic', model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022', apiKey: process.env.ANTHROPIC_API_KEY }
      : null;

  const groq = (): AIConfig | null =>
    process.env.GROQ_API_KEY
      ? { provider: 'groq', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', apiKey: process.env.GROQ_API_KEY, baseUrl: 'https://api.groq.com/openai/v1' }
      : null;

  const openrouter = (): AIConfig | null =>
    process.env.OPENROUTER_API_KEY
      ? { provider: 'openrouter', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct', apiKey: process.env.OPENROUTER_API_KEY, baseUrl: 'https://openrouter.ai/api/v1' }
      : null;

  const order = preferGroq
    ? [groq, openai, anthropic, openrouter]
    : [openai, anthropic, groq, openrouter];

  for (const fn of order) {
    const cfg = fn();
    if (cfg) return cfg;
  }
  return null;
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

  // Anthropic doesn't share the same streaming format — fall back to a
  // buffered single-chunk stream.
  if (config.provider === 'anthropic' || !baseUrl) {
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
 */
export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options: AICompleteOptions = {},
  preferGroq = false
): Promise<string> {
  const config = getAIConfigOrThrow(preferGroq);
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
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
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
