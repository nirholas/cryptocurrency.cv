/**
 * Tests for providers/registry.ts
 *
 * Covers:
 * - Chain registration and lookup by category
 * - Category-based fetch routing
 * - Global health check
 * - Status overview
 * - Formatted report
 * - Singleton behavior
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistry } from '@/lib/providers/registry';
import { ProviderChain } from '@/lib/providers/provider-chain';
import type { DataCategory, DataProvider, FetchParams } from '@/lib/providers/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSimpleProvider<T>(name: string, data: T): DataProvider<T> {
  return {
    name,
    priority: 1,
    weight: 1.0,
    rateLimit: { maxRequests: 100, windowMs: 60_000 },
    capabilities: ['test'],
    async fetch(_params: FetchParams): Promise<T> {
      return data;
    },
    async healthCheck(): Promise<boolean> {
      return true;
    },
    validate(): boolean {
      return true;
    },
  };
}

function createTestChain<T>(name: string, data: T): ProviderChain<T> {
  const chain = new ProviderChain<T>(name, { strategy: 'fallback' });
  chain.addProvider(createSimpleProvider('provider', data));
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProviderRegistry', () => {
  let reg: ProviderRegistry;

  beforeEach(() => {
    reg = new ProviderRegistry();
  });

  describe('registration', () => {
    it('registers and retrieves a chain by category', () => {
      const chain = createTestChain('prices', [{ price: 100 }]);
      reg.register('market-price', chain);

      expect(reg.has('market-price')).toBe(true);
      expect(reg.getChain('market-price')).toBe(chain);
    });

    it('unregisters a chain', () => {
      const chain = createTestChain('prices', []);
      reg.register('market-price', chain);
      reg.unregister('market-price');

      expect(reg.has('market-price')).toBe(false);
    });

    it('lists all registered categories', () => {
      reg.register('market-price', createTestChain('a', []));
      reg.register('funding-rate', createTestChain('b', []));
      reg.register('tvl', createTestChain('c', []));

      const cats = reg.categories;
      expect(cats).toContain('market-price');
      expect(cats).toContain('funding-rate');
      expect(cats).toContain('tvl');
      expect(cats).toHaveLength(3);
    });
  });

  describe('fetch routing', () => {
    it('routes fetch to the correct chain by category', async () => {
      const priceChain = createTestChain('prices', [{ id: 'bitcoin', price: 95000 }]);
      const tvlChain = createTestChain('tvl', [{ protocol: 'aave', tvl: 1e10 }]);

      reg.register('market-price', priceChain);
      reg.register('tvl', tvlChain);

      const priceResult = await reg.fetch('market-price', {});
      expect(priceResult.data).toEqual([{ id: 'bitcoin', price: 95000 }]);

      const tvlResult = await reg.fetch('tvl', {});
      expect(tvlResult.data).toEqual([{ protocol: 'aave', tvl: 1e10 }]);
    });

    it('throws on fetch for unregistered category', async () => {
      await expect(reg.fetch('nonexistent' as DataCategory, {})).rejects.toThrow();
    });
  });

  describe('health', () => {
    it('healthCheck returns per-category results', async () => {
      reg.register('market-price', createTestChain('a', []));
      reg.register('tvl', createTestChain('b', []));

      const results = await reg.healthCheck();

      expect(results).toHaveProperty('market-price');
      expect(results).toHaveProperty('tvl');
    });
  });

  describe('status overview', () => {
    it('returns overview of all chains', () => {
      reg.register('market-price', createTestChain('a', []));

      const overview = reg.statusOverview();
      expect(overview).toHaveLength(1);
      expect(overview[0].category).toBe('market-price');
    });
  });

  describe('report', () => {
    it('generates a formatted report string', () => {
      reg.register('market-price', createTestChain('a', []));
      reg.register('tvl', createTestChain('b', []));

      const report = reg.report();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('removes all registrations', () => {
      reg.register('market-price', createTestChain('a', []));
      reg.register('tvl', createTestChain('b', []));

      reg.clear();
      expect(reg.categories).toHaveLength(0);
    });
  });
});
