/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { COINGECKO_BASE } from '@/lib/constants';
import { ApiError } from '@/lib/api-error';

import { fetchCoinGecko } from '@/lib/coingecko';

/** The /coins/markets row shape this route reads. */
interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  circulating_supply: number;
  total_supply: number;
  ath: number;
  ath_change_percentage: number;
}
export const runtime = 'edge';
export const revalidate = 60;

const COIN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * GET /api/compare
 *
 * Compare multiple cryptocurrencies side-by-side
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinsParam = searchParams.get('coins');

  if (!coinsParam) {
    return ApiError.badRequest('Missing coins parameter. Use ?coins=bitcoin,ethereum,solana');
  }

  const coins = coinsParam
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter((c) => COIN_ID_PATTERN.test(c))
    .slice(0, 10);

  if (coins.length === 0) {
    return ApiError.badRequest('No valid coin IDs provided');
  }

  try {
    // fetchCoinGecko rather than a bare fetch: it carries the shared in-process
    // cache (so a throttle is served from the last good copy instead of 500ing
    // the comparison) and the API-key header when one is configured.
    const data = await fetchCoinGecko<CoinGeckoMarket[]>(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coins.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`,
      { revalidate: 60 },
    );

    if (!Array.isArray(data)) {
      // `fetchCoinGecko` returns null when the upstream is throttling and the
      // shared cache has no copy to fall back on. That is an upstream
      // availability problem, not a fault in this handler, so it gets a 503 the
      // client can retry rather than a 500 that reads as a permanent failure.
      console.warn('Compare API: CoinGecko unavailable and no cached copy to serve');
      return NextResponse.json(
        { error: 'Market data provider is temporarily unavailable', coins: [] },
        { status: 503, headers: { 'Retry-After': '30' } },
      );
    }

    const comparison = data.map((coin: CoinGeckoMarket) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      price: {
        current: coin.current_price,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        ath: coin.ath,
        athChange: coin.ath_change_percentage?.toFixed(1),
      },
      changes: {
        '1h': coin.price_change_percentage_1h_in_currency?.toFixed(2),
        '24h': coin.price_change_percentage_24h_in_currency?.toFixed(2),
        '7d': coin.price_change_percentage_7d_in_currency?.toFixed(2),
      },
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      volume24h: coin.total_volume,
      supply: {
        circulating: coin.circulating_supply,
        total: coin.total_supply,
      },
    }));

    // Calculate summary metrics
    const avgChange24h =
      comparison.reduce(
        (sum: number, c: { changes: { '24h': string } }) =>
          sum + (parseFloat(c.changes['24h']) || 0),
        0,
      ) / comparison.length;

    const totalMarketCap = comparison.reduce(
      (sum: number, c: { marketCap: number }) => sum + c.marketCap,
      0,
    );

    const totalVolume = comparison.reduce(
      (sum: number, c: { volume24h: number }) => sum + c.volume24h,
      0,
    );

    return NextResponse.json({
      coins: comparison,
      summary: {
        count: comparison.length,
        // A number, not a `.toFixed()` string. Every other field in this
        // summary is numeric, the documented type is `number`, and the client
        // formats it with `.toFixed(2)` — which threw
        // "avgChange24h.toFixed is not a function" and took down the whole
        // comparison summary the moment this endpoint started answering 200.
        avgChange24h: Number(avgChange24h.toFixed(2)),
        totalMarketCap,
        totalVolume24h: totalVolume,
        // Annotations dropped: `comparison` is now properly typed (the upstream
        // rows used to arrive as `any`), so inference gives the real element type
        // and a narrower hand-written one no longer type-checks.
        leader24h: comparison.reduce((best, c) =>
          (parseFloat(c.changes['24h']) || 0) > (parseFloat(best.changes['24h']) || 0) ? c : best,
        ).symbol,
        laggard24h: comparison.reduce((worst, c) =>
          (parseFloat(c.changes['24h']) || 0) < (parseFloat(worst.changes['24h']) || 0) ? c : worst,
        ).symbol,
      },
      timestamp: new Date().toISOString(),
      source: 'coingecko',
    });
  } catch (error) {
    console.error('Compare API error:', error);
    return ApiError.internal('Failed to compare coins');
  }
}
