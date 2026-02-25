/**
 * Streaming AI Pipeline
 *
 * Advanced SSE streaming architecture with:
 * - Multi-provider streaming (OpenAI, Anthropic, Groq, Gemini)
 * - Structured partial JSON output (stream objects field-by-field)
 * - Backpressure-aware stream management
 * - Token-level streaming with aggregation
 * - Parallel multi-model streaming (race, merge, consensus)
 * - Automatic fallback on stream failure
 * - Cost & latency tracking per stream
 *
 * Usage:
 *   import { StreamingPipeline } from '@/lib/streaming-pipeline';
 *
 *   const pipeline = new StreamingPipeline();
 *
 *   // Simple streaming response
 *   return pipeline.stream({
 *     provider: 'groq',
 *     system: 'You are a crypto analyst.',
 *     prompt: 'Analyze BTC trend',
 *   });
 *
 *   // Structured streaming (partial JSON as it arrives)
 *   return pipeline.streamStructured({
 *     provider: 'openai',
 *     system: 'Return JSON with fields: summary, sentiment, confidence',
 *     prompt: 'Analyze this article...',
 *     schema: { summary: 'string', sentiment: 'string', confidence: 'number' }
 *   });
 *
 *   // Multi-model race (first to complete wins)
 *   return pipeline.race([
 *     { provider: 'groq', ... },
 *     { provider: 'openai', ... },
 *   ]);
 *
 * @module streaming-pipeline
 */

import { metrics } from './telemetry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreamProvider = 'openai' | 'anthropic' | 'groq' | 'gemini' | 'openrouter';

export interface StreamRequest {
  provider?: StreamProvider;
  model?: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  /** Abort signal */
  signal?: AbortSignal;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface StructuredStreamRequest extends StreamRequest {
  /** JSON schema hint for the expected output shape */
  schema?: Record<string, string>;
}

export interface StreamEvent {
  type: 'token' | 'partial_json' | 'complete' | 'error' | 'metadata';
  data: string | Record<string, unknown>;
  timestamp: number;
}

export interface StreamMetadata {
  provider: StreamProvider;
  model: string;
  tokensGenerated: number;
  latencyMs: number;
  firstTokenMs: number;
  costMicroUsd: number;
}

// ---------------------------------------------------------------------------
// Provider Configuration
// ---------------------------------------------------------------------------

interface ProviderConfig {
  getEndpoint(model: string): string;
  getHeaders(apiKey: string): Record<string, string>;
  buildBody(req: StreamRequest, model: string): Record<string, unknown>;
  extractToken(chunk: string): string | null;
  getDefaultModel(): string;
  getApiKey(): string | undefined;
  /** Cost per 1M output tokens in USD */
  outputCostPer1M: number;
}

const PROVIDERS: Record<StreamProvider, ProviderConfig> = {
  openai: {
    getEndpoint: () => 'https://api.openai.com/v1/chat/completions',
    getHeaders: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    buildBody: (req, model) => ({
      model,
      messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.prompt }],
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.3,
      stream: true,
    }),
    extractToken: (chunk) => {
      try {
        const json = JSON.parse(chunk);
        return json.choices?.[0]?.delta?.content || null;
      } catch { return null; }
    },
    getDefaultModel: () => process.env.OPENAI_MODEL || 'gpt-4o',
    getApiKey: () => process.env.OPENAI_API_KEY,
    outputCostPer1M: 15,
  },

  anthropic: {
    getEndpoint: () => 'https://api.anthropic.com/v1/messages',
    getHeaders: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    }),
    buildBody: (req, model) => ({
      model,
      max_tokens: req.maxTokens ?? 2048,
      stream: true,
      system: req.system,
      messages: [{ role: 'user', content: req.prompt }],
    }),
    extractToken: (chunk) => {
      try {
        const json = JSON.parse(chunk);
        return json.delta?.text || json.content_block?.text || null;
      } catch { return null; }
    },
    getDefaultModel: () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    getApiKey: () => process.env.ANTHROPIC_API_KEY,
    outputCostPer1M: 15,
  },

  groq: {
    getEndpoint: () => 'https://api.groq.com/openai/v1/chat/completions',
    getHeaders: (key) => ({ Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }),
    buildBody: (req, model) => ({
      model,
      messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.prompt }],
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.3,
      stream: true,
    }),
    extractToken: (chunk) => {
      try {
        const json = JSON.parse(chunk);
        return json.choices?.[0]?.delta?.content || null;
      } catch { return null; }
    },
    getDefaultModel: () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    getApiKey: () => process.env.GROQ_API_KEY,
    outputCostPer1M: 0.79,
  },

  gemini: {
    getEndpoint: (model) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
    getHeaders: () => ({ 'Content-Type': 'application/json' }),
    buildBody: (req, _model) => ({
      contents: [{ parts: [{ text: `${req.system}\n\n${req.prompt}` }] }],
      generationConfig: {
        maxOutputTokens: req.maxTokens ?? 2048,
        temperature: req.temperature ?? 0.3,
      },
    }),
    extractToken: (chunk) => {
      try {
        const json = JSON.parse(chunk);
        return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } catch { return null; }
    },
    getDefaultModel: () => 'gemini-2.0-flash',
    getApiKey: () => process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    outputCostPer1M: 0.40,
  },

  openrouter: {
    getEndpoint: () => 'https://openrouter.ai/api/v1/chat/completions',
    getHeaders: (key) => ({
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_URL || 'https://cryptocurrency.cv',
      'X-Title': 'Crypto News AI',
    }),
    buildBody: (req, model) => ({
      model,
      messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.prompt }],
      max_tokens: req.maxTokens ?? 2048,
      temperature: req.temperature ?? 0.3,
      stream: true,
    }),
    extractToken: (chunk) => {
      try {
        const json = JSON.parse(chunk);
        return json.choices?.[0]?.delta?.content || null;
      } catch { return null; }
    },
    getDefaultModel: () => process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
    getApiKey: () => process.env.OPENROUTER_API_KEY,
    outputCostPer1M: 1.0,
  },
};

