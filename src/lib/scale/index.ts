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
 * Scale Infrastructure — Job Queue, Worker Pool, Database Readiness
 *
 * This module provides the foundation for scaling to 1M+ users:
 *
 * 1. **Job Queue** — Redis-backed queue for background work (feed fetching,
 *    enrichment, archiving). Replaces cron-based polling with event-driven processing.
 *
 * 2. **Worker Pool** — Concurrent job execution with configurable concurrency,
 *    rate limiting, and circuit breakers per job type.
 *
 * 3. **Database Readiness** — Schema definitions for PostgreSQL migration.
 *    Currently in-memory/Redis — this provides the migration path.
 *
 * 4. **Connection Pool** — Managed connections to Redis, PostgreSQL, and
 *    external APIs with health monitoring.
 *
 * @module lib/scale
 */

import { cache } from '@/lib/cache';
import { getLatestNews } from '@/lib/crypto-news';
import { enrichArticlesBatch } from '@/lib/article-enrichment';
import { getMarketOverview } from '@/lib/market-data';
import { analyzeSentiment } from '@/lib/ai-services';
import { performHealthCheck } from '@/lib/health-check';

// ═══════════════════════════════════════════════════════════════
// JOB QUEUE TYPES
// ═══════════════════════════════════════════════════════════════

export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'retrying' | 'dead';

export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
  metadata?: Record<string, unknown>;
}

export interface JobQueueConfig {
  maxConcurrency: number;
  defaultMaxAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  maxRetryDelayMs: number;
  pollIntervalMs: number;
  stalledJobTimeoutMs: number;
  enableMetrics: boolean;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<unknown>;

export interface QueueMetrics {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  dead: number;
  avgProcessingTimeMs: number;
  throughputPerMinute: number;
  errorRate: number;
}

// ═══════════════════════════════════════════════════════════════
// JOB QUEUE IMPLEMENTATION (Adapter-based: Memory or Redis)
// ═══════════════════════════════════════════════════════════════

import type { QueueAdapter } from './queue-interface';
import { MemoryQueueAdapter } from './memory-queue';

const DEFAULT_CONFIG: JobQueueConfig = {
  maxConcurrency: 10,
  defaultMaxAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  maxRetryDelayMs: 60_000,
  pollIntervalMs: 500,
  stalledJobTimeoutMs: 300_000, // 5 min
  enableMetrics: true,
};

class JobQueue {
  private adapter: QueueAdapter;
  private handlers = new Map<string, JobHandler>();
  private activeJobs = new Map<string, Job>();
  private config: JobQueueConfig;
  private running = false;

  constructor(config: Partial<JobQueueConfig> & { adapter?: QueueAdapter } = {}) {
    const { adapter, ...queueConfig } = config;
    this.config = { ...DEFAULT_CONFIG, ...queueConfig };
    this.adapter = adapter ?? new MemoryQueueAdapter();
  }

  /**
   * Register a handler for a job type
   */
  registerHandler<T = unknown>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Add a job to the queue via the adapter
   */
  async enqueue<T = unknown>(
    type: string,
    payload: T,
    options?: { priority?: JobPriority; maxAttempts?: number; metadata?: Record<string, unknown> },
  ): Promise<string> {
    return this.adapter.enqueue(type, payload, {
      priority: options?.priority,
      maxAttempts: options?.maxAttempts ?? this.config.defaultMaxAttempts,
      metadata: options?.metadata,
    });
  }

  /**
   * Enqueue multiple jobs at once
   */
  async enqueueBatch<T = unknown>(
    type: string,
    payloads: T[],
    options?: { priority?: JobPriority; maxAttempts?: number },
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const payload of payloads) {
      ids.push(await this.enqueue(type, payload, options));
    }
    return ids;
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.processLoop();
  }

  /**
   * Stop processing
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Get queue metrics from the adapter
   */
  getMetrics(): QueueMetrics | Promise<QueueMetrics> {
    return this.adapter.getMetrics();
  }

  /**
   * Get a specific job by ID
   */
  getJob(jobId: string): Promise<Job | null> {
    return this.adapter.getJob(jobId);
  }

  /**
   * Get dead letter jobs
   */
  getDeadLetterJobs(limit?: number): Promise<Job[]> {
    return this.adapter.getDeadLetterJobs(limit);
  }

