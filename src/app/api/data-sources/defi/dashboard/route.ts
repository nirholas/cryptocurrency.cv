/**
 * DeFi Dashboard API — TVL, yields, fees, DEX volumes, stablecoins, bridges
 * GET /api/data-sources/defi/dashboard — full DeFi snapshot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDeFiDashboard } from '@/lib/data-sources/defi';

export const runtime = 'edge';
export const revalidate = 300;

export async function GET(_request: NextRequest) {
  try {
    const dashboard = await getDeFiDashboard();

    return NextResponse.json({
      status: 'ok',
      data: dashboard,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch DeFi dashboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
