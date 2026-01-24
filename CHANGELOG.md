# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### SEO & URL Improvements (Jan 24, 2026)
- **SEO-Friendly Article Slugs** - Article URLs now use readable slugs like `/article/bitcoin-hits-new-ath-2026-01-24` instead of hash IDs
- **Backwards Compatibility** - Both legacy hash IDs and new slugs work, enabling gradual migration
- **Tags System** - Comprehensive 50+ tag taxonomy for crypto news with:
  - Tags index page at `/tags` with category navigation
  - Individual tag pages at `/tags/{slug}` for Bitcoin, Ethereum, DeFi, NFTs, etc.
  - Auto-tagging based on article content
  - Tag-based structured data for Google
- **Enhanced Structured Data**:
  - `APIStructuredData` - SoftwareApplication schema for developer pages
  - `CryptoAssetStructuredData` - FinancialProduct schema for coin pages
  - `VideoStructuredData` - VideoObject schema for video embeds
  - Tag page CollectionPage schema
- **hreflang Alternate Links** - `AlternateLinks` component for international SEO with 18 locale support
- **SEO Image Component** - `SEOImage` wrapper with required alt text, fallback handling, and captions
- **SEO Utilities** - `src/lib/seo.ts` with metadata generators for articles, coins, and categories
- **Google Search Console** - Verification endpoint at `/google[token].html`
- **News Sitemap** - Google News-specific sitemap at `/news-sitemap.xml` with hreflang alternates
- **Robots.txt Improvements** - Multiple sitemaps, AI bot rules (GPTBot, ChatGPT-User)
- **Article Bookmarks** - Save articles for later with localStorage persistence
- **View Tracking Integration** - Track article views with `/api/views` endpoint

#### Blog Content System Improvements (Jan 25, 2026)
- **External Markdown Files** - Blog posts now load from `/content/blog/*.md` files for easier content management
- **Blog Admin Dashboard** - `/admin/blog` page with post listing, statistics, and category filtering
- **Blog API Endpoint** - `/api/blog/posts` returns all post metadata for admin and integrations
- **`/blog` Redirect** - Root `/blog` now redirects to `/en/blog` (default locale)
- **10 New Blog Posts**:
  - `what-is-bitcoin.md` - Complete Bitcoin beginner's guide
  - `ethereum-explained.md` - Ethereum and smart contracts guide
  - `defi-explained.md` - DeFi protocols and yield farming
  - `crypto-security-guide.md` - Security best practices
  - `how-to-buy-crypto.md` - Step-by-step buying guide
  - `layer2-scaling-guide.md` - L2 solutions comparison
  - `crypto-trading-strategies.md` - Trading and technical analysis
  - `nfts-explained.md` - NFT use cases and marketplaces
  - `stablecoins-explained.md` - Stablecoin types and safety
  - `crypto-wallet-guide.md` - Hot vs cold storage
- **Content README** - `/content/blog/README.md` with frontmatter template and guidelines

#### Changelog Automation & Documentation (Jan 25, 2026)
- **`generate-changelog.sh`** - Shell script to generate changelog from git history in Keep a Changelog format
- **`analyze-commits.js`** - Node.js tool to compare commits against CHANGELOG.md, find missing entries
- **`commit-stats.js`** - Comprehensive git statistics: contributors, commit types, activity patterns, velocity
- **`CHANGELOG-AUTOMATION.md`** - Full documentation for changelog automation workflows
- **CI Integration Examples** - GitHub Actions workflow and pre-commit hooks for changelog validation

#### Professional API Integrations (Jan 25, 2026)
- **CoinMarketCap API** - `src/lib/apis/coinmarketcap.ts` with rankings, global metrics, trending, Fear & Greed
- **CryptoQuant API** - `src/lib/apis/cryptoquant.ts` with exchange flows, stablecoin flows, miner activity
- **DefiLlama API** - `src/lib/apis/defillama.ts` with TVL, yields, stablecoins, DEX volumes, bridges
- **Glassnode API** - `src/lib/apis/glassnode.ts` with on-chain metrics, MVRV, SOPR, LTH/STH behavior
- **L2Beat API** - `src/lib/apis/l2beat.ts` with Layer 2 TVL, risk assessments, activity metrics
- **LunarCrush API** - `src/lib/apis/lunarcrush.ts` with social sentiment, influencer tracking, trending topics
- **Messari API** - `src/lib/apis/messari.ts` with asset profiles, research-grade metrics, market intelligence, ROI data
- **The Graph API** - `src/lib/apis/thegraph.ts` with Uniswap V3, Aave V3, Curve pools, cross-protocol DeFi analysis
- **NFT Markets API** - `src/lib/apis/nft-markets.ts` with OpenSea + Reservoir aggregation, collections, sales, trending
- **News Feeds API** - `src/lib/apis/news-feeds.ts` with CryptoPanic + NewsAPI, regulatory updates, sentiment analysis

