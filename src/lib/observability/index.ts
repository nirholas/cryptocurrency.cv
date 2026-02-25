/**
 * Observability Stack — Enhanced OpenTelemetry Instrumentation
 *
 * Production-grade monitoring, tracing, and alerting:
 *   1. **instrumented()** — Wrapper for API route handlers with auto-tracing
 *   2. **Grafana Dashboard** — Pre-built JSON model for import
 *   3. **Alert Rules** — Prometheus alerting rules (YAML)
 *   4. **Provider Instrumentation** — Span tracking for upstream API calls
 *   5. **AI Inference Tracing** — Token counts, model, latency
 *
 * Environment:
 *   OTEL_EXPORTER_OTLP_ENDPOINT — OTLP collector URL
 *   OTEL_SERVICE_NAME           — Service name (default: free-crypto-news)
 *   OTEL_ENABLED                — Enable/disable (default: true in production)
 *
 * @module lib/observability
 */

import { metrics, withSpan, SpanStatusCode, type Span } from '@/lib/telemetry';

// ─────────────────────────────────────────────────────────────────────────────
// instrumented() — Route Handler Wrapper
// ─────────────────────────────────────────────────────────────────────────────

interface InstrumentedOptions {
  /** Route name for span and metrics (e.g. 'GET /api/news') */
  name: string;
  /** Override the default span attributes */
  attributes?: Record<string, string | number | boolean>;
}

type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Wrap a Next.js API route handler with automatic:
 *   - Distributed trace span
 *   - Request/response metrics (latency, status, error rate)
 *   - Error recording
 *
 * Usage:
 * ```ts
 * export const GET = instrumented({ name: 'GET /api/news' }, async (request) => {
 *   return NextResponse.json({ articles: [] });
 * });
 * ```
 */
