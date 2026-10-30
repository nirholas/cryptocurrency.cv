/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * Exchange ranking rows served by /api/exchanges.
 *
 * CoinGecko is the primary source (it carries trust scores). When it is rate
 * limited and nothing is cached, CoinPaprika's free /exchanges list fills in:
 * it has real 24h volume and a volume rank but no trust score, so those rows
 * carry `trustScore: null` rather than an invented number.
 */

import type { Exchange } from '@/lib/market-data';
import type { CoinPaprikaExchange } from '@/lib/coinpaprika';

export type ExchangeSortKey = 'trust' | 'volume' | 'name';

export interface ExchangeRanking {
  id: string;
  name: string;
  url: string | null;
  image: string | null;
  country?: string;
  yearEstablished: number | null;
  /** CoinGecko trust score (0-10); null when the source has none */
  trustScore: number | null;
  trustScoreRank: number | null;
  volume24hBtc: number | null;
  /** 24h volume in USD */
  volume24h: number | null;
  hasTradingIncentive: boolean;
  type?: 'CEX' | 'DEX';
}

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function rankingsFromCoinGecko(rows: Exchange[], btcUsd: number | null): ExchangeRanking[] {
  return rows.map((row) => {
    const volumeBtc = finite(row.trade_volume_24h_btc);
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      image: row.image,
      country: row.country ?? undefined,
      yearEstablished: row.year_established ?? null,
      trustScore: row.trust_score ?? 0,
      trustScoreRank: row.trust_score_rank ?? null,
      volume24hBtc: volumeBtc,
      volume24h: volumeBtc !== null && btcUsd !== null ? volumeBtc * btcUsd : null,
      hasTradingIncentive: row.has_trading_incentive ?? false,
    };
  });
}

/** Active exchanges with fetched market data, best adjusted rank first */
export function rankingsFromCoinPaprika(
  rows: CoinPaprikaExchange[],
  limit: number,
  btcUsd: number | null,
): ExchangeRanking[] {
  return rows
    .filter(
      (row) =>
        row.active &&
        row.markets_data_fetched &&
        row.adjusted_rank > 0 &&
        (finite(row.quotes?.USD?.adjusted_volume_24h) ?? 0) > 0,
    )
    .sort((a, b) => a.adjusted_rank - b.adjusted_rank)
    .slice(0, limit)
    .map((row) => {
      const volumeUsd = finite(row.quotes.USD.adjusted_volume_24h);
      const types = row.type ?? [];
      return {
        id: row.id,
        name: row.name,
        url: row.links?.website?.[0] ?? null,
        image: null,
        yearEstablished: null,
        trustScore: null,
        trustScoreRank: null,
        volume24hBtc: volumeUsd !== null && btcUsd ? volumeUsd / btcUsd : null,
        volume24h: volumeUsd,
        hasTradingIncentive: false,
        type: types.includes('dex') ? 'DEX' : types.includes('cex') ? 'CEX' : undefined,
      };
    });
}

/** Sorts in place; rows without a trust score rank last, by volume */
export function sortRankings(rows: ExchangeRanking[], sort: ExchangeSortKey): ExchangeRanking[] {
  if (sort === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name));
  const volume = (r: ExchangeRanking) => r.volume24h ?? r.volume24hBtc ?? 0;
  if (sort === 'volume') return rows.sort((a, b) => volume(b) - volume(a));
  return rows.sort(
    (a, b) => (b.trustScore ?? -1) - (a.trustScore ?? -1) || volume(b) - volume(a),
  );
}
