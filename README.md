# 🆓 Free Crypto News API

**100% FREE. No API keys. No rate limits. No BS.**

Get real-time crypto news from 7 major sources with one API call.

```bash
curl https://free-crypto-news.vercel.app/api/news
```

That's it. It just works.

---

## Why?

Every crypto news API charges $30-300/month and requires API keys.

We said no.

| | Free Crypto News | CryptoPanic | Others |
|---|---|---|---|
| **Price** | 🆓 Free forever | $29-299/mo | Paid |
| **API Key** | ❌ None needed | Required | Required |
| **Rate Limit** | Unlimited* | 100-1000/day | Limited |
| **Sources** | 7 | 1 | Varies |
| **Self-host** | ✅ One click | No | No |

---

## Sources

We aggregate from **7 trusted outlets**:

- 🟠 **CoinDesk** — General crypto news
- 🔵 **The Block** — Institutional & research
- 🟢 **Decrypt** — Web3 & culture
- 🟡 **CoinTelegraph** — Global crypto news
- 🟤 **Bitcoin Magazine** — Bitcoin maximalist
- 🟣 **Blockworks** — DeFi & institutions
- 🔴 **The Defiant** — DeFi native

---

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/news` | Latest from all sources |
| `/api/search?q=bitcoin` | Search by keywords |
| `/api/defi` | DeFi-specific news |
| `/api/bitcoin` | Bitcoin-specific news |
| `/api/breaking` | Last 2 hours only |
| `/api/trending` | Trending topics with sentiment |
| `/api/analyze` | News with topic classification |
| `/api/stats` | Analytics & statistics |
| `/api/sources` | List all sources |
| `/api/health` | API & feed health status |
| `/api/rss` | Aggregated RSS feed |
| `/api/atom` | Aggregated Atom feed |
| `/api/opml` | OPML export for RSS readers |
| `/api/docs` | Interactive API documentation |
| `/api/webhooks` | Webhook registration |
| `/api/archive` | Historical news archive |
| `/api/push` | Web Push notifications |
| `/api/origins` | Find original news sources |
| `/api/portfolio` | Portfolio-based news + prices |

## SDKs & Components

| Package | Description |
|---------|-------------|
| [React](sdk/react/) | `<CryptoNews />` drop-in components |
| [TypeScript](sdk/typescript/) | Full TypeScript SDK |
| [Python](sdk/python/) | Zero-dependency Python client |
| [JavaScript](sdk/javascript/) | Browser & Node.js SDK |
| [Go](sdk/go/) | Go client library |
| [PHP](sdk/php/) | PHP SDK |

**Base URL:** `https://free-crypto-news.vercel.app`

**Failsafe Mirror:** `https://nirholas.github.io/free-crypto-news/`

### Query Parameters

| Parameter | Endpoints | Description |
|-----------|-----------|-------------|
| `limit` | All news endpoints | Max articles (1-50) |
| `source` | `/api/news` | Filter by source |
| `from` | `/api/news` | Start date (ISO 8601) |
| `to` | `/api/news` | End date (ISO 8601) |
| `page` | `/api/news` | Page number |
| `per_page` | `/api/news` | Items per page |
| `hours` | `/api/trending` | Time window (1-72) |
| `topic` | `/api/analyze` | Filter by topic |
| `sentiment` | `/api/analyze` | bullish/bearish/neutral |
| `feed` | `/api/rss`, `/api/atom` | all/defi/bitcoin |

---

## Response Format

```json
{
  "articles": [
    {
      "title": "Bitcoin Hits New ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin surpassed...",
      "pubDate": "2025-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2h ago"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2025-01-02T14:30:00Z"
}
```

---

# Integration Examples

Pick your platform. Copy the code. Ship it.

---

## 🐍 Python

**Zero dependencies.** Just copy the file.

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/python/crypto_news.py
```

```python
from crypto_news import CryptoNews

news = CryptoNews()

# Get latest news
for article in news.get_latest(5):
    print(f"📰 {article['title']}")
    print(f"   {article['source']} • {article['timeAgo']}")
    print(f"   {article['link']}\n")

# Search for topics
eth_news = news.search("ethereum,etf", limit=5)

# DeFi news
defi = news.get_defi(5)

# Bitcoin news
btc = news.get_bitcoin(5)

