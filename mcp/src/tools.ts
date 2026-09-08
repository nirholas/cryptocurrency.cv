/**
 * Tool registry. Every tool is a thin, typed mapping onto one real REST route
 * of cryptocurrency.cv (`src/app/api/**` in the main repo). Nothing here
 * invents an endpoint: the `endpoint` field is the exact route the tool calls
 * and the README table is generated from this file (`npm run docs:tools`).
 */

import { z } from 'zod';
import { apiJson, apiRequest, type ApiConfig, type QueryValue } from './api.js';

export type ToolGroup =
  | 'News'
  | 'Analysis'
  | 'Market'
  | 'DeFi'
  | 'Derivatives'
  | 'On-chain'
  | 'Reference'
  | 'AI'
  | 'Feeds & Discovery'
  | 'Provenance';

export interface ToolContext {
  config: ApiConfig;
  get(path: string, query?: Record<string, QueryValue>): Promise<unknown>;
  getText(path: string, query?: Record<string, QueryValue>, accept?: string): Promise<string>;
  post(path: string, body: unknown): Promise<unknown>;
}

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  group: ToolGroup;
  /** Route(s) the tool calls, for documentation: "GET /api/news". */
  endpoint: string;
  input: Shape;
  run: (args: z.infer<z.ZodObject<Shape>>, ctx: ToolContext) => Promise<unknown>;
}

function define<Shape extends z.ZodRawShape>(tool: ToolDefinition<Shape>): ToolDefinition<z.ZodRawShape> {
  return tool as unknown as ToolDefinition<z.ZodRawShape>;
}

export function createToolContext(config: ApiConfig): ToolContext {
  return {
    config,
    get: (path, query) => apiJson(config, { path, query }),
    getText: async (path, query, accept) => (await apiRequest(config, { path, query, accept })).text,
    post: (path, body) => apiJson(config, { path, method: 'POST', body }),
  };
}

export const NEWS_CATEGORIES = [
  'general', 'bitcoin', 'ethereum', 'defi', 'nft', 'research', 'institutional', 'etf', 'derivatives',
  'onchain', 'macro', 'quant', 'journalism', 'asia', 'tradfi', 'mainstream', 'mining', 'gaming', 'altl1',
  'stablecoin', 'geopolitical', 'security', 'developer', 'layer2', 'solana', 'trading',
] as const;

export const RSS_FEEDS = ['all', 'bitcoin', 'defi'] as const;

const limit = (max: number, def: number, what = 'items') =>
  z.number().int().min(1).max(max).default(def).describe(`Maximum ${what} to return (1-${max})`);

const coinId = (what: string) =>
  z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, 'CoinGecko ids are lowercase, e.g. "bitcoin"').describe(what);

