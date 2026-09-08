# SDKs, Components and Query Parameters

> Component and library inventory of the web app, the SDK tables, and the full query-parameter reference for every endpoint. Runnable client samples in 12 languages live in [examples/](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples).
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## SDKs & Components

### 📊 Component & Library Overview

**Total Components:** 185+ React components organized in 10 directories  
**Total Library Functions:** 298+ exported functions across 90+ library files  
**Custom Hooks:** 5 React hooks for state management

**Component Distribution:**

- Root Level: 133 components (~65 Client, ~68 Server)
- cards/: 10 article display variants
- charts/: 4 TradingView integrations
- portfolio/: 7 portfolio management components
- watchlist/: 4 watchlist features
- alerts/: 4 price alert components
- billing/: 3 subscription management
- sidebar/: 4 sidebar widgets

**Library Categories:**

- AI/ML: 12 files, 45 functions (sentiment, summarization, NER, signals)
- Market Data: 10 files, 60 functions (prices, OHLC, exchanges, DeFi)
- Social Intelligence: 3 files, 20 functions (Twitter, Discord, Telegram)
- Analytics: 10 files, 40 functions (backtesting, predictions, anomalies)
- Database: 2 files, 25 functions (storage abstraction, CAS)
- Auth & Security: 4 files, 15 functions (API keys, rate limiting)
- x402 Payments: 9 files, 35 functions (payment protocol, verification)
- Utilities: 12 files, 50 functions (validation, logging, translation)

### 📦 Official SDKs

| Package                             | Description                             | Version |
| ----------------------------------- | --------------------------------------- | ------- |
| [React](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/react)                 | `<CryptoNews />` drop-in components     | v0.1.0  |
| [TypeScript](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/typescript)       | Full TypeScript SDK with type safety    | v0.1.0  |
| [Python](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/python)               | Zero-dependency Python client           | v0.1.0  |
| [JavaScript](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/javascript)       | Browser & Node.js SDK                   | v0.1.0  |
| [Go](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/go)                       | Go client library                       | v0.1.0  |
| [PHP](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/php)                     | PHP SDK                                 | v0.1.0  |
| [Ruby](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/ruby)                   | Ruby gem with async support             | v0.2.0  |
| [Rust](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/rust)                   | Rust crate with async/sync clients      | v0.2.0  |
| [UI Components](../COMPONENTS.md) | Internal navigation & search components | -       |

### 🔌 Platform Integrations

**Total Integrations:** 8 official SDKs + 5 platform integrations + 200+ code examples

