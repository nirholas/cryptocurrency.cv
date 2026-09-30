/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AIAuthError,
  aiComplete,
  aiCompleteWithRetry,
  getAllAIConfigs,
  isProviderUnavailableStatus,
  resetAIProviderCooldowns,
} from './ai-provider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

function openaiChatResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      id: 'chatcmpl-test',
      choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

function rateLimitResponse(): Response {
  return new Response(JSON.stringify({ error: { message: 'rate limit exceeded 429' } }), {
    status: 429,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serverErrorResponse(status = 502): Response {
  return new Response('Bad Gateway', { status });
}

// ---------------------------------------------------------------------------
// Tests: aiCompleteWithRetry
// ---------------------------------------------------------------------------

describe('aiCompleteWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    vi.useFakeTimers();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    vi.useRealTimers();
  });

  it('returns result on first attempt', async () => {
    mockFetch.mockResolvedValueOnce(openaiChatResponse('Bitcoin is bullish.'));

    const result = await aiCompleteWithRetry(
      'You are a crypto analyst.',
      'Summarise the market.',
      { maxTokens: 100 }
    );

    expect(result).toBe('Bitcoin is bullish.');
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('retries on 429 rate-limit error and succeeds', async () => {
    // First two calls fail with rate-limit, third succeeds
    mockFetch
      .mockImplementationOnce(() => Promise.resolve(rateLimitResponse()))
      .mockImplementationOnce(() => Promise.resolve(rateLimitResponse()))
      .mockImplementationOnce(() => Promise.resolve(openaiChatResponse('Success after retries.')));

    const resultPromise = aiCompleteWithRetry(
      'system',
      'user',
      { maxTokens: 50 },
      false,
      3
    );

    // Tick timers repeatedly until the promise settles
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    const result = await resultPromise;
    expect(result).toBe('Success after retries.');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries on 502 transient error and succeeds', async () => {
    mockFetch
      .mockImplementationOnce(() => Promise.resolve(serverErrorResponse(502)))
      .mockImplementationOnce(() => Promise.resolve(openaiChatResponse('OK')));

    const resultPromise = aiCompleteWithRetry('sys', 'usr', {}, false, 3);
    await vi.runAllTimersAsync();

    const result = await resultPromise;
    expect(result).toBe('OK');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-retryable errors', async () => {
    mockFetch.mockImplementationOnce(() => Promise.resolve(new Response('Not Found', { status: 404 })));

    // 404 is not a rate-limit / transient error — should throw without retry
    await expect(
      aiCompleteWithRetry('sys', 'usr', {}, false, 3)
    ).rejects.toThrow('404');
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('throws after exhausting all retries', async () => {
    mockFetch.mockImplementation(() => Promise.resolve(rateLimitResponse()));

    const resultPromise = aiCompleteWithRetry('sys', 'usr', {}, false, 3);
    // Catch early to avoid unhandled rejection warning while timers run
    const settled = resultPromise.then(
      (v) => ({ ok: true, value: v }),
      (e: Error) => ({ ok: false, error: e })
    );

    // Advance past all back-off delays (3 attempts × up to ~4.5 s each)
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();
    await vi.runAllTimersAsync();

    const result = await settled;
    expect(result.ok).toBe(false);
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Tests: provider chain failover
// ---------------------------------------------------------------------------

/**
 * Regression: Groq caps free-tier requests at 8k tokens/minute and answers 413
 * for anything larger. That status used to escape `aiComplete`'s provider loop,
 * so one small-context provider at the head of the chain took down every
 * large-prompt endpoint (/api/narratives among them) while a 1M-context
 * provider sat configured right behind it.
 */
describe('aiComplete provider chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  it('fails over to the next provider when one answers 413', async () => {
    process.env.GROQ_API_KEY = 'groq-key';
    process.env.OPENAI_API_KEY = 'openai-key';

    mockFetch
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Request too large' } }), { status: 413 })
      )
      .mockResolvedValueOnce(openaiChatResponse('Narratives identified.'));

    const result = await aiComplete('sys', 'usr', {}, true);

    expect(result).toBe('Narratives identified.');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('classifies 413 as a provider-unavailable status', () => {
    expect(isProviderUnavailableStatus(413)).toBe(true);
    expect(isProviderUnavailableStatus(503)).toBe(true);
    expect(isProviderUnavailableStatus(400)).toBe(false);
    expect(isProviderUnavailableStatus(429)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: OpenRouter fallback keys, auth cooldown, all-unavailable error
// ---------------------------------------------------------------------------

describe('provider credentials and cooldowns', () => {
  const AI_ENV = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GROQ_API_KEY',
    'GEMINI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'OPENROUTER_API_KEY',
    'OPENROUTER_FALLBACK_KEYS',
  ];
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetAIProviderCooldowns();
    saved = Object.fromEntries(AI_ENV.map((k) => [k, process.env[k]]));
    for (const k of AI_ENV) delete process.env[k];
  });

  afterEach(() => {
    for (const k of AI_ENV) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    resetAIProviderCooldowns();
  });

  it('uses OPENROUTER_FALLBACK_KEYS when no primary key is set, one provider entry per key', () => {
    process.env.OPENROUTER_FALLBACK_KEYS = 'sk-or-one, sk-or-two,,sk-or-one';
    const keys = getAllAIConfigs().map((c) => `${c.provider}:${c.apiKey}`);
    expect(keys).toEqual(['openrouter:sk-or-one', 'openrouter:sk-or-two']);
  });

  it('fails over to the next OpenRouter key when one is out of credit', async () => {
    process.env.OPENROUTER_FALLBACK_KEYS = 'sk-or-empty,sk-or-funded';
    mockFetch
      .mockResolvedValueOnce(new Response('{"error":{"message":"Insufficient credits"}}', { status: 402 }))
      .mockResolvedValueOnce(openaiChatResponse('from the second key'));

    await expect(aiComplete('sys', 'user')).resolves.toBe('from the second key');
    const authHeaders = mockFetch.mock.calls.map(([, init]) => (init as RequestInit).headers as Record<string, string>);
    expect(authHeaders.map((h) => h.Authorization)).toEqual(['Bearer sk-or-empty', 'Bearer sk-or-funded']);
  });

  it('skips a provider that refused on auth or billing for the next requests', async () => {
    process.env.OPENAI_API_KEY = 'sk-revoked';
    process.env.OPENROUTER_API_KEY = 'sk-or-ok';
    mockFetch
      .mockResolvedValueOnce(new Response('{"error":"invalid key"}', { status: 401 }))
      .mockResolvedValueOnce(openaiChatResponse('first'))
      .mockResolvedValueOnce(openaiChatResponse('second'));

    await expect(aiComplete('sys', 'a')).resolves.toBe('first');
    await expect(aiComplete('sys', 'b')).resolves.toBe('second');

    const urls = mockFetch.mock.calls.map(([url]) => String(url));
    expect(urls.filter((u) => u.includes('api.openai.com'))).toHaveLength(1);
  });

  it('says quota or billing, not bad keys, when every provider is unavailable', async () => {
    process.env.GROQ_API_KEY = 'gsk-exhausted';
    mockFetch.mockResolvedValue(rateLimitResponse());

    const error = await aiComplete('sys', 'user', {}, true).catch((e: Error) => e);
    expect(error).toBeInstanceOf(AIAuthError);
    expect((error as Error).message).toMatch(/out of quota/);
    expect((error as Error).message).not.toMatch(/check api keys/i);
  });
});
