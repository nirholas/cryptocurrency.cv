🌐 **Languages:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [Русский](README.ru.md) | [Italiano](README.it.md) | [Nederlands](README.nl.md) | [Polski](README.pl.md) | [Türkçe](README.tr.md) | [Tiếng Việt](README.vi.md) | [ไทย](README.th.md) | [Bahasa Indonesia](README.id.md)

---

# 🆓 Free Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/free-crypto-news/stargazers"><img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/free-crypto-news/blob/main/LICENSE"><img src="https://img.shields.io/github/license/nirholas/free-crypto-news?style=for-the-badge&color=blue" alt="License"></a>
  <a href="https://github.com/nirholas/free-crypto-news/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/nirholas/free-crypto-news/ci.yml?style=for-the-badge&logo=github-actions&label=CI" alt="CI Status"></a>
  <a href="https://github.com/nirholas/free-crypto-news/issues"><img src="https://img.shields.io/github/issues/nirholas/free-crypto-news?style=for-the-badge&color=orange" alt="Issues"></a>
  <a href="https://github.com/nirholas/free-crypto-news/pulls"><img src="https://img.shields.io/github/issues-pr/nirholas/free-crypto-news?style=for-the-badge&color=purple" alt="Pull Requests"></a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

> ⭐ **If you find this useful, please star the repo!** It helps others discover this project and motivates continued development.

---
Get real-time crypto news from 7 major sources with one API call.

```bash
curl https://free-crypto-news.vercel.app/api/news
```
---



| | Free Crypto News | CryptoPanic | Others |
|---|---|---|---|
| **Price** | 🆓 Free forever | $29-299/mo | Paid |
| **API Key** | ❌ None needed | Required | Required |
| **Rate Limit** | Unlimited* | 100-1000/day | Limited |
| **Sources** | 12 English + 12 International | 1 | Varies |
| **International** | 🌏 KO, ZH, JA, ES + translation | No | No |
| **Self-host** | ✅ One click | No | No |
| **PWA** | ✅ Installable | No | No |
| **MCP** | ✅ Claude + ChatGPT | No | No |

---

## 🌿 Branches

| Branch | Description |
|--------|-------------|
| `main` | Stable production branch — Original API-focused design |
| `redesign/pro-news-ui` | Premium UI redesign — CoinDesk/CoinTelegraph-style with dark mode, enhanced components, SEO structured data, and full PWA support |

To try the redesign locally:
```bash
git checkout redesign/pro-news-ui
npm install && npm run dev
```

---

## 🌍 International News Sources

Get crypto news from **12 international sources** in Korean, Chinese, Japanese, and Spanish — with automatic English translation!

### Supported Sources

| Region | Sources |
|--------|---------|
| 🇰🇷 **Korea** | Block Media, TokenPost, CoinDesk Korea |
| 🇨🇳 **China** | 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报) |
| 🇯🇵 **Japan** | CoinPost, CoinDesk Japan, Cointelegraph Japan |
| 🇪🇸 **Latin America** | Cointelegraph Español, Diario Bitcoin, CriptoNoticias |

### Quick Examples

```bash
# Get all international news
curl "https://free-crypto-news.vercel.app/api/news/international"

# Get Korean news with English translation
curl "https://free-crypto-news.vercel.app/api/news/international?language=ko&translate=true"

# Get Asian region news
curl "https://free-crypto-news.vercel.app/api/news/international?region=asia&limit=20"
```

### Features

- ✅ **Auto-translation** to English via Groq AI
- ✅ **7-day translation cache** for efficiency
- ✅ **Original + English** text preserved
- ✅ **Rate-limited** (1 req/sec) to respect APIs
- ✅ **Fallback handling** for unavailable sources
- ✅ **Deduplication** across sources

