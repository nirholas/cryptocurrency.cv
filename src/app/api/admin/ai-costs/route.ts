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
 * AI Cost Dashboard API
 *
 * GET /api/admin/ai-costs — Returns comprehensive cost analytics
 *
 * Query params:
 *   hours — lookback period (default: 24)
 *
 * Requires admin auth (X-Admin-Key header or Authorization: Bearer token).
 */

// force-dynamic: admin dashboard, always fresh
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { type NextRequest, NextResponse } from 'next/server';
import { getAICostTracker } from '@/lib/ai-cost-dashboard';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Require admin auth (deny-by-default when token is not configured)
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const url = new URL(request.url);

  const hours = parseInt(url.searchParams.get('hours') ?? '24', 10);
  const tracker = getAICostTracker();
  const dashboard = tracker.getDashboard(hours);

  return NextResponse.json(dashboard, {
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Total-Entries': String(tracker.getEntryCount()),
    },
  });
}
