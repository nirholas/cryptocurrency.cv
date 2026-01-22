# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### AI Intelligence (Jan 22, 2026)
- **Event Classification** - `/api/classify` with 13 event types (funding, hack, regulation, partnership, product launch, acquisition, legal, market movement, security, network upgrade, governance, research, opinion)
- **Claim Extraction** - `/api/claims` extracts factual claims with attribution, verifiability analysis, and confidence scores
- **AI Daily Brief** - `/api/ai/brief` generates comprehensive daily crypto news digest with market overview, top stories, sector analysis, and risk alerts
- **AI Bull vs Bear Debate** - `/api/ai/debate` creates balanced bull/bear perspectives for any article or topic
- **AI Counter-Arguments** - `/api/ai/counter` challenges claims with structured counter-arguments including assumption analysis and alternative interpretations

#### Analytics & Intelligence (Jan 22, 2026)
- **Anomaly Detection** - `/api/analytics/anomalies` detects unusual coverage patterns, volume spikes, and sentiment shifts
- **Source Credibility** - `/api/analytics/credibility` provides credibility scoring for news sources based on accuracy, speed, and bias
- **Headline Tracking** - `/api/analytics/headlines` tracks headline changes and mutations over time

#### International News (Jan 22, 2026)
- **12 International Sources** - Korean (Block Media, TokenPost, CoinDesk Korea), Chinese (8BTC, Jinse Finance, Odaily), Japanese (CoinPost, CoinDesk Japan, Cointelegraph Japan), Spanish (Cointelegraph Español, Diario Bitcoin, CriptoNoticias)
- **Auto-Translation** - Translate international news to English using Groq AI
- **`GET /api/news/international`** - New endpoint with language/region filtering
- **Translation Caching** - 7-day cache for translated content
- **Source Health Monitoring** - Track availability of international sources
- **`getGlobalNews()`** - Combined English + international news feed

#### Market Data Pages (Jan 22, 2026)
- **Markets Hub** - `/markets` with comprehensive market overview, global stats bar, and coin tables
- **Trending Coins** - `/markets/trending` shows trending cryptocurrencies
- **Top Gainers** - `/markets/gainers` lists top performing coins (24h)
- **Top Losers** - `/markets/losers` lists worst performing coins (24h)
- **New Coins** - `/markets/new` shows recently listed coins
- **Exchanges** - `/markets/exchanges` and `/markets/exchanges/[id]` for exchange data and volume
- **Categories** - `/markets/categories` and `/markets/categories/[id]` for market categories (DeFi, Layer 1, etc.)

#### Market Data API (Jan 22, 2026)
- **`/api/market/coins`** - List all coins with market data
- **`/api/market/categories`** - Market categories
- **`/api/market/exchanges`** - Exchange listings
- **`/api/market/search`** - Search coins
- **`/api/market/compare`** - Compare multiple coins
- **`/api/market/history/[coinId]`** - Historical price data
- **`/api/market/ohlc/[coinId]`** - OHLC candlestick data
- **`/api/market/snapshot/[coinId]`** - Real-time coin snapshot
- **`/api/market/social/[coinId]`** - Social metrics for coin
- **`/api/market/tickers/[coinId]`** - Trading pairs for coin
- **`/api/market/defi`** - DeFi protocol TVL data
- **`/api/market/derivatives`** - Derivatives market data
- **`/api/charts`** - Chart data for visualizations

#### Coin Detail Pages (Jan 22, 2026)
- **Coin Pages** - `/coin/[coinId]` with comprehensive coin information
- **Price Charts** - Interactive price charts with multiple timeframes (24h, 7d, 30d, 1y, all)
- **Market Stats** - Market cap, volume, supply, rankings
- **Developer Stats** - GitHub activity and developer metrics
- **Historical Data** - Historical price tables with CSV export
- **Markets Table** - All trading pairs and exchanges for a coin
- **Coin Converter** - Real-time currency converter
- **Related News** - News feed filtered by coin
- **Price Statistics** - ATH, ATL, price changes across timeframes

#### Portfolio Management (Jan 22, 2026)
- **Portfolio Page** - `/portfolio` with holdings tracking and P&L
- **Add Holdings Modal** - Easy portfolio entry with coin search
- **Portfolio Summary** - Total value, 24h change, allocation breakdown
- **Holdings Table** - Sortable table with quantity, value, cost basis, P&L
- **Portfolio Provider** - React context for portfolio state management

#### Watchlist (Jan 22, 2026)
- **Watchlist Page** - `/watchlist` for tracking favorite coins
- **Watchlist Button** - One-click add/remove from any coin card
- **Watchlist Export** - Export to CSV/JSON
- **Watchlist Mini Widget** - Compact sidebar component
- **Watchlist Provider** - React context for watchlist state

#### Alerts System (Jan 22, 2026)
- **Price Alerts** - Set alerts for price targets (above/below threshold)
- **Alert Rules Engine** - Configurable alert conditions with multiple rule types
- **Alert Modal** - User-friendly alert creation interface
- **Alerts List** - View and manage all alerts with enable/disable
- **Alerts Provider** - React context for alert state management
- **`/api/alerts/[id]`** - Individual alert CRUD operations