See [API docs](docs/API.md#get-apinewsinternational) for full details.

---

## 📱 Progressive Web App (PWA)

Free Crypto News is a **fully installable PWA** that works offline!

### Features

| Feature | Description |
|---------|-------------|
| 📲 **Installable** | Add to home screen on any device |
| 📴 **Offline Mode** | Read cached news without internet |
| 🔔 **Push Notifications** | Get breaking news alerts |
| ⚡ **Lightning Fast** | Aggressive caching strategies |
| 🔄 **Background Sync** | Auto-updates when back online |
| 🎯 **App Shortcuts** | Quick access to Latest, Breaking, Bitcoin |
| 📤 **Share Target** | Share links directly to the app |
| 🚨 **Real-Time Alerts** | Configurable alerts for price & news conditions |

### Install the App

**Desktop (Chrome/Edge):**
1. Visit [free-crypto-news.vercel.app](https://free-crypto-news.vercel.app)
2. Click the install icon (⊕) in the address bar
3. Click "Install"

**iOS Safari:**
1. Visit the site in Safari
2. Tap Share (📤) → "Add to Home Screen"

**Android Chrome:**
1. Visit the site
2. Tap the install banner or Menu → "Install app"

### Service Worker Caching

The PWA uses smart caching strategies:

| Content | Strategy | Cache Duration |
|---------|----------|----------------|
| API responses | Network-first | 5 minutes |
| Static assets | Cache-first | 7 days |
| Images | Cache-first | 30 days |
| Navigation | Network-first + offline fallback | 24 hours |

### Keyboard Shortcuts

Power through news with keyboard navigation:

| Shortcut | Action |
|----------|--------|
| `j` / `k` | Next / previous article |
| `/` | Focus search |
| `Enter` | Open selected article |
| `d` | Toggle dark mode |
| `g h` | Go to Home |
| `g t` | Go to Trending |
| `g s` | Go to Sources |
| `g b` | Go to Bookmarks |
| `?` | Show all shortcuts |
| `Escape` | Close modal |

📖 **Full user guide:** [docs/USER-GUIDE.md](docs/USER-GUIDE.md)

---

## 🌐 Interactive Pages

The web interface provides rich, interactive pages for exploring crypto data:

### 📰 News & Content

| Page | Description |
|------|-------------|
| `/` | Home page with latest news feed |
| `/breaking` | Breaking news in last 2 hours |
| `/trending` | Trending topics & sentiment |
| `/search` | Full-text search with filters |
| `/sources` | Browse news by source |
| `/categories` | Browse by category |
| `/tags/[slug]` | Tag-based news filtering |
| `/article/[slug]` | Article detail page |

### 📊 Market Data

| Page | Description |
|------|-------------|
| `/markets` | Market overview with prices |
| `/coin/[coinId]` | Detailed coin page (CoinGecko-quality) |
| `/fear-greed` | Fear & Greed Index with breakdown |
| `/funding` | Funding rates across exchanges |
| `/signals` | AI trading signals (educational) |
| `/whales` | Whale alert tracking |

### 🧠 AI Analysis

| Page | Description |
|------|-------------|
| `/factcheck` | Claim verification dashboard |
| `/entities` | Entity extraction viewer |
| `/claims` | Extracted claims browser |
| `/clickbait` | Clickbait detection & scoring |
| `/narratives` | Market narrative tracking |
| `/onchain` | On-chain event correlation |
| `/origins` | Original source finder |
| `/citations` | Citation network explorer |

### 🔬 Research Tools

| Page | Description |
|------|-------------|
| `/backtest` | News-based strategy backtesting |
| `/influencers` | Influencer prediction tracking |
| `/predictions` | Prediction market integration |
| `/calendar` | Crypto events calendar |
| `/portfolio` | Portfolio-based news feed |

### ⚙️ User Features

| Page | Description |
|------|-------------|
| `/settings` | User preferences & themes |
| `/notifications` | Notification settings |
| `/watchlist` | Personalized watchlist |
| `/bookmarks` | Saved articles |
| `/alerts` | Custom alert configuration |
| `/api-keys` | API key management |
| `/stats` | Site statistics |

### 📖 Documentation

| Page | Description |
|------|-------------|
| `/docs` | Interactive API documentation |
| `/examples` | Code examples & demos |
| `/status` | API & service health |

---

### Generate PNG Icons

SVG icons work in modern browsers. For legacy support:

```bash
npm install sharp
npm run pwa:icons
```

---

## Sources

We aggregate from **120+ trusted outlets** across multiple categories:

### 📰 Tier 1 News Outlets
- 🟠 **CoinDesk** — General crypto news
- 🔵 **The Block** — Institutional & research
- 🟢 **Decrypt** — Web3 & culture
- 🟡 **CoinTelegraph** — Global crypto news
- 🟤 **Bitcoin Magazine** — Bitcoin maximalist
- 🟣 **Blockworks** — DeFi & institutions
- 🔴 **The Defiant** — DeFi native

### 🏦 Institutional Research
- **Galaxy Digital** — Institutional-grade research
- **Grayscale** — Market reports
- **CoinShares** — Weekly fund flows
- **Pantera Capital** — Blockchain letters
- **Multicoin Capital** — Investment thesis
- **ARK Invest** — Innovation research

### 📊 On-Chain Analytics
- **Glassnode** — On-chain metrics
- **Messari** — Protocol research
- **Kaiko** — Market microstructure
- **CryptoQuant** — Exchange flows
- **Coin Metrics** — Network data

### 🎯 Macro & Quant
- **Lyn Alden** — Macro analysis
- **AQR Insights** — Quantitative research
- **Two Sigma** — Data science
- **Deribit Insights** — Options/derivatives

### 💼 Traditional Finance
- **Bloomberg Crypto** — Mainstream coverage
- **Reuters Crypto** — Wire service
- **Goldman Sachs** — Bank research
- **Finextra** — Fintech news

---

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/news` | Latest from all sources |
| `/api/news?category=institutional` | Filter by category |
| `/api/news/categories` | List all categories |
| `/api/search?q=bitcoin` | Search by keywords |
| `/api/defi` | DeFi-specific news |
| `/api/bitcoin` | Bitcoin-specific news |
| `/api/breaking` | Last 2 hours only |

### 📂 Category Filter

Filter news by specialized categories:

```bash
# Get institutional/VC research
curl "https://free-crypto-news.vercel.app/api/news?category=institutional"

# Get on-chain analytics news
curl "https://free-crypto-news.vercel.app/api/news?category=onchain"

# Get ETF and asset manager news
curl "https://free-crypto-news.vercel.app/api/news?category=etf"

# Get macro economic analysis
curl "https://free-crypto-news.vercel.app/api/news?category=macro"

# Get quantitative research
curl "https://free-crypto-news.vercel.app/api/news?category=quant"

# List all available categories
curl "https://free-crypto-news.vercel.app/api/news/categories"
```

Available categories: `general`, `bitcoin`, `defi`, `nft`, `research`, `institutional`, `etf`, `derivatives`, `onchain`, `fintech`, `macro`, `quant`, `journalism`, `ethereum`, `asia`, `tradfi`, `mainstream`, `mining`, `gaming`, `altl1`, `stablecoin`

### 🌍 API Translation (18 Languages)

All news endpoints support real-time translation via the `?lang=` parameter:

```bash
# Get news in Spanish
curl "https://free-crypto-news.vercel.app/api/news?lang=es"

# Get breaking news in Japanese
curl "https://free-crypto-news.vercel.app/api/breaking?lang=ja"

# Get DeFi news in Arabic
curl "https://free-crypto-news.vercel.app/api/defi?lang=ar"

# Get Bitcoin news in Chinese (Simplified)
curl "https://free-crypto-news.vercel.app/api/bitcoin?lang=zh-CN"
```

**Supported Languages:** `en`, `es`, `fr`, `de`, `pt`, `ja`, `zh-CN`, `zh-TW`, `ko`, `ar`, `ru`, `it`, `nl`, `pl`, `tr`, `vi`, `th`, `id`

**Requirements:**
- Set `GROQ_API_KEY` environment variable (FREE at [console.groq.com/keys](https://console.groq.com/keys))
- Set `FEATURE_TRANSLATION=true` to enable

**Endpoints with Translation Support:**
| Endpoint | `?lang=` Support |
|----------|------------------|
| `/api/news` | ✅ |
| `/api/breaking` | ✅ |
| `/api/defi` | ✅ |
| `/api/bitcoin` | ✅ |
| `/api/archive` | ✅ |
| `/api/archive/v2` | ✅ |
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
| `/api/news/international` | International sources with translation |

### 🤖 AI-Powered Endpoints (FREE via Groq)

| Endpoint | Description |
|----------|-------------|
| `/api/summarize` | AI summaries of articles |
| `/api/ask?q=...` | Ask questions about crypto news |
| `/api/digest` | AI-generated daily news digest |
| `/api/sentiment` | Deep sentiment analysis per article |
| `/api/entities` | Extract people, companies, tickers |
| `/api/narratives` | Identify market narratives & themes |
| `/api/signals` | News-based trading signals (educational) |
| `/api/factcheck` | Extract & verify claims |
| `/api/clickbait` | Detect clickbait headlines |
| `/api/classify` | Event classification (13 types) |
| `/api/claims` | Claim extraction with attribution |
| `/api/ai/brief` | AI-generated article briefs |
| `/api/ai/counter` | Counter-arguments generation |
| `/api/ai/debate` | AI debate on crypto topics |
| `/api/ai/oracle` | The Oracle - AI-powered crypto oracle chat |
| `/api/ai/agent` | AI market agent for autonomous analysis |
| `/api/ai/relationships` | Extract entity relationships from news |
| `/api/detect/ai-content` | Detect AI-generated content in articles |

### 📊 Analytics & Intelligence

| Endpoint | Description |
|----------|-------------|
| `/api/analytics/anomalies` | Detect unusual coverage patterns |
| `/api/analytics/credibility` | Source credibility scoring |
| `/api/analytics/headlines` | Headline tracking & mutations |
| `/api/analytics/usage` | API key usage analytics & insights |
| `/api/analytics/influencers` | Influencer credibility scoring |
| `/api/analytics/causality` | News causality analysis |
| `/api/analytics/forensics` | News forensics & origin tracking |
| `/api/analytics/gaps` | Coverage gap detection |
| `/api/analytics/news-onchain` | News-to-onchain correlation |

### 🔗 Relationship & Entity Analysis

| Endpoint | Description |
|----------|-------------|
| `/api/relationships` | Extract "who did what to whom" from news |
| `/api/predictions` | Track predictions & accuracy scoring |
| `/api/onchain/events` | Link news to on-chain events |

### 💼 Portfolio Tools

| Endpoint | Description |
|----------|-------------|
| `/api/portfolio` | Portfolio-based news + prices |
| `/api/portfolio/performance` | Performance charts, P&L, risk metrics |
| `/api/portfolio/tax` | Tax report generation (Form 8949) |

### � Research & Backtesting

| Endpoint | Description |
|----------|-------------|
| `/api/research/backtest` | Strategy backtesting with historical news data |
| `/api/academic` | Academic access program registration |
| `/api/citations` | Academic citation network analysis |
| `/api/predictions` | Prediction tracking with accuracy scoring |

**Backtest Example:**
```bash
# Backtest a sentiment-based strategy
curl -X POST "https://fcn.dev/api/research/backtest" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "sentiment_momentum", "asset": "BTC", "period": "1y"}'
```

### 📡 Social Monitoring

| Endpoint | Description |
|----------|-------------|
| `/api/social/monitor` | Discord & Telegram channel monitoring via webhooks |
| `/api/social/influencer-score` | Influencer reliability scoring |

**Social Monitor Example:**
```bash
# Ingest messages via webhook integration
curl -X POST "https://fcn.dev/api/social/monitor" \
  -H "Content-Type: application/json" \
  -d '{"platform": "discord", "channel": "alpha-chat", "content": "BTC bullish"}'
```

### 🗄️ Data Storage & Export

| Endpoint | Description |
|----------|-------------|
| `/api/storage/cas` | Content-addressable storage (IPFS-style hashing) |
| `/api/export` | Export data in CSV/JSON/Parquet formats |
| `/api/exports` | Bulk export job management |
| `/api/exports/[id]` | Download export file |

### �🔔 Real-Time & Infrastructure

| Endpoint | Description |
|----------|-------------|
| `/api/sse` | Server-Sent Events for real-time news stream |
| `/api/ws` | WebSocket connection info & SSE fallback |
| `/api/webhooks` | Webhook registration & management |
| `/api/push` | Web Push notification registration |
| `/api/newsletter/subscribe` | Newsletter subscription |
| `/api/alerts` | Price & news alerts |
| `/api/cache` | Cache management |
| `/api/views` | Article view tracking |
| `/api/keys` | API key management |
| `/api/gateway` | Unified API gateway |
| `/api/billing` | Subscription & billing management |
| `/api/billing/usage` | Current billing usage |
| `/api/upgrade` | API key tier upgrades (x402) |
| `/api/register` | User registration |

**SSE Real-Time Stream:**
```javascript
const events = new EventSource('/api/sse?sources=coindesk,theblock');
events.onmessage = (e) => console.log(JSON.parse(e.data));
```

### 🐦 Social Intelligence

| Endpoint | Description |
|----------|-------------|
| `/api/social/discord` | Discord channel monitoring |
| `/api/social/x/lists` | Manage X/Twitter influencer lists |
| `/api/social/x/sentiment` | X sentiment from custom influencer lists |

### 🐦 X/Twitter Sentiment (No API Key!)

Automated X/Twitter sentiment analysis without paid API:

```bash
# Get sentiment from default crypto influencers
curl https://fcn.dev/api/social/x/sentiment

# Create custom influencer list
curl -X POST https://fcn.dev/api/social/x/lists \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ETH Builders",
    "users": [
      {"username": "VitalikButerin", "category": "founder", "weight": 0.9},
      {"username": "sassal0x", "category": "influencer", "weight": 0.8}
    ]
  }'

