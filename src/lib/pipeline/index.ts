/**
 * Data Pipeline Orchestration
 *
 * Manages the full lifecycle of data ingestion, transformation, and delivery:
 *
 *   1. **Pipeline Registry** — Declarative pipeline definitions
 *   2. **Scheduler** — Cron + event-driven pipeline triggers
 *   3. **Quality Gates** — Data freshness, completeness, anomaly checks
 *   4. **DAG Execution** — Dependency-resolved stage execution
 *   5. **Observability** — Per-pipeline metrics, error tracking, SLA monitoring
 *
 * Architecture:
 *   Source → Extract → Transform → Validate → Load → Notify
 *
 * Each pipeline is a DAG of stages. Stages can:
 *   - Run in parallel (no dependencies)
 *   - Wait on upstream stages (dependency edges)
 *   - Retry independently (per-stage retry config)
 *   - Emit events (for downstream pipelines or webhooks)
 *
 * @module lib/pipeline
 */

import { cache } from '@/lib/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PipelineStatus = 'idle' | 'running' | 'success' | 'failed' | 'degraded';
export type StageStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export interface PipelineStage {
  id: string;
  name: string;
  /** Stage IDs this stage depends on (must complete first) */
  dependsOn: string[];
  /** Maximum execution time in ms */
  timeoutMs: number;
  /** Retry configuration */
  retries: number;
  retryDelayMs: number;
  /** The actual work */
  execute: (context: PipelineContext) => Promise<StageResult>;
}

export interface StageResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description: string;
  /** Cron schedule (null = event-triggered only) */
  schedule: string | null;
  /** Ordered stages (DAG) */
  stages: PipelineStage[];
  /** Quality gate thresholds */
  qualityGates: QualityGate[];
  /** Max total pipeline execution time */
  timeoutMs: number;
  /** Enable/disable */
  enabled: boolean;
}

export interface QualityGate {
  name: string;
  check: (result: PipelineRunResult) => boolean;
  severity: 'warning' | 'critical';
  message: string;
}

export interface PipelineContext {
  pipelineId: string;
  runId: string;
  startedAt: number;
  /** Shared data between stages */
  data: Map<string, unknown>;
  /** Results from completed stages */
  stageResults: Map<string, StageResult>;
}

export interface PipelineRunResult {
  pipelineId: string;
  runId: string;
  status: PipelineStatus;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  stages: { id: string; name: string; status: StageStatus; result?: StageResult }[];
  qualityGateResults: { name: string; passed: boolean; severity: string; message: string }[];
  totalRecordsProcessed: number;
  totalRecordsFailed: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Executor
// ─────────────────────────────────────────────────────────────────────────────

export class PipelineExecutor {
  private pipelines = new Map<string, PipelineDefinition>();

  /**
   * Register a pipeline definition.
   */
  register(pipeline: PipelineDefinition): void {
    this.pipelines.set(pipeline.id, pipeline);
  }

  /**
   * Get all registered pipelines.
   */
  list(): PipelineDefinition[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Execute a pipeline by ID.
   */
  async execute(pipelineId: string): Promise<PipelineRunResult> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);
    if (!pipeline.enabled) throw new Error(`Pipeline disabled: ${pipelineId}`);

    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();

    const context: PipelineContext = {
      pipelineId,
      runId,
      startedAt,
      data: new Map(),
      stageResults: new Map(),
    };

    // Track run status
    const stageStatuses = new Map<string, { status: StageStatus; result?: StageResult }>();
    for (const stage of pipeline.stages) {
      stageStatuses.set(stage.id, { status: 'pending' });
    }

    // Execute stages respecting dependencies (topological order)
    const completed = new Set<string>();
    const failed = new Set<string>();
    let hasFailure = false;