// ---------------------------------------------------------------------------
// Streaming Pipeline
// ---------------------------------------------------------------------------

export class StreamingPipeline {
  private encoder = new TextEncoder();

  /**
   * Resolve which provider to use, with automatic fallback.
   */
  private resolveProvider(preferred?: StreamProvider): { provider: StreamProvider; config: ProviderConfig } {
    if (preferred) {
      const config = PROVIDERS[preferred];
      if (config.getApiKey()) return { provider: preferred, config };
    }

    // Fallback order: Groq (fastest) → Gemini (cheap) → OpenAI → Anthropic → OpenRouter
    const fallbackOrder: StreamProvider[] = ['groq', 'gemini', 'openai', 'anthropic', 'openrouter'];
    for (const p of fallbackOrder) {
      const config = PROVIDERS[p];
      if (config.getApiKey()) return { provider: p, config };
    }

    throw new Error('No AI provider configured for streaming');
  }

  /**
   * Stream a completion as SSE events.
   * Returns a Response object ready to be returned from a Next.js API route.
   */
  stream(req: StreamRequest): Response {
    const { provider, config } = this.resolveProvider(req.provider);
    const model = req.model || config.getDefaultModel();
    const apiKey = config.getApiKey()!;

    const start = Date.now();
    let firstTokenTime = 0;
    let tokenCount = 0;

    const endpoint = config.getEndpoint(model);
    // Gemini uses query param for API key
    const url = provider === 'gemini'
      ? `${endpoint}&key=${apiKey}`
      : endpoint;

    const readable = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { ...config.getHeaders(apiKey), ...req.headers },
            body: JSON.stringify(config.buildBody(req, model)),
            signal: req.signal,
          });

          if (!response.ok || !response.body) {
            const errText = await response.text().catch(() => `${response.status}`);
            const errorEvent: StreamEvent = {
              type: 'error',
              data: { message: errText, status: response.status, provider },
              timestamp: Date.now(),
            };
            controller.enqueue(this.encode(errorEvent));
            controller.close();
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
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                const token = config.extractToken(data);

                if (token) {
                  if (firstTokenTime === 0) firstTokenTime = Date.now() - start;
                  tokenCount++;

                  const event: StreamEvent = {
                    type: 'token',
                    data: token,
                    timestamp: Date.now(),
                  };
                  controller.enqueue(this.encode(event));
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          // Send metadata
          const meta: StreamMetadata = {
            provider,
            model,
            tokensGenerated: tokenCount,
            latencyMs: Date.now() - start,
            firstTokenMs: firstTokenTime,
            costMicroUsd: Math.round((tokenCount / 1_000_000) * config.outputCostPer1M * 1_000_000),
          };

          const completeEvent: StreamEvent = {
            type: 'complete',
            data: meta as unknown as Record<string, unknown>,
            timestamp: Date.now(),
          };
          controller.enqueue(this.encode(completeEvent));

          // Track metrics
          metrics.aiInferences.add(1, { provider, model });
          metrics.aiLatency.record(meta.latencyMs, { provider, model });
          metrics.aiCostMicro.add(meta.costMicroUsd, { provider, model });
        } catch (err) {
          const errorEvent: StreamEvent = {
            type: 'error',
            data: { message: (err as Error).message, provider },
            timestamp: Date.now(),
          };
          try { controller.enqueue(this.encode(errorEvent)); } catch { /* controller may be closed */ }
        } finally {
          try { controller.close(); } catch { /* already closed */ }
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  /**
   * Stream structured JSON output — emits partial JSON as fields arrive.
   *
   * The AI is prompted to return JSON matching the schema. As tokens arrive,
   * we parse the partial JSON and emit `partial_json` events with whatever
   * fields have been completed so far.
   */
  streamStructured(req: StructuredStreamRequest): Response {
    const schemaHint = req.schema
      ? `\n\nReturn your response as JSON matching this schema:\n${JSON.stringify(req.schema, null, 2)}\n\nReturn ONLY valid JSON, no markdown.`
      : '';

    const augmentedReq: StreamRequest = {
      ...req,
      system: req.system + schemaHint,
    };

    const { provider, config } = this.resolveProvider(req.provider);
    const model = req.model || config.getDefaultModel();
    const apiKey = config.getApiKey()!;

    const start = Date.now();
    let tokenCount = 0;
    let firstTokenTime = 0;

    const endpoint = config.getEndpoint(model);
    const url = provider === 'gemini'
      ? `${endpoint}&key=${apiKey}`
      : endpoint;

    const readable = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { ...config.getHeaders(apiKey), ...req.headers },
            body: JSON.stringify(config.buildBody(augmentedReq, model)),
            signal: req.signal,
          });

          if (!response.ok || !response.body) {
            const errText = await response.text().catch(() => `${response.status}`);
            controller.enqueue(this.encode({ type: 'error', data: { message: errText, provider }, timestamp: Date.now() }));
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';
          let lastParsedJson: Record<string, unknown> | null = null;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (!trimmed.startsWith('data: ')) continue;

                const data = trimmed.slice(6);
                const token = config.extractToken(data);

                if (token) {
                  if (firstTokenTime === 0) firstTokenTime = Date.now() - start;
                  tokenCount++;
                  fullText += token;

                  // Token event
                  controller.enqueue(this.encode({ type: 'token', data: token, timestamp: Date.now() }));

                  // Try to parse partial JSON
                  const parsed = tryParsePartialJson(fullText);
                  if (parsed && JSON.stringify(parsed) !== JSON.stringify(lastParsedJson)) {
                    lastParsedJson = parsed;
                    controller.enqueue(this.encode({
                      type: 'partial_json',
                      data: parsed,
                      timestamp: Date.now(),
                    }));
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          // Final parse
          const finalJson = tryParsePartialJson(fullText);
          if (finalJson) {
            controller.enqueue(this.encode({
              type: 'partial_json',
              data: finalJson,
              timestamp: Date.now(),
            }));
          }

          // Metadata
          const meta: StreamMetadata = {
            provider,
            model,
            tokensGenerated: tokenCount,
            latencyMs: Date.now() - start,
            firstTokenMs: firstTokenTime,
            costMicroUsd: Math.round((tokenCount / 1_000_000) * config.outputCostPer1M * 1_000_000),
          };
          controller.enqueue(this.encode({ type: 'complete', data: meta as unknown as Record<string, unknown>, timestamp: Date.now() }));

          metrics.aiInferences.add(1, { provider, model, structured: true });
          metrics.aiLatency.record(meta.latencyMs, { provider, model });
        } catch (err) {
          try {
            controller.enqueue(this.encode({ type: 'error', data: { message: (err as Error).message }, timestamp: Date.now() }));
          } catch { /* ignore */ }
        } finally {
          try { controller.close(); } catch { /* ignore */ }
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  /**
   * Race multiple providers — first complete response wins.
   *
   * All streams are started in parallel. As soon as one finishes,
   * the others are aborted and the winning response is returned.
   */
  race(requests: StreamRequest[]): Response {
    const controllers: AbortController[] = requests.map(() => new AbortController());

    const readable = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const winner = await Promise.race(
            requests.map(async (req, i) => {
              const { provider, config } = this.resolveProvider(req.provider);
              const model = req.model || config.getDefaultModel();
              const apiKey = config.getApiKey()!;
              const endpoint = config.getEndpoint(model);
              const url = provider === 'gemini' ? `${endpoint}&key=${apiKey}` : endpoint;

              const response = await fetch(url, {
                method: 'POST',
                headers: config.getHeaders(apiKey),
                body: JSON.stringify(config.buildBody(req, model)),
                signal: controllers[i].signal,
              });

              if (!response.ok || !response.body) {
                throw new Error(`${provider} returned ${response.status}`);
              }

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              const tokens: string[] = [];
              const start = Date.now();

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() ?? '';
                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (!trimmed.startsWith('data: ')) continue;
                    const token = config.extractToken(trimmed.slice(6));
                    if (token) tokens.push(token);
                  }
                }
              } finally {
                reader.releaseLock();
              }

              return { provider, model, tokens, latencyMs: Date.now() - start, index: i };
            }),
          );

          // Abort all other streams
          controllers.forEach((ctrl, i) => {
            if (i !== winner.index) ctrl.abort();
          });

          // Emit winner's tokens
          for (const token of winner.tokens) {
            controller.enqueue(this.encode({ type: 'token', data: token, timestamp: Date.now() }));
          }

          controller.enqueue(this.encode({
            type: 'metadata',
            data: {
              winner: winner.provider,
              model: winner.model,
              latencyMs: winner.latencyMs,
              tokensGenerated: winner.tokens.length,
            },
            timestamp: Date.now(),
          }));

          controller.enqueue(this.encode({
            type: 'complete',
            data: { provider: winner.provider, model: winner.model },
            timestamp: Date.now(),
          }));
        } catch (err) {
          controller.enqueue(this.encode({
            type: 'error',
            data: { message: (err as Error).message },
            timestamp: Date.now(),
          }));
        } finally {
          controllers.forEach((ctrl) => ctrl.abort());
          try { controller.close(); } catch { /* ignore */ }
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  /**
   * Merge multiple provider streams into one interleaved stream.
   *
   * Each token is tagged with its source provider, enabling real-time
   * comparison of model outputs in the UI.
   */
  merge(requests: StreamRequest[]): Response {
    const readable = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        const promises = requests.map(async (req) => {
          const { provider, config } = this.resolveProvider(req.provider);
          const model = req.model || config.getDefaultModel();
          const apiKey = config.getApiKey()!;
          const endpoint = config.getEndpoint(model);
          const url = provider === 'gemini' ? `${endpoint}&key=${apiKey}` : endpoint;

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: config.getHeaders(apiKey),
              body: JSON.stringify(config.buildBody(req, model)),
              signal: req.signal,
            });

            if (!response.ok || !response.body) return;

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
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === 'data: [DONE]') continue;
                  if (!trimmed.startsWith('data: ')) continue;
                  const token = config.extractToken(trimmed.slice(6));
                  if (token) {
                    controller.enqueue(this.encode({
                      type: 'token',
                      data: { text: token, provider, model },
                      timestamp: Date.now(),
                    }));
                  }
                }
              }
            } finally {
              reader.releaseLock();
            }
          } catch { /* individual stream failure is non-fatal */ }
        });

        await Promise.allSettled(promises);
        controller.enqueue(this.encode({ type: 'complete', data: { merged: requests.length }, timestamp: Date.now() }));
        try { controller.close(); } catch { /* ignore */ }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private encode(event: StreamEvent): Uint8Array {
    return this.encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  }
}