# Get sentiment from your list
curl https://fcn.dev/api/social/x/sentiment?list=list_xxx
```

**Features:**
- ✅ **No API key required** - Uses Nitter RSS feeds
- ✅ **Automated cron** - Updates every 30 minutes
- ✅ **Custom lists** - Track your own influencers
- ✅ **AI analysis** - Groq-powered sentiment scoring
- ✅ **Webhook alerts** - Discord/Slack/Telegram notifications

### 📈 Market Data

| Endpoint | Description |
|----------|-------------|
| `/api/market/coins` | List all coins with market data |
| `/api/market/trending` | Trending cryptocurrencies |
| `/api/market/categories` | Market categories |
| `/api/market/exchanges` | Exchange listings |
| `/api/market/search` | Search coins |
| `/api/market/compare` | Compare multiple coins |
| `/api/market/history/[coinId]` | Historical price data |
| `/api/market/ohlc/[coinId]` | OHLC candlestick data |
| `/api/market/snapshot/[coinId]` | Real-time coin snapshot |
| `/api/market/social/[coinId]` | Social metrics for coin |
| `/api/market/tickers/[coinId]` | Trading pairs for coin |
| `/api/market/defi` | DeFi market overview |
| `/api/market/derivatives` | Derivatives market data |
| `/api/charts` | Chart data for visualizations |
| `/api/fear-greed` | Crypto Fear & Greed Index with 30-day history |

### 🏗️ DeFi Tools

| Endpoint | Description |
|----------|-------------|
| `/api/defi` | DeFi news and protocol coverage |
| `/api/defi/protocol-health` | Protocol health & risk scoring |
| `/api/defi/protocol-health?action=ranking` | Protocol safety rankings |
| `/api/defi/protocol-health?action=incidents` | Security incident tracker |

**Protocol Health Example:**
```bash
# Get AAVE v3 health score
curl "https://fcn.dev/api/defi/protocol-health?protocol=aave-v3"

# Get top lending protocols by safety
curl "https://fcn.dev/api/defi/protocol-health?action=ranking&category=lending"

# Get recent security incidents
curl "https://fcn.dev/api/defi/protocol-health?action=incidents&limit=20"
```

### 📺 Integrations

| Endpoint | Description |
|----------|-------------|
| `/api/integrations/tradingview` | TradingView widgets & Pine Script generation |
| `/api/tradingview` | TradingView webhook receiver |

**TradingView Example:**
```bash
# Get chart widget embed code
curl "https://fcn.dev/api/integrations/tradingview?action=widget&type=chart&symbol=BTC"

# Generate Pine Script indicator
curl "https://fcn.dev/api/integrations/tradingview?action=indicator&name=newsAlert"
```

### 📊 Trading Tools

| Endpoint | Description |
|----------|-------------|
| `/api/arbitrage` | Cross-exchange arbitrage scanner with triangular arb |
| `/api/trading/arbitrage` | Real-time arbitrage opportunities (spot + triangular) |
| `/api/funding` | Funding rate dashboard (Binance, Bybit, OKX, Hyperliquid) |
| `/api/options` | Options flow, volatility surface, max pain, gamma exposure |
| `/api/trading/options` | Options dashboard from Deribit, OKX, Bybit |
| `/api/liquidations` | Real-time liquidations feed (CoinGlass integration) |
| `/api/orderbook` | Multi-exchange order book aggregation |
| `/api/trading/orderbook` | Aggregated orderbook with slippage & liquidity analysis |

**Arbitrage Scanner Example:**
```bash
# Get cross-exchange arbitrage opportunities
curl "https://fcn.dev/api/arbitrage?minProfit=0.5&limit=20"

