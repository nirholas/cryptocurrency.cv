/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetLatestNews, mockGetBreakingNews } = vi.hoisted(() => ({
  mockGetLatestNews: vi.fn(),
  mockGetBreakingNews: vi.fn(),
}));

vi.mock('@/lib/crypto-news', () => ({
  getLatestNews: mockGetLatestNews,
  getBreakingNews: mockGetBreakingNews,
}));

import { GET } from './route';
import { SSE_MAX_DURATION_MS, SSE_RETRY_MS, CLOUD_RUN_REQUEST_TIMEOUT_MS } from '@/lib/sse-lifetime';

const latestLink = 'https://example.com/synthetic-latest';

function news() {
  return {
    articles: [
      {
        title: 'Synthetic headline',
        link: latestLink,
        source: 'Example Wire',
        sourceKey: 'example',
        category: 'general',
        pubDate: '2026-10-08T09:00:00.000Z',
        timeAgo: '1m ago',
      },
    ],
  };
}

const decoder = new TextDecoder();

/** Resolves after `n` microtask turns; fake timers do not hold these back. */
function afterMicrotasks(n: number): Promise<void> {
  let chain = Promise.resolve();
  for (let i = 0; i < n; i++) chain = chain.then(() => undefined);
  return chain;
}

/**
 * Reads an SSE body without blocking on fake timers: `drain` returns whatever
 * is already queued. A read left pending when the queue runs dry is carried to
 * the next drain, so no chunk is lost between calls.
 */
function streamReader(body: ReadableStream<Uint8Array> | null) {
  if (!body) throw new Error('expected an SSE response body');
  const reader = body.getReader();
  let pending: Promise<ReadableStreamReadResult<Uint8Array>> | null = null;

  async function drain(): Promise<{ text: string; done: boolean }> {
    let text = '';
    for (;;) {
      pending ??= reader.read();
      const next = await Promise.race([
        pending,
        afterMicrotasks(5).then(() => null),
      ]);
      if (next === null) return { text, done: false };
      pending = null;
      if (next.done) return { text, done: true };
      text += decoder.decode(next.value);
    }
  }

  return { drain, cancel: () => reader.cancel() };
}

function open(headers: Record<string, string> = {}) {
  return GET(new NextRequest('http://localhost/api/news/stream?limit=5', { headers }));
}

describe('GET /api/news/stream', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockGetLatestNews.mockResolvedValue(news());
    mockGetBreakingNews.mockResolvedValue({ articles: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('closes itself before the Cloud Run request timeout would truncate it', () => {
    expect(SSE_MAX_DURATION_MS).toBeLessThan(CLOUD_RUN_REQUEST_TIMEOUT_MS);
  });

  it('advertises a reconnect delay and tags news events with an id', async () => {
    const response = await open();
    const reader = streamReader(response.body);

    await vi.advanceTimersByTimeAsync(0);
    const { text } = await reader.drain();

    expect(text.startsWith(`retry: ${SSE_RETRY_MS}\n\n`)).toBe(true);
    expect(text).toContain('event: connected');
    expect(text).toContain(`id: ${latestLink}\nevent: news\n`);
    await reader.cancel();
  });

  it('does not resend the batch a reconnecting client already has', async () => {
    const response = await open({ 'last-event-id': latestLink });
    const reader = streamReader(response.body);

    await vi.advanceTimersByTimeAsync(0);
    const { text } = await reader.drain();

    expect(text).not.toContain('event: news');
    expect(text).toContain('event: heartbeat');
    await reader.cancel();
  });

  it('sends a close event and ends the stream at the lifetime limit', async () => {
    const response = await open();
    const reader = streamReader(response.body);

    await vi.advanceTimersByTimeAsync(SSE_MAX_DURATION_MS - 1);
    const before = await reader.drain();
    expect(before.done).toBe(false);
    expect(before.text).not.toContain('event: close');

    await vi.advanceTimersByTimeAsync(1);
    const after = await reader.drain();
    expect(after.text).toContain('event: close');
    expect(after.text).toContain('max_duration_reached');
    expect(after.done).toBe(true);

    const pollsBefore = mockGetLatestNews.mock.calls.length;
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(mockGetLatestNews.mock.calls.length).toBe(pollsBefore);
  });
});