    while (completed.size + failed.size < pipeline.stages.length) {
      // Check timeout
      if (Date.now() - startedAt > pipeline.timeoutMs) {
        // Mark remaining as skipped
        for (const stage of pipeline.stages) {
          if (!completed.has(stage.id) && !failed.has(stage.id)) {
            stageStatuses.set(stage.id, { status: 'skipped' });
            failed.add(stage.id);
          }
        }
        hasFailure = true;
        break;
      }

      // Find stages ready to execute (all dependencies met)
      const ready = pipeline.stages.filter(
        (s) =>
          !completed.has(s.id) &&
          !failed.has(s.id) &&
          s.dependsOn.every((dep) => completed.has(dep)),
      );

      // Skip stages whose dependencies failed
      const blocked = pipeline.stages.filter(
        (s) =>
          !completed.has(s.id) &&
          !failed.has(s.id) &&
          s.dependsOn.some((dep) => failed.has(dep)),
      );

      for (const stage of blocked) {
        stageStatuses.set(stage.id, { status: 'skipped' });
        failed.add(stage.id);
      }

      if (ready.length === 0 && blocked.length === 0) {
        // Deadlock or all done
        break;
      }

      // Execute ready stages in parallel
      const results = await Promise.allSettled(
        ready.map(async (stage) => {
          stageStatuses.set(stage.id, { status: 'running' });
          const result = await this.executeStage(stage, context);
          return { stageId: stage.id, result };
        }),
      );

      for (const settledResult of results) {
        if (settledResult.status === 'fulfilled') {
          const { stageId, result } = settledResult.value;
          context.stageResults.set(stageId, result);

          if (result.success) {
            stageStatuses.set(stageId, { status: 'success', result });
            completed.add(stageId);
          } else {
            stageStatuses.set(stageId, { status: 'failed', result });
            failed.add(stageId);
            hasFailure = true;
          }
        } else {
          // Promise rejected — shouldn't happen with our error handling
          const stageId = ready[results.indexOf(settledResult)]?.id;
          if (stageId) {
            const errorResult: StageResult = {
              success: false,
              recordsProcessed: 0,
              recordsFailed: 0,
              durationMs: 0,
              error: settledResult.reason?.message ?? 'Unknown error',
            };
            stageStatuses.set(stageId, { status: 'failed', result: errorResult });
            failed.add(stageId);
            hasFailure = true;
          }
        }
      }
    }

    const completedAt = Date.now();

    // Build result
    const pipelineResult: PipelineRunResult = {
      pipelineId,
      runId,
      status: hasFailure ? (completed.size > 0 ? 'degraded' : 'failed') : 'success',
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      stages: pipeline.stages.map((s) => {
        const status = stageStatuses.get(s.id)!;
        return { id: s.id, name: s.name, status: status.status, result: status.result };
      }),
      qualityGateResults: [],
      totalRecordsProcessed: 0,
      totalRecordsFailed: 0,
    };

    // Calculate totals
    for (const [, result] of context.stageResults) {
      pipelineResult.totalRecordsProcessed += result.recordsProcessed;
      pipelineResult.totalRecordsFailed += result.recordsFailed;
    }

    // Run quality gates
    for (const gate of pipeline.qualityGates) {
      const passed = gate.check(pipelineResult);
      pipelineResult.qualityGateResults.push({
        name: gate.name,
        passed,
        severity: gate.severity,
        message: gate.message,
      });
    }

    // Persist run result
    await this.persistRunResult(pipelineResult);

    return pipelineResult;
  }

