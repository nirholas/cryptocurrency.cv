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
import { ENDPOINT_METADATA_FULL } from '@/lib/openapi/endpoint-metadata.generated';
import { getOwnershipProofs } from '@/lib/x402/config';

export const revalidate = 300;

/** Routes excluded from x402 discovery (free/internal endpoints) */
const EXCLUDED = new Set([
  '/api/.well-known/x402',
  '/api/health',
  '/api/sample',
  '/api/register',
  '/api/cron',
]);

export async function GET() {
  const resources: string[] = [];
  for (const { path } of ROUTE_MANIFEST) {
    if (EXCLUDED.has(path)) continue;
    const meta = (ENDPOINT_METADATA_FULL as Record<string, { methods?: string[] }>)[path];
    const methods = meta?.methods ?? ['GET'];
    for (const method of methods) {
      resources.push(`${method} ${path}`);
    }
  }

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