#### Database & Infrastructure (Jan 24, 2026)
- **Unified Database Layer** - `src/lib/database.ts` with multi-backend support (Vercel KV, Upstash, Memory, File)
- **Secure ID Generation** - `src/lib/utils/id.ts` with `crypto.randomUUID()` for all identifiers
- **Real Export Formats** - Parquet columnar format and SQLite SQL dump in `src/lib/exports/service.ts`
- **Deterministic Analytics** - Removed all `Math.random()` from coverage-gap, causal-inference, arbitrage-scanner

#### New API Endpoints (Jan 25, 2026)
- **`/api/keys`** - API key management (create, list, revoke) with tier-based rate limits
- **`/api/news/categories`** - List all news categories with source counts
- **`/api/newsletter/subscribe`** - Newsletter subscription with Buttondown/ConvertKit/Mailchimp integration
- **`/api/views`** - Article view tracking with 24h/7d trending metrics

#### SDK Documentation (Jan 25, 2026)
- **Python SDK docs** - `docs/sdks/python.md` with async support, Telegram bot examples
- **JavaScript SDK docs** - `docs/sdks/javascript.md` with browser/Node.js usage
- **TypeScript SDK docs** - `docs/sdks/typescript.md` with full type definitions
- **React SDK docs** - `docs/sdks/react.md` with hooks and pre-built components
- **Go SDK docs** - `docs/sdks/go.md` with concurrency patterns and context support
- **PHP SDK docs** - `docs/sdks/php.md` with Laravel integration and WordPress plugin
- **MCP Integration docs** - `docs/integrations/mcp.md` for Claude/ChatGPT AI assistant usage

#### Hook & Component Improvements (Jan 25, 2026)
- **`useApiKey.tsx`** - Full API key management hook with context provider, localStorage persistence
- **`ApiKeyProvider`** - React context for API key state across components

### Changed

#### Market Data Reliability (Jan 25, 2026)
- **CoinPaprika Fallback** - Added as secondary source when CoinGecko rate limits hit
- **Rate Limit Increase** - CoinGecko limit raised from 25 to 50 requests/minute
- **Smart Rate Limiting** - Fallback APIs bypass rate limiter for resilient data fetching
- **Coin ID Mapping** - Automatic mapping between CoinGecko and CoinPaprika identifiers

#### TypeScript Fixes (Jan 25, 2026)
- **L2Beat API Types** - Fixed type annotation for L2 project activity data
- **Watchlist Service** - Improved documentation for `getDefaultUserId()` fallback behavior

### Fixed

#### Coin Page "Not Found" Fix (Jan 25, 2026)
- **`getCoinDetails()`** - Now uses CoinPaprika as fallback when CoinGecko fails
- **Multi-API Fallback Chain** - CoinGecko → CoinPaprika → Binance → CryptoCompare
- **Rate Limit Resilience** - Individual coin pages no longer fail during traffic spikes

#### AI Market Intelligence Agent (Jan 24, 2026)
- **Revolutionary AI Market Agent** - `/ai-agent` page with comprehensive market analysis dashboard
- **Multi-Source Signal Aggregation** - Synthesizes news, social sentiment, on-chain data, and derivatives into unified intelligence
- **Market Regime Detection** - Automatically classifies market phase (accumulation, markup, distribution, markdown, ranging, capitulation, euphoria)
- **Fear & Greed Index** - Real-time calculation with visual gauge component
- **Trading Opportunity Identification** - AI-generated trade ideas with entry, target, and stop-loss levels
- **Risk Alert System** - Proactive warnings for funding extremes, sentiment extremes, correlation breakdowns
- **Correlation Anomaly Detection** - Identifies unusual correlation patterns between asset pairs
- **Sector Rotation Analysis** - Tracks capital flow across DeFi, L1, L2, Meme sectors with leading/lagging assets
- **Natural Language Query Interface** - Ask questions like "Should I buy BTC?" or "What are the current risks?"
- **Upcoming Catalysts Tracker** - Monitors macro events, upgrades, regulatory dates, governance votes
- **`/api/ai/agent`** - New REST API endpoint (GET for intelligence, POST for queries)
- **`AIMarketAgentDashboard`** - Interactive dashboard component with tabs (Overview, Signals, Opportunities, Risks, Chat)
- **`ai-market-agent.ts`** - 1,300+ line market intelligence engine library

