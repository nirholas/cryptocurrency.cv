/**
 * Alerts API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPriceAlert,
  createKeywordAlert,
  deleteAlert,
  toggleAlert,
  getUserAlerts,
  getAlertHistory,
  checkPriceAlerts,
  checkKeywordAlerts,
  getAlertStats,
} from '@/lib/alerts';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  // Check alerts (cron job endpoint)
  if (action === 'check') {
    const [priceNotifications, keywordNotifications] = await Promise.all([
      checkPriceAlerts(),
      checkKeywordAlerts(),
    ]);

    return NextResponse.json({
      checked: true,
      notifications: {
        price: priceNotifications.length,
        keyword: keywordNotifications.length,
      },
      results: [...priceNotifications, ...keywordNotifications],
    });
  }

  // Get stats (admin)
  if (action === 'stats') {
    return NextResponse.json(getAlertStats());
  }

  // Get user alerts
  if (userId) {
    const alerts = getUserAlerts(userId);
    const history = getAlertHistory(userId);

    return NextResponse.json({
      alerts,
      history,
    });
  }

  return NextResponse.json({
    message: 'Alerts API',
    endpoints: {
      getUserAlerts: 'GET /api/alerts?userId=xxx',
      createPriceAlert: 'POST /api/alerts { type: "price", ... }',
      createKeywordAlert: 'POST /api/alerts { type: "keyword", ... }',
      deleteAlert: 'DELETE /api/alerts?alertId=xxx',
      toggleAlert: 'PATCH /api/alerts { alertId, active }',
      checkAlerts: 'GET /api/alerts?action=check (cron)',
    },
    examples: {
      priceAlert: {
        type: 'price',
        userId: 'user_123',
        coin: 'Bitcoin',
        coinId: 'bitcoin',
        condition: 'above',
        threshold: 100000,
        notifyVia: ['push', 'email'],
      },
      keywordAlert: {
        type: 'keyword',
        userId: 'user_123',
        keywords: ['bitcoin', 'etf', 'sec'],
        sources: ['coindesk', 'theblock'],
        notifyVia: ['push'],
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, ...options } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (type === 'price') {
      if (!options.coinId || !options.condition || options.threshold === undefined) {
        return NextResponse.json(
          { error: 'coinId, condition, and threshold are required for price alerts' },
          { status: 400 }
        );
      }

      const alert = await createPriceAlert(userId, options);
      return NextResponse.json({ success: true, alert }, { status: 201 });
    }

    if (type === 'keyword') {
      if (!options.keywords || options.keywords.length === 0) {
        return NextResponse.json(
          { error: 'keywords array is required for keyword alerts' },
          { status: 400 }
        );
      }

      const alert = await createKeywordAlert(userId, options);
      return NextResponse.json({ success: true, alert }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'type must be "price" or "keyword"' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const alertId = searchParams.get('alertId');

  if (!alertId) {
    return NextResponse.json(
      { error: 'alertId is required' },
      { status: 400 }
    );
  }

  const success = await deleteAlert(alertId);

  return NextResponse.json({
    success,
    message: success ? 'Alert deleted' : 'Alert not found',
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, active } = body;

    if (!alertId || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'alertId and active (boolean) are required' },
        { status: 400 }
      );
    }

    const success = await toggleAlert(alertId, active);

    return NextResponse.json({
      success,
      message: success ? `Alert ${active ? 'enabled' : 'disabled'}` : 'Alert not found',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
