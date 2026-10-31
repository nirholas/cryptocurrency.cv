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
 * Arbitrage Scanner API
 * 
 * Real-time cross-exchange arbitrage detection.
 * 
 * @route GET /api/arbitrage
 * @route GET /api/arbitrage/monitor
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  scanArbitrageOpportunities,
  getMonitorState,
  type ArbitrageScanResult,
} from '@/lib/arbitrage-scanner';
import { safeFetch, UnsafeUrlError } from '@/lib/safe-fetch';

// Node, not edge: the webhook test resolves DNS to keep the caller's URL off private addresses.
export const runtime = 'nodejs';
export const revalidate = 5;

/**
 * GET /api/arbitrage
 * 
 * Scan for arbitrage opportunities across exchanges
 * 
 * Query params:
 * - symbol: Filter by symbol (e.g., BTCUSDT)
 * - minProfit: Minimum profit percentage (default: 0.1)
 * - exchange: Filter by exchange
 * - limit: Maximum results (default: 50)
 * - includeTriangular: Include triangular arbitrage (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol')?.toUpperCase();
    const minProfit = parseFloat(searchParams.get('minProfit') || '0.1');
    const exchange = searchParams.get('exchange')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeTriangular = searchParams.get('includeTriangular') !== 'false';
    const monitorStatus = searchParams.get('monitor') === 'true';

    // Return monitor status if requested
    if (monitorStatus) {
      const state = getMonitorState();
      return NextResponse.json({
        success: true,
        data: state,
      });
    }

    // Run the scan
    const scanResult = await scanArbitrageOpportunities();
    
    // Apply filters
    const filteredResult: ArbitrageScanResult = { ...scanResult };

    if (symbol) {
      filteredResult.opportunities = filteredResult.opportunities.filter(
        o => o.symbol === symbol
      );
      filteredResult.triangular = filteredResult.triangular.filter(
        t => t.path.some(p => symbol.includes(p))
      );
    }

    if (exchange) {
      filteredResult.opportunities = filteredResult.opportunities.filter(
        o => o.buyExchange === exchange || o.sellExchange === exchange
      );
      filteredResult.triangular = filteredResult.triangular.filter(
        t => t.exchanges.includes(exchange)
      );
    }

    if (minProfit > 0) {
      filteredResult.opportunities = filteredResult.opportunities.filter(
        o => o.netProfitPercent >= minProfit
      );
      filteredResult.triangular = filteredResult.triangular.filter(
        t => t.profitPercent >= minProfit
      );
    }

    // Apply limit
    filteredResult.opportunities = filteredResult.opportunities.slice(0, limit);
    
    if (!includeTriangular) {
      filteredResult.triangular = [];
    } else {
      filteredResult.triangular = filteredResult.triangular.slice(0, Math.ceil(limit / 5));
    }

    const response = {
      success: true,
      data: filteredResult,
      meta: {
        filters: {
          symbol: symbol || 'all',
          minProfit,
          exchange: exchange || 'all',
          limit,
        },
        performance: {
          scanDuration: filteredResult.summary.scanDuration,
          scannedPairs: filteredResult.summary.scannedPairs,
        },
      },
      disclaimer: 'Arbitrage opportunities are time-sensitive. Prices may have changed. ' +
        'This data is for informational purposes only. Always verify before trading.',
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5',
      },
    });
  } catch (error) {
    console.error('Arbitrage API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scan arbitrage opportunities',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}

/**
 * POST /api/arbitrage
 * 
 * Subscribe to arbitrage alerts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,
      webhook_url,
      min_profit,
      symbols,
      exchanges,
    } = body;

    if (action === 'subscribe') {
      if (!webhook_url) {
        return NextResponse.json({
          error: 'webhook_url is required',
        }, { status: 400 });
      }

      const subscriptionId = crypto.randomUUID();

      // In production, store in database
      return NextResponse.json({
        success: true,
        subscriptionId,
        message: 'Arbitrage alert subscription created',
        config: {
          webhook_url,
          min_profit: min_profit || 0.1,
          symbols: symbols || 'all',
          exchanges: exchanges || 'all',
          frequency: 'real-time',
        },
        instructions: [
          'You will receive webhook notifications when opportunities are detected',
          'Notifications are sent within 1 second of detection',
          'Opportunities typically last 2-5 seconds',
          'Use /api/arbitrage?monitor=true to check system status',
        ],
      });
    }

    if (action === 'test') {
      // Send a test webhook
      const testPayload = {
        type: 'arbitrage_alert',
        test: true,
        opportunity: {
          symbol: 'BTCUSDT',
          buyExchange: 'binance',
          sellExchange: 'kraken',
          spread: 0.15,
          netProfit: 15.0,
        },
        timestamp: new Date().toISOString(),
      };

      if (webhook_url) {
        if (typeof webhook_url !== 'string') {
          return NextResponse.json({ error: 'webhook_url must be a string' }, { status: 400 });
        }
        try {
          const res = await safeFetch(webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
            signal: AbortSignal.timeout(5000),
          });
          await res.body?.cancel();

          return NextResponse.json({
            success: res.ok,
            message: res.ok ? 'Test webhook sent' : `Webhook responded with HTTP ${res.status}`,
            payload: testPayload,
          });
        } catch (err) {
          if (err instanceof UnsafeUrlError) {
            return NextResponse.json({
              success: false,
              error: 'webhook_url must be a public http(s) URL',
            }, { status: 400 });
          }
          return NextResponse.json({
            success: false,
            error: 'Failed to send test webhook',
            message: 'The webhook could not be reached',
          }, { status: 400 });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Test payload (webhook_url not provided)',
        payload: testPayload,
      });
    }

    return NextResponse.json({
      error: 'Invalid action. Use: subscribe, test',
    }, { status: 400 });
  } catch (error) {
    console.error('arbitrage route error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
    }, { status: 500 });
  }
}
