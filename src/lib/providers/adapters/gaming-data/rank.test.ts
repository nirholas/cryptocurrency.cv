import { describe, expect, it } from 'vitest';

import { aggregateByChain, parseGameSort, sortGames } from './rank';
import type { GameData } from './types';

function game(slug: string, overrides: Partial<GameData>): GameData {
  return {
    name: slug,
    slug,
    chain: 'Ronin',
    dau: null,
    transactions24h: null,
    volume24h: null,
    category: 'game',
    balance: null,
    change24h: null,
    logo: null,
    url: null,
    timestamp: '2026-10-31T00:00:00.000Z',
    ...overrides,
  };
}

describe('parseGameSort', () => {
  it('accepts the documented keys and the players alias', () => {
    expect(parseGameSort('dau')).toBe('dau');
    expect(parseGameSort('players')).toBe('dau');
    expect(parseGameSort('volume')).toBe('volume');
    expect(parseGameSort('tvl')).toBe('tvl');
  });

  it('returns null for missing or unknown keys', () => {
    expect(parseGameSort(null)).toBeNull();
    expect(parseGameSort('')).toBeNull();
    expect(parseGameSort('toString')).toBeNull();
    expect(parseGameSort('users')).toBeNull();
  });
});

describe('sortGames', () => {
  it('sorts highest first and puts missing values last in provider order', () => {
    const games = [
      game('a', { dau: null }),
      game('b', { dau: 5 }),
      game('c', { dau: null }),
      game('d', { dau: 50 }),
      game('e', { dau: 5 }),
    ];

    expect(sortGames(games, 'dau').map((g) => g.slug)).toEqual(['d', 'b', 'e', 'a', 'c']);
  });

  it('does not mutate its input', () => {
    const games = [game('a', { balance: 1 }), game('b', { balance: 2 })];
    sortGames(games, 'tvl');
    expect(games.map((g) => g.slug)).toEqual(['a', 'b']);
  });
});

describe('aggregateByChain', () => {
  it('counts games and sums only reported metrics', () => {
    const chains = aggregateByChain([
      game('a', { chain: 'Ronin', balance: 10, dau: 3 }),
      game('b', { chain: 'Ronin', balance: 5 }),
      game('c', { chain: 'Polygon', balance: 100 }),
      game('d', { chain: '' }),
    ]);

    expect(chains).toEqual([
      { chain: 'Ronin', games: 2, totalDau: 3, totalVolume: null, totalTvl: 15 },
      { chain: 'Polygon', games: 1, totalDau: null, totalVolume: null, totalTvl: 100 },
      { chain: 'Unknown', games: 1, totalDau: null, totalVolume: null, totalTvl: null },
    ]);
  });

  it('returns an empty list for no games', () => {
    expect(aggregateByChain([])).toEqual([]);
  });
});
