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
  getWalletLabels,
  getEntityPortfolio,
  getSmartMoneyFlows,
} from '@/lib/apis/arkham';

export const runtime = 'nodejs';
export const revalidate = 60;

/**
 * GET /api/arkham
 *
 * Arkham Intelligence on-chain intelligence.
 *
 * Query params:
 *   - action: "wallet-labels" | "entity-portfolio" | "smart-money-flows"
 *   - address: wallet address (for wallet-labels)
 *   - entity: entity name (for entity-portfolio)
 *   - chain, token, minValueUsd, limit: (for smart-money-flows)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'smart-money-flows';

    switch (action) {
      case 'wallet-labels': {
        const address = searchParams.get('address');
        if (!address) {
          return NextResponse.json(
            { error: 'address parameter required' },
            { status: 400 },
          );
        }
        const data = await getWalletLabels(address);
        return jsonResponse(data);
      }

      case 'entity-portfolio': {
        const entity = searchParams.get('entity');
        if (!entity) {
          return NextResponse.json(
            { error: 'entity parameter required' },
            { status: 400 },
          );
        }
        const data = await getEntityPortfolio(entity);
        return jsonResponse(data);
      }

      case 'smart-money-flows': {
        const data = await getSmartMoneyFlows({
          chain: searchParams.get('chain') || undefined,
          token: searchParams.get('token') || undefined,
          minValueUsd: searchParams.get('minValueUsd')
            ? Number(searchParams.get('minValueUsd'))
            : undefined,
          limit: searchParams.get('limit')
            ? Number(searchParams.get('limit'))
            : undefined,
        });
        return jsonResponse(data);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Arkham data' },
      { status: 500 },
    );
  }
}

function jsonResponse(data: unknown): NextResponse {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
