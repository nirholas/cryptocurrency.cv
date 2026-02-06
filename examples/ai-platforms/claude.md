# Claude Integration Guide

Complete guide for integrating Free Crypto News with Claude (Desktop & API).

## Integration Methods

| Method | Difficulty | Features | Requirements |
|--------|------------|----------|--------------|
| MCP Server (stdio) | ⭐⭐ Medium | 40 tools, real-time | Claude Desktop |
| MCP Server (SSE) | ⭐⭐ Medium | 40 tools, web-based | Claude API |
| Direct API | ⭐ Easy | Full API access | Claude API key |
| Claude Projects | ⭐ Easy | Context-based | Claude Pro |

---

## Method 1: MCP Server for Claude Desktop (Recommended)

### Step 1: Install the MCP Server

```bash
# Clone the repository
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp

# Install dependencies
npm install
```

### Step 2: Configure Claude Desktop

Find your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the MCP server configuration:

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/full/path/to/free-crypto-news/mcp/index.js"]
    }
  }
}
```

**Example (macOS):**
```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/Users/yourname/free-crypto-news/mcp/index.js"]
    }
  }
}
```

### Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop to load the MCP server.

### Step 4: Verify Installation

In Claude Desktop, you should see "crypto-news" in the available tools. Ask:

> "What tools do you have access to for crypto news?"

Claude should list the 14 available tools.

---

## Available MCP Tools (14 Total)

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_crypto_news` | Latest news from 7 sources | "Get the latest crypto news" |
| `search_crypto_news` | Search by keywords | "Search for Bitcoin ETF news" |
| `get_defi_news` | DeFi-specific news | "Show me DeFi news" |
| `get_bitcoin_news` | Bitcoin-specific news | "What's happening with Bitcoin?" |
| `get_breaking_news` | Last 2 hours breaking news | "Any breaking crypto news?" |
| `get_news_sources` | List available sources | "What sources do you use?" |
| `get_api_health` | Check API health | "Is the API working?" |
| `get_trending_topics` | Trending topics with sentiment | "What's trending in crypto?" |
| `get_crypto_stats` | Analytics and statistics | "Show me news analytics" |
| `analyze_news` | Topic + sentiment analysis | "Analyze today's crypto news" |
| `get_archive` | Historical news | "Get news from last week" |
| `get_archive_stats` | Archive statistics | "How big is the archive?" |
| `find_original_sources` | Source origin tracking | "Where did this news originate?" |
| `get_portfolio_news` | News for specific coins | "Get news for my BTC and ETH" |

---

## Method 2: Using Claude Projects

For Claude Pro users, you can create a project with crypto news context.

### Step 1: Create a New Project

