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
import { optionalIntParam, optionalNumParam } from '@/lib/query-params';

export const runtime = 'nodejs';
export const revalidate = 60;

// Every value below ends up in an upstream URL, so each one is held to a
// strict format before it leaves this route.
const ADDRESS_RE = /^[A-Za-z0-9]{20,100}$/;
const CHAIN_RE = /^[a-z0-9-]{1,32}$/;
const TOKEN_RE = /^[A-Za-z0-9.-]{1,100}$/;
const ENTITY_RE = /^[\w .-]{1,64}$/;

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
        if (address && !ADDRESS_RE.test(address)) {
          return NextResponse.json({ error: `invalid address parameter` }, { status: 400 });
        }
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
        if (entity && !ENTITY_RE.test(entity)) {
          return NextResponse.json({ error: `invalid entity parameter` }, { status: 400 });
        }
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
        const chain = searchParams.get('chain') || undefined;
        const token = searchParams.get('token') || undefined;
        if (chain && !CHAIN_RE.test(chain)) {
          return NextResponse.json({ error: `invalid chain parameter` }, { status: 400 });
        }
        if (token && !TOKEN_RE.test(token)) {
          return NextResponse.json({ error: `invalid token parameter` }, { status: 400 });
        }
        const data = await getSmartMoneyFlows({
          chain,
          token,
          minValueUsd: optionalNumParam(searchParams, 'minValueUsd', { min: 0, max: 1e12 }),
          limit: optionalIntParam(searchParams, 'limit', { min: 1, max: 100 }),
        });
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
