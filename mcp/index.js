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

const API_BASE = process.env.API_BASE || 'https://free-crypto-news.vercel.app';
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
