# MCP Server Integration

The Model Context Protocol (MCP) server allows AI assistants like Claude and ChatGPT to access real-time crypto news.

## Overview

MCP enables AI models to:

- Fetch the latest crypto news
- Search for specific topics
- Get market data and prices
- Access Fear & Greed Index
- Monitor breaking news

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
        "FCN_BASE_URL": "https://free-crypto-news.vercel.app"
      }
    }
  }
}
```

## Available Tools

### get_crypto_news

Fetch latest crypto news articles.

```
Parameters:
- limit (number, optional): Number of articles (default: 10, max: 50)
- category (string, optional): Filter by category
- source (string, optional): Filter by source
```

Example prompt: *"Get the latest 5 DeFi news articles"*

### search_crypto_news

Search news by keywords.

```
Parameters:
- query (string, required): Search keywords
- limit (number, optional): Number of results (default: 10)
```

Example prompt: *"Search for news about Bitcoin ETF approval"*

### get_market_data

Get current cryptocurrency prices.

```
Parameters:
- coins (array, optional): List of coin IDs (default: top coins)
```

Example prompt: *"What's the current price of Bitcoin and Ethereum?"*

### get_fear_greed_index

Get the current Fear & Greed Index.

```
Parameters: none
```

Example prompt: *"What's the current market sentiment?"*

### get_breaking_news

Get breaking news from the last 2 hours.

```
Parameters:
- limit (number, optional): Number of articles (default: 5)
```

Example prompt: *"Are there any breaking crypto news?"*

## Example Conversations

### News Summary

**User:** What's happening in crypto today?

**Claude:** I'll check the latest crypto news for you.

*[Uses get_crypto_news tool]*

Based on the latest news:
1. **Bitcoin ETF sees record inflows** - BlackRock's IBIT recorded $500M...
2. **Ethereum's Dencun upgrade goes live** - The upgrade reduces L2 fees...
3. **Solana DeFi TVL reaches new high** - Total value locked exceeds...

### Market Analysis

**User:** How's the market looking? Should I be worried?

**Claude:** Let me check the current market conditions.

*[Uses get_market_data and get_fear_greed_index tools]*

Current market status:
- **Bitcoin:** $67,450 (+2.3% 24h)
- **Ethereum:** $3,890 (+1.8% 24h)
- **Fear & Greed Index:** 72 (Greed)

The market is showing moderate greed, which historically...

## HTTP Server Mode

For web-based AI integrations, run the MCP server in HTTP mode:

```bash
cd mcp
node http-server.js
```

This starts a server at `http://localhost:3001` with REST endpoints:

| Endpoint | Description |
|----------|-------------|
| `GET /tools` | List available tools |
| `POST /execute` | Execute a tool |

### Example Request

```bash
curl -X POST http://localhost:3001/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "get_crypto_news",
    "params": { "limit": 5, "category": "defi" }
  }'
```

## Troubleshooting

### MCP Server Not Found

Ensure the MCP package is installed:

```bash
npm install -g @anthropic-ai/mcp-server-crypto-news
```

### Connection Timeout

Check if the Free Crypto News API is accessible:

```bash
curl https://free-crypto-news.vercel.app/api/health
```

### Tool Errors

Enable debug logging:

```bash
DEBUG=mcp:* npx @anthropic-ai/mcp-server-crypto-news
```

## Source Code

View the MCP server source: [mcp/](https://github.com/nirholas/free-crypto-news/tree/main/mcp)