#### Coverage Gap Analysis (Jan 24, 2026)
- **Coverage Gap Detection** - `/coverage-gap` page to identify under-covered crypto topics
- **Topic Trend Tracking** - Monitor rising/falling coverage trends by topic
- **Source Diversity Analysis** - Analyze news source distribution with entropy-based diversity scoring
- **Gap Severity Ratings** - Critical/high/medium/low severity for coverage gaps
- **Suggested Story Angles** - AI-recommended angles for under-covered topics
- **`/api/coverage-gap`** - New API with actions: report, gaps, trends, topic, sources
- **`CoverageGapDashboard`** - Interactive dashboard with tabs for overview, gaps, trends, sources
- **`coverage-gap.ts`** - Comprehensive coverage analysis library

#### Protocol Health & DeFi Risk Engine (Jan 23, 2026)
- **Protocol Health Monitoring** - Real-time health scoring for DeFi protocols
- **Risk Factor Analysis** - Multi-dimensional risk assessment (smart contract, liquidity, governance, oracle, market)
- **DeFi Correlation Tracker** - Cross-protocol correlation analysis
- **Yield Sustainability Scoring** - Identify unsustainable yield opportunities
- **Liquidation Risk Alerts** - Early warning for cascade liquidation scenarios
- **Regulatory Intelligence** - `/regulatory` page with jurisdiction tracker
- **`/api/regulatory`** - API for regulatory news and compliance updates
- **`regulatory-intelligence.ts`** - Regulatory monitoring library

#### Trading & Premium Features (Jan 22-23, 2026)
- **Options Flow Dashboard** - `/options` page with unusual options activity
- **Order Book Dashboard** - `/orderbook` page with real market depth visualization
- **Whale Alerts Dashboard** - `/whales` page tracking large wallet movements
- **Predictions Dashboard** - `/predictions` for market predictions and forecasting
- **Influencers Tracking** - `/influencers` page with reliability scoring for crypto influencers
- **`OptionsFlowDashboard`** - Component for options flow visualization
- **`OrderBookDashboard`** - Real-time order book component
- **`WhaleAlertsDashboard`** - Whale movement tracking component
- **`PredictionsDashboard`** - Market predictions component
- **`InfluencersDashboard`** - Influencer tracking with call history

#### Enterprise API Features (Jan 22, 2026)
- **Stripe Billing Integration** - `/billing` page with subscription management
- **Multi-Tier API Plans** - Free, Pro, Business, Enterprise tiers with different rate limits
- **API Key Management** - `/settings/api` for key generation and management
- **Usage Analytics Dashboard** - Track API calls, rate limits, and quotas
- **Webhook Delivery System** - Configurable webhooks for real-time notifications
- **x402 Payment Protocol** - Micropayment support for premium endpoints

#### Social & Community Features (Jan 21, 2026)
- **Social Monitoring Dashboard** - Track Twitter/X, Reddit, Telegram sentiment
- **TradingView Chart Integration** - Professional charting with TradingView widgets
- **Tax Report Generation** - Export transaction history for tax purposes
- **Oracle Chat** - AI-powered chat interface for market questions
- **Portfolio Performance Charts** - Visualization of portfolio P&L over time

#### Real-Time Infrastructure (Jan 20, 2026)
- **WebSocket Server** - Real-time updates for prices, news, and alerts
- **Webhook Queue System** - Reliable webhook delivery with retry logic
- **Background Job Processing** - Queue-based job execution for heavy tasks

### Changed

#### Infrastructure Updates (Jan 24, 2026)
- **Next.js 16 Proxy Migration** - Renamed `middleware.ts` to `proxy.ts` for Next.js 16 compatibility
- **Market Data Fallback** - Added CoinPaprika as fallback for CoinGecko rate limits
- **Multi-API Fallbacks** - Binance and CryptoCompare as additional price sources
- **Coverage Gap Fix** - Fixed `getLatestNews()` to properly extract articles from NewsResponse

#### TypeScript & Build Fixes (Jan 23, 2026)
- **Regulatory Route Fix** - Fixed TypeScript errors in `/api/regulatory/route.ts`
- **NewsArticle Type Fixes** - Resolved type mismatches throughout codebase
- **Build Optimization** - Fixed all compilation errors for production builds

#### Admin & Infrastructure (Jan 18-20, 2026)
- **Enhanced Admin Dashboard** - `/admin` with API key analytics and usage monitoring
- **Professional Navigation Redesign** - Search, commands & utilities in header
- **Design System Overhaul** - Accessibility improvements and brand color fixes
- **A11y Improvements** - WCAG AA compliance, better contrast, keyboard navigation
- **SEO Structured Data** - Enhanced meta tags and Open Graph support
- **Dark Mode Fixes** - Proper dark mode toggle for Tailwind v4