# Get triangular arbitrage opportunities
curl "https://fcn.dev/api/trading/arbitrage?type=triangular&minSpread=0.3"
```

**Options Flow Example:**
```bash
# Get options dashboard
curl "https://fcn.dev/api/options?view=dashboard&underlying=BTC"

# Get max pain analysis
curl "https://fcn.dev/api/trading/options?view=maxpain&underlying=ETH"

# Get volatility surface
curl "https://fcn.dev/api/trading/options?view=surface"
```

**Order Book Example:**
```bash
# Get aggregated order book
curl "https://fcn.dev/api/orderbook?symbol=BTC&market=spot"

# Estimate slippage for $100k order
curl "https://fcn.dev/api/trading/orderbook?symbol=BTCUSDT&view=slippage&size=100000"
```

### 🐋 Whale Intelligence

| Endpoint | Description |
|----------|-------------|
| `/api/whale-alerts` | Monitor large transactions across blockchains |
| `/api/influencers` | Influencer reliability tracking & prediction scoring |

**Whale Alerts Example:**
```bash
# Get recent whale transactions
curl "https://fcn.dev/api/whale-alerts?limit=50"

# Filter by blockchain
curl "https://fcn.dev/api/whale-alerts?blockchain=ethereum&minUsd=1000000"
```

### 🏛️ Regulatory Intelligence

| Endpoint | Description |
|----------|-------------|
| `/api/regulatory` | Regulatory news with jurisdiction & agency tracking |
| `/api/regulatory?action=jurisdictions` | Jurisdiction profiles |
| `/api/regulatory?action=agencies` | Agency information |
| `/api/regulatory?action=deadlines` | Upcoming compliance deadlines |
| `/api/regulatory?action=summary` | Intelligence summary |

### 📰 Coverage & Research

| Endpoint | Description |
|----------|-------------|
| `/api/coverage-gap` | Analyze under-covered topics and assets |
| `/api/extract` | Full article content extraction from URLs |
| `/api/academic` | Academic access program for researchers |
| `/api/citations` | Citation network analysis for academic papers |

### 💎 Premium API (x402 Micropayments)

Premium endpoints powered by x402 USDC micropayments. Pay per request or get access passes.

| Endpoint | Description | Price |
|----------|-------------|-------|
| `/api/premium` | Premium API documentation & pricing | Free |
| `/api/premium/ai/sentiment` | Advanced AI sentiment analysis | $0.02 |
| `/api/premium/ai/analyze` | Deep article analysis | $0.03 |
| `/api/premium/ai/signals` | Premium trading signals | $0.05 |
| `/api/premium/ai/summary` | Extended summaries | $0.02 |
| `/api/premium/ai/compare` | Multi-asset AI comparison | $0.03 |
| `/api/premium/whales/alerts` | Real-time whale alerts | $0.05 |
| `/api/premium/whales/transactions` | Whale transaction history | $0.03 |
| `/api/premium/smart-money` | Smart money flow tracking | $0.05 |
| `/api/premium/screener/advanced` | Advanced coin screener | $0.03 |
| `/api/premium/analytics/screener` | Analytics screener | $0.03 |
| `/api/premium/market/coins` | Premium market data | $0.02 |
| `/api/premium/market/history` | Extended price history | $0.02 |
| `/api/premium/defi/protocols` | DeFi protocol analytics | $0.03 |
| `/api/premium/streams/prices` | Real-time price streams | $0.01 |
| `/api/premium/portfolio/analytics` | Portfolio analytics | $0.03 |
| `/api/premium/export/portfolio` | Portfolio data export | $0.05 |
| `/api/premium/alerts/whales` | Whale alert configuration | $0.02 |
| `/api/premium/alerts/custom` | Custom alert rules | $0.02 |
| `/api/premium/api-keys` | API key management | Free |

**Access Passes:**
| Pass | Price | Duration |
|------|-------|----------|
| 1 Hour Pass | $0.25 | 1 hour |
| 24 Hour Pass | $2.00 | 24 hours |
| Weekly Pass | $10.00 | 7 days |

**How to Pay:**
```bash
# 1. Make request, receive 402 with payment requirements
curl https://fcn.dev/api/premium/ai/sentiment

