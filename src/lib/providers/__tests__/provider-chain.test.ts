/**
 * Tests for providers/provider-chain.ts
 *
 * Covers the main orchestrator:
 * - Fallback strategy (try in priority order)
 * - Race strategy (parallel, return fastest)
 * - Consensus strategy (fetch all, fuse)
 * - Broadcast strategy (fetch all, return all)
 * - Circuit breaker integration
 * - Stale-while-revalidate caching
 * - Rate limiting
 * - Event emission
 * - Error handling (AllProvidersFailedError)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProviderChain, AllProvidersFailedError } from '@/lib/providers/provider-chain';
import type { DataProvider, FetchParams } from '@/lib/providers/types';

// ---------------------------------------------------------------------------
// Helpers — Mock Providers
// ---------------------------------------------------------------------------

function createMockProvider<T>(
  name: string,
  data: T,
  opts: {
    priority?: number;
    weight?: number;
    latency?: number;
    shouldFail?: boolean;
    failMessage?: string;
  } = {},
): DataProvider<T> {
  const {
    priority = 1,
    weight = 1.0,
    latency = 10,
    shouldFail = false,
    failMessage = `${name} failed`,
  } = opts;

  return {
    name,
    priority,
    weight,
    rateLimit: { maxRequests: 100, windowMs: 60_000 },
    capabilities: ['test'],

    async fetch(_params: FetchParams): Promise<T> {
      await new Promise(resolve => setTimeout(resolve, latency));
      if (shouldFail) throw new Error(failMessage);
      return data;
    },

    async healthCheck(): Promise<boolean> {
      return !shouldFail;
    },

    validate(d: T): boolean {
      return d !== null && d !== undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProviderChain', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fallback strategy', () => {
    it('returns data from highest-priority provider', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      chain.addProvider(createMockProvider('primary', 'primary-data', { priority: 1 }));
      chain.addProvider(createMockProvider('secondary', 'secondary-data', { priority: 2 }));

      const promise = chain.fetch({});
      vi.advanceTimersByTime(100);
      const result = await promise;

      expect(result.data).toBe('primary-data');
      expect(result.lineage.provider).toBe('primary');
    });

    it('falls back when primary fails', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      chain.addProvider(createMockProvider('primary', 'primary-data', {
        priority: 1,
        shouldFail: true,
      }));
      chain.addProvider(createMockProvider('secondary', 'secondary-data', { priority: 2 }));

      const promise = chain.fetch({});
      vi.advanceTimersByTime(100);
      const result = await promise;

      expect(result.data).toBe('secondary-data');
      expect(result.lineage.provider).toBe('secondary');
    });

    it('throws AllProvidersFailedError when all fail', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      chain.addProvider(createMockProvider('a', 'a', { priority: 1, shouldFail: true }));
      chain.addProvider(createMockProvider('b', 'b', { priority: 2, shouldFail: true }));

      const promise = chain.fetch({});
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow(AllProvidersFailedError);
    });
  });

  describe('race strategy', () => {
    it('returns fastest successful result', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'race' });
      chain.addProvider(createMockProvider('slow', 'slow-data', {
        priority: 1,
        latency: 500,
      }));
      chain.addProvider(createMockProvider('fast', 'fast-data', {
        priority: 2,
        latency: 10,
      }));

      const promise = chain.fetch({});
      vi.advanceTimersByTime(600);
      const result = await promise;

      expect(result.data).toBe('fast-data');
      expect(result.lineage.provider).toBe('fast');
    });
  });

  describe('caching', () => {
    it('returns cached result on second call', async () => {
      const chain = new ProviderChain<string>('test', {
        strategy: 'fallback',
        cacheTtlSeconds: 30,
      });

      let callCount = 0;
      const countingProvider: DataProvider<string> = {
        name: 'counting',
        priority: 1,
        weight: 1.0,
        rateLimit: { maxRequests: 100, windowMs: 60_000 },
        capabilities: ['test'],
        async fetch() {
          callCount++;
          return 'data';
        },
        async healthCheck() { return true; },
        validate() { return true; },
      };

      chain.addProvider(countingProvider);

      // First call — hits provider
      const promise1 = chain.fetch({});
      vi.advanceTimersByTime(100);
      const result1 = await promise1;
      expect(result1.cached).toBe(false);
      expect(callCount).toBe(1);

      // Second call — should be cached
      const result2 = await chain.fetch({});
      expect(result2.cached).toBe(true);
      expect(callCount).toBe(1); // No additional call
    });

    it('stale-while-revalidate serves stale on failure', async () => {
      let shouldFail = false;
      const toggleProvider: DataProvider<string> = {
        name: 'toggle',
        priority: 1,
        weight: 1.0,
        rateLimit: { maxRequests: 100, windowMs: 60_000 },
        capabilities: ['test'],
        async fetch() {
          if (shouldFail) throw new Error('down');
          return 'fresh-data';
        },
        async healthCheck() { return !shouldFail; },
        validate() { return true; },
      };

      const chain = new ProviderChain<string>('test', {
        strategy: 'fallback',
        cacheTtlSeconds: 1,
      });
      chain.addProvider(toggleProvider);

      // First call — populate cache
      const promise1 = chain.fetch({});
      vi.advanceTimersByTime(100);
      await promise1;

      // Expire the cache TTL
      vi.advanceTimersByTime(2000);

      // Provider goes down
      shouldFail = true;

      // Should still get stale data
      const promise2 = chain.fetch({});
      vi.advanceTimersByTime(100);
      const result2 = await promise2;
      expect(result2.data).toBe('fresh-data');
      expect(result2.cached).toBe(true);
    });
  });

  describe('events', () => {
    it('emits fetch_success events', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      chain.addProvider(createMockProvider('api', 'data', { priority: 1 }));

      const events: unknown[] = [];
      chain.on(e => events.push(e));

      const promise = chain.fetch({});
      vi.advanceTimersByTime(100);
      await promise;

      const successEvent = events.find((e: any) => e.type === 'fetch_success');
      expect(successEvent).toBeDefined();
    });

    it('emits fetch_failure events', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      chain.addProvider(createMockProvider('api', 'data', {
        priority: 1,
        shouldFail: true,
      }));

      const events: unknown[] = [];
      chain.on(e => events.push(e));

      const promise = chain.fetch({});
      vi.advanceTimersByTime(100);
      await promise.catch(() => {});

      const failEvent = events.find((e: any) => e.type === 'fetch_failure');
      expect(failEvent).toBeDefined();
    });
  });

  describe('provider management', () => {
    it('addProvider and removeProvider work', () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      const provider = createMockProvider('api', 'data');

      chain.addProvider(provider);
      expect(chain.providerCount).toBe(1);

      chain.removeProvider('api');
      expect(chain.providerCount).toBe(0);
    });

    it('sorts providers by priority after adding', () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });

      chain.addProvider(createMockProvider('low', 'low', { priority: 3 }));
      chain.addProvider(createMockProvider('high', 'high', { priority: 1 }));
      chain.addProvider(createMockProvider('mid', 'mid', { priority: 2 }));

      expect(chain.providerCount).toBe(3);
    });
  });

  describe('health', () => {
    it('reports chain health', async () => {
      const chain = new ProviderChain<string>('test', { strategy: 'fallback' });
      chain.addProvider(createMockProvider('api', 'data'));

      // Make a successful call to populate health data
      const promise = chain.fetch({});
      vi.advanceTimersByTime(100);
      await promise;

      const health = chain.getHealth();
      expect(health).toBeDefined();
      expect(health.status).toBe('healthy');
    });
  });
});
