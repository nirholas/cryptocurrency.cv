#!/usr/bin/env node
/**
 * Free Crypto News MCP Server - HTTP/SSE Transport
 * 
 * Use with ChatGPT Developer Mode or any MCP client supporting HTTP/SSE.
 * 100% FREE - no API keys required!
 * 
 * Supports:
 * - Server-Sent Events (SSE) transport
 * - Streaming HTTP transport
 * - ChatGPT Developer Mode compatibility
 */

import http from 'http';
import { URL } from 'url';

const API_BASE = process.env.API_BASE || 'https://cryptocurrency.cv';
const PORT = parseInt(process.env.PORT) || 3001;

// All tools with readOnlyHint annotations for ChatGPT
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
    name: 'get_news_sources',
    description: 'Get list of all available crypto news sources with their details. Use this when the user asks what sources are available or wants to know where news comes from.',
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
    description: 'Check the health status of the API and all RSS feed sources. Use this for debugging or when the user asks about API status.',
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
    description: 'Get trending crypto topics with sentiment analysis (bullish/bearish/neutral). Use this when the user asks about trends, what\'s hot, or market sentiment.',
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
    description: 'Get analytics: articles per source, hourly distribution, category breakdown. Use this when the user asks about statistics or wants an overview of news coverage.',
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
    description: 'Get news with topic classification and sentiment analysis. Filter by topic or sentiment. Use this when the user wants sentiment analysis or topic-filtered news.',
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
    description: 'Query historical crypto news archive. Search by date range, source, or keywords. Use this when the user asks about past news or wants to search a specific time period.',
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
    description: 'Get statistics about the historical news archive. Use this when the user asks how much historical data is available.',
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
    description: 'Find the original sources of crypto news (who published it first). Identifies if news came from official company announcements, government agencies, social media, or research firms. Use this when the user wants to trace news origins.',
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
    description: 'Get news for specific cryptocurrencies with optional price data from CoinGecko. Supports 40+ coins including BTC, ETH, SOL, ADA, XRP, DOGE, etc. Use this when the user mentions specific coins they hold or want news about.',
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
  // Market Data Tools
  {
    name: 'get_market_data',
    description: 'Get live cryptocurrency prices, market caps, volume, and 24h changes from CoinGecko. Use this when the user asks about prices or market data.',
    inputSchema: {
      type: 'object',
      properties: {
        coins: {
          type: 'string',
          description: 'Comma-separated coin IDs (e.g., "bitcoin,ethereum,solana")',
          default: 'bitcoin,ethereum,solana',
        },
        currency: {
          type: 'string',
          description: 'Fiat currency for prices (usd, eur, gbp, etc.)',
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
    description: 'Get the Crypto Fear & Greed Index. Measures market sentiment from 0 (Extreme Fear) to 100 (Extreme Greed). Use this when the user asks about market sentiment or Fear & Greed.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days of historical data (1-365)',
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
    description: 'Get current Ethereum gas prices (low, medium, high, base fee). Use this when the user asks about ETH gas or transaction fees.',
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
    description: 'Get regulatory and legal news about crypto (SEC, CFTC, government, legislation). Use this when the user asks about regulation, laws, or government actions.',
    inputSchema: {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: 'Filter by region: us, eu, asia, global',
          enum: ['us', 'eu', 'asia', 'global'],
        },
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
    name: 'get_whale_alerts',
    description: 'Get large cryptocurrency transactions (whale movements). Use this when the user asks about whales, large transfers, or institutional moves.',
    inputSchema: {
      type: 'object',
      properties: {
        min_usd: {
          type: 'number',
          description: 'Minimum transaction value in USD',
          default: 1000000,
        },
        limit: {
          type: 'number',
          description: 'Maximum alerts (1-50)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_funding_rates',
    description: 'Get perpetual futures funding rates across exchanges. Positive = longs pay shorts. Use this when the user asks about derivatives, funding, or leveraged positions.',
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
    description: 'Get recent liquidation data from crypto exchanges. Use this when the user asks about liquidations, margin calls, or "who got rekt".',
    inputSchema: {
      type: 'object',
      properties: {
        hours: {
          type: 'number',
          description: 'Hours to look back (1-24)',
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
    description: 'Get top DeFi yields from lending, staking, and liquidity protocols. Use this when the user asks about DeFi yields, APY, or earning opportunities.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          description: 'Blockchain to filter by (ethereum, bsc, polygon, arbitrum, solana, avalanche)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (1-50)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_ai_market_brief',
    description: 'Get an AI-generated market brief summarizing key events, sentiment, and what to watch. Use this when the user wants a quick market overview or summary.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'compare_coins',
    description: 'Compare multiple cryptocurrencies side-by-side (price, market cap, volume, 24h change). Use this when the user wants to compare coins.',
    inputSchema: {
      type: 'object',
      properties: {
        coins: {
          type: 'string',
          description: 'Comma-separated coin IDs (e.g., "bitcoin,ethereum,solana")',
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
    description: 'Get exchange inflow/outflow data for major cryptocurrencies. Inflow = selling pressure, Outflow = accumulation. Use this when the user asks about exchange flows or accumulation.',
    inputSchema: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          description: 'Coin to check (bitcoin, ethereum)',
          default: 'bitcoin',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_token_unlocks',
    description: 'Get upcoming token unlock schedules. Large unlocks can create selling pressure. Use this when the user asks about token unlocks, vesting, or potential sell pressure.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum results (1-50)',
          default: 10,
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  {
    name: 'get_social_sentiment',
    description: 'Get social media sentiment analysis for cryptocurrencies (Twitter, Reddit mentions and sentiment). Use this when the user asks about social sentiment or community buzz.',
    inputSchema: {
      type: 'object',
      properties: {
        coin: {
          type: 'string',
          description: 'Coin to analyze (bitcoin, ethereum, solana, etc.)',
          default: 'bitcoin',
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
  },
];

// Build API URL from tool name and arguments
function buildUrl(name, args = {}) {
  switch (name) {
    case 'get_crypto_news':
      return `${API_BASE}/api/news?limit=${args.limit || 10}${args.source ? `&source=${args.source}` : ''}`;
    case 'search_crypto_news':
      return `${API_BASE}/api/search?q=${encodeURIComponent(args.keywords || '')}&limit=${args.limit || 10}`;
    case 'get_defi_news':
      return `${API_BASE}/api/defi?limit=${args.limit || 10}`;
    case 'get_bitcoin_news':
      return `${API_BASE}/api/bitcoin?limit=${args.limit || 10}`;
    case 'get_breaking_news':
      return `${API_BASE}/api/breaking?limit=${args.limit || 5}`;
    case 'get_news_sources':
      return `${API_BASE}/api/sources`;
    case 'get_api_health':
      return `${API_BASE}/api/health`;
    case 'get_trending_topics':
      return `${API_BASE}/api/trending?limit=${args.limit || 10}&hours=${args.hours || 24}`;
    case 'get_crypto_stats':
      return `${API_BASE}/api/stats`;
    case 'analyze_news':
      return `${API_BASE}/api/analyze?limit=${args.limit || 10}${args.topic ? `&topic=${encodeURIComponent(args.topic)}` : ''}${args.sentiment ? `&sentiment=${args.sentiment}` : ''}`;
    case 'get_archive':
      return `${API_BASE}/api/archive?limit=${args.limit || 20}${args.start_date ? `&start_date=${args.start_date}` : ''}${args.end_date ? `&end_date=${args.end_date}` : ''}${args.source ? `&source=${encodeURIComponent(args.source)}` : ''}${args.search ? `&q=${encodeURIComponent(args.search)}` : ''}`;
    case 'get_archive_stats':
      return `${API_BASE}/api/archive?stats=true`;
    case 'find_original_sources':
      return `${API_BASE}/api/origins?limit=${args.limit || 10}${args.search ? `&q=${encodeURIComponent(args.search)}` : ''}${args.source_type ? `&source_type=${args.source_type}` : ''}`;
    case 'get_portfolio_news':
      return `${API_BASE}/api/portfolio?coins=${encodeURIComponent(args.coins || '')}&limit=${args.limit || 10}&prices=${args.prices !== false}`;
    case 'get_market_data':
      return `${API_BASE}/api/market?coins=${encodeURIComponent(args.coins || 'bitcoin,ethereum,solana')}&currency=${args.currency || 'usd'}`;
    case 'get_fear_greed_index':
      return `${API_BASE}/api/fear-greed?days=${args.days || 7}`;
    case 'get_gas_prices':
      return `${API_BASE}/api/gas`;
    case 'get_regulatory_news':
      return `${API_BASE}/api/regulatory?limit=${args.limit || 10}${args.region ? `&region=${args.region}` : ''}`;
    case 'get_whale_alerts':
      return `${API_BASE}/api/whales?limit=${args.limit || 10}&min_usd=${args.min_usd || 1000000}`;
    case 'get_funding_rates':
      return `${API_BASE}/api/funding?symbol=${args.symbol || 'BTCUSDT'}`;
    case 'get_liquidations':
      return `${API_BASE}/api/liquidations?hours=${args.hours || 24}`;
    case 'get_defi_yields':
      return `${API_BASE}/api/yields?limit=${args.limit || 10}${args.chain ? `&chain=${args.chain}` : ''}`;
    case 'get_ai_market_brief':
      return `${API_BASE}/api/ai/brief`;
    case 'compare_coins':
      return `${API_BASE}/api/compare?coins=${encodeURIComponent(args.coins || '')}`;
    case 'get_exchange_flows':
      return `${API_BASE}/api/flows?coin=${args.coin || 'bitcoin'}`;
    case 'get_token_unlocks':
      return `${API_BASE}/api/unlocks?limit=${args.limit || 10}`;
    case 'get_social_sentiment':
      return `${API_BASE}/api/social?coin=${args.coin || 'bitcoin'}`;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Format response based on tool type
function formatResponse(name, data) {
  // Handle sources endpoint
  if (name === 'get_news_sources') {
    const sources = data.sources || [];
    return {
      sources: sources.map(s => ({
        name: s.name,
        id: s.id,
        description: s.description,
        url: s.url,
      })),
      count: sources.length,
    };
  }

  // Handle health endpoint
  if (name === 'get_api_health') {
    return {
      status: data.status,
      summary: data.summary,
      sources: data.sources,
    };
  }

  // Handle trending topics
  if (name === 'get_trending_topics') {
    return {
      timeWindow: data.timeWindow,
      articlesAnalyzed: data.articlesAnalyzed,
      trending: data.trending,
    };
  }

  // Handle stats
  if (name === 'get_crypto_stats') {
    return {
      summary: data.summary,
      bySource: data.bySource,
      hourlyDistribution: data.hourlyDistribution,
    };
  }

  // Handle analyze endpoint
  if (name === 'analyze_news') {
    return {
      analysis: data.analysis,
      articles: data.articles,
    };
  }

  // Handle archive stats
  if (name === 'get_archive_stats') {
    return {
      stats: data.stats,
    };
  }

  // Handle archive query
  if (name === 'get_archive') {
    return {
      count: data.count,
      total: data.total,
      articles: data.articles,
      pagination: data.pagination,
    };
  }

  // Handle original sources
  if (name === 'find_original_sources') {
    return {
      summary: data.summary,
      topOriginalSources: data.topOriginalSources,
      articles: data.articles,
    };
  }

  // Handle portfolio news
  if (name === 'get_portfolio_news') {
    return {
      summary: data.summary,
      portfolio: data.portfolio,
    };
  }

  // Handle market data
  if (name === 'get_market_data') {
    return {
      currency: data.currency || 'usd',
      coins: data.coins || data,
    };
  }

  // Handle fear & greed
  if (name === 'get_fear_greed_index') {
    return {
      current: data.current || data,
      history: data.history,
    };
  }

  // Handle gas prices
  if (name === 'get_gas_prices') {
    return {
      network: 'ethereum',
      prices: data,
    };
  }

  // Handle regulatory news
  if (name === 'get_regulatory_news') {
    return {
      region: data.region || 'global',
      articles: data.articles || data,
    };
  }

  // Handle whale alerts
  if (name === 'get_whale_alerts') {
    return {
      alerts: data.alerts || data,
      summary: data.summary,
    };
  }

  // Handle funding rates
  if (name === 'get_funding_rates') {
    return {
      symbol: data.symbol,
      rates: data.rates || data,
    };
  }

  // Handle liquidations
  if (name === 'get_liquidations') {
    return {
      timeframe: data.timeframe,
      total: data.total,
      liquidations: data.liquidations || data,
    };
  }

  // Handle DeFi yields
  if (name === 'get_defi_yields') {
    return {
      chain: data.chain || 'all',
      yields: data.yields || data,
    };
  }

  // Handle AI market brief
  if (name === 'get_ai_market_brief') {
    return {
      brief: data.brief || data,
      generatedAt: data.generatedAt,
    };
  }

  // Handle coin comparison
  if (name === 'compare_coins') {
    return {
      comparison: data.comparison || data,
    };
  }

  // Handle exchange flows
  if (name === 'get_exchange_flows') {
    return {
      coin: data.coin,
      flows: data.flows || data,
    };
  }

  // Handle token unlocks
  if (name === 'get_token_unlocks') {
    return {
      upcoming: data.unlocks || data,
    };
  }

  // Handle social sentiment
  if (name === 'get_social_sentiment') {
    return {
      coin: data.coin,
      sentiment: data.sentiment || data,
    };
  }

  // Default: return articles
  return {
    totalCount: data.totalCount,
    sources: data.sources,
    articles: data.articles,
  };
}

// Execute a tool
async function executeTool(name, args) {
  const url = buildUrl(name, args);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return formatResponse(name, data);
}

// SSE connection manager
const sseConnections = new Map();
let connectionId = 0;

// Parse JSON body from request
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Send SSE message
function sendSSE(res, data, event = 'message') {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // Health check
    if (path === '/health' || path === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        name: 'free-crypto-news-mcp',
        version: '1.0.0',
        transport: 'http-sse',
      }));
      return;
    }

    // SSE endpoint for MCP connection
    if (path === '/sse' && req.method === 'GET') {
      const id = ++connectionId;
      
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Send endpoint URL for the client to POST messages to
      sendSSE(res, { endpoint: `/message?sessionId=${id}` }, 'endpoint');

      sseConnections.set(id, res);

      req.on('close', () => {
        sseConnections.delete(id);
      });

      // Keep connection alive
      const keepAlive = setInterval(() => {
        if (sseConnections.has(id)) {
          res.write(':ping\n\n');
        } else {
          clearInterval(keepAlive);
        }
      }, 30000);

      return;
    }

    // Message endpoint for MCP requests
    if (path === '/message' && req.method === 'POST') {
      const sessionId = parseInt(url.searchParams.get('sessionId'));
      const sseRes = sseConnections.get(sessionId);
      
      const body = await parseBody(req);
      const { method, id, params } = body;

      let result;

      switch (method) {
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'free-crypto-news',
              version: '1.0.0',
            },
          };
          break;

        case 'tools/list':
          result = { tools };
          break;

        case 'tools/call':
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};
          
          try {
            const toolResult = await executeTool(toolName, toolArgs);
            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2),
                },
              ],
            };
          } catch (error) {
            result = {
              content: [
                {
                  type: 'text',
                  text: `Error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
          break;

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      const response = {
        jsonrpc: '2.0',
        id,
        result,
      };

      // Send response via SSE if connected
      if (sseRes) {
        sendSSE(sseRes, response);
      }

      // Also respond to the POST request
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    // Streamable HTTP endpoint (single request/response)
    if (path === '/mcp' && req.method === 'POST') {
      const body = await parseBody(req);
      const { method, id, params } = body;

      let result;

      switch (method) {
        case 'initialize':
          result = {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'free-crypto-news',
              version: '1.0.0',
            },
          };
          break;

        case 'tools/list':
          result = { tools };
          break;

        case 'tools/call':
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};
          
          try {
            const toolResult = await executeTool(toolName, toolArgs);
            result = {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2),
                },
              ],
            };
          } catch (error) {
            result = {
              content: [
                {
                  type: 'text',
                  text: `Error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
          break;

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id,
        result,
      }));
      return;
    }

    // 404 for unknown paths
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: error.message,
      },
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Free Crypto News MCP Server (HTTP/SSE)`);
  console.log(`   Listening on http://localhost:${PORT}`);
  console.log(`   SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`   HTTP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`\n📖 For ChatGPT Developer Mode, use the /sse endpoint`);
});
