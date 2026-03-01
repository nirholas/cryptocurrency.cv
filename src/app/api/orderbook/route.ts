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
 * Multi-Exchange Order Book API
 * 
 * Aggregates order books from multiple exchanges for unified liquidity view.
 * 
 * @route GET /api/orderbook - Get aggregated order book
 * @route GET /api/orderbook?view=slippage - Get slippage estimates
 * @route GET /api/orderbook?view=liquidity - Get liquidity analysis
 * @route GET /api/orderbook?view=dashboard - Get full dashboard
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getAggregatedOrderBook,
  estimateSlippage,
  analyzeLiquidity,
  getOrderBookDashboard,
  fetchAllOrderBooks,
} from '@/lib/orderbook-aggregator';

export const runtime = 'edge';
export const revalidate = 0; // No caching - real-time data

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX'];
const SUPPORTED_EXCHANGES = ['binance', 'bybit', 'okx', 'kraken', 'kucoin', 'coinbase'];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const symbol = (searchParams.get('symbol') || 'BTC').toUpperCase();
    const market = (searchParams.get('market') || 'spot') as 'spot' | 'futures';
    const view = searchParams.get('view') || 'aggregated';
    const exchangesParam = searchParams.get('exchanges');
    const orderSizeParam = searchParams.get('orderSize');

    // Validate symbol
    if (!SUPPORTED_SYMBOLS.includes(symbol)) {
      return NextResponse.json(
        { 
          error: `Unsupported symbol: ${symbol}`,
          supported: SUPPORTED_SYMBOLS,
        },
        { status: 400 }
      );
    }

    // Parse exchanges filter
    const exchanges = exchangesParam 
      ? exchangesParam.split(',').filter(e => SUPPORTED_EXCHANGES.includes(e))
      : undefined;

    // Handle different views
    switch (view) {
      case 'individual': {
        // Return individual order books from each exchange
        const orderBooks = await fetchAllOrderBooks(symbol, market, exchanges);
        
        return NextResponse.json({
          symbol,
          market,
          timestamp: new Date().toISOString(),
          exchangeCount: orderBooks.length,
          orderBooks: orderBooks.map(ob => ({
            exchange: ob.exchange,
            symbol: ob.symbol,
            spread: ob.spread,
            spreadPercent: ob.spreadPercent,
            midPrice: ob.midPrice,
            bidDepthUsd: Math.round(ob.bidDepthUsd),
            askDepthUsd: Math.round(ob.askDepthUsd),
            topBids: ob.bids.slice(0, 10),
            topAsks: ob.asks.slice(0, 10),
            lastUpdate: ob.lastUpdate,
          })),
        });
      }

      case 'slippage': {
        // Estimate slippage for given order size
        const orderSize = orderSizeParam ? parseFloat(orderSizeParam) : 100000;
        const side = (searchParams.get('side') || 'buy') as 'buy' | 'sell';

        if (orderSize <= 0 || orderSize > 10000000) {
          return NextResponse.json(
            { error: 'orderSize must be between 0 and 10,000,000 USD' },
            { status: 400 }
          );
        }

        const estimate = await estimateSlippage(symbol, side, orderSize, market);
        
        return NextResponse.json({
          symbol,
          market,
          timestamp: new Date().toISOString(),
          estimate: {
            ...estimate,
            averagePrice: Math.round(estimate.averagePrice * 100) / 100,
            slippagePercent: Math.round(estimate.slippagePercent * 10000) / 10000,
            slippageUsd: Math.round(estimate.slippageUsd * 100) / 100,
          },
          recommendation: estimate.slippagePercent < 0.1 
            ? 'Low slippage - safe to execute'
            : estimate.slippagePercent < 0.5
            ? 'Moderate slippage - consider splitting order'
            : 'High slippage - use limit orders or split into smaller orders',
        });
      }

      case 'liquidity': {
        // Detailed liquidity analysis
        const analysis = await analyzeLiquidity(symbol, market);
        
        return NextResponse.json({
          symbol,
          market,
          timestamp: new Date().toISOString(),
          liquidity: {
            score: analysis.liquidityScore,
            recommendation: analysis.recommendation,
            bidAskRatio: Math.round(analysis.bidAskRatio * 100) / 100,
            depthLevels: {
              '1%': {
                bidUsd: Math.round(analysis.depth1Percent.bid),
                askUsd: Math.round(analysis.depth1Percent.ask),
              },
              '2%': {
                bidUsd: Math.round(analysis.depth2Percent.bid),
                askUsd: Math.round(analysis.depth2Percent.ask),
              },
              '5%': {
                bidUsd: Math.round(analysis.depth5Percent.bid),
                askUsd: Math.round(analysis.depth5Percent.ask),
              },
              '10%': {
                bidUsd: Math.round(analysis.depth10Percent.bid),
                askUsd: Math.round(analysis.depth10Percent.ask),
              },
            },
          },
        });
      }

      case 'dashboard': {
        // Full dashboard with all data
        const dashboard = await getOrderBookDashboard(symbol, market);
        
        return NextResponse.json({
          success: true,
          data: {
          symbol,
          market,
          timestamp: new Date().toISOString(),
          summary: {
            exchanges: dashboard.aggregatedBook.exchanges,
            midPrice: dashboard.aggregatedBook.midPrice,
            spread: dashboard.aggregatedBook.spread,
            spreadPercent: Math.round(dashboard.aggregatedBook.spreadPercent * 10000) / 10000,
            totalBidDepthUsd: Math.round(dashboard.aggregatedBook.totalBidDepthUsd),
            totalAskDepthUsd: Math.round(dashboard.aggregatedBook.totalAskDepthUsd),
            imbalance: Math.round(dashboard.aggregatedBook.imbalance * 100) / 100,
          },
          bestPrices: {
            bid: dashboard.aggregatedBook.bestBid,
            ask: dashboard.aggregatedBook.bestAsk,
          },
          liquidity: {
            score: dashboard.liquidityAnalysis.liquidityScore,
            recommendation: dashboard.liquidityAnalysis.recommendation,
          },
          slippage: {
            buy: dashboard.slippageEstimates.buy.map(s => ({
              orderSizeUsd: s.orderSizeUsd,
              slippagePercent: Math.round(s.slippagePercent * 10000) / 10000,
              slippageUsd: Math.round(s.slippageUsd * 100) / 100,
            })),
            sell: dashboard.slippageEstimates.sell.map(s => ({
              orderSizeUsd: s.orderSizeUsd,
              slippagePercent: Math.round(s.slippagePercent * 10000) / 10000,
              slippageUsd: Math.round(s.slippageUsd * 100) / 100,
            })),
          },
          arbitrage: dashboard.arbitrageOpportunity,
          exchangeBreakdown: dashboard.aggregatedBook.exchangeBreakdown.map(ex => ({
            exchange: ex.exchange,
            bidDepthUsd: Math.round(ex.bidDepthUsd),
            askDepthUsd: Math.round(ex.askDepthUsd),
            bidShare: Math.round(ex.bidPercent * 100) / 100,
            askShare: Math.round(ex.askPercent * 100) / 100,
            spread: Math.round(ex.spread * 100) / 100,
          })),
          },
        });
      }

      case 'aggregated':
      default: {
        // Default: aggregated order book
        const aggregated = await getAggregatedOrderBook(symbol, market, exchanges);
        
        // Limit depth in response
        const depthLimit = Math.min(
          parseInt(searchParams.get('depth') || '20'),
          100
        );

        return NextResponse.json({
          symbol,
          market,
          timestamp: new Date().toISOString(),
          exchanges: aggregated.exchanges,
          bestBid: aggregated.bestBid,
          bestAsk: aggregated.bestAsk,
          spread: aggregated.spread,
          spreadPercent: Math.round(aggregated.spreadPercent * 10000) / 10000,
          midPrice: aggregated.midPrice,
          imbalance: Math.round(aggregated.imbalance * 100) / 100,
          totalBidDepthUsd: Math.round(aggregated.totalBidDepthUsd),
          totalAskDepthUsd: Math.round(aggregated.totalAskDepthUsd),
          bids: aggregated.bids.slice(0, depthLimit).map(l => ({
            price: l.price,
            quantity: l.quantity,
            valueUsd: Math.round(l.valueUsd),
            sources: l.exchanges.length,
          })),
          asks: aggregated.asks.slice(0, depthLimit).map(l => ({
            price: l.price,
            quantity: l.quantity,
            valueUsd: Math.round(l.valueUsd),
            sources: l.exchanges.length,
          })),
          exchangeBreakdown: aggregated.exchangeBreakdown,
        });
      }
    }
  } catch (error) {
    console.error('Order book API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order book data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
