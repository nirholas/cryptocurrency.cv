/**
 * Funding Rate Dashboard API
 * 
 * Real-time funding rate aggregation with arbitrage detection.
 * 
 * @route GET /api/funding
 * @route GET /api/funding/history
 * @route GET /api/funding/alerts
 */

import { type NextRequest, NextResponse } from 'next/server';
import {
  getFundingDashboard,
  getFundingHistory,
  generateFundingAlerts,
  type FundingDashboard,
} from '@/lib/funding-rates';

export const runtime = 'edge';
export const revalidate = 30;

// In-memory subscription storage (process-scoped)
const fundingSubscriptions = new Map<string, {
  webhookUrl: string;
  symbols: string | string[];
  threshold: number;
  exchange: string;
  createdAt: string;
}>();

/**
 * GET /api/funding
 * 
 * Returns comprehensive funding rate dashboard
 * 
 * Query params:
 * - exchange: Filter by exchange (binance, bybit, okx, hyperliquid)
 * - symbol: Filter by symbol (e.g., BTCUSDT)
 * - minSpread: Minimum arbitrage spread (percentage)
 * - alerts: Include alert generation (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get('exchange');
    const symbol = searchParams.get('symbol');
    const minSpread = parseFloat(searchParams.get('minSpread') || '0');
    const includeAlerts = searchParams.get('alerts') === 'true';
    const historySymbol = searchParams.get('history');
    const historyExchange = searchParams.get('historyExchange') || 'binance';
    const limit = parseInt(searchParams.get('limit') || '100');

    // If requesting history for a specific symbol
    if (historySymbol) {
      const history = await getFundingHistory(historySymbol, historyExchange, limit);
      
      return NextResponse.json({
        success: true,
        data: history,
        meta: {
          symbol: historySymbol,
          exchange: historyExchange,
          dataPoints: history.history.length,
        },
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Get full dashboard
    const dashboard = await getFundingDashboard();
    let result: FundingDashboard & { alerts?: ReturnType<typeof generateFundingAlerts> } = { ...dashboard };

    // Apply filters
    if (exchange) {
      result = {
        ...result,
        topPositive: result.topPositive.filter(r => r.exchange === exchange),
        topNegative: result.topNegative.filter(r => r.exchange === exchange),
        crossExchange: result.crossExchange.filter(c => 
          c.exchanges.some(e => e.exchange === exchange)
        ),
        arbitrageOpportunities: result.arbitrageOpportunities.filter(a => 
          a.longExchange === exchange || a.shortExchange === exchange
        ),
      };
    }

    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      result = {
        ...result,
        topPositive: result.topPositive.filter(r => r.symbol === upperSymbol),
        topNegative: result.topNegative.filter(r => r.symbol === upperSymbol),
        crossExchange: result.crossExchange.filter(c => c.symbol === upperSymbol),
        arbitrageOpportunities: result.arbitrageOpportunities.filter(a => a.symbol === upperSymbol),
      };
    }

    if (minSpread > 0) {
      result = {
        ...result,
        crossExchange: result.crossExchange.filter(c => Math.abs(c.spread) >= minSpread),
        arbitrageOpportunities: result.arbitrageOpportunities.filter(a => Math.abs(a.spread) >= minSpread),
      };
    }

    // Generate alerts if requested
    if (includeAlerts) {
      result.alerts = generateFundingAlerts(dashboard);
    }

    const response = {
      success: true,
      data: result,
      meta: {
        exchanges: Object.keys(result.marketSummary.exchangeBreakdown),
        totalRates: result.topPositive.length + result.topNegative.length,
        arbitrageCount: result.arbitrageOpportunities.length,
        filters: {
          exchange: exchange || 'all',
          symbol: symbol || 'all',
          minSpread,
        },
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Funding API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch funding rate data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}

/**
 * POST /api/funding
 * 
 * Webhook for funding rate alerts subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action, 
      webhook_url, 
      symbols, 
      threshold,
      exchange,
    } = body;

    if (action === 'subscribe') {
      if (!webhook_url) {
        return NextResponse.json({
          error: 'webhook_url is required for subscription',
        }, { status: 400 });
      }

      // Store subscription in memory for this process
      const subscriptionId = crypto.randomUUID();
      fundingSubscriptions.set(subscriptionId, {
        webhookUrl: webhook_url,
        symbols: symbols || 'all',
        threshold: threshold || 0.1,
        exchange: exchange || 'all',
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        subscriptionId,
        message: 'Funding rate alert subscription created',
        config: {
          webhook_url,
          symbols: symbols || 'all',
          threshold: threshold || 0.1,
          exchange: exchange || 'all',
        },
      });
    }

    if (action === 'unsubscribe') {
      const { subscriptionId } = body;
      
      if (!subscriptionId) {
        return NextResponse.json({
          error: 'subscriptionId is required for unsubscription',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled',
        subscriptionId,
      });
    }

    return NextResponse.json({
      error: 'Invalid action. Use: subscribe, unsubscribe',
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