# Breaking (last 2 hours)
breaking = news.get_breaking(5)
```

**One-liner:**
```python
import urllib.request, json
news = json.loads(urllib.request.urlopen("https://free-crypto-news.vercel.app/api/news?limit=5").read())
print(news["articles"][0]["title"])
```

---

## 🟨 JavaScript / TypeScript

**Works in Node.js and browsers.**

### TypeScript SDK (npm)

```bash
npm install @nicholasrq/crypto-news
```

```typescript
import { CryptoNews } from '@nicholasrq/crypto-news';

const client = new CryptoNews();

// Fully typed responses
const articles = await client.getLatest(10);
const health = await client.getHealth();
```

### Vanilla JavaScript

```bash
curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/sdk/javascript/crypto-news.js
```

```javascript
import { CryptoNews } from './crypto-news.js';

const news = new CryptoNews();

// Get latest
const articles = await news.getLatest(5);
articles.forEach(a => console.log(`${a.title} - ${a.source}`));

// Search
const eth = await news.search("ethereum");

// DeFi / Bitcoin / Breaking
const defi = await news.getDefi(5);
const btc = await news.getBitcoin(5);
const breaking = await news.getBreaking(5);
```

**One-liner:**
```javascript
const news = await fetch("https://free-crypto-news.vercel.app/api/news?limit=5").then(r => r.json());
console.log(news.articles[0].title);
```

---

## 🤖 ChatGPT (Custom GPT)

Build a crypto news GPT in 2 minutes.

1. Go to [chat.openai.com](https://chat.openai.com) → Create GPT
2. Click **Configure** → **Actions** → **Create new action**
3. Paste this OpenAPI schema:

```yaml
openapi: 3.1.0
info:
  title: Free Crypto News
  version: 1.0.0
servers:
  - url: https://free-crypto-news.vercel.app
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
  /api/defi:
    get:
      operationId: getDefiNews
      summary: Get DeFi news
  /api/bitcoin:
    get:
      operationId: getBitcoinNews
      summary: Get Bitcoin news
  /api/breaking:
    get:
      operationId: getBreakingNews
      summary: Get breaking news
```

4. No authentication needed
5. Save and test: *"What's the latest crypto news?"*

Full schema: [`chatgpt/openapi.yaml`](chatgpt/openapi.yaml)

---

## 🔮 Claude Desktop (MCP)

Add crypto news to Claude Desktop.

**1. Clone & install:**
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp && npm install
```

**2. Add to config**

**Edit** `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Restart Claude.** Ask: *"Get me the latest crypto news"*

Or run locally:
```bash
cd mcp && npm install && node index.js
```

Full code: [`mcp/`](mcp/)

---

## 🦜 LangChain

```python
from langchain.tools import tool
import requests

@tool
def get_crypto_news(limit: int = 5) -> str:
    """Get latest cryptocurrency news from 7 sources."""
    r = requests.get(f"https://free-crypto-news.vercel.app/api/news?limit={limit}")
    return "\n".join([f"• {a['title']} ({a['source']})" for a in r.json()["articles"]])

@tool
def search_crypto_news(query: str) -> str:
    """Search crypto news by keyword."""
    r = requests.get(f"https://free-crypto-news.vercel.app/api/search?q={query}")
    return "\n".join([f"• {a['title']}" for a in r.json()["articles"]])

# Use in your agent
tools = [get_crypto_news, search_crypto_news]
```

Full example: [`examples/langchain-tool.py`](examples/langchain-tool.py)

---

## 🎮 Discord Bot

```javascript
const { Client, EmbedBuilder } = require('discord.js');

client.on('messageCreate', async (msg) => {
  if (msg.content === '!news') {
    const { articles } = await fetch('https://free-crypto-news.vercel.app/api/breaking?limit=5').then(r => r.json());
    
    const embed = new EmbedBuilder()
      .setTitle('🚨 Breaking Crypto News')
      .setColor(0x00ff00);
    
    articles.forEach(a => embed.addFields({ 
      name: a.source, 
      value: `[${a.title}](${a.link})` 
    }));
    
    msg.channel.send({ embeds: [embed] });
  }
});
```

Full bot: [`examples/discord-bot.js`](examples/discord-bot.js)

---

## 🤖 Telegram Bot

```python
from telegram import Update
from telegram.ext import Application, CommandHandler
import aiohttp

