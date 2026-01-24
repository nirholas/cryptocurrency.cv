# Free Crypto News - Complete Architecture Analysis

## Executive Summary

**Free Crypto News** is a sophisticated, production-grade Next.js 16 application that serves as a comprehensive cryptocurrency news aggregator and market data platform. The project stands out for its **100% free, no-API-key-required** approach to delivering real-time crypto news from **12 major RSS sources** including CoinDesk, The Block, Decrypt, CoinTelegraph, Bitcoin Magazine, Blockworks, The Defiant, Bitcoinist, CryptoSlate, NewsBTC, Crypto.news, and CryptoPotato.

The application is built on a modern tech stack featuring **React 19**, **Next.js 16 App Router**, **TypeScript**, and **Tailwind CSS 4**, running on **Vercel Edge Runtime** for low-latency global delivery. It implements a full **Progressive Web App (PWA)** with service workers, offline capability, and push notifications.

The architecture follows a layered design with clear separation of concerns: **API Layer** (100+ Edge-compatible REST endpoints), **Core Libraries** (news aggregation, market data, AI integration, caching), **UI Components** (84+ reusable React components), and **State Management** (React Context providers for bookmarks, watchlist, portfolio, alerts, and theme). The caching strategy employs an in-memory cache with configurable TTLs per data type, achieving 5-minute freshness for news and 30-second updates for market prices.

A standout feature is the **multi-provider AI integration** supporting OpenAI, Anthropic, Groq, and OpenRouter for sentiment analysis, summarization, fact-checking, and automated market digests. The platform also implements the **x402 micropayment protocol** from Coinbase for premium API access, enabling pay-per-request pricing with USDC on Base network.

The **internationalization system** supports **18 languages** with full RTL support (Arabic), using `next-intl` with locale-prefixed routing. International news sources from Korea, China, Japan, and Spanish-speaking regions can be auto-translated. The project includes extensive developer tooling: SDKs for 7 languages (Python, JavaScript, TypeScript, React, Go, PHP, Rust), MCP servers for Claude/ChatGPT integration, browser extensions, CLI tools, and embeddable widgets.

