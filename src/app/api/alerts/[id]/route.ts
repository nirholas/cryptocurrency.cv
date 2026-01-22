/**
 * Individual Alert Management API
 * 
 * Handles GET, PUT, DELETE operations for individual alert rules.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAlertRule,
  updateAlertRule,
  deleteAlertRule,
  testTriggerAlert,
  getAlertEventsByRule,
} from '@/lib/alerts';
import type { AlertCondition, AlertChannel } from '@/lib/alert-rules';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/alerts/[id] - Get a single alert rule
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  // Test trigger endpoint
  if (action === 'test' || id === 'test') {
    const alertId = id === 'test' ? searchParams.get('alertId') : id;
    
    if (!alertId || alertId === 'test') {
      return NextResponse.json(
        { error: 'alertId is required for test trigger' },
        { status: 400 }
      );
    }

    const event = await testTriggerAlert(alertId);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  }

  // Get events for this rule
  if (action === 'events') {
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const events = getAlertEventsByRule(id, limit);
    return NextResponse.json({
      events,
      total: events.length,
      ruleId: id,
    });
  }

  // Get the alert rule
  const alert = getAlertRule(id);

  if (!alert) {
    return NextResponse.json(
      { error: 'Alert not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ alert });
}

/**
 * PUT /api/alerts/[id] - Update an alert rule
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, condition, channels, webhookUrl, cooldown, enabled } = body;

    // Build updates object
    const updates: {
      name?: string;
      condition?: AlertCondition;
      channels?: AlertChannel[];
      webhookUrl?: string;
      cooldown?: number;
      enabled?: boolean;
    } = {};

    if (name !== undefined) updates.name = name;
    if (condition !== undefined) updates.condition = condition as AlertCondition;
    if (channels !== undefined) {
      updates.channels = Array.isArray(channels)
        ? channels.filter((c: string) => c === 'websocket' || c === 'webhook')
        : undefined;
    }
    if (webhookUrl !== undefined) updates.webhookUrl = webhookUrl;
    if (cooldown !== undefined && typeof cooldown === 'number') updates.cooldown = cooldown;
    if (enabled !== undefined && typeof enabled === 'boolean') updates.enabled = enabled;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const alert = updateAlertRule(id, updates);

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/alerts/[id] - Delete an alert rule
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  const success = deleteAlertRule(id);

  if (!success) {
    return NextResponse.json(
      { error: 'Alert not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Alert deleted',
    deletedId: id,
  });
}

/**
 * POST /api/alerts/[id] - Special actions (test trigger)
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  // Handle test endpoint: POST /api/alerts/test
  if (id === 'test') {
    try {
      const body = await request.json();
      const alertId = body.alertId;

      if (!alertId) {
        return NextResponse.json(
          { error: 'alertId is required' },
          { status: 400 }
        );
      }

      const event = await testTriggerAlert(alertId);

      if (!event) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        event,
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
  }

  // Test trigger for specific alert
  if (action === 'test') {
    const event = await testTriggerAlert(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });
  }

  return NextResponse.json(
    { error: 'Unknown action. Use ?action=test to test trigger the alert.' },
    { status: 400 }
  );
}

/**
 * PATCH /api/alerts/[id] - Partial update (enable/disable)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled (boolean) is required' },
        { status: 400 }
      );
    }

    const alert = updateAlertRule(id, { enabled });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alert,
      message: `Alert ${enabled ? 'enabled' : 'disabled'}`,
    });
  } catch {
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
