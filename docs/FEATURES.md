# Features Guide

Complete guide to everything you can do with Free Crypto News — as a reader, trader, developer, or researcher.

> **Quick links:** [API Reference](./API.md) · [Quick Start](./QUICKSTART.md) · [SDKs](./sdks/index.md) · [Tutorials](./tutorials/index.md)

---

## Feature Overview

| Category | What's included |
|----------|----------------|
| [News & Content](#news--content) | Real-time aggregation, search, article reader, topics |
| [Market Data](#market-data) | Prices, charts, trending, heatmaps, gas tracker |
| [Trading Tools](#trading-tools) | Arbitrage, signals, funding rates, liquidations |
| [Analytics & Research](#analytics--research) | Correlations, predictions, screener, sentiment |
| [On-Chain Data](#on-chain-data) | Addresses, whale tracking, protocol health |
| [AI Features](#ai-features) | Chat agent, daily digest, AI intelligence suite |
| [Research & Analysis](#research--analysis) | Regulatory tracking, entities, fact-checking |
| [Portfolio & User](#portfolio--user-features) | Portfolio, watchlist, bookmarks, saved items |
| [Developer Tools](#developer-tools) | API docs, SDKs, embeddable charts |

---

## News & Content

### 📰 News Feed

The main news aggregator — your single source for crypto news from 200+ professional outlets, updated every few minutes.

**URL:** `/`

**Features:**
- Real-time news from 200+ professional sources (CoinDesk, The Block, Decrypt, Cointelegraph, and more)
- Category filtering (DeFi, Bitcoin, Ethereum, NFT, Layer 2, Regulation, etc.)
- Source filtering — see news from specific outlets
- Sentiment indicators — see if coverage is bullish, bearish, or neutral
- Breaking news highlights with prominent banner
- Infinite scroll with lazy loading

**API:** [`GET /api/news`](./API.md#get-apinews) — also available as [RSS](./API.md#get-apirss), [Atom](./API.md#get-apiatom), and [OPML](./API.md#get-apiopml)

### 🔍 Search

Find exactly what you're looking for across all articles — past and present.

**URL:** `/search`

**Features:**
- Keyword search with instant results
- Date range filtering
- Source filtering
- Category filtering
- Saved searches

**API:** [`GET /api/search`](./API.md#get-apisearch)

### 📖 Article Reader

Distraction-free reading experience with AI enhancements.

**URL:** `/read/[slug]` or `/article/[id]`

**Features:**
- Clean reading mode — no ads, no clutter
- AI-powered summary at the top of each article
- Related articles sidebar
- Share options (Twitter, Reddit, copy link)
- Text-to-speech for hands-free reading

**API:** [`POST /api/news/extract`](./API.md#post-apinewsextract) — extract and summarize any article URL

### 📚 Topics

Browse news by topic and trending subjects.

**URL:** `/topics`, `/topic/[name]`

**Features:**
- Trending topics
- Topic-specific feeds
- Related topics
- Historical topic data

### 🏷️ Categories

Browse by content category.

**URL:** `/category/[name]`

**Categories:**
- DeFi
- Bitcoin
- Ethereum
- NFT
- Layer 2
- Regulation
- Trading
- Research
- And more...

---

## Market Data

### 📊 Markets

Live cryptocurrency market data — prices, volumes, and trends at a glance.

**URL:** `/markets`

**Features:**
- Top 100 cryptocurrencies by market cap
- Price, volume, market cap with real-time updates
- 24h/7d/30d price changes
- Sparkline charts for quick trend visualization
- Sorting and filtering by any metric

**API:** [`GET /api/market/coins`](./API.md#get-apimarketcoins)

### 🔥 Trending

Trending cryptocurrencies and topics.

**URL:** `/trending`

**Features:**
- Trending coins
- Search trends
- Social trends
- Volume leaders

### 📈 Movers

Top gainers and losers.

**URL:** `/movers`

**Features:**
- Top gainers (24h/7d/30d)
- Top losers
- Volume leaders
- New listings

### 🌡️ Heatmap

Visual market heatmap.

**URL:** `/heatmap`

**Features:**
- Color-coded performance
- Sector groupings
- Multiple timeframes
- Interactive zoom

### 🥧 Dominance

Market dominance charts.

**URL:** `/dominance`

**Features:**
- Bitcoin dominance
- Ethereum dominance
- Stablecoin share
- Historical trends

### ⛽ Gas Tracker

Ethereum gas price tracker.

**URL:** `/gas`

**Features:**
- Current gas prices (slow/standard/fast)
- Gas price history
- Optimal transaction timing
- Cost estimates

---

## Trading Tools

### 💱 Arbitrage

Cross-exchange arbitrage opportunities.

**URL:** `/arbitrage`

**Features:**
- Real-time price differences
- Exchange pairs
- Profit calculator
- Alert setup

### 📊 Funding Rates

Perpetual futures funding rates.

**URL:** `/funding`

**Features:**
- Current funding rates
- Predicted rates
- Historical rates
- Exchange comparison

### 📉 Liquidations

Real-time liquidation data across major exchanges — see when over-leveraged positions get wiped out.

**URL:** `/liquidations`

**Features:**
- Real-time liquidation events
- Liquidation heatmap visualization
- Historical data and trends
- Alert setup for large liquidation events

**API:** [`GET /api/liquidations`](./API.md#get-apiliquidations)

### 📖 Order Book

Aggregated order book data.

**URL:** `/orderbook`

**Features:**
- Multi-exchange aggregation
- Depth visualization
- Large order detection
- Bid/ask spread

### 📈 Signals

AI-generated trading signals based on technical analysis and news sentiment.

**URL:** `/signals`

**Features:**
- Buy/sell signals with confidence scores
- Technical indicators (RSI, MACD, Bollinger Bands, etc.)
- Confidence scores for each signal
- Backtested results with historical accuracy

**API:** [`GET /api/signals`](./API.md#get-apisignals)

### ⚙️ Options

Crypto options market data.

**URL:** `/options`

**Features:**
- Options chain
- Open interest
- Implied volatility
- Max pain calculation

### 🔙 Backtesting

Strategy backtesting tool.

**URL:** `/backtest`

**Features:**
- Historical simulation
- Performance metrics
- Drawdown analysis
- Custom strategies

---

## Analytics & Research

### 📊 Analytics

Platform analytics and statistics.

**URL:** `/analytics`

**Features:**
- Article statistics
- Source performance
- Category breakdown
- Time distribution

### 📉 Correlation

Asset correlation analysis.

**URL:** `/correlation`

**Features:**
- Correlation matrix
- Rolling correlations
- Cross-asset analysis
- Crypto vs TradFi

### 🔮 Predictions

AI-powered price predictions.

**URL:** `/predictions`

**Features:**
- Price forecasts
- Confidence intervals
- Multiple timeframes
- Model explanations

### 📊 Screener

Advanced cryptocurrency screener.

**URL:** `/screener`

**Features:**
- Custom filters
- Technical indicators
- Fundamental metrics
- Saved screens

### 😨 Fear & Greed

Market sentiment index.

**URL:** `/fear-greed`

**Features:**
- Current index value
- Historical chart
- Component breakdown
- Interpretation guide

### 💬 Sentiment

News sentiment analysis.

**URL:** `/sentiment`

**Features:**
- Article sentiment scores
- Aggregate sentiment
- Sentiment trends
- Asset-specific sentiment

---

## On-Chain Data

### ⛓️ On-Chain

On-chain analytics dashboard.

**URL:** `/onchain`

**Features:**
- Active addresses
- Transaction volume
- Exchange flows
- Holder distribution

### � Whales

Track large cryptocurrency transactions and whale wallet movements in real time.

**URL:** `/whales`

**Features:**
- Large transaction alerts (>$1M+)
- Whale wallet tracking and labeling
- Exchange inflows/outflows (potential sell/buy pressure)
- Historical patterns and trends

**API:** [`GET /api/whale-alerts`](./API.md#get-apiwhale-alerts)

### 🏥 Protocol Health

DeFi protocol health metrics.

**URL:** `/protocol-health`

**Features:**
- TVL tracking
- Smart contract risk
- Audit status
- Historical health

### 🔮 Oracle

Price oracle data.

**URL:** `/oracle`

**Features:**
- Chainlink prices
- Oracle deviations
- Update frequency
- Data freshness

---

## AI Features

### 📝 Digest

AI-generated daily news digest — get caught up on everything important in 2 minutes.

**URL:** `/digest`

**Features:**
- Daily summaries of the most important crypto news
- Key highlights and takeaways
- Trend analysis and market context
- Customizable topics

**API:** [`GET /api/digest`](./API.md#get-apidigest)

### � AI Intelligence Suite

Advanced AI-powered market intelligence.

**Endpoints:** `/api/ai/*`

**Features:**

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **News Synthesis** | `/api/ai/synthesize` | Auto-clusters duplicate articles into comprehensive summaries |
| **Trending Explainer** | `/api/ai/explain` | AI explains why topics are trending with full context |
| **Portfolio News** | `/api/ai/portfolio-news` | Scores news relevance to your holdings |
| **News-Price Correlation** | `/api/ai/correlation` | Detects news-to-price correlations |
| **Flash Briefing** | `/api/ai/flash-briefing` | Ultra-short summaries for voice assistants |
| **Narrative Tracker** | `/api/ai/narratives` | Tracks narratives through lifecycle phases |
| **Cross-Lingual** | `/api/ai/cross-lingual` | Regional sentiment divergence detection |
| **Source Quality** | `/api/ai/source-quality` | Source scoring and clickbait detection |
| **Research Agent** | `/api/ai/research` | Deep-dive research reports |

### �🧮 Calculator

Crypto calculators.

**URL:** `/calculator`

**Features:**
- Profit calculator
- DCA calculator
- Mining calculator
- Staking calculator

---

## Research & Analysis

### 📜 Regulatory

Regulatory news tracker.

**URL:** `/regulatory`

**Features:**
- Global regulation news
- Country-specific tracking
- Regulatory calendar
- Impact analysis

### 🎙️ Influencers

Crypto influencer tracking.

**URL:** `/influencers`

**Features:**
- Top influencers
- Prediction accuracy
- Sentiment analysis
- Social reach

### 📰 Narratives

Market narrative tracking.

**URL:** `/narratives`

**Features:**
- Current narratives
- Narrative strength
- Related assets
- Historical trends

### 🏢 Entities

Entity mention tracking.

**URL:** `/entities`

**Features:**
- Named entities
- Mention frequency
- Entity relationships
- Sentiment by entity

### 📊 Coverage Gap

News coverage analysis.

**URL:** `/coverage-gap`

**Features:**
- Underreported events
- Coverage comparison
- Source blind spots
- Gap alerts

### ✅ Claims

Claim verification.

**URL:** `/claims`

**Features:**
- Claim extraction
- Verification status
- Source tracking
- Fact-checking

### 🎣 Clickbait

Clickbait detection.

**URL:** `/clickbait`

**Features:**
- Clickbait scores
- Headline analysis
- Quality indicators
- Source rankings

### 📍 Origins

News origin tracking.

**URL:** `/origins`

**Features:**
- Original source detection
- Syndication tracking
- Citation analysis
- Breaking news attribution

### ✅ Fact Check

Fact-checking tool.

**URL:** `/factcheck`

**Features:**
- Claim verification
- Source credibility
- Historical accuracy
- Community input

### 📚 Citations

Academic citation tracker.

**URL:** `/citations`

**Features:**
- Research papers
- Citation counts
- Author tracking
- Topic relevance

---

## Portfolio & User Features

### 💼 Portfolio

Track your cryptocurrency portfolio performance across multiple wallets.

**URL:** `/portfolio`

**Features:**
- Multi-wallet support
- Real-time performance tracking
- Asset allocation breakdown
- P&L calculation with tax reporting

**API:** [`POST /api/portfolio`](./API.md#post-apiportfolio) · [`GET /api/portfolio/performance`](./API.md#get-apiportfolioperformance)

### 👀 Watchlist

Cryptocurrency watchlist.

**URL:** `/watchlist`

**Features:**
- Custom lists
- Price alerts
- Quick actions
- Sync across devices

### 🔖 Bookmarks

Saved articles.

**URL:** `/bookmarks`

**Features:**
- Save articles
- Organize by folder
- Search saved
- Export bookmarks

### 💾 Saved

Saved items.

**URL:** `/saved`

**Features:**
- Saved articles
- Saved searches
- Saved filters
- Quick access

---

## Coin Pages

### 🪙 Coin Detail

Individual cryptocurrency pages.

**URL:** `/coin/[id]`

**Features:**
- Price chart
- Market data
- News feed
- On-chain data
- Social sentiment

### 🔄 Compare

Cryptocurrency comparison.

**URL:** `/compare`

**Features:**
- Side-by-side comparison
- Multiple metrics
- Visual charts
- Export data

---

## Developer Tools

### 🧑‍💻 Developers

Developer portal with everything you need to integrate with the API.

**URL:** `/developers`

**Features:**
- Full API documentation (180+ endpoints)
- SDK downloads for 8 languages
- Code examples in Python, JavaScript, Go, cURL
- Optional API key management

**Resources:** [API Reference](./API.md) · [Examples](./EXAMPLES.md) · [SDKs](./sdks/index.md) · [Tutorials](./tutorials/index.md)

### 📊 Charts

Embeddable chart tools.

**URL:** `/charts`

**Features:**
- TradingView integration
- Custom indicators
- Multiple timeframes
- Share/embed

---

## Social & Community

### 📣 Buzz

Social buzz tracking.

**URL:** `/buzz`

**Features:**
- Social mentions
- Trending topics
- Sentiment analysis
- Platform comparison

---

## Utility Pages

### ⚙️ Settings

User settings.

**URL:** `/settings`

**Features:**
- Theme selection
- Language preference
- Notification settings
- Data export

### 📲 Install

PWA installation guide.

**URL:** `/install`

**Features:**
- Installation instructions
- Platform guides
- Offline support info

### 📖 About

About the project.

**URL:** `/about`

**Features:**
- Project information
- Team
- Open source links

---

---

## Related Documentation

| Resource | Description |
|----------|-------------|
| [API Reference](./API.md) | All 180+ API endpoints |
| [Quick Start](./QUICKSTART.md) | Get started in 5 minutes |
| [User Guide](./USER-GUIDE.md) | Web app user guide |
| [Developer Guide](./DEVELOPER-GUIDE.md) | Building & contributing |
| [SDKs](./sdks/index.md) | Python, JS, TS, Go, PHP, React, Ruby, Rust |
| [Tutorials](./tutorials/index.md) | Step-by-step guides |
| [Integrations](./integrations/index.md) | ChatGPT, Claude MCP, Discord, Slack, etc. |
| [Examples](./EXAMPLES.md) | Code examples in 4+ languages |