#### Additional Features (Jan 22, 2026)
- **Global Search** - Enhanced search with keyboard shortcuts (Cmd/Ctrl+K)
- **Coin Compare** - `/compare` page to compare multiple cryptocurrencies side-by-side
- **Settings Page** - `/settings` for user preferences and notification settings
- **Empty States** - Polished empty state components for all lists
- **Agent Prompts Guide** - `docs/AGENT-PROMPTS.md` for AI agent integration patterns

#### Previous Additions
- **Keyboard Shortcuts** - Power user navigation with `j`/`k` for articles, `/` for search, `g+h/t/s/b` for quick access, `d` for dark mode, `?` for help modal
- **Reading Progress Bar** - Visual scroll indicator on article pages with gradient styling
- **Search Autocomplete** - Real-time search suggestions with 300ms debounce and keyboard navigation
- **Reading Time Estimates** - Badge on all article cards showing estimated reading duration
- **Article Detail Pages** - Full article pages at `/article/[id]` with AI-powered summaries
- **User Guide** - Comprehensive documentation at `docs/USER-GUIDE.md`
- **Developer Guide** - Technical documentation at `docs/DEVELOPER-GUIDE.md`
- **JSDoc Comments** - Full documentation on all new components

### Changed
- **Homepage Redesign** - Professional news layout inspired by CoinDesk/CoinTelegraph
- **Hero Section** - Full-width featured article with gradient overlays
- **Editor's Picks** - Horizontal card layout for curated articles
- **Source Sections** - News organized by outlet with distinct branding
- **Trending Sidebar** - Compact trending topics panel
- **Dark Mode** - Enhanced dark mode styling across all components
- **WebSocket Server** - Enhanced with portfolio, watchlist, and alert real-time subscriptions
- **Alerts API** - Extended `/api/alerts` with more condition types and webhook delivery

### Fixed
- Template literal syntax errors in `ArticleCardLarge.tsx`, `Footer.tsx`, `BreakingNewsBanner.tsx`
- Build errors on `/defi`, `/offline`, `/topic` pages

---

## [2.0.0] - 2026-01-15

### Added
- **Archive V2 System** - JSONL-based article storage with enhanced metadata
- **AI-Powered Endpoints** - `/api/sentiment`, `/api/factcheck`, `/api/clickbait` using Groq
- **MCP Server** - Model Context Protocol integration for Claude Desktop and ChatGPT
- **TypeScript SDK** - Published to npm as `@nirholas/crypto-news`
- **React SDK** - Component library at `@nirholas/react-crypto-news`
- **Trending Topics** - `/api/trending` endpoint with sentiment analysis
- **Market Context** - `/api/market` endpoint with price data

### Changed
- Migrated from JSON to JSONL archive format
- Enhanced article enrichment pipeline
- Improved caching strategies

---

## [1.5.0] - 2025-11-01

### Added
- **PWA Support** - Installable app with offline capabilities
- **Service Worker** - Intelligent caching for offline access
- **Push Notifications** - Breaking news alerts (opt-in)
- **Bookmarks** - Save articles to read later (localStorage)

### Changed
- Upgraded to Next.js 15
- Improved mobile navigation

---

## [1.4.0] - 2025-09-01

### Added
- **Widget System** - Embeddable ticker and carousel widgets
- **Postman Collection** - API testing collection
- **Go SDK** - Native Go client library
- **PHP SDK** - PHP client library

### Fixed
- RSS parsing edge cases
- Timezone handling in article dates

---

## [1.3.0] - 2025-07-01

### Added
- **DeFi Endpoint** - `/api/defi` for DeFi-specific news
- **Bitcoin Endpoint** - `/api/bitcoin` for Bitcoin news
- **Breaking Endpoint** - `/api/breaking` for news < 2 hours old
- **Source Filtering** - Filter by news outlet

### Changed
- Improved article deduplication
- Better error handling in API routes

---

## [1.2.0] - 2025-05-01

### Added
- **Search Endpoint** - `/api/search` with keyword matching
- **Python SDK** - Zero-dependency Python client
- **JavaScript SDK** - Browser and Node.js client
- **Example Bots** - Discord, Slack, Telegram integrations

---

## [1.1.0] - 2025-03-01

### Added
- **Source Diversity** - Added The Defiant, Blockworks sources
- **Categories** - Topic-based filtering
- **Statistics Endpoint** - `/api/stats` for analytics

### Changed
- Optimized RSS polling intervals
- Improved article title cleaning

---

## [1.0.0] - 2025-01-01

### Added
- Initial release
- **Core API** - `/api/news` endpoint
- **Five Sources** - CoinDesk, CoinTelegraph, Decrypt, The Block, Bitcoin Magazine
- **Basic Frontend** - News listing with pagination
- **Health Check** - `/api/health` endpoint
- **CORS Support** - Open API for any domain
- **Caching** - In-memory caching with 5-minute TTL

---

## Types of Changes

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features to be removed in future
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements
