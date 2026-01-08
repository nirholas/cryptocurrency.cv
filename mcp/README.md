# MCP Server for Crypto News

Use Free Crypto News with Claude Desktop **or** ChatGPT Developer Mode!

## 🚀 Quick Start

**Live MCP Server:** `https://plugins.support/sse` (deployed on Railway)

### Option 1: Claude Desktop (stdio)

1. Clone and install:
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp
npm install
```

2. Add to Claude Desktop config:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/path/to/free-crypto-news/mcp/index.js"]
    }
  }
}
```

3. Restart Claude Desktop

4. Ask: *"Get me the latest crypto news"*

### Option 2: ChatGPT Developer Mode (HTTP/SSE)

**Prerequisites:**
- ChatGPT Pro, Plus, Business, Enterprise, or Education account
- Developer Mode enabled in [Settings → Apps → Advanced settings](https://chatgpt.com/#settings/Connectors/Advanced)

**Setup:**

1. Clone and install:
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp
npm install
```

2. Start the HTTP/SSE server:
```bash
npm run start:http
# or with custom port:
PORT=3001 npm run start:http
```

Server will start at `http://localhost:3001`

3. In ChatGPT, create a new app:
   - Go to [ChatGPT Apps settings](https://chatgpt.com/#settings/Connectors)
   - Click **"Create app"** (only visible in Developer Mode)
   - Configure the app:
     - **Name:** Free Crypto News
     - **Protocol:** SSE
     - **Endpoint:** `https://plugins.support/sse` (or run locally)
     - **Authentication:** No Authentication

4. Enable the app in a conversation:
   - Start a new chat
   - Select **Developer mode** from the Plus menu
   - Choose **Free Crypto News** app
   - Ask: *"Use the Free Crypto News app to get the latest crypto headlines"*

**Production Deployment for ChatGPT:**

Deploy the HTTP server to any cloud provider:

```bash
# Deploy to Railway, Render, Fly.io, etc.
# Set environment variable:
# API_BASE=https://free-crypto-news.vercel.app

# The server will be accessible at your deployment URL
# Use that URL + /sse as your ChatGPT app endpoint
```

**Example deployment on Railway:**
```bash
railway up
# Get your deployment URL, e.g., https://your-app.railway.app
# In ChatGPT app settings, use: https://your-app.railway.app/sse
```

## 📋 Available Tools (14 Total)

All tools are marked as **read-only** for ChatGPT Developer Mode (no confirmation prompts needed).

| Tool | Description |
|------|-------------|
| `get_crypto_news` | Latest news from all 7 sources |
| `search_crypto_news` | Search by keywords |
| `get_defi_news` | DeFi-specific news |
| `get_bitcoin_news` | Bitcoin-specific news |
| `get_breaking_news` | News from last 2 hours |
| `get_news_sources` | List all available news sources |
| `get_api_health` | Check API & feed health status |
| `get_trending_topics` | Trending topics with sentiment analysis |
| `get_crypto_stats` | Analytics & statistics |
| `analyze_news` | News with topic classification & sentiment |
| `get_archive` | Query historical news archive |
| `get_archive_stats` | Archive statistics |
| `find_original_sources` | Find where news originated |
| `get_portfolio_news` | News for specific coins with prices |

## 💬 Example Prompts

### Claude Desktop

**Basic News:**
- "Get me the latest crypto news"
- "Search for news about Ethereum ETF"
- "What's happening in DeFi?"
- "Any breaking crypto news?"
- "Bitcoin news from today"

**Analytics & Trends:**
- "What are the trending crypto topics?"
- "What's the market sentiment today?"
- "Analyze recent news for bullish signals"
- "Show me crypto news statistics"

**Historical & Sources:**
- "Get news from last week about SEC"
- "What are the archive statistics?"
- "Find the original source of this Binance news"
- "Which government agencies are making crypto news?"

### ChatGPT Developer Mode

For ChatGPT, be explicit about using the app and tool names:

**Basic Usage:**
- "Use the Free Crypto News app's `get_crypto_news` tool to show me the latest headlines"
- "Use `search_crypto_news` to find news about 'SEC regulation'. Do not use built-in browsing."
- "Call the `get_breaking_news` tool to show urgent crypto news from the last 2 hours"

**Analytics:**
- "Use `get_trending_topics` from Free Crypto News to show what's trending in crypto right now"
- "Call `analyze_news` with sentiment filter set to 'bullish' to find positive crypto news"
- "Use the `get_crypto_stats` tool to show me news distribution by source"

**Portfolio Tracking:**
- "Use `get_portfolio_news` with coins='btc,eth,sol' to get news for my portfolio with prices"
- "Call `get_bitcoin_news` only (do not use other tools) to show Bitcoin-specific news"

**Best Practices for ChatGPT:**
- Always mention the app name: "Free Crypto News"
- Specify the exact tool name in backticks
- Add "Do not use built-in tools" if you want only MCP results
- Use explicit parameters: `{ "coins": "btc,eth", "limit": 5 }`

## ✨ Features

- **100% Free** - No API keys required
- **Dual Transport** - Works with both Claude (stdio) and ChatGPT (HTTP/SSE)
- **14 Tools** - Comprehensive crypto news coverage
- **Read-Only** - All tools marked as safe for ChatGPT (no confirmation prompts)
- **Real-Time** - Breaking news from last 2 hours
- **Sentiment Analysis** - Bullish/bearish/neutral classification
- **Historical Archive** - Query past news by date/source
- **Portfolio Tracking** - Get news for specific coins with prices
- **Original Sources** - Trace where news actually originated

## 🛠️ Technical Details

**Transports Supported:**
- `stdio` - For Claude Desktop (default)
- `HTTP/SSE` - For ChatGPT Developer Mode and remote clients

**API Endpoints (HTTP mode):**
- `GET /health` - Health check
- `GET /sse` - Server-Sent Events endpoint for MCP
- `POST /message` - Message endpoint (used with SSE)
- `POST /mcp` - Single request/response endpoint

**Environment Variables:**
- `PORT` - HTTP server port (default: 3001)
- `API_BASE` - Backend API URL (default: https://free-crypto-news.vercel.app)

## No API Key Required!

This MCP server calls the free API at `free-crypto-news.vercel.app` - no authentication needed.

## 📚 Related

- **Main API:** https://free-crypto-news.vercel.app
- **OpenAPI Docs:** https://free-crypto-news.vercel.app/api/docs
- **GitHub:** https://github.com/nirholas/free-crypto-news
