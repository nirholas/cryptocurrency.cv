/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the circuit-breaker module
const mockBreakerCall = vi.fn();
vi.mock('./circuit-breaker', () => ({
  CircuitBreaker: {
    for: vi.fn().mockReturnValue({
      call: mockBreakerCall,
    }),
  },
  CircuitOpenError: class CircuitOpenError extends Error {
    constructor(service: string) {
      super(`Circuit breaker open for ${service}`);
      this.name = 'CircuitOpenError';
    }
  },
}));

import { resilientFetch, type ResilientFetchOptions } from '@/lib/resilient-fetch';

describe('resilientFetch', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should fetch data successfully', async () => {
    const mockData = { articles: [{ title: 'Test' }] };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    });

    const result = await resilientFetch('https://api.example.com/data');
    expect(result.data).toEqual(mockData);
    expect(result.stale).toBe(false);
    expect(result.status).toBe(200);
    expect(result.attempts).toBe(1);
  });

  it('should retry on transient HTTP errors', async () => {
    const mockData = { ok: true };
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Service Unavailable' })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(mockData) });

    const result = await resilientFetch('https://api.example.com/data', {
      retries: 1,
      retryBaseMs: 10,
    });
    expect(result.data).toEqual(mockData);
    expect(result.attempts).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw on non-retryable HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(resilientFetch('https://api.example.com/missing', { retries: 0 })).rejects.toThrow(
      'HTTP 404',
    );
  });

  it('should retry on 429 status', async () => {
    const mockData = { ok: true };
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, statusText: 'Too Many Requests' })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(mockData) });

    const result = await resilientFetch('https://api.example.com/data', {
      retries: 1,
      retryBaseMs: 10,
    });
    expect(result.data).toEqual(mockData);
    expect(result.attempts).toBe(2);
  });

  it('should add abort signal for timeout', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      expect(init.signal).toBeDefined();
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: true }),
      });
    });

    await resilientFetch('https://api.example.com/data', { timeoutMs: 5000 });
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('should return stale data when all attempts fail', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

    // Create a simple mock cache
    const staleData = { cached: true };
    const mockCache = {
      get: vi.fn().mockReturnValue(staleData),
      set: vi.fn(),
    };

    const result = await resilientFetch('https://api.example.com/data', {
      retries: 0,
      staleCache: mockCache as any,
      staleCacheKey: 'test-key',
    });

    expect(result.stale).toBe(true);
    expect(result.data).toEqual(staleData);
    expect(result.status).toBe(0);
  });

  it('should throw when all attempts fail and no stale cache', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

    await expect(resilientFetch('https://api.example.com/data', { retries: 0 })).rejects.toThrow(
      'fetch failed',
    );
  });

  it('should store successful response in stale cache', async () => {
    const mockData = { fresh: true };
    const mockCache = {
      get: vi.fn(),
      set: vi.fn(),
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    });

    await resilientFetch('https://api.example.com/data', {
      staleCache: mockCache as any,
      staleCacheKey: 'my-key',
    });

    expect(mockCache.set).toHaveBeenCalledWith('my-key', mockData, 3600);
  });

  it('should pass through custom fetch init options', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await resilientFetch('https://api.example.com/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });

    const callArgs = (globalThis.fetch as any).mock.calls[0];
    expect(callArgs[0]).toBe('https://api.example.com/data');
    expect(callArgs[1].method).toBe('POST');
    expect(callArgs[1].headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('should measure elapsed time', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    const result = await resilientFetch('https://api.example.com/data');
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('should default to 3 total attempts (retries=2)', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502, statusText: 'Bad Gateway' })
      .mockResolvedValueOnce({ ok: false, status: 502, statusText: 'Bad Gateway' })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });

    const result = await resilientFetch('https://api.example.com/data', {
      retryBaseMs: 10,
    });

    expect(result.data).toEqual({ ok: true });
    expect(result.attempts).toBe(3);
  });
});
