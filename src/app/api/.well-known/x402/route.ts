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
 * x402 Well-Known Discovery Endpoint (API path)
 *
 * Serves the x402scan v1 discovery format. Reachable at:
 *   - /api/.well-known/x402  (direct)
 *   - /.well-known/x402      (via rewrite in next.config.js)
 *
 * @see https://github.com/Merit-Systems/x402scan
 */

import { NextResponse } from 'next/server';
import { ROUTE_MANIFEST } from '@/lib/openapi/routes.generated';

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

  return NextResponse.json(
    { version: 1, resources },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