async def news(update: Update, context):
    async with aiohttp.ClientSession() as session:
        async with session.get('https://free-crypto-news.vercel.app/api/news?limit=5') as r:
            data = await r.json()
    
    msg = "📰 *Latest Crypto News*\n\n"
    for a in data['articles']:
        msg += f"• [{a['title']}]({a['link']})\n"
    
    await update.message.reply_text(msg, parse_mode='Markdown')

app = Application.builder().token("YOUR_TOKEN").build()
app.add_handler(CommandHandler("news", news))
app.run_polling()
```

Full bot: [`examples/telegram-bot.py`](examples/telegram-bot.py)

---

## 🌐 HTML Widget

Embed on any website:

```html
<script>
async function loadNews() {
  const { articles } = await fetch('https://free-crypto-news.vercel.app/api/news?limit=5').then(r => r.json());
  document.getElementById('news').innerHTML = articles.map(a => 
    `<div><a href="${a.link}">${a.title}</a> <small>${a.source}</small></div>`
  ).join('');
}
loadNews();
</script>
<div id="news">Loading...</div>
```

Full styled widget: [`widget/crypto-news-widget.html`](widget/crypto-news-widget.html)

---

## 🖥️ cURL / Terminal

```bash
# Latest news
curl -s https://free-crypto-news.vercel.app/api/news | jq '.articles[:3]'

# Search
curl -s "https://free-crypto-news.vercel.app/api/search?q=bitcoin,etf" | jq

# DeFi news
curl -s https://free-crypto-news.vercel.app/api/defi | jq

# Pretty print titles
curl -s https://free-crypto-news.vercel.app/api/news | jq -r '.articles[] | "📰 \(.title) (\(.source))"'
```

---

# Self-Hosting

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news)

## Manual

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news
pnpm install
pnpm dev
```

Open http://localhost:3000/api/news

---

# Tech Stack

- **Runtime:** Next.js 14 Edge Functions
- **Hosting:** Vercel free tier
- **Data:** Direct RSS parsing (no database)
- **Cache:** 5-minute edge cache

---

# Contributing

PRs welcome! Ideas:

- [ ] More news sources
- [ ] Sentiment analysis
- [ ] Topic classification
- [ ] WebSocket real-time feed
- [ ] Go / Rust / Ruby SDKs

---

# New Features

## 📡 RSS Feed Output

Subscribe to the aggregated feed in any RSS reader:

```
https://free-crypto-news.vercel.app/api/rss
https://free-crypto-news.vercel.app/api/rss?feed=defi
https://free-crypto-news.vercel.app/api/rss?feed=bitcoin
```

## 🏥 Health Check

Monitor API and source health:

```bash
curl https://free-crypto-news.vercel.app/api/health | jq
```

Returns status of all 7 RSS sources with response times.

## 📖 Interactive Docs

Swagger UI documentation:

```
https://free-crypto-news.vercel.app/api/docs
```

## 🔔 Webhooks

Register for push notifications:

```bash
curl -X POST https://free-crypto-news.vercel.app/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.com/webhook", "secret": "your-secret"}'
```

---

## 📊 Trending & Analytics

### Trending Topics

```bash
curl https://free-crypto-news.vercel.app/api/trending?hours=24
```

Returns topics with sentiment (bullish/bearish/neutral) and mention counts.

### News with Classification

```bash
# Get all analyzed news
curl https://free-crypto-news.vercel.app/api/analyze

# Filter by topic
curl "https://free-crypto-news.vercel.app/api/analyze?topic=DeFi"

# Filter by sentiment
curl "https://free-crypto-news.vercel.app/api/analyze?sentiment=bullish"
```

### Statistics

```bash
curl https://free-crypto-news.vercel.app/api/stats
```

Returns articles per source, hourly distribution, and category breakdown.

---

## 📦 SDKs

| Language | Install |
|----------|---------|
| TypeScript | `npm install @nicholasrq/crypto-news` |
| Python | `curl -O .../sdk/python/crypto_news.py` |
| Go | `go get github.com/nirholas/free-crypto-news/sdk/go` |
| PHP | `curl -O .../sdk/php/CryptoNews.php` |
| JavaScript | `curl -O .../sdk/javascript/crypto-news.js` |

See [`/sdk`](./sdk) for documentation.

---

## 🤖 Integrations

