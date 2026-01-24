# ChatGPT Plugin

The Free Crypto News ChatGPT Plugin allows ChatGPT to access real-time crypto news and market data.

## Features

- Real-time crypto news from 120+ sources
- Market data and prices
- Fear & Greed Index
- Search functionality
- Breaking news alerts

## Installation

### For ChatGPT Plus Users

1. Open ChatGPT and click on your profile
2. Go to **Settings** → **Beta features**
3. Enable **Plugins**
4. Click **Plugin store** → **Install an unverified plugin**
5. Enter: `https://free-crypto-news.vercel.app`
6. Click **Install**

### For ChatGPT Enterprise

Contact your administrator to whitelist:
```
https://free-crypto-news.vercel.app
```

## Available Actions

### Get Latest News

**Prompt:** "Get me the latest crypto news"

ChatGPT will fetch recent articles from top crypto news sources.

### Search News

**Prompt:** "Search for news about Ethereum's merge"

ChatGPT will search across all sources for relevant articles.

### Market Data

**Prompt:** "What's the current Bitcoin price?"

ChatGPT will fetch real-time price data.

### Fear & Greed Index

**Prompt:** "What's the current market sentiment?"

ChatGPT will return the Fear & Greed Index with analysis.

### Category Filter

**Prompt:** "Show me institutional crypto news"

ChatGPT will filter news by category.

## OpenAPI Specification

The plugin uses the OpenAPI specification at:
```
https://free-crypto-news.vercel.app/chatgpt/openapi.yaml
```

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Get latest news |
| `GET /api/search` | Search news |
| `GET /api/market` | Get market data |
| `GET /api/fear-greed` | Get Fear & Greed Index |
| `GET /api/breaking` | Get breaking news |

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
https://free-crypto-news.vercel.app/.well-known/ai-plugin.json
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
    "url": "https://free-crypto-news.vercel.app/chatgpt/openapi.yaml"
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
curl https://free-crypto-news.vercel.app/api/health
```

### Rate Limiting

The plugin respects ChatGPT's rate limits. If you experience issues:
- Wait a few minutes between heavy usage
- Use more specific queries to reduce data transfer

### Outdated Information

News is cached for 5 minutes. For the freshest data, wait and retry.

## Source Code

View the ChatGPT integration: [chatgpt/](https://github.com/nirholas/free-crypto-news/tree/main/chatgpt)
