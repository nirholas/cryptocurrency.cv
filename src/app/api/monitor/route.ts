/**
 * Autonomous AI Market Monitor API
 *
 * GET /api/monitor — Get current monitor status, alerts, regime
 * GET /api/monitor?action=start — Start the monitor
 * GET /api/monitor?action=stop — Stop the monitor
 * GET /api/monitor?action=report&type=hourly-brief — Generate report on demand
 * GET /api/monitor?action=alerts&limit=10 — Get recent alerts
 *
 * The monitor runs autonomously in the background, collecting observations
 * and generating alerts/reports without human prompting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMarketMonitor, type IntelligenceReport } from '@/lib/ai-market-monitor';

export const runtime = 'edge';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const action = params.get('action') || 'status';
  const monitor = getMarketMonitor();

  try {
    switch (action) {
      case 'start': {
        const observeInterval = Math.max(30000, parseInt(params.get('observe_interval') || '60000', 10));
        const analyzeInterval = Math.max(60000, parseInt(params.get('analyze_interval') || '300000', 10));
        monitor.start(observeInterval, analyzeInterval);
        return NextResponse.json({
          status: 'started',
          ...monitor.getStatus(),
        }, { headers: corsHeaders() });
      }

      case 'stop': {
        monitor.stop();
        return NextResponse.json({
          status: 'stopped',
          ...monitor.getStatus(),
        }, { headers: corsHeaders() });
      }

      case 'report': {
        const type = (params.get('type') || 'hourly-brief') as IntelligenceReport['type'];
        const report = await monitor.generateReport(type);
        if (!report) {
          return NextResponse.json(
            { error: 'No AI provider configured' },
            { status: 503, headers: corsHeaders() }
          );
        }
        return NextResponse.json({ report }, { headers: corsHeaders() });
      }

      case 'alerts': {
        const limit = Math.min(50, parseInt(params.get('limit') || '10', 10));
        return NextResponse.json({
          alerts: monitor.getRecentAlerts(limit),
          regime: monitor.getRegime(),
        }, { headers: corsHeaders() });
      }

      case 'status':
      default: {
        return NextResponse.json(
          monitor.getStatus(),
          {
            headers: {
              ...corsHeaders(),
              'Cache-Control': 'no-cache',
            },
          }
        );
      }
    }
  } catch (error) {
    console.error('[Monitor API] Error:', error);
    return NextResponse.json(
      { error: 'Monitor error' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
