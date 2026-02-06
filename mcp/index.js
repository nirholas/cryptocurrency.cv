#!/usr/bin/env node
/**
 * Free Crypto News MCP Server
 * 
 * Supports multiple transports:
 * - stdio: For Claude Desktop and local MCP clients
 * - http: For ChatGPT Developer Mode and remote clients
 * 
 * 100% FREE - no API keys required!
 * 
 * Usage:
 *   node index.js              # stdio mode (default, for Claude Desktop)
 *   node index.js --http       # HTTP/SSE mode (for ChatGPT Developer Mode)
 *   node http-server.js        # HTTP-only server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE = process.env.API_BASE || 'https://cryptocurrency.cv';
const TRANSPORT_MODE = process.argv.includes('--http') ? 'http' : 'stdio';

// Create server
const server = new Server(
  {
    name: 'free-crypto-news',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools with readOnlyHint annotations for ChatGPT compatibility
const tools = [
  {
    name: 'get_crypto_news',
    description: 'Get latest crypto news from 130+ sources including CoinDesk, The Block, Decrypt, Bloomberg, Reuters, and more. Use this when the user wants general crypto news or headlines.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles to return (1-50)',
          default: 10,
        },
        source: {
          type: 'string',
          description: 'Filter by source: coindesk, theblock, decrypt, cointelegraph, bitcoinmagazine, blockworks, defiant',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'search_crypto_news',
    description: 'Search crypto news by keywords across all sources. Use this when the user wants to find news about a specific topic, coin, or event.',
    inputSchema: {
      type: 'object',
      properties: {
        keywords: {
          type: 'string',
          description: 'Comma-separated keywords to search for (e.g., "ethereum,ETF" or "SEC,regulation")',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (1-30)',
          default: 10,
        },
      },
      required: ['keywords'],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_defi_news',
    description: 'Get DeFi-specific news (yield farming, DEXs, lending, protocols). Use this when the user asks about DeFi, decentralized finance, or specific DeFi protocols.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-30)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_bitcoin_news',
    description: 'Get Bitcoin-specific news (BTC, Lightning Network, miners, ordinals). Use this when the user specifically asks about Bitcoin or BTC.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-30)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_breaking_news',
    description: 'Get breaking crypto news from the last 2 hours. Use this when the user wants the most recent, urgent, or breaking news.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-20)',
          default: 5,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_market_data',
    description: 'Get live cryptocurrency market data including prices, market cap, volume, and 24h changes. Supports 100+ coins. Use this when the user asks about prices or market data.',
    inputSchema: {
      type: 'object',
      properties: {
        coins: {
          type: 'string',
          description: 'Comma-separated coin IDs (e.g., "bitcoin,ethereum,solana"). Use CoinGecko IDs.',
          default: 'bitcoin,ethereum,solana',
        },
        vs_currency: {
          type: 'string',
          description: 'Currency for prices (usd, eur, gbp, jpy, btc)',
          default: 'usd',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_fear_greed_index',
    description: 'Get the Crypto Fear & Greed Index - a market sentiment indicator from 0 (Extreme Fear) to 100 (Extreme Greed). Use this when the user asks about market sentiment or fear/greed.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days of history (1-30)',
          default: 7,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_gas_prices',
    description: 'Get current Ethereum gas prices (slow, standard, fast) in Gwei. Use this when the user asks about gas fees or transaction costs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_regulatory_news',
    description: 'Get regulatory and legal news about crypto (SEC, CFTC, global regulations, lawsuits, compliance). Use this when the user asks about regulation, legal issues, or government actions.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-30)',
          default: 10,
        },
        region: {
          type: 'string',
          description: 'Filter by region: us, eu, asia, global',
          enum: ['us', 'eu', 'asia', 'global'],
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_whale_alerts',
    description: 'Get large cryptocurrency transactions (whale movements). Shows big transfers between wallets and exchanges. Use this when the user asks about whale activity or large transactions.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum alerts (1-50)',
          default: 10,
        },
        min_usd: {
          type: 'number',
          description: 'Minimum transaction value in USD',
          default: 1000000,
        },
        coin: {
          type: 'string',
          description: 'Filter by coin (btc, eth, usdt, etc.)',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_funding_rates',
    description: 'Get perpetual futures funding rates across exchanges. Positive = longs pay shorts (bullish positioning). Use this when the user asks about derivatives, funding, or leveraged positions.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair (e.g., BTCUSDT, ETHUSDT)',
          default: 'BTCUSDT',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_liquidations',
    description: 'Get recent liquidation data from crypto exchanges. Shows forced position closures. Use this when the user asks about liquidations or market volatility.',
    inputSchema: {
      type: 'object',
      properties: {
        hours: {
          type: 'number',
          description: 'Time window in hours (1-24)',
          default: 24,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_defi_yields',
    description: 'Get top DeFi yield opportunities across protocols. Shows APY, TVL, and risk level. Use this when the user asks about DeFi yields, staking, or earning.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum results (1-50)',
          default: 10,
        },
        chain: {
          type: 'string',
          description: 'Filter by blockchain: ethereum, bsc, polygon, arbitrum, solana, avalanche',
        },
        min_tvl: {
          type: 'number',
          description: 'Minimum TVL in USD',
          default: 1000000,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_ai_market_brief',
    description: 'Get an AI-generated market brief summarizing the current crypto market state. Includes price action, sentiment, key news, and notable events. Use this for a quick market overview.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          description: 'Focus area: general, bitcoin, ethereum, defi, altcoins',
          default: 'general',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'compare_coins',
    description: 'Compare two or more cryptocurrencies side-by-side. Shows price, market cap, volume, 24h change, and recent news for each. Use this when the user wants to compare coins.',
    inputSchema: {
      type: 'object',
      properties: {
        coins: {
          type: 'string',
          description: 'Comma-separated coin symbols to compare (e.g., "btc,eth,sol")',
        },
      },
      required: ['coins'],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_exchange_flows',
    description: 'Get exchange inflow/outflow data. Shows net movement of coins to/from exchanges. Use this when the user asks about exchange flows or accumulation/distribution.',
    inputSchema: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          description: 'Coin to track (btc, eth)',
          default: 'btc',
        },
        hours: {
          type: 'number',
          description: 'Time window in hours (1-168)',
          default: 24,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_token_unlocks',
    description: 'Get upcoming token unlock schedules. Shows when locked tokens become available. Use this when the user asks about vesting, unlocks, or token supply changes.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum results (1-30)',
          default: 10,
        },
        days: {
          type: 'number',
          description: 'Days to look ahead (1-90)',
          default: 30,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_social_sentiment',
    description: 'Get social media sentiment for cryptocurrencies. Analyzes Twitter/X, Reddit, and Telegram mentions. Use this when the user asks about social buzz or community sentiment.',
    inputSchema: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          description: 'Coin symbol (btc, eth, sol, etc.)',
          default: 'btc',
        },
        source: {
          type: 'string',
          description: 'Social platform: twitter, reddit, telegram, all',
          default: 'all',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_news_sources',
    description: 'Get list of all available crypto news sources with their details. Use this when the user asks what sources are available.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_api_health',
    description: 'Check the health status of the API and all RSS feed sources. Use this for debugging or status checks.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_trending_topics',
    description: 'Get trending crypto topics with sentiment analysis (bullish/bearish/neutral). Use this when the user asks about trends or market sentiment.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum topics to return (1-20)',
          default: 10,
        },
        hours: {
          type: 'number',
          description: 'Time window in hours (1-72)',
          default: 24,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_crypto_stats',
    description: 'Get analytics: articles per source, hourly distribution, category breakdown. Use this when the user asks about news statistics.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'analyze_news',
    description: 'Get news with topic classification and sentiment analysis. Filter by topic or sentiment. Use this when the user wants sentiment analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-50)',
          default: 10,
        },
        topic: {
          type: 'string',
          description: 'Filter by topic: Bitcoin, Ethereum, DeFi, NFTs, Regulation, Exchange, etc.',
        },
        sentiment: {
          type: 'string',
          description: 'Filter by sentiment: bullish, bearish, neutral',
          enum: ['bullish', 'bearish', 'neutral'],
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_archive',
    description: 'Query historical crypto news archive. Search by date range, source, or keywords. Use this when the user asks about past news.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format',
        },
        source: {
          type: 'string',
          description: 'Filter by source name',
        },
        search: {
          type: 'string',
          description: 'Search query for article titles/descriptions',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (1-200)',
          default: 20,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_archive_stats',
    description: 'Get statistics about the historical news archive. Use this when the user asks about available historical data.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'find_original_sources',
    description: 'Find the original sources of crypto news (who published it first before aggregators picked it up). Identifies if news came from official company announcements, government agencies, social media, or research firms. Use this when the user wants to trace news origins.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of articles to analyze (1-50)',
          default: 10,
        },
        search: {
          type: 'string',
          description: 'Search query to filter articles',
        },
        source_type: {
          type: 'string',
          description: 'Filter by source type: official, press-release, social, blog, government',
          enum: ['official', 'press-release', 'social', 'blog', 'government'],
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_portfolio_news',
    description: 'Get news for specific cryptocurrencies with optional price data from CoinGecko. Supports 40+ coins including BTC, ETH, SOL, ADA, XRP, DOGE, etc. Use this when the user mentions specific coins.',
    inputSchema: {
      type: 'object',
      properties: {
        coins: {
          type: 'string',
          description: 'Comma-separated coin symbols or names (e.g., "btc,eth,sol" or "bitcoin,ethereum")',
        },
        limit: {
          type: 'number',
          description: 'Maximum articles per coin (1-50)',
          default: 10,
        },
        prices: {
          type: 'boolean',
          description: 'Include price data from CoinGecko (USD, 24h change, market cap)',
          default: true,
        },
      },
      required: ['coins'],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_arbitrage',
    description: 'Get cross-exchange arbitrage opportunities. Shows price differences between exchanges for the same trading pair. Use this when the user asks about arbitrage or price differences.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair (e.g., BTC, ETH)',
          default: 'BTC',
        },
        limit: {
          type: 'number',
          description: 'Maximum opportunities to return (1-50)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_orderbook',
    description: 'Get order book depth for a trading pair. Shows bid/ask levels and liquidity. Use this when the user asks about order books, liquidity, or market depth.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Trading pair (e.g., BTCUSDT)',
          default: 'BTCUSDT',
        },
        exchange: {
          type: 'string',
          description: 'Exchange name (binance, coinbase, kraken)',
          default: 'binance',
        },
        depth: {
          type: 'number',
          description: 'Number of price levels (1-100)',
          default: 20,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_nft_news',
    description: 'Get NFT-specific news (collections, marketplaces, drops, art). Use this when the user asks about NFTs, digital art, or collectibles.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-30)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_stablecoin_data',
    description: 'Get stablecoin market data including market caps, volumes, and peg status. Use this when the user asks about stablecoins (USDT, USDC, DAI, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum stablecoins to return (1-20)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_options_data',
    description: 'Get crypto options market data including open interest, max pain, and put/call ratios. Use this when the user asks about options, derivatives, or hedging.',
    inputSchema: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          description: 'Coin symbol (btc, eth)',
          default: 'btc',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_events_calendar',
    description: 'Get upcoming crypto events calendar (conferences, hard forks, token unlocks, launches). Use this when the user asks about upcoming events or important dates.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Days to look ahead (1-90)',
          default: 30,
        },
        category: {
          type: 'string',
          description: 'Event category: conference, hardfork, unlock, launch, all',
          default: 'all',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_ai_sentiment',
    description: 'Get AI-powered sentiment analysis for a specific cryptocurrency. Returns sentiment score, confidence, and key factors. Use this for deep sentiment analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        asset: {
          type: 'string',
          description: 'Asset symbol (BTC, ETH, SOL, etc.)',
        },
      },
      required: ['asset'],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_ai_summary',
    description: 'Get an AI-generated summary of recent news for a topic or cryptocurrency. Use this when the user wants a quick summary of what is happening.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Topic or coin to summarize (e.g., "bitcoin", "defi", "regulation")',
        },
        hours: {
          type: 'number',
          description: 'Hours of news to summarize (1-72)',
          default: 24,
        },
      },
      required: ['topic'],
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_alerts',
    description: 'Get active price and news alerts. Shows configured alert thresholds and recent triggers. Use this to check alert status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_rss_feeds',
    description: 'Get available RSS feed URLs for different news categories. Use this when the user wants to subscribe to feeds.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Feed category: all, bitcoin, ethereum, defi, nft, regulation',
          default: 'all',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_ethereum_news',
    description: 'Get Ethereum-specific news (ETH, L2s, EIPs, staking, dApps). Use this when the user specifically asks about Ethereum or ETH.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-30)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_altcoin_news',
    description: 'Get altcoin news (non-BTC/ETH cryptocurrencies). Use this when the user asks about altcoins in general.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum articles (1-30)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let url;
    switch (name) {
      case 'get_crypto_news':
        url = `${API_BASE}/api/news?limit=${args?.limit || 10}${args?.source ? `&source=${args.source}` : ''}`;
        break;
      case 'search_crypto_news':
        url = `${API_BASE}/api/search?q=${encodeURIComponent(args?.keywords || '')}&limit=${args?.limit || 10}`;
        break;
      case 'get_defi_news':
        url = `${API_BASE}/api/defi?limit=${args?.limit || 10}`;
        break;
      case 'get_bitcoin_news':
        url = `${API_BASE}/api/bitcoin?limit=${args?.limit || 10}`;
        break;
      case 'get_breaking_news':
        url = `${API_BASE}/api/breaking?limit=${args?.limit || 5}`;
        break;
      case 'get_news_sources':
        url = `${API_BASE}/api/sources`;
        break;
      case 'get_api_health':
        url = `${API_BASE}/api/health`;
        break;
      case 'get_trending_topics':
        url = `${API_BASE}/api/trending?limit=${args?.limit || 10}&hours=${args?.hours || 24}`;
        break;
      case 'get_crypto_stats':
        url = `${API_BASE}/api/stats`;
        break;
      case 'analyze_news':
        url = `${API_BASE}/api/analyze?limit=${args?.limit || 10}${args?.topic ? `&topic=${encodeURIComponent(args.topic)}` : ''}${args?.sentiment ? `&sentiment=${args.sentiment}` : ''}`;
        break;
      case 'get_archive':
        url = `${API_BASE}/api/archive?limit=${args?.limit || 20}${args?.start_date ? `&start_date=${args.start_date}` : ''}${args?.end_date ? `&end_date=${args.end_date}` : ''}${args?.source ? `&source=${encodeURIComponent(args.source)}` : ''}${args?.search ? `&q=${encodeURIComponent(args.search)}` : ''}`;
        break;
      case 'get_archive_stats':
        url = `${API_BASE}/api/archive?stats=true`;
        break;
      case 'find_original_sources':
        url = `${API_BASE}/api/origins?limit=${args?.limit || 10}${args?.search ? `&q=${encodeURIComponent(args.search)}` : ''}${args?.source_type ? `&source_type=${args.source_type}` : ''}`;
        break;
      case 'get_portfolio_news':
        url = `${API_BASE}/api/portfolio?coins=${encodeURIComponent(args?.coins || '')}&limit=${args?.limit || 10}&prices=${args?.prices !== false}`;
        break;
      case 'get_market_data':
        url = `${API_BASE}/api/market/prices?coins=${encodeURIComponent(args?.coins || 'bitcoin,ethereum,solana')}&vs_currency=${args?.vs_currency || 'usd'}`;
        break;
      case 'get_fear_greed_index':
        url = `${API_BASE}/api/market/fear-greed?days=${args?.days || 7}`;
        break;
      case 'get_gas_prices':
        url = `${API_BASE}/api/gas`;
        break;
      case 'get_regulatory_news':
        url = `${API_BASE}/api/regulatory?limit=${args?.limit || 10}${args?.region ? `&region=${args.region}` : ''}`;
        break;
      case 'get_whale_alerts':
        url = `${API_BASE}/api/whales?limit=${args?.limit || 10}&min_usd=${args?.min_usd || 1000000}${args?.coin ? `&coin=${args.coin}` : ''}`;
        break;
      case 'get_funding_rates':
        url = `${API_BASE}/api/funding?symbol=${args?.symbol || 'BTCUSDT'}`;
        break;
      case 'get_liquidations':
        url = `${API_BASE}/api/liquidations?hours=${args?.hours || 24}`;
        break;
      case 'get_defi_yields':
        url = `${API_BASE}/api/defi/yields?limit=${args?.limit || 10}${args?.chain ? `&chain=${args.chain}` : ''}&min_tvl=${args?.min_tvl || 1000000}`;
        break;
      case 'get_ai_market_brief':
        url = `${API_BASE}/api/ai/brief?focus=${args?.focus || 'general'}`;
        break;
      case 'compare_coins':
        url = `${API_BASE}/api/market/compare?coins=${encodeURIComponent(args?.coins || '')}`;
        break;
      case 'get_exchange_flows':
        url = `${API_BASE}/api/onchain/exchange-flows?coin=${args?.coin || 'btc'}&hours=${args?.hours || 24}`;
        break;
      case 'get_token_unlocks':
        url = `${API_BASE}/api/unlocks?limit=${args?.limit || 10}&days=${args?.days || 30}`;
        break;
      case 'get_social_sentiment':
        url = `${API_BASE}/api/social/sentiment?coin=${args?.coin || 'btc'}&source=${args?.source || 'all'}`;
        break;
      case 'get_arbitrage':
        url = `${API_BASE}/api/trading/arbitrage?symbol=${args?.symbol || 'BTC'}&limit=${args?.limit || 10}`;
        break;
      case 'get_orderbook':
        url = `${API_BASE}/api/trading/orderbook?symbol=${args?.symbol || 'BTCUSDT'}&exchange=${args?.exchange || 'binance'}&depth=${args?.depth || 20}`;
        break;
      case 'get_nft_news':
        url = `${API_BASE}/api/nft?limit=${args?.limit || 10}`;
        break;
      case 'get_stablecoin_data':
        url = `${API_BASE}/api/stablecoins?limit=${args?.limit || 10}`;
        break;
      case 'get_options_data':
        url = `${API_BASE}/api/options?coin=${args?.coin || 'btc'}`;
        break;
      case 'get_events_calendar':
        url = `${API_BASE}/api/events?days=${args?.days || 30}&category=${args?.category || 'all'}`;
        break;
      case 'get_ai_sentiment':
        url = `${API_BASE}/api/ai/sentiment?asset=${encodeURIComponent(args?.asset || 'BTC')}`;
        break;
      case 'get_ai_summary':
        url = `${API_BASE}/api/ai/summary?topic=${encodeURIComponent(args?.topic || 'crypto')}&hours=${args?.hours || 24}`;
        break;
      case 'get_alerts':
        url = `${API_BASE}/api/alerts`;
        break;
      case 'get_rss_feeds':
        url = `${API_BASE}/api/feeds/${args?.category || 'all'}`;
        break;
      case 'get_ethereum_news':
        url = `${API_BASE}/api/ethereum?limit=${args?.limit || 10}`;
        break;
      case 'get_altcoin_news':
        url = `${API_BASE}/api/altcoin?limit=${args?.limit || 10}`;
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const response = await fetch(url);
    const data = await response.json();

    // Handle sources endpoint differently
    if (name === 'get_news_sources') {
      const sources = data.sources || [];
      const formatted = sources.map((s) => 
        `• **${s.name}** (${s.id})\n  ${s.description}\n  🔗 ${s.url}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `Available News Sources (${sources.length}):\n\n${formatted}`,
          },
        ],
      };
    }

    // Handle health endpoint
    if (name === 'get_api_health') {
      const sources = data.sources || [];
      const formatted = sources.map((s) => {
        const icon = s.status === 'healthy' ? '✅' : s.status === 'degraded' ? '⚠️' : '❌';
        return `${icon} **${s.source}**: ${s.status} (${s.responseTime}ms)${s.error ? ` - ${s.error}` : ''}`;
      }).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `API Health Status: **${data.status.toUpperCase()}**\n\n📊 Summary: ${data.summary.healthy} healthy, ${data.summary.degraded} degraded, ${data.summary.down} down\n\n${formatted}`,
          },
        ],
      };
    }

    // Handle trending topics
    if (name === 'get_trending_topics') {
      const trending = data.trending || [];
      const formatted = trending.map((t, i) => {
        const emoji = t.sentiment === 'bullish' ? '🟢' : t.sentiment === 'bearish' ? '🔴' : '⚪';
        return `${i + 1}. ${emoji} **${t.topic}** - ${t.count} mentions (${t.sentiment})`;
      }).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 Trending Topics (${data.timeWindow}):\n\nAnalyzed ${data.articlesAnalyzed} articles\n\n${formatted}`,
          },
        ],
      };
    }

    // Handle stats
    if (name === 'get_crypto_stats') {
      const bySource = data.bySource || [];
      const sourceList = bySource.map(s => `• **${s.source}**: ${s.articleCount} articles (${s.percentage}%)`).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📈 Crypto News Stats (24h)\n\n**Summary:**\n• Total Articles: ${data.summary.totalArticles}\n• Active Sources: ${data.summary.activeSources}/${data.summary.totalSources}\n• Avg/Hour: ${data.summary.avgArticlesPerHour}\n\n**By Source:**\n${sourceList}`,
          },
        ],
      };
    }

    // Handle analyze endpoint
    if (name === 'analyze_news') {
      const articles = data.articles || [];
      const analysis = data.analysis || {};
      
      const formatted = articles.slice(0, 10).map((a, i) => {
        const sentimentEmoji = a.sentiment === 'bullish' ? '🟢' : a.sentiment === 'bearish' ? '🔴' : '⚪';
        return `${i + 1}. ${sentimentEmoji} **${a.title}**\n   Topics: ${a.topics.join(', ')}\n   📰 ${a.source} • ${a.timeAgo}`;
      }).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📊 News Analysis\n\n**Overall Sentiment:** ${analysis.overallSentiment}\n**Breakdown:** 🟢 ${analysis.sentimentBreakdown?.bullish || 0} bullish, 🔴 ${analysis.sentimentBreakdown?.bearish || 0} bearish, ⚪ ${analysis.sentimentBreakdown?.neutral || 0} neutral\n\n**Articles:**\n\n${formatted}`,
          },
        ],
      };
    }

    // Handle archive stats
    if (name === 'get_archive_stats') {
      const stats = data.stats || {};
      return {
        content: [
          {
            type: 'text',
            text: `📚 Archive Statistics\n\n• Total Articles: ${stats.totalArticles || 0}\n• Days Archived: ${stats.daysArchived || 0}\n• Average/Day: ${stats.averagePerDay || 0}\n• Date Range: ${stats.dateRange?.earliest || 'N/A'} to ${stats.dateRange?.latest || 'N/A'}`,
          },
        ],
      };
    }

    // Handle archive query
    if (name === 'get_archive') {
      const articles = data.articles || [];
      const formatted = articles.slice(0, 20).map((a, i) => 
        `${i + 1}. **${a.title}**\n   📰 ${a.source} • ${new Date(a.pubDate).toLocaleDateString()}`
      ).join('\n\n');
      
      return {
        content: [
          {
            type: 'text',
            text: `📚 Archive Results (${data.count}/${data.total} shown)\n\n${formatted || 'No articles found'}${data.pagination?.hasMore ? '\n\n...more results available' : ''}`,
          },
        ],
      };
    }

    // Handle original sources
    if (name === 'find_original_sources') {
      const summary = data.summary || {};
      const topSources = data.topOriginalSources || [];
      const articles = data.articles || [];
      
      let text = `🔍 **Original Source Analysis**\n\n`;
      text += `**Summary:** ${summary.percentageTracked || 0}% of articles have traceable origins\n`;
      text += `• With origins: ${summary.withOriginsFound || 0}\n`;
      text += `• Untracked: ${summary.withoutOriginsFound || 0}\n\n`;
      
      if (topSources.length > 0) {
        text += `**Top Original Sources:**\n`;
        topSources.forEach((s, i) => {
          const emoji = s.type === 'official' ? '🏢' : s.type === 'government' ? '🏛️' : s.type === 'social' ? '📱' : '📄';
          text += `${i + 1}. ${emoji} ${s.name} (${s.count} articles) - ${s.type}\n`;
        });
        text += '\n';
      }
      
      if (articles.length > 0) {
        text += `**Sample Tracked Articles:**\n\n`;
        articles.slice(0, 5).forEach((a, i) => {
          text += `${i + 1}. **${a.title}**\n`;
          text += `   Aggregator: ${a.aggregatorSource}\n`;
          text += `   Original: ${a.originalSources.map(s => s.name).join(', ')}\n\n`;
        });
      }
      
      return {
        content: [{ type: 'text', text }],
      };
    }

    // Handle portfolio news
    if (name === 'get_portfolio_news') {
      const portfolio = data.portfolio || [];
      const summary = data.summary || {};
      const market = summary.market || {};
      
      let text = `💼 **Portfolio News**\n\n`;
      text += `Tracking: ${summary.coinsResolved?.join(', ').toUpperCase() || 'N/A'}\n`;
      text += `Total news found: ${summary.totalNewsCount || 0}\n`;
      
      if (market.average24hChange !== undefined) {
        const changeEmoji = market.average24hChange >= 0 ? '📈' : '📉';
        text += `${changeEmoji} Avg 24h change: ${market.average24hChange > 0 ? '+' : ''}${market.average24hChange}%\n`;
      }
      text += '\n';
      
      for (const coin of portfolio) {
        const priceStr = coin.price?.usd 
          ? `$${coin.price.usd.toLocaleString()}` 
          : 'N/A';
        const changeStr = coin.price?.usd_24h_change !== undefined
          ? ` (${coin.price.usd_24h_change > 0 ? '+' : ''}${coin.price.usd_24h_change.toFixed(2)}%)`
          : '';
        
        text += `### ${coin.symbol.toUpperCase()} - ${coin.name}\n`;
        text += `💰 Price: ${priceStr}${changeStr}\n`;
        text += `📰 News: ${coin.newsCount} articles\n`;
        
        if (coin.articles.length > 0) {
          coin.articles.slice(0, 3).forEach((a, i) => {
            text += `   ${i + 1}. ${a.title} (${a.timeAgo})\n`;
          });
        }
        text += '\n';
      }
      
      return {
        content: [{ type: 'text', text }],
      };
    }

    // Handle market data
    if (name === 'get_market_data') {
      const prices = data.prices || data.data || [];
      let text = `💰 **Market Data**\n\n`;
      
      if (Array.isArray(prices)) {
        prices.forEach(coin => {
          const change = coin.price_change_percentage_24h || coin.change24h || 0;
          const emoji = change >= 0 ? '🟢' : '🔴';
          text += `**${coin.name || coin.symbol}** (${(coin.symbol || '').toUpperCase()})\n`;
          text += `   ${emoji} $${(coin.current_price || coin.price || 0).toLocaleString()}`;
          text += ` (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)\n`;
          text += `   📊 MCap: $${((coin.market_cap || 0) / 1e9).toFixed(2)}B\n\n`;
        });
      } else {
        text += 'No market data available';
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle fear & greed
    if (name === 'get_fear_greed_index') {
      const current = data.current || data.data?.[0] || {};
      const history = data.history || data.data || [];
      
      const value = current.value || current.fgi || 0;
      const classification = current.classification || current.label || 'Unknown';
      
      let emoji = '😐';
      if (value <= 25) emoji = '😱';
      else if (value <= 45) emoji = '😰';
      else if (value >= 75) emoji = '🤑';
      else if (value >= 55) emoji = '😊';
      
      let text = `${emoji} **Fear & Greed Index: ${value}/100**\n\n`;
      text += `Classification: **${classification}**\n\n`;
      
      if (history.length > 1) {
        text += `**Recent History:**\n`;
        history.slice(0, 7).forEach(d => {
          const v = d.value || d.fgi || 0;
          text += `• ${d.timestamp || d.date}: ${v} (${d.classification || d.label})\n`;
        });
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle gas prices
    if (name === 'get_gas_prices') {
      const gas = data.gas || data;
      let text = `⛽ **Ethereum Gas Prices**\n\n`;
      text += `🐢 Slow: ${gas.slow || gas.safeLow || 'N/A'} Gwei\n`;
      text += `🚗 Standard: ${gas.standard || gas.average || 'N/A'} Gwei\n`;
      text += `🚀 Fast: ${gas.fast || 'N/A'} Gwei\n`;
      if (gas.instant || gas.rapid) text += `⚡ Instant: ${gas.instant || gas.rapid} Gwei\n`;
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle regulatory news
    if (name === 'get_regulatory_news') {
      const articles = data.articles || [];
      let text = `⚖️ **Regulatory News**\n\n`;
      
      articles.slice(0, 10).forEach((a, i) => {
        text += `${i + 1}. **${a.title}**\n`;
        text += `   📰 ${a.source} • ${a.timeAgo || new Date(a.pubDate).toLocaleDateString()}\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle whale alerts
    if (name === 'get_whale_alerts') {
      const alerts = data.alerts || data.transactions || [];
      let text = `🐋 **Whale Alerts**\n\n`;
      
      alerts.slice(0, 10).forEach((tx, i) => {
        const amount = tx.amount_usd || tx.usd_value || 0;
        text += `${i + 1}. **$${(amount / 1e6).toFixed(2)}M** ${(tx.symbol || tx.coin || '').toUpperCase()}\n`;
        text += `   ${tx.from_owner_type || tx.from || 'Unknown'} → ${tx.to_owner_type || tx.to || 'Unknown'}\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle funding rates
    if (name === 'get_funding_rates') {
      const rates = data.rates || data.data || [];
      let text = `📊 **Funding Rates** (${args?.symbol || 'BTCUSDT'})\n\n`;
      
      if (Array.isArray(rates)) {
        rates.slice(0, 5).forEach(r => {
          const rate = (r.rate || r.fundingRate || 0) * 100;
          const emoji = rate > 0 ? '🟢' : rate < 0 ? '🔴' : '⚪';
          text += `${emoji} **${r.exchange}**: ${rate.toFixed(4)}%\n`;
        });
      } else if (data.rate !== undefined) {
        const rate = data.rate * 100;
        text += `Rate: ${rate.toFixed(4)}%\n`;
      }
      
      text += `\n_Positive = longs pay shorts (bullish positioning)_`;
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle liquidations
    if (name === 'get_liquidations') {
      const stats = data.stats || data;
      let text = `💥 **Liquidations (${args?.hours || 24}h)**\n\n`;
      
      text += `Total: **$${((stats.total || stats.totalUsd || 0) / 1e6).toFixed(2)}M**\n`;
      text += `🟢 Longs: $${((stats.longs || stats.longUsd || 0) / 1e6).toFixed(2)}M\n`;
      text += `🔴 Shorts: $${((stats.shorts || stats.shortUsd || 0) / 1e6).toFixed(2)}M\n`;
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle DeFi yields
    if (name === 'get_defi_yields') {
      const pools = data.pools || data.data || [];
      let text = `🌾 **Top DeFi Yields**\n\n`;
      
      pools.slice(0, 10).forEach((p, i) => {
        const apy = p.apy || p.apyBase || 0;
        text += `${i + 1}. **${p.project || p.protocol}** - ${p.symbol || p.pool}\n`;
        text += `   APY: **${apy.toFixed(2)}%** | TVL: $${((p.tvlUsd || p.tvl || 0) / 1e6).toFixed(2)}M\n`;
        text += `   Chain: ${p.chain}\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle AI market brief
    if (name === 'get_ai_market_brief') {
      const brief = data.brief || data.summary || data.content || 'No brief available';
      let text = `🤖 **AI Market Brief**\n\n${brief}`;
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle coin comparison
    if (name === 'compare_coins') {
      const coins = data.coins || data.comparison || [];
      let text = `⚖️ **Coin Comparison**\n\n`;
      
      coins.forEach(coin => {
        const change = coin.change24h || coin.price_change_percentage_24h || 0;
        const emoji = change >= 0 ? '🟢' : '🔴';
        text += `### ${coin.name} (${(coin.symbol || '').toUpperCase()})\n`;
        text += `💰 Price: $${(coin.price || coin.current_price || 0).toLocaleString()}\n`;
        text += `${emoji} 24h: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%\n`;
        text += `📊 MCap: $${((coin.marketCap || coin.market_cap || 0) / 1e9).toFixed(2)}B\n`;
        text += `📈 Volume: $${((coin.volume || coin.total_volume || 0) / 1e9).toFixed(2)}B\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle exchange flows
    if (name === 'get_exchange_flows') {
      const flows = data.flows || data;
      let text = `🏦 **Exchange Flows** (${(args?.coin || 'BTC').toUpperCase()})\n\n`;
      
      const inflow = flows.inflow || flows.netInflow || 0;
      const outflow = flows.outflow || flows.netOutflow || 0;
      const net = inflow - outflow;
      
      text += `📥 Inflow: $${(Math.abs(inflow) / 1e6).toFixed(2)}M\n`;
      text += `📤 Outflow: $${(Math.abs(outflow) / 1e6).toFixed(2)}M\n`;
      text += `${net > 0 ? '⚠️' : '✅'} Net: ${net > 0 ? '+' : ''}$${(net / 1e6).toFixed(2)}M\n\n`;
      text += `_Positive net = more coins moving to exchanges (potential sell pressure)_`;
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle token unlocks
    if (name === 'get_token_unlocks') {
      const unlocks = data.unlocks || data.data || [];
      let text = `🔓 **Upcoming Token Unlocks**\n\n`;
      
      unlocks.slice(0, 10).forEach((u, i) => {
        text += `${i + 1}. **${u.name || u.symbol}** - ${u.date || u.unlockDate}\n`;
        text += `   Amount: $${((u.valueUsd || u.value || 0) / 1e6).toFixed(2)}M\n`;
        text += `   % of Supply: ${(u.percentOfSupply || u.percent || 0).toFixed(2)}%\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle social sentiment
    if (name === 'get_social_sentiment') {
      const sentiment = data.sentiment || data;
      let text = `📱 **Social Sentiment** (${(args?.coin || 'BTC').toUpperCase()})\n\n`;
      
      const score = sentiment.score || sentiment.overallScore || 50;
      let emoji = '😐';
      if (score >= 70) emoji = '🟢';
      else if (score >= 55) emoji = '😊';
      else if (score <= 30) emoji = '🔴';
      else if (score <= 45) emoji = '😰';
      
      text += `${emoji} Overall Score: **${score}/100**\n\n`;
      
      if (sentiment.twitter || sentiment.x) {
        text += `𝕏 Twitter: ${sentiment.twitter?.score || sentiment.x?.score || 'N/A'}\n`;
      }
      if (sentiment.reddit) {
        text += `🔴 Reddit: ${sentiment.reddit?.score || 'N/A'}\n`;
      }
      if (sentiment.telegram) {
        text += `📱 Telegram: ${sentiment.telegram?.score || 'N/A'}\n`;
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle arbitrage opportunities
    if (name === 'get_arbitrage') {
      const opportunities = data.opportunities || data.data || [];
      let text = `💱 **Arbitrage Opportunities**\n\n`;
      
      if (opportunities.length === 0) {
        text += 'No significant arbitrage opportunities found.';
      } else {
        opportunities.slice(0, 10).forEach((opp, i) => {
          text += `${i + 1}. **${opp.pair || opp.symbol}**: ${opp.spreadPercent?.toFixed(2) || opp.spread}%\n`;
          text += `   Buy @ ${opp.buyExchange} → Sell @ ${opp.sellExchange}\n`;
          text += `   Buy: $${opp.buyPrice?.toLocaleString() || 'N/A'} | Sell: $${opp.sellPrice?.toLocaleString() || 'N/A'}\n\n`;
        });
        text += `⚠️ _Spreads don't account for fees. Verify before trading._`;
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle order book
    if (name === 'get_orderbook') {
      const orderbook = data.orderbook || data;
      let text = `📊 **Order Book** (${args?.symbol || 'BTCUSDT'} @ ${args?.exchange || 'binance'})\n\n`;
      
      const bids = orderbook.bids || [];
      const asks = orderbook.asks || [];
      
      text += `**Top Asks (Sell Orders):**\n`;
      asks.slice(0, 5).reverse().forEach(([price, qty]) => {
        text += `   🔴 $${parseFloat(price).toLocaleString()} - ${parseFloat(qty).toFixed(4)}\n`;
      });
      
      text += `\n**Spread:** $${orderbook.spread?.toFixed(2) || 'N/A'}\n\n`;
      
      text += `**Top Bids (Buy Orders):**\n`;
      bids.slice(0, 5).forEach(([price, qty]) => {
        text += `   🟢 $${parseFloat(price).toLocaleString()} - ${parseFloat(qty).toFixed(4)}\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle NFT news
    if (name === 'get_nft_news') {
      const articles = data.articles || [];
      let text = `🎨 **NFT News**\n\n`;
      
      articles.slice(0, 10).forEach((a, i) => {
        text += `${i + 1}. **${a.title}**\n`;
        text += `   📰 ${a.source} • ${a.timeAgo || new Date(a.pubDate).toLocaleDateString()}\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle stablecoin data
    if (name === 'get_stablecoin_data') {
      const stables = data.stablecoins || data.data || [];
      let text = `💵 **Stablecoin Market Data**\n\n`;
      
      stables.slice(0, 10).forEach((s, i) => {
        const peg = s.pegDeviation !== undefined 
          ? (s.pegDeviation >= 0 ? `+${s.pegDeviation.toFixed(3)}` : s.pegDeviation.toFixed(3))
          : 'N/A';
        text += `${i + 1}. **${s.name || s.symbol}** (${(s.symbol || '').toUpperCase()})\n`;
        text += `   Market Cap: $${((s.marketCap || 0) / 1e9).toFixed(2)}B\n`;
        text += `   Peg: $${s.price?.toFixed(4) || '1.00'} (${peg}%)\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle options data
    if (name === 'get_options_data') {
      const options = data.options || data;
      let text = `📈 **Options Data** (${(args?.coin || 'BTC').toUpperCase()})\n\n`;
      
      text += `**Open Interest:** $${((options.openInterest || 0) / 1e9).toFixed(2)}B\n`;
      text += `**Max Pain:** $${options.maxPain?.toLocaleString() || 'N/A'}\n`;
      text += `**Put/Call Ratio:** ${options.putCallRatio?.toFixed(2) || 'N/A'}\n`;
      text += `**24h Volume:** $${((options.volume24h || 0) / 1e9).toFixed(2)}B\n\n`;
      
      if (options.expirations) {
        text += `**Upcoming Expirations:**\n`;
        options.expirations.slice(0, 5).forEach(e => {
          text += `• ${e.date}: $${((e.notionalValue || 0) / 1e9).toFixed(2)}B\n`;
        });
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle events calendar
    if (name === 'get_events_calendar') {
      const events = data.events || data.data || [];
      let text = `📅 **Crypto Events Calendar**\n\n`;
      
      if (events.length === 0) {
        text += 'No upcoming events found.';
      } else {
        events.slice(0, 15).forEach((e, i) => {
          const emoji = e.category === 'conference' ? '🎤' : 
                        e.category === 'hardfork' ? '🔧' : 
                        e.category === 'unlock' ? '🔓' : 
                        e.category === 'launch' ? '🚀' : '📌';
          text += `${i + 1}. ${emoji} **${e.title || e.name}**\n`;
          text += `   📅 ${e.date} • ${e.category}\n`;
          if (e.description) text += `   ${e.description.slice(0, 100)}...\n`;
          text += '\n';
        });
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle AI sentiment
    if (name === 'get_ai_sentiment') {
      const sentiment = data.sentiment || data;
      let text = `🤖 **AI Sentiment Analysis** (${(args?.asset || 'BTC').toUpperCase()})\n\n`;
      
      const score = sentiment.score || 0;
      const label = sentiment.label || 'neutral';
      const confidence = sentiment.confidence || 0;
      
      let emoji = '😐';
      if (score > 0.5) emoji = '🚀';
      else if (score > 0.2) emoji = '📈';
      else if (score < -0.5) emoji = '📉';
      else if (score < -0.2) emoji = '😰';
      
      text += `${emoji} **Sentiment:** ${label.toUpperCase()}\n`;
      text += `📊 **Score:** ${score.toFixed(2)} (-1 to +1)\n`;
      text += `🎯 **Confidence:** ${(confidence * 100).toFixed(1)}%\n\n`;
      
      if (sentiment.factors) {
        text += `**Key Factors:**\n`;
        sentiment.factors.forEach(f => {
          const fEmoji = f.impact === 'positive' ? '🟢' : f.impact === 'negative' ? '🔴' : '⚪';
          text += `${fEmoji} ${f.factor}: ${f.description}\n`;
        });
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle AI summary
    if (name === 'get_ai_summary') {
      const summary = data.summary || data;
      let text = `📝 **AI News Summary** (${args?.topic || 'crypto'})\n\n`;
      
      text += summary.text || summary.content || 'No summary available.';
      
      if (summary.keyPoints) {
        text += `\n\n**Key Points:**\n`;
        summary.keyPoints.forEach((p, i) => {
          text += `${i + 1}. ${p}\n`;
        });
      }
      
      if (summary.sources) {
        text += `\n\n_Based on ${summary.sources.length} sources_`;
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle alerts
    if (name === 'get_alerts') {
      const alerts = data.alerts || data.data || [];
      let text = `🔔 **Active Alerts**\n\n`;
      
      if (alerts.length === 0) {
        text += 'No active alerts configured.';
      } else {
        alerts.forEach((a, i) => {
          const emoji = a.type === 'price' ? '💰' : a.type === 'news' ? '📰' : '🔔';
          text += `${i + 1}. ${emoji} **${a.name || a.asset}**\n`;
          text += `   Type: ${a.type} | Condition: ${a.condition}\n`;
          if (a.lastTriggered) text += `   Last triggered: ${a.lastTriggered}\n`;
          text += '\n';
        });
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle RSS feeds
    if (name === 'get_rss_feeds') {
      const feeds = data.feeds || data;
      let text = `📡 **RSS Feeds**\n\n`;
      
      if (Array.isArray(feeds)) {
        feeds.forEach(f => {
          text += `• **${f.name || f.category}**\n`;
          text += `  ${f.url}\n\n`;
        });
      } else {
        text += `**All News:** ${API_BASE}/api/feeds/all\n`;
        text += `**Bitcoin:** ${API_BASE}/api/feeds/bitcoin\n`;
        text += `**Ethereum:** ${API_BASE}/api/feeds/ethereum\n`;
        text += `**DeFi:** ${API_BASE}/api/feeds/defi\n`;
        text += `**NFT:** ${API_BASE}/api/feeds/nft\n`;
        text += `**Regulation:** ${API_BASE}/api/feeds/regulation\n`;
      }
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle ethereum news
    if (name === 'get_ethereum_news') {
      const articles = data.articles || [];
      let text = `💎 **Ethereum News**\n\n`;
      
      articles.slice(0, 10).forEach((a, i) => {
        text += `${i + 1}. **${a.title}**\n`;
        text += `   📰 ${a.source} • ${a.timeAgo || new Date(a.pubDate).toLocaleDateString()}\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Handle altcoin news
    if (name === 'get_altcoin_news') {
      const articles = data.articles || [];
      let text = `🪙 **Altcoin News**\n\n`;
      
      articles.slice(0, 10).forEach((a, i) => {
        text += `${i + 1}. **${a.title}**\n`;
        text += `   📰 ${a.source} • ${a.timeAgo || new Date(a.pubDate).toLocaleDateString()}\n\n`;
      });
      
      return { content: [{ type: 'text', text }] };
    }

    // Format articles nicely for Claude
    const articles = data.articles || [];
    const formatted = articles.map((a, i) => 
      `${i + 1}. **${a.title}**\n   🔗 ${a.link}\n   📰 ${a.source} • ${a.timeAgo}`
    ).join('\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `Found ${data.totalCount} articles from ${data.sources?.join(', ') || 'various sources'}:\n\n${formatted}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Free Crypto News MCP server running');
}

main().catch(console.error);
