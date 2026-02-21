import { NextRequest, NextResponse } from 'next/server';
import { getFundingDashboard, generateFundingAlerts } from '@/lib/funding-rates';

export const runtime = 'edge';
export const revalidate = 300;

/**
 * GET /api/funding/dashboard
 * Returns comprehensive funding rate dashboard with alerts across all exchanges
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const dashboard = await getFundingDashboard();
    const alerts = generateFundingAlerts(dashboard);
    return NextResponse.json(
      { dashboard, alerts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch funding dashboard', message: String(error) },
      { status: 500 }
    );
  }
}
