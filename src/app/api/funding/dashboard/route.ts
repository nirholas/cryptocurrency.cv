/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch funding dashboard' },
      { status: 500 }
    );
  }
}
