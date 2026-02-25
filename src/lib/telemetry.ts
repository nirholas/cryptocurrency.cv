/**
 * OpenTelemetry Instrumentation
 *
 * Distributed tracing, metrics, and structured logging for the entire
 * request lifecycle. Every API call, AI inference, cache lookup, and
 * upstream fetch is captured as a span in a trace.
 *
 * Architecture:
 *   Browser → Next.js Edge/Node → CoinGecko / Gemini / Groq / RSS feeds
 *            └── OTel Traces → GCP Cloud Trace / Jaeger / Grafana Tempo
 *            └── OTel Metrics → Prometheus / GCP Cloud Monitoring
 *
 * Configuration:
 *   OTEL_EXPORTER_OTLP_ENDPOINT  — OTLP collector URL (e.g. http://localhost:4318)
 *   OTEL_EXPORTER_OTLP_HEADERS   — Auth headers (e.g. "Authorization=Bearer ...")
 *   OTEL_SERVICE_NAME             — Override service name (default: free-crypto-news)
 *   GCP_PROJECT_ID                — Enable GCP Cloud Trace exporter
 *
 * Usage:
 *   import { trace, metrics, withSpan } from '@/lib/telemetry';
 *
 *   // Automatic span wrapping
 *   const data = await withSpan('fetchCoinGecko', { url }, async (span) => {
 *     span.setAttribute('cache.hit', false);
 *     return fetch(url);
 *   });
 *
 *   // Manual counter
 *   metrics.apiRequests.add(1, { endpoint: '/api/news', status: 200 });
 *
 * @module telemetry
 */

// ---------------------------------------------------------------------------
// Types (mirrors OpenTelemetry API without requiring the full SDK at import)
// ---------------------------------------------------------------------------

export interface Span {
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(status: { code: SpanStatusCode; message?: string }): void;
  recordException(error: Error | string): void;
  end(): void;
  /** Whether this is a real OTel span or a no-op */
  isRecording(): boolean;
}

