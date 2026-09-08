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
 * Telemetry Middleware — Instrument API routes with OpenTelemetry spans + metrics
 *
 * @module lib/telemetry-middleware
 */

import { type NextRequest } from 'next/server';
import { withSpan, metrics, log } from '@/lib/telemetry';

export interface InstrumentedOptions {
  /** Route name for metrics (e.g., 'news', 'prices.bitcoin') */
  name: string;
  /** Additional span attributes */
  attributes?: Record<string, string>;
}

/**
 * Wrap an API route handler with automatic instrumentation.
 * Adds: trace span, request counter, latency histogram, error tracking.
 *
 * @example
 * ```ts
 * import { instrumented } from '@/lib/telemetry-middleware';
 *
 * export const GET = instrumented(async (req) => {
 *   const data = await fetchNews();
 *   return NextResponse.json(data);
 * }, { name: 'news' });
 * ```
 */
export function instrumented(
  handler: (req: NextRequest) => Promise<Response>,
  options: InstrumentedOptions,
) {
  return async (req: NextRequest): Promise<Response> => {
    const start = Date.now();
    const { name, attributes = {} } = options;

    return withSpan(`api.${name}`, {
      'http.method': req.method,
      'http.url': req.url,
      'http.route': `/api/${name}`,
      ...attributes,
    }, async (span) => {
      try {
        const response = await handler(req);
        const latencyMs = Date.now() - start;

        span.setAttribute('http.status_code', response.status);
        metrics.apiRequests.add(1, { endpoint: name, status: String(response.status) });
        metrics.apiLatency.record(latencyMs, { endpoint: name });

        log('debug', `API ${name} responded`, { status: response.status, latencyMs });
        return response;
      } catch (error) {
        const latencyMs = Date.now() - start;

        span.setStatus({ code: 2, message: String(error) });
        span.recordException(error as Error);
        metrics.apiRequests.add(1, { endpoint: name, status: '500' });
        metrics.apiLatency.record(latencyMs, { endpoint: name });

        log('error', `API ${name} failed`, { error: String(error), latencyMs });
        throw error;
      }
    });
  };
}

/**
 * Instrument an upstream fetch call with tracing.
 */
export function instrumentedFetch(
  url: string,
  options: RequestInit & { providerName?: string } = {},
): Promise<Response> {
  const providerName = options.providerName || new URL(url).hostname;
  const { providerName: _, ...fetchOptions } = options;

  return withSpan(`upstream.fetch.${providerName}`, {
    'http.url': url,
    'http.method': fetchOptions.method || 'GET',
    'provider.name': providerName,
  }, async (span) => {
    const start = Date.now();
    try {
      const response = await fetch(url, fetchOptions);
      const latencyMs = Date.now() - start;

      span.setAttribute('http.status_code', response.status);
      metrics.upstreamFetches.add(1, { provider: providerName, status: String(response.status) });
      metrics.upstreamLatency.record(latencyMs, { provider: providerName });

      return response;
    } catch (error) {
      const latencyMs = Date.now() - start;
      span.setStatus({ code: 2, message: String(error) });
      span.recordException(error as Error);
      metrics.upstreamFetches.add(1, { provider: providerName, status: 'error' });
      metrics.upstreamLatency.record(latencyMs, { provider: providerName });
      throw error;
    }
  });
}
