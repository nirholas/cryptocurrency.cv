# MCP Server Integration

The Model Context Protocol (MCP) server allows AI assistants like Claude and ChatGPT to access real-time crypto news.

## Overview

**40 Tools** for comprehensive crypto news access. All tools are marked as **read-only** for ChatGPT compatibility (no confirmation prompts).

MCP enables AI models to:

- Fetch the latest crypto news from 7 major sources
- Search for specific topics with keyword filtering
- Get DeFi and Bitcoin-specific news
- Access trending topics with sentiment analysis
- Monitor breaking news (last 2 hours)
- Query historical news archive
- Find original news sources
- Get portfolio news with CoinGecko price data

## Installation

### Using npx (Recommended)

```bash
npx @anthropic-ai/mcp-server-crypto-news
```

### Local Installation

```bash
cd mcp
npm install
npm start
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-crypto-news"]
    }
  }
}
```

### Custom Configuration

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/path/to/mcp/index.js"],
      "env": {
        "FCN_BASE_URL": "https://cryptocurrency.cv"
      }
    }
  }
}
```

## Available Tools (40 Total)

All tools are marked as **read-only** for ChatGPT Developer Mode compatibility (no confirmation prompts).

### 📰 Core News Tools

| Tool | Description |
|------|-------------|
| `get_crypto_news` | Get latest news from all 130+ sources |
| `search_crypto_news` | Search news by comma-separated keywords |
| `get_defi_news` | DeFi-specific news (yield farming, DEXs, lending, protocols) |
| `get_bitcoin_news` | Bitcoin-specific news (BTC, Lightning Network, miners, ordinals) |
| `get_breaking_news` | Breaking news from the last 2 hours |
| `get_news_sources` | List all available news sources with details |
| `get_api_health` | Check API & feed health status |
| `analyze_news` | News with topic classification and sentiment analysis |
| `get_ethereum_news` | Ethereum-specific news (ETH, L2s, smart contracts) |
| `get_altcoin_news` | Altcoin news (SOL, ADA, DOT, AVAX, etc.) |
| `get_nft_news` | NFT-specific news and market updates |

### 📊 Analytics & Sentiment

| Tool | Description |
|------|-------------|
| `get_trending_topics` | Trending topics with sentiment analysis (bullish/bearish/neutral) |
| `get_crypto_stats` | Analytics: articles per source, hourly distribution, category breakdown |
| `get_ai_sentiment` | AI-powered market sentiment analysis with confidence scores |
| `get_ai_summary` | AI-generated news summaries and key insights |
| `get_market_sentiment` | Real-time market sentiment indicators |
| `get_fear_greed` | Fear & Greed Index data |
| `get_social_sentiment` | Social media sentiment from Twitter/Reddit |

### 📈 Trading & Market Data

| Tool | Description |
|------|-------------|
| `get_prices` | Real-time cryptocurrency prices from CoinGecko |
| `get_markets` | Top 100 markets by market cap |
| `get_ticker` | 24h ticker data (price, volume, change%) |
| `get_orderbook` | Live orderbook data (bids/asks/depth) |
| `get_arbitrage` | Cross-exchange arbitrage opportunities |
| `get_options_data` | Options market data (calls, puts, IV) |
| `get_funding_rates` | Perpetual futures funding rates |
| `get_liquidations` | Recent liquidation events |
| `get_whale_alerts` | Large transaction monitoring |

### 🪙 DeFi & Token Tools

| Tool | Description |
|------|-------------|
| `get_stablecoin_data` | Stablecoin metrics (supply, peg, volume) |
| `get_defi_yields` | DeFi yield farming opportunities |
| `get_gas_prices` | Ethereum gas price tracker |
| `get_tvl_rankings` | DeFi TVL rankings by protocol |

### 📚 Archive & Research

| Tool | Description |
|------|-------------|
| `get_archive` | Query historical news archive by date range, source, or keywords |
| `get_archive_stats` | Statistics about the historical news archive |
| `find_original_sources` | Find where news originated (official, press-release, social, government) |
| `get_events_calendar` | Upcoming crypto events, launches, and conferences |

### 🔔 Alerts & Monitoring

| Tool | Description |
|------|-------------|
| `get_portfolio_news` | News for specific cryptocurrencies with CoinGecko price data |
| `get_alerts` | Custom price and news alerts |
| `get_rss_feeds` | RSS feed URLs for various sources |
| `get_regulatory_news` | Regulatory updates by jurisdiction |

### Tool Parameters

#### get_crypto_news

```
Parameters:
- limit (number, optional): Max articles 1-50 (default: 10)
- source (string, optional): Filter by source (coindesk, theblock, decrypt, cointelegraph, bitcoinmagazine, blockworks, defiant)
```

#### search_crypto_news

```
Parameters:
- keywords (string, required): Comma-separated keywords (e.g., "ethereum,ETF")
- limit (number, optional): Max results 1-30 (default: 10)
```

#### get_trending_topics

```
Parameters:
- limit (number, optional): Max topics 1-20 (default: 10)
- hours (number, optional): Time window 1-72 hours (default: 24)
```

#### analyze_news

```
Parameters:
- limit (number, optional): Max articles 1-50 (default: 10)
- topic (string, optional): Filter by topic (Bitcoin, Ethereum, DeFi, NFTs, Regulation, Exchange)
- sentiment (string, optional): Filter by sentiment (bullish, bearish, neutral)
```

#### get_archive

```
Parameters:
- start_date (string, optional): Start date YYYY-MM-DD
- end_date (string, optional): End date YYYY-MM-DD
- source (string, optional): Filter by source
- search (string, optional): Search query
- limit (number, optional): Max results 1-200 (default: 20)
```

#### find_original_sources

```
Parameters:
- limit (number, optional): Articles to analyze 1-50 (default: 10)
- search (string, optional): Search query
- source_type (string, optional): official, press-release, social, blog, government
```

#### get_portfolio_news

```
Parameters:
- coins (string, required): Comma-separated coins (e.g., "btc,eth,sol")
- limit (number, optional): Max articles per coin 1-50 (default: 10)
- prices (boolean, optional): Include CoinGecko price data (default: true)
```

## Example Prompts

### Claude Desktop

- "Get me the latest crypto news"
- "Search for news about Ethereum ETF"
- "What's happening in DeFi?"
- "Any breaking crypto news?"
- "What are the trending crypto topics?"
- "Analyze recent news for bullish signals"
- "Get news from last week about SEC"
- "Find the original source of this Binance news"
- "Get news for my portfolio: BTC, ETH, SOL with prices"

### ChatGPT Developer Mode

Be explicit about using the app and tool names:

- "Use the Free Crypto News app's `get_crypto_news` tool to show me the latest headlines"
- "Use `search_crypto_news` to find news about 'SEC regulation'"
- "Call `get_trending_topics` to show what's trending in crypto right now"
- "Use `get_portfolio_news` with coins='btc,eth,sol' to get news for my portfolio with prices"

## HTTP Server Mode (ChatGPT Developer Mode)

**Live Server:** `https://plugins.support/sse`