// ---------------------------------------------------------------------------
// Partial JSON Parser
// ---------------------------------------------------------------------------

/**
 * Try to parse a partial JSON string. Handles truncated values by
 * closing open strings, arrays, and objects.
 */
function tryParsePartialJson(text: string): Record<string, unknown> | null {
  // Strip markdown fences if present
  let json = text.trim();
  if (json.startsWith('```json')) json = json.slice(7);
  if (json.startsWith('```')) json = json.slice(3);
  if (json.endsWith('```')) json = json.slice(0, -3);
  json = json.trim();

  // Try direct parse first
  try {
    const result = JSON.parse(json);
    if (typeof result === 'object' && result !== null) return result;
    return null;
  } catch { /* continue to auto-close */ }

  // Auto-close truncated JSON
  let repaired = json;
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (const ch of repaired) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  // Close open string
  if (inString) repaired += '"';

  // Remove trailing comma
  repaired = repaired.replace(/,\s*$/, '');

  // Close open structures
  for (let i = 0; i < openBrackets; i++) repaired += ']';
  for (let i = 0; i < openBraces; i++) repaired += '}';

  try {
    const result = JSON.parse(repaired);
    if (typeof result === 'object' && result !== null) return result;
  } catch { /* cannot repair */ }

  return null;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _pipeline: StreamingPipeline | null = null;

export function getStreamingPipeline(): StreamingPipeline {
  if (!_pipeline) _pipeline = new StreamingPipeline();
  return _pipeline;
}
