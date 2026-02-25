/**
 * GET /api/stablecoins/depeg — Depeg monitor status & active alerts
 *
 * Returns current peg deviation alerts from the depeg monitor.
 */

import { NextResponse } from 'next/server';
import { depegMonitor } from '@/lib/stablecoin/depeg-monitor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = depegMonitor.getStatus();

    return NextResponse.json(
      {
        status: 'ok',
        running: status.running,
        monitoredSymbols: status.monitored,
        activeAlerts: status.activeAlerts,
        alertCount: status.activeAlerts.length,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
