# AI Agents & Skills

Comprehensive guide to AI agent capabilities, MCP tools, ChatGPT actions, and autonomous agent integration.

---

## Overview

Free Crypto News provides multiple integration points for AI agents:

| Integration | Protocol | Tools/Actions | Use Case |
|-------------|----------|---------------|----------|
| **MCP Server** | Model Context Protocol (Streamable HTTP or stdio) | 47 hosted tools at `https://cryptocurrency.cv/api/mcp`; 55 tools, 6 resources and 3 prompts locally | Claude Code, Claude Desktop, Cursor, ChatGPT Dev Mode, any MCP client |
| **ChatGPT Plugin** | OpenAI Actions | 6 endpoints | ChatGPT Plus/Enterprise |
| **LangChain Tools** | LangChain | 5 tools | Custom AI agents |
| **x402 Discovery** | x402 Protocol | 10 paid endpoints | Autonomous payments |

---

## Critical: Terminal Command Safety

**Before running ANY terminal command, agents MUST:**

1. **Verify the current working directory**
2. **Use absolute paths OR explicitly `cd` to the correct directory first**
3. **Use `pwd` to confirm location when uncertain**

### Safe Command Patterns

```bash
# CORRECT - Always start with cd and pwd
cd /workspaces/cryptocurrency.cv && pwd && npm run build

# CORRECT - Use absolute paths
node /workspaces/cryptocurrency.cv/scripts/archive/import-historical-dataset.js

# WRONG - Don't assume current directory
npm run build  # Could be in wrong directory!
```

### Destructive Operations

Before ANY destructive operation (rm, mv, overwrite), verify:
- You're in the correct directory (`pwd`)
- The target files are correct (`ls -la <target>`)

```bash
# CORRECT - Verify before removing
cd /workspaces/cryptocurrency.cv && pwd && ls scripts/archive/*.js && rm scripts/archive/old-file.js
```

---

## MCP Server

The Model Context Protocol server exposes the news, sentiment, market, DeFi, archive and alert endpoints as read-only tools for AI assistants. It ships two ways:

- **Hosted (no install):** Streamable HTTP at `https://cryptocurrency.cv/api/mcp`. Claude Code: `claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp`.
- **Local stdio server:** the published package `@nirholas/free-crypto-news-mcp` (`npx -y @nirholas/free-crypto-news-mcp`), or the `mcp/` directory of this repository: `cd mcp && npm install && npm run build && node dist/index.js`.

The tool list below is grouped by category; the server's `tools/list` response is the authoritative inventory.

### Core News Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_crypto_news` | Latest news from 358 sources | `limit`, `source` |
| `search_crypto_news` | Search by keywords | `keywords`, `limit` |
| `get_defi_news` | DeFi-specific news | `limit` |
| `get_bitcoin_news` | Bitcoin-specific news | `limit` |
| `get_ethereum_news` | Ethereum-specific news | `limit` |
| `get_altcoin_news` | Altcoin news | `limit` |
| `get_breaking_news` | News from last 2 hours | `limit` |
| `get_nft_news` | NFT-specific news | `limit` |
| `analyze_news` | News with sentiment | `limit` |
| `get_news_sources` | List all sources | - |
| `get_api_health` | API health status | - |

### Analytics & Sentiment

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_trending_topics` | Trending with sentiment | `limit` |
| `get_crypto_stats` | Analytics breakdown | - |
| `get_ai_sentiment` | AI-powered sentiment | `topic` |
| `get_ai_summary` | AI-generated summary | `topic` |
| `get_market_sentiment` | Market sentiment indicators | - |
| `get_fear_greed` | Fear & Greed Index | - |
| `get_social_sentiment` | Social media sentiment | `coin` |

### Trading & Market Data

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_prices` | Real-time prices | `coins` |
| `get_markets` | Top 100 markets | - |
| `get_ticker` | 24h ticker data | `symbol` |
| `get_orderbook` | Live orderbook | `symbol` |
| `get_arbitrage` | Arbitrage opportunities | - |
| `get_options_data` | Options market data | `symbol` |
| `get_funding_rates` | Futures funding rates | - |
| `get_liquidations` | Liquidation events | - |
| `get_whale_alerts` | Large transactions | - |

### DeFi & Token Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_stablecoin_data` | Stablecoin metrics | - |
| `get_defi_yields` | DeFi yields | - |
| `get_gas_prices` | Ethereum gas | - |
| `get_tvl_rankings` | DeFi TVL rankings | - |

