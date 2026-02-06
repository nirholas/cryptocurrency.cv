# Continue.dev Integration Guide

Complete guide for using Free Crypto News with Continue.dev VS Code extension.

## What is Continue?

[Continue](https://continue.dev) is an open-source AI code assistant for VS Code and JetBrains IDEs with support for custom models, context providers, and MCP.

---

## Integration Methods

| Method | Difficulty | Features | Best For |
|--------|------------|----------|----------|
| MCP Server | ⭐⭐ Medium | Full tools | Real-time data |
| Context Provider | ⭐⭐⭐ Advanced | Custom context | Deep integration |
| Slash Commands | ⭐ Easy | Quick actions | Common tasks |
| Docs | ⭐ Easy | API reference | Lookups |

---

## Method 1: MCP Server (Recommended)

### Step 1: Install Continue Extension

1. Open VS Code Extensions (`Cmd/Ctrl + Shift + X`)
2. Search for "Continue"
3. Install the Continue extension

### Step 2: Configure MCP

Open Continue config (`~/.continue/config.json`):

```json
{
  "models": [...],
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "crypto-news",
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": ["/path/to/free-crypto-news/mcp/index.js"]
        }
      }
    ]
  }
}
```

**Using HTTP/SSE Transport:**

```json
{
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "crypto-news",
        "transport": {
          "type": "sse",
          "url": "https://plugins.support/sse"
        }
      }
    ]
  }
}
```

### Step 3: Use MCP Tools

In Continue Chat:

```
@crypto-news get the latest Bitcoin news
```

```
@crypto-news search for "Ethereum merge"
```

```
@crypto-news get BTC sentiment
```

---

## Method 2: Context Providers

Create a custom context provider for crypto data.

### Step 1: Create Provider

Create `~/.continue/context-providers/crypto-news.js`:

```javascript
/**
 * Crypto News Context Provider for Continue
 */

const API_BASE = "https://cryptocurrency.cv";

async function fetchApi(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const response = await fetch(url, { timeout: 10000 });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

const cryptoNewsProvider = {
  name: "crypto-news",
  displayTitle: "Crypto News",
  description: "Real-time cryptocurrency news and market data",
  
  getContextItems: async (query) => {
    const items = [];
    
    // Determine what data to fetch based on query
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes("news") || queryLower.includes("article")) {
      const data = await fetchApi("/api/news", { limit: 10 });
      items.push({
        name: "Latest Crypto News",
        description: "Recent cryptocurrency news articles",
        content: data.articles.map(a => 
          `**${a.title}** (${a.source})\n${a.description || ''}\nURL: ${a.url}\n`
        ).join('\n---\n'),
      });
    }
    
    if (queryLower.includes("sentiment") || queryLower.includes("analysis")) {
      const asset = query.match(/\b(BTC|ETH|SOL|XRP|DOGE)\b/i)?.[0] || "BTC";
      const data = await fetchApi("/api/ai/sentiment", { asset: asset.toUpperCase() });
      items.push({
        name: `${asset.toUpperCase()} Sentiment`,
        description: "AI sentiment analysis",
        content: `Asset: ${asset.toUpperCase()}\nSentiment: ${data.label}\nScore: ${data.score}\nConfidence: ${data.confidence}`,
      });
    }
    
    if (queryLower.includes("fear") || queryLower.includes("greed") || queryLower.includes("index")) {
      const data = await fetchApi("/api/market/fear-greed");
      items.push({
        name: "Fear & Greed Index",
        description: "Market sentiment indicator",
        content: `Value: ${data.value}/100\nClassification: ${data.classification}`,
      });
    }
    
    if (queryLower.includes("price") || queryLower.includes("coin") || queryLower.includes("market")) {
      const data = await fetchApi("/api/coins", { limit: 20 });
      items.push({
        name: "Cryptocurrency Prices",
        description: "Current market prices",
        content: data.coins.map(c => 
          `${c.symbol}: $${c.price.toLocaleString()} (${c.priceChange24h >= 0 ? '+' : ''}${c.priceChange24h.toFixed(2)}%)`
        ).join('\n'),
      });
    }
    
    if (queryLower.includes("trending") || queryLower.includes("hot") || queryLower.includes("popular")) {
      const data = await fetchApi("/api/trending");
      items.push({
        name: "Trending Topics",
        description: "Hot crypto topics",
        content: data.topics.slice(0, 10).map(t => 
          `${t.name}: ${t.mentions} mentions (${t.sentiment})`
        ).join('\n'),
      });
    }
    
    return items;
  }
};

module.exports = cryptoNewsProvider;
```

### Step 2: Register Provider

Add to `~/.continue/config.json`:

```json
{
  "contextProviders": [
    {
      "name": "crypto-news",
      "params": {}
    }
  ]
}
```

### Step 3: Use Provider

In Continue:

```
@crypto-news What's the current market sentiment?
```

```
@crypto-news Get the latest DeFi news
```

---

## Method 3: Slash Commands

### Step 1: Create Slash Commands

Add to `~/.continue/config.json`:

```json
{
  "slashCommands": [
    {
      "name": "crypto-news",
      "description": "Get latest cryptocurrency news",
      "run": async function* (sdk) {
        const response = await fetch('https://cryptocurrency.cv/api/news?limit=5');
        const data = await response.json();
        
        let result = "📰 **Latest Crypto News**\n\n";
        for (const article of data.articles) {
          result += `**${article.title}**\n`;
          result += `_${article.source} • ${article.publishedAt}_\n`;
          result += `${article.description?.slice(0, 150)}...\n\n`;
        }
        
        yield result;
      }
    },
    {
      "name": "crypto-fear-greed",
      "description": "Get Fear & Greed Index",
      "run": async function* (sdk) {
        const response = await fetch('https://cryptocurrency.cv/api/market/fear-greed');
        const data = await response.json();
        
        const emoji = data.value < 25 ? '😱' : data.value < 45 ? '😰' : data.value < 55 ? '😐' : data.value < 75 ? '😊' : '🤑';
        
        yield `${emoji} **Fear & Greed Index:** ${data.value}/100 (${data.classification})`;
      }
    },
    {
      "name": "crypto-sentiment",
      "description": "Get sentiment for a cryptocurrency",
      "run": async function* (sdk, input) {
        const asset = input?.trim().toUpperCase() || 'BTC';
        const response = await fetch(`https://cryptocurrency.cv/api/ai/sentiment?asset=${asset}`);
        const data = await response.json();
        
        const emoji = data.score > 0.3 ? '🚀' : data.score < -0.3 ? '📉' : '😐';
        
        yield `${emoji} **${asset} Sentiment:** ${data.label} (score: ${data.score.toFixed(2)}, confidence: ${(data.confidence * 100).toFixed(0)}%)`;
      }
    },
    {
      "name": "crypto-search",
      "description": "Search crypto news",
      "run": async function* (sdk, query) {
        if (!query) {
          yield "Please provide a search query: /crypto-search Bitcoin ETF";
          return;
        }
        
        const response = await fetch(`https://cryptocurrency.cv/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        
        if (!data.articles?.length) {
          yield `No results found for "${query}"`;
          return;
        }
        
        let result = `🔍 **Search Results: "${query}"**\n\n`;
        for (const article of data.articles) {
          result += `**${article.title}**\n`;
          result += `_${article.source}_\n\n`;
        }
        
        yield result;
      }
    }
  ]
}
```

### Step 2: Use Slash Commands

In Continue Chat:

```
/crypto-news
```

```
/crypto-sentiment ETH
```

```
/crypto-search DeFi regulation
```

```
/crypto-fear-greed
```

---

## Method 4: Add Documentation

### Step 1: Add Docs Source

Add to `~/.continue/config.json`:

```json
{
  "docs": [
    {
      "title": "Free Crypto News API",
      "startUrl": "https://cryptocurrency.cv/docs/api",
      "faviconUrl": "https://cryptocurrency.cv/favicon.ico"
    }
  ]
}
```

### Step 2: Reference Docs

In Continue:

```
@docs How do I search for news using the Free Crypto News API?
```

```
@docs What sentiment endpoints are available?
```

---

## Complete Config Example

Full `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "YOUR_API_KEY"
    }
  ],
  
  "experimental": {
    "modelContextProtocolServers": [
      {
        "name": "crypto-news",
        "transport": {
          "type": "sse",
          "url": "https://plugins.support/sse"
        }
      }
    ]
  },
  
  "docs": [
    {
      "title": "Free Crypto News API",
      "startUrl": "https://cryptocurrency.cv/docs/api"
    }
  ],
  
  "slashCommands": [
    {
      "name": "crypto",
      "description": "Get crypto market overview",
      "run": "async function*(sdk) { const [news, fg] = await Promise.all([fetch('https://cryptocurrency.cv/api/news?limit=3').then(r=>r.json()), fetch('https://cryptocurrency.cv/api/market/fear-greed').then(r=>r.json())]); yield `**Market Update**\\n\\nFear & Greed: ${fg.value}/100\\n\\n${news.articles.map(a=>`• ${a.title}`).join('\\n')}`; }"
    }
  ],
  
  "customCommands": [
    {
      "name": "crypto-component",
      "description": "Generate a crypto data component",
      "prompt": "Create a React component that fetches data from the Free Crypto News API (https://cryptocurrency.cv). The component should: {{{ input }}}"
    }
  ],
  
  "systemMessage": "When working with cryptocurrency data, use the Free Crypto News API at https://cryptocurrency.cv. No API key is required."
}
```

---

## Example Workflows

### Generate Crypto Dashboard

```
/crypto-component display the top 10 coins with prices and 24h changes using Tailwind CSS
```

### Research Market Conditions

```
@crypto-news Get the current market sentiment

Based on this data, analyze the current market conditions and suggest potential trading strategies.
```

### Build Trading Bot

```
@docs What endpoints does the Free Crypto News API offer?

Now create a Python trading bot that:
1. Monitors Fear & Greed Index
2. Checks BTC sentiment hourly
3. Sends alerts on extreme readings
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Continue | `Cmd/Ctrl + L` |
| New Session | `Cmd/Ctrl + Shift + L` |
| Toggle Sidebar | `Cmd/Ctrl + Shift + M` |
| Focus Input | `Cmd/Ctrl + I` |

---

## Troubleshooting

### MCP Not Connecting

1. Check the path in config.json
2. Verify Node.js is installed
3. Test: `node /path/to/mcp/index.js`
4. Check Continue output panel

### Slash Commands Not Working

1. Validate JSON syntax in config
2. Restart VS Code
3. Check Continue logs

### Context Provider Errors

1. Check provider file path
2. Verify API is accessible
3. Add error handling to provider

---

## Links

- **Continue:** https://continue.dev
- **Continue Docs:** https://docs.continue.dev
- **Continue GitHub:** https://github.com/continuedev/continue
- **MCP Support:** https://docs.continue.dev/customize/mcp
- **Free Crypto News API:** https://cryptocurrency.cv
