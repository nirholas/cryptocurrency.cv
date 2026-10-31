import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { staleCache } from '@/lib/cache';
import { CircuitBreaker } from '@/lib/circuit-breaker';

import {
  getLlamaDexOverview,
  getLlamaFeesOverview,
  getLlamaProtocols,
  getLlamaYieldPools,
  llamaBulkCache,
} from './llama-bulk';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const PROTOCOLS = [
  { id: '1', name: 'Aave', slug: 'aave', tvl: 30 },
  { id: '2', name: 'Lido', slug: 'lido', tvl: 20 },
];

describe('llama-bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    llamaBulkCache.clear();
    staleCache.clear();
    CircuitBreaker.resetAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shares one request between concurrent callers', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse(PROTOCOLS));

    const [a, b, c] = await Promise.all([
      getLlamaProtocols(),
      getLlamaProtocols(),
      getLlamaProtocols(),
    ]);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.llama.fi/protocols');
    expect(a).toEqual(PROTOCOLS);
    expect(b).toBe(a);
    expect(c).toBe(a);
  });

  it('serves later calls from the cache without refetching', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ data: [{ pool: 'p1', apy: 5 }] }));

    const first = await getLlamaYieldPools();
    const second = await getLlamaYieldPools();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://yields.llama.fi/pools');
    expect(second).toBe(first);
    expect(first).toEqual([{ pool: 'p1', apy: 5 }]);
  });

  it('serves the last good copy when DefiLlama fails after the TTL', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(async () => jsonResponse(PROTOCOLS))
      .mockImplementationOnce(async () => jsonResponse({ error: 'not found' }, 404));

    await getLlamaProtocols();
    // Simulate TTL expiry: the fresh entry is gone, the 1-hour stale copy remains.
    llamaBulkCache.clear();

    await expect(getLlamaProtocols()).resolves.toEqual(PROTOCOLS);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('throws when DefiLlama fails and no earlier copy exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      jsonResponse({ error: 'not found' }, 404),
    );

    await expect(getLlamaProtocols()).rejects.toThrow('/protocols returned HTTP 404');
  });

  it('rejects a non-array /protocols body and does not cache it', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ message: 'rate limited' }));

    await expect(getLlamaProtocols()).rejects.toThrow('non-array body');
    await expect(getLlamaProtocols()).rejects.toThrow('non-array body');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('rejects a yields body without a data array', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ status: 'error' }));

    await expect(getLlamaYieldPools()).rejects.toThrow('no data array');
  });

  it('builds chart-free overview URLs with chain and dataType', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse({ protocols: [{ name: 'Uniswap' }], total24h: 1 }));

    await getLlamaDexOverview();
    await getLlamaDexOverview('Ethereum');
    await getLlamaFeesOverview({ dataType: 'dailyRevenue' });

    const urls = fetchSpy.mock.calls.map((call) => String(call[0]));
    expect(urls).toEqual([
      'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true',
      'https://api.llama.fi/overview/dexs/Ethereum?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true',
      'https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyRevenue',
    ]);
  });

  it('rejects an overview body without a protocols array', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => jsonResponse({ total24h: 5 }));

    await expect(getLlamaFeesOverview()).rejects.toThrow('/overview/fees returned no protocols array');
  });
});
