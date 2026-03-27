/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * AUTO-GENERATED — Do not edit manually.
 * Run: node scripts/generate-endpoint-metadata.js
 *
 * Generated: 2026-03-27T06:18:57.399Z
 * Total endpoints: 353
 *
 * Comprehensive endpoint metadata for OpenAPI spec generation,
 * x402 Bazaar agent discovery, and API documentation.
 */

import type { EndpointMeta } from '@/lib/x402/pricing';

export interface EndpointMetaExtended extends EndpointMeta {
  methods?: string[];
  streaming?: boolean;
}

/**
 * Complete endpoint metadata for all 353 discoverable API routes.
 * Used by the OpenAPI generator, documentation tools, and agent discovery.
 */
export const ENDPOINT_METADATA_FULL: Record<string, EndpointMetaExtended> = {
  "/api/.well-known/x402": {
    description: "x402 protocol discovery endpoint",
  },

  "/api/academic": {
    description: "Academic - News & Content",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "stats" },
      type: { type: "string", description: "Data or content type" },
      country: { type: "string", description: "Filter by country code" },
      verified: { type: "string", description: "Filter for verified entries only" },
      id: { type: "string", description: "Unique identifier" },
      project: { type: "string", description: "DeFi project or protocol name" },
      style: { type: "string", description: "Output style or format", default: "apa" },
      status: { type: "string", description: "Filter by status" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      endpoint: { type: "string", description: "Specific endpoint to query" },
    },
  },

  "/api/ai": {
    description: "AI-powered analysis and intelligence",
    methods: ["GET", "POST"],
  },

  "/api/ai-anchor": {
    description: "AI news anchor video generation from crypto news",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "info" },
      jobId: { type: "string", description: "Async job identifier" },
    },
  },

  "/api/ai/blog-generator": {
    description: "AI blog post generator from clustered crypto news topics",
    methods: ["POST", "GET"],
    parameters: {
      topics: { type: "number", description: "Number of topics or comma-separated topic list", default: "3" },
      days: { type: "number", description: "Number of days of historical data", default: "7" },
      commit: { type: "string", description: "Commit changes (true/false)" },
    },
  },

  "/api/ai/brief": {
    description: "Generate a daily AI-powered crypto news brief",
    parameters: {
      date: { type: "string", description: "Date in YYYY-MM-DD format" },
      format: { type: "string", description: "Response format", default: "full" },
    },
  },

  "/api/ai/correlation": {
    description: "AI-driven correlation analysis between crypto assets",
  },

  "/api/ai/counter": {
    description: "AI counter-argument generation for crypto narratives",
    methods: ["POST", "GET"],
  },

  "/api/ai/cross-lingual": {
    description: "Cross-lingual crypto news analysis and translation",
  },

  "/api/ai/debate": {
    description: "AI-powered debate between bull and bear perspectives",
    methods: ["POST", "GET"],
  },

  "/api/ai/digest": {
    description: "AI-generated daily market digest with streaming",
    streaming: true,
    parameters: {
      topic: { type: "string", description: "Topic or subject to analyze" },
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      limit: { type: "number", description: "Maximum number of results to return", default: "60" },
    },
  },

  "/api/ai/entities": {
    description: "Extract and analyze named entities from crypto news",
    methods: ["POST", "GET"],
    parameters: {
      text: { type: "number", description: "Filter by text" },
      types: { type: "string", description: "Filter by types" },
    },
  },

  "/api/ai/entities/extract": {
    description: "Extract named entities from provided text",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
      name: { type: "string", description: "Filter by name", required: true },
      context: { type: "string", description: "Filter by context" },
    },
  },

  "/api/ai/explain": {
    description: "AI explanation of complex crypto concepts and events",
    parameters: {
      topic: { type: "string", description: "Topic or subject to analyze" },
      includePrice: { type: "string", description: "Filter by includePrice" },
    },
  },

  "/api/ai/flash-briefing": {
    description: "Flash briefing format for voice assistants",
    parameters: {
      stories: { type: "number", description: "Filter by stories", default: "5" },
    },
  },

  "/api/ai/narratives": {
    description: "AI-identified market narratives and themes",
    parameters: {
      predict: { type: "string", description: "Filter by predict" },
    },
  },

  "/api/ai/oracle": {
    description: "AI oracle for crypto market predictions",
    methods: ["POST", "GET"],
    parameters: {
      q: { type: "string", description: "Search query string" },
    },
  },

  "/api/ai/portfolio-news": {
    description: "AI-curated news relevant to a specific portfolio",
    methods: ["POST", "GET"],
  },

  "/api/ai/relationships": {
    description: "AI-detected relationships between crypto entities and events",
    methods: ["POST"],
  },

  "/api/ai/research": {
    description: "Deep AI research reports on crypto topics",
    parameters: {
      topic: { type: "string", description: "Topic or subject to analyze" },
      mode: { type: "string", description: "Filter by mode" },
      compare: { type: "string", description: "Filter by compare" },
      contrarian: { type: "string", description: "Filter by contrarian" },
    },
  },

  "/api/ai/social": {
    description: "AI analysis of social media crypto sentiment",
    methods: ["POST", "GET"],
  },

  "/api/ai/source-quality": {
    description: "AI assessment of news source credibility and quality",
    methods: ["GET", "POST"],
    parameters: {
      source: { type: "string", description: "Filter by news source" },
      category: { type: "string", description: "Filter by category" },
      clickbait: { type: "string", description: "Filter by clickbait" },
    },
  },

  "/api/ai/summarize": {
    description: "AI-powered article summarization",
    methods: ["POST", "GET"],
    parameters: {
      url: { type: "string", description: "Filter by url" },
      text: { type: "string", description: "Filter by text" },
      type: { type: "string", description: "Data or content type" },
    },
  },

  "/api/ai/summarize/stream": {
    description: "Streaming AI article summarization",
    methods: ["POST"],
    streaming: true,
  },

  "/api/ai/synthesize": {
    description: "AI synthesis of multiple news sources into unified report",
    methods: ["GET", "POST"],
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "5" },
      threshold: { type: "number", description: "Filter by threshold", default: "0.4" },
    },
  },

  "/api/airdrops": {
    description: "Upcoming and active cryptocurrency airdrops",
    parameters: {
      status: { type: "string", description: "Filter by status" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/alerts": {
    description: "Price and event alert management",
    methods: ["GET", "POST", "DELETE", "PATCH"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
      userId: { type: "string", description: "User identifier" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      alertId: { type: "string", description: "Filter by alertId" },
      id: { type: "string", description: "Unique identifier" },
    },
  },

  "/api/alerts/stream": {
    description: "Real-time alert notifications via Server-Sent Events",
    streaming: true,
    parameters: {
      user_id: { type: "string", description: "Filter by user id" },
      session_id: { type: "string", description: "Filter by session id" },
    },
  },

  "/api/alexa": {
    description: "Alexa skill integration endpoint",
    methods: ["POST", "GET"],
  },

  "/api/analytics/anomalies": {
    description: "Detect anomalies in news and market data patterns",
    parameters: {
      hours: { type: "number", description: "Filter by hours", default: "24" },
      severity: { type: "string", description: "Filter by severity" },
    },
  },

  "/api/analytics/causality": {
    description: "Causal relationship analysis between events",
    methods: ["GET", "POST"],
    parameters: {
      eventId: { type: "string", description: "Filter by eventId" },
      type: { type: "string", description: "Data or content type" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/analytics/credibility": {
    description: "News source credibility scoring and analysis",
    parameters: {
      source: { type: "string", description: "Filter by news source" },
      sortBy: { type: "string", description: "Filter by sortBy", default: "score" },
    },
  },

  "/api/analytics/events": {
    description: "Event detection and impact analysis",
    methods: ["POST", "GET"],
  },

  "/api/analytics/forensics": {
    description: "News forensics - coordination detection and origin tracing",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "report" },
      source: { type: "string", description: "Filter by news source" },
      article: { type: "string", description: "Filter by article" },
    },
  },

  "/api/analytics/gaps": {
    description: "Coverage gap detection in crypto news",
  },

  "/api/analytics/headlines": {
    description: "Headline analytics and trend detection",
    parameters: {
      hours: { type: "number", description: "Filter by hours", default: "24" },
      changesOnly: { type: "string", description: "Filter by changesOnly" },
    },
  },

  "/api/analytics/influencers": {
    description: "Influencer impact and reach analytics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      min_credibility: { type: "number", description: "Filter by min credibility", default: "0" },
      category: { type: "string", description: "Filter by category" },
      platform: { type: "string", description: "Filter by platform" },
      sort: { type: "string", description: "Sort field", default: "credibility" },
    },
  },

  "/api/analytics/news-onchain": {
    description: "Correlation between news events and on-chain activity",
    parameters: {
      hours: { type: "number", description: "Filter by hours", default: "24" },
    },
  },

  "/api/analytics/usage": {
    description: "API usage analytics and statistics",
    parameters: {
      key_prefix: { type: "string", description: "Filter by key prefix" },
      key_id: { type: "string", description: "Filter by key id" },
      days: { type: "number", description: "Number of days of historical data", default: "30" },
      api_key: { type: "string", description: "Filter by api key" },
    },
  },

  "/api/analyze": {
    description: "General-purpose crypto analysis endpoint",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      topic: { type: "string", description: "Topic or subject to analyze" },
      sentiment: { type: "string", description: "Filter by sentiment" },
    },
  },

  "/api/anomalies": {
    description: "Anomaly detection across market and news data",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      signal: { type: "string", description: "Filter by signal" },
      severity: { type: "string", description: "Filter by severity" },
      since: { type: "string", description: "Start timestamp or date" },
    },
  },

  "/api/aptos": {
    description: "Aptos blockchain overview and statistics",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      tx: { type: "string", description: "Filter by tx" },
      block: { type: "string", description: "Filter by block" },
      view: { type: "string", description: "Filter by view" },
      with_transactions: { type: "string", description: "Filter by with transactions" },
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
      start: { type: "string", description: "Start position for pagination" },
    },
  },

  "/api/aptos/events": {
    description: "Aptos blockchain event data",
    parameters: {
      address: { type: "number", description: "Wallet or contract address" },
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
      start: { type: "number", description: "Start position for pagination" },
      handle: { type: "string", description: "Filter by handle" },
      field: { type: "string", description: "Filter by field" },
      creation_number: { type: "string", description: "Filter by creation number" },
    },
  },

  "/api/aptos/resources": {
    description: "Aptos account resources and state",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      type: { type: "string", description: "Data or content type" },
    },
  },

  "/api/aptos/transactions": {
    description: "Aptos transaction history and details",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      hash: { type: "string", description: "Transaction hash" },
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
      start: { type: "string", description: "Start position for pagination" },
    },
  },

  "/api/arbitrage": {
    description: "Cross-exchange arbitrage opportunity detection",
    methods: ["GET", "POST"],
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      minProfit: { type: "number", description: "Filter by minProfit", default: "0.1" },
      exchange: { type: "string", description: "Filter by exchange" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      includeTriangular: { type: "string", description: "Filter by includeTriangular" },
      monitor: { type: "string", description: "Filter by monitor" },
    },
  },

  "/api/archive": {
    description: "News article archive and historical data",
    parameters: {
      stats: { type: "string", description: "Filter by stats" },
      index: { type: "string", description: "Filter by index" },
      type: { type: "string", description: "Data or content type" },
      trending: { type: "string", description: "Filter by trending" },
      hours: { type: "number", description: "Filter by hours", default: "24" },
      market: { type: "string", description: "Filter by market" },
      start_date: { type: "string", description: "Filter by start date" },
      end_date: { type: "string", description: "Filter by end date" },
      source: { type: "string", description: "Filter by news source" },
      ticker: { type: "string", description: "Filter by ticker" },
      q: { type: "string", description: "Search query string" },
      sentiment: { type: "string", description: "Filter by sentiment" },
      tags: { type: "string", description: "Filter by tags" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      offset: { type: "number", description: "Number of results to skip", default: "0" },
      format: { type: "string", description: "Response format", default: "full" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
  },

  "/api/archive/ipfs": {
    description: "IPFS-pinned news archive for permanent storage",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "list" },
      cid: { type: "string", description: "Filter by cid", required: true },
      storage: { type: "string", description: "Filter by storage" },
      type: { type: "string", description: "Data or content type" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/archive/status": {
    description: "Archive indexing status and statistics",
  },

  "/api/archive/v2": {
    description: "Enhanced news archive with improved search and filtering",
  },

  "/api/archive/webhook": {
    description: "Webhook notifications for archive updates",
    methods: ["POST", "GET"],
  },

  "/api/arkham": {
    description: "Arkham Intelligence on-chain entity tracking",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "smart-money-flows" },
      address: { type: "string", description: "Wallet or contract address" },
      entity: { type: "string", description: "Filter by entity" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      token: { type: "string", description: "Filter by token" },
      minValueUsd: { type: "number", description: "Filter by minValueUsd" },
      limit: { type: "number", description: "Maximum number of results to return" },
    },
  },

  "/api/article": {
    description: "Single article retrieval by ID or URL",
    parameters: {
      url: { type: "string", description: "Filter by url" },
      title: { type: "string", description: "Filter by title", default: "Untitled" },
      source: { type: "string", description: "Filter by news source", default: "Unknown" },
    },
  },

  "/api/articles": {
    description: "Browse and filter crypto news articles",
    parameters: {
      slug: { type: "string", description: "Filter by slug" },
      id: { type: "string", description: "Unique identifier" },
      stats: { type: "string", description: "Filter by stats" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      date: { type: "string", description: "Date in YYYY-MM-DD format" },
      ticker: { type: "string", description: "Filter by ticker" },
      source: { type: "string", description: "Filter by news source" },
      q: { type: "string", description: "Search query string" },
    },
  },

  "/api/ask": {
    description: "Ask natural language questions about crypto markets",
    streaming: true,
    parameters: {
      q: { type: "string", description: "Search query string" },
      stream: { type: "string", description: "Filter by stream" },
    },
  },

  "/api/atom": {
    description: "Atom/RSS feed for crypto news",
    parameters: {
      feed: { type: "string", description: "Filter by feed", default: "all" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/authors": {
    description: "News author profiles and statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return" },
      offset: { type: "number", description: "Number of results to skip" },
      sort: { type: "string", description: "Sort field" },
      search: { type: "number", description: "Filter by search" },
    },
  },

  "/api/backtest": {
    description: "Strategy backtesting with historical market data",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "backtest" },
      strategy: { type: "string", description: "Filter by strategy", default: "sentiment_momentum" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)", default: "BTC" },
      start: { type: "string", description: "Start position for pagination", default: "2025-01-01" },
      end: { type: "string", description: "Filter by end", default: "2026-02-01" },
      capital: { type: "number", description: "Filter by capital", default: "10000" },
    },
  },

  "/api/batch": {
    description: "Batch multiple API requests into a single call",
    methods: ["POST"],
  },

  "/api/bitcoin": {
    description: "Bitcoin network overview and market data",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
  },

  "/api/bitcoin/block-height": {
    description: "Current Bitcoin block height",
  },

  "/api/bitcoin/blocks": {
    description: "Recent Bitcoin block data and details",
    parameters: {
      start_height: { type: "string", description: "Starting block height" },
    },
  },

  "/api/bitcoin/difficulty": {
    description: "Bitcoin mining difficulty and adjustment data",
  },

  "/api/bitcoin/mempool/blocks": {
    description: "Bitcoin mempool projected blocks",
  },

  "/api/bitcoin/mempool/fees": {
    description: "Bitcoin mempool fee estimates",
  },

  "/api/bitcoin/mempool/info": {
    description: "Bitcoin mempool size and transaction count",
  },

  "/api/blog/posts": {
    description: "Blog posts about cryptocurrency markets and analysis",
  },

  "/api/breaking": {
    description: "Breaking crypto news headlines",
    parameters: {
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
  },

  "/api/bridges": {
    description: "Cross-chain bridge volume and activity data",
    parameters: {
      bridgeId: { type: "number", description: "Filter by bridgeId" },
    },
  },

  "/api/chart-analysis": {
    description: "Technical chart pattern analysis",
    methods: ["POST", "GET"],
  },

  "/api/charts": {
    description: "Price chart data for cryptocurrencies",
    parameters: {
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
      range: { type: "string", description: "Filter by range", default: "24h" },
    },
  },

  "/api/citations": {
    description: "Citation verification and source attribution",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "stats" },
      year: { type: "number", description: "Filter by year" },
      keyword: { type: "string", description: "Filter by keyword" },
      author: { type: "string", description: "Filter by author" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      id: { type: "string", description: "Unique identifier" },
      name: { type: "string", description: "Filter by name" },
      min: { type: "number", description: "Filter by min", default: "2" },
      window: { type: "number", description: "Filter by window", default: "3" },
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      format: { type: "string", description: "Response format", default: "bibtex" },
      ids: { type: "string", description: "Comma-separated IDs" },
    },
  },

  "/api/claims": {
    description: "Fact-checkable claims extracted from crypto news",
    methods: ["POST", "GET"],
  },

  "/api/classify": {
    description: "Classify crypto news articles by category and relevance",
    methods: ["POST", "GET"],
  },

  "/api/clickbait": {
    description: "Detect clickbait in crypto news headlines",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      threshold: { type: "number", description: "Filter by threshold", default: "0" },
    },
  },

  "/api/coincap": {
    description: "CoinCap market data aggregation",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      search: { type: "number", description: "Filter by search" },
      offset: { type: "number", description: "Number of results to skip", default: "0" },
    },
  },

  "/api/coinmarketcap": {
    description: "CoinMarketCap market data aggregation",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "summary" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      sort: { type: "string", description: "Sort field" },
      tag: { type: "string", description: "Filter by tag" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)", required: true },
      id: { type: "string", description: "Unique identifier", required: true },
      category: { type: "string", description: "Filter by category", required: true },
      period: { type: "string", description: "Time period for data aggregation" },
      q: { type: "string", description: "Search query string", required: true },
    },
  },

  "/api/coinpaprika": {
    description: "CoinPaprika overview and market data",
  },

  "/api/coinpaprika/coins": {
    description: "CoinPaprika coin listings and details",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return" },
    },
  },

  "/api/coinpaprika/exchanges": {
    description: "CoinPaprika exchange data",
  },

  "/api/coinpaprika/search": {
    description: "Search CoinPaprika for coins, exchanges, and people",
    parameters: {
      q: { type: "string", description: "Search query string" },
    },
  },

  "/api/coinpaprika/tickers": {
    description: "CoinPaprika ticker data with prices and volume",
    parameters: {
      quotes: { type: "string", description: "Filter by quotes", default: "USD" },
    },
  },

  "/api/commentary": {
    description: "Expert commentary and opinion pieces on crypto",
    streaming: true,
  },

  "/api/compare": {
    description: "Compare multiple cryptocurrencies side by side",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
    },
  },

  "/api/contributors": {
    description: "Platform contributor profiles and statistics",
  },

  "/api/coverage-gap": {
    description: "Identify underreported crypto stories and events",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "report" },
      period: { type: "string", description: "Time period for data aggregation", default: "24h" },
      topic: { type: "string", description: "Topic or subject to analyze" },
      severity: { type: "string", description: "Filter by severity" },
    },
  },

  "/api/cryptocompare": {
    description: "CryptoCompare market data aggregation",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "overview" },
      fsyms: { type: "string", description: "Filter by fsyms" },
      tsyms: { type: "string", description: "Filter by tsyms" },
      fsym: { type: "string", description: "Filter by fsym", default: "BTC" },
      tsym: { type: "string", description: "Filter by tsym", default: "USD" },
      interval: { type: "string", description: "Data interval (e.g., hourly, daily)" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      exchange: { type: "string", description: "Filter by exchange", default: "coinbase" },
      categories: { type: "string", description: "Filter by categories" },
      feeds: { type: "string", description: "Filter by feeds" },
      sort: { type: "string", description: "Sort field" },
      coinId: { type: "number", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)", default: "1182" },
    },
  },

  "/api/cryptopanic": {
    description: "CryptoPanic news feed aggregation",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "dashboard" },
      currencies: { type: "string", description: "Filter by currencies" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      filter: { type: "string", description: "Filter by filter" },
      kind: { type: "string", description: "Filter by kind" },
      regions: { type: "string", description: "Filter by regions" },
      source: { type: "string", description: "Filter by news source" },
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      country: { type: "string", description: "Filter by country code" },
    },
  },

  "/api/data-sources": {
    description: "Available data sources and their status",
    parameters: {
      action: { type: "string", description: "API action to perform" },
      category: { type: "string", description: "Filter by category" },
    },
  },

  "/api/data-sources/derivatives": {
    description: "Derivatives data source status and coverage",
    parameters: {
      view: { type: "string", description: "Filter by view", default: "dashboard" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)", default: "BTC" },
      currency: { type: "string", description: "Filter by currency", default: "BTC" },
    },
  },

  "/api/data-sources/onchain": {
    description: "On-chain data source status and coverage",
    parameters: {
      view: { type: "string", description: "Filter by view", default: "dashboard" },
      address: { type: "string", description: "Wallet or contract address" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)", default: "ethereum" },
      transfers: { type: "string", description: "Filter by transfers" },
      minEth: { type: "number", description: "Filter by minEth", default: "100" },
    },
  },

  "/api/data-sources/social": {
    description: "Social data source status and coverage",
    parameters: {
      view: { type: "string", description: "Filter by view", default: "dashboard" },
      days: { type: "number", description: "Number of days of historical data", default: "30" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      space: { type: "string", description: "Filter by space" },
    },
  },

  "/api/defi": {
    description: "DeFi protocol overview and aggregate statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
  },

  "/api/defi/bridges": {
    description: "DeFi bridge volumes and cross-chain flows",
  },

  "/api/defi/dex-volumes": {
    description: "DEX trading volume across chains and protocols",
  },

  "/api/defi/stablecoins": {
    description: "Stablecoin market data and supply statistics",
  },

  "/api/defi/summary": {
    description: "DeFi market summary with key metrics",
  },

  "/api/defi/yields": {
    description: "DeFi yield farming opportunities with filtering",
    parameters: {
      type: { type: "string", description: "Data or content type" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      project: { type: "string", description: "DeFi project or protocol name" },
      stable: { type: "string", description: "Filter for stablecoin pools only" },
      min_tvl: { type: "number", description: "Minimum total value locked in USD" },
      min_apy: { type: "number", description: "Minimum annual percentage yield" },
      max_apy: { type: "number", description: "Maximum annual percentage yield" },
    },
  },

  "/api/defi/yields/chains": {
    description: "Yield data aggregated by blockchain",
  },

  "/api/defi/yields/median": {
    description: "Median yield statistics across DeFi protocols",
  },

  "/api/defi/yields/projects": {
    description: "Yield data aggregated by DeFi project",
  },

  "/api/defi/yields/search": {
    description: "Search DeFi yield opportunities by criteria",
    parameters: {
      q: { type: "string", description: "Search query string" },
    },
  },

  "/api/defi/yields/stablecoins": {
    description: "Stablecoin-specific yield opportunities",
    parameters: {
      min_tvl: { type: "number", description: "Minimum total value locked in USD", default: "1000000" },
    },
  },

  "/api/derivatives": {
    description: "Crypto derivatives market overview",
  },

  "/api/derivatives/aggregated/funding": {
    description: "Aggregated funding rates across exchanges",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
  },

  "/api/derivatives/aggregated/open-interest": {
    description: "Aggregated open interest across exchanges",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
  },

  "/api/derivatives/bybit/tickers": {
    description: "Bybit derivatives ticker data",
    parameters: {
      category: { type: "string", description: "Filter by category", default: "linear" },
    },
  },

  "/api/derivatives/dydx/markets": {
    description: "dYdX perpetual market data",
  },

  "/api/derivatives/okx/funding": {
    description: "OKX funding rate data",
  },

  "/api/derivatives/okx/open-interest": {
    description: "OKX open interest data",
    parameters: {
      type: { type: "string", description: "Data or content type", default: "SWAP" },
    },
  },

  "/api/derivatives/okx/tickers": {
    description: "OKX derivatives ticker data",
    parameters: {
      type: { type: "string", description: "Data or content type", default: "SWAP" },
    },
  },

  "/api/derivatives/opportunities": {
    description: "Derivatives trading opportunities and spreads",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
    },
  },

  "/api/detect/ai-content": {
    description: "Detect AI-generated content in crypto news",
    methods: ["POST", "GET"],
  },

  "/api/dex-volumes": {
    description: "Decentralized exchange trading volumes",
    parameters: {
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      top: { type: "number", description: "Filter by top" },
    },
  },

  "/api/digest": {
    description: "Daily crypto market digest",
    parameters: {
      period: { type: "string", description: "Time period for data aggregation", default: "24h" },
      format: { type: "string", description: "Response format", default: "full" },
    },
  },

  "/api/dune": {
    description: "Dune Analytics query results and dashboards",
    parameters: {
      query: { type: "number", description: "Search query string" },
      queryId: { type: "number", description: "Filter by queryId" },
      executionId: { type: "string", description: "Filter by executionId" },
      execute: { type: "number", description: "Filter by execute" },
    },
  },

  "/api/entities": {
    description: "Named entity database for crypto organizations and people",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      type: { type: "string", description: "Data or content type" },
      min_mentions: { type: "number", description: "Filter by min mentions", default: "1" },
    },
  },

  "/api/events": {
    description: "Crypto market events and calendar",
    parameters: {
      category: { type: "string", description: "Filter by category" },
      importance: { type: "string", description: "Filter by importance" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/exchange-rates": {
    description: "Fiat and crypto exchange rates",
  },

  "/api/exchange-rates/convert": {
    description: "Currency conversion calculator",
    parameters: {
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      amount: { type: "number", description: "Filter by amount", default: "1" },
    },
  },

  "/api/exchanges": {
    description: "Cryptocurrency exchange listings and data",
    parameters: {
      sort: { type: "string", description: "Sort field", default: "trust" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/export": {
    description: "Export market, news, and analytics data",
    methods: ["GET", "POST"],
    parameters: {
      type: { type: "string", description: "Data or content type", default: "news" },
      format: { type: "string", description: "Response format", default: "json" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      download: { type: "string", description: "Set to true for file download response" },
    },
  },

  "/api/export/jobs": {
    description: "Check status of async export jobs",
    parameters: {
      status: { type: "string", description: "Filter by status" },
      cleanup: { type: "string", description: "Filter by cleanup" },
      maxAge: { type: "number", description: "Filter by maxAge", default: "3600000" },
    },
  },

  "/api/exports": {
    description: "Manage and list data exports",
    methods: ["GET", "POST"],
    parameters: {
      schema: { type: "string", description: "Filter by schema" },
      archives: { type: "string", description: "Filter by archives" },
    },
  },

  "/api/extract": {
    description: "Extract structured data from crypto news articles",
    parameters: {
      url: { type: "string", description: "Filter by url" },
    },
  },

  "/api/factcheck": {
    description: "AI fact-checking of crypto claims and news",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "15" },
      type: { type: "string", description: "Data or content type" },
      confidence: { type: "string", description: "Filter by confidence" },
    },
  },

  "/api/fear-greed": {
    description: "Crypto Fear & Greed Index with historical data",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
    },
  },

  "/api/flows": {
    description: "Capital flow tracking across exchanges and wallets",
    parameters: {
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
    },
  },

  "/api/forecast": {
    description: "AI-powered price forecasting for cryptocurrencies",
    methods: ["GET", "POST"],
    parameters: {
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
      horizon: { type: "string", description: "Filter by horizon", default: "1d" },
      action: { type: "string", description: "API action to perform" },
    },
  },

  "/api/funding": {
    description: "Venture capital funding rounds in crypto",
    methods: ["GET", "POST"],
    parameters: {
      exchange: { type: "string", description: "Filter by exchange" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      minSpread: { type: "number", description: "Filter by minSpread", default: "0" },
      alerts: { type: "string", description: "Filter by alerts" },
      history: { type: "string", description: "Filter by history" },
      historyExchange: { type: "string", description: "Filter by historyExchange", default: "binance" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/funding-rates": {
    description: "Perpetual futures funding rates across exchanges",
  },

  "/api/gaming": {
    description: "Blockchain gaming ecosystem overview",
  },

  "/api/gaming/chains": {
    description: "Gaming activity by blockchain",
  },

  "/api/gaming/top": {
    description: "Top blockchain games by activity and volume",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
      sort: { type: "string", description: "Sort field", default: "dau" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
    },
  },

  "/api/gas": {
    description: "Ethereum gas prices and network congestion",
  },

  "/api/gas/estimate": {
    description: "Gas fee estimation for Ethereum and Bitcoin",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)", default: "ethereum" },
    },
  },

  "/api/gas/history": {
    description: "Historical gas price data",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)", default: "ethereum" },
      days: { type: "number", description: "Number of days of historical data", default: "7" },
    },
  },

  "/api/geckoterminal": {
    description: "GeckoTerminal DEX data aggregation",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)", default: "eth" },
      type: { type: "string", description: "Data or content type", default: "trending" },
      dex: { type: "string", description: "Filter by dex" },
    },
  },

  "/api/global": {
    description: "Global cryptocurrency market statistics",
  },

  "/api/glossary": {
    description: "Cryptocurrency glossary and term definitions",
    parameters: {
      category: { type: "string", description: "Filter by category" },
      q: { type: "string", description: "Search query string" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/hyperliquid": {
    description: "Hyperliquid perpetual DEX data",
    parameters: {
      type: { type: "string", description: "Data or content type", default: "all" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
  },

  "/api/influencers": {
    description: "Crypto influencer rankings and analysis",
    methods: ["GET", "POST"],
    parameters: {
      sortBy: { type: "string", description: "Filter by sortBy", default: "reliability" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      minCalls: { type: "number", description: "Filter by minCalls", default: "0" },
      platform: { type: "string", description: "Filter by platform" },
      ticker: { type: "string", description: "Filter by ticker" },
      view: { type: "string", description: "Filter by view" },
    },
  },

  "/api/integrations/tradingview": {
    description: "TradingView webhook integration for alerts and signals",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "D" },
      type: { type: "string", description: "Data or content type", default: "chart" },
      theme: { type: "string", description: "Filter by theme", default: "dark" },
      width: { type: "string", description: "Filter by width", default: "100%" },
      height: { type: "number", description: "Filter by height", default: "500" },
      symbols: { type: "string", description: "Comma-separated trading symbols" },
      tags: { type: "string", description: "Filter by tags" },
      overlay: { type: "string", description: "Filter by overlay" },
      id: { type: "string", description: "Unique identifier" },
      enabled: { type: "string", description: "Filter by enabled" },
      fast: { type: "number", description: "Filter by fast", default: "9" },
      slow: { type: "number", description: "Filter by slow", default: "21" },
    },
  },

  "/api/keys": {
    description: "API key management",
    methods: ["GET", "POST", "DELETE"],
    parameters: {
      id: { type: "string", description: "Unique identifier" },
    },
  },

  "/api/knowledge-graph": {
    description: "Crypto knowledge graph of entities, events, and relationships",
    methods: ["GET", "POST"],
    parameters: {
      entity: { type: "string", description: "Filter by entity" },
      type: { type: "string", description: "Data or content type" },
      depth: { type: "number", description: "Filter by depth" },
      minMentions: { type: "number", description: "Filter by minMentions" },
      minWeight: { type: "number", description: "Filter by minWeight" },
    },
  },

  "/api/l2": {
    description: "Layer 2 ecosystem overview",
  },

  "/api/l2/activity": {
    description: "Layer 2 transaction activity and growth metrics",
  },

  "/api/l2/projects": {
    description: "Layer 2 project listings and comparisons",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return" },
    },
  },

  "/api/l2/risk": {
    description: "Layer 2 risk assessment and security scores",
    parameters: {
      sort: { type: "string", description: "Sort field" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/liquidations": {
    description: "Liquidation data from perpetual futures markets",
  },

  "/api/macro": {
    description: "Macroeconomic overview relevant to crypto markets",
  },

  "/api/macro/correlations": {
    description: "Crypto-macro correlation analysis",
  },

  "/api/macro/dxy": {
    description: "US Dollar Index (DXY) data and crypto correlation",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
    },
  },

  "/api/macro/fed": {
    description: "Federal Reserve data, rates, and yield curves",
  },

  "/api/macro/indicators": {
    description: "Key macroeconomic indicators",
    parameters: {
      indicators: { type: "string", description: "Filter by indicators" },
      period: { type: "string", description: "Time period for data aggregation", default: "1d" },
    },
  },

  "/api/macro/risk-appetite": {
    description: "Market risk appetite index combining macro and crypto signals",
  },

  "/api/market/categories": {
    description: "Crypto market categories and sector performance",
  },

  "/api/market/coins": {
    description: "Coin market data with advanced filtering",
  },

  "/api/market/compare": {
    description: "Side-by-side coin comparison with market data",
  },

  "/api/market/defi": {
    description: "DeFi sector market overview",
  },

  "/api/market/derivatives": {
    description: "Derivatives market overview and statistics",
  },

  "/api/market/dominance": {
    description: "Bitcoin and altcoin market dominance data",
  },

  "/api/market/exchanges": {
    description: "Exchange market data and rankings",
    parameters: {
      per_page: { type: "number", description: "Results per page", default: "100" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
    },
  },

  "/api/market/gainers": {
    description: "Top gaining cryptocurrencies by timeframe",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "24h" },
    },
  },

  "/api/market/global-defi": {
    description: "Global DeFi market statistics",
  },

  "/api/market/heatmap": {
    description: "Market heatmap data by sector and market cap",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/market/losers": {
    description: "Top losing cryptocurrencies by timeframe",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "24h" },
    },
  },

  "/api/market/movers": {
    description: "Biggest market movers combining gainers and losers",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "5" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "24h" },
    },
  },

  "/api/market/orderbook": {
    description: "Order book depth data for trading pairs",
    methods: ["GET", "POST"],
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      action: { type: "string", description: "API action to perform", default: "aggregate" },
      exchanges: { type: "string", description: "Filter by exchanges" },
      depth: { type: "number", description: "Filter by depth", default: "25" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/market/pumps": {
    description: "Unusual price pump detection",
  },

  "/api/market/search": {
    description: "Search for coins, exchanges, and tokens",
    parameters: {
      q: { type: "string", description: "Search query string" },
    },
  },

  "/api/market/stream": {
    description: "Real-time market data via Server-Sent Events",
    streaming: true,
  },

  "/api/nansen": {
    description: "Nansen on-chain analytics data",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "smart-money" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      token: { type: "string", description: "Filter by token" },
      txAction: { type: "string", description: "Filter by txAction" },
      limit: { type: "number", description: "Maximum number of results to return" },
      address: { type: "string", description: "Wallet or contract address" },
    },
  },

  "/api/narratives": {
    description: "Current market narratives and trending themes",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "40" },
      emerging: { type: "string", description: "Filter by emerging" },
    },
  },

  "/api/news": {
    description: "Latest crypto news from 300+ sources",
    parameters: {
      sort: { type: "string", description: "Sort field" },
      sources: { type: "string", description: "Comma-separated list of sources" },
    },
  },

  "/api/news/categories": {
    description: "News categorized by topic",
  },

  "/api/news/extract": {
    description: "Extract structured data from a news URL",
    methods: ["POST"],
  },

  "/api/news/international": {
    description: "International crypto news with language filtering",
    parameters: {
      language: { type: "string", description: "Filter by language", default: "all" },
      translate: { type: "string", description: "Filter by translate" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      region: { type: "string", description: "Filter by region", default: "all" },
      sources: { type: "string", description: "Comma-separated list of sources" },
    },
  },

  "/api/news/stream": {
    description: "Real-time news stream via Server-Sent Events",
    streaming: true,
    parameters: {
      categories: { type: "string", description: "Filter by categories" },
      limit: { type: "number", description: "Maximum number of results to return", default: "5" },
    },
  },

  "/api/nft": {
    description: "NFT market overview and statistics",
  },

  "/api/nft/collections/search": {
    description: "Search NFT collections by name or attributes",
    parameters: {
      q: { type: "string", description: "Search query string" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/nft/collections/trending": {
    description: "Trending NFT collections by volume and sales",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      category: { type: "string", description: "Filter by category" },
      sort_by: { type: "string", description: "Field to sort results by" },
    },
  },

  "/api/nft/market": {
    description: "NFT market aggregate statistics",
  },

  "/api/nft/sales/recent": {
    description: "Recent notable NFT sales",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/nostr": {
    description: "Nostr protocol integration for decentralized publishing",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/ohlc": {
    description: "OHLC candlestick data for crypto trading pairs",
    parameters: {
      coinId: { type: "string", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)" },
      days: { type: "number", description: "Number of days of historical data" },
    },
  },

  "/api/on-chain": {
    description: "On-chain analytics overview",
    parameters: {
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      metric: { type: "string", description: "Filter by metric" },
    },
  },

  "/api/onchain/aave/markets": {
    description: "Aave lending market data",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/onchain/aave/rates": {
    description: "Aave lending and borrowing rates",
    parameters: {
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)", default: "ethereum" },
    },
  },

  "/api/onchain/compound/markets": {
    description: "Compound lending market data",
  },

  "/api/onchain/correlate": {
    description: "Correlate on-chain metrics with price and news events",
  },

  "/api/onchain/cross-protocol": {
    description: "Cross-protocol DeFi analytics and comparisons",
  },

  "/api/onchain/curve/pools": {
    description: "Curve Finance pool data and yields",
  },

  "/api/onchain/events": {
    description: "Significant on-chain events and transactions",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      type: { type: "string", description: "Data or content type" },
      min_value: { type: "number", description: "Filter by min value", default: "0" },
      min_confidence: { type: "number", description: "Filter by min confidence", default: "50" },
    },
  },

  "/api/onchain/exchange-flows": {
    description: "Exchange inflow/outflow data for BTC and ETH",
    parameters: {
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)", default: "BTC" },
    },
  },

  "/api/onchain/multichain": {
    description: "Multi-chain on-chain analytics",
    parameters: {
      protocol: { type: "string", description: "Filter by protocol", default: "uniswap" },
    },
  },

  "/api/onchain/uniswap/pools": {
    description: "Uniswap pool data and liquidity metrics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      order_by: { type: "string", description: "Filter by order by", default: "totalValueLockedUSD" },
      order_direction: { type: "string", description: "Filter by order direction", default: "desc" },
      min_liquidity: { type: "string", description: "Filter by min liquidity" },
    },
  },

  "/api/onchain/uniswap/swaps": {
    description: "Recent Uniswap swap transactions",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      pool: { type: "string", description: "Filter by pool" },
      min_usd: { type: "string", description: "Filter by min usd" },
    },
  },

  "/api/oneinch": {
    description: "1inch DEX aggregator data",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "prices" },
      chainId: { type: "number", description: "Filter by chainId" },
      src: { type: "string", description: "Filter by src" },
      dst: { type: "string", description: "Filter by dst" },
      amount: { type: "string", description: "Filter by amount" },
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      slippage: { type: "number", description: "Filter by slippage" },
    },
  },

  "/api/opml": {
    description: "OPML feed list for RSS readers",
  },

  "/api/options": {
    description: "Crypto options market data and analytics",
    parameters: {
      underlying: { type: "string", description: "Filter by underlying" },
      view: { type: "string", description: "Filter by view", default: "dashboard" },
      expiry: { type: "string", description: "Filter by expiry" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/oracle": {
    description: "Price oracle overview and comparison",
    methods: ["POST", "GET"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
    },
  },

  "/api/oracle/chainlink": {
    description: "Chainlink oracle data feed for crypto sentiment",
    methods: ["GET", "POST"],
    parameters: {
      format: { type: "string", description: "Response format", default: "standard" },
    },
  },

  "/api/oracle/prices": {
    description: "Aggregated oracle price feeds",
    parameters: {
      assets: { type: "string", description: "Filter by assets", default: "bitcoin,ethereum,binancecoin,solana,ripple" },
      currency: { type: "string", description: "Filter by currency", default: "usd" },
    },
  },

  "/api/orderbook": {
    description: "Order book depth and liquidity data",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)", default: "BTC" },
      market: { type: "string", description: "Filter by market", default: "spot" },
      view: { type: "string", description: "Filter by view", default: "aggregated" },
      exchanges: { type: "string", description: "Filter by exchanges" },
      orderSize: { type: "number", description: "Filter by orderSize" },
      side: { type: "string", description: "Filter by side", default: "buy" },
      depth: { type: "number", description: "Filter by depth", default: "20" },
    },
  },

  "/api/orderbook/stream": {
    description: "Real-time order book updates via Server-Sent Events",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
  },

  "/api/podcast": {
    description: "Crypto podcast feed and episodes",
  },

  "/api/portfolio": {
    description: "Portfolio tracking and management",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      prices: { type: "string", description: "Filter by prices" },
    },
  },

  "/api/portfolio/benchmark": {
    description: "Portfolio performance benchmarking against indices",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      weights: { type: "string", description: "Filter by weights" },
      days: { type: "number", description: "Number of days of historical data", default: "30" },
      benchmarks: { type: "string", description: "Filter by benchmarks", default: "bitcoin,ethereum" },
    },
  },

  "/api/portfolio/correlation": {
    description: "Intra-portfolio asset correlation analysis",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      days: { type: "number", description: "Number of days of historical data", default: "90" },
    },
  },

  "/api/portfolio/holding": {
    description: "Add or update portfolio holdings",
    methods: ["POST", "PATCH", "DELETE"],
    parameters: {
      portfolioId: { type: "string", description: "Filter by portfolioId" },
      coinId: { type: "string", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)" },
    },
  },

  "/api/portfolio/performance": {
    description: "Portfolio performance charts and metrics",
    methods: ["POST"],
  },

  "/api/portfolio/tax": {
    description: "Portfolio tax implications calculator",
    methods: ["GET", "POST", "DELETE"],
    parameters: {
      portfolio_id: { type: "string", description: "Filter by portfolio id", default: "demo" },
      year: { type: "number", description: "Filter by year" },
      jurisdiction: { type: "string", description: "Filter by jurisdiction", default: "US" },
      method: { type: "string", description: "Filter by method" },
      format: { type: "string", description: "Response format", default: "json" },
    },
  },

  "/api/portfolio/tax-report": {
    description: "Generate comprehensive portfolio tax reports",
    methods: ["POST"],
  },

  "/api/predictions": {
    description: "Crypto price prediction market data",
    methods: ["GET", "POST"],
    parameters: {
      userId: { type: "string", description: "User identifier" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
      status: { type: "string", description: "Filter by status" },
      view: { type: "string", description: "Filter by view", default: "list" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      minPredictions: { type: "number", description: "Filter by minPredictions", default: "5" },
    },
  },

  "/api/predictions/history": {
    description: "Historical prediction accuracy tracking",
  },

  "/api/predictions/markets": {
    description: "Prediction market listings and odds",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "list" },
      userId: { type: "string", description: "User identifier", default: "demo_user" },
      id: { type: "string", description: "Unique identifier" },
      status: { type: "string", description: "Filter by status" },
      category: { type: "string", description: "Filter by category" },
    },
  },

  "/api/premium": {
    description: "Premium tier overview and features",
  },

  "/api/premium/ai/analyze": {
    description: "Premium deep AI market analysis with full reports",
  },

  "/api/premium/ai/compare": {
    description: "Premium AI-powered multi-asset comparison",
  },

  "/api/premium/ai/sentiment": {
    description: "Premium granular AI sentiment analysis",
  },

  "/api/premium/ai/signals": {
    description: "Premium AI trading signals with confidence scores",
  },

  "/api/premium/ai/summary": {
    description: "Premium AI executive market summary",
  },

  "/api/premium/alerts/custom": {
    description: "Premium custom alert rule configuration",
  },

  "/api/premium/alerts/whales": {
    description: "Premium whale activity alerts",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs", default: "bitcoin,ethereum" },
      minThreshold: { type: "number", description: "Filter by minThreshold", default: "1000000" },
      concentration: { type: "string", description: "Filter by concentration" },
    },
  },

  "/api/premium/analytics/screener": {
    description: "Premium advanced crypto screener",
  },

  "/api/premium/defi/protocols": {
    description: "Premium detailed DeFi protocol analytics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "500" },
      category: { type: "string", description: "Filter by category" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      chains: { type: "string", description: "Filter by chains" },
      minTvl: { type: "number", description: "Filter by minTvl", default: "0" },
    },
  },

  "/api/premium/export/portfolio": {
    description: "Premium portfolio data export",
    parameters: {
      format: { type: "string", description: "Response format", default: "json" },
      portfolio_id: { type: "string", description: "Filter by portfolio id" },
    },
  },

  "/api/premium/market/coins": {
    description: "Premium enhanced coin market data",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      details: { type: "string", description: "Filter by details" },
    },
  },

  "/api/premium/market/history": {
    description: "Premium historical market data with full depth",
    parameters: {
      coinId: { type: "string", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)" },
      range: { type: "string", description: "Filter by range", default: "1y" },
      currency: { type: "string", description: "Filter by currency", default: "usd" },
      ohlc: { type: "string", description: "Filter by ohlc" },
    },
  },

  "/api/premium/portfolio/analytics": {
    description: "Premium portfolio analytics and insights",
  },

  "/api/premium/screener/advanced": {
    description: "Premium advanced multi-factor crypto screener",
  },

  "/api/premium/smart-money": {
    description: "Premium smart money and institutional flow tracking",
  },

  "/api/premium/whales/alerts": {
    description: "Premium whale movement alert configuration",
  },

  "/api/premium/whales/transactions": {
    description: "Premium detailed whale transaction data",
  },

  "/api/press-release": {
    description: "Crypto press release aggregation",
    methods: ["POST", "GET"],
  },

  "/api/prices": {
    description: "Real-time cryptocurrency prices",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
    },
  },

  "/api/prices/stream": {
    description: "Real-time price updates via Server-Sent Events",
    streaming: true,
    parameters: {
      symbols: { type: "string", description: "Comma-separated trading symbols" },
    },
  },

  "/api/rag": {
    description: "RAG (Retrieval-Augmented Generation) system overview",
    methods: ["POST", "GET"],
  },

  "/api/rag/ask": {
    description: "Ask questions with AI-powered retrieval-augmented generation",
    methods: ["POST"],
  },

  "/api/rag/batch": {
    description: "Batch RAG queries for multiple questions",
    methods: ["POST"],
  },

  "/api/rag/eval": {
    description: "Evaluate RAG system quality and relevance",
    methods: ["GET", "POST"],
  },

  "/api/rag/feedback": {
    description: "Submit feedback on RAG response quality",
    methods: ["POST", "GET"],
    parameters: {
      alerts: { type: "string", description: "Filter by alerts" },
      all: { type: "string", description: "Filter by all" },
      variant: { type: "string", description: "Filter by variant" },
      compare: { type: "string", description: "Filter by compare" },
      export: { type: "string", description: "Filter by export" },
      includeNegatives: { type: "string", description: "Filter by includeNegatives" },
      limit: { type: "number", description: "Maximum number of results to return", default: "5000" },
      ack: { type: "string", description: "Filter by ack" },
    },
  },

  "/api/rag/personalization": {
    description: "Personalized RAG based on user preferences",
    methods: ["POST", "GET", "DELETE"],
    parameters: {
      userId: { type: "string", description: "User identifier" },
      export: { type: "string", description: "Filter by export" },
      privacy: { type: "string", description: "Filter by privacy" },
    },
  },

  "/api/rag/search": {
    description: "RAG vector search without LLM generation",
    methods: ["POST"],
  },

  "/api/rag/stream": {
    description: "Streaming RAG responses via Server-Sent Events",
    methods: ["POST"],
    streaming: true,
  },

  "/api/rag/timeline": {
    description: "Timeline-aware RAG for chronological crypto analysis",
    methods: ["POST"],
  },

  "/api/regulatory": {
    description: "Regulatory news and policy updates",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "events" },
      jurisdiction: { type: "string", description: "Filter by jurisdiction" },
      agency: { type: "string", description: "Filter by agency" },
      actionType: { type: "string", description: "Filter by actionType" },
      impact: { type: "string", description: "Filter by impact" },
      sector: { type: "string", description: "Filter by sector" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      offset: { type: "number", description: "Number of results to skip", default: "0" },
      days: { type: "number", description: "Number of days of historical data", default: "7" },
      text: { type: "string", description: "Filter by text" },
      title: { type: "string", description: "Filter by title" },
      description: { type: "string", description: "Filter by description" },
    },
  },

  "/api/relationships": {
    description: "Entity relationship mapping in crypto ecosystem",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      actor_type: { type: "string", description: "Filter by actor type" },
      action: { type: "string", description: "API action to perform" },
      sentiment: { type: "string", description: "Filter by sentiment" },
    },
  },

  "/api/research/backtest": {
    description: "Research-grade strategy backtesting",
    methods: ["POST"],
  },

  "/api/rss": {
    description: "RSS feed for crypto news",
    parameters: {
      feed: { type: "string", description: "Filter by feed", default: "all" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/rss-proxy": {
    description: "RSS feed proxy with CORS support",
    parameters: {
      url: { type: "string", description: "Filter by url" },
    },
  },

  "/api/search": {
    description: "Full-text search across news, articles, and data",
    parameters: {
      semantic: { type: "string", description: "Enable semantic search" },
    },
  },

  "/api/search/semantic": {
    description: "Semantic search using vector embeddings",
    methods: ["POST"],
  },

  "/api/search/v2": {
    description: "Enhanced search with advanced filtering and relevance",
    methods: ["GET", "POST"],
  },

  "/api/sentiment": {
    description: "Market sentiment analysis and indicators",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
    },
  },

  "/api/signals": {
    description: "Trading signal generation and analysis",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      min_confidence: { type: "number", description: "Filter by min confidence", default: "50" },
      ticker: { type: "string", description: "Filter by ticker" },
    },
  },

  "/api/signals/narrative": {
    description: "Narrative-based trading signals",
    parameters: {
      signals: { type: "string", description: "Filter by signals" },
    },
  },

  "/api/social": {
    description: "Social media analytics overview",
    methods: ["GET", "POST"],
    parameters: {
      view: { type: "string", description: "Filter by view", default: "full" },
      symbols: { type: "string", description: "Comma-separated trading symbols" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      platform: { type: "string", description: "Filter by platform", default: "all" },
      format: { type: "string", description: "Response format", default: "json" },
    },
  },

  "/api/social/coins": {
    description: "Social metrics for individual cryptocurrencies",
    parameters: {
      symbols: { type: "string", description: "Comma-separated trading symbols" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/social/discord": {
    description: "Discord community analytics for crypto projects",
    parameters: {
      channel_id: { type: "string", description: "Filter by channel id" },
      guild_id: { type: "string", description: "Filter by guild id" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      keyword: { type: "string", description: "Filter by keyword" },
      ticker: { type: "string", description: "Filter by ticker" },
    },
  },

  "/api/social/influencer-score": {
    description: "Calculate influencer impact score",
    methods: ["GET", "POST"],
    parameters: {
      handle: { type: "string", description: "Filter by handle" },
      platform: { type: "string", description: "Filter by platform", default: "twitter" },
      min_score: { type: "number", description: "Filter by min score", default: "0" },
    },
  },

  "/api/social/influencers": {
    description: "Crypto social media influencer rankings",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/social/sentiment": {
    description: "Aggregated social media sentiment analysis",
  },

  "/api/social/sentiment/market": {
    description: "Market-wide social sentiment overview",
  },

  "/api/social/topics/trending": {
    description: "Trending topics across crypto social media",
  },

  "/api/social/trending-narratives": {
    description: "Trending narratives and themes from social data",
  },

  "/api/social/x/lists": {
    description: "X/Twitter crypto list management and monitoring",
    methods: ["GET", "POST"],
  },

  "/api/social/x/sentiment": {
    description: "X/Twitter-specific crypto sentiment analysis",
    parameters: {
      list: { type: "string", description: "Filter by list", default: "default" },
      refresh: { type: "string", description: "Filter by refresh" },
      tweets: { type: "number", description: "Filter by tweets", default: "10" },
    },
  },

  "/api/solana": {
    description: "Solana blockchain overview and statistics",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      mint: { type: "string", description: "Token mint address" },
      view: { type: "string", description: "Filter by view" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/solana/assets": {
    description: "Solana digital asset data",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      id: { type: "string", description: "Unique identifier" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/solana/balances": {
    description: "Solana wallet token balances",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
    },
  },

  "/api/solana/collections": {
    description: "Solana NFT collection data",
    parameters: {
      groupKey: { type: "string", description: "Filter by groupKey" },
      groupValue: { type: "string", description: "Filter by groupValue" },
      creator: { type: "string", description: "Filter by creator" },
      authority: { type: "string", description: "Filter by authority" },
      proof: { type: "string", description: "Filter by proof" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/solana/defi": {
    description: "Solana DeFi protocol data and yields",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
    },
  },

  "/api/solana/nfts": {
    description: "Solana NFT market data",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      source: { type: "string", description: "Filter by news source" },
    },
  },

  "/api/solana/priority-fees": {
    description: "Solana priority fee estimates",
    parameters: {
      accounts: { type: "string", description: "Filter by accounts" },
    },
  },

  "/api/solana/search": {
    description: "Search Solana tokens and accounts",
    parameters: {
      owner: { type: "string", description: "Wallet owner address" },
      creator: { type: "string", description: "Filter by creator" },
      collection: { type: "string", description: "Filter by collection" },
      compressed: { type: "string", description: "Filter by compressed" },
      frozen: { type: "string", description: "Filter by frozen" },
      burnt: { type: "string", description: "Filter by burnt" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/solana/tokens": {
    description: "Solana token data with filtering and pagination",
    parameters: {
      owner: { type: "string", description: "Wallet owner address" },
      mint: { type: "string", description: "Token mint address" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/solana/transactions": {
    description: "Solana transaction history",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      source: { type: "string", description: "Filter by news source" },
    },
  },

  "/api/solana/wallet": {
    description: "Solana wallet portfolio and transaction overview",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
    },
  },

  "/api/sources": {
    description: "News source listings and metadata",
    parameters: {
      token: { type: "string", description: "Filter by token" },
    },
  },

  "/api/sse": {
    description: "Server-Sent Events connection for real-time updates",
    streaming: true,
    parameters: {
      sources: { type: "string", description: "Comma-separated list of sources" },
      categories: { type: "string", description: "Filter by categories" },
      breaking: { type: "string", description: "Filter by breaking" },
    },
  },

  "/api/stablecoins": {
    description: "Stablecoin market overview and supply data",
    parameters: {
      chains: { type: "string", description: "Filter by chains" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/stablecoins/chains": {
    description: "Stablecoin distribution across blockchains",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
    },
  },

  "/api/stablecoins/depeg": {
    description: "Stablecoin depeg monitoring and alerts",
  },

  "/api/stablecoins/dominance": {
    description: "Stablecoin market dominance metrics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
    },
  },

  "/api/stablecoins/flows": {
    description: "Stablecoin capital flow tracking",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
  },

  "/api/sui": {
    description: "Sui blockchain overview and statistics",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      object: { type: "string", description: "Filter by object" },
      tx: { type: "string", description: "Filter by tx" },
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
      view: { type: "string", description: "Filter by view" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      cursor: { type: "string", description: "Filter by cursor" },
    },
  },

  "/api/sui/balances": {
    description: "Sui wallet balances and token holdings",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
    },
  },

  "/api/sui/objects": {
    description: "Sui object data and state",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      id: { type: "string", description: "Unique identifier" },
      ids: { type: "string", description: "Comma-separated IDs" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      cursor: { type: "string", description: "Filter by cursor" },
    },
  },

  "/api/sui/transactions": {
    description: "Sui transaction history and details",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      digest: { type: "string", description: "Filter by digest" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      cursor: { type: "string", description: "Filter by cursor" },
    },
  },

  "/api/summarize": {
    description: "Summarize crypto news articles",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "5" },
      source: { type: "string", description: "Filter by news source" },
      style: { type: "string", description: "Output style or format", default: "brief" },
    },
  },

  "/api/tags": {
    description: "News tag listings and tag-based browsing",
    parameters: {
      slug: { type: "string", description: "Filter by slug" },
      category: { type: "string", description: "Filter by category" },
      sort: { type: "string", description: "Sort field" },
    },
  },

  "/api/token-unlocks": {
    description: "Upcoming token unlock schedules and amounts",
    parameters: {
      impact: { type: "string", description: "Filter by impact" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/tokenterminal": {
    description: "Token Terminal fundamental data",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "summary" },
      protocol: { type: "string", description: "Filter by protocol" },
      limit: { type: "number", description: "Maximum number of results to return" },
    },
  },

  "/api/trading/arbitrage": {
    description: "Trading arbitrage opportunity detection",
    parameters: {
      type: { type: "string", description: "Data or content type", default: "all" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      minSpread: { type: "number", description: "Filter by minSpread", default: "0" },
      minProfit: { type: "number", description: "Filter by minProfit", default: "0" },
      exchange: { type: "string", description: "Filter by exchange" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      sortBy: { type: "string", description: "Filter by sortBy", default: "score" },
      view: { type: "string", description: "Filter by view", default: "opportunities" },
    },
  },

  "/api/trading/options": {
    description: "Options trading data and strategies",
    parameters: {
      view: { type: "string", description: "Filter by view", default: "dashboard" },
      underlying: { type: "string", description: "Filter by underlying", default: "BTC" },
      expiry: { type: "string", description: "Filter by expiry" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      unusual: { type: "string", description: "Filter by unusual" },
      blocks: { type: "string", description: "Filter by blocks" },
      minPremium: { type: "number", description: "Filter by minPremium", default: "0" },
    },
  },

  "/api/trading/orderbook": {
    description: "Trading order book analysis",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      view: { type: "string", description: "Filter by view", default: "aggregated" },
      depth: { type: "number", description: "Filter by depth", default: "25" },
      exchanges: { type: "string", description: "Filter by exchanges" },
      market: { type: "string", description: "Filter by market", default: "spot" },
      size: { type: "number", description: "Filter by size", default: "10000" },
      side: { type: "string", description: "Filter by side", default: "both" },
    },
  },

  "/api/tradingview": {
    description: "TradingView integration and chart data",
    parameters: {
      action: { type: "string", description: "API action to perform", default: "config" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      query: { type: "string", description: "Search query string" },
      type: { type: "string", description: "Data or content type" },
      exchange: { type: "string", description: "Filter by exchange" },
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      from: { type: "number", description: "Start date (ISO 8601 or YYYY-MM-DD)", default: "0" },
      to: { type: "number", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      resolution: { type: "string", description: "Filter by resolution", default: "D" },
      countback: { type: "number", description: "Filter by countback" },
      symbols: { type: "string", description: "Comma-separated trading symbols" },
      theme: { type: "string", description: "Filter by theme", default: "dark" },
    },
  },

  "/api/translate": {
    description: "Translate crypto news across languages",
    methods: ["POST", "GET"],
  },

  "/api/trending": {
    description: "Trending cryptocurrencies and topics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      hours: { type: "number", description: "Filter by hours", default: "24" },
    },
  },

  "/api/unlocks": {
    description: "Token unlock events and vesting schedules",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      project: { type: "string", description: "DeFi project or protocol name" },
      calendar: { type: "string", description: "Filter by calendar" },
    },
  },

  "/api/v1": {
    description: "API v1 root - version info and available endpoints",
  },

  "/api/v1/ai/explain": {
    description: "AI explanation of crypto concepts",
    parameters: {
      term: { type: "string", description: "Filter by term" },
      q: { type: "string", description: "Search query string" },
      level: { type: "string", description: "Filter by level", default: "beginner" },
    },
  },

  "/api/v1/ai/research": {
    description: "AI deep research on crypto topics",
    parameters: {
      topic: { type: "string", description: "Topic or subject to analyze" },
      q: { type: "string", description: "Search query string" },
      depth: { type: "string", description: "Filter by depth", default: "standard" },
    },
  },

  "/api/v1/alerts": {
    description: "Alert management for price and event triggers",
  },

  "/api/v1/ask": {
    description: "Ask natural language questions about crypto",
    parameters: {
      q: { type: "string", description: "Search query string" },
      question: { type: "string", description: "Filter by question" },
      context_size: { type: "number", description: "Filter by context size", default: "20" },
    },
  },

  "/api/v1/assets": {
    description: "Cryptocurrency asset listings and metadata",
    parameters: {
      id: { type: "string", description: "Unique identifier" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/v1/bitcoin": {
    description: "Bitcoin network data and statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
  },

  "/api/v1/categories": {
    description: "News and market category listings",
  },

  "/api/v1/classify": {
    description: "Classify text or articles by crypto topic",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      source: { type: "string", description: "Filter by news source" },
    },
  },

  "/api/v1/coins": {
    description: "List all cryptocurrencies with market data, pagination, and sorting",
  },

  "/api/v1/defi": {
    description: "DeFi protocol data and statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      category: { type: "string", description: "Filter by category" },
    },
  },

  "/api/v1/derivatives": {
    description: "Derivatives market data",
  },

  "/api/v1/dex": {
    description: "DEX trading data and analytics",
  },

  "/api/v1/digest": {
    description: "AI-generated market digest",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/v1/exchanges": {
    description: "Exchange listings and market data",
    parameters: {
      page: { type: "number", description: "Page number for pagination", default: "1" },
      per_page: { type: "number", description: "Results per page", default: "50" },
    },
  },

  "/api/v1/export": {
    description: "Bulk data export in JSON or CSV format",
    parameters: {
      format: { type: "string", description: "Response format", default: "json" },
      type: { type: "string", description: "Data or content type", default: "coins" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/v1/fear-greed": {
    description: "Fear & Greed Index with historical trend",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
    },
  },

  "/api/v1/forecast": {
    description: "AI price forecasting",
    parameters: {
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
      horizon: { type: "string", description: "Filter by horizon", default: "1d" },
      action: { type: "string", description: "API action to perform" },
    },
  },

  "/api/v1/fundamentals": {
    description: "Crypto project fundamentals and metrics",
  },

  "/api/v1/gas": {
    description: "Gas price data",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)" },
    },
  },

  "/api/v1/global": {
    description: "Global crypto market statistics",
  },

  "/api/v1/knowledge-graph": {
    description: "Crypto entity knowledge graph",
    parameters: {
      stats: { type: "string", description: "Filter by stats" },
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      entity: { type: "string", description: "Filter by entity" },
      impact: { type: "string", description: "Filter by impact" },
      hops: { type: "number", description: "Filter by hops", default: "2" },
      q: { type: "string", description: "Search query string" },
      search: { type: "number", description: "Filter by search" },
      format: { type: "string", description: "Response format", default: "d3" },
    },
  },

  "/api/v1/liquidations": {
    description: "Liquidation data from futures markets",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      min_value: { type: "number", description: "Filter by min value", default: "0" },
    },
  },

  "/api/v1/market-data": {
    description: "Global cryptocurrency market statistics and trending coins",
  },

  "/api/v1/narratives": {
    description: "AI-identified market narratives",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "40" },
      emerging: { type: "string", description: "Filter by emerging" },
    },
  },

  "/api/v1/news": {
    description: "Latest crypto news with filtering and pagination",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      source: { type: "string", description: "Filter by news source" },
      category: { type: "string", description: "Filter by category" },
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      per_page: { type: "number", description: "Results per page", default: "20" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
      sort: { type: "string", description: "Sort field" },
    },
  },

  "/api/v1/ohlcv": {
    description: "OHLCV candlestick market data",
  },

  "/api/v1/onchain": {
    description: "On-chain analytics data",
  },

  "/api/v1/orderbook": {
    description: "Order book depth data",
  },

  "/api/v1/predictions": {
    description: "Price prediction submissions and data",
    methods: ["GET", "POST"],
    parameters: {
      userId: { type: "string", description: "User identifier" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
      status: { type: "string", description: "Filter by status" },
      view: { type: "string", description: "Filter by view", default: "list" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      minPredictions: { type: "number", description: "Filter by minPredictions", default: "5" },
    },
  },

  "/api/v1/search": {
    description: "Search across news and market data",
    parameters: {
      q: { type: "string", description: "Search query string" },
      query: { type: "string", description: "Search query string" },
    },
  },

  "/api/v1/sentiment": {
    description: "AI sentiment analysis for crypto assets",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
    },
  },

  "/api/v1/signals": {
    description: "Trading signals with confidence scores",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      min_confidence: { type: "number", description: "Filter by min confidence", default: "50" },
    },
  },

  "/api/v1/sources": {
    description: "News source listings",
  },

  "/api/v1/stablecoins": {
    description: "Stablecoin market data",
  },

  "/api/v1/summarize": {
    description: "AI article summarization",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      source: { type: "string", description: "Filter by news source" },
      style: { type: "string", description: "Output style or format", default: "brief" },
    },
  },

  "/api/v1/system/status": {
    description: "API system health and status",
  },

  "/api/v1/tags": {
    description: "Tag-based content browsing",
    parameters: {
      slug: { type: "string", description: "Filter by slug" },
      category: { type: "string", description: "Filter by category" },
      sort: { type: "string", description: "Sort field" },
    },
  },

  "/api/v1/trending": {
    description: "Trending cryptocurrencies and topics",
  },

  "/api/v1/usage": {
    description: "API usage statistics for your key",
    parameters: {
      api_key: { type: "string", description: "Filter by api key" },
    },
  },

  "/api/v1/whale-alerts": {
    description: "Large cryptocurrency transaction alerts",
    parameters: {
      blockchain: { type: "string", description: "Blockchain to filter by", default: "all" },
      minValue: { type: "number", description: "Minimum transaction value in USD", default: "100000" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/v1/x402": {
    description: "x402 micropayment protocol info and status",
  },

  "/api/validators": {
    description: "Blockchain validator data and statistics",
    parameters: {
      view: { type: "string", description: "Filter by view" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/vector-search": {
    description: "Vector similarity search across crypto content",
    methods: ["GET", "POST"],
    parameters: {
      q: { type: "string", description: "Search query string" },
      action: { type: "string", description: "API action to perform" },
      articleId: { type: "string", description: "Article unique identifier" },
      topK: { type: "number", description: "Filter by topK", default: "10" },
      alpha: { type: "number", description: "Filter by alpha", default: "0.7" },
      temporalDecay: { type: "number", description: "Filter by temporalDecay", default: "0" },
      minScore: { type: "number", description: "Filter by minScore", default: "0.3" },
      numTopics: { type: "number", description: "Filter by numTopics", default: "8" },
      dateStart: { type: "string", description: "Filter by dateStart" },
      dateEnd: { type: "string", description: "Filter by dateEnd" },
      categories: { type: "string", description: "Filter by categories" },
      sources: { type: "string", description: "Comma-separated list of sources" },
    },
  },

  "/api/videos": {
    description: "Crypto video content aggregation",
  },

  "/api/watchlist": {
    description: "Watchlist management for tracking assets",
    methods: ["GET", "POST", "DELETE", "PUT"],
    parameters: {
      check: { type: "string", description: "Filter by check" },
      prices: { type: "string", description: "Filter by prices" },
      clear: { type: "string", description: "Filter by clear" },
      coinId: { type: "string", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)" },
    },
  },

  "/api/whale-alerts": {
    description: "Real-time large transaction monitoring",
    parameters: {
      blockchain: { type: "string", description: "Blockchain to filter by", default: "all" },
      minValue: { type: "number", description: "Minimum transaction value in USD", default: "100000" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/whale-alerts/context": {
    description: "Whale alert enrichment with market context and AI analysis",
    parameters: {
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
      amount: { type: "number", description: "Filter by amount" },
      amountUsd: { type: "number", description: "Filter by amountUsd" },
      type: { type: "string", description: "Data or content type" },
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
    },
  },

  "/api/whales": {
    description: "Whale wallet tracking and analysis",
    parameters: {
      limit: { type: "string", description: "Maximum number of results to return", default: "10" },
      min_usd: { type: "string", description: "Filter by min usd", default: "1000000" },
    },
  },

  "/api/ws": {
    description: "WebSocket connection for real-time data streams",
    streaming: true,
    parameters: {
      mode: { type: "string", description: "Filter by mode" },
    },
  },

  "/api/yields": {
    description: "DeFi yield farming opportunities",
    parameters: {
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
    },
  },

};

/** Total documented endpoints. */
export const ENDPOINT_COUNT = 353;
