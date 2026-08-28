/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 */

/**
 * AUTO-GENERATED — Do not edit manually.
 * Run: node scripts/generate-endpoint-metadata.js
 *
 * Generated: 2026-08-28T02:08:43.532Z
 * Total endpoints: 394
 *
 * Comprehensive endpoint metadata for OpenAPI spec generation,
 * x402 Bazaar agent discovery, and API documentation.
 */

import type { EndpointMeta } from '@/lib/x402/pricing';

export interface EndpointMetaExtended extends EndpointMeta {
  methods?: string[];
  streaming?: boolean;
  /** Response schema per HTTP method, derived from the handler's success bodies. */
  outputSchemas?: Record<string, object>;
}

/**
 * Complete endpoint metadata for all 394 discoverable API routes.
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"count":{"type":"number"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{}}}},
  },

  "/api/ai": {
    description: "AI-powered analysis and intelligence",
    methods: ["GET", "POST"],
    outputSchemas: {"GET":{"type":"object","properties":{"configured":{},"provider":{},"availableActions":{"type":"array"},"usage":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"action":{},"provider":{},"result":{}}}},
  },

  "/api/ai-anchor": {
    description: "AI news anchor video generation from crypto news",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "info" },
      jobId: { type: "string", description: "Async job identifier" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"anchors":{},"job":{},"videos":{"type":"array"},"service":{"type":"string"},"description":{"type":"string"},"features":{"type":"array"},"pricing":{"type":"object"},"integrations":{"type":"object"},"_links":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"jobId":{},"job":{},"message":{"type":"string"},"estimatedTime":{"type":"string"},"checkStatus":{"type":"string"},"script":{},"wordCount":{"type":"number"},"estimatedDuration":{},"articleCount":{"type":"number"}}}},
  },

  "/api/ai/blog-generator": {
    description: "AI blog post generator from clustered crypto news topics",
    methods: ["POST", "GET"],
    parameters: {
      topics: { type: "number", description: "Number of topics or comma-separated topic list", default: "3" },
      days: { type: "number", description: "Number of days of historical data", default: "7" },
      commit: { type: "string", description: "Commit changes (true/false)" },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"generated":{"type":"number"},"date":{},"articlesAnalysed":{"type":"number"},"posts":{"type":"array"}},"additionalProperties":true},"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"description":{"type":"string"},"params":{"type":"object"},"requires":{"type":"array"},"optional":{"type":"array"},"example":{"type":"string"}}}},
  },

  "/api/ai/brief": {
    description: "Generate a daily AI-powered crypto news brief",
    parameters: {
      date: { type: "string", description: "Date in YYYY-MM-DD format" },
      format: { type: "string", description: "Response format", default: "full" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"brief":{}}}},
  },

  "/api/ai/correlation": {
    description: "AI-driven correlation analysis between crypto assets",
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"correlations":{},"summary":{},"significantMovers":{},"articlesAnalyzed":{"type":"number"},"coinsAnalyzed":{"type":"number"},"generatedAt":{"type":"string"}}}},
  },

  "/api/ai/counter": {
    description: "AI counter-argument generation for crypto narratives",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"counter":{}}},"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"method":{"type":"string"},"description":{"type":"string"},"configured":{},"usage":{"type":"object"},"response":{"type":"object"}}}},
  },

  "/api/ai/cross-lingual": {
    description: "Cross-lingual crypto news analysis and translation",
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"message":{"type":"string"},"hint":{"type":"string"},"articleCounts":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/ai/debate": {
    description: "AI-powered debate between bull and bear perspectives",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"debate":{}}},"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"method":{"type":"string"},"description":{"type":"string"},"configured":{},"usage":{"type":"object"},"response":{"type":"object"}}}},
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
    outputSchemas: {"POST":{"type":"object","properties":{"entities":{},"count":{"type":"number"},"types":{"type":"array"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"topic":{},"message":{"type":"string"},"suggestion":{"type":"string"},"availableTopics":{"type":"array"},"explanation":{},"articleCount":{"type":"number"},"recentHeadlines":{"type":"array"},"generatedAt":{"type":"string"}}}},
  },

  "/api/ai/flash-briefing": {
    description: "Flash briefing format for voice assistants",
    parameters: {
      stories: { type: "number", description: "Filter by stories", default: "5" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"articlesAnalyzed":{"type":"number"}},"additionalProperties":true}},
  },

  "/api/ai/narratives": {
    description: "AI-identified market narratives and themes",
    parameters: {
      predict: { type: "string", description: "Filter by predict" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"error":{"type":"string"},"availableNarratives":{"type":"array"},"narrative":{"type":"object"},"prediction":{},"generatedAt":{"type":"string"},"marketCycle":{},"headlinesAnalyzed":{"type":"number"}},"additionalProperties":true}},
  },

  "/api/ai/oracle": {
    description: "AI oracle for crypto market predictions",
    methods: ["POST", "GET"],
    parameters: {
      q: { type: "string", description: "Search query string" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"answer":{},"sources":{}}}},
  },

  "/api/ai/portfolio-news": {
    description: "AI-curated news relevant to a specific portfolio",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"portfolioSize":{"type":"number"},"articlesAnalyzed":{"type":"number"},"relevantArticles":{"type":"number"},"byUrgency":{"type":"object"},"articles":{"type":"object"},"generatedAt":{"type":"string"}}}},
  },

  "/api/ai/relationships": {
    description: "AI-detected relationships between crypto entities and events",
    methods: ["POST"],
    parameters: {
      text: { type: "string", description: "Filter by text", required: true },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"text_length":{"type":"number"},"relationships":{},"count":{"type":"number"}}}},
  },

  "/api/ai/research": {
    description: "Deep AI research reports on crypto topics",
    parameters: {
      topic: { type: "string", description: "Topic or subject to analyze" },
      mode: { type: "string", description: "Filter by mode" },
      compare: { type: "string", description: "Filter by compare" },
      contrarian: { type: "string", description: "Filter by contrarian" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"error":{"type":"string"},"asset1Count":{"type":"number"},"asset2Count":{"type":"number"},"suggestion":{"type":"string"},"availableTopics":{"type":"array"},"quickTake":{},"articlesAnalyzed":{"type":"number"},"report":{}},"additionalProperties":true}},
  },

  "/api/ai/social": {
    description: "AI analysis of social media crypto sentiment",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"meta":{"type":"object"}},"additionalProperties":true},"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"description":{"type":"string"},"body":{"type":"object"},"notes":{"type":"string"},"requires":{"type":"array"},"example":{"type":"object"}}}},
  },

  "/api/ai/source-quality": {
    description: "AI assessment of news source credibility and quality",
    methods: ["GET", "POST"],
    parameters: {
      source: { type: "string", description: "Filter by news source" },
      category: { type: "string", description: "Filter by category" },
      clickbait: { type: "string", description: "Filter by clickbait" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"articlesAnalyzed":{"type":"number"},"clickbaitCount":{"type":"number"},"clickbaitPercentage":{},"averageClickbaitScore":{},"worstOffenders":{"type":"array"},"cleanArticles":{"type":"array"},"generatedAt":{"type":"string"},"error":{"type":"string"},"availableSources":{"type":"array"},"sourceQuality":{},"rankings":{},"totalSources":{"type":"number"},"totalArticles":{"type":"number"},"sources":{"type":"array"},"hint":{"type":"string"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"quality":{},"clickbait":{},"originality":{"type":"object"},"generatedAt":{"type":"string"}}}},
  },

  "/api/ai/summarize": {
    description: "AI-powered article summarization",
    methods: ["POST", "GET"],
    parameters: {
      url: { type: "string", description: "Filter by url" },
      text: { type: "string", description: "Filter by text" },
      type: { type: "string", description: "Data or content type" },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"summary":{},"type":{},"originalLength":{"type":"number"},"summaryLength":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"synthesizedStories":{"type":"array"},"clustersFound":{"type":"number"},"articlesAnalyzed":{"type":"number"},"generatedAt":{"type":"string"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"synthesis":{},"generatedAt":{"type":"string"}}}},
  },

  "/api/airdrops": {
    description: "Upcoming and active cryptocurrency airdrops",
    parameters: {
      status: { type: "string", description: "Filter by status" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"airdrops":{},"total":{"type":"number"},"active":{"type":"number"},"upcoming":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"checked":{"type":"boolean"},"notifications":{"type":"object"},"results":{},"evaluated":{"type":"boolean"},"eventsTriggered":{"type":"number"},"events":{},"legacy":{},"enhanced":{},"alerts":{},"total":{"type":"number"},"history":{}}},"POST":{"type":"object","properties":{"alert":{},"success":{"type":"boolean"}}},"DELETE":{"type":"object","properties":{"success":{},"message":{}}},"PATCH":{"type":"object","properties":{"success":{},"message":{}}}},
  },

  "/api/alerts/stream": {
    description: "Real-time alert notifications via Server-Sent Events",
    streaming: true,
    parameters: {
      user_id: { type: "string", description: "Filter by user id" },
      session_id: { type: "string", description: "Filter by session id" },
    },
  },

  "/api/alerts/{id}": {
    description: "Individual Alert Management API Handles GET, PUT, DELETE operations for individual alert rules.",
    methods: ["GET", "PUT", "DELETE", "POST", "PATCH"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
      alertId: { type: "string", description: "Filter by alertId" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/alexa": {
    description: "Alexa skill integration endpoint",
    methods: ["POST", "GET"],
    outputSchemas: {"GET":{"type":"object","properties":{"skill":{"type":"string"},"version":{"type":"string"},"description":{"type":"string"},"intents":{"type":"array"},"invocationName":{"type":"string"},"examplePhrases":{"type":"array"},"endpoint":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"event":{},"events":{},"count":{"type":"number"},"timestamp":{"type":"string"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"event":{},"analysis":{},"assessment":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"buffered":{"type":"number"},"maxBuffer":{},"eventCounts":{},"oldestEvent":{},"newestEvent":{}}}},
  },

  "/api/analytics/forensics": {
    description: "News forensics - coordination detection and origin tracing",
    methods: ["GET", "POST"],
    parameters: {
      action: { type: "string", description: "API action to perform", default: "report" },
      source: { type: "string", description: "Filter by news source" },
      article: { type: "string", description: "Filter by article" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{}}}},
  },

  "/api/analytics/gaps": {
    description: "Coverage gap detection in crypto news",
    outputSchemas: {"GET":{"type":"object","properties":{"analysis_time":{"type":"string"},"total_coins_analyzed":{"type":"number"},"total_articles_analyzed":{"type":"number"},"coverage_gaps":{},"high_coverage":{},"coverage_rate":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"influencers":{},"message":{"type":"string"},"stats":{},"tiers":{},"filters":{"type":"object"},"generatedAt":{"type":"string"},"disclaimer":{"type":"string"}}}},
  },

  "/api/analytics/news-onchain": {
    description: "Correlation between news events and on-chain activity",
    parameters: {
      hours: { type: "number", description: "Filter by hours", default: "24" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"analysis_period":{"type":"string"},"total_news_analyzed":{"type":"number"},"correlations_found":{"type":"number"},"significant_price_moves":{"type":"number"},"correlations":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{"type":"array"},"totalCount":{"type":"number"},"analysis":{"type":"object"},"availableTopics":{"type":"array"},"fetchedAt":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"address":{},"count":{"type":"number"},"balance":{},"balanceApt":{},"chain":{"type":"string"},"endpoints":{"type":"object"},"subroutes":{"type":"object"}},"additionalProperties":true}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"handle":{},"field":{},"count":{"type":"number"},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"creationNumber":{}}}},
  },

  "/api/aptos/resources": {
    description: "Aptos account resources and state",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      type: { type: "string", description: "Data or content type" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"count":{"type":"number"}}}},
  },

  "/api/aptos/transactions": {
    description: "Aptos transaction history and details",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      hash: { type: "string", description: "Transaction hash" },
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
      start: { type: "string", description: "Start position for pagination" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"address":{},"count":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"subscriptionId":{},"message":{"type":"string"},"config":{"type":"object"},"instructions":{"type":"array"},"payload":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"stats":{},"indexType":{},"index":{},"hours":{},"tickers":{},"month":{},"data_points":{"type":"number"},"history":{},"count":{"type":"number"},"total":{},"pagination":{},"lang":{},"availableLanguages":{"type":"array"},"filters":{"type":"object"},"format":{},"articles":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"stats":{"type":"object"},"gateways":{"type":"object"},"verified":{},"item":{},"verificationProof":{"type":"object"},"items":{"type":"array"},"total":{"type":"number"},"configured":{},"setup":{},"_links":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"archived":{},"message":{"type":"string"},"accessUrls":{"type":"object"},"snapshot":{},"articleCount":{},"pinned":{"type":"boolean"},"cid":{},"service":{"type":"string"}}}},
  },

  "/api/archive/status": {
    description: "Archive indexing status and statistics",
    outputSchemas: {"GET":{"type":"object","properties":{"timestamp":{"type":"string"},"endpoints":{"type":"object"},"zeroConfigMode":{"type":"boolean"},"setupInstructions":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/archive/v2": {
    description: "Enhanced news archive with improved search and filtering",
  },

  "/api/archive/webhook": {
    description: "Webhook notifications for archive updates",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"message":{"type":"string"},"timestamp":{"type":"string"},"duration":{},"stats":{"type":"object"},"github":{},"articles":{}}},"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"method":{"type":"string"},"authentication":{"type":"string"},"envRequired":{"type":"array"},"envOptional":{"type":"array"},"externalCronServices":{"type":"array"},"example":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"article":{},"duration":{},"stats":{},"count":{"type":"number"},"articles":{"type":"array"},"ticker":{},"source":{},"query":{}}}},
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

  "/api/authors/{slug}": {
    description: "Authors - {Slug} - Other",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return" },
      offset: { type: "number", description: "Number of results to skip" },
      source: { type: "string", description: "Filter by news source" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"strategies":{"type":"array"},"strategy":{},"performance":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"lang":{},"availableLanguages":{"type":"array"}},"additionalProperties":true}},
  },

  "/api/bitcoin/address/{address}": {
    description: "Returns Bitcoin address info, optionally with transactions",
    parameters: {
      include_txs: { type: "string", description: "Filter by include txs" },
    },
  },

  "/api/bitcoin/block-height": {
    description: "Current Bitcoin block height",
    outputSchemas: {"GET":{"type":"object","properties":{"blockHeight":{}}}},
  },

  "/api/bitcoin/blocks": {
    description: "Recent Bitcoin block data and details",
    parameters: {
      start_height: { type: "string", description: "Starting block height" },
    },
  },

  "/api/bitcoin/blocks/{hash}": {
    description: "Returns a specific Bitcoin block by its hash",
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

  "/api/bitcoin/tx/{txid}": {
    description: "Returns a Bitcoin transaction by its ID",
  },

  "/api/blog/posts": {
    description: "Blog posts about cryptocurrency markets and analysis",
    outputSchemas: {"GET":{"type":"object","properties":{"posts":{},"total":{"type":"number"}}}},
  },

  "/api/breaking": {
    description: "Breaking crypto news headlines",
    parameters: {
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"_stale":{"type":"boolean"}},"additionalProperties":true}},
  },

  "/api/bridges": {
    description: "Cross-chain bridge volume and activity data",
    parameters: {
      bridgeId: { type: "number", description: "Filter by bridgeId" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"bridgeId":{"type":"number"},"history":{},"timestamp":{"type":"string"}}}},
  },

  "/api/chart-analysis": {
    description: "Technical chart pattern analysis",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"analysis":{}}},"GET":{"type":"object","properties":{"analysis":{}}}},
  },

  "/api/charts": {
    description: "Price chart data for cryptocurrencies",
    parameters: {
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
      range: { type: "string", description: "Filter by range", default: "24h" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"coinId":{},"range":{},"prices":{},"ohlc":{},"stats":{},"updatedAt":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"count":{"type":"number"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{}}}},
  },

  "/api/claims": {
    description: "Fact-checkable claims extracted from crypto news",
    methods: ["POST", "GET"],
    outputSchemas: {"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"method":{"type":"string"},"description":{"type":"string"},"request":{"type":"object"},"response":{"type":"object"},"example":{"type":"object"}}}},
  },

  "/api/classify": {
    description: "Classify crypto news articles by category and relevance",
    methods: ["POST", "GET"],
    outputSchemas: {"GET":{"type":"object","properties":{"endpoint":{"type":"string"},"method":{"type":"string"},"description":{"type":"string"},"request":{"type":"object"},"response":{"type":"object"},"example":{"type":"object"}}}},
  },

  "/api/clickbait": {
    description: "Detect clickbait in crypto news headlines",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      threshold: { type: "number", description: "Filter by threshold", default: "0" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"analysis":{"type":"array"},"message":{"type":"string"},"_stale":{"type":"boolean"}},"additionalProperties":true}},
  },

  "/api/coincap": {
    description: "CoinCap market data aggregation",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
      search: { type: "number", description: "Filter by search" },
      offset: { type: "number", description: "Number of results to skip", default: "0" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"count":{"type":"number"},"source":{"type":"string"},"timestamp":{"type":"number"}}}},
  },

  "/api/coincap/assets/{id}": {
    description: "Returns asset details from CoinCap including price, supply, and market cap.",
    parameters: {
      include_markets: { type: "string", description: "Filter by include markets" },
      markets_limit: { type: "number", description: "Filter by markets limit", default: "10" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"count":{"type":"number"},"timestamp":{"type":"string"}}}},
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

  "/api/coinpaprika/tickers/{coinId}": {
    description: "Returns ticker data for a specific coin.",
    parameters: {
      quotes: { type: "string", description: "Filter by quotes", default: "USD" },
    },
  },

  "/api/coinpaprika/tickers/{coinId}/ohlcv": {
    description: "Coinpaprika - Tickers - {CoinId} - Ohlcv - Market Data",
    parameters: {
      quote: { type: "string", description: "Filter by quote", default: "usd" },
      start: { type: "string", description: "Start position for pagination" },
      end: { type: "string", description: "Filter by end" },
      limit: { type: "number", description: "Maximum number of results to return", default: "365" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"coins":{},"summary":{"type":"object"},"timestamp":{"type":"string"},"source":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"},"count":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"timestamp":{"type":"string"},"fsym":{},"tsym":{},"interval":{},"count":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"count":{"type":"number"},"timestamp":{"type":"string"}}}},
  },

  "/api/data-sources": {
    description: "Available data sources and their status",
    parameters: {
      action: { type: "string", description: "API action to perform" },
      category: { type: "string", description: "Filter by category" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"totalSources":{"type":"number"},"healthy":{},"unhealthy":{},"sources":{},"timestamp":{"type":"string"},"category":{},"count":{"type":"number"},"categories":{}}}},
  },

  "/api/data-sources/derivatives": {
    description: "Derivatives data source status and coverage",
    parameters: {
      view: { type: "string", description: "Filter by view", default: "dashboard" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)", default: "BTC" },
      currency: { type: "string", description: "Filter by currency", default: "BTC" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"data":{},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"data":{},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"data":{},"timestamp":{"type":"string"}}}},
  },

  "/api/defi": {
    description: "DeFi protocol overview and aggregate statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"lang":{},"availableLanguages":{"type":"array"}},"additionalProperties":true}},
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

  "/api/defi/yields/{poolId}/chart": {
    description: "Returns historical chart data for a specific yield pool.",
  },

  "/api/derivatives": {
    description: "Crypto derivatives market overview",
  },

  "/api/derivatives/aggregated/funding": {
    description: "Aggregated funding rates across exchanges",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"provider":{},"providers":{},"confidence":{},"cached":{},"latencyMs":{},"timestamp":{}}}},
  },

  "/api/derivatives/aggregated/open-interest": {
    description: "Aggregated open interest across exchanges",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"provider":{},"providers":{},"confidence":{},"cached":{},"latencyMs":{},"timestamp":{}}}},
  },

  "/api/derivatives/bybit/funding/{symbol}": {
    description: "Returns Bybit funding rate history for a symbol",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "200" },
    },
  },

  "/api/derivatives/bybit/open-interest/{symbol}": {
    description: "Returns Bybit open interest data for a symbol",
    parameters: {
      interval: { type: "string", description: "Data interval (e.g., hourly, daily)", default: "1h" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"highest":{"type":"array"},"lowest":{"type":"array"},"providers":{},"confidence":{},"cached":{},"timestamp":{}}}},
  },

  "/api/detect/ai-content": {
    description: "Detect AI-generated content in crypto news",
    methods: ["POST", "GET"],
    outputSchemas: {"POST":{"type":"object","properties":{"mode":{"type":"string"},"timestamp":{"type":"string"},"results":{},"summary":{"type":"object"}},"additionalProperties":true},"GET":{"type":"object","properties":{"name":{"type":"string"},"version":{"type":"string"},"description":{"type":"string"},"methods":{"type":"array"},"requestBody":{"type":"object"},"response":{"type":"object"}}}},
  },

  "/api/dex-volumes": {
    description: "Decentralized exchange trading volumes",
    parameters: {
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      top: { type: "number", description: "Filter by top" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"dexes":{},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"query":{},"data":{},"timestamp":{"type":"string"},"availableQueries":{"type":"array"},"usage":{"type":"object"}}}},
  },

  "/api/entities": {
    description: "Named entity database for crypto organizations and people",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      type: { type: "string", description: "Data or content type" },
      min_mentions: { type: "number", description: "Filter by min mentions", default: "1" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"entities":{},"message":{"type":"string"},"summary":{"type":"object"},"articlesAnalyzed":{"type":"number"},"extractedAt":{"type":"string"}}}},
  },

  "/api/events": {
    description: "Crypto market events and calendar",
    parameters: {
      category: { type: "string", description: "Filter by category" },
      importance: { type: "string", description: "Filter by importance" },
      includePast: { type: "string", description: "Filter by includePast" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"events":{},"total":{"type":"number"},"categories":{"type":"array"},"source":{"type":"string"},"generatedAt":{"type":"string"}}}},
  },

  "/api/exchange-rates": {
    description: "Fiat and crypto exchange rates",
    outputSchemas: {"GET":{"type":"object","properties":{"rates":{"type":"object"},"degraded":{"type":"boolean"}}}},
  },

  "/api/exchange-rates/convert": {
    description: "Currency conversion calculator",
    parameters: {
      from: { type: "string", description: "Start date (ISO 8601 or YYYY-MM-DD)" },
      to: { type: "string", description: "End date (ISO 8601 or YYYY-MM-DD)" },
      amount: { type: "number", description: "Filter by amount", default: "1" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"from":{},"to":{},"amount":{},"result":{},"rate":{},"fromName":{},"toName":{},"timestamp":{"type":"number"}}}},
  },

  "/api/exchanges": {
    description: "Cryptocurrency exchange listings and data",
    parameters: {
      sort: { type: "string", description: "Sort field", default: "trust" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"exchanges":{},"total":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"warning":{"type":"string"},"export":{"type":"object"},"data":{},"_links":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"job":{"type":"object"},"_links":{"type":"object"}}}},
  },

  "/api/export/jobs": {
    description: "Check status of async export jobs",
    parameters: {
      status: { type: "string", description: "Filter by status" },
      cleanup: { type: "string", description: "Filter by cleanup" },
      maxAge: { type: "number", description: "Filter by maxAge", default: "3600000" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"count":{"type":"number"},"jobs":{"type":"array"},"_links":{"type":"object"}}}},
  },

  "/api/export/jobs/{jobId}": {
    description: "Export Job Status API Get status of a specific export job",
    methods: ["GET", "DELETE"],
  },

  "/api/exports": {
    description: "Manage and list data exports",
    methods: ["GET", "POST"],
    parameters: {
      schema: { type: "string", description: "Filter by schema" },
      archives: { type: "string", description: "Filter by archives" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"schemaVersion":{"type":"string"},"schemas":{},"formats":{"type":"array"},"compression":{"type":"array"},"archives":{},"count":{"type":"number"},"jobs":{}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"archive":{},"message":{"type":"string"},"job":{},"statusUrl":{"type":"string"},"downloadUrl":{"type":"string"}}}},
  },

  "/api/exports/{id}": {
    description: "Exports - {Id} - Data Export",
    parameters: {
      download: { type: "string", description: "Set to true for file download response" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"claims":{},"message":{"type":"string"},"stats":{},"articlesAnalyzed":{"type":"number"},"analyzedAt":{"type":"string"}}}},
  },

  "/api/fear-greed": {
    description: "Crypto Fear & Greed Index with historical data",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"_cache":{"type":"string"},"current":{},"historical":{"type":"array"},"trend":{},"breakdown":{},"lastUpdated":{},"_provider":{},"_confidence":{},"_cached":{}},"additionalProperties":true}},
  },

  "/api/feeds": {
    description: "Feeds - Other",
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"usage":{"type":"object"},"feeds":{}}}},
  },

  "/api/fever": {
    description: "Fever - Other",
    methods: ["GET", "POST"],
    parameters: {
      api_key: { type: "string", description: "Filter by api key" },
    },
  },

  "/api/flows": {
    description: "Capital flow tracking across exchanges and wallets",
    parameters: {
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"coin":{},"flows":{},"source":{"type":"string"},"timestamp":{"type":"string"},"symbol":{},"period":{"type":"string"},"sources":{"type":"array"},"market":{},"exchangeBalance":{},"dex":{},"interpretation":{},"signal":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"subscriptionId":{},"message":{"type":"string"},"config":{"type":"object"}}}},
  },

  "/api/funding-rates": {
    description: "Perpetual futures funding rates across exchanges",
  },

  "/api/funding/history/{symbol}": {
    description: "Returns historical funding rate data for a symbol on a given exchange",
    parameters: {
      exchange: { type: "string", description: "Filter by exchange", default: "binance" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
  },

  "/api/gaming": {
    description: "Blockchain gaming ecosystem overview",
    outputSchemas: {"GET":{"type":"object","properties":{"_lineage":{},"_cached":{}},"additionalProperties":true}},
  },

  "/api/gaming/chains": {
    description: "Gaming activity by blockchain",
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"count":{"type":"number"},"_lineage":{},"_cached":{}}}},
  },

  "/api/gaming/top": {
    description: "Top blockchain games by activity and volume",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
      sort: { type: "string", description: "Sort field", default: "dau" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"count":{"type":"number"},"sortBy":{},"chain":{},"_lineage":{},"_cached":{}}}},
  },

  "/api/gas": {
    description: "Ethereum gas prices and network congestion",
    outputSchemas: {"GET":{"type":"object","properties":{"_cache":{"type":"string"},"_provider":{},"_confidence":{},"network":{"type":"string"},"baseFee":{},"low":{"type":"object"},"medium":{"type":"object"},"high":{"type":"object"},"lastBlock":{},"timestamp":{"type":"string"},"source":{"type":"string"},"note":{"type":"string"}},"additionalProperties":true}},
  },

  "/api/gas/estimate": {
    description: "Gas fee estimation for Ethereum and Bitcoin",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)", default: "ethereum" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"network":{"type":"string"},"unit":{"type":"string"},"fast":{"type":"object"},"standard":{"type":"object"},"slow":{"type":"object"},"economy":{"type":"object"},"minimum":{},"timestamp":{"type":"string"},"source":{"type":"string"},"baseFee":{},"lastBlock":{},"note":{"type":"string"}}}},
  },

  "/api/gas/history": {
    description: "Historical gas price data",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)", default: "ethereum" },
      days: { type: "number", description: "Number of days of historical data", default: "7" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"network":{"type":"string"},"current":{},"history":{"type":"array"},"note":{"type":"string"},"days":{},"source":{"type":"string"}}}},
  },

  "/api/geckoterminal": {
    description: "GeckoTerminal DEX data aggregation",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)", default: "eth" },
      type: { type: "string", description: "Data or content type", default: "trending" },
      dex: { type: "string", description: "Filter by dex" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"network":{},"type":{},"count":{"type":"number"},"data":{},"timestamp":{"type":"string"}}}},
  },

  "/api/global": {
    description: "Global cryptocurrency market statistics",
    outputSchemas: {"GET":{"type":"object","properties":{"active_cryptocurrencies":{"type":"number"},"markets":{"type":"number"},"total_market_cap":{"type":"object"},"total_volume":{"type":"object"},"market_cap_percentage":{"type":"object"},"market_cap_change_percentage_24h_usd":{"type":"number"},"updated_at":{"type":"number"}}}},
  },

  "/api/glossary": {
    description: "Cryptocurrency glossary and term definitions",
    parameters: {
      category: { type: "string", description: "Filter by category" },
      q: { type: "string", description: "Search query string" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"terms":{},"total":{"type":"number"},"categories":{"type":"array"}}}},
  },

  "/api/hyperliquid": {
    description: "Hyperliquid perpetual DEX data",
    parameters: {
      type: { type: "string", description: "Data or content type", default: "all" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"exchange":{"type":"string"},"count":{"type":"number"},"data":{},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"widget":{},"analysis":{},"indicators":{},"count":{"type":"number"},"indicator":{},"alerts":{},"availableTypes":{"type":"array"},"availableActions":{"type":"array"},"widgetTypes":{"type":"array"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"code":{},"indicator":{},"alert":{},"message":{"type":"string"}}}},
  },

  "/api/keys": {
    description: "API key management",
    methods: ["GET", "POST", "DELETE"],
    parameters: {
      id: { type: "string", description: "Unique identifier" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"keys":{},"total":{"type":"number"}}},"DELETE":{"type":"object","properties":{"success":{"type":"boolean"},"message":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"stats":{"type":"object"},"forceGraph":{}},"additionalProperties":true},"POST":{"type":"object","properties":{"success":{"type":"boolean"}},"additionalProperties":true}},
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

  "/api/l2/projects/{projectId}": {
    description: "Returns detailed risk assessment for a specific L2 project.",
  },

  "/api/l2/risk": {
    description: "Layer 2 risk assessment and security scores",
    parameters: {
      sort: { type: "string", description: "Sort field" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"projects":{},"sort":{},"total":{"type":"number"}}}},
  },

  "/api/liquidations": {
    description: "Liquidation data from perpetual futures markets",
    outputSchemas: {"GET":{"type":"object","properties":{"bySymbol":{},"recentEvents":{},"totals":{},"source":{},"timestamp":{"type":"number"}}}},
  },

  "/api/macro": {
    description: "Macroeconomic overview relevant to crypto markets",
    outputSchemas: {"GET":{"type":"object","properties":{"_lineage":{},"_cached":{},"_latencyMs":{}},"additionalProperties":true}},
  },

  "/api/macro/correlations": {
    description: "Crypto-macro correlation analysis",
    outputSchemas: {"GET":{"type":"object","properties":{"correlations":{},"pairs":{"type":"number"},"note":{},"timestamp":{"type":"string"}}}},
  },

  "/api/macro/dxy": {
    description: "US Dollar Index (DXY) data and crypto correlation",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{"type":"object"},"count":{"type":"number"},"_lineage":{},"_cached":{}}}},
  },

  "/api/macro/fed": {
    description: "Federal Reserve data, rates, and yield curves",
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"yieldCurve":{},"count":{"type":"number"},"_lineage":{},"_cached":{}}}},
  },

  "/api/macro/indicators": {
    description: "Key macroeconomic indicators",
    parameters: {
      indicators: { type: "string", description: "Filter by indicators" },
      period: { type: "string", description: "Time period for data aggregation", default: "1d" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"count":{"type":"number"},"period":{},"_lineage":{},"_cached":{}}}},
  },

  "/api/macro/risk-appetite": {
    description: "Market risk appetite index combining macro and crypto signals",
    outputSchemas: {"GET":{"type":"object","properties":{"indicators":{"type":"array"},"source":{},"timestamp":{"type":"string"}},"additionalProperties":true}},
  },

  "/api/market/categories": {
    description: "Crypto market categories and sector performance",
  },

  "/api/market/categories/{id}": {
    description: "Market - Categories - {Id} - News & Content",
    parameters: {
      per_page: { type: "number", description: "Results per page", default: "100" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
    },
  },

  "/api/market/coins": {
    description: "Coin market data with advanced filtering",
    outputSchemas: {"GET":{"type":"object","properties":{"coins":{},"total":{"type":"number"}}}},
  },

  "/api/market/coins/{coinId}/community": {
    description: "Returns community stats for a coin (Twitter, Reddit, Telegram, etc.)",
  },

  "/api/market/coins/{coinId}/developer": {
    description: "Returns developer/GitHub stats for a coin",
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
    outputSchemas: {"GET":{"type":"object","properties":{"dominance":{},"totalMarketCap":{},"timestamp":{"type":"number"}}}},
  },

  "/api/market/exchanges": {
    description: "Exchange market data and rankings",
    parameters: {
      per_page: { type: "number", description: "Results per page", default: "100" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
    },
  },

  "/api/market/exchanges/{id}": {
    description: "Market - Exchanges - {Id} - Market Data",
  },

  "/api/market/gainers": {
    description: "Top gaining cryptocurrencies by timeframe",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "24h" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"gainers":{},"timeframe":{},"count":{"type":"number"},"timestamp":{"type":"number"}}}},
  },

  "/api/market/global-defi": {
    description: "Global DeFi market statistics",
  },

  "/api/market/heatmap": {
    description: "Market heatmap data by sector and market cap",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"coins":{},"count":{"type":"number"},"timestamp":{"type":"number"}}}},
  },

  "/api/market/history/{coinId}": {
    description: "Market - History - {CoinId} - Market Data",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
      interval: { type: "string", description: "Data interval (e.g., hourly, daily)" },
    },
  },

  "/api/market/losers": {
    description: "Top losing cryptocurrencies by timeframe",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "24h" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"losers":{},"timeframe":{},"count":{"type":"number"},"timestamp":{"type":"number"}}}},
  },

  "/api/market/movers": {
    description: "Biggest market movers combining gainers and losers",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "5" },
      timeframe: { type: "string", description: "Time period (e.g., 1h, 24h, 7d, 30d)", default: "24h" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"gainers":{},"losers":{},"timeframe":{},"timestamp":{"type":"number"}}}},
  },

  "/api/market/ohlc/{coinId}": {
    description: "Market - Ohlc - {CoinId} - Market Data",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"symbol":{},"timestamp":{},"exchanges":{},"nbbo":{},"metrics":{},"exchangeData":{},"topBids":{"type":"array"},"topAsks":{"type":"array"},"orderBook":{"type":"object"},"whaleOrders":{},"priceWalls":{},"snapshots":{"type":"array"},"count":{"type":"number"},"availableActions":{"type":"array"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"recommendation":{},"snapshot":{},"symbol":{},"timestamp":{},"comparison":{},"rankings":{"type":"object"}}}},
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

  "/api/market/snapshot/{coinId}": {
    description: "Market - Snapshot - {CoinId} - Market Data",
    parameters: {
      date: { type: "string", description: "Date in YYYY-MM-DD format" },
    },
  },

  "/api/market/social/{coinId}": {
    description: "Market - Social - {CoinId} - Social Intelligence",
    parameters: {
      type: { type: "string", description: "Data or content type", default: "all" },
    },
  },

  "/api/market/stream": {
    description: "Real-time market data via Server-Sent Events",
    streaming: true,
  },

  "/api/market/tickers/{coinId}": {
    description: "Market - Tickers - {CoinId} - Market Data",
    parameters: {
      page: { type: "number", description: "Page number for pagination", default: "1" },
    },
  },

  "/api/mcp": {
    description: "Mcp - Other",
    methods: ["POST", "GET", "DELETE"],
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
    outputSchemas: {"GET":{"type":"object","properties":{"narratives":{},"message":{"type":"string"},"summary":{"type":"object"},"articlesAnalyzed":{"type":"number"},"analyzedAt":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"usage":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/news/extract": {
    description: "Extract structured data from a news URL",
    methods: ["POST"],
    parameters: {
      url: { type: "string", description: "Filter by url", required: true },
    },
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
    outputSchemas: {"GET":{"type":"object","properties":{"market":{},"trending":{}}}},
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

  "/api/nft/collections/{slug}": {
    description: "Returns details for a specific NFT collection.",
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"relays":{},"recommended":{},"names":{"type":"object"},"feed":{"type":"object"},"events":{"type":"array"},"count":{"type":"number"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"published":{"type":"number"},"events":{},"relays":{},"message":{"type":"string"},"event":{},"event_id":{},"naddr":{},"relay":{},"connected":{},"filters":{},"subscriptionId":{},"eventCount":{"type":"number"},"reqMessage":{},"usage":{"type":"string"}},"additionalProperties":true}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"data":{},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"protocol":{"type":"string"},"data":{},"count":{"type":"number"},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"links":{},"message":{"type":"string"},"stats":{},"significantEvents":{},"filters":{"type":"object"},"generatedAt":{"type":"string"}}}},
  },

  "/api/onchain/exchange-flows": {
    description: "Exchange inflow/outflow data for BTC and ETH",
    parameters: {
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)", default: "BTC" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"message":{"type":"string"}}}},
  },

  "/api/onchain/multichain": {
    description: "Multi-chain on-chain analytics",
    parameters: {
      protocol: { type: "string", description: "Filter by protocol", default: "uniswap" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"protocol":{"type":"string"},"chains":{},"totalTvl":{},"timestamp":{"type":"string"}}}},
  },

  "/api/onchain/protocol/{protocol}": {
    description: "Returns aggregated data for a specific DeFi protocol",
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/oracle": {
    description: "Price oracle overview and comparison",
    methods: ["POST", "GET"],
    parameters: {
      action: { type: "string", description: "API action to perform" },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{"type":"object"},"error":{},"message":{},"code":{},"processingTimeMs":{}}},"GET":{"type":"object","properties":{"status":{},"configured":{},"timestamp":{"type":"string"},"success":{"type":"boolean"},"data":{},"name":{"type":"string"},"version":{"type":"string"},"description":{"type":"string"},"endpoints":{"type":"object"},"rateLimits":{"type":"object"},"documentation":{"type":"string"}}}},
  },

  "/api/oracle/chainlink": {
    description: "Chainlink oracle data feed for crypto sentiment",
    methods: ["GET", "POST"],
    parameters: {
      format: { type: "string", description: "Response format", default: "standard" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"jobRunID":{},"data":{"type":"object"},"result":{},"statusCode":{"type":"number"}}},"POST":{"type":"object","properties":{"jobRunID":{},"data":{"type":"object"},"result":{},"statusCode":{"type":"number"}}}},
  },

  "/api/oracle/prices": {
    description: "Aggregated oracle price feeds",
    parameters: {
      assets: { type: "string", description: "Filter by assets", default: "bitcoin,ethereum,binancecoin,solana,ripple" },
      currency: { type: "string", description: "Filter by currency", default: "usd" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"oracle":{"type":"string"},"version":{"type":"string"},"timestamp":{},"currency":{},"prices":{},"assetsRequested":{"type":"number"},"assetsReturned":{"type":"array"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"symbol":{},"market":{},"timestamp":{"type":"string"},"exchangeCount":{"type":"number"},"orderBooks":{"type":"array"},"estimate":{"type":"object"},"recommendation":{},"liquidity":{"type":"object"},"success":{"type":"boolean"},"data":{"type":"object"},"exchanges":{},"bestBid":{},"bestAsk":{},"spread":{},"spreadPercent":{},"midPrice":{},"imbalance":{},"totalBidDepthUsd":{},"totalAskDepthUsd":{},"bids":{"type":"array"},"asks":{"type":"array"},"exchangeBreakdown":{}}}},
  },

  "/api/orderbook/stream": {
    description: "Real-time order book updates via Server-Sent Events",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"websocket":{"type":"object"},"polling":{"type":"object"},"documentation":{"type":"object"}}}},
  },

  "/api/podcast": {
    description: "Crypto podcast feed and episodes",
    outputSchemas: {"GET":{"type":"object","properties":{"episode":{},"note":{"type":"string"}}}},
  },

  "/api/portfolio": {
    description: "Portfolio tracking and management",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      prices: { type: "string", description: "Filter by prices" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"portfolio":{},"combinedFeed":{},"summary":{"type":"object"},"dataSources":{"type":"object"},"fetchedAt":{"type":"string"}}}},
  },

  "/api/portfolio/benchmark": {
    description: "Portfolio performance benchmarking against indices",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      weights: { type: "string", description: "Filter by weights" },
      days: { type: "number", description: "Number of days of historical data", default: "30" },
      benchmarks: { type: "string", description: "Filter by benchmarks", default: "bitcoin,ethereum" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"days":{},"portfolio":{"type":"object"},"benchmarks":{"type":"array"},"alpha":{},"timestamp":{"type":"number"}}}},
  },

  "/api/portfolio/correlation": {
    description: "Intra-portfolio asset correlation analysis",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs" },
      days: { type: "number", description: "Number of days of historical data", default: "90" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"coins":{},"days":{},"dataPoints":{},"matrix":{},"stronglyCorrelated":{"type":"array"},"weaklyCorrelated":{"type":"array"},"timestamp":{"type":"number"}}}},
  },

  "/api/portfolio/holding": {
    description: "Add or update portfolio holdings",
    methods: ["POST", "PATCH", "DELETE"],
    parameters: {
      portfolioId: { type: "string", description: "Filter by portfolioId" },
      coinId: { type: "string", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)" },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"portfolio":{}}},"PATCH":{"type":"object","properties":{"success":{"type":"boolean"},"portfolio":{}}},"DELETE":{"type":"object","properties":{"success":{"type":"boolean"},"portfolio":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"form8949":{},"instructions":{}}},"POST":{"type":"object","properties":{"message":{"type":"string"},"transaction":{},"totalTransactions":{"type":"number"}}},"DELETE":{"type":"object","properties":{"message":{"type":"string"},"portfolio_id":{}}}},
  },

  "/api/portfolio/tax-report": {
    description: "Generate comprehensive portfolio tax reports",
    methods: ["POST"],
    parameters: {
      transactions: { type: "string", description: "Filter by transactions", required: true },
      year: { type: "string", description: "Filter by year", required: true },
      method: { type: "string", description: "Filter by method", default: "fifo" },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"tax_year":{},"method":{},"summary":{"type":"object"},"events":{},"disclaimer":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"message":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"leaderboard":{},"period":{"type":"string"},"bets":{},"stats":{"type":"object"},"market":{},"markets":{},"categories":{"type":"array"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"bet":{},"market":{}}}},
  },

  "/api/premium": {
    description: "Premium tier overview and features",
    outputSchemas: {"GET":{"type":"object","properties":{"name":{"type":"string"},"version":{"type":"string"},"description":{"type":"string"},"quickStart":{"type":"object"},"payment":{},"accessPasses":{"type":"array"},"categories":{},"freeEndpoints":{"type":"array"},"valueComparison":{"type":"object"},"sdks":{"type":"object"},"support":{"type":"object"}}}},
  },

  "/api/premium/ai/analyze": {
    description: "Premium deep AI market analysis with full reports",
    outputSchemas: {"GET":{"type":"object","properties":{"coinId":{},"coinName":{},"currentPrice":{},"analysisType":{},"timeframe":{},"technical":{},"sentiment":{},"aiInsights":{},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"alerts":{},"activeCount":{"type":"number"},"triggeredCount":{},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
  },

  "/api/premium/alerts/whales": {
    description: "Premium whale activity alerts",
    parameters: {
      coins: { type: "string", description: "Comma-separated cryptocurrency IDs", default: "bitcoin,ethereum" },
      minThreshold: { type: "number", description: "Filter by minThreshold", default: "1000000" },
      concentration: { type: "string", description: "Filter by concentration" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"transactions":{},"stats":{},"concentration":{},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
  },

  "/api/premium/analytics/screener": {
    description: "Premium advanced crypto screener",
    outputSchemas: {"GET":{"type":"object","properties":{"results":{},"total":{"type":"number"},"filtered":{},"query":{},"premium":{"type":"boolean"},"executionTime":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"protocols":{},"chains":{},"total":{"type":"number"},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"coins":{},"total":{"type":"number"},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
  },

  "/api/premium/market/history": {
    description: "Premium historical market data with full depth",
    parameters: {
      coinId: { type: "string", description: "Cryptocurrency ID (e.g., bitcoin, ethereum)" },
      range: { type: "string", description: "Filter by range", default: "1y" },
      currency: { type: "string", description: "Filter by currency", default: "usd" },
      ohlc: { type: "string", description: "Filter by ohlc" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"coinId":{},"currency":{},"range":{"type":"object"},"prices":{},"ohlc":{},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
  },

  "/api/premium/portfolio/analytics": {
    description: "Premium portfolio analytics and insights",
    outputSchemas: {"GET":{"type":"object","properties":{"totalValue":{},"totalReturn":{},"assets":{},"correlations":{},"riskMetrics":{},"rebalancing":{},"premium":{"type":"boolean"},"metadata":{"type":"object"}}}},
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
    outputSchemas: {"POST":{"type":"object","properties":{"id":{}}},"GET":{"type":"object","properties":{"pressReleases":{}}}},
  },

  "/api/press-release/{id}": {
    description: "Press Release - {Id} - News & Content",
    methods: ["PATCH"],
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
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"message":{"type":"string"},"stats":{},"endpoints":{"type":"object"}}}},
  },

  "/api/rag/ask": {
    description: "Ask questions with AI-powered retrieval-augmented generation",
    methods: ["POST"],
    outputSchemas: {"POST":{"type":"object","properties":{"processingTime":{}},"additionalProperties":true}},
  },

  "/api/rag/batch": {
    description: "Batch RAG queries for multiple questions",
    methods: ["POST"],
    outputSchemas: {"POST":{"type":"object","properties":{"results":{},"summary":{"type":"object"}}}},
  },

  "/api/rag/eval": {
    description: "Evaluate RAG system quality and relevance",
    methods: ["GET", "POST"],
    outputSchemas: {"GET":{"type":"object","properties":{"version":{},"description":{},"totalCases":{"type":"number"},"testCases":{},"tags":{"type":"array"},"difficulties":{"type":"array"}}},"POST":{"type":"object","properties":{"processingTimeMs":{}},"additionalProperties":true}},
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
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"feedbackId":{},"queryId":{}}},"GET":{"type":"object","properties":{"alerts":{},"count":{"type":"number"},"acknowledged":{},"recent":{"type":"array"}},"additionalProperties":true}},
  },

  "/api/rag/personalization": {
    description: "Personalized RAG based on user preferences",
    methods: ["POST", "GET", "DELETE"],
    parameters: {
      userId: { type: "string", description: "User identifier" },
      export: { type: "string", description: "Filter by export" },
      privacy: { type: "string", description: "Filter by privacy" },
    },
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"userId":{},"preferences":{},"inferredInterests":{"type":"array"}}},"GET":{"type":"object","properties":{"totalUsers":{},"data":{},"success":{"type":"boolean"},"privacyMode":{}}},"DELETE":{"type":"object","properties":{"success":{"type":"boolean"},"deleted":{},"message":{}}}},
  },

  "/api/rag/search": {
    description: "RAG vector search without LLM generation",
    methods: ["POST"],
    outputSchemas: {"POST":{"type":"object","properties":{"results":{"type":"array"},"extractedFilters":{},"count":{"type":"number"}}}},
  },

  "/api/rag/similar/{id}": {
    description: "RAG Similar Articles API GET /api/rag/similar/[id] Find articles similar to a given article.",
    parameters: {
      topK: { type: "number", description: "Filter by topK", default: "5" },
    },
  },

  "/api/rag/stream": {
    description: "Streaming RAG responses via Server-Sent Events",
    methods: ["POST"],
    streaming: true,
  },

  "/api/rag/summary/{crypto}": {
    description: "Rag - Summary - {Crypto} - AI Analysis",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "7" },
    },
  },

  "/api/rag/timeline": {
    description: "Timeline-aware RAG for chronological crypto analysis",
    methods: ["POST"],
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"timeline":{},"meta":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"relationships":{"type":"array"},"message":{"type":"string"}}}},
  },

  "/api/research/backtest": {
    description: "Research-grade strategy backtesting",
    methods: ["POST"],
    outputSchemas: {"POST":{"type":"object","properties":{"result":{"type":"object"},"parameters_used":{},"disclaimer":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"query":{},"total":{},"search_type":{},"articles":{},"lang":{},"availableLanguages":{"type":"array"}},"additionalProperties":true}},
  },

  "/api/search/semantic": {
    description: "Semantic search using vector embeddings",
    methods: ["POST"],
    outputSchemas: {"POST":{"type":"object","properties":{"results":{},"query":{},"total":{"type":"number"}}}},
  },

  "/api/search/v2": {
    description: "Enhanced search with advanced filtering and relevance",
    methods: ["GET", "POST"],
    outputSchemas: {"GET":{"type":"object","properties":{"_meta":{"type":"object"}},"additionalProperties":true},"POST":{"type":"object","properties":{"suggestions":{},"engine":{}}}},
  },

  "/api/sentiment": {
    description: "Market sentiment analysis and indicators",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"market":{},"distribution":{},"highImpactNews":{},"meta":{"type":"object"}}}},
  },

  "/api/signals": {
    description: "Trading signal generation and analysis",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      min_confidence: { type: "number", description: "Filter by min confidence", default: "50" },
      ticker: { type: "string", description: "Filter by ticker" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"signals":{},"disclaimer":{},"summary":{"type":"object"},"articlesAnalyzed":{"type":"number"},"generatedAt":{"type":"string"},"unavailable":{"type":"boolean"},"reason":{"type":"string"}}}},
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
    outputSchemas: {"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/social/coins": {
    description: "Social metrics for individual cryptocurrencies",
    parameters: {
      symbols: { type: "string", description: "Comma-separated trading symbols" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
  },

  "/api/social/coins/{symbol}": {
    description: "Returns social metrics for a specific cryptocurrency symbol.",
  },

  "/api/social/coins/{symbol}/feed": {
    description: "Returns the social media feed for a specific cryptocurrency symbol.",
    parameters: {
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
    outputSchemas: {"GET":{"type":"object","properties":{"filters":{"type":"object"},"fetchedAt":{"type":"string"}},"additionalProperties":true}},
  },

  "/api/social/influencer-score": {
    description: "Calculate influencer impact score",
    methods: ["GET", "POST"],
    parameters: {
      handle: { type: "string", description: "Filter by handle" },
      platform: { type: "string", description: "Filter by platform", default: "twitter" },
      min_score: { type: "number", description: "Filter by min score", default: "0" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"influencer":{},"total":{"type":"number"},"leaderboard":{"type":"array"},"methodology":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"score":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{"type":"object"},"meta":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/social/x/sentiment": {
    description: "X/Twitter-specific crypto sentiment analysis",
    parameters: {
      list: { type: "string", description: "Filter by list", default: "default" },
      refresh: { type: "string", description: "Filter by refresh" },
      tweets: { type: "number", description: "Filter by tweets", default: "10" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{"type":"object"},"meta":{"type":"object"}}}},
  },

  "/api/solana": {
    description: "Solana blockchain overview and statistics",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      mint: { type: "string", description: "Token mint address" },
      view: { type: "string", description: "Filter by view" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"chain":{"type":"string"},"endpoints":{"type":"object"},"dataSources":{"type":"array"},"subroutes":{"type":"object"},"relatedChains":{"type":"object"},"count":{"type":"number"},"address":{},"helius":{},"shyft":{},"sources":{"type":"array"}}}},
  },

  "/api/solana/assets": {
    description: "Solana digital asset data",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      id: { type: "string", description: "Unique identifier" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"address":{}}}},
  },

  "/api/solana/balances": {
    description: "Solana wallet token balances",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"assetId":{},"proof":{},"source":{"type":"string"},"timestamp":{"type":"string"},"groupKey":{},"groupValue":{},"data":{},"creator":{},"authority":{}}}},
  },

  "/api/solana/defi": {
    description: "Solana DeFi protocol data and yields",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
  },

  "/api/solana/nfts": {
    description: "Solana NFT market data",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      source: { type: "string", description: "Filter by news source" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"count":{"type":"number"}}}},
  },

  "/api/solana/priority-fees": {
    description: "Solana priority fee estimates",
    parameters: {
      accounts: { type: "string", description: "Filter by accounts" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"accounts":{},"fees":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"filters":{"type":"object"},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
  },

  "/api/solana/tokens": {
    description: "Solana token data with filtering and pagination",
    parameters: {
      owner: { type: "string", description: "Wallet owner address" },
      mint: { type: "string", description: "Token mint address" },
      page: { type: "number", description: "Page number for pagination", default: "1" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"query":{"type":"object"},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
  },

  "/api/solana/transactions": {
    description: "Solana transaction history",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      source: { type: "string", description: "Filter by news source" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"count":{"type":"number"},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
  },

  "/api/solana/wallet": {
    description: "Solana wallet portfolio and transaction overview",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"analysis":{},"source":{"type":"string"},"timestamp":{"type":"string"}}}},
  },

  "/api/sources": {
    description: "News source listings and metadata",
    parameters: {
      token: { type: "string", description: "Filter by token" },
      status: { type: "string", description: "Filter by status" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"sources":{},"count":{"type":"number"},"statusChecked":{"type":"boolean"}}}},
  },

  "/api/sources/health": {
    description: "Sources - Health - News & Content",
    parameters: {
      status: { type: "string", description: "Filter by status" },
      category: { type: "string", description: "Filter by category" },
      summary: { type: "string", description: "Filter by summary" },
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
    outputSchemas: {"GET":{"type":"object","properties":{"type":{"type":"string"},"count":{},"data":{},"timestamp":{"type":"string"},"totalMarketCap":{}}}},
  },

  "/api/stablecoins/chains": {
    description: "Stablecoin distribution across blockchains",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "25" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"totalTvl":{},"count":{"type":"number"},"chains":{},"timestamp":{"type":"string"}}}},
  },

  "/api/stablecoins/depeg": {
    description: "Stablecoin depeg monitoring and alerts",
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"running":{},"monitoredSymbols":{},"activeAlerts":{},"alertCount":{"type":"number"},"timestamp":{"type":"string"}}}},
  },

  "/api/stablecoins/dominance": {
    description: "Stablecoin market dominance metrics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"totalMarketCap":{},"count":{"type":"number"},"dominance":{},"otherPct":{},"timestamp":{"type":"string"}}}},
  },

  "/api/stablecoins/flows": {
    description: "Stablecoin capital flow tracking",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"status":{"type":"string"},"count":{"type":"number"},"data":{},"timestamp":{"type":"string"}}}},
  },

  "/api/stablecoins/{symbol}": {
    description: "Stablecoins - {Symbol} - Stablecoins",
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
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"address":{},"balances":{},"chain":{"type":"string"},"endpoints":{"type":"object"},"subroutes":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/sui/balances": {
    description: "Sui wallet balances and token holdings",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      coin: { type: "string", description: "Cryptocurrency ID or symbol" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"address":{},"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"count":{"type":"number"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"count":{"type":"number"},"address":{}},"additionalProperties":true}},
  },

  "/api/sui/transactions": {
    description: "Sui transaction history and details",
    parameters: {
      address: { type: "string", description: "Wallet or contract address" },
      digest: { type: "string", description: "Filter by digest" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      cursor: { type: "string", description: "Filter by cursor" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"address":{}},"additionalProperties":true}},
  },

  "/api/summarize": {
    description: "Summarize crypto news articles",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "5" },
      source: { type: "string", description: "Filter by news source" },
      style: { type: "string", description: "Output style or format", default: "brief" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"summaries":{"type":"array"},"message":{"type":"string"}}}},
  },

  "/api/tags": {
    description: "News tag listings and tag-based browsing",
    parameters: {
      slug: { type: "string", description: "Filter by slug" },
      category: { type: "string", description: "Filter by category" },
      sort: { type: "string", description: "Sort field" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"tag":{"type":"object"},"url":{"type":"string"},"category":{},"count":{"type":"number"},"tags":{"type":"array"},"totalCount":{"type":"number"},"categories":{"type":"array"}}}},
  },

  "/api/tags/{slug}": {
    description: "Individual Tag API Route GET /api/tags/[slug] - Get tag details with articles",
  },

  "/api/token-unlocks": {
    description: "Upcoming token unlock schedules and amounts",
    parameters: {
      impact: { type: "string", description: "Filter by impact" },
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      includePast: { type: "string", description: "Filter by includePast" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"unlocks":{},"total":{"type":"number"},"highImpact":{"type":"number"},"source":{},"generatedAt":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
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
    outputSchemas: {"POST":{"type":"object","properties":{"original":{},"translation":{},"locale":{},"language":{},"translations":{},"count":{"type":"number"}}},"GET":{"type":"object","properties":{"availableLocales":{},"localeNames":{},"totalLanguages":{"type":"number"},"usage":{"type":"object"}}}},
  },

  "/api/trending": {
    description: "Trending cryptocurrencies and topics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      hours: { type: "number", description: "Filter by hours", default: "24" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"_stale":{"type":"boolean"}},"additionalProperties":true}},
  },

  "/api/unlocks": {
    description: "Token unlock events and vesting schedules",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      project: { type: "string", description: "DeFi project or protocol name" },
      calendar: { type: "string", description: "Filter by calendar" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"source":{"type":"string"},"timestamp":{"type":"string"},"count":{},"calendar":{},"unlocks":{},"note":{"type":"string"}},"additionalProperties":true}},
  },

  "/api/v1": {
    description: "API v1 root - version info and available endpoints",
    outputSchemas: {"GET":{"type":"object","properties":{"name":{"type":"string"},"version":{"type":"string"},"description":{"type":"string"},"docs":{"type":"string"},"x402":{"type":"object"},"authentication":{"type":"object"},"tiers":{"type":"array"},"endpoints":{"type":"array"},"rateLimit":{"type":"object"},"examples":{"type":"object"},"support":{"type":"object"}}}},
  },

  "/api/v1/ai/explain": {
    description: "AI explanation of crypto concepts",
    parameters: {
      term: { type: "string", description: "Filter by term" },
      q: { type: "string", description: "Search query string" },
      level: { type: "string", description: "Filter by level", default: "beginner" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"level":{},"version":{"type":"string"},"duration":{},"error":{},"code":{}},"additionalProperties":true}},
  },

  "/api/v1/ai/research": {
    description: "AI deep research on crypto topics",
    parameters: {
      topic: { type: "string", description: "Topic or subject to analyze" },
      q: { type: "string", description: "Search query string" },
      depth: { type: "string", description: "Filter by depth", default: "standard" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"depth":{},"version":{"type":"string"},"disclaimer":{"type":"string"},"duration":{},"error":{},"code":{}},"additionalProperties":true}},
  },

  "/api/v1/alerts": {
    description: "Alert management for price and event triggers",
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"summary":{},"meta":{"type":"object"}}}},
  },

  "/api/v1/ask": {
    description: "Ask natural language questions about crypto",
    parameters: {
      q: { type: "string", description: "Search query string" },
      question: { type: "string", description: "Filter by question" },
      context_size: { type: "number", description: "Filter by context size", default: "20" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"question":{},"articlesAnalyzed":{"type":"number"},"version":{"type":"string"},"duration":{},"error":{},"code":{}},"additionalProperties":true}},
  },

  "/api/v1/assets": {
    description: "Cryptocurrency asset listings and metadata",
    parameters: {
      id: { type: "string", description: "Unique identifier" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"data":{},"source":{"type":"string"},"timestamp":{"type":"string"},"total":{"type":"number"}}}},
  },

  "/api/v1/assets/{assetId}/history": {
    description: "V1 - Assets - {AssetId} - History - API v1",
    parameters: {
      interval: { type: "string", description: "Data interval (e.g., hourly, daily)", default: "h1" },
    },
  },

  "/api/v1/bitcoin": {
    description: "Bitcoin network data and statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      lang: { type: "string", description: "Language code (e.g., en, es, zh)", default: "en" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"lang":{},"availableLanguages":{"type":"array"},"version":{"type":"string"},"meta":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/v1/categories": {
    description: "News and market category listings",
    outputSchemas: {"GET":{"type":"object","properties":{"usage":{"type":"object"},"version":{"type":"string"},"meta":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/v1/classify": {
    description: "Classify text or articles by crypto topic",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      source: { type: "string", description: "Filter by news source" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"total":{"type":"number"},"version":{"type":"string"},"duration":{},"error":{},"code":{}}}},
  },

  "/api/v1/coin/{coinId}": {
    description: "V1 - Coin - {CoinId} - Market Data",
  },

  "/api/v1/coins": {
    description: "List all cryptocurrencies with market data, pagination, and sorting",
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/v1/defi": {
    description: "DeFi protocol data and statistics",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
      chain: { type: "string", description: "Blockchain network (e.g., ethereum, solana)" },
      category: { type: "string", description: "Filter by category" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"summary":{"type":"object"},"meta":{"type":"object"}}}},
  },

  "/api/v1/derivatives": {
    description: "Derivatives market data",
  },

  "/api/v1/dex": {
    description: "DEX trading data and analytics",
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"totalVolume24h":{},"totalLiquidity":{},"chain":{},"sort":{},"pools":{},"sources":{},"timestamp":{"type":"string"},"latencyMs":{}}}},
  },

  "/api/v1/digest": {
    description: "AI-generated market digest",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"headline":{"type":"string"},"tldr":{"type":"string"},"sections":{"type":"array"},"mustRead":{"type":"array"},"marketMood":{"type":"string"},"tickers":{"type":"array"},"version":{"type":"string"},"meta":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/v1/exchanges": {
    description: "Exchange listings and market data",
    parameters: {
      page: { type: "number", description: "Page number for pagination", default: "1" },
      per_page: { type: "number", description: "Results per page", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/v1/export": {
    description: "Bulk data export in JSON or CSV format",
    parameters: {
      format: { type: "string", description: "Response format", default: "json" },
      type: { type: "string", description: "Data or content type", default: "coins" },
      limit: { type: "number", description: "Maximum number of results to return", default: "100" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/v1/fear-greed": {
    description: "Fear & Greed Index with historical trend",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"current":{},"historical":{},"trend":{},"lastUpdated":{},"version":{"type":"string"},"meta":{"type":"object"}}}},
  },

  "/api/v1/forecast": {
    description: "AI price forecasting",
    parameters: {
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
      horizon: { type: "string", description: "Filter by horizon", default: "1d" },
      action: { type: "string", description: "API action to perform" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"action":{"type":"string"},"narratives":{},"version":{"type":"string"},"duration":{},"metrics":{},"forecast":{},"horizon":{},"asset":{},"disclaimer":{"type":"string"},"error":{},"code":{}}}},
  },

  "/api/v1/fundamentals": {
    description: "Crypto project fundamentals and metrics",
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"totalTvl":{},"totalAnnualizedRevenue":{},"sort":{},"protocols":{},"sources":{"type":"array"},"timestamp":{"type":"string"},"latencyMs":{}}}},
  },

  "/api/v1/gas": {
    description: "Gas price data",
    parameters: {
      network: { type: "string", description: "Network name (e.g., ethereum, bitcoin)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"meta":{"type":"object"}}}},
  },

  "/api/v1/global": {
    description: "Global crypto market statistics",
    outputSchemas: {"GET":{"type":"object","properties":{"data":{"type":"object"},"sources":{},"timestamp":{}}}},
  },

  "/api/v1/historical/{coinId}": {
    description: "V1 - Historical - {CoinId} - Data Export",
    parameters: {
      days: { type: "number", description: "Number of days of historical data", default: "30" },
      interval: { type: "string", description: "Data interval (e.g., hourly, daily)" },
    },
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
    outputSchemas: {"GET":{"type":"object","properties":{"from":{},"to":{},"path":{},"length":{},"entities":{"type":"array"},"entity":{},"eventType":{},"impactedEntities":{"type":"array"},"subgraph":{},"relationships":{},"query":{},"results":{}}}},
  },

  "/api/v1/liquidations": {
    description: "Liquidation data from futures markets",
    parameters: {
      symbol: { type: "string", description: "Trading symbol (e.g., BTC, ETH)" },
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      min_value: { type: "number", description: "Filter by min value", default: "0" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"liquidations":{},"summary":{"type":"object"},"period":{"type":"string"},"count":{"type":"number"},"version":{"type":"string"},"duration":{},"error":{},"code":{}}}},
  },

  "/api/v1/market-data": {
    description: "Global cryptocurrency market statistics and trending coins",
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{"type":"object"},"meta":{"type":"object"}}}},
  },

  "/api/v1/narratives": {
    description: "AI-identified market narratives",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "40" },
      emerging: { type: "string", description: "Filter by emerging" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"narratives":{},"message":{"type":"string"},"version":{"type":"string"},"summary":{"type":"object"},"articlesAnalyzed":{"type":"number"},"analyzedAt":{"type":"string"},"meta":{"type":"object"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"lang":{},"availableLanguages":{"type":"array"},"availableCategories":{},"version":{"type":"string"},"meta":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/v1/ohlcv": {
    description: "OHLCV candlestick market data",
    outputSchemas: {"GET":{"type":"object","properties":{"symbol":{},"interval":{},"count":{"type":"number"},"candles":{},"source":{"type":"string"},"timestamp":{"type":"string"},"latencyMs":{}}}},
  },

  "/api/v1/onchain": {
    description: "On-chain analytics data",
    outputSchemas: {"GET":{"type":"object","properties":{"sources":{},"timestamp":{"type":"string"},"latencyMs":{}},"additionalProperties":true}},
  },

  "/api/v1/orderbook": {
    description: "Order book depth data",
    outputSchemas: {"GET":{"type":"object","properties":{"symbol":{},"depth":{},"lastUpdateId":{},"bids":{},"asks":{},"analysis":{},"source":{"type":"string"},"timestamp":{"type":"string"},"latencyMs":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"version":{"type":"string"},"meta":{"type":"object"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"data":{},"message":{"type":"string"},"version":{"type":"string"}}}},
  },

  "/api/v1/search": {
    description: "Search across news and market data",
    parameters: {
      q: { type: "string", description: "Search query string" },
      query: { type: "string", description: "Search query string" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{"type":"object"},"meta":{"type":"object"}}}},
  },

  "/api/v1/sentiment": {
    description: "AI sentiment analysis for crypto assets",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "20" },
      asset: { type: "string", description: "Asset identifier (e.g., BTC, ETH)" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"articles":{},"market":{},"version":{"type":"string"},"distribution":{},"highImpactNews":{},"meta":{"type":"object"}}}},
  },

  "/api/v1/signals": {
    description: "Trading signals with confidence scores",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "30" },
      min_confidence: { type: "number", description: "Filter by min confidence", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"signals":{},"total":{"type":"number"},"minConfidence":{},"articlesAnalyzed":{"type":"number"},"disclaimer":{},"version":{"type":"string"},"duration":{},"error":{},"code":{}}}},
  },

  "/api/v1/sources": {
    description: "News source listings",
    outputSchemas: {"GET":{"type":"object","properties":{"version":{"type":"string"},"meta":{"type":"object"}},"additionalProperties":true}},
  },

  "/api/v1/stablecoins": {
    description: "Stablecoin market data",
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"totalSupply":{},"netFlow1d":{},"depeggedTokens":{},"stablecoins":{"type":"array"},"source":{},"timestamp":{"type":"string"},"latencyMs":{}}}},
  },

  "/api/v1/summarize": {
    description: "AI article summarization",
    parameters: {
      limit: { type: "number", description: "Maximum number of results to return", default: "10" },
      source: { type: "string", description: "Filter by news source" },
      style: { type: "string", description: "Output style or format", default: "brief" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"summaries":{},"version":{"type":"string"},"meta":{"type":"object"},"style":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"tag":{"type":"object"},"version":{"type":"string"},"meta":{"type":"object"},"category":{},"count":{"type":"number"},"tags":{"type":"array"},"totalCount":{"type":"number"},"categories":{"type":"array"}}}},
  },

  "/api/v1/trending": {
    description: "Trending cryptocurrencies and topics",
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"data":{"type":"object"},"meta":{"type":"object"}}}},
  },

  "/api/v1/usage": {
    description: "API usage statistics for your key",
    parameters: {
      api_key: { type: "string", description: "Filter by api key" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"tier":{},"usageToday":{},"usageMonth":{},"limit":{},"remaining":{},"resetAt":{"type":"string"},"keyInfo":{"type":"object"}}}},
  },

  "/api/v1/whale-alerts": {
    description: "Large cryptocurrency transaction alerts",
    parameters: {
      blockchain: { type: "string", description: "Blockchain to filter by", default: "all" },
      minValue: { type: "number", description: "Minimum transaction value in USD", default: "100000" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"alerts":{},"summary":{"type":"object"},"lastUpdated":{"type":"string"},"version":{"type":"string"},"meta":{"type":"object"}}}},
  },

  "/api/v1/x402": {
    description: "x402 micropayment protocol info and status",
    outputSchemas: {"GET":{"type":"object","properties":{"status":{},"ready":{},"x402":{"type":"object"},"validation":{"type":"object"},"docs":{"type":"object"},"_meta":{"type":"object"}}}},
  },

  "/api/validators": {
    description: "Blockchain validator data and statistics",
    parameters: {
      view: { type: "string", description: "Filter by view" },
      limit: { type: "number", description: "Maximum number of results to return", default: "50" },
    },
    outputSchemas: {"GET":{"type":"object","properties":{"count":{"type":"number"},"validators":{},"timestamp":{"type":"string"}}}},
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

  "/api/version": {
    description: "Version - Other",
    outputSchemas: {"GET":{"type":"object","properties":{"name":{"type":"string"},"version":{},"uptimeSeconds":{},"timestamp":{"type":"string"}},"additionalProperties":true}},
  },

  "/api/videos": {
    description: "Crypto video content aggregation",
    outputSchemas: {"GET":{"type":"object","properties":{"videos":{},"total":{},"limit":{},"offset":{},"hasMore":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"success":{"type":"boolean"},"coinId":{},"isInWatchlist":{},"watchlist":{},"prices":{},"count":{"type":"number"}}},"POST":{"type":"object","properties":{"success":{"type":"boolean"},"message":{},"watchlist":{},"action":{}}},"DELETE":{"type":"object","properties":{"success":{"type":"boolean"},"message":{"type":"string"},"watchlist":{}}},"PUT":{"type":"object","properties":{"success":{"type":"boolean"},"message":{"type":"string"},"watchlist":{}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"alerts":{"type":"array"},"summary":{},"timestamp":{"type":"string"}}}},
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
    outputSchemas: {"GET":{"type":"object","properties":{"chain":{},"count":{"type":"number"},"yields":{},"timestamp":{"type":"string"},"source":{"type":"string"}}}},
  },

};

/** Total documented endpoints. */
export const ENDPOINT_COUNT = 394;
