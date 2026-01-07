# Claude MCP Server

Use Free Crypto News with Claude Desktop!

## Installation

### Quick Setup

1. Clone the repo:
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

## Available Tools (15 Total)

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

## Example Prompts

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

## No API Key Required!

This MCP server calls the free API at `free-crypto-news.vercel.app` - no authentication needed.
