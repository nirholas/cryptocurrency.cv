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
import { getExchanges as getPaprikaExchanges } from '@/lib/coinpaprika';
import {
  type ExchangeSortKey,
  rankingsFromCoinGecko,
  rankingsFromCoinPaprika,
  sortRankings,
} from '@/lib/exchange-rankings';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';
import { createRequestLogger } from '@/lib/logger';
import { ApiError } from '@/lib/api-error';

export const revalidate = 3600;

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

  const sort = (searchParams.get('sort') ?? 'trust') as ExchangeSortKey;
  const limitRaw = parseInt(searchParams.get('limit') ?? '50', 10);
  const limit = Math.min(Number.isNaN(limitRaw) ? 50 : Math.max(1, limitRaw), 250);

  try {
    const [rows, btcUsd] = await Promise.all([getExchanges(limit, 1), getBtcPriceUsd()]);

    let source = 'CoinGecko';
    let exchanges = rankingsFromCoinGecko(rows, btcUsd);

    // CoinGecko rate limits shared IPs; a cold instance has nothing cached to serve
    if (exchanges.length === 0) {
      try {
        exchanges = rankingsFromCoinPaprika(await getPaprikaExchanges(), limit, btcUsd);
        source = 'CoinPaprika';
      } catch (error) {
        logger.warn('CoinPaprika exchange fallback failed', { error: String(error) });
      }
    }

    if (exchanges.length === 0) {
      return ApiError.serviceUnavailable('Exchange rankings are temporarily unavailable');
    }

    sortRankings(exchanges, sort);

    return NextResponse.json(
      {
        exchanges,
        total: exchanges.length,
        currency: 'usd',
        btcPriceUsd: btcUsd,
        source,
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
