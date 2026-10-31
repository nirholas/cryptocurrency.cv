import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gamingDataChain } from '@/lib/providers/adapters/gaming-data';
import type { GamingOverview } from '@/lib/providers/adapters/gaming-data';

import { GET } from './route';

const OVERVIEW: GamingOverview = {
  totalDau: null,
  totalVolume24h: null,
  totalTvl: 30,
  topGames: [
    {
      name: 'High',
      slug: 'high',
      chain: 'Ronin',
      dau: null,
      transactions24h: null,
      volume24h: null,
      category: 'game',
      balance: 20,
      change24h: null,
      logo: null,
      url: null,
      timestamp: '2026-10-31T00:00:00.000Z',
    },
    {
      name: 'Low',
      slug: 'low',
      chain: 'Polygon',
      dau: 7,
      transactions24h: null,
      volume24h: null,
      category: 'game',
      balance: 10,
      change24h: null,
      logo: null,
      url: null,
      timestamp: '2026-10-31T00:00:00.000Z',
    },
  ],
  byChain: { Ronin: 1, Polygon: 1 },
  rankedBy: 'tvl',
  source: 'defillama',
  timestamp: '2026-10-31T00:00:00.000Z',
};

function fetchResult(data: GamingOverview) {
  return { data, lineage: { provider: 'defillama-gaming' }, cached: false } as unknown as Awaited<
    ReturnType<typeof gamingDataChain.fetch>
  >;
}

describe('GET /api/gaming/top', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the provider ranking by default', async () => {
    const fetchSpy = vi.spyOn(gamingDataChain, 'fetch').mockResolvedValue(fetchResult(OVERVIEW));

    const res = await GET(new Request('https://cryptocurrency.cv/api/gaming/top'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.map((g: { slug: string }) => g.slug)).toEqual(['high', 'low']);
    expect(body).toMatchObject({ count: 2, sortBy: 'tvl', chain: 'all' });
    expect(fetchSpy).toHaveBeenCalledWith({ limit: 25, chain: undefined });
  });

  it('re-sorts by players and falls back to the default limit on junk input', async () => {
    const fetchSpy = vi.spyOn(gamingDataChain, 'fetch').mockResolvedValue(fetchResult(OVERVIEW));

    const res = await GET(new Request('https://cryptocurrency.cv/api/gaming/top?sort=players&limit=abc&chain=Ronin'));
    const body = await res.json();

    expect(body.data.map((g: { slug: string }) => g.slug)).toEqual(['low', 'high']);
    expect(body).toMatchObject({ sortBy: 'dau', chain: 'Ronin' });
    expect(fetchSpy).toHaveBeenCalledWith({ limit: 25, chain: 'Ronin' });
  });

  it('rejects an unknown sort key', async () => {
    const fetchSpy = vi.spyOn(gamingDataChain, 'fetch');

    const res = await GET(new Request('https://cryptocurrency.cv/api/gaming/top?sort=users'));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('hides upstream error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(gamingDataChain, 'fetch').mockRejectedValue(new Error('secret upstream detail'));

    const res = await GET(new Request('https://cryptocurrency.cv/api/gaming/top'));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});