### Archive & Research

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_archive` | Historical news | `query`, `startDate`, `endDate` |
| `get_archive_stats` | Archive statistics | - |
| `find_original_sources` | Find article origin | `url` |
| `get_events_calendar` | Upcoming events | - |

### Alerts & Monitoring

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_portfolio_news` | News for coin list | `coins`, `limit` |
| `get_alerts` | Custom alerts | - |
| `get_rss_feeds` | RSS feed URLs | - |
| `get_regulatory_news` | Regulatory updates | `jurisdiction` |
| `get_market_data` | Prices and market caps | `coins` |

### Tool Annotations

All tools are marked as `readOnlyHint: true` for ChatGPT compatibility (no confirmation prompts):

```javascript
{
  name: 'get_crypto_news',
  description: 'Get latest crypto news from 358 sources',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number', default: 10 }
    }
  },
  annotations: {
    readOnlyHint: true  // No confirmation needed
  }
}
```

### Setup

=== "Claude Code (hosted)"

    ```bash
    claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp
    ```

=== "Claude Desktop (local)"

    The published package is `@nirholas/free-crypto-news-mcp`:

    ```json title="claude_desktop_config.json"
    {
      "mcpServers": {
        "crypto-news": {
          "command": "npx",
          "args": ["-y", "@nirholas/free-crypto-news-mcp"]
        }
      }
    }
    ```

    To run from source, build it first: the entry point is `dist/index.js` and
    only exists after `npm run build`.

    ```bash
    git clone https://github.com/nirholas/cryptocurrency.cv.git
    cd cryptocurrency.cv/mcp && npm install && npm run build
    ```

    ```json title="claude_desktop_config.json"
    {
      "mcpServers": {
        "crypto-news": {
          "command": "node",
          "args": ["/absolute/path/to/cryptocurrency.cv/mcp/dist/index.js"]
        }
      }
    }
    ```

=== "ChatGPT Developer Mode"

    1. Enable Developer Mode in Settings → Apps → Advanced
    2. Add MCP server: `https://cryptocurrency.cv/api/mcp`
    3. Authorize the connection

=== "Any Streamable-HTTP client"

    Point the client at `https://cryptocurrency.cv/api/mcp`. No API key is needed. To self-host the Streamable HTTP transport instead, run `cd mcp && npm install && npm run build && npm run start:http` (serves `POST /mcp` on `PORT`, default 3333).

### Example Usage

```
User: Get me the latest DeFi news

Claude: I'll fetch the latest DeFi news for you.

[Uses get_defi_news tool]

Here are the top DeFi stories:
1. Uniswap v4 launches with hooks support
2. Aave reaches $20B in TVL
3. MakerDAO proposes new stablecoin mechanism
```

---

## ChatGPT Actions (6 Endpoints)

The ChatGPT plugin provides 6 actions for ChatGPT Plus and Enterprise users.

### Available Actions

| Action | Endpoint | Description |
|--------|----------|-------------|
| `getLatestNews` | `/api/news` | Latest crypto news |
| `searchNews` | `/api/search` | Search by keywords |
| `getDefiNews` | `/api/defi` | DeFi-specific news |
| `getBitcoinNews` | `/api/bitcoin` | Bitcoin-specific news |
| `getBreakingNews` | `/api/breaking` | Last 2 hours news |
| `getSources` | `/api/sources` | List all sources |

### OpenAPI Spec

```yaml
openapi: 3.1.0
info:
  title: Free Crypto News API
  version: 1.0.0
paths:
  /api/news:
    get:
      operationId: getLatestNews
      summary: Get latest crypto news
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
```

