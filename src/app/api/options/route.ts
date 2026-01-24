/**
 * Options Flow API
 * 
 * Real-time crypto options data from Deribit, OKX, and Bybit.
 * All data from free public APIs - no authentication required.
 * 
 * @route GET /api/options
 * @route GET /api/options/flow
 * @route GET /api/options/surface
 * @route GET /api/options/maxpain
 * @route GET /api/options/gamma
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOptionsFlow,
  getVolatilitySurface,
  getMaxPain,
  getGammaExposure,
  getOptionsDashboard,
} from '@/lib/options-flow';

export const runtime = 'edge';
export const revalidate = 10;

/**
 * GET /api/options
 * 
 * Returns full options dashboard or specific data based on query params
 * 
 * Query params:
 * - underlying: BTC, ETH (default: BTC)
 * - view: flow, surface, maxpain, gamma, dashboard (default: dashboard)
 * - expiry: Specific expiry date for max pain (format: YYYY-MM-DD)
 * - limit: Number of trades for flow (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const underlying = searchParams.get('underlying')?.toUpperCase() || 'BTC';
    const view = searchParams.get('view') || 'dashboard';
    const expiry = searchParams.get('expiry') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    let data: unknown;
    let meta: Record<string, unknown> = {
      underlying,
      view,
    };

    switch (view) {
      case 'flow':
        data = await getOptionsFlow(underlying, limit);
        meta.tradesReturned = (data as { trades: unknown[] }).trades.length;
        break;
        
      case 'surface':
        data = await getVolatilitySurface(underlying);
        meta.expiries = (data as { expiries: string[] }).expiries.length;
        meta.strikes = (data as { strikes: number[] }).strikes.length;
        break;
        
      case 'maxpain':
        data = await getMaxPain(underlying, expiry);
        meta.expiry = (data as { expiry: string }).expiry;
        break;
        
      case 'gamma':
        data = await getGammaExposure(underlying);
        break;
        
      case 'dashboard':
      default:
        data = await getOptionsDashboard(underlying);
        meta.alertCount = (data as { alerts: unknown[] }).alerts.length;
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        ...meta,
        source: 'Deribit Public API',
        disclaimer: 'Options data for informational purposes only. Not financial advice.',
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Options API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch options data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}
