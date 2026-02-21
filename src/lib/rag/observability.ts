/**
 * RAG Observability & Tracing
 * 
 * Track and monitor RAG pipeline performance:
 * - Request/response logging
 * - Latency tracking
 * - Token usage
 * - Retrieval quality metrics
 * - Error tracking
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RAGSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'success' | 'error';
  attributes: Record<string, unknown>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, unknown>;
}

export interface RAGTrace {
  id: string;
  query: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'success' | 'error';
  spans: RAGSpan[];
  metrics: RAGMetrics;
  error?: string;
}

export interface RAGMetrics {
  // Latency
  totalLatencyMs: number;
  embeddingLatencyMs: number;
  retrievalLatencyMs: number;
  rerankingLatencyMs: number;
  generationLatencyMs: number;
  
  // Tokens
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  
  // Retrieval
  documentsRetrieved: number;
  documentsUsed: number;
  avgRetrievalScore: number;
  retrievalQuality: number;
  
  // Quality
  answerConfidence: number;
  attributionScore: number;
  hallucinationScore: number;
}

export interface AggregatedMetrics {
  period: string;
  totalQueries: number;
  successRate: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgTokensPerQuery: number;
  totalTokens: number;
  totalCost: number;
  avgRetrievalQuality: number;
  avgConfidence: number;
  topQueries: { query: string; count: number }[];
  errorRate: number;
  errorsByType: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════
// TRACER CLASS
// ═══════════════════════════════════════════════════════════════

class RAGTracer {
  private traces: Map<string, RAGTrace> = new Map();
  private maxTraces: number = 1000;
  private listeners: ((trace: RAGTrace) => void)[] = [];

  /**
   * Start a new trace
   */
  startTrace(query: string): RAGTrace {
    const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const trace: RAGTrace = {
      id,
      query,
      startTime: Date.now(),
      status: 'running',
      spans: [],
      metrics: this.initMetrics(),
    };

    this.traces.set(id, trace);
    this.cleanup();
    
    return trace;
  }

  /**
   * Start a span within a trace
   */
  startSpan(
    traceId: string,
    name: string,
    parentId?: string
  ): RAGSpan {
    const trace = this.traces.get(traceId);
    if (!trace) throw new Error(`Trace ${traceId} not found`);

    const span: RAGSpan = {
      id: `span_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      traceId,
      parentId,
      name,
      startTime: Date.now(),
      status: 'running',
      attributes: {},
      events: [],
    };

    trace.spans.push(span);
    return span;
  }

  /**
   * End a span
   */
  endSpan(
    traceId: string,
    spanId: string,
    status: 'success' | 'error' = 'success',
    attributes?: Record<string, unknown>
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const span = trace.spans.find(s => s.id === spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }
  }

  /**
   * Add event to span
   */
  addSpanEvent(
    traceId: string,
    spanId: string,
    name: string,
    attributes?: Record<string, unknown>
  ): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const span = trace.spans.find(s => s.id === spanId);
    if (!span) return;

    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  /**
   * Update trace metrics
   */
  updateMetrics(traceId: string, metrics: Partial<RAGMetrics>): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.metrics = { ...trace.metrics, ...metrics };
  }

  /**
   * End trace
   */
  endTrace(
    traceId: string,
    status: 'success' | 'error' = 'success',
    error?: string
  ): RAGTrace | undefined {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;
    trace.error = error;
    trace.metrics.totalLatencyMs = trace.duration;

    // Notify listeners
    this.listeners.forEach(listener => listener(trace));

    return trace;
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): RAGTrace | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get recent traces
   */
  getRecentTraces(limit: number = 100): RAGTrace[] {
    return Array.from(this.traces.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /**
   * Subscribe to trace completion
   */
  onTraceComplete(listener: (trace: RAGTrace) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(periodMinutes: number = 60): AggregatedMetrics {
    const cutoff = Date.now() - (periodMinutes * 60 * 1000);
    const recentTraces = Array.from(this.traces.values())
      .filter(t => t.startTime >= cutoff && t.endTime);

    if (recentTraces.length === 0) {
      return this.emptyAggregatedMetrics(periodMinutes);
    }

    const latencies = recentTraces
      .filter(t => t.duration)
      .map(t => t.duration!);
    const sortedLatencies = [...latencies].sort((a, b) => a - b);

    const errorTraces = recentTraces.filter(t => t.status === 'error');
    const errorsByType: Record<string, number> = {};
    for (const trace of errorTraces) {
      const errorType = trace.error?.split(':')[0] || 'unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    }

    // Count query frequency
    const queryCounts = new Map<string, number>();
    for (const trace of recentTraces) {
      const normalized = trace.query.toLowerCase().trim();
      queryCounts.set(normalized, (queryCounts.get(normalized) || 0) + 1);
    }
    const topQueries = Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    return {
      period: `${periodMinutes}m`,
      totalQueries: recentTraces.length,
      successRate: (recentTraces.length - errorTraces.length) / recentTraces.length,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50LatencyMs: sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0,
      p95LatencyMs: sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0,
      p99LatencyMs: sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0,
      avgTokensPerQuery: recentTraces.reduce((a, t) => a + t.metrics.totalTokens, 0) / recentTraces.length,
      totalTokens: recentTraces.reduce((a, t) => a + t.metrics.totalTokens, 0),
      totalCost: recentTraces.reduce((a, t) => a + t.metrics.estimatedCost, 0),
      avgRetrievalQuality: recentTraces.reduce((a, t) => a + t.metrics.retrievalQuality, 0) / recentTraces.length,
      avgConfidence: recentTraces.reduce((a, t) => a + t.metrics.answerConfidence, 0) / recentTraces.length,
      topQueries,
      errorRate: errorTraces.length / recentTraces.length,
      errorsByType,
    };
  }

  private initMetrics(): RAGMetrics {
    return {
      totalLatencyMs: 0,
      embeddingLatencyMs: 0,
      retrievalLatencyMs: 0,
      rerankingLatencyMs: 0,
      generationLatencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      documentsRetrieved: 0,
      documentsUsed: 0,
      avgRetrievalScore: 0,
      retrievalQuality: 0,
      answerConfidence: 0,
      attributionScore: 0,
      hallucinationScore: 0,
    };
  }

  private emptyAggregatedMetrics(periodMinutes: number): AggregatedMetrics {
    return {
      period: `${periodMinutes}m`,
      totalQueries: 0,
      successRate: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      avgTokensPerQuery: 0,
      totalTokens: 0,
      totalCost: 0,
      avgRetrievalQuality: 0,
      avgConfidence: 0,
      topQueries: [],
      errorRate: 0,
      errorsByType: {},
    };
  }

  private cleanup(): void {
    if (this.traces.size <= this.maxTraces) return;
    
    const sorted = Array.from(this.traces.entries())
      .sort((a, b) => a[1].startTime - b[1].startTime);
    
    const toDelete = sorted.slice(0, sorted.length - this.maxTraces);
    for (const [id] of toDelete) {
      this.traces.delete(id);
    }
  }
}

// Global tracer instance
export const ragTracer = new RAGTracer();

// ═══════════════════════════════════════════════════════════════
// DECORATORS / HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Helper to trace a function execution
 */
export async function withSpan<T>(
  traceId: string,
  spanName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, unknown>
): Promise<T> {
  const span = ragTracer.startSpan(traceId, spanName);
  
  try {
    const result = await fn();
    ragTracer.endSpan(traceId, span.id, 'success', attributes);
    return result;
  } catch (error) {
    ragTracer.endSpan(traceId, span.id, 'error', {
      ...attributes,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate cost based on tokens
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  // Groq pricing (approximate)
  const inputCostPer1k = 0.00005;
  const outputCostPer1k = 0.0001;
  
  return (
    (inputTokens / 1000) * inputCostPer1k +
    (outputTokens / 1000) * outputCostPer1k
  );
}

// ═══════════════════════════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════════════════════════

export interface RAGLogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  traceId?: string;
  message: string;
  data?: Record<string, unknown>;
}

class RAGLogger {
  private logs: RAGLogEntry[] = [];
  private maxLogs: number = 10000;

  log(
    level: RAGLogEntry['level'],
    message: string,
    traceId?: string,
    data?: Record<string, unknown>
  ): void {
    const entry: RAGLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      traceId,
      message,
      data,
    };

    this.logs.push(entry);
    
    // Console output in development
    const env = (globalThis as any).process?.env;
    if (env?.NODE_ENV === 'development') {
      const prefix = traceId ? `[${traceId}] ` : '';
      console[level](`[RAG] ${prefix}${message}`, data || '');
    }

    // Cleanup old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs / 2);
    }
  }

  debug(message: string, traceId?: string, data?: Record<string, unknown>): void {
    this.log('debug', message, traceId, data);
  }

  info(message: string, traceId?: string, data?: Record<string, unknown>): void {
    this.log('info', message, traceId, data);
  }

  warn(message: string, traceId?: string, data?: Record<string, unknown>): void {
    this.log('warn', message, traceId, data);
  }

  error(message: string, traceId?: string, data?: Record<string, unknown>): void {
    this.log('error', message, traceId, data);
  }

  getRecentLogs(limit: number = 100, level?: RAGLogEntry['level']): RAGLogEntry[] {
    let filtered = this.logs;
    if (level) {
      filtered = this.logs.filter(l => l.level === level);
    }
    return filtered.slice(-limit);
  }

  getLogsForTrace(traceId: string): RAGLogEntry[] {
    return this.logs.filter(l => l.traceId === traceId);
  }
}

export const ragLogger = new RAGLogger();