1. Go to [Claude Projects](https://claude.ai/projects)
2. Click **"Create Project"**
3. Name it: "Crypto News Research"

### Step 2: Add Project Instructions

```
## Project Context: Crypto News Research

You have access to the Free Crypto News API for real-time cryptocurrency data.

### API Base URL
https://cryptocurrency.cv

### Key Endpoints

**News:**
- GET /api/news?limit={n} - Latest news (max 50)
- GET /api/search?q={query} - Search news
- GET /api/breaking - Breaking news (last 2 hours)
- GET /api/trending - Trending topics

**Market Data:**
- GET /api/coins - Top cryptocurrencies with prices
- GET /api/market/fear-greed - Fear & Greed Index
- GET /api/market/ohlc?coin={id} - OHLC candlestick data

**AI Analysis:**
- GET /api/ai/sentiment?asset={symbol} - Sentiment analysis
- POST /api/ai/summarize - Summarize articles
- POST /api/ai/ask - Ask questions about news

**Trading:**
- GET /api/trading/arbitrage - Arbitrage opportunities
- GET /api/trading/signals - Trading signals
- GET /api/trading/whales - Whale movements

### How to Use
When I ask about crypto news or markets:
1. Mentally construct the appropriate API call
2. Describe what data you would fetch
3. Provide analysis based on typical market patterns
4. Cite the endpoint for verification

For real data, I'll use curl or the MCP server integration.
```

### Step 3: Add Knowledge Files (Optional)

Upload these files to your project:
- API documentation (docs/API.md)
- Source list (data sources)
- Historical analysis examples

---

## Method 3: Direct API with Claude API

Use Claude's API to build automated crypto news systems.

### Python Example

```python
import anthropic
import requests

# Initialize Claude client
client = anthropic.Anthropic(api_key="your-api-key")

# Fetch crypto news
def get_crypto_news(limit=10):
    response = requests.get(
        f"https://cryptocurrency.cv/api/news?limit={limit}"
    )
    return response.json()

# Analyze news with Claude
def analyze_with_claude(news_data):
    articles_text = "\n\n".join([
        f"**{a['title']}**\n{a['description']}\nSource: {a['source']}"
        for a in news_data.get('articles', [])[:10]
    ])
    
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Analyze these crypto news articles and provide:
1. Overall market sentiment (bullish/bearish/neutral)
2. Key themes and trends
3. Potential market impact
4. Risk factors to watch

Articles:
{articles_text}"""
            }
        ]
    )
    return message.content[0].text

# Main workflow
if __name__ == "__main__":
    print("Fetching crypto news...")
    news = get_crypto_news(10)
    
    print("Analyzing with Claude...")
    analysis = analyze_with_claude(news)
    
    print("\n📊 CRYPTO NEWS ANALYSIS")
    print("=" * 50)
    print(analysis)
```

### JavaScript Example

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getCryptoNews(limit = 10) {
  const response = await fetch(
    `https://cryptocurrency.cv/api/news?limit=${limit}`
  );
  return response.json();
}

async function analyzeWithClaude(newsData) {
  const articlesText = newsData.articles
    .slice(0, 10)
    .map(a => `**${a.title}**\n${a.description}\nSource: ${a.source}`)
    .join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Analyze these crypto news articles and provide:
1. Overall market sentiment
2. Key themes and trends
3. Potential market impact
4. Risk factors

Articles:
${articlesText}`
      }
    ]
  });

  return message.content[0].text;
}

// Run analysis
const news = await getCryptoNews(10);
const analysis = await analyzeWithClaude(news);
console.log(analysis);
```

---

## Example Conversations

### Daily Briefing

**User:** Get me a complete crypto market briefing

**Claude (with MCP):**
```
I'll gather the latest data using the crypto news tools.

📊 **Crypto Market Briefing - February 2, 2026**

**Fear & Greed Index:** 68 (Greed)

**📰 Top Headlines:**
1. Bitcoin surges past $92,000 on ETF inflows
2. Ethereum's Dencun upgrade shows 40% gas reduction
3. Solana DEX volume hits record $5B daily
4. SEC delays decision on additional spot ETF applications

**📈 Market Sentiment:**
- Bitcoin: Bullish (0.75 confidence)
- Ethereum: Bullish (0.68 confidence)  
- Overall: Optimistic with caution on regulatory news

**🔥 Trending Topics:**
- #BitcoinETF (12,453 mentions)
- #DeFiSummer (8,234 mentions)
- #Layer2 (6,891 mentions)

**⚠️ Risks to Watch:**
- SEC regulatory uncertainty
- Whale movements showing distribution pattern
- High funding rates on perpetuals
```

### Research Query

**User:** Search for all news about Ethereum staking in the last week

**Claude (with MCP):**
```
I'll search the news archive for Ethereum staking content.

🔍 **Search Results: "Ethereum staking"**

Found 23 articles from the past week:

**High Impact:**
1. "Lido hits 10M ETH staked milestone" - The Block (2 days ago)
   Sentiment: Bullish | Impact: High

2. "Ethereum foundation clarifies staking rewards tax guidance" 
   - CoinDesk (3 days ago)
   Sentiment: Neutral | Impact: Medium

3. "New liquid staking protocol raises $30M" - Decrypt (4 days ago)
   Sentiment: Bullish | Impact: Medium

**Key Themes:**
- Liquid staking dominance growing
- Regulatory clarity improving
- Institutional staking interest increasing

**Sentiment Distribution:**
- Bullish: 65%
- Neutral: 28%
- Bearish: 7%

Would you like me to provide a deeper analysis on any of these topics?
```

### Portfolio Monitoring

**User:** Get news for my portfolio: BTC, ETH, SOL, AVAX

**Claude (with MCP):**
```
I'll fetch portfolio-specific news with price data.

💼 **Portfolio News Update**

**Bitcoin (BTC) - $92,345 (+2.3%)**
📰 3 new articles
- "Bitcoin mining difficulty hits all-time high"
- "MicroStrategy adds 5,000 BTC to holdings"
- "Lightning Network capacity exceeds 5,000 BTC"
Sentiment: 🟢 Bullish

**Ethereum (ETH) - $3,456 (+1.8%)**
📰 5 new articles
- "Dencun upgrade reduces L2 costs by 90%"
- "ETH staking rate approaches 28%"
Sentiment: 🟢 Bullish

**Solana (SOL) - $145.67 (+5.2%)**
📰 4 new articles  
- "Solana DEX volume surpasses Ethereum"
- "New mobile wallet gains 1M users"
Sentiment: 🟢 Very Bullish

**Avalanche (AVAX) - $42.34 (-0.5%)**
📰 2 new articles
- "Avalanche subnet launches for gaming"
Sentiment: 🟡 Neutral

**Portfolio Summary:**
Overall sentiment is bullish with SOL showing strongest momentum.
```

---

## Advanced: Custom System Prompts

### Crypto Research Analyst

```xml
<system>
You are an expert cryptocurrency research analyst with access to real-time 
news data through the Free Crypto News MCP server.

When analyzing the market:
1. Always fetch current data first using available tools
2. Provide balanced analysis considering bull and bear cases
3. Cite specific sources for claims
4. Include quantitative metrics where possible
5. Highlight risks and uncertainties
6. Never provide financial advice

Format responses with:
- Clear section headers
- Bullet points for key findings
- Emoji indicators for sentiment
- Data tables where appropriate
</system>
```

### Trading Signal Assistant

```xml
<system>
You are a crypto trading signal assistant with access to real-time market data.

Your workflow:
1. Fetch latest news and sentiment data
2. Analyze for trading-relevant signals
3. Identify potential opportunities and risks
4. Present findings clearly

Always include:
- Current sentiment readings
- News-based catalysts
- Risk warnings
- Disclaimer about not being financial advice
</system>
```

---

## Troubleshooting

### MCP Server Not Appearing

1. Check the config file path is correct
2. Verify the full path to `index.js`
3. Ensure Node.js is installed and in PATH
4. Check Claude Desktop logs for errors

**View logs (macOS):**
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

### Tools Not Working

1. Test the API directly:
```bash
curl https://cryptocurrency.cv/api/news?limit=5
```

2. Check if MCP server starts correctly:
```bash
cd /path/to/free-crypto-news/mcp
node index.js
```

3. Restart Claude Desktop completely

### Rate Limiting

The API has generous rate limits, but if you hit them:
1. Reduce the frequency of requests
2. Use caching for repeated queries
3. Consider self-hosting for heavy usage

---

## Links

- **MCP Server:** https://github.com/nirholas/free-crypto-news/tree/main/mcp
- **Claude Desktop:** https://claude.ai/download
- **Claude API:** https://docs.anthropic.com
- **MCP Documentation:** https://modelcontextprotocol.io
