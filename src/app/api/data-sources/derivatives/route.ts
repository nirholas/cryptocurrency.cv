/**
 * Derivatives Dashboard API — funding rates, OI, liquidations, options
 * GET /api/data-sources/derivatives?symbol=BTC — full derivatives dashboard
 * GET /api/data-sources/derivatives?view=funding&symbol=BTC — cross-exchange funding
 * GET /api/data-sources/derivatives?view=options&currency=BTC — Deribit options
 * GET /api/data-sources/derivatives?view=hyperliquid — Hyperliquid DEX perps
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getDerivativesDashboard,
  getCrossExchangeFunding,
  getOptionsChain,
  getHyperliquidMarkets,
  getDeribitIndex,
  getVolatilityIndex,
  getLiquidations,
} from '@/lib/data-sources/derivatives';

export const runtime = 'edge';
export const revalidate = 15;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get('view') || 'dashboard';
  const symbol = searchParams.get('symbol') || 'BTC';

  try {
    switch (view) {
      case 'funding': {
        const funding = await getCrossExchangeFunding(symbol);
        return NextResponse.json({ status: 'ok', data: funding, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }

      case 'options': {
        const currency = (searchParams.get('currency') || 'BTC') as 'BTC' | 'ETH';
        const [options, index, vol] = await Promise.allSettled([
          getOptionsChain(currency),
          getDeribitIndex(currency),
          getVolatilityIndex(currency),
        ]);

        return NextResponse.json({
          status: 'ok',
          data: {
            options: options.status === 'fulfilled' ? options.value : [],
            index: index.status === 'fulfilled' ? index.value : null,
            volatility: vol.status === 'fulfilled' ? vol.value : null,
          },
          timestamp: new Date().toISOString(),
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        });
      }

      case 'hyperliquid': {
        const markets = await getHyperliquidMarkets();
        return NextResponse.json({ status: 'ok', data: markets, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' },
        });
      }

      case 'liquidations': {
        const liqs = await getLiquidations(symbol);
        return NextResponse.json({ status: 'ok', data: liqs, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }

      case 'dashboard':
      default: {
        const dashboard = await getDerivativesDashboard(symbol);
        return NextResponse.json({ status: 'ok', data: dashboard, timestamp: new Date().toISOString() }, {
          headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch derivatives data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
