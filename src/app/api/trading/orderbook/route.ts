/**
 * Order Book Aggregator API
 * 
 * Multi-exchange order book aggregation with unified depth view.
 * Provides spread analysis, slippage estimation, and liquidity insights.
 * 
 * GET /api/trading/orderbook?symbol=BTCUSDT - Get aggregated order book
 * GET /api/trading/orderbook?symbol=BTCUSDT&view=slippage&size=100000 - Estimate slippage
 * GET /api/trading/orderbook?symbol=BTCUSDT&view=liquidity - Liquidity analysis
 * GET /api/trading/orderbook?symbol=BTCUSDT&view=dashboard - Full dashboard
 * 
 * @module api/trading/orderbook
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAggregatedOrderBook,
  estimateSlippage,
  analyzeLiquidity,
  getOrderBookDashboard,
  fetchAllOrderBooks,
  type AggregatedOrderBook,
  type SlippageEstimate,
  type LiquidityAnalysis,
} from '@/lib/orderbook-aggregator';

export const dynamic = 'force-dynamic';
export const revalidate = 5; // 5 seconds cache - order books change fast

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameter
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter is required',
        example: '/api/trading/orderbook?symbol=BTCUSDT',
      }, { status: 400 });
    }
    
    // Query parameters
    const view = searchParams.get('view') || 'aggregated';
    const depth = Math.min(parseInt(searchParams.get('depth') || '25'), 100);
    const exchangeList = searchParams.get('exchanges')?.split(',') || undefined;
    const market = (searchParams.get('market') || 'spot') as 'spot' | 'futures';
    const orderSize = parseFloat(searchParams.get('size') || '10000'); // USD
    const side = (searchParams.get('side') || 'both') as 'buy' | 'sell' | 'both';
    
    const normalizedSymbol = symbol.toUpperCase().replace('-', '');
    
    let responseData: Record<string, unknown> = {};
    
    switch (view) {
      case 'raw': {
        // Raw order books from each exchange
        const orderBooks = await fetchAllOrderBooks(normalizedSymbol, market, exchangeList);
        
        responseData = {
          symbol: normalizedSymbol,
          orderBooks: orderBooks.map(ob => ({
            exchange: ob.exchange,
            bids: ob.bids.slice(0, depth),
            asks: ob.asks.slice(0, depth),
            spread: ob.spread,
            spreadPercent: ob.spreadPercent,
            midPrice: ob.midPrice,
            bidDepthUsd: ob.bidDepthUsd,
            askDepthUsd: ob.askDepthUsd,
            lastUpdate: ob.lastUpdate,
          })),
          exchangeCount: orderBooks.length,
        };
        break;
      }
      
      case 'slippage': {
        // Slippage estimation for a given order size
        if (side === 'both') {
          const [buySlippage, sellSlippage] = await Promise.all([
            estimateSlippage(normalizedSymbol, 'buy', orderSize, market),
            estimateSlippage(normalizedSymbol, 'sell', orderSize, market),
          ]);
          
          responseData = {
            symbol: normalizedSymbol,
            orderSizeUsd: orderSize,
            buy: buySlippage,
            sell: sellSlippage,
            comparison: {
              betterSide: buySlippage.slippagePercent < sellSlippage.slippagePercent ? 'buy' : 'sell',
              slippageDiff: Math.abs(buySlippage.slippagePercent - sellSlippage.slippagePercent),
            },
          };
        } else {
          const slippage = await estimateSlippage(normalizedSymbol, side, orderSize, market);
          responseData = {
            symbol: normalizedSymbol,
            orderSizeUsd: orderSize,
            side,
            slippage,
          };
        }
        break;
      }
      
      case 'liquidity': {
        // Comprehensive liquidity analysis
        const liquidity = await analyzeLiquidity(normalizedSymbol, market);
        
        responseData = {
          symbol: normalizedSymbol,
          liquidity,
          interpretation: {
            overall: liquidity.liquidityScore >= 80 ? 'excellent' : 
                     liquidity.liquidityScore >= 60 ? 'good' :
                     liquidity.liquidityScore >= 40 ? 'moderate' : 'poor',
            recommendation: liquidity.bidAskRatio > 1.3 ? 'heavy_buying_pressure' :
                           liquidity.bidAskRatio < 0.7 ? 'heavy_selling_pressure' : 'balanced',
          },
        };
        break;
      }
      
      case 'dashboard': {
        // Full trading dashboard
        const dashboard = await getOrderBookDashboard(normalizedSymbol, market);
        
        responseData = {
          symbol: normalizedSymbol,
          ...dashboard,
        };
        break;
      }
      
      case 'aggregated':
      default: {
        // Aggregated order book
        const aggregated = await getAggregatedOrderBook(normalizedSymbol, market);
        
        responseData = {
          symbol: normalizedSymbol,
          exchanges: aggregated.exchanges,
          bestBid: aggregated.bestBid,
          bestAsk: aggregated.bestAsk,
          spread: aggregated.spread,
          spreadPercent: aggregated.spreadPercent,
          midPrice: aggregated.midPrice,
          imbalance: aggregated.imbalance,
          bids: aggregated.bids.slice(0, depth),
          asks: aggregated.asks.slice(0, depth),
          totalBidDepthUsd: aggregated.totalBidDepthUsd,
          totalAskDepthUsd: aggregated.totalAskDepthUsd,
          exchangeBreakdown: aggregated.exchangeBreakdown,
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
        symbol: normalizedSymbol,
        depth,
        exchanges: exchangeList || ['binance', 'bybit', 'okx', 'kraken', 'coinbase', 'kucoin'],
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
        'X-Processing-Time': `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error('[Order Book API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order book data',
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
      'X-Supported-Views': 'aggregated,raw,slippage,liquidity,dashboard',
      'X-Supported-Exchanges': 'binance,bybit,okx,kraken,coinbase,kucoin',
      'X-Max-Depth': '100',
      'X-Rate-Limit': '120/min',
      'X-Cache-TTL': '5s',
    },
  });
}