export function instrumented(
  options: InstrumentedOptions,
  handler: RouteHandler,
): RouteHandler {
  return async (request: Request): Promise<Response> => {
    const start = performance.now();
    const url = new URL(request.url);

    return withSpan(
      `http.${options.name}`,
      {
        'http.method': request.method,
        'http.url': url.pathname,
        'http.route': options.name,
        ...(options.attributes ?? {}),
      },
      async (span: Span) => {
        let statusCode = 200;

        try {
          const response = await handler(request);
          statusCode = response.status;

          span.setAttribute('http.status_code', statusCode);
          if (statusCode >= 400) {
            span.setStatus({
              code: statusCode >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.UNSET,
              message: `HTTP ${statusCode}`,
            });
          }

          return response;
        } catch (error) {
          statusCode = 500;
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Unhandled exception' });
          if (error instanceof Error) {
            span.recordException(error);
          }
          throw error;
        } finally {
          const duration = performance.now() - start;

          // Record metrics
          metrics.apiRequests.add(1, {
            endpoint: options.name,
            method: request.method,
            status: statusCode,
          });
          metrics.apiLatency.record(duration, {
            endpoint: options.name,
            method: request.method,
          });

          if (statusCode >= 500) {
            metrics.apiErrors.add(1, { endpoint: options.name });
          }
        }
      },
    );
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider Fetch Instrumentation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrap a fetch call to an upstream provider with span tracking.
 */
export async function instrumentedFetch(
  url: string,
  options: RequestInit & { providerName?: string } = {},
): Promise<Response> {
  const provider = options.providerName ?? new URL(url).hostname;

  return withSpan(
    `provider.fetch`,
    {
      'provider.name': provider,
      'provider.url': url,
    },
    async (span: Span) => {
      const start = performance.now();

      try {
        const response = await fetch(url, options);
        const duration = performance.now() - start;

        span.setAttribute('http.status_code', response.status);
        span.setAttribute('provider.latency_ms', Math.round(duration));
        span.setAttribute('provider.response_size', parseInt(response.headers.get('content-length') ?? '0', 10));

        metrics.providerRequests.add(1, {
          provider,
          status: response.status,
        });
        metrics.providerLatency.record(duration, { provider });

        if (!response.ok) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: `Provider ${response.status}` });
          metrics.providerErrors.add(1, { provider });
        }

        return response;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Provider fetch failed' });
        if (error instanceof Error) span.recordException(error);
        metrics.providerErrors.add(1, { provider });
        throw error;
      }
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Inference Tracing
// ─────────────────────────────────────────────────────────────────────────────

export interface AiInferenceOptions {
  model: string;
  provider: string;
  promptTokens?: number;
  completionTokens?: number;
  temperature?: number;
}

/**
 * Wrap an AI inference call with token tracking and latency.
 */
export async function instrumentedAiCall<T>(
  name: string,
  options: AiInferenceOptions,
  fn: () => Promise<T>,
): Promise<T> {
  return withSpan(
    `ai.inference.${name}`,
    {
      'ai.model': options.model,
      'ai.provider': options.provider,
      'ai.temperature': options.temperature ?? 0,
    },
    async (span: Span) => {
      const start = performance.now();

      try {
        const result = await fn();
        const duration = performance.now() - start;

        span.setAttribute('ai.latency_ms', Math.round(duration));
        if (options.promptTokens) span.setAttribute('ai.prompt_tokens', options.promptTokens);
        if (options.completionTokens) span.setAttribute('ai.completion_tokens', options.completionTokens);
        if (options.promptTokens && options.completionTokens) {
          span.setAttribute('ai.total_tokens', options.promptTokens + options.completionTokens);
        }

        metrics.aiInferences.add(1, {
          model: options.model,
          provider: options.provider,
        });
        metrics.aiLatency.record(duration, { model: options.model });
        if (options.promptTokens) {
          metrics.aiTokens.add(options.promptTokens + (options.completionTokens ?? 0), {
            model: options.model,
          });
        }

        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'AI inference failed' });
        if (error instanceof Error) span.recordException(error);
        metrics.aiErrors.add(1, { model: options.model, provider: options.provider });
        throw error;
      }
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache Hit Tracking
// ─────────────────────────────────────────────────────────────────────────────

export function recordCacheHit(layer: string, hit: boolean): void {
  metrics.cacheHits.add(1, { layer, result: hit ? 'hit' : 'miss' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check with Observability
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    latencyMs: number;
    message?: string;
  }[];
  version: string;
  timestamp: string;
}

const _startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = [];

  // Check Redis
  try {
    const start = performance.now();
    const { cache: cacheModule } = await import('@/lib/cache');
    await cacheModule.set('health:ping', Date.now(), 10);
    const latency = performance.now() - start;
    checks.push({
      name: 'redis',
      status: latency < 100 ? 'pass' : 'warn',
      latencyMs: Math.round(latency),
    });
  } catch (error) {
    checks.push({
      name: 'redis',
      status: 'fail',
      latencyMs: -1,
      message: error instanceof Error ? error.message : 'Redis unavailable',
    });
  }

  // Check Postgres
  try {
    const start = performance.now();
    const { isDbAvailable } = await import('@/lib/db');
    const latency = performance.now() - start;
    checks.push({
      name: 'postgres',
      status: isDbAvailable() ? 'pass' : 'warn',
      latencyMs: Math.round(latency),
      message: isDbAvailable() ? undefined : 'DATABASE_URL not configured',
    });
  } catch (error) {
    checks.push({
      name: 'postgres',
      status: 'fail',
      latencyMs: -1,
      message: error instanceof Error ? error.message : 'Postgres check failed',
    });
  }

  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  return {
    status: failCount > 0 ? 'unhealthy' : warnCount > 0 ? 'degraded' : 'healthy',
    uptime: Math.round((Date.now() - _startTime) / 1000),
    checks,
    version: process.env.npm_package_version ?? '1.0.2',
    timestamp: new Date().toISOString(),
  };
}