# 2. Pay with USDC using x402-compatible wallet
# 3. Include payment proof in header
curl -H "X-Payment: <base64-payment>" https://fcn.dev/api/premium/ai/sentiment
```

### 🔐 Admin API

| Endpoint | Description |
|----------|-------------|
| `/api/admin` | Admin dashboard & API info |
| `/api/admin/analytics` | System-wide analytics |
| `/api/admin/keys` | API key management (CRUD) |
| `/api/admin/licenses` | License management |
| `/api/admin/stats` | Usage statistics |

> ⚠️ Admin endpoints require `ADMIN_TOKEN` authentication

### 🔢 Versioned API (v1)

Stable versioned API with x402 micropayment support for production integrations.

| Endpoint | Description |
|----------|-------------|
| `/api/v1` | API documentation & pricing |
| `/api/v1/coins` | Coin listings with market data |
| `/api/v1/coin/[coinId]` | Individual coin details |
| `/api/v1/market-data` | Global market data |
| `/api/v1/trending` | Trending coins |
| `/api/v1/search` | Search coins |
| `/api/v1/exchanges` | Exchange listings |
| `/api/v1/defi` | DeFi protocols data |
| `/api/v1/gas` | Gas price tracker |
| `/api/v1/global` | Global crypto market stats |
| `/api/v1/assets` | Asset listings |
| `/api/v1/assets/[assetId]/history` | Asset price history |
| `/api/v1/historical/[coinId]` | Historical data |
| `/api/v1/alerts` | Price alerts |
| `/api/v1/export` | Data export |
| `/api/v1/usage` | API usage stats |
| `/api/v1/x402` | x402 payment info |

> 💡 AI endpoints require `GROQ_API_KEY` (free at [console.groq.com](https://console.groq.com/keys))

---

## 🖥️ Web App Pages

The web app includes **50+ pages** for market data, portfolio management, AI tools, and more:

### Market Data
| Page | Description |
|------|-------------|
| `/markets` | Market overview with global stats and coin tables |
| `/markets/gainers` | 🆕 Top gaining coins (24h) |
| `/markets/losers` | 🆕 Top losing coins (24h) |
| `/markets/trending` | 🆕 Trending coins by volume & social |
| `/markets/new` | 🆕 Newly listed cryptocurrencies |
| `/markets/exchanges` | 🆕 Exchange directory with volumes |
| `/trending` | Trending cryptocurrencies |
| `/movers` | Top gainers and losers (24h) |

### Market Tools
| Page | Description |
|------|-------------|
| `/calculator` | Crypto calculator with conversion & P/L |
| `/gas` | Ethereum gas tracker with cost estimates |
| `/heatmap` | Market heatmap visualization |
| `/screener` | Advanced coin screener with filters |
| `/correlation` | Price correlation matrix (7/30/90 days) |
| `/dominance` | Market cap dominance chart |
| `/liquidations` | Real-time liquidations feed |
| `/buzz` | Social buzz & trending sentiment |
| `/charts` | TradingView-style charts |

### Trading Tools
| Page | Description |
|------|-------------|
| `/arbitrage` | Cross-exchange arbitrage scanner |
| `/options` | Options flow & analytics dashboard |
| `/orderbook` | Multi-exchange order book view |

### Coin Details
| Page | Description |
|------|-------------|
| `/coin/[coinId]` | Comprehensive coin page with charts, stats, news |
| `/compare` | Compare multiple cryptocurrencies side-by-side |

### AI & Analytics
| Page | Description |
|------|-------------|
| `/ai/oracle` | The Oracle - AI crypto assistant |
| `/ai/brief` | AI-generated market brief |
| `/ai/debate` | AI Bull vs Bear debate generator |
| `/ai/counter` | AI counter-argument generator |
| `/ai-agent` | AI Market Agent dashboard |
| `/sentiment` | Sentiment analysis dashboard |
| `/analytics` | News analytics overview |
| `/analytics/headlines` | 🆕 Headline tracking & mutations |
| `/predictions` | Prediction tracking & leaderboard |
| `/digest` | AI-generated daily digest |

### Social & Influencers
| Page | Description |
|------|-------------|
| `/influencers` | Influencer reliability leaderboard |
| `/whales` | Whale alerts & tracking |
| `/buzz` | Social buzz & trending sentiment |

### Research & Intelligence
| Page | Description |
|------|-------------|
| `/regulatory` | Regulatory intelligence dashboard |
| `/coverage-gap` | Coverage gap analysis |
| `/protocol-health` | DeFi protocol health monitor |

### User Features
| Page | Description |
|------|-------------|
| `/portfolio` | Portfolio management with holdings tracking |
| `/watchlist` | Watchlist with price alerts |
| `/bookmarks` | 🆕 Saved articles & reading list |
| `/settings` | User preferences and notifications |
| `/install` | 🆕 PWA installation guide |

### Content
| Page | Description |
|------|-------------|
| `/search` | Search news articles |
| `/topic/[topic]` | Topic-specific news |
| `/topics` | Browse all topics |
| `/source/[source]` | Source-specific news |
| `/sources` | All news sources |
| `/category/[category]` | Category-specific news |
| `/article/[id]` | Individual article view |
| `/read/[id]` | 🆕 Distraction-free reader mode |
| `/share/[id]` | 🆕 Share & embed articles |
| `/defi` | DeFi news section |
| `/blog` | Blog posts |

### Administration
| Page | Description |
|------|-------------|
| `/admin` | Admin dashboard |
| `/billing` | Billing & subscription management |
| `/pricing` | Pricing plans |
| `/developers` | Developer documentation |

---

## SDKs & Components

| Package | Description | Version |
|---------|-------------|---------|
| [React](sdk/react/) | `<CryptoNews />` drop-in components | v0.1.0 |
| [TypeScript](sdk/typescript/) | Full TypeScript SDK with type safety | v0.1.0 |
| [Python](sdk/python/) | Zero-dependency Python client | v0.1.0 |
| [JavaScript](sdk/javascript/) | Browser & Node.js SDK | v0.1.0 |
| [Go](sdk/go/) | Go client library | v0.1.0 |
| [PHP](sdk/php/) | PHP SDK | v0.1.0 |
| [Ruby](sdk/ruby/) | Ruby gem with async support | v0.2.0 |
| [Rust](sdk/rust/) | Rust crate with async/sync clients | v0.2.0 |
| [UI Components](docs/components.md) | Internal navigation & search components | - |

### 🔌 Platform Integrations

| Integration | Description | Documentation |
|-------------|-------------|---------------|
| [ChatGPT](chatgpt/) | Custom GPT with OpenAPI schema | [Guide](docs/integrations/chatgpt.md) |
| [MCP Server](mcp/) | Model Context Protocol server | [Guide](docs/integrations/mcp.md) |
| [Chrome Extension](extension/) | Browser extension | [Guide](docs/integrations/extension.md) |
| [Alfred Workflow](alfred/) | macOS Alfred integration | [Guide](docs/integrations/alfred.md) |
| [Raycast](raycast/) | Raycast extension | [Guide](docs/integrations/raycast.md) |
| [Widgets](widget/) | Embeddable widgets | [Guide](docs/integrations/widgets.md) |
| [CLI](cli/) | Command-line interface | [README](cli/README.md) |
| [Postman](postman/) | Postman collection | [README](postman/README.md) |

### 📚 Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | Full API documentation |
| [AI Features](docs/AI-FEATURES.md) | AI endpoint documentation |
| [Architecture](docs/CDA-ARCHITECTURE-COMPLETE.md) | System architecture |
| [Developer Guide](docs/DEVELOPER-GUIDE.md) | Contributing & development |
| [Quickstart](docs/QUICKSTART.md) | Getting started guide |
| [User Guide](docs/USER-GUIDE.md) | End-user documentation |
| [Internationalization](docs/INTERNATIONALIZATION.md) | i18n & localization |
| [Real-Time](docs/REALTIME.md) | SSE & WebSocket guide |
| [x402 Payments](docs/X402-IMPLEMENTATION.md) | Micropayments implementation |
| [Testing](docs/TESTING.md) | Test coverage & strategies |
| [Deployment](DEPLOYMENT.md) | Deployment guide |

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

### AI Endpoint Parameters

| Parameter | Endpoints | Description |
|-----------|-----------|-------------|
| `q` | `/api/ask` | Question to ask about news |
| `style` | `/api/summarize` | brief/detailed/bullet |
| `period` | `/api/digest` | 6h/12h/24h |
| `type` | `/api/entities` | ticker/person/company/protocol |
| `threshold` | `/api/clickbait` | Min clickbait score (0-100) |
| `asset` | `/api/sentiment` | Filter by ticker (BTC, ETH) |
| `emerging` | `/api/narratives` | true = only new narratives |
| `min_confidence` | `/api/signals` | Min confidence (0-100) |
| `date` | `/api/ai/brief` | Date for brief (YYYY-MM-DD) |
| `format` | `/api/ai/brief` | full/summary |

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

## 🤖 AI Endpoint Examples

**Ask questions about crypto news:**
```bash
curl "https://free-crypto-news.vercel.app/api/ask?q=What%20is%20happening%20with%20Bitcoin%20today"
```

**Get AI-powered summaries:**
```bash
curl "https://free-crypto-news.vercel.app/api/summarize?limit=5&style=brief"
```

**Daily digest:**
```bash
curl "https://free-crypto-news.vercel.app/api/digest?period=24h"
```

**Deep sentiment analysis:**
```bash
curl "https://free-crypto-news.vercel.app/api/sentiment?asset=BTC"
```

**Extract entities (people, companies, tickers):**
```bash
curl "https://free-crypto-news.vercel.app/api/entities?type=person"
```

**Identify market narratives:**
```bash
curl "https://free-crypto-news.vercel.app/api/narratives?emerging=true"
```

**News-based trading signals:**
```bash
curl "https://free-crypto-news.vercel.app/api/signals?min_confidence=70"
```

**Fact-check claims:**
```bash
curl "https://free-crypto-news.vercel.app/api/factcheck?type=prediction"
```

**Detect clickbait:**
```bash
curl "https://free-crypto-news.vercel.app/api/clickbait?threshold=50"
```

### 🆕 AI Products

**Daily Brief** - Comprehensive crypto news digest:
```bash
curl "https://free-crypto-news.vercel.app/api/ai/brief?format=full"
```

**Bull vs Bear Debate** - Generate balanced perspectives:
```bash
curl -X POST "https://free-crypto-news.vercel.app/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Bitcoin reaching $200k in 2026"}'
```

**Counter-Arguments** - Challenge any claim:
```bash
curl -X POST "https://free-crypto-news.vercel.app/api/ai/counter" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Ethereum will flip Bitcoin by market cap"}'
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
npm install @nirholas/crypto-news
```

```typescript
import { CryptoNews } from '@nirholas/crypto-news';

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

