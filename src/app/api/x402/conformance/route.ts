/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * GET /api/x402/conformance
 *
 * Audit an x402 origin's discovery contract and return a graded report.
 *
 * Every other tool in this space checks the discovery document, then separately
 * checks a live payment challenge, and reports on each. Neither pass can see
 * the failure that actually costs money, which is the two disagreeing: an agent
 * budgets from the document and settles from the wire, and nothing in between
 * compares them. This endpoint does, and it also checks the thing no static
 * validator can, which is whether the address in the challenge can receive
 * funds at all.
 *
 * Nothing here spends money. A probe is an ordinary unpaid request, and the
 * challenge a server hands an anonymous caller is public by construction.
 *
 * Query:
 *   ?origin=https://example.com   origin to audit (defaults to this one)
 *   ?probe=12                     how many operations to probe live (max 40)
 *   ?documentOnly=1               read the discovery document, touch nothing live
 *   ?format=sarif                 SARIF 2.1.0 for code-scanning upload
 *
 * The same engine ships as a standalone package and CLI:
 * `npx @nirholas/x402-conformance <origin>`. See sdk/x402-conformance.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { audit, renderSarif } from '@/lib/x402/conformance';
import { resolveOrigin } from '@/lib/x402/payment-required';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Auditing an origin costs it real requests, so the fan-out is bounded. */
const MAX_PROBES = 40;
const DEFAULT_PROBES = 12;

/**
 * Refuse to point the prober at anything that is not a public origin.
 *
 * The endpoint takes a URL from the caller and fetches it server-side, which is
 * the shape of an SSRF. Hostnames that resolve inside a private network, and
 * every scheme but HTTPS, are rejected before a single request is made.
 */
function rejectionReason(origin: string): string | null {
  let url: URL;
  try {
    url = new URL(origin.includes('://') ? origin : `https://${origin}`);
  } catch {
    return 'origin is not a valid URL';
  }
  if (url.protocol !== 'https:') return 'origin must use https';
  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.startsWith('[') ||
    host === 'metadata.google.internal'
  ) {
    return 'origin must be a public hostname';
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const requested = searchParams.get('origin')?.trim();
  const target = requested || resolveOrigin(request);

  if (requested) {
    const reason = rejectionReason(requested);
    if (reason) {
      return NextResponse.json(
        { error: 'Invalid origin', code: 'INVALID_ORIGIN', message: reason },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } },
      );
    }
  }

  const probeLimit = Math.min(
    MAX_PROBES,
    Math.max(1, Number(searchParams.get('probe') ?? DEFAULT_PROBES) || DEFAULT_PROBES),
  );

  try {
    const report = await audit(target, {
      probeLimit,
      documentOnly: searchParams.get('documentOnly') === '1',
      timeoutMs: 8000,
      userAgent: 'x402-conformance/1.0 (+https://cryptocurrency.cv/x402/conformance)',
    });

    if (searchParams.get('format') === 'sarif') {
      return new NextResponse(renderSarif(report), {
        headers: {
          'content-type': 'application/sarif+json; charset=utf-8',
          'Cache-Control': 'public, max-age=60, s-maxage=60',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return NextResponse.json(report, {
      headers: {
        // Short, because the whole point is that the answer changes on deploy.
        'Cache-Control': 'public, max-age=60, s-maxage=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Audit failed',
        code: 'AUDIT_FAILED',
        message: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
