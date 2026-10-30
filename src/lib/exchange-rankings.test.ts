import { describe, expect, it } from 'vitest';
import type { Exchange } from '@/lib/market-data';
import type { CoinPaprikaExchange } from '@/lib/coinpaprika';
import {
  rankingsFromCoinGecko,
  rankingsFromCoinPaprika,
  sortRankings,
} from '@/lib/exchange-rankings';

function paprika(overrides: Partial<CoinPaprikaExchange> & { volume?: number }): CoinPaprikaExchange {
  const { volume = 1_000_000, ...rest } = overrides;
  return {
    id: 'ex',
    name: 'Ex',
    type: ['cex'],
    description: '',
    active: true,
    website_status: true,
    api_status: true,
    message: null,
    links: { website: ['https://ex.example/'], twitter: [] },
    markets_data_fetched: true,
    adjusted_rank: 1,
    reported_rank: 1,
    currencies: 10,
    markets: 20,
    fiats: [],
    quotes: {
      USD: {
        reported_volume_24h: volume,
        adjusted_volume_24h: volume,
        reported_volume_7d: 0,
        adjusted_volume_7d: 0,
        reported_volume_30d: 0,
        adjusted_volume_30d: 0,
      },
    },
    last_updated: '2026-10-30T22:16:33Z',
    ...rest,
  };
}

describe('rankingsFromCoinPaprika', () => {
  it('keeps active exchanges with volume, ordered by adjusted rank and limited', () => {
    const rows = [
      paprika({ id: 'c', name: 'C', adjusted_rank: 3 }),
      paprika({ id: 'a', name: 'A', adjusted_rank: 1 }),
      paprika({ id: 'off', name: 'Off', adjusted_rank: 2, active: false }),
      paprika({ id: 'nodata', name: 'NoData', adjusted_rank: 2, markets_data_fetched: false }),
      paprika({ id: 'zero', name: 'Zero', adjusted_rank: 2, volume: 0 }),
      paprika({ id: 'b', name: 'B', adjusted_rank: 2 }),
    ];

    expect(rankingsFromCoinPaprika(rows, 2, null).map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('reports real USD volume and no trust score', () => {
    const [row] = rankingsFromCoinPaprika(
      [paprika({ id: 'uni', type: ['dex'], volume: 50_000_000 })],
      10,
      100_000,
    );

    expect(row).toMatchObject({
      id: 'uni',
      url: 'https://ex.example/',
      trustScore: null,
      trustScoreRank: null,
      volume24h: 50_000_000,
      volume24hBtc: 500,
      type: 'DEX',
    });
  });
});

describe('rankingsFromCoinGecko', () => {
  it('converts BTC volume to USD only when the BTC price is known', () => {
    const exchange = {
      id: 'binance',
      name: 'Binance',
      year_established: 2017,
      country: 'Cayman Islands',
      description: '',
      url: 'https://www.binance.com/',
      image: 'https://img/binance.png',
      has_trading_incentive: false,
      trust_score: 10,
      trust_score_rank: 1,
      trade_volume_24h_btc: 2,
      trade_volume_24h_btc_normalized: 2,
    } as Exchange;

    expect(rankingsFromCoinGecko([exchange], 100_000)[0]).toMatchObject({
      trustScore: 10,
      volume24hBtc: 2,
      volume24h: 200_000,
    });
    expect(rankingsFromCoinGecko([exchange], null)[0].volume24h).toBeNull();
  });
});

describe('sortRankings', () => {
  it('ranks rows without a trust score after scored ones, by volume', () => {
    const base = {
      url: null,
      image: null,
      yearEstablished: null,
      trustScoreRank: null,
      volume24hBtc: null,
      hasTradingIncentive: false,
    };
    const rows = [
      { ...base, id: 'none-small', name: 'Z', trustScore: null, volume24h: 1 },
      { ...base, id: 'low', name: 'Y', trustScore: 5, volume24h: 1 },
      { ...base, id: 'none-big', name: 'X', trustScore: null, volume24h: 9 },
      { ...base, id: 'high', name: 'W', trustScore: 9, volume24h: 1 },
    ];

    expect(sortRankings([...rows], 'trust').map((r) => r.id)).toEqual([
      'high',
      'low',
      'none-big',
      'none-small',
    ]);
    expect(sortRankings([...rows], 'volume')[0].id).toBe('none-big');
    expect(sortRankings([...rows], 'name')[0].id).toBe('high');
  });
});
