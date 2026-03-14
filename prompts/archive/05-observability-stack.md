# Prompt 05: Observability Stack (OpenTelemetry + Grafana)

## Context

The codebase already has `src/lib/telemetry.ts` with:
- OpenTelemetry trace/metric stubs (no-op when SDK not configured)
- `withSpan()` helper for wrapping async functions
- Metric counters for API requests, AI inferences, cache hits, circuit breaker trips
- Dynamic import of OTel SDK (only in Node runtime, not Edge)

**What's missing:**
- Actually instrumenting the hot paths (API routes, upstream fetches, AI calls)
- Grafana dashboard configs for visualization
- Alert rules for SLO violations
- Request-level trace context propagation
- Error budget tracking

## Task

### 1. Instrument Hot Paths

Wrap every category of work in spans:

#### API Route Middleware (`src/lib/telemetry-middleware.ts`)

Create a reusable wrapper for API routes:

```typescript
import { withSpan, metrics } from '@/lib/telemetry';

export function instrumented(
  handler: (req: NextRequest) => Promise<Response>,
  options: { name: string; attributes?: Record<string, string> }
) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const { name } = options;

    return withSpan(`api.${name}`, {
      'http.method': req.method,
      'http.url': req.url,
      ...options.attributes,
    }, async (span) => {
      try {
        const response = await handler(req);
        span.setAttribute('http.status_code', response.status);
        metrics.apiRequests.add(1, { endpoint: name, status: String(response.status) });
        metrics.apiLatency.record(Date.now() - start, { endpoint: name });
        return response;
      } catch (error) {
        span.setStatus({ code: 2, message: String(error) });
        span.recordException(error as Error);
        metrics.apiRequests.add(1, { endpoint: name, status: '500' });
        throw error;
      }
    });
  };
}
```

#### Upstream Fetch Instrumentation

Wrap the provider framework's `_fetchWithTimeout`:

```typescript
// In provider-chain.ts, the fetch already emits events.
// Add span creation to each fetch:

const data = await withSpan(`provider.fetch.${provider.name}`, {
  'provider.name': provider.name,
  'provider.priority': String(provider.priority),
}, async (span) => {
  const result = await breaker.execute(() => this._fetchWithTimeout(provider, params));
  span.setAttribute('provider.latency_ms', latencyMs);
  return result;
});
```

#### AI Inference Instrumentation

```typescript
// Every AI call should be traced:
const result = await withSpan('ai.inference', {
  'ai.model': modelName,
  'ai.provider': 'groq', // or 'openai', 'gemini'
  'ai.prompt_tokens': String(promptTokens),
}, async (span) => {
  const output = await callLLM(prompt);
  span.setAttribute('ai.completion_tokens', output.usage.completionTokens);
  span.setAttribute('ai.total_tokens', output.usage.totalTokens);
  metrics.aiInferences.add(1, { model: modelName });
  metrics.aiLatency.record(latencyMs, { model: modelName });
  return output;
});
```

### 2. Install OTel Dependencies

```bash
npm install @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/sdk-metrics \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/api
```

These are already dynamically imported in `telemetry.ts` — just need to install them so the imports resolve.

### 3. Grafana Dashboard

Create `infra/grafana/dashboards/api-overview.json` with panels for:

- **Request Rate** — req/s by endpoint, with 5xx error rate overlay
- **Latency Percentiles** — p50, p95, p99 by endpoint
- **Cache Hit Rate** — hits vs misses by cache type
- **Provider Health** — circuit breaker states, success rates per provider
- **AI Usage** — inferences/min, tokens consumed, cost estimate
- **WebSocket** — connection count, messages/s, subscription distribution
- **Error Budget** — SLO: 99.9% availability, burn rate visualization

### 4. Alert Rules

Create `infra/grafana/alerts.yaml`:

```yaml
groups:
  - name: api-slo
    rules:
      - alert: HighErrorRate
        expr: rate(api_requests_total{status=~"5.."}[5m]) / rate(api_requests_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate exceeds 1% for 5 minutes"

      - alert: HighLatency
        expr: histogram_quantile(0.99, api_latency_ms) > 5000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency exceeds 5s"

      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state{state="OPEN"} > 0
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker open for {{ $labels.provider }}"

      - alert: CacheHitRateLow
        expr: rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.7
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below 70%"
```

### 5. Docker Compose Addition

Add Grafana + Prometheus to `docker-compose.scale.yml`:

```yaml
prometheus:
  image: prom/prometheus:v2.50.0
  volumes:
    - ./infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:10.3.0
  volumes:
    - ./infra/grafana/dashboards:/var/lib/grafana/dashboards
    - ./infra/grafana/provisioning:/etc/grafana/provisioning
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Environment Variables

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=free-crypto-news
OTEL_ENABLED=true

# Or for cloud (Grafana Cloud, Honeycomb, etc.)
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer xxx"
```

## Success Criteria

- [ ] OTel SDK dependencies installed and `initTelemetry()` actually initializes
- [ ] Top 10 API routes instrumented with spans + metrics
- [ ] Provider framework emits spans for each upstream fetch
- [ ] AI inference calls traced with token counts
- [ ] Grafana dashboard JSON created with 7+ panels
- [ ] Alert rules for error rate, latency, circuit breaker, cache hit rate
- [ ] Docker compose includes Prometheus + Grafana
- [ ] Traces visible in local Jaeger/Grafana Tempo
