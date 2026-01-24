/**
 * Options Flow API
 * 
 * Real-time crypto options data from Deribit, OKX, and Bybit.
 * Tracks unusual activity, large trades, volatility surfaces, and more.
 * 
 * GET /api/trading/options - Get options dashboard
 * GET /api/trading/options?view=flow - Get options flow (trades)
 * GET /api/trading/options?view=surface - Get volatility surface
 * GET /api/trading/options?view=maxpain - Get max pain analysis
 * GET /api/trading/options?view=gamma - Get gamma exposure
 * 
 * @module api/trading/options
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOptionsDashboard,
  getOptionsFlow,
  getVolatilitySurface,
  getMaxPain,
  getGammaExposure,
} from '@/lib/options-flow';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // 30 seconds cache

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const view = searchParams.get('view') || 'dashboard';
    const underlying = searchParams.get('underlying') || 'BTC';
    const expiry = searchParams.get('expiry'); // Optional specific expiry
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const onlyUnusual = searchParams.get('unusual') === 'true';
    const onlyBlocks = searchParams.get('blocks') === 'true';
    const minPremium = parseFloat(searchParams.get('minPremium') || '0');
    
    let responseData: Record<string, unknown> = {};
    
    switch (view) {
      case 'flow': {
        const flow = await getOptionsFlow(underlying.toUpperCase(), limit);
        
        // Apply filters
        let trades = flow.trades;
        
        if (onlyUnusual) {
          trades = trades.filter(t => t.isUnusual);
        }
        
        if (onlyBlocks) {
          trades = trades.filter(t => t.isBlock);
        }
        
        if (minPremium > 0) {
          trades = trades.filter(t => t.premium >= minPremium);
        }
        
        // Filter by expiry if specified
        if (expiry) {
          trades = trades.filter(t => t.contract.expiry === expiry);
        }
        
        responseData = {
          trades: trades.slice(0, limit),
          summary: flow.summary,
          byExpiry: flow.byExpiry,
          byStrike: flow.byStrike,
          topTrades: flow.topTrades,
        };
        break;
      }
      
      case 'surface': {
        const surface = await getVolatilitySurface(underlying.toUpperCase());
        
        responseData = {
          surface: {
            underlying: surface.underlying,
            spotPrice: surface.spotPrice,
            atmIV: surface.atmIV,
            skew: surface.skew,
            termStructure: surface.termStructure,
            strikes: surface.strikes,
            expiries: surface.expiries,
            ivMatrix: surface.ivMatrix,
          },
        };
        break;
      }
      
      case 'maxpain': {
        const maxPain = await getMaxPain(underlying.toUpperCase(), expiry || undefined);
        
        responseData = {
          maxPain,
          interpretation: {
            currentDistance: maxPain.distancePercent,
            direction: maxPain.distancePercent > 0 ? 'above_maxpain' : 'below_maxpain',
            significance: Math.abs(maxPain.distancePercent) < 5 ? 'high' : 'medium',
          },
        };
        break;
      }
      
      case 'gamma': {
        const gamma = await getGammaExposure(underlying.toUpperCase());
        
        responseData = {
          gamma,
          interpretation: {
            netPosition: gamma.netGamma > 0 ? 'long_gamma' : 'short_gamma',
            hedgingPressure: gamma.netGamma > 0 ? 'stabilizing' : 'amplifying',
            marketMakerPosition: gamma.marketMakerPositioning,
          },
        };
        break;
      }
      
      case 'dashboard':
      default: {
        const dashboard = await getOptionsDashboard(underlying.toUpperCase());
        
        responseData = {
          flow: dashboard.flow,
          surface: dashboard.surface,
          maxPain: dashboard.maxPain,
          gamma: dashboard.gamma,
          alerts: dashboard.alerts,
          lastUpdated: dashboard.lastUpdated,
        };
        break;
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        view,
        underlying: underlying.toUpperCase(),
        expiry,
        filters: {
          onlyUnusual,
          onlyBlocks,
          minPremium,
          limit,
        },
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
        exchanges: ['deribit', 'okx', 'bybit'],
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error('[Options API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch options data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * HEAD - API capability discovery
 */
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-API-Version': '1.0',
      'X-Supported-Views': 'dashboard,flow,surface,maxpain,gamma',
      'X-Supported-Underlyings': 'BTC,ETH,SOL',
      'X-Supported-Exchanges': 'deribit,okx,bybit',
      'X-Rate-Limit': '30/min',
      'X-Cache-TTL': '30s',
    },
  });
}