- **Claude Desktop MCP**: [`/mcp`](./mcp)
- **ChatGPT Plugin**: [`/chatgpt`](./chatgpt)
- **Postman Collection**: [`/postman`](./postman)
- **Bot Examples**: Discord, Telegram, Slack in [`/examples`](./examples)
- **Embeddable Widget**: [`/widget`](./widget)

---

## 📚 Historical Archive

Query historical news data stored in GitHub:

```bash
# Get archive statistics
curl "https://free-crypto-news.vercel.app/api/archive?stats=true"

# Query by date range
curl "https://free-crypto-news.vercel.app/api/archive?start_date=2025-01-01&end_date=2025-01-07"

# Search historical articles
curl "https://free-crypto-news.vercel.app/api/archive?q=bitcoin&limit=50"

# Get archive index
curl "https://free-crypto-news.vercel.app/api/archive?index=true"
```

Archive is automatically updated every 6 hours via GitHub Actions.

---

## 🛡️ Failsafe Mirror

If the main Vercel deployment is down, use the **GitHub Pages backup**:

### Failsafe URL
```
https://nirholas.github.io/free-crypto-news/
```

### Static JSON Endpoints
| Endpoint | Description |
|----------|-------------|
| `/cache/latest.json` | Latest cached news (hourly) |
| `/cache/bitcoin.json` | Bitcoin news cache |
| `/cache/defi.json` | DeFi news cache |
| `/cache/trending.json` | Trending topics cache |
| `/cache/sources.json` | Source list |
| `/archive/index.json` | Historical archive index |

### Status Page
```
https://nirholas.github.io/free-crypto-news/status.html
```

Real-time monitoring of all API endpoints with auto-refresh.

### How It Works

1. **GitHub Actions** runs every hour to cache data from main API
2. **GitHub Pages** serves the static JSON files
3. **Failsafe page** auto-detects if main API is down and switches to cache
4. **Archive workflow** runs every 6 hours to store historical data

### Client-Side Failsafe Pattern

```javascript
const MAIN_API = 'https://free-crypto-news.vercel.app';
const FAILSAFE = 'https://nirholas.github.io/free-crypto-news';

async function getNews() {
  try {
    // Try main API first (5s timeout)
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${MAIN_API}/api/news`, { signal: controller.signal });
    if (res.ok) return res.json();
    throw new Error('API error');
  } catch {
    // Fallback to GitHub Pages cache
    const res = await fetch(`${FAILSAFE}/cache/latest.json`);
    return res.json();
  }
}
```

---

## 🔍 Original Source Finder

Track where news originated before being picked up by aggregators:

```bash
# Find original sources for recent news
curl "https://free-crypto-news.vercel.app/api/origins?limit=20"

# Filter by source type
curl "https://free-crypto-news.vercel.app/api/origins?source_type=government"

# Search specific topic
curl "https://free-crypto-news.vercel.app/api/origins?q=SEC"
```

Source types: `official`, `press-release`, `social`, `blog`, `government`

Identifies sources like SEC, Federal Reserve, Binance, Coinbase, Vitalik Buterin, X/Twitter, etc.

---

## 🔔 Web Push Notifications

Subscribe to real-time push notifications:

```javascript
// Get VAPID public key
const { publicKey } = await fetch('https://free-crypto-news.vercel.app/api/push').then(r => r.json());

// Register subscription
await fetch('https://free-crypto-news.vercel.app/api/push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subscription: pushSubscription,
    topics: ['bitcoin', 'breaking', 'defi']
  })
});
```

---

## 🎨 Embeddable Widgets

### News Ticker
```html
<div id="crypto-ticker" class="crypto-ticker" data-auto-init>
  <div class="crypto-ticker-label">📰 CRYPTO</div>
  <div class="crypto-ticker-track"></div>
</div>
<script src="https://nirholas.github.io/free-crypto-news/widget/ticker.js"></script>
```

### News Carousel
```html
<div id="crypto-carousel" class="crypto-carousel" data-auto-init>
  <div class="crypto-carousel-viewport">
    <div class="crypto-carousel-track"></div>
  </div>
</div>
<script src="https://nirholas.github.io/free-crypto-news/widget/carousel.js"></script>
```

See full widget examples in [`/widget`](./widget)

---

# License

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Stop paying for crypto news APIs.</b><br>
  <sub>Made with 💜 for the community</sub>
</p>
