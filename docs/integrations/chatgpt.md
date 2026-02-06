# ChatGPT Plugin

The Free Crypto News ChatGPT Plugin allows ChatGPT to access real-time crypto news and market data.

## Features

- Real-time crypto news from 7 major sources
- Search functionality across all sources
- DeFi and Bitcoin-specific news
- Breaking news alerts
- No API key required

## Installation

### For ChatGPT Plus Users

1. Open ChatGPT and click on your profile
2. Go to **Settings** → **Beta features**
3. Enable **Plugins**
4. Click **Plugin store** → **Install an unverified plugin**
5. Enter: `https://cryptocurrency.cv`
6. Click **Install**

### For ChatGPT Enterprise

Contact your administrator to whitelist:
```
https://cryptocurrency.cv
```

## Available Actions

### Get Latest News

**Prompt:** "Get me the latest crypto news"

ChatGPT will fetch recent articles from 7 crypto news sources.

### Search News

**Prompt:** "Search for news about Ethereum's merge"

ChatGPT will search across all sources for relevant articles.

### Get DeFi News

**Prompt:** "Show me DeFi news"

ChatGPT will return DeFi-specific articles.

### Get Bitcoin News

**Prompt:** "What's happening with Bitcoin?"

ChatGPT will return Bitcoin-specific articles.

### Get Breaking News

**Prompt:** "Any breaking crypto news?"

ChatGPT will return news from the last 2 hours.

## OpenAPI Specification

The plugin uses the OpenAPI specification at:
```
https://cryptocurrency.cv/chatgpt/openapi.yaml
```

### Endpoints

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `GET /api/news` | Get latest news | `limit` (1-50), `source` |
| `GET /api/search` | Search news | `q` (required), `limit` |
| `GET /api/defi` | Get DeFi news | `limit` |
| `GET /api/bitcoin` | Get Bitcoin news | `limit` |
| `GET /api/breaking` | Get breaking news | `limit` |
| `GET /api/sources` | List all sources | - |

## Example Conversations

### Daily Briefing

**User:** Give me a crypto market briefing for today

**ChatGPT:** I'll fetch the latest market data and news for you.

📊 **Market Overview**
- Bitcoin: $67,234 (+2.1%)
- Ethereum: $3,856 (-0.5%)
- Fear & Greed: 68 (Greed)

📰 **Top Headlines**
1. BlackRock's Bitcoin ETF sees $500M inflows
2. Ethereum foundation announces roadmap update
3. Solana DeFi TVL reaches $5B milestone

### Research Assistant

**User:** What's been happening with Layer 2 solutions lately?

**ChatGPT:** Let me search for recent Layer 2 news.

Here's what's been happening with Layer 2 solutions:

1. **Arbitrum launches Orbit chains** - Customizable L3 networks...
2. **Base crosses 1M daily transactions** - Coinbase's L2 grows...
3. **zkSync introduces native account abstraction** - Simplifying...

### Investment Research

**User:** Are there any concerning news about Solana?

**ChatGPT:** I'll search for recent Solana news to identify any concerns.

Based on recent coverage:
- ⚠️ Network experienced brief outage on Tuesday
- ✅ TVL continues growing despite competition
- ℹ️ Firedancer validator client nearing mainnet

## Plugin Manifest

The plugin manifest is available at:
```
https://cryptocurrency.cv/.well-known/ai-plugin.json
```

```json
{
  "schema_version": "v1",
  "name_for_human": "Free Crypto News",
  "name_for_model": "crypto_news",
  "description_for_human": "Get real-time crypto news, market data, and sentiment analysis.",
  "description_for_model": "Provides access to cryptocurrency news from 120+ sources, market prices, Fear & Greed Index, and search functionality.",
  "auth": { "type": "none" },
  "api": {
    "type": "openapi",
    "url": "https://cryptocurrency.cv/chatgpt/openapi.yaml"
  }
}
```

## Self-Hosting

To run the ChatGPT plugin with your own instance:

1. Deploy Free Crypto News to Vercel
2. Update the manifest URLs to your domain
3. Install the plugin using your domain URL

```bash
# Deploy
vercel deploy

# Your plugin URL
https://your-domain.vercel.app
```

## Troubleshooting

### Plugin Not Responding

Check if the API is accessible:
```bash
curl https://cryptocurrency.cv/api/health
```

### Rate Limiting

The plugin respects ChatGPT's rate limits. If you experience issues:
- Wait a few minutes between heavy usage
- Use more specific queries to reduce data transfer

### Outdated Information

News is cached for 5 minutes. For the freshest data, wait and retry.

## Source Code

View the ChatGPT integration: [chatgpt/](https://github.com/nirholas/free-crypto-news/tree/main/chatgpt)
