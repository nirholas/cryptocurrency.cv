/**
 * Premium API v1 - Alerts Endpoint
 *
 * Returns current price alerts and market signals
 * Requires x402 payment or valid API key
 *
 * @price $0.003 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/alerts';

interface PriceAlert {
  type: 'price_surge' | 'price_drop' | 'volume_spike' | 'volatility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  coinId: string;
  symbol: string;
  name: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  try {
    // Fetch top coins to generate alerts from real data
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h,7d',
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Upstream API error: ${response.status}`);
    }

    const coins = await response.json();
    const alerts: PriceAlert[] = [];
    const now = new Date().toISOString();

    // Generate alerts based on real market data
    for (const coin of coins) {
      const change1h = coin.price_change_percentage_1h_in_currency;
      const change24h = coin.price_change_percentage_24h;
      const change7d = coin.price_change_percentage_7d_in_currency;

      // Price surge alerts (>5% in 1h or >15% in 24h)
      if (change1h > 5) {
        alerts.push({
          type: 'price_surge',
          severity: change1h > 10 ? 'high' : 'medium',
          coinId: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          metric: '1h_change',
          value: change1h,
          threshold: 5,
          message: `${coin.name} surged ${change1h.toFixed(2)}% in the last hour`,
          timestamp: now,
        });
      }

      if (change24h > 15) {
        alerts.push({
          type: 'price_surge',
          severity: change24h > 25 ? 'critical' : 'high',
          coinId: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          metric: '24h_change',
          value: change24h,
          threshold: 15,
          message: `${coin.name} up ${change24h.toFixed(2)}% in 24 hours`,
          timestamp: now,
        });
      }

      // Price drop alerts (<-5% in 1h or <-15% in 24h)
      if (change1h < -5) {
        alerts.push({
          type: 'price_drop',
          severity: change1h < -10 ? 'high' : 'medium',
          coinId: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          metric: '1h_change',
          value: change1h,
          threshold: -5,
          message: `${coin.name} dropped ${Math.abs(change1h).toFixed(2)}% in the last hour`,
          timestamp: now,
        });
      }

      if (change24h < -15) {
        alerts.push({
          type: 'price_drop',
          severity: change24h < -25 ? 'critical' : 'high',
          coinId: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          metric: '24h_change',
          value: change24h,
          threshold: -15,
          message: `${coin.name} down ${Math.abs(change24h).toFixed(2)}% in 24 hours`,
          timestamp: now,
        });
      }

      // High volatility alert (large swing in 7d)
      if (change7d && Math.abs(change7d) > 30) {
        alerts.push({
          type: 'volatility',
          severity: Math.abs(change7d) > 50 ? 'high' : 'medium',
          coinId: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          metric: '7d_change',
          value: change7d,
          threshold: 30,
          message: `${coin.name} showing high volatility: ${change7d > 0 ? '+' : ''}${change7d.toFixed(2)}% this week`,
          timestamp: now,
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Limit to top 50 alerts
    const topAlerts = alerts.slice(0, 50);

    // Summary stats
    const summary = {
      total: topAlerts.length,
      critical: topAlerts.filter((a) => a.severity === 'critical').length,
      high: topAlerts.filter((a) => a.severity === 'high').length,
      medium: topAlerts.filter((a) => a.severity === 'medium').length,
      low: topAlerts.filter((a) => a.severity === 'low').length,
      byType: {
        price_surge: topAlerts.filter((a) => a.type === 'price_surge').length,
        price_drop: topAlerts.filter((a) => a.type === 'price_drop').length,
        volatility: topAlerts.filter((a) => a.type === 'volatility').length,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: topAlerts,
        summary,
        meta: {
          endpoint: ENDPOINT,
          alertCount: topAlerts.length,
          coinsAnalyzed: coins.length,
          timestamp: now,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Data-Source': 'CoinGecko',
        },
      }
    );
  } catch (error) {
    console.error('[API] /v1/alerts error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to generate alerts' },
      { status: 502 }
    );
  }
}
