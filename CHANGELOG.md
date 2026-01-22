# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **International News Sources** - 12 new sources from Korea, China, Japan, and Latin America
  - Korean: Block Media, TokenPost, CoinDesk Korea
  - Chinese: 8BTC (巴比特), Jinse Finance (金色财经), Odaily (星球日报)
  - Japanese: CoinPost, CoinDesk Japan, Cointelegraph Japan
  - Spanish: Cointelegraph Español, Diario Bitcoin, CriptoNoticias
- **Auto-Translation** - Translate international news to English using Groq AI
- **`GET /api/news/international`** - New endpoint with language/region filtering
- **Translation Caching** - 7-day cache for translated content
- **Source Health Monitoring** - Track availability of international sources
- **`getGlobalNews()`** - Combined English + international news feed
- **AI Daily Brief** - Comprehensive daily crypto news digest at `/api/ai/brief` with market overview, top stories, sector analysis, and risk alerts
- **AI Bull vs Bear Debate** - Generate balanced bull/bear perspectives at `/api/ai/debate` for any article or topic
- **AI Counter-Arguments** - Challenge claims with structured counter-arguments at `/api/ai/counter` including assumption analysis and alternative interpretations
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

### Fixed
- Template literal syntax errors in `ArticleCardLarge.tsx`, `Footer.tsx`, `BreakingNewsBanner.tsx`
- Build errors on `/defi`, `/offline`, `/topic` pages

---

## [2.0.0] - 2026-01-15

### Added
- **Archive V2 System** - JSONL-based article storage with enhanced metadata
- **AI-Powered Endpoints** - `/api/sentiment`, `/api/factcheck`, `/api/clickbait` using Groq
- **MCP Server** - Model Context Protocol integration for Claude Desktop and ChatGPT
- **TypeScript SDK** - Published to npm as `@nicholasrq/crypto-news`
- **React SDK** - Component library at `@nicholasrq/react-crypto-news`
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