## 🔮 MCP Server (Claude Desktop & ChatGPT Developer Mode)

The MCP server provides **11 tools** for AI assistants to access crypto news.

### Available Tools

| Tool | Description |
|------|-------------|
| `get_crypto_news` | Latest news from 7 sources |
| `search_crypto_news` | Search by keywords |
| `get_defi_news` | DeFi-specific news |
| `get_bitcoin_news` | Bitcoin-specific news |
| `get_breaking_news` | Breaking news (last 2 hours) |
| `get_news_sources` | List all sources |
| `get_api_health` | API health check |
| `get_trending_topics` | Trending topics with sentiment |
| `get_crypto_stats` | Analytics & statistics |
| `analyze_news` | News with sentiment analysis |
| `get_market_context` | Market data context |

### Option 1: Claude Desktop (stdio)

**1. Clone & install:**
```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/mcp && npm install
```

**2. Add to config**

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

**3. Restart Claude.** Ask: *"Get me the latest crypto news"*

### Option 2: ChatGPT Developer Mode (HTTP/SSE)

**Live Server:** `https://plugins.support/sse`

**Or run locally:**
```bash
cd free-crypto-news/mcp
npm install
npm run start:http  # Starts on port 3001
```

**In ChatGPT:**
1. Enable Developer Mode in Settings → Apps → Advanced
2. Create new app with protocol: **SSE**
3. Endpoint: `https://plugins.support/sse` (or `http://localhost:3001/sse`)
4. No authentication needed

Full documentation: [`mcp/README.md`](mcp/README.md)

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

## Environment Variables

