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
 * x402 Well-Known Discovery Endpoint (Standard Location)
 *
 * Also served via rewrite /.well-known/x402 → /api/.well-known/x402.
 * This route exists as a direct fallback in case the rewrite doesn't apply.
 *
 * @see https://github.com/Merit-Systems/x402scan
 */

import { NextResponse } from 'next/server';
import { ROUTE_MANIFEST } from '@/lib/openapi/routes.generated';
import { getOwnershipProofs } from '@/lib/x402/config';

export const runtime = 'edge';
export const revalidate = 300;

const POST_ROUTES = new Set([
  '/api/premium/portfolio/analytics',
  '/api/premium/alerts/create',
  '/api/batch',
  '/api/rag/batch',
  '/api/rag/feedback',
  '/api/portfolio/holding',
  '/api/webhooks',
]);

export async function GET() {
  const resources = ROUTE_MANIFEST.map(({ path }) => {
    const method = POST_ROUTES.has(path) ? 'POST' : 'GET';
    return `${method} ${path}`;
  });

  const ownershipProofs = getOwnershipProofs();

  return NextResponse.json(
    {
      version: 1,
      resources,
      ...(ownershipProofs && { ownershipProofs }),
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