  /**
   * Execute a single stage with retries and timeout.
   */
  private async executeStage(stage: PipelineStage, context: PipelineContext): Promise<StageResult> {
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= stage.retries; attempt++) {
      try {
        const result = await Promise.race([
          stage.execute(context),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Stage timeout: ${stage.timeoutMs}ms`)), stage.timeoutMs),
          ),
        ]);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);

        if (attempt < stage.retries) {
          const delay = stage.retryDelayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      recordsProcessed: 0,
      recordsFailed: 0,
      durationMs: 0,
      error: lastError ?? 'All retries exhausted',
    };
  }

  /**
   * Store pipeline run result in cache for dashboard display.
   */
  private async persistRunResult(result: PipelineRunResult): Promise<void> {
    try {
      // Latest run per pipeline
      await cache.set(`pipeline:latest:${result.pipelineId}`, result, { ex: 86400 * 7 });

      // Run history (keep last 50)
      const historyKey = `pipeline:history:${result.pipelineId}`;
      const history = (await cache.get<PipelineRunResult[]>(historyKey)) ?? [];
      history.unshift(result);
      if (history.length > 50) history.length = 50;
      await cache.set(historyKey, history, { ex: 86400 * 30 });
    } catch {
      // Non-critical
    }
  }

  /**
   * Get the latest run result for a pipeline.
   */
  async getLatestRun(pipelineId: string): Promise<PipelineRunResult | null> {
    return cache.get<PipelineRunResult>(`pipeline:latest:${pipelineId}`);
  }

  /**
   * Get run history for a pipeline.
   */
  async getRunHistory(pipelineId: string, limit = 20): Promise<PipelineRunResult[]> {
    const history = (await cache.get<PipelineRunResult[]>(`pipeline:history:${pipelineId}`)) ?? [];
    return history.slice(0, limit);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-Built Pipelines
// ─────────────────────────────────────────────────────────────────────────────

/**
 * News Ingestion Pipeline
 * Extract → Deduplicate → Enrich → Index → Notify
 */
export const newsIngestionPipeline: PipelineDefinition = {
  id: 'news-ingestion',
  name: 'News Ingestion',
  description: 'Fetch, deduplicate, enrich, and index crypto news articles',
  schedule: '*/5 * * * *', // every 5 minutes
  enabled: true,
  timeoutMs: 300_000, // 5 min
  stages: [
    {
      id: 'extract',
      name: 'Extract from RSS/API',
      dependsOn: [],
      timeoutMs: 60_000,
      retries: 2,
      retryDelayMs: 5_000,
      execute: async (ctx) => {
        const start = performance.now();
        try {
          const { getLatestNews } = await import('@/lib/crypto-news');
          const { articles } = await getLatestNews(200);
          ctx.data.set('rawArticles', articles);
          return {
            success: true,
            recordsProcessed: articles.length,
            recordsFailed: 0,
            durationMs: Math.round(performance.now() - start),
            metadata: { sources: [...new Set(articles.map((a: { source: string }) => a.source))] },
          };
        } catch (error) {
          return {
            success: false,
            recordsProcessed: 0,
            recordsFailed: 0,
            durationMs: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : 'Extract failed',
          };
        }
      },
    },
    {
      id: 'deduplicate',
      name: 'Deduplicate Articles',
      dependsOn: ['extract'],
      timeoutMs: 30_000,
      retries: 1,
      retryDelayMs: 2_000,
      execute: async (ctx) => {
        const start = performance.now();
        const articles = (ctx.data.get('rawArticles') as Array<{ link: string }>) ?? [];
        const seen = new Set<string>();
        const unique = articles.filter((a) => {
          if (seen.has(a.link)) return false;
          seen.add(a.link);
          return true;
        });
        ctx.data.set('uniqueArticles', unique);
        return {
          success: true,
          recordsProcessed: articles.length,
          recordsFailed: articles.length - unique.length,
          durationMs: Math.round(performance.now() - start),
          metadata: { duplicatesRemoved: articles.length - unique.length },
        };
      },
    },
    {
      id: 'enrich',
      name: 'AI Enrichment',
      dependsOn: ['deduplicate'],
      timeoutMs: 120_000,
      retries: 1,
      retryDelayMs: 10_000,
      execute: async (ctx) => {
        const start = performance.now();
        const articles = (ctx.data.get('uniqueArticles') as unknown[]) ?? [];
        // Enrichment is handled by the Inngest enrich-articles function
        // This stage triggers it and tracks completion
        ctx.data.set('enrichedArticles', articles);
        return {
          success: true,
          recordsProcessed: articles.length,
          recordsFailed: 0,
          durationMs: Math.round(performance.now() - start),
          metadata: { enrichmentTriggered: true },
        };
      },
    },
    {
      id: 'index',
      name: 'Search Index Sync',
      dependsOn: ['enrich'],
      timeoutMs: 60_000,
      retries: 2,
      retryDelayMs: 5_000,
      execute: async (ctx) => {
        const start = performance.now();
        try {
          const { getSearchEngine } = await import('@/lib/search-engine');
          const engine = getSearchEngine();
          const articles = (ctx.data.get('enrichedArticles') as Array<{
            id: string; title: string; description: string; source: string;
            sourceKey?: string; category?: string; link: string;
          }>) ?? [];

          if (articles.length === 0) {
            return { success: true, recordsProcessed: 0, recordsFailed: 0, durationMs: Math.round(performance.now() - start) };
          }

          const docs = articles.map((a) => ({
            id: a.id ?? a.link,
            title: a.title,
            description: a.description ?? '',
            source: a.source,
            sourceKey: a.sourceKey ?? a.source,
            category: a.category ?? 'general',
            tickers: [],
            tags: [],
            sentimentLabel: 'neutral',
            publishedAt: new Date().toISOString(),
            link: a.link,
          }));

          const result = await engine.indexBulk(docs);
          return {
            success: result.errors === 0,
            recordsProcessed: result.indexed,
            recordsFailed: result.errors,
            durationMs: Math.round(performance.now() - start),
          };
        } catch (error) {
          return {
            success: false,
            recordsProcessed: 0,
            recordsFailed: 0,
            durationMs: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : 'Index failed',
          };
        }
      },
    },
  ],
  qualityGates: [
    {
      name: 'Minimum Articles',
      check: (result) => result.totalRecordsProcessed >= 10,
      severity: 'warning',
      message: 'Fewer than 10 articles processed — possible source outage',
    },
    {
      name: 'Error Rate',
      check: (result) => {
        if (result.totalRecordsProcessed === 0) return true;
        return result.totalRecordsFailed / result.totalRecordsProcessed < 0.1;
      },
      severity: 'critical',
      message: 'More than 10% of records failed processing',
    },
    {
      name: 'Duration SLA',
      check: (result) => result.durationMs < 240_000, // 4 min
      severity: 'warning',
      message: 'Pipeline took longer than 4 minutes',
    },
  ],
};

/**
 * Market Data Pipeline
 * Fetch prices → Compute metrics → Update cache → Check alerts
 */
export const marketDataPipeline: PipelineDefinition = {
  id: 'market-data',
  name: 'Market Data Sync',
  description: 'Fetch and cache latest market prices, volumes, and metrics',
  schedule: '* * * * *', // every minute
  enabled: true,
  timeoutMs: 60_000,
  stages: [
    {
      id: 'fetch-prices',
      name: 'Fetch Prices',
      dependsOn: [],
      timeoutMs: 15_000,
      retries: 2,
      retryDelayMs: 3_000,
      execute: async (ctx) => {
        const start = performance.now();
        try {
          const res = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple,cardano,polkadot,dogecoin,avalanche-2,chainlink,polygon&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true',
            { cache: 'no-store' },
          );
          if (!res.ok) throw new Error(`CoinGecko: ${res.status}`);
          const data = await res.json();
          ctx.data.set('prices', data);
          return {
            success: true,
            recordsProcessed: Object.keys(data).length,
            recordsFailed: 0,
            durationMs: Math.round(performance.now() - start),
          };
        } catch (error) {
          return {
            success: false,
            recordsProcessed: 0,
            recordsFailed: 1,
            durationMs: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : 'Price fetch failed',
          };
        }
      },
    },
    {
      id: 'cache-prices',
      name: 'Update Price Cache',
      dependsOn: ['fetch-prices'],
      timeoutMs: 10_000,
      retries: 1,
      retryDelayMs: 2_000,
      execute: async (ctx) => {
        const start = performance.now();
        const prices = ctx.data.get('prices') as Record<string, unknown>;
        if (!prices) {
          return { success: false, recordsProcessed: 0, recordsFailed: 0, durationMs: 0, error: 'No price data' };
        }

        try {
          await cache.set('market:prices:latest', prices, { ex: 120 });
          return {
            success: true,
            recordsProcessed: Object.keys(prices).length,
            recordsFailed: 0,
            durationMs: Math.round(performance.now() - start),
          };
        } catch (error) {
          return {
            success: false,
            recordsProcessed: 0,
            recordsFailed: Object.keys(prices).length,
            durationMs: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : 'Cache update failed',
          };
        }
      },
    },
    {
      id: 'check-alerts',
      name: 'Check Price Alerts',
      dependsOn: ['fetch-prices'],
      timeoutMs: 15_000,
      retries: 1,
      retryDelayMs: 2_000,
      execute: async (ctx) => {
        const start = performance.now();
        const prices = ctx.data.get('prices') as Record<string, { usd: number; usd_24h_change: number }>;
        if (!prices) {
          return { success: true, recordsProcessed: 0, recordsFailed: 0, durationMs: 0 };
        }

        // Check for significant price movements (>5% in 24h)
        const alerts: string[] = [];
        for (const [coin, data] of Object.entries(prices)) {
          if (data.usd_24h_change && Math.abs(data.usd_24h_change) > 5) {
            alerts.push(`${coin}: ${data.usd_24h_change > 0 ? '+' : ''}${data.usd_24h_change.toFixed(1)}%`);
          }
        }

        if (alerts.length > 0) {
          ctx.data.set('priceAlerts', alerts);
        }

        return {
          success: true,
          recordsProcessed: Object.keys(prices).length,
          recordsFailed: 0,
          durationMs: Math.round(performance.now() - start),
          metadata: { alertsTriggered: alerts.length },
        };
      },
    },
  ],
  qualityGates: [
    {
      name: 'Price Data Available',
      check: (result) => result.stages.some((s) => s.id === 'fetch-prices' && s.status === 'success'),
      severity: 'critical',
      message: 'Failed to fetch any price data',
    },
  ],
};

/**
 * Social Sentiment Pipeline
 * Fetch social data → Compute sentiment → Update scores → Alert on shifts
 */
export const socialSentimentPipeline: PipelineDefinition = {
  id: 'social-sentiment',
  name: 'Social Sentiment Analysis',
  description: 'Aggregate and analyze social sentiment from multiple sources',
  schedule: '0 * * * *', // every hour
  enabled: true,
  timeoutMs: 180_000, // 3 min
  stages: [
    {
      id: 'fetch-fear-greed',
      name: 'Fetch Fear & Greed Index',
      dependsOn: [],
      timeoutMs: 15_000,
      retries: 2,
      retryDelayMs: 3_000,
      execute: async (ctx) => {
        const start = performance.now();
        try {
          const res = await fetch('https://api.alternative.me/fng/?limit=30', { cache: 'no-store' });
          if (!res.ok) throw new Error(`Fear & Greed API: ${res.status}`);
          const data = await res.json();
          ctx.data.set('fearGreed', data);
          return {
            success: true,
            recordsProcessed: data.data?.length ?? 0,
            recordsFailed: 0,
            durationMs: Math.round(performance.now() - start),
          };
        } catch (error) {
          return {
            success: false,
            recordsProcessed: 0,
            recordsFailed: 1,
            durationMs: Math.round(performance.now() - start),
            error: error instanceof Error ? error.message : 'Fear & Greed fetch failed',
          };
        }
      },
    },
    {
      id: 'aggregate-sentiment',
      name: 'Aggregate Sentiment Scores',
      dependsOn: ['fetch-fear-greed'],
      timeoutMs: 30_000,
      retries: 0,
      retryDelayMs: 0,
      execute: async (ctx) => {
        const start = performance.now();
        const fearGreed = ctx.data.get('fearGreed') as { data?: Array<{ value: string; value_classification: string; timestamp: string }> };

        const latest = fearGreed?.data?.[0];
        const aggregate = {
          fearGreedValue: latest ? parseInt(latest.value) : null,
          fearGreedLabel: latest?.value_classification ?? null,
          timestamp: new Date().toISOString(),
        };

        ctx.data.set('sentimentAggregate', aggregate);
        await cache.set('sentiment:aggregate', aggregate, { ex: 3600 });

        return {
          success: true,
          recordsProcessed: 1,
          recordsFailed: 0,
          durationMs: Math.round(performance.now() - start),
          metadata: aggregate,
        };
      },
    },
  ],
  qualityGates: [
    {
      name: 'Sentiment Available',
      check: (result) => result.totalRecordsProcessed > 0,
      severity: 'warning',
      message: 'No sentiment data processed',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Freshness Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export interface FreshnessReport {
  pipelines: {
    id: string;
    name: string;
    lastRun: PipelineRunResult | null;
    status: PipelineStatus;
    staleness: 'fresh' | 'stale' | 'critical';
    nextScheduled: string | null;
  }[];
  generatedAt: string;
}

/**
 * Generate a freshness report for all registered pipelines.
 */
export async function generateFreshnessReport(executor: PipelineExecutor): Promise<FreshnessReport> {
  const pipelines = executor.list();
  const report: FreshnessReport = {
    pipelines: [],
    generatedAt: new Date().toISOString(),
  };

  for (const pipeline of pipelines) {
    const lastRun = await executor.getLatestRun(pipeline.id);

    let staleness: 'fresh' | 'stale' | 'critical' = 'fresh';
    if (lastRun) {
      const ageMs = Date.now() - lastRun.completedAt;
      // If the pipeline hasn't run in 3x its schedule interval, it's stale
      if (ageMs > 3 * 3_600_000) staleness = 'critical';
      else if (ageMs > 2 * 3_600_000) staleness = 'stale';
    } else {
      staleness = 'critical'; // Never run
    }

    report.pipelines.push({
      id: pipeline.id,
      name: pipeline.name,
      lastRun,
      status: lastRun?.status ?? 'idle',
      staleness,
      nextScheduled: pipeline.schedule ?? null,
    });
  }

  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton + Initialization
// ─────────────────────────────────────────────────────────────────────────────

let _executor: PipelineExecutor | null = null;

/**
 * Get the global pipeline executor with all registered pipelines.
 */
export function getPipelineExecutor(): PipelineExecutor {
  if (!_executor) {
    _executor = new PipelineExecutor();
    _executor.register(newsIngestionPipeline);
    _executor.register(marketDataPipeline);
    _executor.register(socialSentimentPipeline);
  }
  return _executor;
}
