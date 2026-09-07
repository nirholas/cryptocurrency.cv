/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Exchanges API
 * GET /api/exchanges - ranked exchanges with live 24h volume and trust scores.
 *
 * This route used to answer with six hardcoded rows whose volumes were strings
 * frozen at whatever they were the day someone typed them ("$2.1B" for
 * Coinbase). Two things were wrong with that: the figures were invented, and a
 * string where the exchange table expects a number is what put six "$NaN"
 * cells on /exchanges. It now serves the same live CoinGecko ranking that
 * /api/market/exchanges does, converted to USD.
 *
 * Query parameters:
 * - limit: rows to return (default 50, max 250)
 * - sort:  'trust' (default) | 'volume' | 'name'
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getExchanges } from '@/lib/market-data';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';
import { createRequestLogger } from '@/lib/logger';
import { ApiError } from '@/lib/api-error';

export const revalidate = 3600;

type SortKey = 'trust' | 'volume' | 'name';

/**
 * CoinGecko reports exchange volume in BTC. Rendering that as dollars would
 * understate every exchange by five orders of magnitude, so convert with the
 * live BTC price and, when that lookup fails, omit the figure rather than
 * publish a wrong one.
 */
async function getBtcPriceUsd(): Promise<number | null> {
  const data = await fetchCoinGecko<Record<string, { usd?: number }>>(
    `${COINGECKO_BASE}/simple/price?ids=bitcoin&vs_currencies=usd`,
    { revalidate: 300 },
  );
  const price = data?.bitcoin?.usd;
  return typeof price === 'number' && Number.isFinite(price) ? price : null;
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const { searchParams } = new URL(request.url);

  const sort = (searchParams.get('sort') ?? 'trust') as SortKey;
  const limitRaw = parseInt(searchParams.get('limit') ?? '50', 10);
  const limit = Math.min(Number.isNaN(limitRaw) ? 50 : Math.max(1, limitRaw), 250);

  try {
    const [rows, btcUsd] = await Promise.all([getExchanges(limit, 1), getBtcPriceUsd()]);

    if (rows.length === 0) {
      return ApiError.serviceUnavailable('Exchange rankings are temporarily unavailable');
    }

    const exchanges = rows.map((row) => {
      const volumeBtc =
        typeof row.trade_volume_24h_btc === 'number' && Number.isFinite(row.trade_volume_24h_btc)
          ? row.trade_volume_24h_btc
          : null;

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

    if (sort === 'volume') {
      exchanges.sort((a, b) => (b.volume24hBtc ?? 0) - (a.volume24hBtc ?? 0));
    } else if (sort === 'name') {
      exchanges.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      exchanges.sort((a, b) => b.trustScore - a.trustScore);
    }

    return NextResponse.json(
      {
        exchanges,
        total: exchanges.length,
        currency: 'usd',
        btcPriceUsd: btcUsd,
        source: 'CoinGecko',
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    logger.error('Failed to fetch exchanges', error);
    return ApiError.internal('Failed to fetch exchanges', error);
  }
}
