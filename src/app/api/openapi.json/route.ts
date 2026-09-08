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
 * The canonical discovery document, served at /openapi.json via a rewrite.
 *
 * The `servers` entry is built from the request rather than baked in, because
 * `NEXT_PUBLIC_APP_URL` is inlined at build time: an image built once and
 * deployed to a second hostname would otherwise hand every agent a base URL
 * pointing at the first one. `resolveOrigin` only honours hosts the operator
 * has allowed, so a spoofed `Host` header cannot rewrite the document.
 *
 * @see https://x402scan.com/discovery/spec
 */

import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi/generator';
import { resolveOrigin } from '@/lib/x402/payment-required';

export const runtime = 'edge';

export async function GET(request: Request) {
  const spec = generateOpenAPISpec(resolveOrigin(request));

  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      // The document differs per host, so a shared cache must key on it.
      Vary: 'X-Forwarded-Host, Host',
    },
  });
}