#### Accessibility & Design (Jan 16-17, 2026)
- **Accessibility Audit Tools** - Scripts for a11y and contrast auditing
- **Brand Color Contrast Fix** - WCAG AA compliant brand colors
- **Mega Menu Navigation** - Refined professional design, compact dropdowns
- **ErrorFallback Component** - Error boundary with fallback UI

### Fixed
- Coverage gap analysis now correctly extracts `.articles` from `NewsResponse`
- Regulatory API route TypeScript errors with NewsArticle type
- Component import errors in options, orderbook, whales, predictions, influencers pages
- Market data API gracefully falls back when CoinGecko rate limits hit
- Template literal syntax errors in `ArticleCardLarge.tsx`, `Footer.tsx`, `BreakingNewsBanner.tsx`
- Build errors on `/defi`, `/offline`, `/topic` pages
- Dark mode toggle for Tailwind v4
- TypeScript error: use `.price` instead of `.usd`
- Edge Runtime compatibility: removed Node.js fs/path modules from alerts.ts
- Await params in topic page for Next.js 15+ compatibility
- Extract RefreshButton to client component for `/offline` page

---

## [2.5.0] - 2026-01-22

### Added

#### AI Intelligence
- **Event Classification** - `/api/classify` with 13 event types (funding, hack, regulation, partnership, product launch, acquisition, legal, market movement, security, network upgrade, governance, research, opinion)
- **Claim Extraction** - `/api/claims` extracts factual claims with attribution, verifiability analysis, and confidence scores
- **AI Daily Brief** - `/api/ai/brief` generates comprehensive daily crypto news digest with market overview, top stories, sector analysis, and risk alerts
- **AI Bull vs Bear Debate** - `/api/ai/debate` creates balanced bull/bear perspectives for any article or topic
- **AI Counter-Arguments** - `/api/ai/counter` challenges claims with structured counter-arguments including assumption analysis and alternative interpretations

#### Analytics & Intelligence
- **Anomaly Detection** - `/api/analytics/anomalies` detects unusual coverage patterns, volume spikes, and sentiment shifts
- **Source Credibility** - `/api/analytics/credibility` provides credibility scoring for news sources based on accuracy, speed, and bias
- **Headline Tracking** - `/api/analytics/headlines` tracks headline changes and mutations over time

#### International News
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

#### Core Features
- **Archive V2 System** - JSONL-based article storage with enhanced metadata
- **AI-Powered Endpoints** - `/api/sentiment`, `/api/factcheck`, `/api/clickbait` using Groq
- **MCP Server** - Model Context Protocol integration for Claude Desktop and ChatGPT
- **TypeScript SDK** - Published to npm as `@nirholas/crypto-news`
- **React SDK** - Component library at `@nirholas/react-crypto-news`
- **Trending Topics** - `/api/trending` endpoint with sentiment analysis
- **Market Context** - `/api/market` endpoint with price data

#### Pages & Navigation
- **Trending Page** - `/trending` for trending news and topics
- **DeFi Page** - `/defi` for DeFi-specific news section
- **Digest Page** - `/digest` for AI-generated news digest
- **Sentiment Page** - `/sentiment` for market sentiment analysis
- **Sources Page** - `/sources` listing all news sources
- **Source Page** - `/source/[id]` for individual source news
- **Topics Page** - `/topics` listing all topics
- **Topic Page** - `/topic/[id]` for individual topic news
- **Category Page** - `/category/[id]` for category-based news view
- **Coin Page** - `/coin/[id]` for individual cryptocurrency news
- **Movers Page** - `/movers` for top gainers and losers
- **Search Page** - `/search` for news search functionality
- **Read Page** - `/read/[id]` for article reader view
- **Bookmarks Page** - `/bookmarks` for saved articles
- **About Page** - `/about` for project information and credits
- **Examples Page** - `/examples` for API usage examples
- **Markets Page** - `/markets` for crypto market overview

#### AI Endpoints
- **Summarize API** - `/api/summarize` for AI article summaries
- **Ask API** - `/api/ask` for AI Q&A about crypto news
- **Digest API** - `/api/digest` for AI daily digest generation
- **Sentiment API** - `/api/sentiment` for deep sentiment analysis
- **Entities API** - `/api/entities` to extract people, companies, tickers
- **Narratives API** - `/api/narratives` for market narrative detection
- **Signals API** - `/api/signals` for news-based trading signals
- **Factcheck API** - `/api/factcheck` for claim verification
- **Clickbait API** - `/api/clickbait` for clickbait detection
- **Article API** - `/api/article` for single article fetching
- **Cache API** - `/api/cache` for cache management

