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

const API_BASE = process.env.API_BASE || 'https://free-crypto-news.vercel.app';
const PORT = parseInt(process.env.PORT) || 3001;

// All tools with readOnlyHint annotations for ChatGPT
const tools = [
  {
    name: 'get_crypto_news',
    description: 'Get latest crypto news from 7 major sources (CoinDesk, The Block, Decrypt, CoinTelegraph, Bitcoin Magazine, Blockworks, The Defiant). Use this when the user wants general crypto news or headlines.',
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
