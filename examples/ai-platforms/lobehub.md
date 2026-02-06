# LobeHub Integration Guide

Complete guide for integrating Free Crypto News with LobeHub (LobeChat).

## What is LobeHub?

[LobeHub](https://lobehub.com) is an open-source AI chat framework that supports multiple LLM providers and has a plugin system for extending functionality.

---

## Integration Methods

| Method | Difficulty | Features | Requirements |
|--------|------------|----------|--------------|
| Plugin System | ⭐⭐ Medium | Full API access | LobeChat instance |
| MCP Gateway | ⭐⭐ Medium | 40 tools | LobeChat + MCP |
| Custom Agent | ⭐ Easy | Context-based | LobeChat instance |

---

## Method 1: LobeChat Plugin

### Step 1: Install LobeChat

```bash
# Using Docker (recommended)
docker run -d -p 3210:3210 lobehub/lobe-chat

# Or with npm
npm install -g @lobehub/chat
lobe-chat
```

Access at: `http://localhost:3210`

### Step 2: Create Plugin Manifest

Create a file `crypto-news-plugin.json`:

```json
{
  "identifier": "crypto-news",
  "api": [
    {
      "name": "getNews",
      "description": "Get latest cryptocurrency news",
      "url": "https://cryptocurrency.cv/api/news",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "description": "Number of articles (1-50)",
            "default": 10
          },
          "category": {
            "type": "string",
            "description": "Category filter",
            "enum": ["bitcoin", "ethereum", "defi", "nft", "regulation"]
          },
          "source": {
            "type": "string",
            "description": "Source filter"
          }
        }
      }
    },
    {
      "name": "searchNews",
      "description": "Search cryptocurrency news",
      "url": "https://cryptocurrency.cv/api/search",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "q": {
            "type": "string",
            "description": "Search query",
            "required": true
          },
          "limit": {
            "type": "integer",
            "default": 10
          }
        },
        "required": ["q"]
      }
    },
    {
      "name": "getSentiment",
      "description": "Get sentiment analysis for a cryptocurrency",
      "url": "https://cryptocurrency.cv/api/ai/sentiment",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "asset": {
            "type": "string",
            "description": "Asset symbol (BTC, ETH, etc.)",
            "required": true
          }
        },
        "required": ["asset"]
      }
    },
    {
      "name": "getFearGreed",
      "description": "Get Fear & Greed Index",
      "url": "https://cryptocurrency.cv/api/market/fear-greed",
      "method": "GET"
    },
    {
      "name": "getTrending",
      "description": "Get trending crypto topics",
      "url": "https://cryptocurrency.cv/api/trending",
      "method": "GET"
    },
    {
      "name": "getBreaking",
      "description": "Get breaking news (last 2 hours)",
      "url": "https://cryptocurrency.cv/api/breaking",
      "method": "GET"
    },
    {
      "name": "getCoins",
      "description": "Get cryptocurrency prices",
      "url": "https://cryptocurrency.cv/api/coins",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": {
            "type": "integer",
            "default": 100
          }
        }
      }
    },
    {
      "name": "getArbitrage",
      "description": "Get arbitrage opportunities",
      "url": "https://cryptocurrency.cv/api/trading/arbitrage",
      "method": "GET"
    },
    {
      "name": "getWhales",
      "description": "Get whale movements",
      "url": "https://cryptocurrency.cv/api/trading/whales",
      "method": "GET"
    },
    {
      "name": "getGas",
      "description": "Get Ethereum gas prices",
      "url": "https://cryptocurrency.cv/api/blockchain/gas",
      "method": "GET"
    }
  ],
  "manifest": {
    "name": "Free Crypto News",
    "description": "Real-time cryptocurrency news, market data, and AI analysis from 200+ sources",
    "author": "Free Crypto News",
    "homepage": "https://cryptocurrency.cv",
    "version": "1.0.0",
    "schema_version": "1"
  },
  "settings": {
    "base_url": {
      "type": "string",
      "default": "https://cryptocurrency.cv",
      "description": "API base URL"
    }
  }
}
```

### Step 3: Add Plugin to LobeChat

1. Open LobeChat settings
2. Go to **Plugins** → **Custom Plugins**
3. Click **"Add Plugin"**
4. Paste the plugin manifest URL or JSON
5. Enable the plugin

### Step 4: Test the Plugin

Start a new chat and try:
- "Get the latest crypto news"
- "Search for Bitcoin ETF news"
- "What's the Fear & Greed Index?"
- "Show me Bitcoin sentiment"

---

## Method 2: LobeChat Agent with System Prompt

### Step 1: Create New Agent

1. Open LobeChat
2. Go to **Agents** → **Create Agent**

### Step 2: Configure Agent

**Name:** Crypto News Analyst

**Avatar:** 📰 or 🪙

**Description:** Real-time crypto news and market analysis

**System Prompt:**

```markdown
# Crypto News Analyst

You are an expert cryptocurrency news analyst with access to the Free Crypto News API.

## API Endpoints

Base URL: `https://cryptocurrency.cv`

### News Endpoints
- `GET /api/news?limit={n}` - Latest news (1-50 articles)
- `GET /api/search?q={query}` - Search news
- `GET /api/breaking` - Breaking news (last 2 hours)
- `GET /api/trending` - Trending topics
- `GET /api/news/bitcoin` - Bitcoin news
- `GET /api/news/defi` - DeFi news

### Market Data
- `GET /api/coins?limit={n}` - Cryptocurrency prices
- `GET /api/market/fear-greed` - Fear & Greed Index
- `GET /api/market/ohlc?coin={id}` - OHLC data

### AI Analysis
- `GET /api/ai/sentiment?asset={symbol}` - Sentiment (BTC, ETH, etc.)
- `POST /api/ai/summarize` - Summarize articles
- `POST /api/ai/ask` - Ask questions

### Trading
- `GET /api/trading/arbitrage` - Arbitrage opportunities
- `GET /api/trading/signals` - Trading signals
- `GET /api/trading/whales` - Whale movements

### Blockchain
- `GET /api/blockchain/gas` - Gas prices
- `GET /api/blockchain/defi/tvl` - DeFi TVL

## Response Format

When providing market updates:
1. Use emojis for visual clarity
2. Include sentiment indicators
3. Cite sources
4. Format data in tables when appropriate
5. Highlight key risks

## Example Response

📊 **Market Update**

| Asset | Price | 24h Change | Sentiment |
|-------|-------|------------|-----------|
| BTC | $92,345 | +2.3% | 🟢 Bullish |
| ETH | $3,456 | +1.8% | 🟢 Bullish |

**Top Headlines:**
1. "Bitcoin ETF sees record inflows" - CoinDesk
2. "Ethereum upgrade reduces gas 40%" - The Block

**Fear & Greed:** 68 (Greed) 📈

Always provide balanced analysis and never give financial advice.
```

### Step 3: Enable Plugins (Optional)

If you've created the plugin, enable it for this agent.

### Step 4: Test the Agent

Open a chat with your agent and try:
- "Give me today's crypto briefing"
- "What's happening with Solana?"
- "Are there any arbitrage opportunities?"

---

## Method 3: MCP Integration

LobeChat supports MCP servers for advanced integrations.

### Step 1: Configure MCP Gateway

Add to your LobeChat configuration:

```json
{
  "mcp": {
    "servers": {
      "crypto-news": {
        "transport": "sse",
        "url": "https://plugins.support/sse"
      }
    }
  }
}
```

Or for local development:

```json
{
  "mcp": {
    "servers": {
      "crypto-news": {
        "transport": "stdio",
        "command": "node",
        "args": ["/path/to/free-crypto-news/mcp/index.js"]
      }
    }
  }
}
```

### Step 2: Restart LobeChat

The MCP server will be available as tools in your chats.

---

## Complete Plugin Manifest (All Endpoints)

For full API coverage, use this extended manifest:

```json
{
  "identifier": "crypto-news-full",
  "manifest": {
    "name": "Free Crypto News (Full)",
    "description": "Complete crypto news API with 180+ endpoints",
    "version": "2.0.0"
  },
  "api": [
    {
      "name": "getNews",
      "description": "Get latest cryptocurrency news from 200+ sources",
      "url": "https://cryptocurrency.cv/api/news",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": { "type": "integer", "default": 10, "maximum": 50 },
          "category": { "type": "string" },
          "source": { "type": "string" },
          "page": { "type": "integer" }
        }
      }
    },
    {
      "name": "searchNews",
      "description": "Search news with keywords",
      "url": "https://cryptocurrency.cv/api/search",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "q": { "type": "string", "required": true },
          "limit": { "type": "integer", "default": 10 },
          "from": { "type": "string", "description": "Start date (ISO 8601)" },
          "to": { "type": "string", "description": "End date (ISO 8601)" }
        },
        "required": ["q"]
      }
    },
    {
      "name": "getSentiment",
      "description": "AI sentiment analysis for any cryptocurrency",
      "url": "https://cryptocurrency.cv/api/ai/sentiment",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "asset": { "type": "string", "required": true, "description": "Symbol like BTC, ETH, SOL" }
        },
        "required": ["asset"]
      }
    },
    {
      "name": "summarizeArticle",
      "description": "AI summarization of any article",
      "url": "https://cryptocurrency.cv/api/ai/summarize",
      "method": "POST",
      "parameters": {
        "type": "object",
        "properties": {
          "url": { "type": "string", "description": "Article URL to summarize" },
          "text": { "type": "string", "description": "Or raw text to summarize" },
          "length": { "type": "string", "enum": ["short", "medium", "long"] }
        }
      }
    },
    {
      "name": "askAI",
      "description": "Ask AI questions about crypto news",
      "url": "https://cryptocurrency.cv/api/ai/ask",
      "method": "POST",
      "parameters": {
        "type": "object",
        "properties": {
          "question": { "type": "string", "required": true },
          "context": { "type": "string" }
        },
        "required": ["question"]
      }
    },
    {
      "name": "getFearGreed",
      "description": "Get crypto Fear & Greed Index",
      "url": "https://cryptocurrency.cv/api/market/fear-greed",
      "method": "GET"
    },
    {
      "name": "getCoins",
      "description": "Get cryptocurrency prices and market data",
      "url": "https://cryptocurrency.cv/api/coins",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "limit": { "type": "integer", "default": 100 },
          "order": { "type": "string", "enum": ["market_cap_desc", "volume_desc"] }
        }
      }
    },
    {
      "name": "getTrending",
      "description": "Get trending crypto topics and hashtags",
      "url": "https://cryptocurrency.cv/api/trending",
      "method": "GET"
    },
    {
      "name": "getBreaking",
      "description": "Get breaking news from the last 2 hours",
      "url": "https://cryptocurrency.cv/api/breaking",
      "method": "GET"
    },
    {
      "name": "getArbitrage",
      "description": "Get cross-exchange arbitrage opportunities",
      "url": "https://cryptocurrency.cv/api/trading/arbitrage",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "minSpread": { "type": "number", "description": "Minimum spread percentage" }
        }
      }
    },
    {
      "name": "getSignals",
      "description": "Get AI trading signals",
      "url": "https://cryptocurrency.cv/api/trading/signals",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "asset": { "type": "string" }
        }
      }
    },
    {
      "name": "getWhales",
      "description": "Get whale transaction alerts",
      "url": "https://cryptocurrency.cv/api/trading/whales",
      "method": "GET",
      "parameters": {
        "type": "object",
        "properties": {
          "minValue": { "type": "integer", "description": "Minimum USD value" }
        }
      }
    },
    {
      "name": "getGas",
      "description": "Get Ethereum gas prices",
      "url": "https://cryptocurrency.cv/api/blockchain/gas",
      "method": "GET"
    },
    {
      "name": "getDeFiTVL",
      "description": "Get DeFi Total Value Locked",
      "url": "https://cryptocurrency.cv/api/blockchain/defi/tvl",
      "method": "GET"
    },
    {
      "name": "getRegulatoryNews",
      "description": "Get regulatory and legal news",
      "url": "https://cryptocurrency.cv/api/regulatory/news",
      "method": "GET"
    },
    {
      "name": "getETFNews",
      "description": "Get crypto ETF news",
      "url": "https://cryptocurrency.cv/api/regulatory/etf",
      "method": "GET"
    }
  ]
}
```

---

## Example Conversations

### With Plugin Enabled

**User:** Get me the latest Bitcoin news with sentiment

**LobeChat:**
```
📰 **Latest Bitcoin News**

