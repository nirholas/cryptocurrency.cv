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
import {
  getMarketSummary,
  getLatestListings,
  getGlobalMetrics,
  getCryptocurrency,
  getCryptoInfo,
  getOHLCVLatest,
  getMarketPairs,
  getCategories,
  getCategoryTokens,
  getTrendingNative,
  getMostVisited,
  getGainersLosersNative,
  getIdMap,
  getFiatMap,
  getTopExchanges,
  searchCryptocurrencies,
} from '@/lib/apis/coinmarketcap';

export const runtime = 'edge';
export const revalidate = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

/**
 * GET /api/coinmarketcap
 *
 * Full CoinMarketCap API proxy. Supports:
 *   ?action=summary          — comprehensive market summary
 *   ?action=listings         — latest listings (with sort, limit, tag params)
 *   ?action=global           — global market metrics
 *   ?action=quote&symbol=BTC — single coin quote
 *   ?action=info&symbol=BTC  — coin metadata (logo, description, links)
 *   ?action=ohlcv&symbol=BTC — latest OHLCV
 *   ?action=pairs&symbol=BTC — market pairs/exchanges for a coin
 *   ?action=categories       — all CMC categories (DeFi, L1, Meme, etc.)
 *   ?action=category&id=xxx  — tokens in a specific category
 *   ?action=trending         — CMC trending coins
 *   ?action=mostVisited      — most-visited on CMC
 *   ?action=gainersLosers    — native gainers & losers
 *   ?action=exchanges        — top exchanges by volume
 *   ?action=search&q=bitcoin — search cryptocurrencies
 *   ?action=map              — ID/slug/symbol mapping
 *   ?action=fiat             — fiat currency map
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        const data = await getMarketSummary();
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'listings': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
        const sort = (searchParams.get('sort') as 'market_cap' | 'volume_24h' | 'percent_change_24h') || 'market_cap';
        const tag = searchParams.get('tag') || undefined;
        const data = await getLatestListings({ limit, sort, tag });
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'global': {
        const data = await getGlobalMetrics();
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'quote': {
        const symbol = searchParams.get('symbol') || searchParams.get('id');
        if (!symbol) return NextResponse.json({ error: 'Missing symbol or id' }, { status: 400 });
        const data = await getCryptocurrency(symbol);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'info': {
        const symbols = searchParams.get('symbol')?.split(',');
        const ids = searchParams.get('id')?.split(',').map(Number);
        if (!symbols && !ids) return NextResponse.json({ error: 'Missing symbol or id' }, { status: 400 });
        const data = await getCryptoInfo(ids, symbols);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'ohlcv': {
        const symbols = searchParams.get('symbol')?.split(',');
        const ids = searchParams.get('id')?.split(',').map(Number);
        if (!symbols && !ids) return NextResponse.json({ error: 'Missing symbol or id' }, { status: 400 });
        const data = await getOHLCVLatest(ids, symbols);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'pairs': {
        const symbol = searchParams.get('symbol') || searchParams.get('id');
        if (!symbol) return NextResponse.json({ error: 'Missing symbol or id' }, { status: 400 });
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const category = (searchParams.get('category') as 'spot' | 'derivatives' | 'all') || 'spot';
        const data = await getMarketPairs(symbol, { limit, category });
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'categories': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
        const data = await getCategories({ limit });
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'category': {
        const categoryId = searchParams.get('id');
        if (!categoryId) return NextResponse.json({ error: 'Missing category id' }, { status: 400 });
        const data = await getCategoryTokens(categoryId);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'trending': {
        const data = await getTrendingNative();
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'mostVisited': {
        const data = await getMostVisited();
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'gainersLosers': {
        const timePeriod = (searchParams.get('period') as '1h' | '24h' | '7d' | '30d') || '24h';
        const data = await getGainersLosersNative({ timePeriod });
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'exchanges': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
        const data = await getTopExchanges(limit);
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'search': {
        const q = searchParams.get('q');
        if (!q) return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
        const data = await searchCryptocurrencies(q);
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'map': {
        const symbol = searchParams.get('symbol') || undefined;
        const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 5000);
        const data = await getIdMap({ symbol, limit });
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'fiat': {
        const data = await getFiatMap();
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}`,
          available: [
            'summary', 'listings', 'global', 'quote', 'info', 'ohlcv', 'pairs',
            'categories', 'category', 'trending', 'mostVisited', 'gainersLosers',
            'exchanges', 'search', 'map', 'fiat',
          ],
        }, { status: 400, headers: CORS_HEADERS });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch CoinMarketCap data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