Full spec: [/api/openapi.json](https://cryptocurrency.cv/api/openapi.json)

### Installation

1. Open ChatGPT → Profile → Settings
2. Enable **Plugins** under Beta features
3. Plugin Store → Install unverified plugin
4. Enter: `https://cryptocurrency.cv`

---

## LangChain Tools (5 Tools)

Integrate with LangChain agents for custom AI applications.

### Tool Definitions

```python
from langchain.tools import Tool
from langchain.agents import initialize_agent
import requests

API_BASE = "https://cryptocurrency.cv"

tools = [
    Tool(
        name="CryptoNews",
        description="Get the latest cryptocurrency news headlines",
        func=lambda _: requests.get(f"{API_BASE}/api/news").json()
    ),
    Tool(
        name="SearchCryptoNews",
        description="Search crypto news by keyword. Input: search query string",
        func=lambda q: requests.get(f"{API_BASE}/api/search", params={"q": q}).json()
    ),
    Tool(
        name="DeFiNews",
        description="Get DeFi-specific news about protocols, yield farming, DEXs",
        func=lambda _: requests.get(f"{API_BASE}/api/defi").json()
    ),
    Tool(
        name="BitcoinNews",
        description="Get Bitcoin-specific news and updates",
        func=lambda _: requests.get(f"{API_BASE}/api/bitcoin").json()
    ),
    Tool(
        name="FearGreedIndex",
        description="Get the current Crypto Fear & Greed Index value",
        func=lambda _: requests.get(f"{API_BASE}/api/fear-greed").json()
    ),
]
```

### Agent Example

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")
agent = initialize_agent(tools, llm, agent="zero-shot-react-description")

response = agent.run("What's the current market sentiment for Bitcoin?")
print(response)
```

See full example: [examples/langchain-tool.py](https://github.com/nirholas/cryptocurrency.cv/blob/main/examples/langchain-tool.py)

---

## Autonomous Agent Capabilities

### x402 Payment Discovery

AI agents can discover and pay for premium endpoints automatically:

```python
import httpx

# 1. Discover available endpoints
discovery = httpx.get("https://cryptocurrency.cv/.well-known/x402").json()

for resource in discovery['resources']:
    print(f"{resource['path']}: {resource['price']}")

# Output:
# /api/v1/news: $0.001
# /api/v1/coins: $0.002
# /api/v1/analysis: $0.005
```

### Skill Categories

The API provides capabilities across these skill categories:

| Category | Skills | Description |
|----------|--------|-------------|
| **News Retrieval** | 6 | Fetch, search, filter news |
| **Market Data** | 4 | Prices, charts, metrics |
| **Sentiment Analysis** | 3 | Fear/Greed, trending, social |
| **AI Analysis** | 5 | Summaries, predictions, signals |
| **Portfolio** | 2 | Holdings news, alerts |
| **Historical** | 2 | Archive search, trends |

### Agent Prompt Examples

Agents can use these prompts to understand available capabilities:

```
System: You have access to the Free Crypto News API with these capabilities:
- get_crypto_news: Latest headlines from 358 sources
- search_crypto_news: Search by topic/keyword
- get_defi_news: DeFi protocol news
- get_bitcoin_news: Bitcoin-specific news
- get_trending_topics: What's hot with sentiment scores
- get_fear_greed_index: Market sentiment (0-100)
- get_market_data: Prices and market caps
- get_coin_analysis: AI analysis for specific coins

When users ask about crypto markets, news, or sentiment, use these tools
to provide accurate, real-time information.
```

---

## Agent-to-Agent (A2A) Compatibility

### Google A2A Protocol

The API is compatible with Google's Agent-to-Agent protocol:

```json
{
  "agent": {
    "name": "Free Crypto News",
    "description": "Real-time crypto news from 358 sources",
    "capabilities": ["news", "search", "market_data", "sentiment"],
    "endpoints": {
      "discovery": "/.well-known/x402",
      "openapi": "/api/openapi.json",
      "mcp": "https://cryptocurrency.cv/api/mcp"
    }
  }
}
```

### Multi-Agent Orchestration

Example of using this API within a multi-agent system:

```python
from swarm import Swarm, Agent

news_agent = Agent(
    name="Crypto News Agent",
    instructions="Fetch and summarize crypto news",
    tools=[get_crypto_news, search_news]
)

analyst_agent = Agent(
    name="Market Analyst",
    instructions="Analyze market trends from news",
    tools=[get_market_data, get_fear_greed]
)

client = Swarm()
response = client.run(
    agent=news_agent,
    messages=[{"role": "user", "content": "Brief me on Bitcoin today"}]
)
```

---

## Rate Limits & Best Practices

### Agent Rate Limits

| Tier | Requests/min | Best For |
|------|--------------|----------|
| **Free** | 60 | Development, small agents |
| **Standard** | 300 | Production agents |
| **Enterprise** | Unlimited | High-volume systems |

### Best Practices

1. **Cache Responses**: News doesn't change every second
   ```python
   @lru_cache(maxsize=100, ttl=60)
   def get_news():
       return requests.get(f"{API_BASE}/api/news").json()
   ```

2. **Use Appropriate Tools**: Match tool to user intent
   - "What's happening?" → `get_crypto_news`
   - "News about Solana" → `search_crypto_news(keywords="solana")`
   - "DeFi updates" → `get_defi_news`

3. **Handle Errors Gracefully**
   ```python
   try:
       news = get_crypto_news()
   except Exception as e:
       return "I couldn't fetch news right now. Please try again."
   ```

4. **Provide Context**: Tell users where info comes from
   ```
   Based on the latest news from CoinDesk and The Block...
   ```

---

## See Also

- [MCP Server Integration](integrations/mcp.md) - Detailed MCP setup
- [ChatGPT Plugin](integrations/chatgpt.md) - ChatGPT integration
- [LangChain Example](examples/langchain.md) - Full LangChain agent
- [x402 Payments](X402.md) - Autonomous payments
- [Well-Known Endpoints](WELL-KNOWN.md) - Discovery endpoints