The codebase demonstrates professional engineering practices including comprehensive error handling, rate limiting, ETag-based cache validation, structured data/SEO optimization, accessibility compliance, keyboard navigation, and extensive testing infrastructure (Vitest, Playwright, Storybook).

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Framework** | Next.js | 16.1.1 | React SSR + API routes, App Router |
| **Runtime** | Vercel Edge | - | Low-latency serverless functions |
| **Language** | TypeScript | 5.x | Type-safe development |
| **UI Library** | React | 19.2.3 | Component-based UI |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **i18n** | next-intl | 4.7.0 | Internationalization |
| **Charts** | Recharts | 2.15.4 | Data visualization |
| **Icons** | Lucide React | 0.562.0 | Icon system |
| **Animations** | Framer Motion | 12.28.1 | UI animations |
| **State** | SWR | 2.3.8 | Data fetching/caching |
| **Payments** | @x402/* | 2.2.0 | Micropayments protocol |
| **Caching** | Redis | 5.10.0 | Optional persistent cache |
| **Testing** | Vitest | - | Unit testing |
| **E2E Testing** | Playwright | 1.57.0 | End-to-end testing |
| **Stories** | Storybook | 8.6.14 | Component documentation |

---

## Complete Component Catalog

### Core Application Components

| Component | Purpose | Complexity | Dependencies |
|-----------|---------|------------|--------------|
| `Header.tsx` | Main navigation with mega menus, search, theme toggle | 5 | MobileNav, ThemeToggle, SearchModal, CommandPalette, LanguageSwitcher, PriceWidget |
| `Footer.tsx` | Site footer with categories, links, social | 3 | categories, i18n/navigation |
| `ThemeProvider.tsx` | Dark mode context with system detection & persistence | 4 | Context API, localStorage |
| `BookmarksProvider.tsx` | Article bookmarking context with localStorage | 3 | Context API, localStorage |
| `PWAProvider.tsx` | PWA context (install, service worker, push, cache) | 5 | Service Worker API, Push API |
| `KeyboardShortcuts.tsx` | Global keyboard navigation (j/k, g+key combos) | 4 | Context API, useRouter |
| `GlobalSearch.tsx` | Command palette wrapper | 2 | KeyboardShortcuts, SearchModal |
| `Toast.tsx` | Toast notification system | 3 | Context API, Framer Motion |

### News Display Components

| Component | Purpose | Complexity | Dependencies |
|-----------|---------|------------|--------------|
| `NewsCard.tsx` | Versatile article card (default/compact/horizontal) | 3 | archive-v2, reading-time, i18n |
| `HeroArticle.tsx` | Full-width featured article display | 3 | archive-v2, StructuredData |
| `EditorsPicks.tsx` | 3-article featured section | 2 | NewsCard |
| `BreakingNewsBanner.tsx` | Animated breaking news ticker | 3 | Framer Motion |
| `BreakingNewsTicker.tsx` | Horizontal scrolling ticker | 2 | CSS animations |
| `TrendingSidebar.tsx` | Right sidebar with trending, market stats, categories | 4 | MarketStats, NewsCard, NewsletterSignup |
| `SourceSections.tsx` | News grouped by source | 3 | NewsCard |
| `Posts.tsx` | Article list with infinite scroll | 3 | InfiniteScroll, NewsCard |
| `RelatedArticles.tsx` | Related article suggestions | 2 | archive-v2 |
| `RelatedArticlesSection.tsx` | Related section with layout | 2 | RelatedArticles |
| `ArticleContent.tsx` | Full article reader with AI summary | 4 | SocialShare, BookmarkButton |
| `ArticleReactions.tsx` | Emoji reactions for articles | 2 | - |
| `FeaturedArticle.tsx` | Large featured article card | 3 | - |

### Card Variants (`cards/`)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `ArticleCardLarge.tsx` | Premium large card with image | 4 |
| `ArticleCardMedium.tsx` | Standard card with image | 3 |
| `ArticleCardSmall.tsx` | Compact card for lists | 2 |
| `ArticleCardList.tsx` | Horizontal list item | 2 |
| `CardBookmarkButton.tsx` | Bookmark action for cards | 2 |
| `CardImage.tsx` | Lazy-loaded card images | 2 |
| `CardSkeletons.tsx` | Loading skeletons | 2 |
| `QuickShareButton.tsx` | Quick share action | 2 |
| `ReadingProgress.tsx` | Reading progress bar | 2 |
| `SentimentBadge.tsx` | Sentiment indicator badge | 1 |

### Market Data Components

| Component | Purpose | Complexity | Dependencies |
|-----------|---------|------------|--------------|
| `PriceTicker.tsx` | Live BTC/ETH/SOL prices with F&G index | 3 | market-data |
| `MarketStats.tsx` | Market overview widget (cap, volume, dominance) | 4 | market-data |
| `PriceWidget.tsx` | Compact price display | 2 | market-data |
| `PriceAlerts.tsx` | Price alert management | 4 | alerts, Toast |
| `SentimentDashboard.tsx` | AI sentiment gauges and charts | 5 | Recharts, market-data |
| `charts.tsx` | Chart components | 4 | Recharts |
| `coin-charts/index.tsx` | Coin price charts | 4 | Recharts, market-data |

### Watchlist & Portfolio (`watchlist/`, `portfolio/`)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `WatchlistProvider.tsx` | Watchlist context with localStorage | 3 |
| `WatchlistButton.tsx` | Add/remove watchlist toggle | 2 |
| `WatchlistMiniWidget.tsx` | Compact watchlist display | 2 |
| `WatchlistExport.tsx` | Export watchlist data | 2 |
| `PortfolioProvider.tsx` | Portfolio context with holdings | 4 |
| `PortfolioSummary.tsx` | Portfolio value/P&L summary | 3 |
| `HoldingsTable.tsx` | Holdings data table | 3 |
| `AddHoldingModal.tsx` | Add holding modal form | 3 |

### Alerts System (`alerts/`)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `AlertsProvider.tsx` | Alerts context | 3 |
| `AlertsList.tsx` | Alert management list | 3 |
| `PriceAlertButton.tsx` | Quick alert toggle | 2 |
| `PriceAlertModal.tsx` | Alert creation modal | 3 |

### Sidebar Components (`sidebar/`)

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `EditorsPicks.tsx` | Sidebar editor's picks | 2 |
| `NewsletterSignup.tsx` | Newsletter subscription form | 2 |
| `PopularStories.tsx` | Popular stories widget | 2 |
| `TrendingNews.tsx` | Trending news widget | 2 |

### Navigation & Search

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `MobileNav.tsx` | Mobile hamburger menu | 3 |
| `CategoryNav.tsx` | Category navigation bar | 2 |
| `Breadcrumbs.tsx` | Breadcrumb navigation | 2 |
| `SearchModal.tsx` | Full-screen search modal | 4 |
| `SearchAutocomplete.tsx` | Search with suggestions | 3 |
| `SearchPageContent.tsx` | Search results page content | 3 |
| `CommandPalette.tsx` | Cmd+K command palette | 4 |
| `LanguageSwitcher.tsx` | Language selection dropdown | 2 |

### Utility Components

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `ThemeToggle.tsx` | Dark/light mode toggle | 1 |
| `BackToTop.tsx` | Scroll to top button | 1 |
| `ReadingProgress.tsx` | Article reading progress | 2 |
| `InfiniteScroll.tsx` | Infinite scroll container | 3 |
| `Skeleton.tsx` | Loading skeleton | 1 |
| `Skeletons.tsx` | Multiple skeleton patterns | 2 |
| `LoadingSpinner.tsx` | Loading indicator | 1 |
| `EmptyState.tsx` | Empty state display | 1 |
| `EmptyStates.tsx` | Multiple empty states | 2 |
| `ErrorBoundary.tsx` | Error boundary wrapper | 2 |
| `RefreshButton.tsx` | Manual refresh button | 1 |
| `ScrollRestoration.tsx` | Scroll position restoration | 2 |
| `LinkPrefetch.tsx` | Link prefetching | 2 |
| `FocusManagement.tsx` | Focus trap/management | 2 |
| `ProtocolImage.tsx` | Protocol logo with fallback | 2 |

### Sharing & Social

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `ShareButtons.tsx` | Social share buttons | 2 |
| `SocialShare.tsx` | Share modal/dropdown | 3 |
| `BookmarkButton.tsx` | Article bookmark toggle | 2 |

### PWA & Notifications

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `InstallPrompt.tsx` | PWA install prompt | 3 |
| `UpdatePrompt.tsx` | Service worker update prompt | 2 |
| `OfflineIndicator.tsx` | Offline status indicator | 2 |
| `NotificationSettings.tsx` | Push notification settings | 3 |
| `PushNotifications.tsx` | Push notification handler | 3 |

### SEO & Structured Data

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `StructuredData.tsx` | JSON-LD structured data (Website, Organization, NewsList, Article, Breadcrumb) | 3 |

### Animation Components

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `Animations.tsx` | Shared animation utilities | 2 |
| `FramerAnimations.tsx` | Framer Motion wrappers | 3 |

### Premium Features

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `X402PaymentButton.tsx` | x402 payment button | 3 |
| `x402/PaymentProvider.tsx` | x402 payment context | 4 |

### Specialized

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `NewsletterForm.tsx` | Newsletter subscription | 2 |
| `SourceComparison.tsx` | Source comparison tool | 3 |
| `TrendingTopics.tsx` | Trending topics display | 2 |
| `ExamplesContent.tsx` | API examples display | 2 |
| `ReaderContent.tsx` | Article reader view | 3 |
| `ReadingAnalytics.tsx` | Reading analytics | 2 |

**Total Components: 84+**

---

## Complete API Endpoint Reference

### News Endpoints (Free)

| Route | Method | Purpose | Cache |
|-------|--------|---------|-------|
| `/api/news` | GET | Latest news (limit, source, from, to, page, lang) | 5 min |
| `/api/news/international` | GET | International news (ko, zh, ja, es) | 5 min |
| `/api/search` | GET | Search news by keyword | 1 min |
| `/api/breaking` | GET | Breaking news (last 2 hours) | 1 min |
| `/api/trending` | GET | Trending topics with sentiment | 5 min |
| `/api/bitcoin` | GET | Bitcoin-specific news | 5 min |
| `/api/defi` | GET | DeFi-specific news | 5 min |
| `/api/sources` | GET | List all news sources | 1 hour |

### Market Data Endpoints

| Route | Method | Purpose | Cache |
|-------|--------|---------|-------|
| `/api/market/coins` | GET | Top coins with prices | 1 min |
| `/api/market/search` | GET | Search coins | 5 min |
| `/api/market/compare` | GET | Compare multiple coins | 1 min |
| `/api/market/history/[coinId]` | GET | Price history (days param) | Variable |
| `/api/market/ohlc/[coinId]` | GET | OHLC candlestick data | 5 min |
| `/api/market/tickers/[coinId]` | GET | Exchange tickers | 2 min |
| `/api/market/social/[coinId]` | GET | Social/community data | 30 min |
| `/api/market/snapshot/[coinId]` | GET | Historical snapshot | 30 min |
| `/api/market/defi` | GET | DeFi protocols TVL | 5 min |
| `/api/market/derivatives` | GET | Derivatives markets | 2 min |
| `/api/market/exchanges` | GET | Exchange list | 1 hour |
| `/api/market/exchanges/[id]` | GET | Exchange details | 2 min |
| `/api/market/categories` | GET | Coin categories | 1 hour |
| `/api/market/categories/[id]` | GET | Category details | 5 min |

### AI Endpoints (Requires API Key)

| Route | Method | Purpose | Cache |
|-------|--------|---------|-------|
| `/api/ai` | GET/POST | Multi-action AI (summarize, sentiment, facts, factcheck, translate) | 24 hrs |
| `/api/ai/brief` | GET | AI market brief | 15 min |
| `/api/ai/counter` | GET | AI counter-arguments | 24 hrs |
| `/api/ai/debate` | GET | AI bull vs bear debate | 15 min |
| `/api/sentiment` | GET | AI sentiment analysis | 5 min |
| `/api/digest` | GET | AI daily digest | 15 min |
| `/api/summarize` | POST | Summarize article | 24 hrs |
| `/api/analyze` | POST | Deep article analysis | 24 hrs |
| `/api/classify` | POST | Article classification | 24 hrs |
| `/api/factcheck` | POST | Fact-check claims | 24 hrs |
| `/api/clickbait` | POST | Clickbait detection | 24 hrs |
| `/api/entities` | POST | Entity extraction | 24 hrs |
| `/api/claims` | POST | Claim extraction | 24 hrs |
| `/api/narratives` | GET | Market narratives | 15 min |

### Analytics & Signals

| Route | Method | Purpose | Cache |
|-------|--------|---------|-------|
| `/api/signals` | GET | Alpha trading signals | 30 sec |
| `/api/analytics/anomalies` | GET | Anomaly detection | 5 min |
| `/api/analytics/headlines` | GET | Headline tracking | 5 min |
| `/api/analytics/credibility` | GET | Source credibility | 1 hour |

### User Features

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/alerts` | GET/POST | Manage price alerts |
| `/api/alerts/[id]` | PUT/DELETE | Update/delete alert |
| `/api/portfolio` | GET/POST | Portfolio management |
| `/api/portfolio/holding` | POST/PUT/DELETE | Manage holdings |
| `/api/webhooks` | POST | Register webhooks |
| `/api/push` | POST | Push notification subscription |
| `/api/newsletter` | POST | Newsletter signup |

### Feed Formats

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/rss` | GET | RSS 2.0 feed |
| `/api/atom` | GET | Atom feed |
| `/api/opml` | GET | OPML source list |

### Infrastructure

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Health check with source status |
| `/api/stats` | GET | API usage statistics |
| `/api/cache` | GET/DELETE | Cache management |
| `/api/origins` | GET | CORS origins |

### Real-time

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sse` | GET | Server-Sent Events stream |
| `/api/ws` | GET | WebSocket info |

### Archive

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/archive` | GET | Historical articles |
| `/api/archive/v2` | GET | Enhanced archive |

### Premium (x402/API Key)

| Route | Method | Purpose | Price |
|-------|--------|---------|-------|
| `/api/premium` | GET | Premium info | Free |
| `/api/premium/api-keys` | POST | Generate API key | $5/mo |
| `/api/premium/market/coins` | GET | Extended coin data | $0.001 |
| `/api/premium/market/history` | GET | Extended history | $0.02/yr |
| `/api/premium/streams/prices` | GET | Live price stream | $0.01/hr |
| `/api/premium/ai/analyze` | POST | Deep AI analysis | $0.005 |
| `/api/premium/ai/signals` | GET | AI trading signals | $0.005 |
| `/api/premium/ai/sentiment` | GET | Batch sentiment | $0.005 |
| `/api/premium/ai/compare` | GET | AI coin comparison | $0.005 |
| `/api/premium/ai/summary` | POST | AI summary | $0.005 |
| `/api/premium/smart-money` | GET | Smart money tracking | $0.005 |
| `/api/premium/whales/transactions` | GET | Whale transactions | $0.005 |
| `/api/premium/whales/alerts` | GET | Whale alerts | $0.005 |
| `/api/premium/defi/protocols` | GET | DeFi protocol details | $0.002 |
| `/api/premium/analytics/screener` | GET | Advanced screener | $0.05 |
| `/api/premium/screener/advanced` | GET | Custom screener | $0.05 |
| `/api/premium/alerts/whales` | GET | Whale alert config | $0.002 |
| `/api/premium/alerts/custom` | POST | Custom alert rules | $0.002 |
| `/api/premium/portfolio/analytics` | GET | Portfolio analytics | $0.002 |
| `/api/premium/export/portfolio` | GET | Portfolio export | $0.10 |

### Versioned API (v1)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1` | GET | API documentation |
| `/api/v1/coin/[coinId]` | GET | Coin details |
| `/api/v1/coins` | GET | Coin list |
| `/api/v1/global` | GET | Global market data |
| `/api/v1/trending` | GET | Trending coins |
| `/api/v1/search` | GET | Search |
| `/api/v1/exchanges` | GET | Exchanges |
| `/api/v1/defi` | GET | DeFi data |
| `/api/v1/gas` | GET | Gas prices |
| `/api/v1/historical/[coinId]` | GET | Historical data |
| `/api/v1/alerts` | GET | Alert templates |
| `/api/v1/assets` | GET | Asset list |
| `/api/v1/assets/[assetId]/history` | GET | Asset history |
| `/api/v1/market-data` | GET | Market data |
| `/api/v1/export` | GET | Data export |
| `/api/v1/x402` | GET | x402 payment info |

### Special Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/openapi.json` | GET | OpenAPI 3.0 spec |
| `/api/docs` | GET | API docs redirect |
| `/api/admin` | GET/POST | Admin endpoints |
| `/api/og` | GET | OG image generation |
| `/api/i18n/translate` | POST | Translate content |
| `/api/gateway` | GET | API gateway proxy |
| `/api/upgrade` | POST | Upgrade prompts |

**Total Endpoints: 100+**

---

## Page Routes

| Route | Purpose | Rendering |
|-------|---------|-----------|
| `/[locale]` | Homepage with hero, news grid, sidebar | SSG + ISR (5 min) |
| `/[locale]/article/[id]` | Article detail with AI summary | SSG + ISR |
| `/[locale]/markets` | Markets dashboard with coins table | SSR (1 min) |
| `/[locale]/coin/[coinId]` | Coin detail page with charts | SSR (1 min) |
| `/[locale]/defi` | DeFi dashboard with protocols | SSR (1 min) |
| `/[locale]/trending` | Trending topics | SSR (5 min) |
| `/[locale]/sentiment` | AI sentiment dashboard | SSR (5 min) |
| `/[locale]/search` | Search results page | Client |
| `/[locale]/category/[category]` | Category news feed | SSG + ISR |
| `/[locale]/topic/[topic]` | Topic news feed | SSR |
| `/[locale]/source/[source]` | Source news feed | SSR |
| `/[locale]/sources` | All sources listing | SSG |
| `/[locale]/topics` | All topics listing | SSG |
| `/[locale]/bookmarks` | User bookmarks | Client |
| `/[locale]/watchlist` | User watchlist | Client |
| `/[locale]/portfolio` | Portfolio tracker | Client |
| `/[locale]/compare` | Coin comparison tool | Client |
| `/[locale]/movers` | Top gainers/losers | SSR |
| `/[locale]/digest` | AI daily digest | SSR |
| `/[locale]/about` | About page | SSG |
| `/[locale]/developers` | Developer portal | SSG |
| `/[locale]/examples` | API examples | SSG |
| `/[locale]/pricing` | Pricing/plans | SSG |
| `/[locale]/settings` | User settings | Client |
| `/[locale]/read` | Reading list | Client |
| `/[locale]/share/[id]` | Shareable article | SSR |
| `/[locale]/offline` | Offline fallback | Static |
| `/[locale]/admin` | Admin dashboard | Client |

---

## Data Flow Architecture

### News Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           NEWS DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CoinDesk   │     │  The Block  │     │   Decrypt   │
│  RSS Feed   │     │  RSS Feed   │     │  RSS Feed   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌────────────▼────────────┐
              │  crypto-news.ts         │
              │  ─────────────────────  │
              │  • Parallel fetch       │
              │  • XML parsing          │
              │  • HTML sanitization    │
              │  • Deduplication        │
              │  • Time-ago calc        │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  cache.ts (MemoryCache) │
              │  ─────────────────────  │
              │  • 180s TTL for feeds   │
              │  • 1000 max entries     │
              │  • Auto-cleanup         │
              └────────────┬────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐   ┌────────▼────────┐   ┌──────▼──────┐
│ API Routes  │   │  Page Routes    │   │ SSE/WebSocket│
│ /api/news   │   │  Homepage       │   │ Real-time    │
└─────────────┘   └─────────────────┘   └──────────────┘
```

### Market Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MARKET DATA FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CoinGecko  │     │ DeFiLlama   │     │Alternative.me│
│  API        │     │  API        │     │  (Fear/Greed)│
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
              ┌────────────▼────────────┐
              │  market-data.ts         │
              │  ─────────────────────  │
              │  • Rate limiting (25/min)│
              │  • Stale-while-revalidate│
              │  • Fallback handling    │
              │  • Type normalization   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Variable TTL Cache     │
              │  ─────────────────────  │
              │  • prices: 30s          │
              │  • tickers: 120s        │
              │  • historical: 300-1800s│
              │  • static: 3600s        │
              └────────────┬────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐   ┌────────▼────────┐   ┌──────▼──────┐
│PriceTicker  │   │  MarketStats    │   │ Coin Pages  │
│Component    │   │  Component      │   │             │
└─────────────┘   └─────────────────┘   └─────────────┘
```

### AI Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI INTEGRATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     AI Provider Selection                                │
│  Priority: OpenAI → Anthropic → Groq → OpenRouter                       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    ai-enhanced.ts           │
                    │    groq.ts                  │
                    │  ────────────────────────── │
                    │  • summarizeArticle()       │
                    │  • analyzeSentiment()       │
                    │  • extractFacts()           │
                    │  • factCheck()              │
                    │  • categorizeArticle()      │
                    │  • translateContent()       │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     aiCache (86400s TTL)    │
                    │  ────────────────────────── │
                    │  Base64 cache key from title│
                    │  200 max entries            │
                    └──────────────┬──────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
┌──────▼──────┐           ┌────────▼────────┐         ┌────────▼────────┐
│  /api/ai/*  │           │  Sentiment Page │         │  Article Reader │
│  Endpoints  │           │  Dashboard      │         │  AI Summary     │
└─────────────┘           └─────────────────┘         └─────────────────┘
```

---

## State Management Patterns

### Context Providers Hierarchy

```tsx
<NextIntlClientProvider messages={messages}>
  <ThemeProvider>
    <ToastProvider>
      <KeyboardShortcutsProvider>
        <WatchlistProvider>
          <AlertsProvider>
            <PortfolioProvider>
              <BookmarksProvider>
                <PWAProvider>
                  {children}
                </PWAProvider>
              </BookmarksProvider>
            </PortfolioProvider>
          </AlertsProvider>
        </WatchlistProvider>
      </KeyboardShortcutsProvider>
    </ToastProvider>
  </ThemeProvider>
</NextIntlClientProvider>
```

### Provider Summary

| Provider | Storage | Scope | Key Features |
|----------|---------|-------|--------------|
| `ThemeProvider` | localStorage | Global | Dark/light/system, system preference detection |
| `BookmarksProvider` | localStorage | Global | Article bookmarking, sorted by date |
| `WatchlistProvider` | localStorage | Global | Coin watchlist, reordering, import/export |
| `PortfolioProvider` | localStorage | Global | Holdings, transactions, P&L tracking |
| `AlertsProvider` | In-memory + API | Global | Price alerts, keyword alerts |
| `KeyboardShortcutsProvider` | - | Global | Keyboard navigation state |
| `ToastProvider` | - | Global | Toast notification queue |
| `PWAProvider` | Service Worker | Global | Install state, update state, push state |

---

## External Integrations

### Data Sources

| Service | Purpose | Rate Limit | Auth |
|---------|---------|------------|------|
| **CoinGecko** | Coin prices, market data, charts | 25/min (free) | None |
| **DeFiLlama** | DeFi TVL, protocols, chains | Unlimited | None |
| **Alternative.me** | Fear & Greed Index | Unlimited | None |
| **CoinCap** | Asset prices, history | 200/min | None |
| **CoinPaprika** | Coin data backup | 25k/mo | None |
| **CoinLore** | Coin data backup | Unlimited | None |

### AI Providers

| Provider | Model | Purpose | Free Tier |
|----------|-------|---------|-----------|
| **Groq** | Llama 3.3 70B | Primary AI (sentiment, digest) | Yes |
| **OpenAI** | GPT-4o-mini | Fallback AI | No |
| **Anthropic** | Claude 3 Haiku | Fallback AI | No |
| **OpenRouter** | Various | Fallback AI | Limited |

### RSS Sources (12)

| Source | Category | Focus |
|--------|----------|-------|
| CoinDesk | General | Institutional |
| The Block | General | Research |
| Decrypt | General | Web3/Culture |
| CoinTelegraph | General | Independent |
| Bitcoin Magazine | Bitcoin | OG Bitcoin |
| Blockworks | General | Finance |
| The Defiant | DeFi | DeFi Focus |
| Bitcoinist | Bitcoin | Bitcoin News |
| CryptoSlate | General | Research |
| NewsBTC | General | Trading |
| Crypto.news | General | Broad |
| CryptoPotato | General | Altcoins |

### International Sources

| Language | Sources | Region |
|----------|---------|--------|
| Korean (ko) | Block Media, TokenPost, CoinDesk Korea | Asia |
| Chinese (zh) | Multiple | Asia |
| Japanese (ja) | Multiple | Asia |
| Spanish (es) | Multiple | LATAM/Europe |

---

## Internationalization Implementation

### Configuration

```typescript
// src/i18n/config.ts
export const locales = [
  'en', 'es', 'fr', 'de', 'pt', 'ja', 
  'zh-CN', 'zh-TW', 'ko', 'ar', 'ru', 
  'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id'
] as const; // 18 languages

export const defaultLocale = 'en';
export const rtlLocales = ['ar']; // Arabic RTL support
```

### Message Files Structure

```json
// messages/en.json (372 lines)
{
  "common": { /* 30+ keys */ },
  "nav": { /* 20+ keys */ },
  "home": { /* 10+ keys */ },
  "news": { /* 20+ keys */ },
  "article": { /* 15+ keys */ },
  "markets": { /* 25+ keys */ },
  "portfolio": { /* 20+ keys */ },
  "watchlist": { /* 15+ keys */ },
  "search": { /* 10+ keys */ },
  "footer": { /* 15+ keys */ },
  "errors": { /* 10+ keys */ },
  // ... more namespaces
}
```

### Routing Strategy

- **Locale Prefix**: `as-needed` (English has no prefix, others do)
- **Detection**: Accept-Language header → Cookie → Default
- **Middleware**: Automatic redirect to correct locale

### Translation Features

- **Real-time Translation**: Optional via `FEATURE_TRANSLATION=true`
- **News Translation**: Via Groq AI API
- **Batch Translation**: Scripts in `scripts/i18n/`

---

## Technical Strengths & Unique Features

### 1. Zero-Config Free API
- No API keys required for news endpoints
- No rate limits on free tier
- Open CORS for any domain

### 2. Edge Runtime Performance
- All API routes run on Edge Runtime
- Global CDN distribution via Vercel
- Sub-100ms response times

### 3. Comprehensive Caching
- Multi-tier caching (memory, Edge, CDN)
- Variable TTL per data type
- Stale-while-revalidate pattern
- ETag-based cache validation

### 4. PWA Excellence
- Full offline support
- Background sync
- Push notifications
- Install prompts
- Cache management UI

### 5. AI Integration
- Multi-provider fallback
- Cached AI responses
- Batch processing
- JSON mode for structured output

### 6. x402 Micropayments
- Pay-per-request for premium APIs
- USDC on Base network
- No subscription required
- Instant settlement

### 7. Developer Experience
- 7 official SDKs
- MCP servers for AI assistants
- OpenAPI 3.0 spec
- Postman collection
- Browser extension
- CLI tool

### 8. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation (j/k/g+key)
- Skip links
- ARIA labels
- Focus management
- Color contrast compliance

### 9. International Support
- 18 languages
- RTL support (Arabic)
- International news sources
- AI translation

### 10. Real-time Features
- SSE streaming
- WebSocket support
- Breaking news alerts
- Price alerts
- Live price tickers

---

## Caching Strategy Summary

| Data Type | TTL | Cache Layer |
|-----------|-----|-------------|
| RSS Feeds | 180s | In-memory + Edge |
| Breaking News | 60s | In-memory + Edge |
| Coin Prices | 30s | In-memory + Edge |
| Market Overview | 300s | In-memory + Edge |
| Historical (1d) | 60s | In-memory |
| Historical (7d) | 300s | In-memory |
| Historical (30d) | 900s | In-memory |
| Historical (90d+) | 1800s | In-memory |
| AI Responses | 86400s | In-memory |
| Static Data | 3600s | In-memory + CDN |
| Translations | 86400s | In-memory |

---

## Testing Infrastructure

| Type | Tool | Coverage |
|------|------|----------|
| Unit Tests | Vitest | Components, utilities |
| E2E Tests | Playwright | User flows, API |
| Component Stories | Storybook | Visual regression |
| Accessibility | axe-core, pa11y | WCAG compliance |
| Linting | ESLint + TypeScript | Code quality |
| CSS Linting | Stylelint | Style consistency |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VERCEL DEPLOYMENT                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  GitHub     │────▶│  Vercel     │────▶│  Edge       │
│  Push       │     │  Build      │     │  Network    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  Output                 │
              │  ───────────────────── │
              │  • Static pages (SSG)   │
              │  • Edge functions (API) │
              │  • Serverless (SSR)     │
              │  • Static assets        │
              └─────────────────────────┘
```

---

## File Statistics

| Directory | Files | Purpose |
|-----------|-------|---------|
| `src/components/` | 84+ | React components |
| `src/lib/` | 60+ | Core libraries |
| `src/app/api/` | 100+ | API routes |
| `src/app/[locale]/` | 28 | Page routes |
| `messages/` | 18 | i18n translations |
| `sdk/` | 7 | Language SDKs |
| `mcp/` | 4 | MCP servers |
| `examples/` | 9 | Integration examples |
| `scripts/` | 20+ | Build scripts |
| `e2e/` | 10+ | E2E tests |
| `stories/` | 15+ | Storybook stories |

---

## Conclusion

Free Crypto News represents a well-architected, production-ready cryptocurrency news platform with exceptional attention to developer experience, internationalization, and modern web standards. Its standout features include:

1. **Truly Free API** - No barriers to entry for developers
2. **Edge-First Architecture** - Global performance
3. **AI-Enhanced Content** - Intelligent news processing
4. **Comprehensive Tooling** - SDKs, MCP, CLI, extensions
5. **PWA Excellence** - Native app experience on web
6. **x402 Innovation** - Micropayments for sustainability

The codebase follows professional engineering practices and is well-positioned for scaling and maintenance.
