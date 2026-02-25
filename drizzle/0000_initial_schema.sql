-- 0000_initial_schema.sql
-- Initial PostgreSQL schema for free-crypto-news
-- Generated from Drizzle ORM schema

-- ============================================================================
-- 1. Articles
-- ============================================================================

CREATE TABLE IF NOT EXISTS "articles" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "url" text NOT NULL,
  "source" varchar(128) NOT NULL,
  "author" varchar(256),
  "published_at" timestamp with time zone NOT NULL,
  "fetched_at" timestamp with time zone NOT NULL DEFAULT now(),
  "content" text,
  "summary" text,
  "sentiment" real,
  "coins" jsonb DEFAULT '[]'::jsonb,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "category" varchar(64),
  "image_url" text,
  "language" varchar(10) DEFAULT 'en',
  "source_reliability" real
);

CREATE UNIQUE INDEX IF NOT EXISTS "articles_url_idx" ON "articles" ("url");
CREATE INDEX IF NOT EXISTS "articles_published_idx" ON "articles" ("published_at");
CREATE INDEX IF NOT EXISTS "articles_source_idx" ON "articles" ("source");
CREATE INDEX IF NOT EXISTS "articles_category_idx" ON "articles" ("category");

-- Full-text search GIN index
CREATE INDEX IF NOT EXISTS "articles_fts_idx"
  ON "articles"
  USING GIN (to_tsvector('english', coalesce("title", '') || ' ' || coalesce("content", '')));

-- ============================================================================
-- 2. Coins
-- ============================================================================

CREATE TABLE IF NOT EXISTS "coins" (
  "id" varchar(128) PRIMARY KEY,
  "symbol" varchar(32) NOT NULL,
  "name" varchar(256) NOT NULL,
  "market_cap_rank" integer,
  "categories" jsonb DEFAULT '[]'::jsonb,
  "platforms" jsonb DEFAULT '{}'::jsonb,
  "last_updated_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "coins_symbol_idx" ON "coins" ("symbol");
CREATE INDEX IF NOT EXISTS "coins_rank_idx" ON "coins" ("market_cap_rank");

-- ============================================================================
-- 3. Prices
-- ============================================================================

CREATE TABLE IF NOT EXISTS "prices" (
  "id" serial PRIMARY KEY,
  "coin_id" varchar(128) NOT NULL REFERENCES "coins"("id") ON DELETE CASCADE,
  "timestamp" timestamp with time zone NOT NULL,
  "price" double precision NOT NULL,
  "volume_24h" double precision,
  "market_cap" double precision,
  "price_change_24h" real,
  "provider" varchar(64),
  "confidence" real
);

CREATE INDEX IF NOT EXISTS "prices_coin_ts_idx" ON "prices" ("coin_id", "timestamp");
CREATE INDEX IF NOT EXISTS "prices_timestamp_idx" ON "prices" ("timestamp");

-- ============================================================================
-- 4. Market Snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS "market_snapshots" (
  "id" serial PRIMARY KEY,
  "timestamp" timestamp with time zone NOT NULL,
  "total_market_cap" double precision,
  "total_volume" double precision,
  "btc_dominance" real,
  "eth_dominance" real,
  "fear_greed_index" integer,
  "fear_greed_label" varchar(32),
  "top_movers" jsonb,
  "active_cryptos" integer,
  "stablecoin_mcap" double precision
);

CREATE INDEX IF NOT EXISTS "market_snapshots_ts_idx" ON "market_snapshots" ("timestamp");

-- ============================================================================
-- 5. Provider Health
-- ============================================================================

CREATE TABLE IF NOT EXISTS "provider_health" (
  "id" serial PRIMARY KEY,
  "provider" varchar(128) NOT NULL,
  "timestamp" timestamp with time zone NOT NULL DEFAULT now(),
  "success_rate" real,
  "avg_latency_ms" real,
  "circuit_state" varchar(16),
  "total_requests" integer,
  "error_count" integer,
  "p99_latency_ms" real
);

CREATE INDEX IF NOT EXISTS "provider_health_provider_ts_idx"
  ON "provider_health" ("provider", "timestamp");

-- ============================================================================
-- 6. Alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS "alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(128),
  "type" varchar(32) NOT NULL,
  "coin_id" varchar(128),
  "condition" varchar(16) NOT NULL,
  "threshold" double precision NOT NULL,
  "channel" varchar(32) DEFAULT 'webhook',
  "webhook_url" text,
  "active" boolean DEFAULT true,
  "last_triggered_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "alerts_user_idx" ON "alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "alerts_coin_idx" ON "alerts" ("coin_id");
CREATE INDEX IF NOT EXISTS "alerts_active_idx" ON "alerts" ("active");

-- ============================================================================
-- 7. Predictions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "predictions" (
  "id" serial PRIMARY KEY,
  "coin_id" varchar(128) NOT NULL,
  "predicted_at" timestamp with time zone NOT NULL DEFAULT now(),
  "target_date" timestamp with time zone NOT NULL,
  "price_target" double precision NOT NULL,
  "confidence" real,
  "model" varchar(64),
  "reasoning" text,
  "outcome" varchar(16),
  "actual_price" double precision
);

CREATE INDEX IF NOT EXISTS "predictions_coin_idx" ON "predictions" ("coin_id");
CREATE INDEX IF NOT EXISTS "predictions_target_date_idx" ON "predictions" ("target_date");

-- ============================================================================
-- 8. Social Metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS "social_metrics" (
  "id" serial PRIMARY KEY,
  "coin_id" varchar(128) NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "twitter_volume" integer,
  "reddit_posts" integer,
  "sentiment_score" real,
  "social_volume" integer,
  "social_dominance" real,
  "source" varchar(64)
);

CREATE INDEX IF NOT EXISTS "social_metrics_coin_ts_idx"
  ON "social_metrics" ("coin_id", "timestamp");
