/**
 * Batch API Endpoint
 *
 * POST /api/batch
 *
 * Allows API consumers to combine multiple API calls into a single HTTP
 * request, dramatically reducing latency and connection overhead.
 *
 * Instead of:
 *   GET /api/news?limit=5
 *   GET /api/prices?coins=bitcoin,ethereum
 *   GET /api/signals
 *
 * Consumers send one request:
 *   POST /api/batch
 *   {
 *     "requests": [
 *       { "id": "news",    "path": "/api/news?limit=5" },
 *       { "id": "prices",  "path": "/api/prices?coins=bitcoin,ethereum" },
 *       { "id": "signals", "path": "/api/signals" }
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "responses": [
 *       { "id": "news",    "status": 200, "body": { ... } },
 *       { "id": "prices",  "status": 200, "body": { ... } },
 *       { "id": "signals", "status": 200, "body": { ... } }
 *     ],
 *     "_meta": { "totalMs": 142, "count": 3 }
 *   }
 *
 * Limits:
 *   - Max 10 sub-requests per batch
 *   - Only GET requests supported (no mutations)
 *   - Only /api/* paths allowed (no page routes)
 *   - Inherits the caller's tier (free-tier caps apply per sub-request)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CACHE_CONTROL, generateETag, checkETagMatch } from '@/lib/api-utils';

export const runtime = 'edge';

const MAX_BATCH_SIZE = 10;
const BATCH_TIMEOUT_MS = 15_000; // 15 s total for the batch
const ALLOWED_PATH_PREFIX = '/api/';
// Paths that cannot be batched (admin, webhooks, batch itself)
const BLOCKED_PATHS = ['/api/batch', '/api/admin', '/api/webhooks', '/api/cron', '/api/ws', '/api/sse'];

interface BatchSubRequest {
  /** Caller-assigned ID echoed back in the response for matching */
  id: string;
  /** API path including query string, e.g. "/api/news?limit=5" */
  path: string;
}

interface BatchSubResponse {
  id: string;
  status: number;
  body: unknown;
  cachedMs?: number;
}

export async function POST(request: NextRequest) {
  const start = Date.now();
  const isFreeTier = request.headers.get('x-free-tier') === '1';

  let payload: { requests?: BatchSubRequest[] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  const requests = payload.requests;
  if (!Array.isArray(requests) || requests.length === 0) {
    return NextResponse.json(
      { error: 'Missing or empty "requests" array', code: 'INVALID_BODY' },
      { status: 400 },
    );
  }

  if (requests.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `Max ${MAX_BATCH_SIZE} sub-requests per batch`, code: 'BATCH_TOO_LARGE' },
      { status: 400 },
    );
  }

  // Validate each sub-request
  for (const r of requests) {
    if (!r.id || typeof r.id !== 'string') {
      return NextResponse.json(
        { error: 'Each sub-request must have a string "id"', code: 'INVALID_BODY' },
        { status: 400 },
      );
    }
    if (!r.path || typeof r.path !== 'string' || !r.path.startsWith(ALLOWED_PATH_PREFIX)) {
      return NextResponse.json(
        { error: `Sub-request "${r.id}": path must start with ${ALLOWED_PATH_PREFIX}`, code: 'INVALID_PATH' },
        { status: 400 },
      );
    }
    if (BLOCKED_PATHS.some((b) => r.path.startsWith(b))) {
      return NextResponse.json(
        { error: `Sub-request "${r.id}": path "${r.path}" cannot be batched`, code: 'BLOCKED_PATH' },
        { status: 400 },
      );
    }
  }

  // Execute sub-requests in parallel with a shared timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);

  const origin = request.nextUrl.origin;
  const forwardHeaders: Record<string, string> = {};
  // Forward authentication and tier headers to sub-requests
  for (const h of ['authorization', 'x-free-tier', 'x-api-key', 'x-speraxos-token', 'accept-language']) {
    const v = request.headers.get(h);
    if (v) forwardHeaders[h] = v;
  }
  if (isFreeTier) forwardHeaders['x-free-tier'] = '1';

  const results: BatchSubResponse[] = await Promise.all(
    requests.map(async (r): Promise<BatchSubResponse> => {
      const subStart = Date.now();
      try {
        const url = new URL(r.path, origin);
        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            ...forwardHeaders,
            'x-batch-request': '1', // sub-request marker
          },
          signal: controller.signal,
        });

        let body: unknown;
        try {
          body = await res.json();
        } catch {
          body = null;
        }

        return { id: r.id, status: res.status, body, cachedMs: Date.now() - subStart };
      } catch (err) {
        const message = (err as Error).name === 'AbortError' ? 'Timeout' : 'Fetch failed';
        return { id: r.id, status: 504, body: { error: message }, cachedMs: Date.now() - subStart };
      }
    }),
  );

  clearTimeout(timer);

  const responseData = {
    responses: results,
    _meta: {
      totalMs: Date.now() - start,
      count: results.length,
      ...(isFreeTier ? { free_tier: true, upgrade: 'https://cryptocurrency.cv/premium' } : {}),
    },
  };

  // ETag for the whole batch response
  const etag = generateETag(responseData);
  if (checkETagMatch(request, etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL.realtime },
    });
  }

  return NextResponse.json(responseData, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': CACHE_CONTROL.realtime,
      ETag: etag,
      Vary: 'Accept-Encoding',
    },
  });
}

/** Handle CORS preflight */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