| Integration                    | Description                               | Documentation                           | Status          |
| ------------------------------ | ----------------------------------------- | --------------------------------------- | --------------- |
| [ChatGPT](https://github.com/nirholas/cryptocurrency.cv/tree/main/chatgpt)            | Custom GPT with OpenAPI schema            | [Guide](../integrations/chatgpt.md)   | ✅ Production   |
| [MCP Server](https://github.com/nirholas/cryptocurrency.cv/tree/main/mcp)             | Model Context Protocol (stdio + HTTP/SSE) | [Guide](../integrations/mcp.md)       | ✅ Production   |
| [Chrome Extension](https://github.com/nirholas/cryptocurrency.cv/tree/main/extension) | Browser extension (Manifest V3)           | [Guide](../integrations/extension.md) | ✅ Chrome Ready |
| [Alfred Workflow](https://github.com/nirholas/cryptocurrency.cv/tree/main/alfred)     | macOS Alfred 4+ integration               | [Guide](../integrations/alfred.md)    | ✅ Production   |
| [Raycast](https://github.com/nirholas/cryptocurrency.cv/tree/main/raycast)            | Raycast extension (6 commands)            | [Guide](../integrations/raycast.md)   | ✅ Production   |
| [Widgets](https://github.com/nirholas/cryptocurrency.cv/tree/main/widget)             | 3 embeddable widget types                 | [Guide](../integrations/widgets.md)   | ✅ Production   |
| [CLI](https://github.com/nirholas/cryptocurrency.cv/tree/main/cli)                    | Command-line interface                    | [README](https://github.com/nirholas/cryptocurrency.cv/blob/main/cli/README.md)                 | ✅ Production   |
| [Postman](https://github.com/nirholas/cryptocurrency.cv/tree/main/postman)            | Postman collection (105 requests)         | [README](https://github.com/nirholas/cryptocurrency.cv/blob/main/postman/README.md)             | ✅ Complete     |

**Widget Types:**

| Widget      | Type       | Use Case                |
| ----------- | ---------- | ----------------------- |
| Main Widget | iframe     | Full news feed embed    |
| Ticker      | JavaScript | Scrolling header ticker |
| Carousel    | JavaScript | Featured news rotator   |

### 📡 Nostr Integration

Decentralized news distribution via the Nostr protocol (NIP-23 long-form content):

```bash
# Publish latest news to Nostr relays
curl -X POST https://cryptocurrency.cv/api/nostr \
  -H "Content-Type: application/json" \
  -d '{"action": "publish", "limit": 10}'

# Get Nostr event IDs for published articles
curl https://cryptocurrency.cv/api/nostr?action=events
```

Articles are published as NIP-23 long-form events to configured Nostr relays, enabling censorship-resistant news distribution.

### 🧩 Knowledge Graph API

Explore entity relationships across the crypto news landscape:

```bash
# Get entity graph for Bitcoin
curl "https://cryptocurrency.cv/api/knowledge-graph?entity=Bitcoin&depth=2"

# Filter by relationship type
curl "https://cryptocurrency.cv/api/knowledge-graph?entity=Ethereum&type=partnership"

# Get full graph snapshot
curl "https://cryptocurrency.cv/api/knowledge-graph?action=snapshot"
```

Returns entities (people, companies, protocols, exchanges) and their relationships (partnerships, investments, acquisitions, competitions) as a traversable graph.

### 🎙️ AI Podcast Generation

Generate AI-narrated crypto news podcasts on demand:

```bash
# Generate flash briefing (2 min)
curl "https://cryptocurrency.cv/api/podcast?format=flash"

# Deep-dive analysis (10 min)
curl "https://cryptocurrency.cv/api/podcast?format=deep-dive&topic=BTC"

# Market open briefing
curl "https://cryptocurrency.cv/api/podcast?format=market-open"

# Weekly recap
curl "https://cryptocurrency.cv/api/podcast?format=weekly-recap"

# Subscribe via podcast RSS
curl "https://cryptocurrency.cv/api/podcast/feed"
```

**Formats:** `flash` (2 min), `deep-dive` (10 min), `market-open` (5 min), `weekly-recap` (15 min)  
**Voices:** 3 voice options (professional, casual, technical)

### 🗣️ Alexa Skill

Voice-activated crypto news for Amazon Echo devices:

> "Alexa, ask Crypto News for the latest headlines"
> "Alexa, ask Crypto News about Bitcoin"
> "Alexa, ask Crypto News for DeFi updates"

```bash
# Alexa skill handler
curl -X POST https://cryptocurrency.cv/api/alexa \
  -H "Content-Type: application/json" \
  -d '{"request": {"type": "IntentRequest", "intent": {"name": "GetNewsIntent"}}}'
```

### 🖼️ Farcaster Frames

Interactive news frames for Warpcast and Farcaster clients:

```bash
# Get interactive news frame
curl "https://cryptocurrency.cv/api/frames"

# Frame with specific topic
curl "https://cryptocurrency.cv/api/frames?topic=bitcoin"
```

Frames support inline article previews, sentiment badges, and action buttons directly within the Farcaster social feed.

### 🔍 Vector Search

Semantic search across the article archive using vector embeddings:

```bash
# Semantic search (finds conceptually similar articles)
curl "https://cryptocurrency.cv/api/vector-search?q=institutional+adoption+impact+on+market"

# With filters
curl "https://cryptocurrency.cv/api/vector-search?q=defi+security+vulnerabilities&source=coindesk&limit=20"
```

### 🔬 Anomaly Detection

Advanced anomaly detection across the news landscape:

```bash
# Detect all anomalies
curl "https://cryptocurrency.cv/api/anomalies"

# Specific anomaly types
curl "https://cryptocurrency.cv/api/anomalies?type=sentiment-acceleration"
curl "https://cryptocurrency.cv/api/anomalies?type=price-narrative-divergence"
curl "https://cryptocurrency.cv/api/anomalies?type=news-velocity"
```

**Anomaly Types:**
- **News Velocity** — Unusual spike in article volume for a topic
- **Sentiment Acceleration** — Rapid sentiment shifts in short timeframes  
- **Price-Narrative Divergence** — When news sentiment diverges from price action
- **Coordinated Publishing** — Multiple sources publishing similar content simultaneously
- **Source Outage** — Expected source goes silent

### 🎮 Gaming & Chain-Specific APIs

| Endpoint | Description |
|----------|-------------|
| `/api/gaming` | Blockchain gaming market data with chain breakdown |
| `/api/sui` | Sui blockchain data (balances, objects, transactions) |
| `/api/aptos` | Aptos blockchain data (events, resources, transactions) |
| `/api/hyperliquid` | Hyperliquid DEX trading data |

### 🎓 Academic Research Portal

Full-featured academic access program for researchers and institutions:

```bash
# Register institution
curl -X POST https://cryptocurrency.cv/api/academic \
  -H "Content-Type: application/json" \
  -d '{
    "institution": "MIT Media Lab",
    "email": "researcher@mit.edu",
    "purpose": "Crypto market microstructure research",
    "irb_approval": "IRB-2026-0142"
  }'

# Add co-investigators
curl -X POST https://cryptocurrency.cv/api/academic \
  -H "Content-Type: application/json" \
  -d '{"action": "add_investigator", "email": "postdoc@mit.edu", "role": "co-pi"}'
```

**Benefits:** Unlimited API access, historical data exports, citation network access, priority support, co-investigator management, IRB approval tracking.

---

### 🤖 AI Agent Skills

7 pre-built AI agent skills following the [agentskills.io](https://agentskills.io) standard, compatible with **Claude Code** and **Codex**:

| Skill | Description |
|-------|-------------|
| `crypto-news-briefing` | Generate comprehensive news briefings |
| `market-sentiment` | Analyze market sentiment across sources |
| `coin-research` | Deep-dive research on any cryptocurrency |
| `rug-pull-news-check` | Scan news for rug pull warning signs |
| `historical-trend-analysis` | Analyze historical news trends |
| `scale-to-1m` | Scale the system to 1M+ requests/day |
| `add-data-sources` | Add new RSS/API data sources |

Skills are located in [`/skills/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/skills) and can be loaded by AI coding agents for autonomous development tasks.

### 🖥️ GitHub Copilot Extension

Crypto news directly in your VS Code editor via Copilot Chat:

```
@crypto-news /breaking     — Breaking crypto news
@crypto-news /market       — Market overview
@crypto-news /prices       — Top coin prices
@crypto-news /feargreed    — Fear & Greed Index
@crypto-news /whale        — Recent whale alerts
@crypto-news /trending     — Trending topics
```

Also supports natural language queries: *"@crypto-news What's happening with Ethereum?"*

Install from the VS Code Marketplace or build from source: [`/copilot-extension/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/copilot-extension)

### 🖥️ Terminal Dashboard

Full-screen terminal dashboard with real-time news updates:

```bash
# Launch terminal dashboard
node terminal/dashboard.js

# With custom API URL
API_URL=http://localhost:3000 node terminal/dashboard.js
```

**Features:**
- Real-time SSE streaming updates
- ASCII art dashboard layout with blessed UI
- Keyboard shortcuts for navigation and filtering
- Multiple view modes (all news, breaking only, by source)
- Works over SSH — perfect for headless servers

See [`/terminal/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/terminal) for details.

---

### 🧠 RAG AI System

Production-grade **Retrieval-Augmented Generation** for intelligent crypto news Q&A.

| Feature | Description |
|---------|-------------|
| **Hybrid Search** | BM25 + semantic search with reciprocal rank fusion |
| **Multi-hop Reasoning** | Agentic RAG for complex questions requiring multiple articles |
| **Conversation Memory** | Multi-turn chat with context tracking |
| **Advanced Reranking** | LLM scoring, time decay, source credibility, MMR diversity |
| **Query Understanding** | Intent classification, decomposition, HyDE |
| **Streaming API** | Real-time SSE responses with step-by-step updates |

**Quick Start:**
```typescript
import { ragService } from '@/lib/rag';

// Simple question answering
const response = await ragService.ask("What happened to Bitcoin last week?");
console.log(response.answer);

// Multi-hop reasoning for complex questions  
const reasoning = await ragService.askWithReasoning(
  "How did the ETF approval affect Bitcoin compared to Ethereum?"
);
```

**API Endpoints:**
```bash
# Standard RAG query
curl -X POST /api/rag -d '{"query": "Latest Bitcoin news"}'

# Streaming with progress updates
curl -N -X POST /api/rag/stream -d '{"query": "Why did crypto crash?"}'

# Search without answer generation
curl -X POST /api/rag/search -d '{"query": "DeFi hacks", "limit": 10}'
```

📚 **[Full RAG Documentation](https://github.com/nirholas/cryptocurrency.cv/blob/main/src/lib/rag/README.md)** — Architecture, API reference, configuration, and advanced features.

### 🚀 Code Examples & SDKs (200+ Examples)

Complete examples for all 184 API endpoints across 5 languages:

| Language | Files | Functions | Description |
|----------|-------|-----------|-------------|
| [Python](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples/python) | 12 files | 150+ | Full SDK with all endpoints |
| [JavaScript](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples/javascript) | 11 files | 120+ | Node.js & browser examples |
| [TypeScript](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples/typescript) | 3 files | 80+ | Type-safe SDK |
| [Go](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples/go) | 1 file | 60+ | Go client library |
| [cURL](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples/curl) | 1 file | 100+ | Shell script examples |

**Python Example Files:**
- `news.py` - News feeds, search, categories (13 functions)
- `ai.py` - Sentiment, summarization, NLP (20 functions)
- `market.py` - Coins, OHLC, exchanges (16 functions)
- `trading.py` - Arbitrage, signals, funding (10 functions)
- `social.py` - Twitter, Reddit, Discord (15 functions)
- `blockchain.py` - DeFi, NFT, on-chain (17 functions)
- `regulatory.py` - ETF, SEC, regulations (14 functions)
- `analytics.py` - Trends, correlations (15 functions)
- `feeds.py` - RSS, exports, webhooks (13 functions)
- `portfolio.py` - Alerts, watchlists (15 functions)
- `premium.py` - Premium tier features (12 functions)

**Quick Start (Python):**
```python
import requests
BASE_URL = "https://cryptocurrency.cv"

# Get latest news
news = requests.get(f"{BASE_URL}/api/news?limit=10").json()

# Get Bitcoin sentiment
sentiment = requests.get(f"{BASE_URL}/api/sentiment?asset=BTC").json()
print(f"BTC: {sentiment['label']} ({sentiment['score']:.2f})")

# Get Fear & Greed
fg = requests.get(f"{BASE_URL}/api/market/fear-greed").json()
print(f"Market: {fg['classification']} ({fg['value']})")
```

**Quick Start (JavaScript):**
```javascript
const BASE_URL = 'https://cryptocurrency.cv';

// Get latest news
const news = await fetch(`${BASE_URL}/api/news?limit=10`).then(r => r.json());

// Stream real-time updates
const events = new EventSource(`${BASE_URL}/api/stream`);
events.onmessage = (e) => console.log('New:', JSON.parse(e.data).title);
```

📚 **[Full Examples Documentation](https://github.com/nirholas/cryptocurrency.cv/blob/main/examples/README.md)** | **[API Tutorial](../EXAMPLES.md)**

**Bot Integration Examples:**

| Example          | Language   | File                          | Purpose                   |
| ---------------- | ---------- | ----------------------------- | ------------------------- |
| AI Analysis      | Python     | `examples/ai-analysis.py`     | Sentiment & summarization |
| LangChain Tool   | Python     | `examples/langchain-tool.py`  | AI agent integration      |
| Discord Bot      | JavaScript | `examples/discord-bot.js`     | Channel posting           |
| Telegram Bot     | Python     | `examples/telegram-bot.py`    | Command handler           |
| Telegram Digest  | Python     | `examples/telegram-digest.py` | Scheduled digests         |
| Slack Bot        | JavaScript | `examples/slack-bot.js`       | Webhook posting           |
| Real-time Stream | JavaScript | `examples/realtime-stream.js` | SSE streaming             |
| curl Examples    | Shell      | `examples/curl.sh`            | API testing               |
| x402 Python      | Python     | `examples/x402-client.py`     | Payment protocol          |
| x402 TypeScript  | TypeScript | `examples/x402-client.ts`     | Payment protocol          |
| x402 Go          | Go         | `examples/x402-client.go`     | Payment protocol          |

### 📖 Complete API Tutorials

Step-by-step tutorials with full working code for every API endpoint:

| Tutorial | Endpoints Covered | Description |
|----------|-------------------|-------------|
| [News Basics](../tutorials/news-basics.md) | `/api/news`, `/api/latest`, `/api/breaking`, `/api/trending` | Fetching, filtering, and paginating news articles |
| [Search & Filtering](../tutorials/search-filtering.md) | `/api/search`, `/api/news?source=`, `/api/news/categories` | Full-text search, source filtering, category browsing |
| [Archive & Export](../tutorials/archive-export.md) | `/api/archive`, `/api/export`, `/api/rss`, `/api/atom` | Historical data access, bulk exports, RSS/Atom feeds |
| [International News](../tutorials/international-news.md) | `/api/news/international`, `/api/news?lang=`, `/api/i18n/translate` | Multi-language news with auto-translation |
| [AI Sentiment](../tutorials/ai-sentiment.md) | `/api/sentiment`, `/api/sentiment?asset=BTC`, `/api/social/sentiment` | Real-time sentiment analysis for any asset |
| [AI Features](../tutorials/ai-features.md) | `/api/ask`, `/api/summarize`, `/api/digest`, `/api/entities`, `/api/narratives`, `/api/signals` | Q&A, summarization, NER, narratives, trading signals |
| [Trading Signals](../tutorials/trading-signals.md) | `/api/trading/arbitrage`, `/api/trading/signals`, `/api/trading/funding` | Arbitrage opportunities, AI signals, funding rates |
| [Market Data](../tutorials/market-data.md) | `/api/market/coins`, `/api/market/ohlc`, `/api/market/fear-greed`, `/api/market/dominance` | Price data, OHLCV, market indicators |
| [DeFi & NFT](../tutorials/defi-nft.md) | `/api/defi`, `/api/defi/protocols`, `/api/defi/yields`, `/api/nft`, `/api/nft/collections` | DeFi protocols, yield farming, NFT analytics |
| [Analytics & Research](../tutorials/analytics-research.md) | `/api/analytics/trends`, `/api/analytics/correlations`, `/api/research` | Market analytics, correlation analysis, research tools |
| [Social Intelligence](../tutorials/social-intelligence.md) | `/api/social/twitter`, `/api/social/reddit`, `/api/social/discord` | Social media monitoring and sentiment |
| [Portfolio & Watchlist](../tutorials/portfolio-watchlist.md) | `/api/portfolio`, `/api/watchlist`, `/api/alerts` | Portfolio tracking, watchlists, price alerts |
| [Premium Features](../tutorials/premium-features.md) | `/api/premium/*`, `/api/x402/*` | Premium API access, x402 micropayments |
| [Real-time SSE](../tutorials/realtime-sse.md) | `/api/stream`, `/api/prices/stream` | Server-Sent Events for live updates |
| [User Alerts](../tutorials/user-alerts.md) | `/api/alerts`, `/api/notifications` | Push notifications, price alerts, webhooks |
| [Webhooks & Integrations](../tutorials/user-alerts.md) | `/api/webhooks`, `/api/webhooks/events` | Webhook management, event subscriptions |
| [Utility Endpoints](../tutorials/utility-endpoints.md) | `/api/health`, `/api/version`, `/api/stats`, `/api/sources`, `/api/news/categories`, `/api/openapi.json` | Health checks, deploy verification, metadata |
| [Article Extraction](../tutorials/article-extraction.md) | `/api/extract`, `/api/extract/batch`, `/api/ai/detect` | Full article content, batch extraction, AI detection |

📚 **[View All Tutorials](../tutorials/index.md)** — Complete documentation covering the 394-endpoint API with Python, JavaScript, TypeScript, and cURL examples.

**MCP Server Modes:**

- **stdio:** For Claude Desktop (local)
- **HTTP/SSE:** For ChatGPT Developer Mode (remote)
- **Tools:** 47 over the hosted endpoint, 55 in the local package (plus 6 resources and 3 prompts)

### 📚 Documentation

| Document                                             | Description                        |
| ---------------------------------------------------- | ---------------------------------- |
| [API Reference](../API.md)                         | Full API documentation             |
| [**Tutorials**](../tutorials/index.md)             | **19 step-by-step guides with code** |
| [AI Features](../AI-FEATURES.md)                   | AI endpoint documentation          |
| [**RAG System**](../RAG.md)                        | **Question answering over news**   |
| [RAG Roadmap](../RAG-ROADMAP.md)                   | RAG future enhancements            |
| [Architecture](../ARCHITECTURE.md)    | System architecture                |
| [Developer Guide](../DEVELOPER-GUIDE.md)           | Contributing & development         |
| [Quickstart](../QUICKSTART.md)                     | Getting started guide              |
| [User Guide](../USER-GUIDE.md)                     | End-user documentation             |
| [Internationalization](../INTERNATIONALIZATION.md) | i18n & localization                |
| [Real-Time](../REALTIME.md)                        | SSE & WebSocket guide              |
| [x402 Payments](../X402.md)         | Micropayments implementation       |
| [Testing](../TESTING.md)                           | Test coverage & strategies         |
| [Deployment](../DEPLOYMENT.md)                          | Deployment guide                   |

**Base URL:** `https://cryptocurrency.cv`

**Failsafe Mirror:** `https://nirholas.github.io/cryptocurrency.cv/`

### Query Parameters

| Parameter   | Endpoints               | Description             |
| ----------- | ----------------------- | ----------------------- |
| `limit`     | All news endpoints      | Max articles (1-50)     |
| `source`    | `/api/news`             | Filter by source        |
| `from`      | `/api/news`             | Start date (ISO 8601)   |
| `to`        | `/api/news`             | End date (ISO 8601)     |
| `page`      | `/api/news`             | Page number             |
| `per_page`  | `/api/news`             | Items per page          |
| `hours`     | `/api/trending`         | Time window (1-72)      |
| `topic`     | `/api/analyze`          | Filter by topic         |
| `sentiment` | `/api/analyze`          | bullish/bearish/neutral |
| `feed`      | `/api/rss`, `/api/atom` | all/defi/bitcoin        |

### AI Endpoint Parameters

| Parameter        | Endpoints         | Description                    |
| ---------------- | ----------------- | ------------------------------ |
| `q`              | `/api/ask`        | Question to ask about news     |
| `style`          | `/api/summarize`  | brief/detailed/bullet          |
| `period`         | `/api/digest`     | 6h/12h/24h                     |
| `type`           | `/api/entities`   | ticker/person/company/protocol |
| `threshold`      | `/api/clickbait`  | Min clickbait score (0-100)    |
| `asset`          | `/api/sentiment`  | Filter by ticker (BTC, ETH)    |
| `emerging`       | `/api/narratives` | true = only new narratives     |
| `min_confidence` | `/api/signals`    | Min confidence (0-100)         |
| `date`           | `/api/ai/brief`   | Date for brief (YYYY-MM-DD)    |
| `format`         | `/api/ai/brief`   | full/summary                   |


---

## 🌐 SDKs (13 Languages)

Only `@nirholas/crypto-news` is published to a package registry. Every other client is source in this repository: copy the file or directory into your project. Runnable samples in 12 languages live in [`examples/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/examples).

| Language | Source | Install |
|----------|--------|---------|
| TypeScript | [`@nirholas/crypto-news`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/typescript) | `npm install @nirholas/crypto-news` |
| Python | [`crypto_news.py`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/python) | copy `sdk/python/crypto_news.py` |
| JavaScript | [`crypto-news.js`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/javascript) | copy `sdk/javascript/crypto-news.js` |
| Go | [`cryptonews.go`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/go) | `go get github.com/nirholas/cryptocurrency.cv/sdk/go` |
| PHP | [`CryptoNews.php`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/php) | copy `sdk/php/CryptoNews.php` |
| Rust | [`sdk/rust/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/rust) | add as a path dependency |
| Ruby | [`sdk/ruby/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/ruby) | build the gem from `sdk/ruby/` |
| React | [`sdk/react/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/react) | copy the hook/component source |
| Swift | [`sdk/swift/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/swift) | Swift Package Manager (local path) |
| Kotlin | [`sdk/kotlin/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/kotlin) | Gradle (local module) |
| Java | [`sdk/java/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/java) | Maven (local module) |
| C# | [`sdk/csharp/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/csharp) | add the project reference |
| R | [`sdk/r/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/r) | `devtools::install_local("sdk/r")` |

See [`/sdk/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk) for documentation and per-language guides in [docs/sdks/](../sdks/index.md).


---

## 📦 SDKs

See the deduplicated table under [SDKs (13 Languages)](#-sdks-13-languages) above.

