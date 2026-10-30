import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const NOW = Date.parse('2026-10-30T20:00:00Z');

async function load() {
  vi.resetModules();
  return import('./coingecko-backoff');
}

describe('backOffCoinGecko', () => {
  it('reads Retry-After seconds', async () => {
    const { backOffCoinGecko, coinGeckoBackoffRemaining } = await load();

    expect(backOffCoinGecko('30', NOW)).toBe(30_000);
    expect(coinGeckoBackoffRemaining(NOW)).toBe(30_000);
    expect(coinGeckoBackoffRemaining(NOW + 30_000)).toBe(0);
  });

  it('reads a Retry-After HTTP date', async () => {
    const { backOffCoinGecko } = await load();

    expect(backOffCoinGecko(new Date(NOW + 45_000).toUTCString(), NOW)).toBe(45_000);
  });

  it('defaults to 60 s and caps at 2 minutes', async () => {
    const { backOffCoinGecko } = await load();

    expect(backOffCoinGecko(undefined, NOW)).toBe(60_000);
    expect(backOffCoinGecko('soon', NOW)).toBe(60_000);
    expect(backOffCoinGecko('3600', NOW)).toBe(120_000);
  });

  it('never shortens a longer back-off already in force', async () => {
    const { backOffCoinGecko, coinGeckoBackoffRemaining } = await load();

    backOffCoinGecko('90', NOW);
    backOffCoinGecko('5', NOW);

    expect(coinGeckoBackoffRemaining(NOW)).toBe(90_000);
  });
});

describe('shared CoinGecko back-off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stops market-data calling CoinGecko after lib/coingecko receives a 429', async () => {
    vi.resetModules();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 429, headers: { 'retry-after': '60' } }));
    const { fetchCoinGecko } = await import('./coingecko');
    const { getCoinsList } = await import('./market-data');

    expect(await fetchCoinGecko('https://api.coingecko.com/api/v3/coins/list', { skipCache: true })).toBeNull();
    const callsAfter429 = fetchSpy.mock.calls.length;

    expect(await getCoinsList()).toEqual([]);
    expect(fetchSpy.mock.calls.length).toBe(callsAfter429);
  });
});
