/**
 * Order Book WebSocket Handler
 * 
 * Real-time order book updates via WebSocket
 * 
 * Usage:
 * ws://host/api/orderbook/stream?symbol=BTCUSDT&exchanges=binance,coinbase
 * 
 * Messages:
 * - subscribe: { type: 'subscribe', symbol: 'BTCUSDT', exchanges: ['binance'] }
 * - unsubscribe: { type: 'unsubscribe', symbol: 'BTCUSDT' }
 * - snapshot: { type: 'snapshot', ... }
 * - update: { type: 'update', ... }
 */

import { NextRequest, NextResponse } from 'next/server';

// WebSocket connections would be managed by the ws-server.js
// This route provides configuration and fallback HTTP polling

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  // Return WebSocket configuration
  return NextResponse.json({
    success: true,
    websocket: {
      url: process.env.WS_URL || 'wss://your-domain/ws',
      channels: ['orderbook'],
      subscribeMessage: {
        type: 'subscribe',
        channel: 'orderbook',
        symbol: symbol || 'BTCUSDT',
        exchanges: ['binance', 'coinbase', 'kraken', 'bybit', 'okx'],
      },
      unsubscribeMessage: {
        type: 'unsubscribe',
        channel: 'orderbook',
      },
    },
    polling: {
      fallbackUrl: '/api/orderbook',
      recommendedInterval: 1000,
      params: {
        symbol: symbol || 'BTCUSDT',
        depth: 20,
      },
    },
    documentation: {
      messageTypes: [
        {
          type: 'snapshot',
          description: 'Full order book snapshot on initial subscription',
          fields: ['symbol', 'exchanges', 'bids', 'asks', 'metrics', 'timestamp'],
        },
        {
          type: 'update',
          description: 'Incremental order book updates',
          fields: ['symbol', 'exchange', 'side', 'price', 'quantity', 'timestamp'],
        },
        {
          type: 'arbitrage',
          description: 'Real-time arbitrage opportunity alerts',
          fields: ['symbol', 'buyExchange', 'sellExchange', 'spread', 'potentialProfit'],
        },
      ],
    },
  });
}
