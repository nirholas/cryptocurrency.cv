#!/usr/bin/env node

/**
 * Generate comprehensive endpoint-metadata.ts from route analysis.
 *
 * Reads each route.ts in the manifest, extracts JSDoc descriptions,
 * query parameters, HTTP methods, and streaming info, then produces
 * a TypeScript file with EndpointMeta for every discoverable route.
 *
 * Run: node scripts/generate-endpoint-metadata.js
 */

const fs = require("fs");
const path = require("path");

const API_DIR = path.join(__dirname, "..", "src", "app", "api");
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "openapi",
  "routes.generated.ts"
);
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "src",
  "lib",
  "openapi",
  "endpoint-metadata.generated.ts"
);

// ─── Read manifest ───────────────────────────────────────────────────────────

const manifestContent = fs.readFileSync(MANIFEST_PATH, "utf-8");
const routeEntries = [];
const entryRegex =
  /\{\s*"path":\s*"([^"]+)",\s*"category":\s*"([^"]+)"\s*\}/g;
let m;
while ((m = entryRegex.exec(manifestContent)) !== null) {
  routeEntries.push({ path: m[1], category: m[2] });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiPathToFilePath(apiPath) {
  const segments = apiPath.replace(/^\//, "").split("/");
  return path.join(API_DIR, "..", ...segments, "route.ts");
}

function extractMethods(content) {
  const methods = [];
  const re =
    /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS)/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    if (match[1] !== "OPTIONS") methods.push(match[1]);
  }
  return methods.length > 0 ? methods : ["GET"];
}

function extractSearchParams(content) {
  const params = new Map(); // name -> { type, default, required }

  const getRegex = /searchParams\.get\(\s*["']([^"']+)["']\s*\)/g;
  let match;
  while ((match = getRegex.exec(content)) !== null) {
    const name = match[1];
    if (!params.has(name)) {
      params.set(name, {
        type: isNumericParam(content, name) ? "number" : "string",
        default: extractDefault(content, name),
        required: isRequired(content, name),
      });
    }
  }

  return params;
}

function extractDefault(content, paramName) {
  // param || "default"
  const r1 = new RegExp(
    `searchParams\\.get\\(\\s*["']${escapeRegex(paramName)}["']\\s*\\)\\s*\\|\\|\\s*["']([^"']+)["']`
  );
  const m1 = content.match(r1);
  if (m1) return m1[1];

  // param ?? "default"
  const r2 = new RegExp(
    `searchParams\\.get\\(\\s*["']${escapeRegex(paramName)}["']\\s*\\)\\s*\\?\\?\\s*["']([^"']+)["']`
  );
  const m2 = content.match(r2);
  if (m2) return m2[1];

  return null;
}

function isNumericParam(content, paramName) {
  const escaped = escapeRegex(paramName);
  return [
    new RegExp(`parseInt\\([^)]*${escaped}`),
    new RegExp(`Number\\([^)]*${escaped}`),
    new RegExp(`parseFloat\\([^)]*${escaped}`),
    new RegExp(`Math\\.min\\([^)]*${escaped}`),
    new RegExp(`Math\\.max\\([^)]*${escaped}`),
  ].some((p) => p.test(content));
}

function isRequired(content, paramName) {
  const escaped = escapeRegex(paramName);
  // Check if there's a 400 error for missing param
  return new RegExp(
    `(!\\s*${escaped}|${escaped}\\s*===?\\s*(undefined|null|"")).*4[0-9]{2}`
  ).test(content);
}

function isStreaming(content) {
  return (
    content.includes("ReadableStream") ||
    content.includes("text/event-stream") ||
    content.includes("Server-Sent Events")
  );
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Clean JSDoc into a one-line description
function cleanDescription(raw) {
  if (!raw) return null;
  return raw
    .replace(/\s+/g, " ")
    .replace(/^[\s*\/]+/, "")
    .replace(/[\s*\/]+$/, "")
    .replace(/\s*\/\s*$/, "")
    .replace(/^(GET|POST|PUT|DELETE|PATCH)\s+\/api\/\S+\s*[-–—]?\s*/, "")
    .replace(/Query params:.*$/i, "")
    .replace(/Requires\s+\w+_\w+.*$/i, "")
    .trim();
}

// Generate a description from the path when JSDoc is missing
function generateDescription(routePath, category) {
  const segments = routePath
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean);

  const descriptions = {
    // Top-level descriptive mappings
    ai: "AI-powered analysis and intelligence",
    "ai/brief": "Generate a daily AI-powered crypto news brief",
    "ai/blog-generator":
      "AI blog post generator from clustered crypto news topics",
    "ai/correlation": "AI-driven correlation analysis between crypto assets",
    "ai/counter": "AI counter-argument generation for crypto narratives",
    "ai/cross-lingual": "Cross-lingual crypto news analysis and translation",
    "ai/debate": "AI-powered debate between bull and bear perspectives",
    "ai/digest": "AI-generated daily market digest with streaming",
    "ai/entities": "Extract and analyze named entities from crypto news",
    "ai/entities/extract": "Extract named entities from provided text",
    "ai/explain": "AI explanation of complex crypto concepts and events",
    "ai/flash-briefing": "Flash briefing format for voice assistants",
    "ai/narratives": "AI-identified market narratives and themes",
    "ai/oracle": "AI oracle for crypto market predictions",
    "ai/portfolio-news": "AI-curated news relevant to a specific portfolio",
    "ai/relationships":
      "AI-detected relationships between crypto entities and events",
    "ai/research": "Deep AI research reports on crypto topics",
    "ai/social": "AI analysis of social media crypto sentiment",
    "ai/source-quality": "AI assessment of news source credibility and quality",
    "ai/summarize": "AI-powered article summarization",
    "ai/summarize/stream": "Streaming AI article summarization",
    "ai/synthesize": "AI synthesis of multiple news sources into unified report",
    "ai-anchor": "AI news anchor video generation from crypto news",
    airdrops: "Upcoming and active cryptocurrency airdrops",
    alerts: "Price and event alert management",
    "alerts/stream": "Real-time alert notifications via Server-Sent Events",
    alexa: "Alexa skill integration endpoint",
    "analytics/anomalies": "Detect anomalies in news and market data patterns",
    "analytics/causality": "Causal relationship analysis between events",
    "analytics/credibility": "News source credibility scoring and analysis",
    "analytics/events": "Event detection and impact analysis",
    "analytics/forensics":
      "News forensics - coordination detection and origin tracing",
    "analytics/gaps": "Coverage gap detection in crypto news",
    "analytics/headlines": "Headline analytics and trend detection",
    "analytics/influencers": "Influencer impact and reach analytics",
    "analytics/news-onchain":
      "Correlation between news events and on-chain activity",
    "analytics/usage": "API usage analytics and statistics",
    analyze: "General-purpose crypto analysis endpoint",
    anomalies: "Anomaly detection across market and news data",
    aptos: "Aptos blockchain overview and statistics",
    "aptos/events": "Aptos blockchain event data",
    "aptos/resources": "Aptos account resources and state",
    "aptos/transactions": "Aptos transaction history and details",
    arbitrage: "Cross-exchange arbitrage opportunity detection",
    archive: "News article archive and historical data",
    "archive/ipfs": "IPFS-pinned news archive for permanent storage",
    "archive/status": "Archive indexing status and statistics",
    "archive/v2": "Enhanced news archive with improved search and filtering",
    "archive/webhook": "Webhook notifications for archive updates",
    arkham: "Arkham Intelligence on-chain entity tracking",
    article: "Single article retrieval by ID or URL",
    articles: "Browse and filter crypto news articles",
    ask: "Ask natural language questions about crypto markets",
    atom: "Atom/RSS feed for crypto news",
    authors: "News author profiles and statistics",
    backtest: "Strategy backtesting with historical market data",
    batch: "Batch multiple API requests into a single call",
    bitcoin: "Bitcoin network overview and market data",
    "bitcoin/block-height": "Current Bitcoin block height",
    "bitcoin/blocks": "Recent Bitcoin block data and details",
    "bitcoin/difficulty": "Bitcoin mining difficulty and adjustment data",
    "bitcoin/mempool/blocks": "Bitcoin mempool projected blocks",
    "bitcoin/mempool/fees": "Bitcoin mempool fee estimates",
    "bitcoin/mempool/info": "Bitcoin mempool size and transaction count",
    "blog/posts": "Blog posts about cryptocurrency markets and analysis",
    breaking: "Breaking crypto news headlines",
    bridges: "Cross-chain bridge volume and activity data",
    "chart-analysis": "Technical chart pattern analysis",
    charts: "Price chart data for cryptocurrencies",
    citations: "Citation verification and source attribution",
    claims: "Fact-checkable claims extracted from crypto news",
    classify: "Classify crypto news articles by category and relevance",
    clickbait: "Detect clickbait in crypto news headlines",
    coincap: "CoinCap market data aggregation",
    coinmarketcap: "CoinMarketCap market data aggregation",
    coinpaprika: "CoinPaprika overview and market data",
    "coinpaprika/coins": "CoinPaprika coin listings and details",
    "coinpaprika/exchanges": "CoinPaprika exchange data",
    "coinpaprika/search": "Search CoinPaprika for coins, exchanges, and people",
    "coinpaprika/tickers": "CoinPaprika ticker data with prices and volume",
    commentary: "Expert commentary and opinion pieces on crypto",
    compare: "Compare multiple cryptocurrencies side by side",
    contributors: "Platform contributor profiles and statistics",
    "coverage-gap": "Identify underreported crypto stories and events",
    cryptocompare: "CryptoCompare market data aggregation",
    cryptopanic: "CryptoPanic news feed aggregation",
    "data-sources": "Available data sources and their status",
    "data-sources/derivatives": "Derivatives data source status and coverage",
    "data-sources/onchain": "On-chain data source status and coverage",
    "data-sources/social": "Social data source status and coverage",
    defi: "DeFi protocol overview and aggregate statistics",
    "defi/bridges": "DeFi bridge volumes and cross-chain flows",
    "defi/dex-volumes": "DEX trading volume across chains and protocols",
    "defi/stablecoins": "Stablecoin market data and supply statistics",
    "defi/summary": "DeFi market summary with key metrics",
    "defi/yields": "DeFi yield farming opportunities with filtering",
    "defi/yields/chains": "Yield data aggregated by blockchain",
    "defi/yields/median": "Median yield statistics across DeFi protocols",
    "defi/yields/projects": "Yield data aggregated by DeFi project",
    "defi/yields/search": "Search DeFi yield opportunities by criteria",
    "defi/yields/stablecoins": "Stablecoin-specific yield opportunities",
    derivatives: "Crypto derivatives market overview",
    "derivatives/aggregated/funding":
      "Aggregated funding rates across exchanges",
    "derivatives/aggregated/open-interest":
      "Aggregated open interest across exchanges",
    "derivatives/bybit/tickers": "Bybit derivatives ticker data",
    "derivatives/dydx/markets": "dYdX perpetual market data",
    "derivatives/okx/funding": "OKX funding rate data",
    "derivatives/okx/open-interest": "OKX open interest data",
    "derivatives/okx/tickers": "OKX derivatives ticker data",
    "derivatives/opportunities":
      "Derivatives trading opportunities and spreads",
    "detect/ai-content": "Detect AI-generated content in crypto news",
    "dex-volumes": "Decentralized exchange trading volumes",
    digest: "Daily crypto market digest",
    dune: "Dune Analytics query results and dashboards",
    entities: "Named entity database for crypto organizations and people",
    events: "Crypto market events and calendar",
    "exchange-rates": "Fiat and crypto exchange rates",
    "exchange-rates/convert": "Currency conversion calculator",
    exchanges: "Cryptocurrency exchange listings and data",
    export: "Export market, news, and analytics data",
    "export/jobs": "Check status of async export jobs",
    exports: "Manage and list data exports",
    extract: "Extract structured data from crypto news articles",
    factcheck: "AI fact-checking of crypto claims and news",
    "fear-greed": "Crypto Fear & Greed Index with historical data",
    flows: "Capital flow tracking across exchanges and wallets",
    forecast: "AI-powered price forecasting for cryptocurrencies",
    funding: "Venture capital funding rounds in crypto",
    "funding-rates": "Perpetual futures funding rates across exchanges",
    gaming: "Blockchain gaming ecosystem overview",
    "gaming/chains": "Gaming activity by blockchain",
    "gaming/top": "Top blockchain games by activity and volume",
    gas: "Ethereum gas prices and network congestion",
    "gas/estimate": "Gas fee estimation for Ethereum and Bitcoin",
    "gas/history": "Historical gas price data",
    geckoterminal: "GeckoTerminal DEX data aggregation",
    global: "Global cryptocurrency market statistics",
    glossary: "Cryptocurrency glossary and term definitions",
    hyperliquid: "Hyperliquid perpetual DEX data",
    influencers: "Crypto influencer rankings and analysis",
    "integrations/tradingview":
      "TradingView webhook integration for alerts and signals",
    keys: "API key management",
    "knowledge-graph":
      "Crypto knowledge graph of entities, events, and relationships",
    l2: "Layer 2 ecosystem overview",
    "l2/activity": "Layer 2 transaction activity and growth metrics",
    "l2/projects": "Layer 2 project listings and comparisons",
    "l2/risk": "Layer 2 risk assessment and security scores",
    liquidations: "Liquidation data from perpetual futures markets",
    macro: "Macroeconomic overview relevant to crypto markets",
    "macro/correlations": "Crypto-macro correlation analysis",
    "macro/dxy": "US Dollar Index (DXY) data and crypto correlation",
    "macro/fed": "Federal Reserve data, rates, and yield curves",
    "macro/indicators": "Key macroeconomic indicators",
    "macro/risk-appetite":
      "Market risk appetite index combining macro and crypto signals",
    "market/categories": "Crypto market categories and sector performance",
    "market/coins": "Coin market data with advanced filtering",
    "market/compare": "Side-by-side coin comparison with market data",
    "market/defi": "DeFi sector market overview",
    "market/derivatives": "Derivatives market overview and statistics",
    "market/dominance": "Bitcoin and altcoin market dominance data",
    "market/exchanges": "Exchange market data and rankings",
    "market/gainers": "Top gaining cryptocurrencies by timeframe",
    "market/global-defi": "Global DeFi market statistics",
    "market/heatmap": "Market heatmap data by sector and market cap",
    "market/losers": "Top losing cryptocurrencies by timeframe",
    "market/movers": "Biggest market movers combining gainers and losers",
    "market/orderbook": "Order book depth data for trading pairs",
    "market/pumps": "Unusual price pump detection",
    "market/search": "Search for coins, exchanges, and tokens",
    "market/stream": "Real-time market data via Server-Sent Events",
    nansen: "Nansen on-chain analytics data",
    narratives: "Current market narratives and trending themes",
    news: "Latest crypto news from 300+ sources",
    "news/categories": "News categorized by topic",
    "news/extract": "Extract structured data from a news URL",
    "news/international": "International crypto news with language filtering",
    "news/stream": "Real-time news stream via Server-Sent Events",
    nft: "NFT market overview and statistics",
    "nft/collections/search": "Search NFT collections by name or attributes",
    "nft/collections/trending": "Trending NFT collections by volume and sales",
    "nft/market": "NFT market aggregate statistics",
    "nft/sales/recent": "Recent notable NFT sales",
    nostr: "Nostr protocol integration for decentralized publishing",
    ohlc: "OHLC candlestick data for crypto trading pairs",
    "on-chain": "On-chain analytics overview",
    "onchain/aave/markets": "Aave lending market data",
    "onchain/aave/rates": "Aave lending and borrowing rates",
    "onchain/compound/markets": "Compound lending market data",
    "onchain/correlate":
      "Correlate on-chain metrics with price and news events",
    "onchain/cross-protocol":
      "Cross-protocol DeFi analytics and comparisons",
    "onchain/curve/pools": "Curve Finance pool data and yields",
    "onchain/events": "Significant on-chain events and transactions",
    "onchain/exchange-flows":
      "Exchange inflow/outflow data for BTC and ETH",
    "onchain/multichain": "Multi-chain on-chain analytics",
    "onchain/uniswap/pools": "Uniswap pool data and liquidity metrics",
    "onchain/uniswap/swaps": "Recent Uniswap swap transactions",
    oneinch: "1inch DEX aggregator data",
    opml: "OPML feed list for RSS readers",
    options: "Crypto options market data and analytics",
    oracle: "Price oracle overview and comparison",
    "oracle/chainlink": "Chainlink oracle data feed for crypto sentiment",
    "oracle/prices": "Aggregated oracle price feeds",
    orderbook: "Order book depth and liquidity data",
    "orderbook/stream":
      "Real-time order book updates via Server-Sent Events",
    podcast: "Crypto podcast feed and episodes",
    portfolio: "Portfolio tracking and management",
    "portfolio/benchmark": "Portfolio performance benchmarking against indices",
    "portfolio/correlation": "Intra-portfolio asset correlation analysis",
    "portfolio/holding": "Add or update portfolio holdings",
    "portfolio/performance": "Portfolio performance charts and metrics",
    "portfolio/tax": "Portfolio tax implications calculator",
    "portfolio/tax-report": "Generate comprehensive portfolio tax reports",
    predictions: "Crypto price prediction market data",
    "predictions/history": "Historical prediction accuracy tracking",
    "predictions/markets": "Prediction market listings and odds",
    premium: "Premium tier overview and features",
    "premium/ai/analyze": "Premium deep AI market analysis with full reports",
    "premium/ai/compare": "Premium AI-powered multi-asset comparison",
    "premium/ai/sentiment": "Premium granular AI sentiment analysis",
    "premium/ai/signals": "Premium AI trading signals with confidence scores",
    "premium/ai/summary": "Premium AI executive market summary",
    "premium/alerts/custom": "Premium custom alert rule configuration",
    "premium/alerts/whales": "Premium whale activity alerts",
    "premium/analytics/screener": "Premium advanced crypto screener",
    "premium/defi/protocols": "Premium detailed DeFi protocol analytics",
    "premium/export/portfolio": "Premium portfolio data export",
    "premium/market/coins": "Premium enhanced coin market data",
    "premium/market/history": "Premium historical market data with full depth",
    "premium/portfolio/analytics": "Premium portfolio analytics and insights",
    "premium/screener/advanced":
      "Premium advanced multi-factor crypto screener",
    "premium/smart-money": "Premium smart money and institutional flow tracking",
    "premium/whales/alerts": "Premium whale movement alert configuration",
    "premium/whales/transactions": "Premium detailed whale transaction data",
    "press-release": "Crypto press release aggregation",
    prices: "Real-time cryptocurrency prices",
    "prices/stream": "Real-time price updates via Server-Sent Events",
    rag: "RAG (Retrieval-Augmented Generation) system overview",
    "rag/ask":
      "Ask questions with AI-powered retrieval-augmented generation",
    "rag/batch": "Batch RAG queries for multiple questions",
    "rag/eval": "Evaluate RAG system quality and relevance",
    "rag/feedback": "Submit feedback on RAG response quality",
    "rag/personalization": "Personalized RAG based on user preferences",
    "rag/search": "RAG vector search without LLM generation",
    "rag/stream": "Streaming RAG responses via Server-Sent Events",
    "rag/timeline": "Timeline-aware RAG for chronological crypto analysis",
    regulatory: "Regulatory news and policy updates",
    relationships: "Entity relationship mapping in crypto ecosystem",
    "research/backtest": "Research-grade strategy backtesting",
    rss: "RSS feed for crypto news",
    "rss-proxy": "RSS feed proxy with CORS support",
    search: "Full-text search across news, articles, and data",
    "search/semantic": "Semantic search using vector embeddings",
    "search/v2": "Enhanced search with advanced filtering and relevance",
    sentiment: "Market sentiment analysis and indicators",
    signals: "Trading signal generation and analysis",
    "signals/narrative": "Narrative-based trading signals",
    social: "Social media analytics overview",
    "social/coins": "Social metrics for individual cryptocurrencies",
    "social/discord": "Discord community analytics for crypto projects",
    "social/influencer-score": "Calculate influencer impact score",
    "social/influencers": "Crypto social media influencer rankings",
    "social/sentiment": "Aggregated social media sentiment analysis",
    "social/sentiment/market": "Market-wide social sentiment overview",
    "social/topics/trending": "Trending topics across crypto social media",
    "social/trending-narratives":
      "Trending narratives and themes from social data",
    "social/x/lists": "X/Twitter crypto list management and monitoring",
    "social/x/sentiment": "X/Twitter-specific crypto sentiment analysis",
    solana: "Solana blockchain overview and statistics",
    "solana/assets": "Solana digital asset data",
    "solana/balances": "Solana wallet token balances",
    "solana/collections": "Solana NFT collection data",
    "solana/defi": "Solana DeFi protocol data and yields",
    "solana/nfts": "Solana NFT market data",
    "solana/priority-fees": "Solana priority fee estimates",
    "solana/search": "Search Solana tokens and accounts",
    "solana/tokens": "Solana token data with filtering and pagination",
    "solana/transactions": "Solana transaction history",
    "solana/wallet": "Solana wallet portfolio and transaction overview",
    sources: "News source listings and metadata",
    sse: "Server-Sent Events connection for real-time updates",
    stablecoins: "Stablecoin market overview and supply data",
    "stablecoins/chains": "Stablecoin distribution across blockchains",
    "stablecoins/depeg": "Stablecoin depeg monitoring and alerts",
    "stablecoins/dominance": "Stablecoin market dominance metrics",
    "stablecoins/flows": "Stablecoin capital flow tracking",
    sui: "Sui blockchain overview and statistics",
    "sui/balances": "Sui wallet balances and token holdings",
    "sui/objects": "Sui object data and state",
    "sui/transactions": "Sui transaction history and details",
    summarize: "Summarize crypto news articles",
    tags: "News tag listings and tag-based browsing",
    "token-unlocks": "Upcoming token unlock schedules and amounts",
    tokenterminal: "Token Terminal fundamental data",
    "trading/arbitrage": "Trading arbitrage opportunity detection",
    "trading/options": "Options trading data and strategies",
    "trading/orderbook": "Trading order book analysis",
    tradingview: "TradingView integration and chart data",
    translate: "Translate crypto news across languages",
    trending: "Trending cryptocurrencies and topics",
    unlocks: "Token unlock events and vesting schedules",
    v1: "API v1 root - version info and available endpoints",
    "v1/ai/explain": "AI explanation of crypto concepts",
    "v1/ai/research": "AI deep research on crypto topics",
    "v1/alerts": "Alert management for price and event triggers",
    "v1/ask": "Ask natural language questions about crypto",
    "v1/assets": "Cryptocurrency asset listings and metadata",
    "v1/bitcoin": "Bitcoin network data and statistics",
    "v1/categories": "News and market category listings",
    "v1/classify": "Classify text or articles by crypto topic",
    "v1/coins":
      "List all cryptocurrencies with market data, pagination, and sorting",
    "v1/coin": "Get detailed data for a single cryptocurrency by ID",
    "v1/correlation":
      "Correlation matrix showing price correlation between cryptocurrencies",
    "v1/defi": "DeFi protocol data and statistics",
    "v1/derivatives": "Derivatives market data",
    "v1/dex": "DEX trading data and analytics",
    "v1/digest": "AI-generated market digest",
    "v1/exchanges": "Exchange listings and market data",
    "v1/export": "Bulk data export in JSON or CSV format",
    "v1/fear-greed": "Fear & Greed Index with historical trend",
    "v1/forecast": "AI price forecasting",
    "v1/fundamentals": "Crypto project fundamentals and metrics",
    "v1/gas": "Gas price data",
    "v1/global": "Global crypto market statistics",
    "v1/historical": "Historical price data for cryptocurrencies",
    "v1/knowledge-graph": "Crypto entity knowledge graph",
    "v1/liquidations": "Liquidation data from futures markets",
    "v1/market-data":
      "Global cryptocurrency market statistics and trending coins",
    "v1/narratives": "AI-identified market narratives",
    "v1/news": "Latest crypto news with filtering and pagination",
    "v1/ohlcv": "OHLCV candlestick market data",
    "v1/onchain": "On-chain analytics data",
    "v1/orderbook": "Order book depth data",
    "v1/predictions": "Price prediction submissions and data",
    "v1/screener": "Advanced cryptocurrency screener with customizable filters",
    "v1/search": "Search across news and market data",
    "v1/sentiment": "AI sentiment analysis for crypto assets",
    "v1/signals": "Trading signals with confidence scores",
    "v1/sources": "News source listings",
    "v1/stablecoins": "Stablecoin market data",
    "v1/summarize": "AI article summarization",
    "v1/system/status": "API system health and status",
    "v1/tags": "Tag-based content browsing",
    "v1/trending": "Trending cryptocurrencies and topics",
    "v1/usage": "API usage statistics for your key",
    "v1/whale-alerts": "Large cryptocurrency transaction alerts",
    "v1/x402": "x402 micropayment protocol info and status",
    validators: "Blockchain validator data and statistics",
    "vector-search": "Vector similarity search across crypto content",
    videos: "Crypto video content aggregation",
    watchlist: "Watchlist management for tracking assets",
    "whale-alerts": "Real-time large transaction monitoring",
    "whale-alerts/context":
      "Whale alert enrichment with market context and AI analysis",
    whales: "Whale wallet tracking and analysis",
    ws: "WebSocket connection for real-time data streams",
    yields: "DeFi yield farming opportunities",
    ".well-known/x402": "x402 protocol discovery endpoint",
  };

  const key = segments.join("/");
  if (descriptions[key]) return descriptions[key];

  // Fallback: generate from path
  const name = segments
    .map((s) => s.replace(/-/g, " "))
    .join(" - ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  return `${name} - ${category}`;
}

// ─── Parameter description generation ────────────────────────────────────────

const COMMON_PARAM_DESCRIPTIONS = {
  limit: "Maximum number of results to return",
  page: "Page number for pagination",
  per_page: "Results per page",
  offset: "Number of results to skip",
  sort: "Sort field",
  order: "Sort order (asc or desc)",
  q: "Search query string",
  query: "Search query string",
  format: "Response format",
  lang: "Language code (e.g., en, es, zh)",
  from: "Start date (ISO 8601 or YYYY-MM-DD)",
  to: "End date (ISO 8601 or YYYY-MM-DD)",
  since: "Start timestamp or date",
  until: "End timestamp or date",
  category: "Filter by category",
  source: "Filter by news source",
  sources: "Comma-separated list of sources",
  coin: "Cryptocurrency ID or symbol",
  coinId: "Cryptocurrency ID (e.g., bitcoin, ethereum)",
  coins: "Comma-separated cryptocurrency IDs",
  symbol: "Trading symbol (e.g., BTC, ETH)",
  symbols: "Comma-separated trading symbols",
  asset: "Asset identifier (e.g., BTC, ETH)",
  chain: "Blockchain network (e.g., ethereum, solana)",
  network: "Network name (e.g., ethereum, bitcoin)",
  address: "Wallet or contract address",
  hash: "Transaction hash",
  timeframe: "Time period (e.g., 1h, 24h, 7d, 30d)",
  period: "Time period for data aggregation",
  interval: "Data interval (e.g., hourly, daily)",
  days: "Number of days of historical data",
  type: "Data or content type",
  action: "API action to perform",
  id: "Unique identifier",
  ids: "Comma-separated IDs",
  topic: "Topic or subject to analyze",
  topics: "Number of topics or comma-separated topic list",
  min_tvl: "Minimum total value locked in USD",
  min_apy: "Minimum annual percentage yield",
  max_apy: "Maximum annual percentage yield",
  min_market_cap: "Minimum market cap in USD",
  max_market_cap: "Maximum market cap in USD",
  min_volume: "Minimum 24h trading volume in USD",
  min_change_24h: "Minimum 24h price change percentage",
  max_change_24h: "Maximum 24h price change percentage",
  stable: "Filter for stablecoin pools only",
  project: "DeFi project or protocol name",
  download: "Set to true for file download response",
  compress: "Enable compression for export",
  verified: "Filter for verified entries only",
  status: "Filter by status",
  country: "Filter by country code",
  style: "Output style or format",
  start: "Start position for pagination",
  start_height: "Starting block height",
  blockchain: "Blockchain to filter by",
  minValue: "Minimum transaction value in USD",
  owner: "Wallet owner address",
  mint: "Token mint address",
  date: "Date in YYYY-MM-DD format",
  userId: "User identifier",
  commit: "Commit changes (true/false)",
  semantic: "Enable semantic search",
  quality: "Content quality filter",
  contentType: "Filter by content type",
  endpoint: "Specific endpoint to query",
  sort_by: "Field to sort results by",
  jobId: "Async job identifier",
  articleId: "Article unique identifier",
  sourceId: "News source identifier",
};

function getParamDescription(paramName) {
  return COMMON_PARAM_DESCRIPTIONS[paramName] || `Filter by ${paramName.replace(/_/g, " ")}`;
}

// ─── Process routes ──────────────────────────────────────────────────────────

const metadata = {};
let processedCount = 0;

for (const { path: routePath, category } of routeEntries) {
  const filePath = apiPathToFilePath(routePath);

  if (!fs.existsSync(filePath)) {
    // Generate metadata from description map only
    metadata[routePath] = {
      description: generateDescription(routePath, category),
      methods: ["GET"],
    };
    processedCount++;
    continue;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const methods = extractMethods(content);
  const paramsMap = extractSearchParams(content);
  const jsdocDesc = cleanDescription(
    extractJSDocRaw(content)
  );
  const streaming = isStreaming(content);

  // Always prefer curated description (precise, consistent)
  // Fall back to cleaned JSDoc only if no curated description exists
  const curatedDesc = generateDescription(routePath, category);
  let description;
  if (curatedDesc && !curatedDesc.includes(" - ") && curatedDesc.length > 10) {
    // We have a proper curated description (not the fallback "Name - Category" format)
    description = curatedDesc;
  } else if (
    jsdocDesc &&
    jsdocDesc.length >= 10 &&
    jsdocDesc.length <= 100 &&
    !jsdocDesc.includes("@") &&
    !jsdocDesc.includes("```")
  ) {
    description = jsdocDesc;
  } else {
    description = curatedDesc || `${category} endpoint`;
  }

  const entry = { description };

  // Add methods if not just GET
  if (methods.length > 1 || methods[0] !== "GET") {
    entry.methods = methods;
  }

  // Add parameters
  if (paramsMap.size > 0) {
    entry.parameters = {};
    for (const [name, info] of paramsMap) {
      const param = {
        type: info.type,
        description: getParamDescription(name),
      };
      if (info.required) param.required = true;
      if (info.default) param.default = info.default;
      entry.parameters[name] = param;
    }
  }

  // Mark streaming
  if (streaming) {
    entry.streaming = true;
  }

  metadata[routePath] = entry;
  processedCount++;
}

function extractJSDocRaw(content) {
  const blocks = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
  for (const block of blocks) {
    if (block.includes("@copyright") || block.includes("@license")) continue;
    if (block.includes("AUTO-GENERATED")) continue;
    const lines = block
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith("/**") &&
          !l.startsWith("*/") &&
          !l.startsWith("@")
      );
    if (lines.length > 0) {
      return lines.join(" ").trim();
    }
  }
  return null;
}

// ─── Generate TypeScript output ──────────────────────────────────────────────

const lines = [];
lines.push(`/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

/**
 * AUTO-GENERATED — Do not edit manually.
 * Run: node scripts/generate-endpoint-metadata.js
 *
 * Generated: ${new Date().toISOString()}
 * Total endpoints: ${processedCount}
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
 * Complete endpoint metadata for all ${processedCount} discoverable API routes.
 * Used by the OpenAPI generator, documentation tools, and agent discovery.
 */
export const ENDPOINT_METADATA_FULL: Record<string, EndpointMetaExtended> = {`);

// Sort routes for consistent output
const sortedPaths = Object.keys(metadata).sort();

for (const routePath of sortedPaths) {
  const entry = metadata[routePath];
  lines.push(`  "${routePath}": {`);
  lines.push(
    `    description: ${JSON.stringify(entry.description)},`
  );

  if (entry.methods) {
    lines.push(
      `    methods: [${entry.methods.map((m) => `"${m}"`).join(", ")}],`
    );
  }

  if (entry.streaming) {
    lines.push(`    streaming: true,`);
  }

  if (entry.parameters && Object.keys(entry.parameters).length > 0) {
    lines.push(`    parameters: {`);
    for (const [name, param] of Object.entries(entry.parameters)) {
      const parts = [`type: "${param.type}"`, `description: ${JSON.stringify(param.description)}`];
      if (param.required) parts.push(`required: true`);
      if (param.default) parts.push(`default: ${JSON.stringify(param.default)}`);
      lines.push(`      ${name}: { ${parts.join(", ")} },`);
    }
    lines.push(`    },`);
  }

  lines.push(`  },\n`);
}

lines.push(`};

/** Total documented endpoints. */
export const ENDPOINT_COUNT = ${processedCount};
`);

fs.writeFileSync(OUTPUT_PATH, lines.join("\n"), "utf-8");
console.log(`✓ Generated ${OUTPUT_PATH}`);
console.log(`  ${processedCount} endpoints documented`);
console.log(
  `  ${Object.values(metadata).filter((e) => e.parameters).length} with parameters`
);
console.log(
  `  ${Object.values(metadata).filter((e) => e.streaming).length} streaming endpoints`
);
console.log(
  `  ${Object.values(metadata).filter((e) => e.methods).length} with non-GET methods`
);