export enum SpanStatusCode {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

interface Tracer {
  startSpan(name: string, options?: { attributes?: Record<string, string | number | boolean> }): Span;
}

interface Counter {
  add(value: number, attributes?: Record<string, string | number | boolean>): void;
}

interface Histogram {
  record(value: number, attributes?: Record<string, string | number | boolean>): void;
}

// ---------------------------------------------------------------------------
// No-op implementations (used when OTel SDK is not available)
// ---------------------------------------------------------------------------

const noopSpan: Span = {
  setAttribute: () => {},
  setStatus: () => {},
  recordException: () => {},
  end: () => {},
  isRecording: () => false,
};

const noopTracer: Tracer = {
  startSpan: () => noopSpan,
};

const noopCounter: Counter = {
  add: () => {},
};

const noopHistogram: Histogram = {
  record: () => {},
};

// ---------------------------------------------------------------------------
// State — lazy init so import is free
// ---------------------------------------------------------------------------

let _initialized = false;
let _tracer: Tracer = noopTracer;

// ---------------------------------------------------------------------------
// Metrics (always available — no-op if OTel not configured)
// ---------------------------------------------------------------------------

export const metrics = {
  /** Total API requests (counter) */
  apiRequests: noopCounter as Counter,
  /** API request duration in ms (histogram) */
  apiLatency: noopHistogram as Histogram,
  /** AI model inference count */
  aiInferences: noopCounter as Counter,
  /** AI inference latency in ms */
  aiLatency: noopHistogram as Histogram,
  /** AI cost in micro-USD */
  aiCostMicro: noopCounter as Counter,
  /** Cache hits */
  cacheHits: noopCounter as Counter,
  /** Cache misses */
  cacheMisses: noopCounter as Counter,
  /** Upstream fetch count (CoinGecko, RSS, etc.) */
  upstreamFetches: noopCounter as Counter,
  /** Upstream fetch latency */
  upstreamLatency: noopHistogram as Histogram,
  /** Circuit breaker state changes */
  circuitBreakerTrips: noopCounter as Counter,
  /** WebSocket active connections */
  wsConnections: noopCounter as Counter,
  /** Rate limit blocks */
  rateLimitBlocks: noopCounter as Counter,
};

// ---------------------------------------------------------------------------
// Initialize (called once, typically in instrumentation.ts or server startup)
// ---------------------------------------------------------------------------

/**
 * Initialize OpenTelemetry SDK.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 * Safe to call in Edge runtime — degrades gracefully to no-ops.
 *
 * Environment variables:
 *   OTEL_EXPORTER_OTLP_ENDPOINT — enables OTLP export
 *   GCP_PROJECT_ID — enables GCP Cloud Trace
 *   OTEL_ENABLED=false — explicitly disable
 */
export async function initTelemetry(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  // Explicitly disabled
  if (process.env.OTEL_ENABLED === 'false') return;

  // Skip in Edge runtime (no Node.js APIs)
  if (typeof globalThis.EdgeRuntime !== 'undefined') return;

  // Skip during build
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  // Need at least one exporter endpoint
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const gcpProject = process.env.GCP_PROJECT_ID;
  if (!otlpEndpoint && !gcpProject) return;

  try {
    // Dynamic imports to avoid bundling OTel in Edge/client builds
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { Resource } = await import('@opentelemetry/resources');
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = await import('@opentelemetry/semantic-conventions');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
    const { PeriodicExportingMetricReader } = await import('@opentelemetry/sdk-metrics');
    const otelApi = await import('@opentelemetry/api');

    const resource = new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'free-crypto-news',
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '2.0.0',
      'deployment.environment': process.env.NODE_ENV || 'development',
    });

    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint ? `${otlpEndpoint}/v1/traces` : undefined,
      headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    });

    const metricExporter = new OTLPMetricExporter({
      url: otlpEndpoint ? `${otlpEndpoint}/v1/metrics` : undefined,
      headers: parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      metricReader: new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 30_000,
      }),
    });

    sdk.start();

    // Wire up our tracer
    _tracer = otelApi.trace.getTracer('free-crypto-news', '2.0.0');

    // Wire up our metrics
    const meter = otelApi.metrics.getMeter('free-crypto-news', '2.0.0');

    metrics.apiRequests = meter.createCounter('api.requests', { description: 'Total API requests', unit: '1' });
    metrics.apiLatency = meter.createHistogram('api.latency', { description: 'API request latency', unit: 'ms' });
    metrics.aiInferences = meter.createCounter('ai.inferences', { description: 'AI model inferences', unit: '1' });
    metrics.aiLatency = meter.createHistogram('ai.latency', { description: 'AI inference latency', unit: 'ms' });
    metrics.aiCostMicro = meter.createCounter('ai.cost', { description: 'AI cost in micro-USD', unit: 'uUSD' });
    metrics.cacheHits = meter.createCounter('cache.hits', { description: 'Cache hits', unit: '1' });
    metrics.cacheMisses = meter.createCounter('cache.misses', { description: 'Cache misses', unit: '1' });
    metrics.upstreamFetches = meter.createCounter('upstream.fetches', { description: 'Upstream API fetches', unit: '1' });
    metrics.upstreamLatency = meter.createHistogram('upstream.latency', { description: 'Upstream fetch latency', unit: 'ms' });
    metrics.circuitBreakerTrips = meter.createCounter('circuit_breaker.trips', { description: 'Circuit breaker trips', unit: '1' });
    metrics.wsConnections = meter.createCounter('ws.connections', { description: 'WebSocket connections', unit: '1' });
    metrics.rateLimitBlocks = meter.createCounter('rate_limit.blocks', { description: 'Rate limit blocks', unit: '1' });

    console.info('[OTel] Initialized — traces → %s, metrics every 30s', otlpEndpoint || 'GCP');

    // Graceful shutdown
    const shutdown = async () => {
      await sdk.shutdown();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    // OTel packages not installed — degrade gracefully
    console.debug('[OTel] SDK not available (install @opentelemetry/sdk-node to enable):', (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Tracing Helpers
// ---------------------------------------------------------------------------

/**
 * Wrap an async function in a trace span.
 *
 * The span is automatically ended and errors are recorded.
 *
 * @example
 *   const data = await withSpan('fetchNews', { source: 'rss' }, async (span) => {
 *     span.setAttribute('articles.count', 42);
 *     return fetchNewsFromRSS();
 *   });
 */
export async function withSpan<T>(
  name: string,
  attributes: Record<string, string | number | boolean>,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const span = _tracer.startSpan(name, { attributes });
  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (err) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
    span.recordException(err instanceof Error ? err : new Error(String(err)));
    throw err;
  } finally {
    span.end();
  }
}

/**
 * Create a child span (useful inside already-traced functions).
 */
export function startSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>,
): Span {
  return _tracer.startSpan(name, { attributes });
}

// ---------------------------------------------------------------------------
// Structured Logging (correlates with trace IDs)
// ---------------------------------------------------------------------------

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  [key: string]: unknown;
}

/**
 * Structured logger that includes trace context.
 *
 * Outputs JSON in production, human-readable in development.
 */
export function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'free-crypto-news',
    ...data,
  };

  const fn = level === 'error' ? console.error :
             level === 'warn' ? console.warn :
             level === 'debug' ? console.debug : console.info;

  if (process.env.NODE_ENV === 'production') {
    fn(JSON.stringify(entry));
  } else {
    fn(`[${level.toUpperCase()}] ${message}`, data || '');
  }
}

// ---------------------------------------------------------------------------
// Middleware Helper — instrument API routes
// ---------------------------------------------------------------------------

/**
 * Create a traced API handler wrapper.
 *
 * @example
 *   export const GET = traceHandler('GET /api/news', async (request) => {
 *     // your handler logic
 *   });
 */
export function traceHandler(
  operationName: string,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const start = Date.now();
    const url = new URL(request.url);

    return withSpan(operationName, {
      'http.method': request.method,
      'http.url': url.pathname,
      'http.host': url.host,
    }, async (span) => {
      try {
        const response = await handler(request);

        const latency = Date.now() - start;
        span.setAttribute('http.status_code', response.status);
        span.setAttribute('http.response_time_ms', latency);

        metrics.apiRequests.add(1, { endpoint: url.pathname, status: response.status });
        metrics.apiLatency.record(latency, { endpoint: url.pathname });

        return response;
      } catch (err) {
        metrics.apiRequests.add(1, { endpoint: url.pathname, status: 500 });
        throw err;
      }
    });
  };
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function parseHeaders(headerStr?: string): Record<string, string> | undefined {
  if (!headerStr) return undefined;
  const headers: Record<string, string> = {};
  for (const pair of headerStr.split(',')) {
    const [key, ...valueParts] = pair.split('=');
    if (key && valueParts.length) {
      headers[key.trim()] = valueParts.join('=').trim();
    }
  }
  return headers;
}
