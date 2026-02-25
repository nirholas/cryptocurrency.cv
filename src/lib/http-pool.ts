/**
 * HTTP Connection Pool
 *
 * Provides a shared `fetch` that reuses TCP connections via a keep-alive
 * Agent, preventing socket exhaustion under high concurrency.
 *
 * On the Edge runtime (no `http`/`https` modules) this falls back
 * transparently to the global `fetch` which already uses the runtime's
 * built-in connection pool.
 *
 * @module lib/http-pool
 */

 

// ---------------------------------------------------------------------------
// Shared keep-alive agents (Node.js only — lazy-initialised)
// ---------------------------------------------------------------------------

let _httpAgent: InstanceType<typeof import('http').Agent> | undefined;
let _httpsAgent: InstanceType<typeof import('https').Agent> | undefined;

function getHttpAgent() {
  if (!_httpAgent) {
    // Dynamic require so Edge builds don't blow up
    const http = require('http') as typeof import('http');
    _httpAgent = new http.Agent({
      keepAlive: true,
      keepAliveMsecs: 30_000,
      maxSockets: 128,       // per host
      maxTotalSockets: 512,  // across all hosts
      maxFreeSockets: 64,
      timeout: 30_000,
      scheduling: 'lifo',    // reuse the most-recently-freed socket → fewer idle
    });
  }
  return _httpAgent;
}

function getHttpsAgent() {
  if (!_httpsAgent) {
    const https = require('https') as typeof import('https');
    _httpsAgent = new https.Agent({
      keepAlive: true,
      keepAliveMsecs: 30_000,
      maxSockets: 128,
      maxTotalSockets: 512,
      maxFreeSockets: 64,
      timeout: 30_000,
      scheduling: 'lifo',
    });
  }
  return _httpsAgent;
}

// ---------------------------------------------------------------------------
// Detect Edge runtime
// ---------------------------------------------------------------------------

const isEdge =
  typeof (globalThis as Record<string, unknown>).EdgeRuntime !== 'undefined' ||
  typeof (globalThis as Record<string, unknown>).__NEXT_DATA__ === 'undefined';

// ---------------------------------------------------------------------------
// pooledFetch — drop-in replacement for global fetch
// ---------------------------------------------------------------------------

/**
 * A `fetch` wrapper that routes through a shared keep-alive Agent on Node.js.
 * On Edge runtimes it delegates directly to the global `fetch`.
 *
 * Usage:
 * ```ts
 * import { pooledFetch } from '@/lib/http-pool';
 * const res = await pooledFetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
 * ```
 */
export function pooledFetch(
  input: RequestInfo | URL,
  init?: RequestInit & { agent?: unknown },
): Promise<Response> {
  // Edge runtime → global fetch already pooled
  if (isEdge) return fetch(input, init);

  // Node.js → inject the correct keep-alive agent
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  const agent = url.startsWith('https') ? getHttpsAgent() : getHttpAgent();

  return fetch(input, {
    ...init,
    // Node.js fetch accepts `agent` but the DOM typings don't expose it
    agent: init?.agent ?? agent,
     
  } as any);
}

// ---------------------------------------------------------------------------
// Stats (useful for /api/health or monitoring)
// ---------------------------------------------------------------------------

export interface PoolStats {
  runtime: 'edge' | 'node';
  http?: { sockets: number; freeSockets: number; requests: number };
  https?: { sockets: number; freeSockets: number; requests: number };
}

/** Return current agent socket stats (Node.js only). */
export function getPoolStats(): PoolStats {
  if (isEdge) return { runtime: 'edge' };

  const count = (obj?: Record<string, unknown[]>) =>
    obj ? Object.values(obj).reduce((n, arr) => n + arr.length, 0) : 0;

  const ha = _httpAgent as unknown as {
    sockets?: Record<string, unknown[]>;
    freeSockets?: Record<string, unknown[]>;
    requests?: Record<string, unknown[]>;
  } | undefined;
  const hsa = _httpsAgent as unknown as typeof ha;

  return {
    runtime: 'node',
    http: ha
      ? { sockets: count(ha.sockets), freeSockets: count(ha.freeSockets), requests: count(ha.requests) }
      : undefined,
    https: hsa
      ? { sockets: count(hsa.sockets), freeSockets: count(hsa.freeSockets), requests: count(hsa.requests) }
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Graceful shutdown helper
// ---------------------------------------------------------------------------

export function destroyPool(): void {
  _httpAgent?.destroy();
  _httpsAgent?.destroy();
  _httpAgent = undefined;
  _httpsAgent = undefined;
}
