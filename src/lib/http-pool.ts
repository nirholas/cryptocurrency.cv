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
 * HTTP Connection Pool
 *
 * Provides a shared `fetch` wrapper that reuses TCP connections via undici's
 * Agent (the engine behind Node.js's built-in `fetch`).
 *
 * Why this matters:
 *  - Node.js's global `fetch` uses a default undici dispatcher with generic
 *    defaults (no total-socket cap, no per-origin tuning).  Under high fan-out
 *    to many upstream APIs (CoinGecko, DeFiLlama, Mempool, Binance, …) the
 *    defaults risk socket exhaustion and excessive TLS handshakes.
 *  - This module creates a shared Agent with explicit keep-alive, per-origin
 *    connection limits, and idle timeouts.
 *  - On the Edge runtime (Vercel / Cloudflare Workers) the runtime's own pool
 *    is used — no undici needed.
 *
 * @module lib/http-pool
 */

// ---------------------------------------------------------------------------
// Edge runtime detection
// ---------------------------------------------------------------------------

const isEdgeRuntime: boolean = (() => {
  try {
    // Vercel Edge sets globalThis.EdgeRuntime = 'edge-runtime'
    if (typeof (globalThis as Record<string, unknown>).EdgeRuntime === 'string') return true;
    // Cloudflare Workers have no `process` global
    if (typeof process === 'undefined') return true;
    // Bun & Deno have their own pooled fetch
    if (typeof (globalThis as Record<string, unknown>).Bun !== 'undefined') return true;
    if (typeof (globalThis as Record<string, unknown>).Deno !== 'undefined') return true;
  } catch {
    // In the unlikely case any check throws, assume Node.js
  }
  return false;
})();

// ---------------------------------------------------------------------------
// Undici Agent (Node.js only — lazy-initialised)
// ---------------------------------------------------------------------------

// Minimal interface for undici's Agent — avoids requiring the `undici` npm
// package at type-check time (Node.js bundles undici but doesn't ship a
// top-level @types entry).
interface UndiciAgent {
  close(): Promise<void>;
  stats?: Record<string, number>;
}

let _agent: UndiciAgent | undefined;

function getAgent(): UndiciAgent {
  if (_agent) return _agent;

   
  const { Agent } = require('undici') as { Agent: new (opts: Record<string, unknown>) => UndiciAgent };

  _agent = new Agent({
    keepAliveTimeout: 30_000,      // idle socket TTL
    keepAliveMaxTimeout: 60_000,   // upper bound after server Keep-Alive hints
    pipelining: 1,                 // safe default; some upstreams reject pipelining
    connections: 64,               // max sockets per origin (host:port)
    connect: { timeout: 10_000 },  // TCP + TLS handshake timeout
    bodyTimeout: 30_000,           // time to receive full response body
    headersTimeout: 15_000,        // time to receive response headers
  });

  return _agent;
}

// ---------------------------------------------------------------------------
// pooledFetch — drop-in replacement for global fetch
// ---------------------------------------------------------------------------

/**
 * A `fetch` wrapper that routes through a shared undici Agent on Node.js,
 * providing connection pooling, keep-alive, and per-origin socket limits.
 *
 * On Edge runtimes it delegates directly to the global `fetch`.
 *
 * ```ts
 * import { pooledFetch } from '@/lib/http-pool';
 * const res = await pooledFetch('https://api.coingecko.com/api/v3/...');
 * ```
 */
export function pooledFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (isEdgeRuntime) return fetch(input, init);

  return fetch(input, {
    ...init,
    // `dispatcher` is the undici-native way to specify a connection pool.
    // Node.js's built-in fetch passes this straight through to undici.
    // @ts-expect-error -- valid for Node.js fetch (undici) but absent from DOM RequestInit
    dispatcher: getAgent(),
  });
}

// ---------------------------------------------------------------------------
// Stats (useful for /api/health or monitoring dashboards)
// ---------------------------------------------------------------------------

export interface PoolStats {
  runtime: 'edge' | 'node';
  connected: number;
  free: number;
  pending: number;
  running: number;
  size: number;
}

/** Return current connection pool statistics. */
export function getPoolStats(): PoolStats {
  if (isEdgeRuntime || !_agent) {
    return { runtime: isEdgeRuntime ? 'edge' : 'node', connected: 0, free: 0, pending: 0, running: 0, size: 0 };
  }

  // undici Agent may expose aggregate stats — fall back to zeroes if unavailable
  const stats = (_agent as unknown as Record<string, Record<string, number>>).stats ?? {};
  return {
    runtime: 'node',
    connected: stats.connected ?? 0,
    free: stats.free ?? 0,
    pending: stats.pending ?? 0,
    running: stats.running ?? 0,
    size: stats.size ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Graceful shutdown helper
// ---------------------------------------------------------------------------

/** Close all pooled sockets.  Call on SIGTERM / process exit. */
export async function destroyPool(): Promise<void> {
  if (_agent) {
    await _agent.close();
    _agent = undefined;
  }
}
