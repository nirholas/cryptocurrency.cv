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
  getPrice,
  getPriceMultiFull,
  getOHLCV,
  getNews,
  getSocialStats,
  getTradingSignals,
  getTopExchangesByPair,
  getTopByMarketCap,
  getTopByVolume,
  getBlockchainHistory,
  getOrderBook,
  getMarketOverview,
} from '@/lib/apis/cryptocompare';

export const runtime = 'edge';
export const revalidate = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
};

/**
 * GET /api/cryptocompare
 *
 * Full CryptoCompare API proxy. Supports:
 *   ?action=overview                — market overview (top coins, news, signals)
 *   ?action=price&fsyms=BTC,ETH    — real-time multi-price
 *   ?action=priceFull&fsyms=BTC    — full price data (24h change, vol, mcap)
 *   ?action=ohlcv&fsym=BTC         — historical OHLCV (&interval=1h&limit=100)
 *   ?action=news                    — latest crypto news
 *   ?action=social&coinId=1182     — social stats (Twitter, Reddit, GitHub)
 *   ?action=signals&fsym=BTC       — trading signals (IntoTheBlock)
 *   ?action=exchanges&fsym=BTC     — top exchanges by pair volume
 *   ?action=topMarketCap           — top coins by market cap
 *   ?action=topVolume              — top coins by 24h volume
 *   ?action=blockchain&fsym=BTC    — on-chain metrics (tx count, addresses, hashrate)
 *   ?action=orderbook&fsym=BTC     — L2 order book snapshot
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    switch (action) {
      case 'overview': {
        const data = await getMarketOverview();
        return NextResponse.json(data, { headers: CORS_HEADERS });
      }

      case 'price': {
        const fsyms = searchParams.get('fsyms')?.split(',') || ['BTC', 'ETH'];
        const tsyms = searchParams.get('tsyms')?.split(',') || ['USD'];
        const data = await getPrice(fsyms, tsyms);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'priceFull': {
        const fsyms = searchParams.get('fsyms')?.split(',') || ['BTC', 'ETH'];
        const tsyms = searchParams.get('tsyms')?.split(',') || ['USD'];
        const data = await getPriceMultiFull(fsyms, tsyms);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'ohlcv': {
        const fsym = searchParams.get('fsym') || 'BTC';
        const tsym = searchParams.get('tsym') || 'USD';
        const interval = (searchParams.get('interval') as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w') || '1d';
        const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 2000);
        const exchange = searchParams.get('exchange') || undefined;
        const data = await getOHLCV(fsym, tsym, { interval, limit, exchange });
        return NextResponse.json({ fsym, tsym, interval, data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'news': {
        const categories = searchParams.get('categories')?.split(',');
        const feeds = searchParams.get('feeds')?.split(',');
        const sortOrder = (searchParams.get('sort') as 'latest' | 'popular') || 'latest';
        const data = await getNews({ categories, feeds, sortOrder });
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'social': {
        const coinId = parseInt(searchParams.get('coinId') || '1182', 10); // 1182 = BTC
        const data = await getSocialStats(coinId);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'signals': {
        const fsym = searchParams.get('fsym') || 'BTC';
        const data = await getTradingSignals(fsym);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'exchanges': {
        const fsym = searchParams.get('fsym') || 'BTC';
        const tsym = searchParams.get('tsym') || 'USD';
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
        const data = await getTopExchangesByPair(fsym, tsym, limit);
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'topMarketCap': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const data = await getTopByMarketCap('USD', limit);
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'topVolume': {
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const data = await getTopByVolume('USD', limit);
        return NextResponse.json({ data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'blockchain': {
        const fsym = searchParams.get('fsym') || 'BTC';
        const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 365);
        const data = await getBlockchainHistory(fsym, limit);
        return NextResponse.json({ fsym, data, count: data.length, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      case 'orderbook': {
        const fsym = searchParams.get('fsym') || 'BTC';
        const tsym = searchParams.get('tsym') || 'USD';
        const exchange = searchParams.get('exchange') || 'coinbase';
        const data = await getOrderBook(fsym, tsym, exchange);
        return NextResponse.json({ data, timestamp: new Date().toISOString() }, { headers: CORS_HEADERS });
      }

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}`,
          available: [
            'overview', 'price', 'priceFull', 'ohlcv', 'news', 'social',
            'signals', 'exchanges', 'topMarketCap', 'topVolume', 'blockchain', 'orderbook',
          ],
        }, { status: 400, headers: CORS_HEADERS });
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch CryptoCompare data' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}