#### Libraries
- **Market Data Library** - `market-data.ts` with CoinGecko and DeFiLlama integration
- **Groq Library** - `groq.ts` for Groq AI integration for summaries
- **Categories Library** - `categories.ts` for news categorization logic
- **Cache Library** - `cache.ts` for caching utilities
- **API Utils Library** - `api-utils.ts` for API helper functions
- **Dedupe Library** - `dedupe.ts` for article deduplication

#### Components
- **TrendingTopics** - Trending topics component with sentiment
- **HeaderNew** - New header design component
- **NewsletterSignup** - Email subscription form
- **ReaderContent** - Article reader view component
- **SearchPageContent** - Search results page component
- **ShareButtons** - Social sharing buttons
- **BookmarkButton** - Save article bookmark button
- **BookmarksProvider** - Bookmarks context and storage
- **BookmarksPageContent** - Saved articles page content

### Changed
- Migrated from JSON to JSONL archive format
- Enhanced article enrichment pipeline
- Improved caching strategies
- Updated hero section design
- Updated header navigation design
- Updated footer with more links
- Updated home page layout with featured articles
- Enhanced news API with caching and filtering
- Updated crypto-news library with improved fetching
- Updated translation library with improved i18n support

---

## [1.6.0] - 2026-01-10

### Added
- **i18n Infrastructure** - Full internationalization with 18 locales
- **Alfred Workflow** - macOS Alfred integration for quick crypto news
- **Raycast Extension** - Raycast integration for crypto news
- **CLI Tool** - Command-line interface for news fetching
- **Browser Extension** - Chrome/Firefox extension for news popup
- **ChatGPT Plugin** - OpenAPI specification for ChatGPT integration
- **MkDocs Site** - Documentation site with Material theme

### Changed
- Package renamed from `@nicholasrq` to `@nirholas`
- Enhanced package descriptions across SDKs

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

#### Core Infrastructure
- **Next.js Application** - Full Next.js application source code
- **TypeScript Configuration** - Complete TypeScript setup
- **Tailwind CSS** - Tailwind CSS v4 configuration
- **Package Dependencies** - All required npm packages
- **Core API** - `/api/news` endpoint for latest news

#### News Sources (Initial)
- CoinDesk
- CoinTelegraph
- Decrypt
- The Block
- Bitcoin Magazine

#### SDKs
- **Go SDK** - Native Go client library (`sdk/go`)
- **JavaScript SDK** - Browser and Node.js client (`sdk/javascript`)
- **PHP SDK** - PHP client library (`sdk/php`)
- **Python SDK** - Zero-dependency Python client (`sdk/python`)
- **React SDK** - React component library (`sdk/react`)
- **TypeScript SDK** - TypeScript client library (`sdk/typescript`)

#### Integrations
- **MCP Server** - Model Context Protocol server for AI assistants
- **ChatGPT Plugin** - OpenAPI specification for ChatGPT
- **CLI Tool** - Command-line interface for news fetching
- **Browser Extension** - Chrome/Firefox popup extension
- **Alfred Workflow** - macOS Alfred integration
- **Raycast Extension** - Raycast integration

#### Example Integrations
- Discord Bot - Example Discord bot integration
- Slack Bot - Example Slack bot integration
- Telegram Bot - Example Telegram bot integration
- cURL Examples - Shell script examples
- AI Analysis - Python AI analysis examples
- Real-time Streaming - WebSocket streaming examples
- LangChain Tool - LangChain integration example

#### Widgets
- **Ticker Widget** - Embeddable news ticker
- **Carousel Widget** - Embeddable news carousel

#### Documentation
- **Comprehensive README** - Multi-language README files (AR, DE, ES, FR, IT, JA, KO, NL, PL, PT, RU, TR, ZH-CN, ZH-TW)
- **API Documentation** - Full API documentation
- **Security Policy** - Security disclosure guidelines
- **Contributing Guide** - How to contribute
- **Architecture Documentation** - System architecture overview
- **Deployment Guide** - Deployment instructions

#### API Endpoints
- **`GET /api/news`** - Latest news with pagination
- **`GET /api/health`** - Health check endpoint
- **CORS Support** - Open API for any domain
- **In-Memory Caching** - 5-minute TTL cache

#### DevOps
- **GitHub Workflows** - CI/CD configuration
- **Issue Templates** - Bug report and feature request templates
- **PR Templates** - Pull request checklists
- **Environment Template** - `.env.example` for configuration

---

## Types of Changes

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Features to be removed in future
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements
