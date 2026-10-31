import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as llama from '@/lib/apis/llama-bulk';
import type { LlamaProtocol } from '@/lib/apis/llama-bulk';

import { defillamaGamingAdapter } from './defillama.adapter';

function protocol(overrides: Partial<LlamaProtocol>): LlamaProtocol {
  return { name: 'X', slug: 'x', category: 'Gaming', ...overrides } as LlamaProtocol;
}

const PROTOCOLS: LlamaProtocol[] = [
  protocol({ name: 'Axie', slug: 'axie', chain: 'Ronin', tvl: 50, change_1d: -1.5, url: 'https://axie.example' }),
  protocol({ name: 'Big', slug: 'big', chains: ['Ethereum', 'Polygon'], tvl: 900, logo: 'https://logo.example/big.png' }),
  protocol({ name: 'Mid', slug: 'mid', chain: 'Polygon', tvl: 300 }),
  protocol({ name: 'NoTvl', slug: 'notvl', chain: 'Ronin' }),
  protocol({ name: 'Dex', slug: 'dex', category: 'Dexs', chain: 'Ethereum', tvl: 10_000 }),
];

describe('defillamaGamingAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(llama, 'getLlamaProtocols').mockResolvedValue(PROTOCOLS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps only Gaming protocols, ranked by value locked', async () => {
    const overview = await defillamaGamingAdapter.fetch({});

    expect(overview.topGames.map((g) => g.slug)).toEqual(['big', 'mid', 'axie', 'notvl']);
    expect(overview.rankedBy).toBe('tvl');
    expect(overview.source).toBe('defillama');
  });

  it('reports unknown metrics as null rather than zero', async () => {
    const overview = await defillamaGamingAdapter.fetch({});
    const axie = overview.topGames.find((g) => g.slug === 'axie');

    expect(overview.totalDau).toBeNull();
    expect(overview.totalVolume24h).toBeNull();
    expect(overview.totalTvl).toBe(1250);
    expect(axie).toMatchObject({ dau: null, volume24h: null, balance: 50, change24h: -1.5, url: 'https://axie.example' });
    expect(overview.topGames.find((g) => g.slug === 'notvl')?.balance).toBeNull();
  });

  it('uses the first listed chain when a protocol has no primary chain', async () => {
    const overview = await defillamaGamingAdapter.fetch({});

    expect(overview.topGames[0]).toMatchObject({ chain: 'Ethereum', logo: 'https://logo.example/big.png' });
    expect(overview.byChain).toEqual({ Ethereum: 1, Polygon: 1, Ronin: 2 });
  });

  it('filters by chain case-insensitively, including multi-chain listings', async () => {
    const polygon = await defillamaGamingAdapter.fetch({ chain: 'polygon' });
    const all = await defillamaGamingAdapter.fetch({ chain: 'all' });

    expect(polygon.topGames.map((g) => g.slug)).toEqual(['big', 'mid']);
    expect(all.topGames).toHaveLength(4);
  });

  it('clamps the limit to 1-100', async () => {
    expect((await defillamaGamingAdapter.fetch({ limit: 2 })).topGames).toHaveLength(2);
    expect((await defillamaGamingAdapter.fetch({ limit: 0 })).topGames).toHaveLength(1);
    expect((await defillamaGamingAdapter.fetch({ limit: 1000 })).topGames).toHaveLength(4);
  });
});
