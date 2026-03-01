/**
 * Alerts API
 * 
 * Supports both legacy user-based alerts and enhanced rule-based alerts.
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
  // Enhanced alert rule functions
  getAllAlertRules,
  createAlertRule,
  evaluateAllAlerts,
  getEnhancedAlertStats,
  testTriggerAlert,
  getAlertEvents,
} from '@/lib/alerts';
import type { AlertCondition, AlertChannel } from '@/lib/alert-rules';
import { getLatestNews } from '@/lib/crypto-news';
import { aiComplete, isAIConfigured } from '@/lib/ai-provider';
import { parseGroqJson } from '@/lib/groq';

// Use Node.js runtime since alerts.ts uses database.ts which requires fs/path modules
export const runtime = 'nodejs';

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

    const allNotifications = [...priceNotifications, ...keywordNotifications];

    // Enrich with AI context when Groq is available and there are notifications
    let enrichedNotifications: typeof allNotifications = allNotifications;
    if (isAIConfigured() && allNotifications.length > 0) {
      try {
        const { articles } = await getLatestNews(10);
        const recentHeadlines = articles.map(a => a.title).join('\n');

        const alertList = allNotifications
          .map((n, i) => `${i}: [${n.type}] ${n.title} — ${n.message}`)
          .join('\n');

        const raw = await aiComplete(
          'You are a crypto market analyst providing brief, actionable context for triggered alerts.',
          `These crypto alerts just fired:\n${alertList}\n\nRecent crypto headlines for context:\n${recentHeadlines}\n\nFor each alert, write 2-3 sentences explaining why this alert matters RIGHT NOW given the current news. Be specific and actionable.\n\nReturn ONLY a JSON array (same order as alerts):\n[{ "index": 0, "ai_context": "..." }, ...]`,
          { maxTokens: 1500, temperature: 0.3, jsonMode: true },
          true
        );

        const parsed = parseGroqJson<unknown>(raw);
        const contexts: Array<{ index: number; ai_context: string }> =
          Array.isArray(parsed) ? parsed : parsed.alerts || [];

        enrichedNotifications = allNotifications.map((n, i) => {
          const ctx = contexts.find(c => c.index === i);
          return ctx ? { ...n, ai_context: ctx.ai_context } : n;
        });
      } catch (err) {
        console.warn('[Alerts] AI context enrichment failed (non-fatal):', err);
      }
    }

    return NextResponse.json({
      checked: true,
      notifications: {
        price: priceNotifications.length,
        keyword: keywordNotifications.length,
      },
      results: enrichedNotifications,
    });
  }

  // Evaluate enhanced alert rules
  if (action === 'evaluate') {
    const events = await evaluateAllAlerts();
    return NextResponse.json({
      evaluated: true,
      eventsTriggered: events.length,
      events,
    });
  }

  // Get stats (admin)
  if (action === 'stats') {
    const [legacyStats, enhancedStats] = await Promise.all([
      getAlertStats(),
      getEnhancedAlertStats(),
    ]);
    return NextResponse.json({
      legacy: legacyStats,
      enhanced: enhancedStats,
    });
  }

  // List all enhanced alert rules
  if (action === 'rules' || action === 'list') {
    const alerts = await getAllAlertRules();
    return NextResponse.json({
      alerts,
      total: alerts.length,
    });
  }

  // Get recent alert events
  if (action === 'events') {
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const events = await getAlertEvents(limit);
    return NextResponse.json({
      events,
      total: events.length,
    });
  }

  // Get user alerts (legacy)
  if (userId) {
    const [alerts, history] = await Promise.all([
      getUserAlerts(userId),
      getAlertHistory(userId),
    ]);

    return NextResponse.json({
      alerts,
      history,
    });
  }

  // Default: return all alert rules
  const alerts = await getAllAlertRules();
  return NextResponse.json({
    alerts,
    total: alerts.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId, name, condition, channels, webhookUrl, cooldown, ...options } = body;

    // Enhanced alert rule creation
    if (type === 'rule' || condition) {
      if (!name || typeof name !== 'string') {
        return NextResponse.json(
          { error: 'name is required for alert rules' },
          { status: 400 }
        );
      }

      if (!condition || typeof condition !== 'object') {
        return NextResponse.json(
          { error: 'condition object is required for alert rules' },
          { status: 400 }
        );
      }

      const alertChannels: AlertChannel[] = Array.isArray(channels) 
        ? channels.filter((c: string) => c === 'websocket' || c === 'webhook')
        : ['websocket'];

      try {
        const alert = createAlertRule(name, condition as AlertCondition, alertChannels, {
          webhookUrl,
          cooldown: typeof cooldown === 'number' ? cooldown : undefined,
        });
        return NextResponse.json({ alert }, { status: 201 });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Invalid alert rule' },
          { status: 400 }
        );
      }
    }

    // Legacy user-based alerts
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required for legacy alerts, or use type: "rule" with condition' },
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
      { error: 'type must be "price", "keyword", or "rule"' },
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
  const alertId = searchParams.get('alertId') || searchParams.get('id');

  if (!alertId) {
    return NextResponse.json(
      { error: 'alertId is required' },
      { status: 400 }
    );
  }

  // Try legacy alerts first, then enhanced alert rules
  const { deleteAlertRule } = await import('@/lib/alerts');
  let success = await deleteAlert(alertId);
  
  if (!success) {
    success = await deleteAlertRule(alertId);
  }

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

    // Try legacy alerts first, then enhanced alert rules
    const { updateAlertRule } = await import('@/lib/alerts');
    let success = await toggleAlert(alertId, active);
    
    if (!success) {
      const updated = updateAlertRule(alertId, { enabled: active });
      success = updated !== null;
    }

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
