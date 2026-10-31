import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/x402', () => ({ hybridAuthMiddleware: vi.fn(async () => null) }));

import { llamaBulkCache } from '@/lib/apis/llama-bulk';

import { GET } from './route';

const protocols = Array.from({ length: 150 }, (_, i) => ({
  name: `Protocol ${i}`,
  symbol: `P${i}`,
  category: 'Dexes',
  chain: 'Ethereum',
  chains: ['Ethereum'],
  tvl: 1_000_000 * (150 - i),
  change_1h: 0,
  change_1d: 0,
  change_7d: 0,
  url: `https://p${i}.example`,
  logo: '',
  slug: `p${i}`,
}));

function request(query: string) {
  return new NextRequest(`http://localhost/api/v1/defi?${query}`);
}

describe('GET /api/v1/defi limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    llamaBulkCache.clear();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(protocols));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['limit=abc', 50],
    ['limit=', 50],
    ['limit=0', 1],
    ['limit=-5', 1],
    ['limit=999', 100],
    ['limit=7', 7],
  ])('%s returns %i protocols', async (query, expected) => {
    const res = await GET(request(query));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(expected);
  });
});
