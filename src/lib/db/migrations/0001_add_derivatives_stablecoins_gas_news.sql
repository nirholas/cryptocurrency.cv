-- Migration: Add derivatives, stablecoin, gas fees, and news tables
-- Created: 2026-02-25

-- derivatives_snapshots: open interest & liquidation historical data
CREATE TABLE IF NOT EXISTS derivatives_snapshots (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(32) NOT NULL,
  open_interest_usd REAL,
  open_interest_coin REAL,
  oi_change_24h REAL,
  long_liquidations_usd_24h REAL,
  short_liquidations_usd_24h REAL,
  liquidation_count_24h INTEGER,
  largest_liquidation_usd REAL,
  funding_rate REAL,
  mark_price REAL,
  source VARCHAR(64) NOT NULL,
  exchange_breakdown JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_derivatives_ticker ON derivatives_snapshots (ticker);
CREATE INDEX IF NOT EXISTS idx_derivatives_ts ON derivatives_snapshots (timestamp);
CREATE INDEX IF NOT EXISTS idx_derivatives_ticker_ts ON derivatives_snapshots (ticker, timestamp);
CREATE INDEX IF NOT EXISTS idx_derivatives_source ON derivatives_snapshots (source);

-- stablecoin_snapshots: stablecoin supply & flow tracking
CREATE TABLE IF NOT EXISTS stablecoin_snapshots (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(32) NOT NULL,
  name VARCHAR(128) NOT NULL,
  peg_type VARCHAR(32) DEFAULT 'peggedUSD',
  circulating_usd REAL NOT NULL,
  circulating_change_24h REAL,
  circulating_change_7d REAL,
  price REAL,
  rank INTEGER,
  chain_distribution JSONB,
  source VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stablecoin_symbol ON stablecoin_snapshots (symbol);
CREATE INDEX IF NOT EXISTS idx_stablecoin_ts ON stablecoin_snapshots (timestamp);
CREATE INDEX IF NOT EXISTS idx_stablecoin_symbol_ts ON stablecoin_snapshots (symbol, timestamp);

-- gas_fees_history: Ethereum gas price history
CREATE TABLE IF NOT EXISTS gas_fees_history (
  id SERIAL PRIMARY KEY,
  chain VARCHAR(32) NOT NULL DEFAULT 'ethereum',
  base_fee_gwei REAL,
  priority_fee_gwei REAL,
  gas_used_percent REAL,
  safe_low_gwei REAL,
  standard_gwei REAL,
  fast_gwei REAL,
  rapid_gwei REAL,
  source VARCHAR(64) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gas_chain ON gas_fees_history (chain);
CREATE INDEX IF NOT EXISTS idx_gas_ts ON gas_fees_history (timestamp);
CREATE INDEX IF NOT EXISTS idx_gas_chain_ts ON gas_fees_history (chain, timestamp);

-- news_articles: provider-sourced news (CryptoPanic, NewsData)
CREATE TABLE IF NOT EXISTS news_articles (
  id VARCHAR(128) PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  published_at TIMESTAMPTZ,
  description TEXT,
  image_url TEXT,
  currencies TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  sentiment REAL,
  votes_positive INTEGER DEFAULT 0,
  votes_negative INTEGER DEFAULT 0,
  votes_important INTEGER DEFAULT 0,
  kind VARCHAR(32) DEFAULT 'news',
  provider VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles (published_at);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles (source);
CREATE INDEX IF NOT EXISTS idx_news_provider ON news_articles (provider);
CREATE INDEX IF NOT EXISTS idx_news_currencies ON news_articles USING GIN (currencies);
CREATE INDEX IF NOT EXISTS idx_news_sentiment ON news_articles (sentiment);