**All environment variables are optional.** The project works out of the box with zero configuration.

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | - | Enables i18n auto-translation (18 languages). **FREE!** Get yours at [console.groq.com/keys](https://console.groq.com/keys) |
| `FEATURE_TRANSLATION` | `false` | Set to `true` to enable real-time translation |
| `REDDIT_CLIENT_ID` | - | Enables Reddit social signals |
| `REDDIT_CLIENT_SECRET` | - | Reddit OAuth secret |
| `X_AUTH_TOKEN` | - | X/Twitter signals via [XActions](https://github.com/nirholas/XActions) |
| `ARCHIVE_DIR` | `./archive` | Archive storage path |
| `API_URL` | Production Vercel | API endpoint for archive collection |

### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_MARKET` | `true` | Market data (CoinGecko, DeFiLlama) |
| `FEATURE_ONCHAIN` | `true` | On-chain events (BTC stats, DEX volumes) |
| `FEATURE_SOCIAL` | `true` | Social signals (Reddit sentiment) |
| `FEATURE_PREDICTIONS` | `true` | Prediction markets (Polymarket, Manifold) |
| `FEATURE_CLUSTERING` | `true` | Story clustering & deduplication |
| `FEATURE_RELIABILITY` | `true` | Source reliability tracking |

### GitHub Secrets (for Actions)

For full functionality, add these secrets to your repository:

```
GROQ_API_KEY        # For i18n translations (FREE! https://console.groq.com/keys)
FEATURE_TRANSLATION # Set to 'true' to enable translations
REDDIT_CLIENT_ID    # For Reddit data (register at reddit.com/prefs/apps)
REDDIT_CLIENT_SECRET
X_AUTH_TOKEN        # For X/Twitter (from XActions login)
```

---

# Tech Stack

- **Runtime:** Next.js 14 Edge Functions
- **Hosting:** Vercel free tier
- **Data:** Direct RSS parsing (no database)
- **Cache:** 5-minute edge cache

---

# Contributing

PRs welcome! Ideas:

- [ ] More news sources (Korean, Chinese, Japanese, Spanish)
- [x] ~~Sentiment analysis~~ ✅ Done
- [x] ~~Topic classification~~ ✅ Done
- [x] ~~WebSocket real-time feed~~ ✅ Done
- [x] ~~Configurable alert system~~ ✅ Done
- [x] Rust / Ruby SDKs ✅
- [ ] Mobile app (React Native)

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
| TypeScript | `npm install @nirholas/crypto-news` |
| Python | `curl -O .../sdk/python/crypto_news.py` |
| Go | `go get github.com/nirholas/free-crypto-news/sdk/go` |
| PHP | `curl -O .../sdk/php/CryptoNews.php` |
| JavaScript | `curl -O .../sdk/javascript/crypto-news.js` |
| Rust | `cargo add fcn-sdk` |
| Ruby | `gem install fcn-sdk` |

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

# 🗄️ Archive v2: The Definitive Crypto News Record

We're building the most comprehensive open historical archive of crypto news. Every headline. Every hour. Forever.

## What's in v2

| Feature | Description |
|---------|-------------|
| **Hourly collection** | Every hour, not every 6 hours |
| **Append-only** | Never overwrite - every unique article preserved |
| **Deduplication** | Content-addressed IDs prevent duplicates |
| **Entity extraction** | Auto-extracted tickers ($BTC, $ETH, etc.) |
| **Named entities** | People, companies, protocols identified |
| **Sentiment scoring** | Every headline scored positive/negative/neutral |
| **Market context** | BTC/ETH prices + Fear & Greed at capture time |
| **Content hashing** | SHA256 for integrity verification |
| **Hourly snapshots** | What was trending each hour |
| **Indexes** | Fast lookups by source, ticker, date |
| **JSONL format** | Streamable, append-friendly, grep-able |

## V2 API Endpoints

```bash
# Get enriched articles with all metadata
curl "https://free-crypto-news.vercel.app/api/archive/v2?limit=20"

# Filter by ticker
curl "https://free-crypto-news.vercel.app/api/archive/v2?ticker=BTC"

# Filter by sentiment
curl "https://free-crypto-news.vercel.app/api/archive/v2?sentiment=positive"

# Get archive statistics
curl "https://free-crypto-news.vercel.app/api/archive/v2?stats=true"

# Get trending tickers (last 24h)
curl "https://free-crypto-news.vercel.app/api/archive/v2?trending=true"

# Get market history for a month
curl "https://free-crypto-news.vercel.app/api/archive/v2?market=2026-01"
```

## Archive Directory Structure

```
archive/
  v2/
    articles/           # JSONL files, one per month
      2026-01.jsonl     # All articles from January 2026
    snapshots/          # Hourly trending state
      2026/01/11/
        00.json         # What was trending at midnight
        01.json         # What was trending at 1am
        ...
    market/             # Price/sentiment history
      2026-01.jsonl     # Market data for January 2026
    index/              # Fast lookups
      by-source.json    # Article IDs grouped by source
      by-ticker.json    # Article IDs grouped by ticker
      by-date.json      # Article IDs grouped by date
    meta/
      schema.json       # Schema version and definition
      stats.json        # Running statistics
```

## Enriched Article Schema

```json
{
  "id": "a1b2c3d4e5f6g7h8",
  "schema_version": "2.0.0",
  "title": "BlackRock adds $900M BTC...",
  "link": "https://...",
  "canonical_link": "https://... (normalized)",
  "description": "...",
  "source": "CoinTelegraph",
  "source_key": "cointelegraph",
  "category": "bitcoin",
  "pub_date": "2026-01-08T18:05:00.000Z",
  "first_seen": "2026-01-08T18:10:00.000Z",
  "last_seen": "2026-01-08T23:05:00.000Z",
  "fetch_count": 5,
  "tickers": ["BTC"],
  "entities": {
    "people": ["Larry Fink"],
    "companies": ["BlackRock"],
    "protocols": ["Bitcoin"]
  },
  "tags": ["institutional", "price"],
  "sentiment": {
    "score": 0.65,
    "label": "positive",
    "confidence": 0.85
  },
  "market_context": {
    "btc_price": 94500,
    "eth_price": 3200,
    "fear_greed_index": 65
  },
  "content_hash": "h8g7f6e5d4c3b2a1",
  "meta": {
    "word_count": 23,
    "has_numbers": true,
    "is_breaking": false,
    "is_opinion": false
  }
}
```

---

# 🚀 Roadmap

Building the definitive open crypto intelligence platform.

## ✅ Complete

- [x] Real-time aggregation from 7 sources
- [x] REST API with multiple endpoints
- [x] RSS/Atom feeds
- [x] SDKs (Python, JavaScript, TypeScript, Go, PHP, React, Rust, Ruby)
- [x] MCP server for AI assistants
- [x] Embeddable widgets
- [x] Archive v2 with enrichment
- [x] Hourly archive collection workflow
- [x] Entity/ticker extraction
- [x] Sentiment analysis
- [x] Market context capture (CoinGecko + DeFiLlama)
- [x] Story clustering engine
- [x] Source reliability tracking
- [x] On-chain event tracking (Bitcoin, DeFi TVL, DEX volumes, bridges)
- [x] X/Twitter social signals via [XActions](https://github.com/nirholas/XActions) (no API key needed!)
- [x] Prediction market tracking (Polymarket, Manifold)
- [x] AI training data exporter
- [x] Analytics engine with daily/weekly digests
- [x] Market data visualization components (Heatmap, Dominance, Correlation)
- [x] Advanced coin screener with filters
- [x] Live WebSocket price updates
- [x] Crypto calculator & converter
- [x] Gas tracker (Ethereum)
- [x] Social buzz & sentiment dashboard
- [x] Liquidations feed (real-time)
- [x] Data export (CSV/JSON)
- [x] Multi-currency selector
- [x] Admin usage dashboard
- [x] API key management system (self-service registration)
- [x] Tiered API access (Free/Pro/Enterprise)
- [x] Admin key management endpoints
- [x] Admin usage statistics dashboard
- [x] Subscription expiry cron job
- [x] Webhook testing endpoint
- [x] Centralized admin authentication
- [x] CoinCap API integration (free market data)
- [x] CoinPaprika API integration (free market data)
- [x] Bitcoin on-chain data (Mempool.space)
- [x] DeFi yields integration (Llama.fi)
- [x] Real-time price WebSocket (CoinCap)
- [x] x402 micropayments infrastructure (Base L2)

## 🔨 In Progress

- [ ] Full test of enhanced collection pipeline
- [x] LunarCrush / Santiment social metrics integration ✅
- [x] Wire up new market tools to navigation ✅
- [x] x402 payment flow testing (Base Sepolia) ✅
- [x] TradingView chart embeds ✅
- [x] Portfolio performance charts ✅
- [x] The Oracle: Natural language queries over all data ✅

## 📋 Short-Term (Q1 2026)

### Data Enrichment
- [x] Full article extraction (where legally permissible)
- [x] AI-powered summarization (1-sentence, 1-paragraph)
- [x] Advanced entity extraction with AI ✅
- [x] Event classification (funding, hack, regulation, etc.) ✅
- [x] Claim extraction (factual claims as structured data) ✅
- [x] Relationship extraction (who did what to whom) ✅

### API Infrastructure
- [x] Self-service API key registration ✅
- [x] Tiered rate limiting (Free/Pro/Enterprise) ✅
- [x] Usage tracking & statistics ✅
- [x] Admin management dashboard ✅
- [x] Webhook delivery system ✅
- [x] API key analytics & insights ✅
- [x] Usage-based billing integration (Stripe) ✅

### Multi-Lingual
- [x] i18n workflow with 18 languages (auto-translation via Groq - FREE!)
- [x] Translated README and docs
- [x] Korean sources ✅
- [x] Chinese sources ✅
- [x] Japanese sources ✅
- [x] Spanish sources ✅

### Real-Time Features
- [x] WebSocket streaming
- [x] Configurable alert system (8 condition types)
- [x] Alert WebSocket subscriptions
- [x] Alert webhook delivery
- [x] Live price components with flash animations ✅
- [x] Faster webhook delivery

### Market Tools
- [x] Crypto calculator with profit/loss ✅
- [x] Ethereum gas tracker ✅
- [x] Market heatmap visualization ✅
- [x] Correlation matrix (7/30/90 day) ✅
- [x] Market dominance chart ✅
- [x] Advanced screener with filters ✅
- [x] Liquidations feed ✅
- [x] Social buzz metrics ✅

## 📋 Medium-Term (Q2-Q3 2026)

### x402 Premium Features
- [x] x402 payment protocol integration ✅
- [x] Pay-per-request micropayments (USDC on Base) ✅
- [x] Payment provider React component ✅
- [x] Payment button component ✅
- [x] Payment lifecycle hooks ✅
- [x] Premium endpoint definitions ✅
- [x] Full payment flow E2E testing ✅
- [ ] Mainnet deployment

### Intelligence Layer (Partial - In Progress)
- [x] Story clustering (group related articles) ✅
- [x] Headline mutation tracking (detect changes) ✅
- [x] Source first-mover tracking (who breaks news) ✅
- [x] Coordinated narrative detection ✅
- [x] Prediction tracking & accuracy scoring
- [x] Anomaly detection (unusual coverage patterns) ✅

### Social Intelligence (Partial - In Progress)
- [x] X/Twitter integration via XActions (browser automation - FREE!) ✅
- [x] Social buzz dashboard (trending coins, sentiment) ✅
- [x] Discord public channel monitoring ✅
- [x] Telegram channel aggregation ✅
- [x] Influencer reliability scoring ✅
- [x] LunarCrush integration (Galaxy Score, AltRank, social volume) ✅
- [x] Santiment integration (social metrics, dev activity) ✅
- [x] Social Intelligence Dashboard component ✅
- [x] Influencer Leaderboard with accuracy tracking ✅

### On-Chain Correlation (Partial - In Progress)
- [x] Bitcoin on-chain data (Mempool.space integration) ✅
- [x] Link news to on-chain events ✅
- [x] Whale movement correlation (structure ready) ✅
- [x] DEX volume correlation ✅
- [x] Bridge volume tracking ✅
- [x] Liquidations feed integration ✅
- [x] Coverage gap analysis (what's NOT being covered)

### AI Products
- [x] **The Oracle**: Natural language queries over all data ✅
- [x] **The Brief**: Personalized AI-generated digests ✅
- [x] **The Debate**: Multi-perspective synthesis ✅
- [x] **The Counter**: Fact-checking as a service ✅

### Portfolio & Watchlist
- [x] Portfolio tracking with holdings table ✅
- [x] Portfolio summary with P/L ✅
- [x] Watchlist with export ✅
- [x] Price alerts system ✅
- [x] Portfolio performance charts ✅
- [x] Tax report generation ✅

## 📋 Long-Term (2027+)

### Research Infrastructure
- [x] Causal inference engine ✅
- [x] Backtesting infrastructure
- [x] Hypothesis testing platform ✅
- [x] Academic access program ✅

### Trust & Verification
- [x] Content-addressed storage (IPFS-style) ✅
- [x] Periodic merkle roots anchored to blockchain ✅
- [x] Deep fake / AI content detection ✅
- [x] Source network forensics ✅

### Formats & Access (Partial - In Progress)
- [x] CSV/JSON export for all data types ✅
- [x] Parquet exports for analytics ✅
- [x] SQLite monthly exports ✅
- [x] Embedding vectors for semantic search (export ready) ✅
- [x] LLM fine-tuning ready datasets ✅

### The Meta-Play
- [x] Industry-standard reference for disputes ✅
- [x] Academic citation network ✅
- [x] AI training data licensing ✅
- [x] Prediction registry (timestamped predictions with outcomes) ✅

### Advanced Trading Tools
- [x] TradingView integration ✅
- [x] Multi-exchange order book aggregation ✅
- [x] Arbitrage opportunity scanner ✅
- [x] Options flow tracking ✅
- [x] Funding rate dashboard ✅

---

## 📂 Archive v2 Data Structure

The enhanced archive system captures comprehensive crypto intelligence:

```
archive/v2/
├── articles/              # JSONL, append-only articles
│   └── 2026-01.jsonl     # ~50 new articles per hour
├── market/               # Full market snapshots
│   └── 2026-01.jsonl     # CoinGecko + DeFiLlama data
├── onchain/              # On-chain events
│   └── 2026-01.jsonl     # BTC stats, DEX volumes, bridges
├── social/               # Social signals
│   └── 2026-01.jsonl     # Reddit sentiment, trending
├── predictions/          # Prediction markets
│   └── 2026-01.jsonl     # Polymarket + Manifold odds
├── snapshots/            # Hourly trending snapshots
│   └── 2026/01/11/
│       └── 08.json       # Complete state at 08:00 UTC
├── analytics/            # Generated insights
│   ├── digest-2026-01-11.json
│   ├── narrative-momentum.json
│   └── coverage-patterns.json
├── exports/training/     # AI-ready exports
│   ├── instruction-tuning.jsonl
│   ├── qa-pairs.jsonl
│   ├── sentiment-dataset.jsonl
│   ├── embeddings-data.jsonl
│   └── ner-training.jsonl
├── index/                # Fast lookups
│   ├── by-source.json
│   ├── by-ticker.json
│   └── by-date.json
└── meta/
    ├── schema.json
    ├── stats.json
    └── source-stats.json # Reliability scores
```

### Per-Article Data

Each article is enriched with:

```json
{
  "id": "sha256:abc123...",
  "schema_version": "2.0.0",
  "title": "Bitcoin Surges Past $100K",
  "link": "https://...",
  "description": "...",
  "source": "CoinDesk",
  "source_key": "coindesk",
  "pub_date": "2026-01-11T10:00:00Z",
  "first_seen": "2026-01-11T10:05:00Z",
  "last_seen": "2026-01-11T18:05:00Z",
  "fetch_count": 8,
  "tickers": ["BTC", "ETH"],
  "categories": ["market", "bitcoin"],
  "sentiment": "bullish",
  "market_context": {
    "btc_price": 100500,
    "eth_price": 4200,
    "fear_greed": 75,
    "btc_dominance": 52.3
  }
}
```

### Hourly Snapshot Data

Each hour captures:

- **Articles**: Count, sentiment breakdown, top tickers, source distribution
- **Market**: Top 100 coins, DeFi TVL, yields, stablecoins, trending
- **On-Chain**: BTC network stats, DEX volumes, bridge activity
- **Social**: Reddit sentiment, active users, trending topics
- **Predictions**: Polymarket/Manifold crypto prediction odds
- **Clustering**: Story clusters, first-movers, coordinated releases

---

## Why This Matters

**Time is our moat.** 

If we capture complete data now with proper structure, in 2 years we'll have something nobody can recreate. The compound value:

- **Year 1**: Interesting dataset
- **Year 3**: Valuable for research  
- **Year 5**: Irreplaceable historical record
- **Year 10**: The definitive source, cited in papers, used by institutions

Every day we delay proper archiving is data lost forever.

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📰 Adding news sources
- 📖 Improving documentation
- 🌍 Translations

Please read our [**Contributing Guide**](CONTRIBUTING.md) to get started.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER-GUIDE.md) | End-user features, keyboard shortcuts, PWA |
| [Developer Guide](docs/DEVELOPER-GUIDE.md) | Architecture, components, extending the app |
| [Contributing](CONTRIBUTING.md) | How to contribute |
| [Changelog](CHANGELOG.md) | Version history |
| [Security](SECURITY.md) | Security policy |

---

# License

MIT © 2025 [nich](https://github.com/nirholas)

---

<p align="center">
  <b>Stop paying for crypto news APIs.</b><br>
  <sub>Made with 💜 for the community</sub>
</p>

<p align="center">
  <br>
  ⭐ <b>Found this useful? Give it a star!</b> ⭐<br>
  <sub>It helps others discover this project and keeps development going. Please contribute to the repo, it's beneficial for everyone when you make fixes directly to this repo rather than JUST your own. Thanks!</sub><br><br>
  <a href="https://github.com/nirholas/free-crypto-news/stargazers">
    <img src="https://img.shields.io/github/stars/nirholas/free-crypto-news?style=social" alt="Star on GitHub">
  </a>
</p>

