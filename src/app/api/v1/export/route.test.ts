import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as llama from '@/lib/apis/llama-bulk';
import * as marketData from '@/lib/market-data';
import type { TokenPrice } from '@/lib/market-data';

import { GET } from './route';

// @x402/next cannot load under vitest (it imports the extensionless `next/server`).
vi.mock('@/lib/x402', () => ({ hybridAuthMiddleware: vi.fn(async () => null) }));

const coin = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin, the original',
  current_price: 65000,
  market_cap: 1,
  market_cap_rank: 1,
  total_volume: 1,
  price_change_24h: 1,
  price_change_percentage_24h: 1,
  circulating_supply: 1,
  total_supply: null,
  max_supply: null,
  ath: 1,
  ath_change_percentage: 1,
  last_updated: '2026-10-31T00:00:00Z',
  sparkline_in_7d: { price: [1, 2, 3] },
} satisfies TokenPrice;

const get = (query: string) => GET(new NextRequest(`https://cryptocurrency.cv/api/v1/export${query}`));

describe('GET /api/v1/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to the default row count for a non-numeric limit', async () => {
    const topCoins = vi.spyOn(marketData, 'getTopCoins').mockResolvedValue([coin]);
    const res = await get('?limit=abc');
    expect(res.status).toBe(200);
    expect(topCoins).toHaveBeenCalledWith(100);
  });

  it('caps coin exports at the CoinGecko page size', async () => {
    const topCoins = vi.spyOn(marketData, 'getTopCoins').mockResolvedValue([coin]);
    await get('?limit=500');
    expect(topCoins).toHaveBeenCalledWith(250);
  });

  it('drops sparkline arrays and quotes commas in CSV', async () => {
    vi.spyOn(marketData, 'getTopCoins').mockResolvedValue([coin]);
    const res = await get('?format=csv');
    const csv = await res.text();
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(csv).not.toContain('sparkline');
    expect(csv).toContain('"Bitcoin, the original"');
  });

  it('returns 502 when every market source is down', async () => {
    vi.spyOn(marketData, 'getTopCoins').mockResolvedValue([]);
    const res = await get('');
    expect(res.status).toBe(502);
  });

  it('exports DefiLlama protocols for type=defi', async () => {
    const protocols = vi.spyOn(llama, 'getLlamaProtocols').mockResolvedValue([
      { name: 'Aave', symbol: 'AAVE', category: 'Lending', chain: 'Multi-Chain', tvl: 10 },
    ] as Awaited<ReturnType<typeof llama.getLlamaProtocols>>);
    const res = await get('?type=defi&limit=1');
    const body = (await res.json()) as { data: { name: string }[] };
    expect(protocols).toHaveBeenCalled();
    expect(body.data).toEqual([expect.objectContaining({ name: 'Aave', tvl: 10 })]);
  });
});
