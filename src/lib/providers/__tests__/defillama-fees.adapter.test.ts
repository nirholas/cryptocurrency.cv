import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { llamaBulkCache } from '@/lib/apis/llama-bulk';
import { staleCache } from '@/lib/cache';
import { CircuitBreaker } from '@/lib/circuit-breaker';

import { defillamaFeesAdapter } from '../adapters/protocol-revenue/defillama-fees.adapter';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Shapes match the live api.llama.fi/overview/fees payloads: unsorted, and
// no revenue fields on the fees rows.
const FEES = {
  protocols: [
    { name: 'WBTC', slug: 'wbtc', total24h: 0, totalAllTime: 10 },
    { name: 'Tether', slug: 'tether', total24h: 9_000_000, total7d: 63_000_000, totalAllTime: 5e9, category: 'Stablecoin Issuer', chains: ['Ethereum'] },
    { name: 'Uniswap V3', slug: 'uniswap-v3', total24h: 2_000_000, totalAllTime: 3e9 },
  ],
};
const REVENUE = {
  protocols: [
    { name: 'Tether', slug: 'tether', total24h: 8_500_000, totalAllTime: 4.8e9 },
  ],
};

describe('defillamaFeesAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    llamaBulkCache.clear();
    staleCache.clear();
    CircuitBreaker.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ranks by 24h fees and merges revenue from the dailyRevenue overview', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      jsonResponse(String(input).includes('dataType=dailyRevenue') ? REVENUE : FEES),
    );

    const rows = await defillamaFeesAdapter.fetch({ limit: 5 });

    expect(rows.map((r) => r.slug)).toEqual(['tether', 'uniswap-v3']);
    expect(rows[0]).toMatchObject({
      dailyFees: 9_000_000,
      dailyRevenue: 8_500_000,
      totalRevenue: 4.8e9,
      weeklyFees: 63_000_000,
      category: 'Stablecoin Issuer',
    });
    expect(rows[1]).toMatchObject({ dailyRevenue: 0, totalRevenue: 0 });
  });

  it('still returns fees when the revenue overview fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) =>
      String(input).includes('dataType=dailyRevenue')
        ? jsonResponse({ error: 'gone' }, 404)
        : jsonResponse(FEES),
    );

    const rows = await defillamaFeesAdapter.fetch({ limit: 1 });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ slug: 'tether', dailyFees: 9_000_000, dailyRevenue: 0 });
  });

  it('does not reorder the shared cached overview', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse(FEES));

    await defillamaFeesAdapter.fetch({ limit: 5 });

    const { getLlamaFeesOverview } = await import('@/lib/apis/llama-bulk');
    const cached = await getLlamaFeesOverview<{ slug: string }>();
    expect(cached.protocols.map((p) => p.slug)).toEqual(['wbtc', 'tether', 'uniswap-v3']);
  });
});