Run locally:

```bash
cd mcp
npm install
npm run start:http  # Starts on port 3001
```

### API Endpoints (HTTP mode)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /sse` | Server-Sent Events endpoint for MCP |
| `POST /message` | Message endpoint (used with SSE) |
| `POST /mcp` | Single request/response endpoint |

### Example Request

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_crypto_news",
    "params": { "limit": 5 }
  }'
```

## ChatGPT Developer Mode Setup

1. Enable Developer Mode in ChatGPT Settings → Apps → Advanced
2. Click "Create app"
3. Configure:
   - **Name:** Free Crypto News
   - **Protocol:** SSE
   - **Endpoint:** `https://plugins.support/sse`
   - **Authentication:** No Authentication
4. Enable the app in a conversation

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP server port |
| `API_BASE` | `https://cryptocurrency.cv` | Backend API URL |

## Troubleshooting

### MCP Server Not Loading in Claude

1. Verify the path in your config is correct
2. Check that Node.js 18+ is installed
3. Run `node /path/to/mcp/index.js` manually to test

### Connection Timeout

Check if the API is accessible:

```bash
curl https://cryptocurrency.cv/api/health
```

### ChatGPT Not Seeing Tools

Ensure the SSE endpoint is reachable and returns proper MCP responses.

## Features

- **100% Free** - No API keys required
- **Dual Transport** - Works with both Claude (stdio) and ChatGPT (HTTP/SSE)
- **40 Tools** - Comprehensive crypto news coverage
- **Read-Only** - All tools marked as safe for ChatGPT (no confirmation prompts)
- **Real-Time** - Breaking news from last 2 hours
- **Sentiment Analysis** - Bullish/bearish/neutral classification
- **Historical Archive** - Query past news by date/source
- **Portfolio Tracking** - Get news for specific coins with prices
- **Original Sources** - Trace where news actually originated

## Source Code

- [mcp/index.js](https://github.com/nirholas/free-crypto-news/blob/main/mcp/index.js) - MCP server (stdio)
- [mcp/http-server.js](https://github.com/nirholas/free-crypto-news/blob/main/mcp/http-server.js) - HTTP/SSE server
- [mcp/README.md](https://github.com/nirholas/free-crypto-news/blob/main/mcp/README.md) - Quick start guide
