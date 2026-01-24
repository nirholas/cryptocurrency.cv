/**
 * Arbitrage Scanner API
 * 
 * Real-time cross-exchange arbitrage opportunity detection.
 * Supports spot and triangular arbitrage across major exchanges.
 * 
 * GET /api/trading/arbitrage - Get current arbitrage opportunities
 * GET /api/trading/arbitrage?type=triangular - Get triangular arbitrage
 * GET /api/trading/arbitrage?minSpread=0.5 - Filter by minimum spread %
 * 
 * @module api/trading/arbitrage
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  scanArbitrageOpportunities,
  getMonitorState,
  type ArbitrageScanResult,
  type ArbitrageOpportunity,
} from '@/lib/arbitrage-scanner';

export const dynamic = 'force-dynamic';
export const revalidate = 10; // 10 seconds cache

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const type = searchParams.get('type') || 'all'; // all, spot, triangular
    const symbol = searchParams.get('symbol'); // Filter by trading pair
    const minSpread = parseFloat(searchParams.get('minSpread') || '0');
    const minProfit = parseFloat(searchParams.get('minProfit') || '0');
    const exchange = searchParams.get('exchange'); // Filter by exchange
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const sortBy = searchParams.get('sortBy') || 'score'; // score, spread, profit
    const view = searchParams.get('view') || 'opportunities'; // opportunities, monitor, summary
    
    // Get monitor state
    if (view === 'monitor') {
      const monitorState = getMonitorState();
      return NextResponse.json({
        success: true,
        data: monitorState,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }
    
    // Scan for opportunities
    const result = await scanArbitrageOpportunities();
    
    // Filter opportunities
    let opportunities = result.opportunities;
    let triangular = result.triangular;
    
    // Apply filters
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      opportunities = opportunities.filter(o => o.symbol.includes(upperSymbol));
      triangular = triangular.filter(t => t.path.some(p => p.includes(upperSymbol)));
    }
    
    if (exchange) {
      const lowerExchange = exchange.toLowerCase();
      opportunities = opportunities.filter(o => 
        o.buyExchange === lowerExchange || o.sellExchange === lowerExchange
      );
      triangular = triangular.filter(t => t.exchanges.includes(lowerExchange));
    }
    
    if (minSpread > 0) {
      opportunities = opportunities.filter(o => o.spreadPercent >= minSpread);
    }
    
    if (minProfit > 0) {
      opportunities = opportunities.filter(o => o.netProfit >= minProfit);
    }
    
    // Sort
    const sortFn = (a: ArbitrageOpportunity, b: ArbitrageOpportunity) => {
      switch (sortBy) {
        case 'spread':
          return b.spreadPercent - a.spreadPercent;
        case 'profit':
          return b.netProfit - a.netProfit;
        case 'score':
        default:
          return b.overallScore - a.overallScore;
      }
    };
    
    opportunities = opportunities.sort(sortFn).slice(0, limit);
    triangular = triangular.sort((a, b) => b.profitPercent - a.profitPercent).slice(0, limit);
    
    // Prepare response based on type
    let responseData: Record<string, unknown>;
    
    switch (type) {
      case 'spot':
        responseData = {
          opportunities: opportunities.filter(o => o.direction === 'spot'),
          summary: result.summary,
        };
        break;
      
      case 'triangular':
        responseData = {
          triangular,
          summary: {
            count: triangular.length,
            avgProfit: triangular.length > 0
              ? triangular.reduce((sum, t) => sum + t.profitPercent, 0) / triangular.length
              : 0,
            bestPath: triangular[0] || null,
          },
        };
        break;
      
      case 'all':
      default:
        responseData = {
          opportunities,
          triangular,
          summary: result.summary,
          priceData: view === 'full' ? result.priceData : undefined,
        };
    }
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: responseData,
      meta: {
        type,
        filters: {
          symbol,
          exchange,
          minSpread,
          minProfit,
        },
        sortBy,
        limit,
        returned: opportunities.length + triangular.length,
        processingTime: `${processingTime}ms`,
        lastUpdated: result.lastUpdated,
        exchanges: ['binance', 'bybit', 'okx', 'kraken', 'coinbase', 'kucoin'],
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error('[Arbitrage API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scan arbitrage opportunities',
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
      'X-Supported-Types': 'all,spot,triangular',
      'X-Supported-Exchanges': 'binance,bybit,okx,kraken,coinbase,kucoin',
      'X-Rate-Limit': '60/min',
      'X-Cache-TTL': '10s',
    },
  });
}