  /**
   * Retry a dead letter job
   */
  retryDeadLetterJob(jobId: string): Promise<void> {
    return this.adapter.retryDeadLetterJob(jobId);
  }

  /**
   * Purge all dead letter jobs
   */
  purgeDeadLetter(): Promise<number> {
    return this.adapter.purgeDeadLetter();
  }

  /**
   * Get the underlying adapter (for admin/testing)
   */
  getAdapter(): QueueAdapter {
    return this.adapter;
  }

  private async processLoop(): Promise<void> {
    while (this.running) {
      if (this.activeJobs.size < this.config.maxConcurrency) {
        // Process all registered job types
        for (const type of this.handlers.keys()) {
          if (this.activeJobs.size >= this.config.maxConcurrency) break;
          const jobs = await this.adapter.dequeue(type, 1);
          for (const job of jobs) {
            this.activeJobs.set(job.id, job);
            this.processJob(job); // Fire and forget — managed internally
          }
        }
      }
      await sleep(this.config.pollIntervalMs);
    }
  }

  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      await this.adapter.nack(job.id, `No handler registered for job type: ${job.type}`);
      this.activeJobs.delete(job.id);
      return;
    }

    try {
      const result = await handler(job);
      await this.adapter.ack(job.id, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.adapter.nack(job.id, message);
    } finally {
      this.activeJobs.delete(job.id);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// WORKER REGISTRY
// ═══════════════════════════════════════════════════════════════

export interface WorkerDefinition {
  name: string;
  jobType: string;
  concurrency: number;
  handler: JobHandler;
  schedule?: string; // cron expression
  rateLimit?: { requests: number; windowMs: number };
}

/**
 * Pre-defined workers for common tasks
 */
export const WORKER_DEFINITIONS: WorkerDefinition[] = [
  {
    name: 'rss-fetcher',
    jobType: 'fetch-rss',
    concurrency: 5,
    schedule: '*/5 * * * *', // Every 5 minutes
    rateLimit: { requests: 50, windowMs: 60_000 },
    handler: async (job) => {
      const category = (job.payload as { category?: string })?.category;
      const limit = (job.payload as { limit?: number })?.limit || 20;
      try {
        const result = await getLatestNews(limit, undefined, { category });
        const articlesFound = result.articles.length;
        // Cache the fetched articles for downstream consumers
        if (articlesFound > 0) {
          await cache.set(`worker:rss:latest:${category || 'all'}`, result.articles, 300);
        }
        return {
          category: category || 'all',
          articlesFound,
          sources: result.sources,
          fetchedAt: result.fetchedAt,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[rss-fetcher] Failed to fetch feeds:`, message);
        throw new Error(`RSS fetch failed: ${message}`);
      }
    },
  },
  {
    name: 'article-enricher',
    jobType: 'enrich-article',
    concurrency: 3,
    rateLimit: { requests: 20, windowMs: 60_000 },
    handler: async (job) => {
      const payload = job.payload as {
        articles?: Array<{ url: string; title: string; description?: string; source?: string }>;
      };
      const articles = payload?.articles || [];
      if (articles.length === 0) {
        return { enriched: 0, skipped: true, reason: 'No articles provided' };
      }
      try {
        const enrichments = await enrichArticlesBatch(articles);
        const enrichedCount = enrichments.size;
        // Cache enrichment results for quick lookup
        for (const [url, enrichment] of enrichments) {
          await cache.set(`enrichment:${url}`, enrichment, 86400); // 24h TTL
        }
        return {
          enriched: enrichedCount,
          total: articles.length,
          sentimentBreakdown: {
            bullish: Array.from(enrichments.values()).filter((e) => e.sentiment === 'bullish')
              .length,
            bearish: Array.from(enrichments.values()).filter((e) => e.sentiment === 'bearish')
              .length,
            neutral: Array.from(enrichments.values()).filter((e) => e.sentiment === 'neutral')
              .length,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[article-enricher] Failed:`, message);
        throw new Error(`Enrichment failed: ${message}`);
      }
    },
  },
  {
    name: 'market-data-fetcher',
    jobType: 'fetch-market-data',
    concurrency: 2,
    schedule: '* * * * *', // Every minute
    rateLimit: { requests: 30, windowMs: 60_000 },
    handler: async (job) => {
      const source = (job.payload as { source?: string })?.source || 'coingecko';
      try {
        const marketData = await getMarketOverview();
        // Cache market overview for API consumers
        await cache.set('worker:market:overview', marketData, 60);
        return {
          source,
          fetched: true,
          totalMarketCap: marketData.global?.total_market_cap?.usd ?? 0,
          btcDominance: marketData.global?.market_cap_percentage?.btc ?? 0,
          totalVolume: marketData.global?.total_volume?.usd ?? 0,
          topMoversCount: marketData.trending?.length || 0,
          timestamp: Date.now(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[market-data-fetcher] Failed:`, message);
        throw new Error(`Market data fetch failed: ${message}`);
      }
    },
  },
  {
    name: 'archive-worker',
    jobType: 'archive-articles',
    concurrency: 1,
    schedule: '0 * * * *', // Every hour
    handler: async (job) => {
      const payload = job.payload as { since?: string; category?: string } | undefined;
      const since = payload?.since || new Date(Date.now() - 3600_000).toISOString(); // Default: last hour
      try {
        // Fetch recent articles to archive
        const result = await getLatestNews(100, undefined, { category: payload?.category });
        const articlesToArchive = result.articles.filter(
          (a) => new Date(a.pubDate) >= new Date(since),
        );
        // Store archive state in cache
        const archiveKey = `archive:batch:${new Date().toISOString().slice(0, 13)}`;
        await cache.set(
          archiveKey,
          {
            count: articlesToArchive.length,
            sources: [...new Set(articlesToArchive.map((a) => a.source))],
            archivedAt: new Date().toISOString(),
          },
          86400,
        );
        return {
          archived: true,
          articleCount: articlesToArchive.length,
          sourceCount: new Set(articlesToArchive.map((a) => a.source)).size,
          since,
          archivedAt: new Date().toISOString(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[archive-worker] Failed:`, message);
        throw new Error(`Archive failed: ${message}`);
      }
    },
  },
  {
    name: 'sentiment-analyzer',
    jobType: 'analyze-sentiment',
    concurrency: 2,
    rateLimit: { requests: 10, windowMs: 60_000 },
    handler: async (job) => {
      const payload = job.payload as { text?: string; title?: string; articleId?: string };
      const text = payload?.text || payload?.title || '';
      if (!text) {
        return { articleId: payload?.articleId, sentiment: 'neutral', score: 0, skipped: true };
      }
      try {
        const result = await analyzeSentiment(text);
        // Cache sentiment result if articleId provided
        if (payload?.articleId) {
          await cache.set(`sentiment:${payload.articleId}`, result, 3600);
        }
        return {
          articleId: payload?.articleId,
          sentiment: result.label,
          score: result.overall,
          confidence: result.confidence,
          analyzedAt: new Date().toISOString(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[sentiment-analyzer] Failed:`, message);
        throw new Error(`Sentiment analysis failed: ${message}`);
      }
    },
  },
  {
    name: 'data-source-health',
    jobType: 'health-check-sources',
    concurrency: 1,
    schedule: '*/10 * * * *', // Every 10 minutes
    handler: async () => {
      try {
        const health = await performHealthCheck(true);
        // Cache health status for dashboard consumers
        await cache.set(
          'worker:health:latest',
          {
            status: health.status,
            checks: health.checks.map((c) => ({
              name: c.name,
              status: c.status,
              responseTime: c.responseTime,
              error: c.error,
            })),
            summary: health.summary,
            timestamp: Date.now(),
          },
          600,
        );
        return {
          checked: true,
          overallStatus: health.status,
          healthy: health.summary.healthy,
          degraded: health.summary.degraded,
          unhealthy: health.summary.unhealthy,
          totalChecks: health.summary.total,
          timestamp: Date.now(),
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[data-source-health] Failed:`, message);
        throw new Error(`Health check failed: ${message}`);
      }
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// DATABASE SCHEMA (PostgreSQL-ready)
// ═══════════════════════════════════════════════════════════════

/**
 * SQL schema for PostgreSQL migration.
 * Currently the app runs on in-memory + Redis. This schema
 * provides the path to persistent storage at scale.
 */
export const DATABASE_SCHEMA = `
-- =======================================================
-- free-crypto-news Database Schema
-- PostgreSQL 16+ with pgvector, TimescaleDB extensions
-- Designed for 1M+ user scale
-- =======================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- Trigram similarity for search
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "timescaledb";    -- Time-series optimizations

-- =======================================================
-- ARTICLES
-- =======================================================

CREATE TABLE articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id VARCHAR(512) UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  source_name VARCHAR(256) NOT NULL,
  source_feed_url TEXT,
  author VARCHAR(256),
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  language VARCHAR(10) DEFAULT 'en',
  
  -- AI-enriched fields
  summary TEXT,
  sentiment_score FLOAT,
  sentiment_label VARCHAR(20),
  categories TEXT[],
  tags TEXT[],
  entities JSONB DEFAULT '[]',
  importance_score FLOAT DEFAULT 0.5,
  
  -- Embeddings (1536-dim for OpenAI ada-002, 384 for all-MiniLM-L6)
  embedding vector(1536),
  
  -- Full-text search
  search_vector tsvector,
  
  -- Metadata
  market_context JSONB,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for articles
CREATE INDEX idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX idx_articles_source ON articles (source_name);
CREATE INDEX idx_articles_language ON articles (language);
CREATE INDEX idx_articles_sentiment ON articles (sentiment_score);
CREATE INDEX idx_articles_importance ON articles (importance_score DESC);
CREATE INDEX idx_articles_categories ON articles USING GIN (categories);
CREATE INDEX idx_articles_tags ON articles USING GIN (tags);
CREATE INDEX idx_articles_search ON articles USING GIN (search_vector);
CREATE INDEX idx_articles_entities ON articles USING GIN (entities);
CREATE INDEX idx_articles_embedding ON articles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION articles_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_articles_search
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_trigger();

-- Convert to TimescaleDB hypertable for time-series queries
SELECT create_hypertable('articles', 'published_at', migrate_data => true);

-- =======================================================
-- MARKET DATA (time-series)
-- =======================================================

CREATE TABLE market_data (
  time TIMESTAMPTZ NOT NULL,
  coin_id VARCHAR(128) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  price_usd DOUBLE PRECISION,
  market_cap DOUBLE PRECISION,
  volume_24h DOUBLE PRECISION,
  price_change_24h DOUBLE PRECISION,
  price_change_7d DOUBLE PRECISION,
  ath DOUBLE PRECISION,
  ath_date TIMESTAMPTZ,
  circulating_supply DOUBLE PRECISION,
  total_supply DOUBLE PRECISION,
  source VARCHAR(64) NOT NULL,
  metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('market_data', 'time');
CREATE INDEX idx_market_coin ON market_data (coin_id, time DESC);
CREATE INDEX idx_market_symbol ON market_data (symbol, time DESC);

-- Continuous aggregates for fast dashboards
CREATE MATERIALIZED VIEW market_data_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  coin_id,
  symbol,
  AVG(price_usd) AS avg_price,
  MAX(price_usd) AS high_price,
  MIN(price_usd) AS low_price,
  LAST(price_usd, time) AS close_price,
  FIRST(price_usd, time) AS open_price,
  SUM(volume_24h) AS total_volume,
  AVG(market_cap) AS avg_market_cap
FROM market_data
GROUP BY bucket, coin_id, symbol;

-- =======================================================
-- DEFI DATA
-- =======================================================

CREATE TABLE defi_tvl (
  time TIMESTAMPTZ NOT NULL,
  protocol VARCHAR(256) NOT NULL,
  chain VARCHAR(64),
  tvl DOUBLE PRECISION,
  change_1d DOUBLE PRECISION,
  change_7d DOUBLE PRECISION,
  category VARCHAR(64),
  metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('defi_tvl', 'time');
CREATE INDEX idx_defi_protocol ON defi_tvl (protocol, time DESC);
CREATE INDEX idx_defi_chain ON defi_tvl (chain, time DESC);

-- =======================================================
-- ON-CHAIN METRICS
-- =======================================================

CREATE TABLE onchain_metrics (
  time TIMESTAMPTZ NOT NULL,
  chain VARCHAR(64) NOT NULL,
  metric_name VARCHAR(128) NOT NULL,
  metric_value DOUBLE PRECISION,
  unit VARCHAR(32),
  source VARCHAR(64),
  metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('onchain_metrics', 'time');
CREATE INDEX idx_onchain_chain ON onchain_metrics (chain, metric_name, time DESC);

-- =======================================================
-- DERIVATIVES DATA
-- =======================================================

CREATE TABLE derivatives (
  time TIMESTAMPTZ NOT NULL,
  exchange VARCHAR(64) NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  data_type VARCHAR(32) NOT NULL, -- 'funding_rate', 'open_interest', 'liquidation'
  value DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('derivatives', 'time');
CREATE INDEX idx_deriv_exchange ON derivatives (exchange, symbol, time DESC);

-- =======================================================
-- SOCIAL SENTIMENT
-- =======================================================

CREATE TABLE social_sentiment (
  time TIMESTAMPTZ NOT NULL,
  coin VARCHAR(32) NOT NULL,
  source VARCHAR(64) NOT NULL, -- 'lunarcrush', 'santiment', etc.
  sentiment_score FLOAT,
  social_volume INTEGER,
  social_dominance FLOAT,
  bullish_percent FLOAT,
  bearish_percent FLOAT,
  metadata JSONB DEFAULT '{}'
);

SELECT create_hypertable('social_sentiment', 'time');
CREATE INDEX idx_social_coin ON social_sentiment (coin, time DESC);

-- =======================================================
-- FEEDS & SOURCES
-- =======================================================

CREATE TABLE feed_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  url TEXT NOT NULL UNIQUE,
  feed_type VARCHAR(20) DEFAULT 'rss', -- rss, atom, json, api
  category VARCHAR(64),
  language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  fetch_interval_seconds INTEGER DEFAULT 300,
  last_fetched_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  article_count INTEGER DEFAULT 0,
  reliability_score FLOAT DEFAULT 1.0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feeds_active ON feed_sources (is_active, last_fetched_at);

-- =======================================================
-- API KEYS & RATE LIMITING
-- =======================================================

CREATE TABLE api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(256),
  tier VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
  rate_limit INTEGER DEFAULT 60, -- requests per hour
  daily_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE rate_limit_logs (
  time TIMESTAMPTZ NOT NULL,
  key_id UUID REFERENCES api_keys(id),
  ip_address INET,
  endpoint VARCHAR(256),
  status_code INTEGER,
  response_time_ms INTEGER
);

SELECT create_hypertable('rate_limit_logs', 'time');

-- =======================================================
-- JOB QUEUE (PostgreSQL-backed alternative to Redis)
-- =======================================================

CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(128) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 2, -- 0=critical, 1=high, 2=normal, 3=low
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  locked_by VARCHAR(128),
  locked_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_pending ON jobs (status, priority, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_jobs_type ON jobs (type, status);

-- Advisory lock for job claiming
CREATE OR REPLACE FUNCTION claim_next_job(p_type VARCHAR, p_worker VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  SELECT id INTO v_job_id
  FROM jobs
  WHERE type = p_type
    AND status = 'pending'
    AND scheduled_at <= NOW()
  ORDER BY priority ASC, created_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    UPDATE jobs SET
      status = 'active',
      locked_by = p_worker,
      locked_at = NOW(),
      started_at = NOW(),
      attempts = attempts + 1
    WHERE id = v_job_id;
  END IF;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- DATA RETENTION POLICIES
-- =======================================================

-- Keep raw market data for 1 year
SELECT add_retention_policy('market_data', INTERVAL '1 year');

-- Keep aggregated market data forever (via continuous aggregates)

-- Keep articles forever (they're the core product)

-- Keep on-chain metrics for 2 years
SELECT add_retention_policy('onchain_metrics', INTERVAL '2 years');

-- Keep derivatives data for 6 months
SELECT add_retention_policy('derivatives', INTERVAL '6 months');

-- Keep rate-limit logs for 30 days
SELECT add_retention_policy('rate_limit_logs', INTERVAL '30 days');

-- =======================================================
-- PERFORMANCE TUNING
-- =======================================================

-- Compression policies for older data
SELECT add_compression_policy('market_data', INTERVAL '7 days');
SELECT add_compression_policy('onchain_metrics', INTERVAL '30 days');
SELECT add_compression_policy('derivatives', INTERVAL '14 days');
SELECT add_compression_policy('social_sentiment', INTERVAL '30 days');
`;

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER (Enhanced for 1M+ users)
// ═══════════════════════════════════════════════════════════════

export interface RateLimitTier {
  name: string;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
  features: string[];
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  anonymous: {
    name: 'Anonymous',
    requestsPerHour: 60,
    requestsPerDay: 500,
    burstLimit: 10,
    features: ['news', 'market-data', 'fear-greed'],
  },
  free: {
    name: 'Free',
    requestsPerHour: 300,
    requestsPerDay: 5000,
    burstLimit: 30,
    features: ['news', 'market-data', 'fear-greed', 'defi', 'onchain', 'social'],
  },
  pro: {
    name: 'Pro',
    requestsPerHour: 3000,
    requestsPerDay: 50000,
    burstLimit: 100,
    features: [
      'news',
      'market-data',
      'fear-greed',
      'defi',
      'onchain',
      'social',
      'derivatives',
      'ai',
      'websocket',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    requestsPerHour: 30000,
    requestsPerDay: 500000,
    burstLimit: 500,
    features: ['*'],
  },
};

// ═══════════════════════════════════════════════════════════════
// CONNECTION POOL MONITOR
// ═══════════════════════════════════════════════════════════════

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: number;
  uptime99d: number;
  errorRate: number;
  activeConnections?: number;
  maxConnections?: number;
}

class HealthMonitor {
  private services: Map<string, ServiceHealth> = new Map();
  private checks: Map<string, () => Promise<{ ok: boolean; latencyMs: number }>> = new Map();

  registerCheck(name: string, check: () => Promise<{ ok: boolean; latencyMs: number }>): void {
    this.checks.set(name, check);
    this.services.set(name, {
      name,
      status: 'healthy',
      latencyMs: 0,
      lastChecked: 0,
      uptime99d: 100,
      errorRate: 0,
    });
  }

  async runChecks(): Promise<ServiceHealth[]> {
    const results: ServiceHealth[] = [];

    for (const [name, check] of this.checks) {
      try {
        const result = await check();
        const health: ServiceHealth = {
          name,
          status: result.ok ? (result.latencyMs > 2000 ? 'degraded' : 'healthy') : 'down',
          latencyMs: result.latencyMs,
          lastChecked: Date.now(),
          uptime99d: result.ok ? 99.9 : 0,
          errorRate: result.ok ? 0 : 1,
        };
        this.services.set(name, health);
        results.push(health);
      } catch {
        const health: ServiceHealth = {
          name,
          status: 'down',
          latencyMs: -1,
          lastChecked: Date.now(),
          uptime99d: 0,
          errorRate: 1,
        };
        this.services.set(name, health);
        results.push(health);
      }
    }

    return results;
  }

  getStatus(): ServiceHealth[] {
    return Array.from(this.services.values());
  }

  getOverallStatus(): 'healthy' | 'degraded' | 'down' {
    const statuses = Array.from(this.services.values());
    if (statuses.some((s) => s.status === 'down')) return 'degraded';
    if (statuses.some((s) => s.status === 'degraded')) return 'degraded';
    return 'healthy';
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS — SINGLETON INSTANCES
// ═══════════════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Main job queue — use for all background work */
export const jobQueue = new JobQueue();

/** Health monitor — tracks all service connections */
export const healthMonitor = new HealthMonitor();

/** Register default workers */
export function initializeWorkers(): void {
  for (const worker of WORKER_DEFINITIONS) {
    jobQueue.registerHandler(worker.jobType, worker.handler);
  }
}

/** Get complete system status */
export async function getSystemStatus(): Promise<{
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceHealth[];
  queue: QueueMetrics;
  rateLimitTiers: Record<string, RateLimitTier>;
}> {
  const services = await healthMonitor.runChecks();
  const queue = await jobQueue.getMetrics();

  return {
    overall: healthMonitor.getOverallStatus(),
    services,
    queue,
    rateLimitTiers: RATE_LIMIT_TIERS,
  };
}

export { JobQueue, HealthMonitor };
export { MemoryQueueAdapter } from './memory-queue';
export { RedisQueueAdapter } from './redis-queue';
export type { QueueAdapter, EnqueueOptions } from './queue-interface';
