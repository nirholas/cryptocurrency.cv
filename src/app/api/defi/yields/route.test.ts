import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { llamaBulkCache } from '@/lib/apis/llama-bulk';

import { GET } from './route';

const pools = [2, 5, 12, 40, 150].map((apy, i) => ({
  pool: `pool-${i}`,
  chain: 'Ethereum',
  project: 'example',
  symbol: `P${i}`,
  tvlUsd: 10_000_000 * (i + 1),
  apy,
  stablecoin: false,
  outlier: false,
}));

function request(query: string) {
  return new NextRequest(`http://localhost/api/defi/yields?${query}`);
}

describe('GET /api/defi/yields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    llamaBulkCache.clear();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ data: pools }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['min_apy=10', [150, 40, 12]],
    ['max_apy=12', [12, 5, 2]],
    ['min_apy=5&max_apy=40', [40, 12, 5]],
    ['min_apy=abc', [150, 40, 12, 5, 2]],
    ['min_tvl=abc', [150, 40, 12, 5, 2]],
    ['min_tvl=30000000', [150, 40, 12]],
  ])('%s', async (query, expected) => {
    const res = await GET(request(query));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.map((p: { apy: number }) => p.apy)).toEqual(expected);
  });
});
