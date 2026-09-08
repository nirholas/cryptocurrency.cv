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
import {
  getProtocolSummary,
  getProtocolRevenue,
  getProtocolPE,
  getTopByRevenue,
  getProtocolMetrics,
} from '@/lib/apis/tokenterminal';

export const runtime = 'nodejs';
export const revalidate = 300;

/**
 * GET /api/tokenterminal
 *
 * Token Terminal protocol revenue, metrics, and P/E analytics.
 *
 * Query params:
 *   - action: "summary" | "revenue" | "pe" | "top-revenue" | "metrics"
 *   - protocol: project ID (for revenue)
 *   - limit: max results (for pe, top-revenue, metrics)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'summary';

    switch (action) {
      case 'summary': {
        const data = await getProtocolSummary();
        return jsonResponse(data);
      }

      case 'revenue': {
        const protocol = searchParams.get('protocol');
        if (!protocol) {
          return NextResponse.json(
            { error: 'protocol parameter required' },
            { status: 400 },
          );
        }
        const data = await getProtocolRevenue(protocol);
        return jsonResponse(data);
      }

      case 'pe': {
        const limit = searchParams.get('limit')
          ? Number(searchParams.get('limit'))
          : 20;
        const data = await getProtocolPE(limit);
        return jsonResponse(data);
      }

      case 'top-revenue': {
        const limit = searchParams.get('limit')
          ? Number(searchParams.get('limit'))
          : 20;
        const data = await getTopByRevenue(limit);
        return jsonResponse(data);
      }

      case 'metrics': {
        const data = await getProtocolMetrics();
        return jsonResponse(data);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Token Terminal data' },
      { status: 500 },
    );
  }
}

function jsonResponse(data: unknown): NextResponse {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