export const TOOLS: ReadonlyArray<ToolDefinition> = [
  define({
    name: 'get_latest_news',
    title: 'Latest crypto news',
    description:
      'Latest crypto headlines from 300+ sources (CoinDesk, The Block, Decrypt, Bloomberg, Reuters and more). Filter by category or source, sort by AI impact score, or restrict to the curated tier-1 homepage feed.',
    group: 'News',
    endpoint: 'GET /api/news',
    input: {
      limit: limit(100, 10, 'articles'),
      category: z.enum(NEWS_CATEGORIES).optional().describe('Restrict to one news category'),
      source: z.string().max(64).optional().describe('Source id, e.g. coindesk, theblock, decrypt, cointelegraph'),
      quality: z.enum(['all', 'high', 'premium']).optional().describe('Minimum source quality tier'),
      contentType: z.enum(['news', 'opinion', 'analysis', 'press-release']).optional().describe('Only this kind of article'),
      sort: z.enum(['latest', 'impact']).default('latest').describe('"impact" ranks by AI-scored market impact'),
      homepage_only: z.boolean().default(false).describe('Only the curated tier-1/tier-2 sources shown on the homepage'),
      lang: z.string().length(2).default('en').describe('ISO-639-1 language code for translated headlines'),
    },
    run: (a, ctx) =>
      ctx.get('/api/news', {
        limit: a.limit,
        category: a.category,
        source: a.source,
        quality: a.quality,
        contentType: a.contentType,
        sort: a.sort === 'impact' ? 'impact' : undefined,
        sources: a.homepage_only ? 'homepage' : undefined,
        lang: a.lang === 'en' ? undefined : a.lang,
      }),
  }),
  define({
    name: 'get_breaking_news',
    title: 'Breaking news',
    description: 'Breaking crypto news from the last few hours, ranked by urgency. Use for "what just happened" questions.',
    group: 'News',
    endpoint: 'GET /api/breaking',
    input: {
      lang: z.string().length(2).default('en').describe('ISO-639-1 language code'),
    },
    run: (a, ctx) => ctx.get('/api/breaking', { lang: a.lang === 'en' ? undefined : a.lang }),
  }),
  define({
    name: 'search_news',
    title: 'Search news',
    description:
      'Full-text search across every indexed article. Pass a topic, coin, company or event. Set semantic=true for embedding-based search that matches meaning rather than exact words.',
    group: 'News',
    endpoint: 'GET /api/search',
    input: {
      query: z.string().min(1).max(500).describe('Search query, e.g. "ethereum ETF approval"'),
      limit: limit(100, 10, 'results'),
      type: z.enum(['news', 'coins', 'all']).default('news').describe('Search news articles, coins, or both'),
      semantic: z.boolean().default(false).describe('Use semantic (embedding) search instead of keyword matching'),
    },
    run: (a, ctx) =>
      ctx.get('/api/search', { q: a.query, limit: a.limit, type: a.type, semantic: a.semantic ? 'true' : undefined }),
  }),
  define({
    name: 'get_article',
    title: 'Article by id, slug or URL',
    description:
      'Fetch one article. Give an archive id or slug to read it from the archive, or give any article URL to extract its full text and metadata from the publisher page.',
    group: 'News',
    endpoint: 'GET /api/articles?id= | GET /api/article?url=',
    input: {
      id: z.string().max(200).optional().describe('Archive article id'),
      slug: z.string().max(200).optional().describe('Archive article slug'),
      url: z.string().url().optional().describe('Public article URL to extract'),
    },
    run: (a, ctx) => {
      if (a.url) return ctx.get('/api/article', { url: a.url });
      if (a.id) return ctx.get('/api/articles', { id: a.id });
      if (a.slug) return ctx.get('/api/articles', { slug: a.slug });
      throw new Error('Provide one of id, slug or url.');
    },
  }),
  define({
    name: 'get_archive',
    title: 'Historical archive',
    description:
      'Query the historical news archive by date range, ticker, source, sentiment or keyword. Every article carries market context (price at publish time).',
    group: 'News',
    endpoint: 'GET /api/archive',
    input: {
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Start date YYYY-MM-DD'),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('End date YYYY-MM-DD'),
      query: z.string().max(200).optional().describe('Keyword filter on title and description'),
      ticker: z.string().max(16).optional().describe('Coin ticker filter, e.g. BTC'),
      source: z.string().max(64).optional().describe('Source filter'),
      sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
      limit: limit(200, 20, 'articles'),
      offset: z.number().int().min(0).default(0).describe('Pagination offset'),
    },
    run: (a, ctx) =>
      ctx.get('/api/archive', {
        start_date: a.start_date,
        end_date: a.end_date,
        q: a.query,
        ticker: a.ticker,
        source: a.source,
        sentiment: a.sentiment,
        limit: a.limit,
        offset: a.offset || undefined,
      }),
  }),
  define({
    name: 'get_archive_stats',
    title: 'Archive statistics',
    description: 'Coverage statistics for the historical archive: article counts, date range, sources and categories.',
    group: 'News',
    endpoint: 'GET /api/archive?stats=true',
    input: {},
    run: (_a, ctx) => ctx.get('/api/archive', { stats: 'true' }),
  }),
  define({
    name: 'get_regulatory_news',
    title: 'Regulatory news',
    description:
      'Regulatory and legal developments: SEC, CFTC, MiCA, court rulings, enforcement. Filter by jurisdiction, agency, sector or lookback window, or ask for jurisdiction profiles, agencies, deadlines or an intelligence summary.',
    group: 'News',
    endpoint: 'GET /api/regulatory',
    input: {
      view: z.enum(['events', 'jurisdictions', 'agencies', 'deadlines', 'summary']).default('events').describe('Which regulatory view to return'),
      jurisdiction: z.string().max(32).optional().describe('Jurisdiction filter, e.g. US, EU, UK, HK'),
      agency: z.string().max(32).optional().describe('Agency filter, e.g. SEC, CFTC, ESMA'),
      sector: z.string().max(32).optional().describe('Sector filter, e.g. exchanges, stablecoins, defi'),
      impact: z.string().max(16).optional().describe('Impact filter, e.g. high'),
      days: z.number().int().min(1).max(365).optional().describe('Lookback window in days'),
      limit: limit(100, 20, 'events'),
    },
    run: (a, ctx) =>
      ctx.get('/api/regulatory', {
        action: a.view === 'events' ? undefined : a.view,
        jurisdiction: a.jurisdiction,
        agency: a.agency,
        sector: a.sector,
        impact: a.impact,
        days: a.days,
        limit: a.limit,
      }),
  }),
  define({
    name: 'get_portfolio_news',
    title: 'Portfolio news',
    description: 'News for a specific set of holdings, optionally with live prices for each coin. Use when the user names the coins they hold.',
    group: 'News',
    endpoint: 'GET /api/portfolio',
    input: {
      coins: z.string().min(1).max(300).describe('Comma-separated coin symbols or names, e.g. "btc,eth,sol"'),
      limit: limit(50, 10, 'articles per coin'),
      prices: z.boolean().default(true).describe('Attach current price, 24h change and market cap'),
    },
    run: (a, ctx) => ctx.get('/api/portfolio', { coins: a.coins, limit: a.limit, prices: a.prices ? 'true' : 'false' }),
  }),
  define({
    name: 'get_daily_digest',
    title: 'Daily digest',
    description: 'A compiled digest of the most important stories over the last 6, 12 or 24 hours, in full, brief or newsletter form.',
    group: 'News',
    endpoint: 'GET /api/digest',
    input: {
      period: z.enum(['6h', '12h', '24h']).default('24h'),
      format: z.enum(['full', 'brief', 'newsletter', 'ai-digest']).default('brief'),
    },
    run: (a, ctx) => ctx.get('/api/digest', { period: a.period, format: a.format }),
  }),
  define({
    name: 'list_categories',
    title: 'News categories',
    description: 'Every news category the API understands, with article counts. Use the ids as the category argument of get_latest_news.',
    group: 'News',
    endpoint: 'GET /api/news/categories',
    input: {},
    run: (_a, ctx) => ctx.get('/api/news/categories'),
  }),

  define({
    name: 'get_trending_topics',
    title: 'Trending topics',
    description: 'Topics trending across the news flow right now, each tagged bullish, bearish or neutral with sample headlines.',
    group: 'Analysis',
    endpoint: 'GET /api/trending',
    input: {
      limit: limit(50, 10, 'topics'),
      hours: z.number().int().min(1).max(72).default(24).describe('Time window in hours'),
    },
    run: (a, ctx) => ctx.get('/api/trending', { limit: a.limit, hours: a.hours }),
  }),
  define({
    name: 'get_narratives',
    title: 'Market narratives',
    description: 'The narratives currently driving coverage (e.g. RWA, restaking, ETF flows) with momentum, sentiment and related tickers. emerging=true surfaces narratives that are just starting to pick up.',
    group: 'Analysis',
    endpoint: 'GET /api/narratives',
    input: {
      limit: limit(80, 20, 'narratives'),
      emerging: z.boolean().default(false).describe('Only emerging narratives'),
    },
    run: (a, ctx) => ctx.get('/api/narratives', { limit: a.limit, emerging: a.emerging ? 'true' : undefined }),
  }),
  define({
    name: 'get_sentiment',
    title: 'News sentiment',
    description: 'AI sentiment for one asset or the whole market: score, confidence, and the headlines that drove it.',
    group: 'Analysis',
    endpoint: 'GET /api/sentiment',
    input: {
      asset: z.string().max(16).optional().describe('Asset symbol, e.g. BTC, ETH, SOL. Omit for the market as a whole'),
      limit: limit(50, 20, 'articles analysed'),
    },
    run: (a, ctx) => ctx.get('/api/sentiment', { asset: a.asset, limit: a.limit }),
  }),
  define({
    name: 'analyze_news',
    title: 'Classified news',
    description: 'Recent articles with topic classification and sentiment labels, filterable by topic or sentiment. Good for "show me bearish regulation stories".',
    group: 'Analysis',
    endpoint: 'GET /api/analyze',
    input: {
      limit: limit(50, 10, 'articles'),
      topic: z.string().max(64).optional().describe('Topic filter, e.g. Bitcoin, Ethereum, DeFi, Regulation, Exchange'),
      sentiment: z.enum(['bullish', 'bearish', 'neutral']).optional(),
    },
    run: (a, ctx) => ctx.get('/api/analyze', { limit: a.limit, topic: a.topic, sentiment: a.sentiment }),
  }),
  define({
    name: 'get_trading_signals',
    title: 'Trading signals',
    description: 'News-derived trading signals with direction, confidence and the evidence behind each. Filter by ticker or minimum confidence.',
    group: 'Analysis',
    endpoint: 'GET /api/signals',
    input: {
      ticker: z.string().max(16).optional().describe('Coin symbol filter, e.g. BTC'),
      min_confidence: z.number().int().min(0).max(100).default(50).describe('Minimum confidence percentage'),
      limit: limit(50, 20, 'signals'),
    },
    run: (a, ctx) => ctx.get('/api/signals', { ticker: a.ticker, min_confidence: a.min_confidence, limit: a.limit }),
  }),
  define({
    name: 'get_social_sentiment',
    title: 'Social sentiment',
    description: 'Aggregate social-media sentiment (X, Reddit, Telegram) across the market.',
    group: 'Analysis',
    endpoint: 'GET /api/social/sentiment',
    input: {},
    run: (_a, ctx) => ctx.get('/api/social/sentiment'),
  }),

  define({
    name: 'get_fear_greed',
    title: 'Fear & Greed index',
    description: 'Crypto Fear & Greed Index (0 = extreme fear, 100 = extreme greed) with daily history.',
    group: 'Market',
    endpoint: 'GET /api/fear-greed',
    input: {
      days: z.number().int().min(1).max(30).default(7).describe('Days of history'),
    },
    run: (a, ctx) => ctx.get('/api/fear-greed', { days: a.days }),
  }),
  define({
    name: 'get_market_overview',
    title: 'Global market overview',
    description: 'Total market cap, 24h volume, BTC/ETH dominance, active coins and market-cap change.',
    group: 'Market',
    endpoint: 'GET /api/global',
    input: {},
    run: (_a, ctx) => ctx.get('/api/global'),
  }),
  define({
    name: 'get_coin_prices',
    title: 'Coin prices (batch)',
    description: 'Live USD prices with 24h change for any list of CoinGecko coin ids.',
    group: 'Market',
    endpoint: 'GET /api/prices',
    input: {
      coins: z.string().min(1).max(500).default('bitcoin,ethereum,solana').describe('Comma-separated CoinGecko ids, e.g. "bitcoin,ethereum,solana"'),
    },
    run: (a, ctx) => ctx.get('/api/prices', { coins: a.coins }),
  }),
  define({
    name: 'get_top_coins',
    title: 'Top coins by market cap',
    description: 'Ranked coin table: price, market cap, volume, supply, 24h/7d change. Up to 250 coins.',
    group: 'Market',
    endpoint: 'GET /api/market/coins',
    input: {
      limit: limit(250, 50, 'coins'),
    },
    run: (a, ctx) => ctx.get('/api/market/coins', { type: 'top', limit: a.limit }),
  }),
  define({
    name: 'get_coin_detail',
    title: 'Coin detail',
    description: 'Detailed market data for one coin: price, market cap, volume, supply, ATH, 24h/7d/30d change.',
    group: 'Market',
    endpoint: 'GET /api/market/compare?ids=',
    input: {
      coin: coinId('CoinGecko coin id, e.g. "bitcoin"'),
    },
    run: (a, ctx) => ctx.get('/api/market/compare', { ids: a.coin }),
  }),
  define({
    name: 'compare_coins',
    title: 'Compare coins',
    description: 'Side-by-side comparison of 2 to 25 coins: price, market cap, volume, performance.',
    group: 'Market',
    endpoint: 'GET /api/market/compare',
    input: {
      coins: z.string().min(3).max(600).regex(/^[a-z0-9,-]+$/, 'lowercase CoinGecko ids separated by commas').describe('Comma-separated CoinGecko ids, e.g. "bitcoin,ethereum,solana"'),
    },
    run: (a, ctx) => ctx.get('/api/market/compare', { ids: a.coins }),
  }),
  define({
    name: 'get_ohlc',
    title: 'OHLC candles',
    description: 'Open/high/low/close candles for one coin over 1 to 365 days.',
    group: 'Market',
    endpoint: 'GET /api/ohlc',
    input: {
      coin: coinId('CoinGecko coin id, e.g. "bitcoin"'),
      days: z.union([z.literal(1), z.literal(7), z.literal(14), z.literal(30), z.literal(90), z.literal(180), z.literal(365)]).default(30).describe('Window in days: 1, 7, 14, 30, 90, 180 or 365'),
    },
    run: (a, ctx) => ctx.get('/api/ohlc', { coinId: a.coin, days: a.days }),
  }),
  define({
    name: 'get_price_chart',
    title: 'Price chart series',
    description: 'Price, market cap and volume time series for one coin over a named range (1h to all-time).',
    group: 'Market',
    endpoint: 'GET /api/charts',
    input: {
      coin: coinId('CoinGecko coin id, e.g. "ethereum"'),
      range: z.enum(['1h', '24h', '7d', '30d', '90d', '1y', 'all']).default('24h'),
    },
    run: (a, ctx) => ctx.get('/api/charts', { coin: a.coin, range: a.range }),
  }),
  define({
    name: 'get_top_gainers',
    title: 'Top gainers',
    description: 'Best-performing coins over 1h, 24h or 7d.',
    group: 'Market',
    endpoint: 'GET /api/market/gainers',
    input: {
      limit: limit(50, 10, 'coins'),
      timeframe: z.enum(['1h', '24h', '7d']).default('24h'),
    },
    run: (a, ctx) => ctx.get('/api/market/gainers', { limit: a.limit, timeframe: a.timeframe }),
  }),
  define({
    name: 'get_top_losers',
    title: 'Top losers',
    description: 'Worst-performing coins over 1h, 24h or 7d.',
    group: 'Market',
    endpoint: 'GET /api/market/losers',
    input: {
      limit: limit(50, 10, 'coins'),
      timeframe: z.enum(['1h', '24h', '7d']).default('24h'),
    },
    run: (a, ctx) => ctx.get('/api/market/losers', { limit: a.limit, timeframe: a.timeframe }),
  }),
  define({
    name: 'search_coins',
    title: 'Search coins',
    description: 'Resolve a name, symbol or partial string to CoinGecko coin ids. Use before price or chart tools when you only know a ticker.',
    group: 'Market',
    endpoint: 'GET /api/market/search',
    input: {
      query: z.string().min(1).max(64).describe('Name or symbol, e.g. "sol" or "chainlink"'),
    },
    run: (a, ctx) => ctx.get('/api/market/search', { q: a.query }),
  }),
  define({
    name: 'get_market_dominance',
    title: 'Market dominance',
    description: 'Market-cap dominance split across BTC, ETH, stablecoins and the rest.',
    group: 'Market',
    endpoint: 'GET /api/market/dominance',
    input: {},
    run: (_a, ctx) => ctx.get('/api/market/dominance'),
  }),

  define({
    name: 'get_defi_overview',
    title: 'DeFi TVL overview',
    description: 'DeFi total value locked summary: overall TVL, top protocols and chains, 24h/7d changes.',
    group: 'DeFi',
    endpoint: 'GET /api/defi/summary',
    input: {},
    run: (_a, ctx) => ctx.get('/api/defi/summary'),
  }),
  define({
    name: 'get_defi_yields',
    title: 'DeFi yields',
    description: 'Yield opportunities with APY, TVL, chain and project. Filter by chain, project, APY band, minimum TVL or stablecoin-only pools.',
    group: 'DeFi',
    endpoint: 'GET /api/defi/yields',
    input: {
      chain: z.string().max(32).optional().describe('Chain filter, e.g. ethereum, arbitrum, solana, base'),
      project: z.string().max(64).optional().describe('Protocol filter, e.g. aave-v3, lido'),
      min_tvl: z.number().min(0).optional().describe('Minimum pool TVL in USD'),
      min_apy: z.number().min(0).optional().describe('Minimum APY percent'),
      max_apy: z.number().min(0).optional().describe('Maximum APY percent (screens out obvious traps)'),
      stable: z.boolean().default(false).describe('Only stablecoin pools'),
      limit: limit(100, 20, 'pools'),
    },
    run: (a, ctx) =>
      ctx.get('/api/defi/yields', {
        chain: a.chain,
        project: a.project,
        min_tvl: a.min_tvl,
        min_apy: a.min_apy,
        max_apy: a.max_apy,
        stable: a.stable ? 'true' : undefined,
        limit: a.limit,
      }),
  }),
  define({
    name: 'get_stablecoins',
    title: 'Stablecoins',
    description: 'Stablecoin market caps, peg status and 24h/7d supply changes, optionally broken down by chain.',
    group: 'DeFi',
    endpoint: 'GET /api/stablecoins',
    input: {
      limit: limit(100, 20, 'stablecoins'),
      chains: z.boolean().default(false).describe('Include per-chain breakdown'),
    },
    run: (a, ctx) => ctx.get('/api/stablecoins', { limit: a.limit, chains: a.chains ? 'true' : undefined }),
  }),
  define({
    name: 'get_dex_volumes',
    title: 'DEX volumes',
    description: 'Decentralised exchange trading volumes by protocol, optionally for one chain.',
    group: 'DeFi',
    endpoint: 'GET /api/dex-volumes',
    input: {
      chain: z.string().max(32).optional().describe('Chain filter, e.g. ethereum, solana, base'),
      top: z.number().int().min(1).max(100).default(20).describe('Number of DEXes to return'),
    },
    run: (a, ctx) => ctx.get('/api/dex-volumes', { chain: a.chain, top: a.top }),
  }),
  define({
    name: 'get_layer2_data',
    title: 'Layer 2 data',
    description: 'TVL, activity and stats for Ethereum layer 2 networks (Arbitrum, Base, Optimism, zkSync and more).',
    group: 'DeFi',
    endpoint: 'GET /api/l2',
    input: {},
    run: (_a, ctx) => ctx.get('/api/l2'),
  }),
  define({
    name: 'get_gas_prices',
    title: 'Gas prices',
    description: 'Current Ethereum gas prices (slow/standard/fast in gwei), base fee and congestion.',
    group: 'DeFi',
    endpoint: 'GET /api/gas',
    input: {},
    run: (_a, ctx) => ctx.get('/api/gas'),
  }),

  define({
    name: 'get_funding_rates',
    title: 'Funding rates',
    description: 'Perpetual futures funding rates across Binance, Bybit, OKX and Hyperliquid, with cross-exchange spreads. Positive means longs pay shorts.',
    group: 'Derivatives',
    endpoint: 'GET /api/funding',
    input: {
      symbol: z.string().max(20).optional().describe('Pair filter, e.g. BTCUSDT'),
      exchange: z.enum(['binance', 'bybit', 'okx', 'hyperliquid']).optional(),
      min_spread: z.number().min(0).default(0).describe('Only pairs whose cross-exchange spread exceeds this (percent)'),
      limit: limit(200, 50, 'rows'),
    },
    run: (a, ctx) =>
      ctx.get('/api/funding', { symbol: a.symbol, exchange: a.exchange, minSpread: a.min_spread || undefined, limit: a.limit }),
  }),
  define({
    name: 'get_liquidations',
    title: 'Liquidations',
    description: 'Recent forced liquidations across exchanges: totals, long/short split and largest events.',
    group: 'Derivatives',
    endpoint: 'GET /api/liquidations',
    input: {},
    run: (_a, ctx) => ctx.get('/api/liquidations'),
  }),
  define({
    name: 'get_derivatives',
    title: 'Derivatives tickers',
    description: 'Perpetual and futures tickers: open interest, volume, funding and basis across major venues.',
    group: 'Derivatives',
    endpoint: 'GET /api/derivatives',
    input: {},
    run: (_a, ctx) => ctx.get('/api/derivatives'),
  }),
  define({
    name: 'get_options_data',
    title: 'Options data',
    description: 'Options market for BTC or ETH: dashboard, flow, volatility surface, max pain or gamma views.',
    group: 'Derivatives',
    endpoint: 'GET /api/options',
    input: {
      underlying: z.enum(['BTC', 'ETH']).default('BTC'),
      view: z.enum(['dashboard', 'flow', 'surface', 'maxpain', 'gamma']).default('dashboard'),
      expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Expiry date YYYY-MM-DD for max pain'),
    },
    run: (a, ctx) => ctx.get('/api/options', { underlying: a.underlying, view: a.view, expiry: a.expiry }),
  }),
  define({
    name: 'get_orderbook',
    title: 'Order book',
    description: 'Order book depth (bids, asks, spread, liquidity) for a pair on one or more exchanges.',
    group: 'Derivatives',
    endpoint: 'GET /api/trading/orderbook',
    input: {
      symbol: z.string().min(3).max(20).default('BTCUSDT').describe('Trading pair, e.g. BTCUSDT'),
      depth: z.number().int().min(1).max(100).default(20).describe('Price levels per side'),
      exchanges: z.string().max(100).optional().describe('Comma-separated exchanges, e.g. binance,coinbase,kraken'),
    },
    run: (a, ctx) => ctx.get('/api/trading/orderbook', { symbol: a.symbol, depth: a.depth, exchanges: a.exchanges }),
  }),
  define({
    name: 'get_arbitrage',
    title: 'Arbitrage opportunities',
    description: 'Cross-exchange price spreads for a symbol, ranked by spread or estimated profit.',
    group: 'Derivatives',
    endpoint: 'GET /api/trading/arbitrage',
    input: {
      symbol: z.string().max(20).optional().describe('Asset symbol, e.g. BTC, ETH; omit for all tracked assets'),
      min_spread: z.number().min(0).default(0).describe('Minimum spread percent'),
      limit: limit(100, 20, 'opportunities'),
    },
    run: (a, ctx) => ctx.get('/api/trading/arbitrage', { symbol: a.symbol, minSpread: a.min_spread || undefined, limit: a.limit }),
  }),

  define({
    name: 'get_whale_alerts',
    title: 'Whale alerts',
    description: 'Large on-chain transfers between wallets and exchanges, with USD value and direction, across major chains.',
    group: 'On-chain',
    endpoint: 'GET /api/whale-alerts',
    input: {
      blockchain: z.string().max(32).default('all').describe('Chain filter, e.g. bitcoin, ethereum, solana, or all'),
      min_value: z.number().int().min(0).default(1_000_000).describe('Minimum transfer value in USD'),
      limit: limit(100, 20, 'transfers'),
    },
    run: (a, ctx) => ctx.get('/api/whale-alerts', { blockchain: a.blockchain, minValue: a.min_value, limit: a.limit }),
  }),
  define({
    name: 'get_exchange_flows',
    title: 'Exchange flows',
    description: 'Net inflow/outflow of an asset to and from centralised exchanges, a classic accumulation or distribution signal.',
    group: 'On-chain',
    endpoint: 'GET /api/onchain/exchange-flows',
    input: {
      asset: z.string().max(16).default('BTC').describe('Asset symbol, e.g. BTC, ETH'),
    },
    run: (a, ctx) => ctx.get('/api/onchain/exchange-flows', { asset: a.asset }),
  }),
  define({
    name: 'get_token_unlocks',
    title: 'Token unlocks',
    description: 'Upcoming token unlock schedules with amounts, USD value and share of circulating supply. calendar=true groups them by date.',
    group: 'On-chain',
    endpoint: 'GET /api/unlocks',
    input: {
      project: z.string().max(64).optional().describe('Project or token filter, e.g. arbitrum'),
      calendar: z.boolean().default(false).describe('Return a date-grouped calendar view'),
      limit: limit(50, 10, 'unlocks'),
    },
    run: (a, ctx) => ctx.get('/api/unlocks', { project: a.project, calendar: a.calendar ? 'true' : undefined, limit: a.limit }),
  }),
  define({
    name: 'get_events_calendar',
    title: 'Events calendar',
    description: 'Upcoming crypto events: conferences, hard forks, mainnet launches, token unlocks, macro dates.',
    group: 'On-chain',
    endpoint: 'GET /api/events',
    input: {
      category: z.string().max(32).optional().describe('Event category, e.g. conference, hardfork, unlock, launch'),
      importance: z.string().max(16).optional().describe('Importance filter, e.g. high'),
      limit: limit(100, 20, 'events'),
    },
    run: (a, ctx) => ctx.get('/api/events', { category: a.category, importance: a.importance, limit: a.limit }),
  }),
  define({
    name: 'get_airdrops',
    title: 'Airdrops',
    description: 'Upcoming, active and ended airdrops with eligibility notes and estimated value.',
    group: 'On-chain',
    endpoint: 'GET /api/airdrops',
    input: {
      status: z.enum(['upcoming', 'active', 'ended']).default('upcoming'),
      limit: limit(50, 10, 'airdrops'),
    },
    run: (a, ctx) => ctx.get('/api/airdrops', { status: a.status, limit: a.limit }),
  }),

  define({
    name: 'get_exchanges',
    title: 'Exchanges',
    description: 'Exchange directory ranked by trust score or volume: 24h volume, trust score, year established, country.',
    group: 'Reference',
    endpoint: 'GET /api/exchanges',
    input: {
      sort: z.enum(['trust', 'volume']).default('trust'),
      limit: limit(100, 20, 'exchanges'),
    },
    run: (a, ctx) => ctx.get('/api/exchanges', { sort: a.sort, limit: a.limit }),
  }),
  define({
    name: 'list_sources',
    title: 'News sources',
    description: 'Every news source the aggregator indexes, with ids (usable as the source argument elsewhere), tiers and feed URLs.',
    group: 'Reference',
    endpoint: 'GET /api/sources',
    input: {},
    run: (_a, ctx) => ctx.get('/api/sources'),
  }),
  define({
    name: 'get_source_health',
    title: 'API and source health',
    description: 'Health of the API and each upstream feed: status, latency, last successful fetch, failing sources.',
    group: 'Reference',
    endpoint: 'GET /api/health',
    input: {},
    run: (_a, ctx) => ctx.get('/api/health'),
  }),
  define({
    name: 'get_macro_indicators',
    title: 'Macro indicators',
    description: 'Macro backdrop for crypto: rates, CPI, DXY, equities and their correlation with BTC.',
    group: 'Reference',
    endpoint: 'GET /api/macro',
    input: {},
    run: (_a, ctx) => ctx.get('/api/macro'),
  }),
  define({
    name: 'get_glossary',
    title: 'Glossary',
    description: 'Look up a crypto term or browse a glossary category.',
    group: 'Reference',
    endpoint: 'GET /api/glossary',
    input: {
      query: z.string().max(64).optional().describe('Term to define, e.g. "impermanent loss"'),
      category: z.string().max(32).optional().describe('Category filter, e.g. trading, defi, blockchain'),
      limit: limit(100, 20, 'terms'),
    },
    run: (a, ctx) => ctx.get('/api/glossary', { q: a.query, category: a.category, limit: a.limit }),
  }),

  define({
    name: 'summarize_news',
    title: 'AI news summary',
    description: 'AI-written summary of the latest articles, optionally for one source, as a brief, detailed prose or bullet points.',
    group: 'AI',
    endpoint: 'GET /api/summarize',
    input: {
      limit: z.number().int().min(1).max(20).default(5).describe('Articles to summarise'),
      source: z.string().max(64).optional().describe('Restrict to one source id'),
      style: z.enum(['brief', 'detailed', 'bullet']).default('brief'),
    },
    run: (a, ctx) => ctx.get('/api/summarize', { limit: a.limit, source: a.source, style: a.style }),
  }),
  define({
    name: 'ask_crypto',
    title: 'Ask a question',
    description: 'Ask a natural-language question about crypto news and markets; the answer is grounded in current articles and cites its sources.',
    group: 'AI',
    endpoint: 'POST /api/ask',
    input: {
      question: z.string().min(3).max(2000).describe('The question, e.g. "Why did ETH move today?"'),
      context: z.string().max(4000).optional().describe('Extra context to steer the answer'),
    },
    run: (a, ctx) => ctx.post('/api/ask', { question: a.question, context: a.context }),
  }),
  define({
    name: 'get_ai_brief',
    title: 'AI market brief',
    description: 'AI-generated daily market brief: price action, sentiment, key stories and what to watch.',
    group: 'AI',
    endpoint: 'GET /api/ai/brief',
    input: {
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Brief for a specific date YYYY-MM-DD (default today)'),
    },
    run: (a, ctx) => ctx.get('/api/ai/brief', { date: a.date }),
  }),

  define({
    name: 'get_rss_feeds',
    title: 'RSS feed URLs',
    description: 'RSS, Atom and OPML feed URLs for the news categories. Pass fetch=true to return the XML of one feed instead of just its URL.',
    group: 'Feeds & Discovery',
    endpoint: 'GET /api/rss | GET /api/atom | GET /api/opml',
    input: {
      feed: z.enum(RSS_FEEDS).default('all'),
      fetch: z.boolean().default(false).describe('Download the RSS XML for the chosen feed'),
      limit: limit(50, 20, 'items when fetching'),
    },
    run: async (a, ctx) => {
      const base = ctx.config.baseUrl;
      if (a.fetch) {
        return ctx.getText('/api/rss', { feed: a.feed, limit: a.limit }, 'application/rss+xml, application/xml, text/xml');
      }
      return {
        feeds: RSS_FEEDS.map((feed) => ({
          feed,
          rss: `${base}/api/rss?feed=${feed}`,
          atom: `${base}/api/atom?feed=${feed}`,
        })),
        opml: `${base}/api/opml`,
        selected: { feed: a.feed, rss: `${base}/api/rss?feed=${a.feed}&limit=${a.limit}` },
      };
    },
  }),
  define({
    name: 'list_endpoints',
    title: 'List API endpoints',
    description: 'Discover the REST API behind these tools: the live OpenAPI path list (optionally filtered) plus the endpoint each MCP tool maps to.',
    group: 'Feeds & Discovery',
    endpoint: 'GET /api/openapi.json',
    input: {
      filter: z.string().max(64).optional().describe('Only paths containing this text, e.g. "defi"'),
      limit: limit(400, 100, 'paths'),
    },
    run: async (a, ctx) => {
      const spec = (await ctx.get('/api/openapi.json')) as { paths?: Record<string, Record<string, { summary?: string }>> };
      const needle = a.filter?.toLowerCase();
      const paths = Object.entries(spec.paths ?? {})
        .filter(([path]) => !needle || path.toLowerCase().includes(needle))
        .slice(0, a.limit)
        .map(([path, ops]) => ({
          path,
          methods: Object.keys(ops).map((m) => m.toUpperCase()),
          summary: Object.values(ops).find((op) => op?.summary)?.summary,
        }));
      return {
        base: ctx.config.baseUrl,
        openapi: `${ctx.config.baseUrl}/api/openapi.json`,
        total_paths: Object.keys(spec.paths ?? {}).length,
        paths,
        tools: TOOLS.map((tool) => ({ tool: tool.name, endpoint: tool.endpoint })),
      };
    },
  }),
  define({
    name: 'get_stories',
    title: 'Stories, deduplicated with provenance',
    description:
      'The news collapsed into events instead of headlines. One entry per story, with the outlet credited with publishing first and every outlet that followed, including how far behind each was. Use this instead of get_latest_news when the question is "what happened" rather than "what was published", when you need to avoid counting one event forty times, or when you want to know who broke something. Each story carries a confidence level and a plain-English reason; attribution rests on publisher timestamps, and a story whose timing cannot be verified reports originator: null rather than guessing.',
    group: 'Provenance',
    endpoint: 'GET /api/stories',
    input: {
      limit: limit(300, 150, 'articles to analyse'),
      category: z.enum(NEWS_CATEGORIES).optional().describe('Restrict the corpus to one news category'),
      min_outlets: z
        .number()
        .int()
        .min(1)
        .max(20)
        .default(2)
        .describe('Smallest cluster to return. 1 includes exclusives that only one outlet covered'),
      confidence: z
        .enum(['high', 'medium', 'low', 'unattributed'])
        .optional()
        .describe('Only stories whose attribution is at least this strong'),
    },
    run: (a, ctx) =>
      ctx.get('/api/stories', {
        limit: a.limit,
        category: a.category,
        minOutlets: a.min_outlets,
        confidence: a.confidence,
      }),
  }),
  define({
    name: 'get_story',
    title: 'One story, with its full propagation chain',
    description:
      'Everything known about a single clustered story: the originating outlet, every outlet that followed in order, the lag for each, and the terms that grouped them as evidence. Story ids come from get_stories and stay stable while a story is in the analysis window; they are not permanent archive identifiers.',
    group: 'Provenance',
    endpoint: 'GET /api/stories/{id}',
    input: {
      id: z
        .string()
        .min(1)
        .max(16)
        .regex(/^[a-z0-9]+$/i, 'Story ids are short alphanumeric tokens from get_stories')
        .describe('Story id from get_stories'),
    },
    run: (a, ctx) => ctx.get(`/api/stories/${encodeURIComponent(a.id)}`),
  }),
  define({
    name: 'get_source_leaderboard',
    title: 'Which outlets break stories, and which follow',
    description:
      'Ranks news outlets by how often they published first across the current window, with median lag when they followed. Unlike any "top crypto news sites" list, this is measured from publication times over clustered stories rather than from traffic or popularity. Read meta.caveats before quoting it: the window is hours not history, timing comes from publisher feeds which are frequently wrong, and publishing first says nothing about accuracy. An outlet with too little evidence reports a null rate rather than a flattering percentage.',
    group: 'Provenance',
    endpoint: 'GET /api/sources/leaderboard',
    input: {
      limit: limit(300, 300, 'articles to analyse'),
      category: z.enum(NEWS_CATEGORIES).optional().describe('Restrict the corpus to one news category'),
      ranked_only: z
        .boolean()
        .default(false)
        .describe('Only outlets with enough evidence for a measurable origination rate'),
    },
    run: (a, ctx) =>
      ctx.get('/api/sources/leaderboard', {
        limit: a.limit,
        category: a.category,
        ranked: a.ranked_only ? '1' : undefined,
      }),
  }),
  define({
    name: 'get_source_health',
    title: 'Which sources are actually answering',
    description:
      'Per-source liveness for the RSS layer: success rate, latency, last error and last successful fetch. A feed that fails is turned into an empty result so one dead source never breaks the aggregate, which also means a source can rot invisibly. Use this to check whether thin coverage of a topic reflects the news or a broken feed.',
    group: 'Provenance',
    endpoint: 'GET /api/sources/health',
    input: {
      status: z.enum(['failing', 'ok']).optional().describe('Only sources in this state'),
      category: z.string().max(64).optional().describe('Restrict to one source category'),
      summary_only: z.boolean().default(false).describe('Counts only, without the per-source rows'),
    },
    run: (a, ctx) =>
      ctx.get('/api/sources/health', {
        status: a.status,
        category: a.category,
        summary: a.summary_only ? '1' : undefined,
      }),
  }),
];

export const TOOL_GROUPS: ReadonlyArray<ToolGroup> = [
  'News', 'Analysis', 'Market', 'DeFi', 'Derivatives', 'On-chain', 'Reference', 'AI', 'Feeds & Discovery',
  'Provenance',
];

export function getTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name);
}
