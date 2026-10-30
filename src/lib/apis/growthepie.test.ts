import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  feesBySlug,
  getChainFees,
  latestMedianFees,
  type GrowthepieFeesResponse,
} from './growthepie';

const H = 3_600_000;
const T0 = 1_793_390_400_000; // 2026-10-30T20:00:00Z
const TYPES = ['unix', 'value_eth', 'value_usd', 'normalized'];

function chain(rows: Array<Array<number | null>>) {
  return { hourly: { txcosts_median: { types: TYPES, data: rows } } };
}

// Shape of GET https://api.growthepie.com/v1/fees/table.json (trimmed, newest row first)
const table: GrowthepieFeesResponse = {
  chain_data: {
    ethereum: chain([
      [T0, 2e-5, 0.04, 0],
      [T0 - H, 4e-5, 0.08, 0],
    ]),
    // Older rows are listed first here to prove ordering comes from the timestamp
    linea: chain([
      [T0 - H, 1e-4, 0.2, 0],
      [T0, 1e-5, 0.02, 0],
    ]),
    // value_usd rounded to 0 upstream
    optimism: chain([[T0, 7e-9, 0, 0]]),
    base: chain([
      [T0, null, null, null],
      [T0 - H, 6e-7, 0.0012, 0],
    ]),
    some_new_chain: chain([[T0, 1, 2000, 0]]),
  },
};

describe('latestMedianFees', () => {
  it('takes the newest complete hour per known chain, most expensive first', () => {
    const fees = latestMedianFees(table);

    expect(fees.map((f) => f.chain)).toEqual(['ethereum', 'linea', 'base', 'optimism']);
    expect(fees[0]).toMatchObject({ name: 'Ethereum L1', eth: 2e-5, timestamp: T0 });
    expect(fees[1]).toMatchObject({ eth: 1e-5, timestamp: T0 });
    expect(fees[2].timestamp).toBe(T0 - H);
  });

  it('prices sub-cent fees from ETH so they never read as $0', () => {
    const optimism = latestMedianFees(table).find((f) => f.chain === 'optimism');

    // ETH price implied by ethereum and linea rows: 2000
    expect(optimism?.usd).toBeCloseTo(7e-9 * 2000, 12);
    expect(optimism?.usd).toBeGreaterThan(0);
  });

  it('falls back to the reported USD value when no row can imply an ETH price', () => {
    const fees = latestMedianFees({ chain_data: { base: chain([[T0, 6e-7, 0.0012, 0]]) } });

    expect(fees).toEqual([{ chain: 'base', name: 'Base', eth: 6e-7, usd: 0.0012, timestamp: T0 }]);
  });

  it('returns nothing for an empty or unexpected payload', () => {
    expect(latestMedianFees({ chain_data: {} })).toEqual([]);
    expect(
      latestMedianFees({ chain_data: { ethereum: { hourly: { txcosts_median: { types: ['x'], data: [[1]] } } } } }),
    ).toEqual([]);
  });
});

describe('feesBySlug', () => {
  it('maps growthepie keys onto L2Beat and DefiLlama slugs', () => {
    const map = feesBySlug(latestMedianFees(table));

    expect(map.get('op-mainnet')).toBe(map.get('optimism'));
    expect(map.get('linea')).toBeCloseTo(0.02);
    expect(map.has('some_new_chain')).toBe(false);
  });
});

describe('getChainFees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and parses the fee table', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify(table), { status: 200, headers: { 'content-type': 'application/json' } }),
      );

    const fees = await getChainFees();

    expect(String(fetchSpy.mock.calls[0][0])).toBe('https://api.growthepie.com/v1/fees/table.json');
    expect(fees.map((f) => f.chain)).toEqual(['ethereum', 'linea', 'base', 'optimism']);
  });
});
