import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiCompleteWithRetry } from './ai-provider';

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