I've fetched the latest Bitcoin news and sentiment data.

**Sentiment:** 🟢 Bullish (0.72 confidence)

**Top Headlines:**

1. **"Bitcoin breaks $95,000 resistance level"**
   Source: CoinDesk | 30 minutes ago
   Impact: High 🔥

2. **"Institutional investors add $2B to Bitcoin positions"**
   Source: The Block | 2 hours ago
   Impact: High 🔥

3. **"Lightning Network capacity reaches 6,000 BTC"**
   Source: Bitcoin Magazine | 4 hours ago
   Impact: Medium

**Analysis:**
The overall sentiment is strongly bullish, driven by:
- Institutional accumulation
- Technical breakout above key resistance
- Growing Lightning Network adoption

⚠️ **Risk:** RSI showing overbought conditions on daily timeframe.
```

---

## Troubleshooting

### Plugin Not Loading

1. Verify the manifest JSON is valid
2. Check CORS settings if self-hosting
3. Try the direct API endpoint in browser

### API Errors

1. Test endpoint directly:
```bash
curl https://cryptocurrency.cv/api/news?limit=5
```

2. Check rate limits
3. Verify parameter formats

### Performance Issues

1. Reduce `limit` parameter
2. Use specific endpoints instead of general search
3. Consider caching frequent queries

---

## Links

- **LobeHub:** https://lobehub.com
- **LobeChat Docs:** https://lobehub.com/docs
- **API Documentation:** https://cryptocurrency.cv/docs/api
- **Plugin Development:** https://lobehub.com/docs/plugin-development
