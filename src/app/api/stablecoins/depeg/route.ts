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
 * GET /api/stablecoins/depeg — Depeg monitor status & active alerts
 *
 * Returns current peg deviation alerts from the depeg monitor.
 */

import { NextResponse } from 'next/server';
import { depegMonitor } from '@/lib/stablecoin/depeg-monitor';

export const revalidate = 60; // ISR: depeg alerts refresh every 1 min

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
