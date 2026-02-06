# ChatGPT Integration Guide

Complete guide for integrating Free Crypto News with ChatGPT.

## Integration Methods

| Method | Difficulty | Features | Requirements |
|--------|------------|----------|--------------|
| Custom GPT | ⭐ Easy | Basic API access | ChatGPT Plus |
| Plugin (Legacy) | ⭐⭐ Medium | Full API access | ChatGPT Plus |
| Developer Mode | ⭐⭐⭐ Advanced | MCP/SSE, Real-time | ChatGPT Pro |

---

## Method 1: Custom GPT (Recommended)

### Step 1: Create a Custom GPT

1. Go to [ChatGPT GPT Builder](https://chat.openai.com/gpts/editor)
2. Click **"Create a GPT"**

### Step 2: Configure the GPT

**Name:** Crypto News Assistant

**Description:** 
```
Real-time cryptocurrency news, market data, sentiment analysis, and trading insights powered by Free Crypto News API.
```

**Instructions:**
```
You are an expert cryptocurrency news analyst with access to real-time data from the Free Crypto News API.

## Your Capabilities:
1. Fetch latest crypto news from 200+ sources
2. Search for specific topics or coins
3. Analyze market sentiment (bullish/bearish/neutral)
4. Check Fear & Greed Index
5. Get trending topics
6. Summarize articles with AI
7. Track regulatory news
8. Monitor whale activity

## API Base URL:
https://cryptocurrency.cv

## How to Respond:
- Always fetch fresh data when asked about current events
- Provide sentiment analysis with your responses
- Format news with emojis for readability
- Include source attribution
- Warn about potential market risks

## Example Responses:

For "What's the latest Bitcoin news?":
1. Call GET /api/news?category=bitcoin&limit=5
2. Summarize the top headlines
3. Add sentiment context
4. Mention any breaking developments

For "How is the market feeling?":
1. Call GET /api/market/fear-greed
2. Call GET /api/ai/sentiment?asset=BTC
3. Provide a market mood summary
```

### Step 3: Add Actions (OpenAPI Schema)

1. Click **"Create new action"**
2. Import from URL: `https://cryptocurrency.cv/chatgpt/openapi.yaml`

Or paste this schema:

```yaml
openapi: 3.1.0
info:
  title: Free Crypto News API
  description: Real-time cryptocurrency news from 200+ sources
  version: 2.0.0
servers:
  - url: https://cryptocurrency.cv
paths:
  /api/news:
    get:
      operationId: getNews
      summary: Get latest crypto news
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 50
        - name: category
          in: query
          schema:
            type: string
            enum: [bitcoin, ethereum, defi, nft, regulation, trading]
        - name: source
          in: query
          schema:
            type: string
      responses:
        "200":
          description: News articles
          content:
            application/json:
              schema:
                type: object
                properties:
                  articles:
                    type: array
                    items:
                      type: object
                      properties:
                        title:
                          type: string
                        description:
                          type: string
                        url:
                          type: string
                        source:
                          type: string
                        publishedAt:
                          type: string

  /api/search:
    get:
      operationId: searchNews
      summary: Search crypto news
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        "200":
          description: Search results

  /api/ai/sentiment:
    get:
      operationId: getSentiment
      summary: Get sentiment for an asset
      parameters:
        - name: asset
          in: query
          required: true
          schema:
            type: string
            description: Asset symbol (BTC, ETH, etc.)
      responses:
        "200":
          description: Sentiment analysis

  /api/market/fear-greed:
    get:
      operationId: getFearGreed
      summary: Get Fear & Greed Index
      responses:
        "200":
          description: Current market sentiment index

  /api/trending:
    get:
      operationId: getTrending
      summary: Get trending topics
      responses:
        "200":
          description: Trending crypto topics

  /api/breaking:
    get:
      operationId: getBreaking
      summary: Get breaking news (last 2 hours)
      responses:
        "200":
          description: Breaking news articles

  /api/coins:
    get:
      operationId: getCoins
      summary: Get cryptocurrency prices
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 100
      responses:
        "200":
          description: Coin data with prices

  /api/ai/summarize:
    post:
      operationId: summarizeArticle
      summary: Summarize an article
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                url:
                  type: string
                length:
                  type: string
                  enum: [short, medium, long]
      responses:
        "200":
          description: Article summary
```

### Step 4: Test Your GPT

Try these prompts:
- "What's the latest crypto news?"
- "Search for Ethereum ETF news"
- "How is Bitcoin sentiment right now?"
- "What's the Fear & Greed Index?"
- "Show me trending crypto topics"

### Step 5: Publish (Optional)

1. Click **"Save"**
2. Choose visibility (Private, Shared, Public)
3. Submit for review if making public

---

## Method 2: Developer Mode (MCP/SSE)

For ChatGPT Pro users with Developer Mode access.

### Step 1: Deploy MCP Server

```bash
# Clone the repo
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp

# Install dependencies
npm install

# Start HTTP/SSE server
npm run start:http
```

Or use the hosted version: `https://plugins.support/sse`

### Step 2: Create ChatGPT App

1. Go to [ChatGPT Settings → Apps → Advanced](https://chatgpt.com/#settings/Connectors/Advanced)
2. Enable **Developer Mode**
3. Click **"Create app"**

**Configuration:**
- **Name:** Free Crypto News
- **Protocol:** SSE
- **Endpoint:** `https://plugins.support/sse`
- **Authentication:** None

### Step 3: Use in Conversation

1. Start a new chat
2. Enable **Developer Mode** from the Plus menu
3. Select **Free Crypto News** app
4. Ask: "Use Free Crypto News to get the latest Bitcoin headlines"

---

## Example Conversations

### Daily Briefing

**User:** Give me a crypto market briefing

**ChatGPT:**
```
📊 **Crypto Market Briefing - February 2, 2026**

**Fear & Greed Index:** 72 (Greed) 📈

**Top Headlines:**
1. 🔥 Bitcoin breaks $95,000 as institutional demand surges
2. 📈 Ethereum Layer 2 TVL hits new all-time high of $50B
3. 🏛️ SEC approves first Solana ETF applications
4. 🐋 Whale moves 10,000 BTC to unknown wallet

**Sentiment Analysis:**
- Bitcoin: 🟢 Bullish (0.72)
- Ethereum: 🟢 Bullish (0.65)
- Overall Market: 🟢 Optimistic

**Trending Topics:**
#BitcoinETF #Layer2 #DeFiSummer #Staking
```

### Research Query

**User:** Search for news about crypto regulations in Europe

**ChatGPT:**
```
🔍 **Search Results: "crypto regulations Europe"**

Found 15 relevant articles:

1. **EU MiCA Implementation Begins**
   Source: CoinDesk | 2 hours ago
   The Markets in Crypto-Assets regulation officially...

2. **Germany Approves Crypto Tax Framework**
   Source: The Block | 5 hours ago
   New legislation clarifies capital gains treatment...

3. **UK FCA Extends Registration Deadline**
   Source: Decrypt | Yesterday
   Crypto firms given additional time to comply...

Would you like me to analyze the sentiment of these articles?
```

### Trading Insights

**User:** What arbitrage opportunities exist for Bitcoin right now?

**ChatGPT:**
```
💱 **BTC Arbitrage Opportunities**

| Buy Exchange | Sell Exchange | Spread |
|--------------|---------------|--------|
| Binance | Coinbase | +0.15% |
| Kraken | Gemini | +0.12% |
| KuCoin | Bitstamp | +0.08% |

⚠️ **Note:** Spreads account for typical fees. 
Always verify current prices before trading.

**Recent whale movements:**
🐋 5,000 BTC moved from Binance → Cold Wallet
```

---

## Troubleshooting

### "Action failed" Error

1. Check if the API is accessible: `curl https://cryptocurrency.cv/api/news`
2. Ensure your OpenAPI schema is valid
3. Try refreshing the GPT editor

### No Data Returned

1. The API may be rate-limited temporarily
2. Try with a smaller `limit` parameter
3. Check the specific endpoint works via curl

### Schema Import Fails

1. Copy the YAML manually instead of importing
2. Validate the schema at [editor.swagger.io](https://editor.swagger.io)
3. Ensure the URL is accessible (not blocked by firewall)

---

## Advanced: System Prompt Templates

### Crypto News Analyst
```
You are a professional crypto news analyst. When users ask about market events:
1. Always fetch current data using the API
2. Provide balanced analysis (bullish AND bearish views)
3. Cite sources for all claims
4. Include relevant price data
5. Warn about risks and volatility
```

### Trading Assistant
```
You are a crypto trading assistant. Focus on:
1. Real-time market data
2. Technical sentiment indicators
3. News-based trading signals
4. Risk management advice
5. Never provide financial advice
```

### Research Assistant
```
You are a crypto research assistant. For every query:
1. Search for relevant news first
2. Summarize key findings
3. Identify trends and patterns
4. Provide historical context
5. Cite multiple sources
```

---

## Links

- **OpenAPI Schema:** https://cryptocurrency.cv/chatgpt/openapi.yaml
- **API Documentation:** https://cryptocurrency.cv/docs/api
- **MCP Server:** https://github.com/nirholas/free-crypto-news/tree/main/mcp
- **Live API:** https://cryptocurrency.cv/api/news
