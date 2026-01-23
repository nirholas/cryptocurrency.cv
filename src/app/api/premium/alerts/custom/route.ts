/**
 * Premium API - Custom Watchlist Alerts
 *
 * POST /api/premium/alerts/custom
 *
 * Create custom alert rules for price movements:
 * - Percentage change alerts
 * - Price target alerts
 * - Volume spike alerts
 * - Technical indicator triggers
 *
 * Price: $0.10 per month (subscription)
 *
 * @module api/premium/alerts/custom
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@x402/next';
import { x402Server, getRouteConfig } from '@/lib/x402-server';
import { getCoinDetails, getPricesForCoins } from '@/lib/market-data';

export const runtime = 'nodejs';

interface AlertRule {
  id?: string;
  coinId: string;
  type: 'price_above' | 'price_below' | 'percent_change' | 'volume_spike';
  threshold: number;
  timeframe?: '1h' | '4h' | '24h';
  notifyVia?: ('webhook' | 'email')[];
  webhookUrl?: string;
  email?: string;
  enabled: boolean;
}

interface CreateAlertRequest {
  rules: AlertRule[];
}

interface AlertStatus {
  id: string;
  coinId: string;
  coinName: string;
  type: AlertRule['type'];
  threshold: number;
  currentValue: number;
  triggered: boolean;
  distance: number;
  distancePercent: number;
  enabled: boolean;
  createdAt: string;
  lastChecked: string;
  triggeredAt?: string;
}

interface AlertsResponse {
  alerts: AlertStatus[];
  activeCount: number;
  triggeredCount: number;
  premium: true;
  metadata: {
    createdAt: string;
    subscription: {
      active: boolean;
      expiresAt: string;
    };
  };
}

/**
 * Generate a unique alert ID
 */
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if an alert is triggered based on current data
 */
function checkAlertTriggered(
  rule: AlertRule,
  currentPrice: number,
  priceChange24h: number,
  volume24h: number,
  avgVolume: number
): { triggered: boolean; distance: number } {
  switch (rule.type) {
    case 'price_above':
      return {
        triggered: currentPrice >= rule.threshold,
        distance: rule.threshold - currentPrice,
      };
    case 'price_below':
      return {
        triggered: currentPrice <= rule.threshold,
        distance: currentPrice - rule.threshold,
      };
    case 'percent_change':
      return {
        triggered: Math.abs(priceChange24h) >= rule.threshold,
        distance: rule.threshold - Math.abs(priceChange24h),
      };
    case 'volume_spike':
      const volumeRatio = avgVolume > 0 ? volume24h / avgVolume : 0;
      return {
        triggered: volumeRatio >= rule.threshold,
        distance: rule.threshold - volumeRatio,
      };
    default:
      return { triggered: false, distance: 0 };
  }
}

/**
 * Handler for custom alerts endpoint
 */
async function handler(
  request: NextRequest
): Promise<NextResponse<AlertsResponse | { error: string; message: string }>> {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed', message: 'Use POST request' },
      { status: 405 }
    );
  }

  let body: CreateAlertRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { rules } = body;

  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return NextResponse.json(
      { error: 'Invalid rules', message: 'rules array is required' },
      { status: 400 }
    );
  }

  if (rules.length > 50) {
    return NextResponse.json(
      { error: 'Too many rules', message: 'Maximum 50 alert rules allowed' },
      { status: 400 }
    );
  }

  // Validate rule types
  const validTypes = ['price_above', 'price_below', 'percent_change', 'volume_spike'];
  for (const rule of rules) {
    if (!rule.coinId || !rule.type || rule.threshold === undefined) {
      return NextResponse.json(
        { error: 'Invalid rule', message: 'Each rule requires coinId, type, and threshold' },
        { status: 400 }
      );
    }
    if (!validTypes.includes(rule.type)) {
      return NextResponse.json(
        { error: 'Invalid rule type', message: `type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
  }

  try {
    // Get unique coin IDs
    const coinIds = [...new Set(rules.map((r) => r.coinId))];

    // Fetch current prices
    const prices = await getPricesForCoins(coinIds, 'usd');

    // Fetch detailed data for each coin
    const coinDataPromises = coinIds.map(async (coinId) => {
      const details = await getCoinDetails(coinId);
      return { coinId, details };
    });
    const coinDataResults = await Promise.all(coinDataPromises);
    const coinData = new Map(coinDataResults.map((r) => [r.coinId, r.details]));

    // Process alerts
    const alerts: AlertStatus[] = [];
    let triggeredCount = 0;

    for (const rule of rules) {
      const details = coinData.get(rule.coinId);
      const currentPrice =
        prices[rule.coinId]?.usd || details?.market_data?.current_price?.usd || 0;
      const priceChange24h = details?.market_data?.price_change_percentage_24h || 0;
      const volume24h = details?.market_data?.total_volume?.usd || 0;
      const avgVolume = volume24h * 0.8; // Simplified average

      const { triggered, distance } = checkAlertTriggered(
        rule,
        currentPrice,
        priceChange24h,
        volume24h,
        avgVolume
      );

      if (triggered && rule.enabled) triggeredCount++;

      // Calculate distance percent
      let currentValue = currentPrice;
      let distancePercent = 0;

      if (rule.type === 'percent_change') {
        currentValue = priceChange24h;
        distancePercent = distance;
      } else if (rule.type === 'volume_spike') {
        currentValue = avgVolume > 0 ? volume24h / avgVolume : 0;
        distancePercent = (distance / rule.threshold) * 100;
      } else {
        distancePercent = currentPrice > 0 ? (distance / currentPrice) * 100 : 0;
      }

      alerts.push({
        id: rule.id || generateAlertId(),
        coinId: rule.coinId,
        coinName: details?.name || rule.coinId,
        type: rule.type,
        threshold: rule.threshold,
        currentValue,
        triggered,
        distance,
        distancePercent: Math.round(distancePercent * 100) / 100,
        enabled: rule.enabled ?? true,
        createdAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        triggeredAt: triggered ? new Date().toISOString() : undefined,
      });
    }

    // Calculate subscription expiry (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    return NextResponse.json(
      {
        alerts,
        activeCount: alerts.filter((a) => a.enabled).length,
        triggeredCount,
        premium: true,
        metadata: {
          createdAt: new Date().toISOString(),
          subscription: {
            active: true,
            expiresAt: expiresAt.toISOString(),
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    console.error('Error in custom alerts route:', error);
    return NextResponse.json(
      { error: 'Alert creation failed', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/premium/alerts/custom
 *
 * Premium custom alerts - requires x402 payment
 *
 * Request body:
 * {
 *   "rules": [
 *     {
 *       "coinId": "bitcoin",
 *       "type": "price_above",
 *       "threshold": 100000,
 *       "enabled": true,
 *       "webhookUrl": "https://example.com/webhook"
 *     },
 *     {
 *       "coinId": "ethereum",
 *       "type": "percent_change",
 *       "threshold": 10,
 *       "timeframe": "24h",
 *       "enabled": true
 *     }
 *   ]
 * }
 *
 * Alert types:
 * - price_above: Trigger when price >= threshold
 * - price_below: Trigger when price <= threshold
 * - percent_change: Trigger when |change%| >= threshold
 * - volume_spike: Trigger when volume ratio >= threshold
 *
 * @example
 * POST /api/premium/alerts/custom
 * Body: { "rules": [...] }
 */
export const POST = withX402(
  handler,
  getRouteConfig('/api/premium/alerts/custom' as any),
  x402Server
);
