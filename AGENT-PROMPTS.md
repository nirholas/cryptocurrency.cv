# Feature Agent Prompts — 18 New Components Across 5 Agents

Five detailed prompts for Claude Opus 4.6 agents to add rich, API-powered feature components across the homepage, article detail pages, and coin detail pages.

**APIs leveraged:** 22 endpoints across AI, trading, social, real-time, and analytics categories.

**Execution order:** Run Agents 1-3 in parallel (no file overlap), then Agent 5, then Agent 4 last.

---

## Agent 1: Article Detail Page — Deep Intelligence Panel

**Scope:** `src/app/[locale]/article/[id]/page.tsx` + 4 new components in `src/components/`

**Goal:** Transform the article detail page from a basic read into a rich intelligence dashboard. Add 4 new sections below the existing `ArticleContent` that leverage AI and analytics APIs.

**Context:**
The article page currently shows: breadcrumbs → article header (title, source, date, sentiment badge) → ArticleContent (AI summary, collapsible) → entity tags (tickers, companies) → sidebar (market context, related articles, share, source). The page receives an `article` object of type `EnrichedArticle` (from `@/lib/archive-v2`) with fields: `id`, `title`, `description`, `link`, `source`, `pub_date`, `first_seen`, `sentiment`, `tickers`, `entities`, `tags`, `is_breaking`, `is_opinion`.

**Existing patterns to match — read these files first:**
- `src/components/ArticleContent.tsx` → client component: `'use client'`, useState for loading/data/error/expanded, fetch to `/api/*`, Tailwind-only, collapsible accordion UI, bg-white rounded-2xl border cards
- `src/components/FearGreedIndex.tsx` → client component with useEffect polling, loading skeleton (`animate-pulse`), error state with retry, dark mode (`dark:`) support, neutral-* color palette
- `src/components/RelatedArticles.tsx` → server component, named export, sourceColors map
- `src/app/[locale]/article/[id]/page.tsx` → the page to modify

**Color system:** `bg-white dark:bg-slate-800`, `border-gray-200 dark:border-slate-700`, `text-gray-900 dark:text-white`, accent: `brand-600`/`amber-400`. Cards: `rounded-2xl`, `shadow-sm`. Use `dark:` variants on EVERY color class.

### Components to Build

**1. `src/components/FactCheckPanel.tsx`** — `'use client'`
- Props: `{ articleUrl: string; articleTitle: string; source: string }`
- On mount (`useEffect`), fetches `POST /api/factcheck` with body `{ url: articleUrl, title: articleTitle }`
- API returns: `{ claims: Array<{ claim: string; verdict: 'verified' | 'likely' | 'unverified' | 'disputed'; confidence: number; evidence: string }>, overallScore: number, checkedAt: string }`
- Render a card with header "🔍 Fact Check" and the overallScore as a colored badge (green ≥80, yellow ≥50, red <50)
- List each claim with its verdict as a colored pill (green/yellow/gray/red), confidence bar, and evidence text in a collapsible `<details>` element
- Show loading skeleton, error state with retry button
- "Powered by AI" footnote with checkedAt timestamp

**2. `src/components/BullBearDebate.tsx`** — `'use client'`
- Props: `{ topic: string }` (pass `article.title` from the page)
- Has a "Generate Debate" button (button-triggered, NOT useEffect — this is expensive)
- On click, fetches `POST /api/ai/debate` with body `{ topic }`
- API returns: `{ bull: { argument: string; points: string[]; confidence: number }; bear: { argument: string; points: string[]; confidence: number }; verdict: string }`
- Render a split-panel card: left side green "🐂 Bull Case" with argument + bullet points, right side red "🐻 Bear Case" with argument + bullet points
- Below the split: a "Verdict" section with the AI verdict text
- Show confidence meters for each side (simple progress bars)

**3. `src/components/ArticleTimeline.tsx`** — `'use client'`
- Props: `{ tickers: string[] }` (pass `article.tickers`)
- On mount, fetches `GET /api/origins?tickers={tickers.join(',')}`
- API returns: `{ timeline: Array<{ date: string; title: string; source: string; url: string; type: 'origin' | 'development' | 'current' }>, originSource: string }`
- Render a vertical timeline with dots and CSS connecting lines (no library)
- Color-code: origin=blue, development=gray, current=amber
- Each node: date, title (as Link), source badge
- "Story originated from {originSource}" header

**4. `src/components/SentimentContext.tsx`** — `'use client'`
- Props: `{ tickers: string[]; articleSentiment: string }`
- On mount, fetches 2 APIs in parallel with `Promise.all`:
  - `GET /api/social/x/sentiment?coins={tickers.join(',')}`
  - `GET /api/sentiment?tickers={tickers.join(',')}`
- Render card "📊 Sentiment Context" with:
  - Article's own sentiment as a badge
  - "Market Sentiment" row: aggregated news sentiment score with horizontal bar (red→yellow→green)
  - "Social Sentiment" row: X/Twitter sentiment score with horizontal bar
  - "Divergence Alert" — if article sentiment differs significantly from market/social consensus, show an amber alert box

### Integration in page.tsx
- Import all 4 components
- Add AFTER the "Article Details" section (entities/tags) and BEFORE the closing of the left column (`col-span-2`)
- Wrap in `<div className="space-y-6 mt-6">`
- Props mapping:
  - `<FactCheckPanel articleUrl={article.link} articleTitle={article.title} source={article.source} />`
  - `<BullBearDebate topic={article.title} />`
  - `{article.tickers?.length > 0 && <ArticleTimeline tickers={article.tickers} />}`
  - `{article.tickers?.length > 0 && <SentimentContext tickers={article.tickers} articleSentiment={article.sentiment || 'neutral'} />}`

**Do NOT modify** any existing components. Only create new files and update the page.tsx imports/render.

---

## Agent 2: Homepage — Live Market Intelligence Widgets

**Scope:** `src/app/[locale]/page.tsx` + 3 new components in `src/components/`

**Goal:** Add 3 data-rich sections to the homepage that showcase trading and market intelligence APIs — making it feel like a live financial dashboard, not just a news feed.

**Context:**
The homepage currently renders (top to bottom): PriceTicker → BreakingNewsBanner → Header → HomeMarketStrip → HeroArticle → CategoryNav with ScrollIndicator → EditorsPicks → two-column grid (NewsCards left, TrendingSidebar right) → SourceSections → Footer CTA → Footer. It's a server component that fetches news via `getHomepageNews()`.

**Existing patterns to match:**
- `src/components/HomeMarketStrip.tsx` → async server component, responsive grid (`grid-cols-2 sm:3 md:4 lg:6`), `hover:-translate-y-0.5` lift effect, `Link` to `/coin/[id]`
- `src/components/TrendingSidebar.tsx` → rounded-2xl cards, `border-gray-100 dark:border-slate-700`, section headers with icons, "View All" links
- `src/components/FearGreedIndex.tsx` → client component with useEffect + polling, loading skeleton, error retry

**Color system:** `bg-white dark:bg-slate-800`, `border-gray-100 dark:border-slate-700`, `text-gray-900 dark:text-white`, accent: `brand-600`/`amber-400`, `emerald` for positive, `red` for negative. Section headers use a left border accent (`w-1 h-8 bg-white rounded-full`).

### Components to Build

**1. `src/components/WhaleActivityFeed.tsx`** — `'use client'`
- Self-contained (no props)
- On mount, fetches `GET /api/whale-alerts?limit=8`
- API returns: `{ alerts: Array<{ id: string; type: 'transfer' | 'exchange_inflow' | 'exchange_outflow'; coin: string; amount: number; usdValue: number; from: string; to: string; timestamp: string; hash: string }>, totalVolume24h: number }`
- Card titled "🐋 Whale Activity" with:
  - Header stat: "24h Whale Volume: $X.XXB"
  - Feed of latest whale txs: coin symbol, type badge (inflow=red, outflow=green, transfer=blue), amount + USD value, truncated addresses (first 6 + last 4 chars), relative timestamp
  - Auto-refresh every 60s via `setInterval`
  - "View All" link to `/whales`
  - Subtle fade-in animation for new data

**2. `src/components/TrendingNarratives.tsx`** — `'use client'`
- Self-contained (no props)
- On mount, fetches `GET /api/narratives?limit=6`
- API returns: `{ narratives: Array<{ name: string; phase: 'emerging' | 'growing' | 'peak' | 'declining'; momentum: number; relatedCoins: string[]; description: string; newsCount: number }> }`
- Section titled "🔥 Trending Narratives" with:
  - Horizontal scrollable row of cards (`overflow-x-auto snap-x snap-mandatory`)
  - Each card (`min-w-[280px]`): narrative name (bold), phase badge (emerging=blue, growing=green, peak=amber, declining=red), momentum score as progress ring, related coins as small pills, newsCount, 1-line description
  - "View All Narratives" link to `/narratives`

**3. `src/components/MarketSignals.tsx`** — `'use client'`
- Self-contained (no props)
- On mount, fetches 3 endpoints in parallel (`Promise.all`):
  - `GET /api/fear-greed` → `{ current: { value: number, valueClassification: string } }`
  - `GET /api/signals?limit=3` → `{ signals: Array<{ coin: string; type: 'buy' | 'sell' | 'hold'; confidence: number; reason: string; timeframe: string }> }`
  - `GET /api/liquidations?limit=1` → `{ totalLiquidations24h: number; largestLiquidation: { coin: string; amount: number; side: 'long' | 'short' } }`
- Section titled "⚡ Market Signals" as a 3-column responsive grid (`grid-cols-1 md:grid-cols-3`):
  - Column 1: Fear & Greed mini gauge — circular value display with color, classification text, trend arrow
  - Column 2: Top Trading Signals — 3 signals with coin, type badge (buy=green/sell=red/hold=gray), confidence %, truncated reason
  - Column 3: Liquidation Snapshot — 24h total, largest single liquidation
- Link each column to `/fear-greed`, `/signals`, `/liquidations`

### Integration in page.tsx
- Import all 3 components
- `<MarketSignals />` → AFTER `HomeMarketStrip` and BEFORE `HeroArticle`, with `className="mb-10"`
- `<TrendingNarratives />` → AFTER `EditorsPicks` and BEFORE the main two-column grid, with `className="mb-10"`
- `<WhaleActivityFeed />` → AFTER the two-column grid and BEFORE `SourceSections`, with `className="mb-12"`

**Do NOT modify** any existing components. Only create new files and update page.tsx.

---

## Agent 3: Coin Detail Page — Trading Intelligence Dashboard

**Scope:** `src/app/[locale]/coin/[coinId]/page.tsx` + 4 new components in `src/components/`

**Goal:** Add 4 trading-focused components below the existing `CoinPageClient` to make the coin page a one-stop trading research dashboard.

**Context:**
The coin page at `src/app/[locale]/coin/[coinId]/page.tsx` is a server component that fetches 6 data sources via `Promise.all` (`getCoinDetails`, `getCoinTickers`, `getOHLC`, `getCoinDeveloperData`, `getCoinCommunityData`, `searchNews`) and passes them to `<CoinPageClient>`. It has a dark gradient background: `bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950`.

**Existing patterns:**
- `src/components/FearGreedIndex.tsx` → client component, useEffect + fetch, SVG gauge
- `src/components/HomeMarketStrip.tsx` → formatting helpers (`formatPrice`, `formatMarketCap`), `symbolMap`
- If they exist, study: `src/components/FundingRates.tsx`, `src/components/LiquidationsFeed.tsx`, `src/components/ArbitrageDashboard.tsx`

### Components to Build

**1. `src/components/CoinArbitrageOpportunities.tsx`** — `'use client'`
- Props: `{ coinId: string; coinSymbol: string }`
- On mount, fetches `GET /api/arbitrage?coin={coinId}`
- API returns: `{ opportunities: Array<{ buyExchange: string; sellExchange: string; buyPrice: number; sellPrice: number; spread: number; spreadPercent: number; volume24h: number; updatedAt: string }>, bestOpportunity: { spread: number; pair: string } }`
- Card "💰 Arbitrage Opportunities":
  - Header: "Best Spread: X.XX%" in green
  - Table: Buy Exchange, Buy Price, Sell Exchange, Sell Price, Spread %, Volume
  - Color: >2% green (hot), 1-2% yellow, <1% gray. Sort by spread desc.
  - Auto-refresh every 30s
  - Disclaimer: "Prices may vary. Not financial advice."

**2. `src/components/CoinFundingRates.tsx`** — `'use client'`
- Props: `{ coinSymbol: string }`
- On mount, fetches `GET /api/funding?symbol={coinSymbol}`
- API returns: `{ rates: Array<{ exchange: string; rate: number; predictedRate: number; nextFundingTime: string; openInterest: number }>, average: number, sentiment: 'bullish' | 'bearish' | 'neutral' }`
- Card "📈 Funding Rates":
  - Aggregate sentiment badge at top
  - Average funding rate prominently displayed
  - Table: Exchange, Current Rate (green +/red -), Predicted Rate, Next Funding countdown, Open Interest
  - Tooltip: "Positive = longs pay shorts (bullish crowding)"
  - Auto-refresh every 60s

**3. `src/components/CoinSocialBuzz.tsx`** — `'use client'`
- Props: `{ coinId: string; coinName: string }`
- On mount, fetches 2 endpoints in parallel:
  - `GET /api/social?coin={coinId}` → `{ score: number; change24h: number; sources: { twitter: number; reddit: number; telegram: number } }`
  - `GET /api/influencers?coin={coinId}&limit=5` → `{ influencers: Array<{ name: string; handle: string; platform: string; followers: number; sentiment: string; recentPost: string }> }`
- Card "💬 Social Buzz":
  - Social Score (large number) with 24h change badge
  - Source breakdown: horizontal stacked bar (Twitter/Reddit/Telegram)
  - "Top Voices": 5 influencers with avatar placeholder (first letter), name, handle, followers, sentiment emoji, truncated post
  - Link to `/influencers`

**4. `src/components/CoinNewsCorrelation.tsx`** — `'use client'`
- Props: `{ coinId: string; coinSymbol: string }`
- On mount, fetches `GET /api/ai/correlation?coin={coinId}&days=30`
- API returns: `{ correlation: number; newsImpactEvents: Array<{ date: string; headline: string; priceChange: number; sentiment: string; impactScore: number }>, averageImpactTime: string, strongestSignal: string }`
- Card "🔗 News-Price Correlation":
  - Overall correlation score (-1 to 1, color coded)
  - "Average impact time: X hours" stat
  - Timeline of high-impact news events: date, headline, price change (green/red), impact bar
  - "Strongest signal" callout box
  - No auto-refresh (analytical data)

### Integration in page.tsx
- Import all 4 components
- Add AFTER `<CoinPageClient />` and BEFORE `<Footer />`
- Container: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">`
- Grid: `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">`
- Row 1: `CoinArbitrageOpportunities` + `CoinFundingRates`
- Row 2: `CoinSocialBuzz` + `CoinNewsCorrelation`
- Pass `coinId` from params, `coinSymbol` from `coinDetails.symbol` (uppercased)

**Styling note:** Cards must work on the dark gradient background. Use `bg-slate-800/80 backdrop-blur-sm` for cards, `border-slate-700`, `text-white` for headers. Loading skeletons: `bg-slate-700 animate-pulse`. Also support light mode with standard `bg-white dark:bg-slate-800`.

**Do NOT modify** any existing components. Only create new files and update page.tsx.

---

## Agent 4: Cross-Site — AI-Powered Interactive Widgets

**Scope:** 3 new components in `src/components/` + integration across homepage, article page, coin page, and NewsCard

**Goal:** Build 3 interactive AI-powered widgets that showcase the platform's most impressive AI capabilities in compact, engaging formats.

**Context:**
The app has powerful AI endpoints underutilized in the UI. These widgets work across multiple pages.

**Existing patterns:**
- `src/components/ArticleContent.tsx` → button-triggered fetch (user clicks to load expensive AI data), loading spinner, error handling
- `src/components/FearGreedIndex.tsx` → auto-loading useEffect, SVG visualizations, polling
- `src/components/OracleChat.tsx` → if exists, study chat interaction pattern

**Color system:** Cards: `bg-white dark:bg-slate-800`, `border-gray-200 dark:border-slate-700`, `rounded-2xl`. Accent gradient: `from-brand-500 to-brand-600` (amber). Dark mode mandatory.

### Components to Build

**1. `src/components/AskAboutThis.tsx`** — `'use client'`
- Props: `{ context: string; contextType: 'article' | 'coin' | 'general'; placeholder?: string }`
- Compact input bar with question mark icon and placeholder
- On Enter or click Ask, fetches `POST /api/ask` with body `{ question, context }`
- API returns: `{ answer: string; confidence: number; sources: Array<{ title: string; url: string }>; followUpQuestions: string[] }`
- Slide-down answer panel with:
  - Answer text with typing animation effect (reveal characters progressively via `setInterval`)
  - Confidence badge (>0.8 green, 0.5-0.8 yellow, <0.5 red)
  - Source citations as small linked pills
  - 2-3 follow-up question buttons (click to auto-fill and re-query)
- Support multiple Q&A turns (stack up to 3, collapse older)
- "Clear" button to reset

**Integration:**
- **Article page** (`src/app/[locale]/article/[id]/page.tsx`): After ArticleContent. `context={article.title + ' - ' + article.description}`, `contextType="article"`, `placeholder="Ask AI about this article..."`
- **Coin page** (`src/app/[locale]/coin/[coinId]/page.tsx`): After CoinPageClient. `context={coinName + ' cryptocurrency'}`, `contextType="coin"`, `placeholder="Ask about {coinName}..."`
- **Homepage** (`src/app/[locale]/page.tsx`): After Header, before HomeMarketStrip. `context="crypto market news today"`, `contextType="general"`, `placeholder="Ask anything about crypto..."`

**2. `src/components/AIFlashBrief.tsx`** — `'use client'`
- Optional props: `{ category?: string; maxItems?: number }`
- Prominent "⚡ Get Flash Brief" button with gradient background
- On click, fetches `GET /api/ai/flash-briefing?category={category}&limit={maxItems || 5}`
- API returns: `{ briefs: Array<{ headline: string; summary: string; sentiment: 'bullish' | 'bearish' | 'neutral'; importance: 'high' | 'medium' | 'low'; relatedTicker?: string }>, generatedAt: string }`
- Stacked card list with "flash briefing" aesthetic:
  - Each brief: importance icon (🔴/🟡/🟢), headline (bold), 1-line summary, sentiment pill, ticker link
  - Stagger animation (each 200ms delay)
  - "Last updated: {generatedAt}" footer
  - Button changes to "Refresh Brief" after first load

**Integration:**
- **Homepage** (`src/app/[locale]/page.tsx`): AFTER HeroArticle, BEFORE category nav. Full-width, wrapped in `bg-gradient-to-r from-slate-800 to-slate-900` section (always dark for dramatic effect)

**3. `src/components/ClickbaitDetector.tsx`** — `'use client'`
- Props: `{ title: string; source: string }`
- Tiny inline badge next to article titles
- Uses `IntersectionObserver` to only fetch when visible (performance)
- Fetches `GET /api/clickbait?title={encodeURIComponent(title)}&source={source}`
- API returns: `{ score: number; isClickbait: boolean; reasons: string[]; rewrittenTitle?: string }`
- Rendering logic:
  - score < 30: show nothing
  - 30-60: small yellow "⚠️" with custom Tailwind tooltip showing "Moderate clickbait (score: X) - Reasons: ..."
  - > 60: small red "🚩" with tooltip + "Better title: {rewrittenTitle}" if available
- Custom tooltip = absolute positioned div on hover, NOT browser `title` attribute
- Must be performance-conscious — lazy load, tiny footprint, no layout shift

**Integration:**
- **`src/components/NewsCard.tsx`**: After article title. `title={article.title}`, `source={article.source}`
- **Article page** (`src/app/[locale]/article/[id]/page.tsx`): Next to article title in header

**IMPORTANT:**
- `AskAboutThis` must feel snappy — show loading immediately, use streaming-like text reveal
- `AIFlashBrief` should be visually dramatic — it's a hero feature showcase
- `ClickbaitDetector` must be performance-conscious — `IntersectionObserver` + cleanup in `useEffect` return
- All: `'use client'`, TypeScript, Tailwind only, dark mode, proper cleanup

**Note:** This agent modifies files also touched by Agents 1, 2, 3. Run this agent LAST. Read current file state before making changes.

---

## Agent 5: Homepage + Article Page — Real-Time & Social Features

**Scope:** 4 new components in `src/components/` + integration in homepage, article page, TrendingSidebar

**Goal:** Add real-time and social engagement features that make the site feel alive. Leverage SSE, social, and prediction APIs.

**Context:**
The app has SSE at `/api/sse`, social APIs, and prediction market APIs not surfaced in the UI. The site should feel alive with real-time data.

**Existing patterns:**
- `src/components/BreakingNewsBanner.tsx` → likely uses real-time data
- `src/components/ConnectionStatus.tsx` → may show SSE/WS connection status
- `src/components/PriceTicker.tsx` → likely shows live price updates
- `src/components/TrendingSidebar.tsx` → sidebar card styling
- `src/components/ArticleReactions.tsx` → if exists, engagement pattern

### Components to Build

**1. `src/components/LiveNewsTicker.tsx`** — `'use client'`
- Self-contained (no props)
- Connects to SSE: `new EventSource('/api/sse?breaking=true')`
- Listens for: `'news'` (new article), `'breaking'` (breaking news)
- Horizontal scrolling ticker bar (stock ticker style):
  - Items slide in from right with smooth CSS animation
  - Breaking items: red "BREAKING" prefix + flash animation
  - Regular items: source → headline (truncated ~80 chars) → time
  - Click navigates to `/article/[id]`
- Buffer of last 20 items max
- Green dot "● Live" indicator when connected, red when disconnected
- Reconnect with exponential backoff on disconnect
- Clean up `EventSource` on unmount

**Integration:**
- **Homepage** (`src/app/[locale]/page.tsx`): Very first element, before PriceTicker. Dark bar: `bg-gray-900 dark:bg-black text-white`, ~36px height, `overflow-hidden`

**2. `src/components/PredictionPoll.tsx`** — `'use client'`
- Optional props: `{ coinId?: string }`
- Fetches `GET /api/predictions?coin={coinId}&limit=1`
- API returns: `{ predictions: Array<{ id: string; question: string; options: Array<{ label: string; votes: number }>; totalVotes: number; expiresAt: string }> }`
- Compact poll card "🔮 Community Prediction":
  - Question text
  - Options as clickable buttons with vote percentage bar behind text
  - After voting (`POST /api/predictions/vote` with `{ predictionId, optionIndex }`): show results, total votes, "You voted for X"
  - `localStorage` to prevent re-voting
  - Countdown timer to expiration
- Fallback if no predictions: simple bullish/bearish toggle "What's your outlook?"

**Integration:**
- **TrendingSidebar** (`src/components/TrendingSidebar.tsx`): Import and render between `MarketStats` and Categories sections
- **Coin page** (`src/app/[locale]/coin/[coinId]/page.tsx`): After CoinPageClient. `coinId={coinId}`

**3. `src/components/ArticleEngagement.tsx`** — `'use client'`
- Props: `{ articleId: string; articleTitle: string }`
- Engagement bar below articles:
  - Reaction buttons: 🚀 Bullish, 📉 Bearish, 🤔 Interesting, 😴 Boring — each with count
  - On click, `POST /api/views` with `{ articleId, reaction }`. Store in `localStorage` per articleId.
  - Fetch `GET /api/views?articleId={articleId}` → `{ views: number, reactions: { bullish, bearish, interesting, boring } }`
  - "Community thinks: 🚀 Bullish (67%)" dominant reaction display
  - Optimistic UI: increment count immediately before API response
  - Animate count bump (brief scale-up)
- Compact share row: Copy Link, X/Twitter share, Telegram share

**Integration:**
- **Article page** (`src/app/[locale]/article/[id]/page.tsx`): After ArticleContent, before entity tags. `articleId={article.id}`, `articleTitle={article.title}`

**4. `src/components/TrendingTopicsLive.tsx`** — `'use client'`
- Self-contained (no props)
- On mount, fetches `GET /api/trending?limit=10`
- API returns: `{ topics: Array<{ topic: string; count: number; sentiment: string; change: number; relatedCoins: string[] }>, updatedAt: string }`
- Horizontal strip of trending topic pills (`overflow-x-auto snap-x`):
  - Each pill: topic name, count badge, trend arrow (up/down), sentiment color border
  - Click navigates to `/topic/{slugified-topic}`
- Auto-refresh every 5 minutes
- "Updated X minutes ago" timestamp

**Integration:**
- **Homepage** (`src/app/[locale]/page.tsx`): After category nav, before the main two-column grid. Subtle background: `bg-gray-50 dark:bg-slate-800/50 -mx-4 px-4 py-4`

### Important Notes
- `LiveNewsTicker`: Use `useRef` for EventSource. Connect on mount, reconnect on error, close on unmount. Exponential backoff: 1s, 2s, 4s, 8s, max 30s.
- `PredictionPoll`: localStorage for vote persistence, animate results appearing
- `ArticleEngagement`: Prevent double-voting, optimistic UI updates
- `TrendingTopicsLive`: CSS snap scrolling, no heavy libraries
- All: `'use client'`, TypeScript, Tailwind, dark mode, proper `useEffect` cleanup, mobile responsive

**Note:** This agent modifies `TrendingSidebar.tsx` (adding PredictionPoll import). Run AFTER Agent 2 (homepage) to avoid conflicts with homepage page.tsx changes.

---

## Execution Plan

```
Phase 1 (parallel — no file overlap):
  Agent 1 (article page intelligence)  ──────────────►
  Agent 2 (homepage market widgets)    ──────────────►
  Agent 3 (coin page trading dashboard) ─────────────►

Phase 2 (depends on Agents 1, 2, 3):
  Agent 5 (real-time & social) ──────────────────────►

Phase 3 (depends on all prior agents):
  Agent 4 (cross-site AI widgets) ───────────────────►
```

Agents 1-3 are fully independent — they create new component files and only modify their own page.tsx. Agent 5 modifies TrendingSidebar + pages touched by 1-3. Agent 4 goes last since it touches NewsCard.tsx and all three page files.

---

## Summary: 18 New Components

| # | Component | APIs | Page(s) | Agent |
|---|-----------|------|---------|-------|
| 1 | FactCheckPanel | POST /api/factcheck | Article | 1 |
| 2 | BullBearDebate | POST /api/ai/debate | Article | 1 |
| 3 | ArticleTimeline | GET /api/origins | Article | 1 |
| 4 | SentimentContext | GET /api/social/x/sentiment, /api/sentiment | Article | 1 |
| 5 | WhaleActivityFeed | GET /api/whale-alerts | Homepage | 2 |
| 6 | TrendingNarratives | GET /api/narratives | Homepage | 2 |
| 7 | MarketSignals | GET /api/fear-greed, /api/signals, /api/liquidations | Homepage | 2 |
| 8 | CoinArbitrageOpportunities | GET /api/arbitrage | Coin | 3 |
| 9 | CoinFundingRates | GET /api/funding | Coin | 3 |
| 10 | CoinSocialBuzz | GET /api/social, /api/influencers | Coin | 3 |
| 11 | CoinNewsCorrelation | GET /api/ai/correlation | Coin | 3 |
| 12 | AskAboutThis | POST /api/ask | Article, Coin, Homepage | 4 |
| 13 | AIFlashBrief | GET /api/ai/flash-briefing | Homepage | 4 |
| 14 | ClickbaitDetector | GET /api/clickbait | NewsCard, Article | 4 |
| 15 | LiveNewsTicker | SSE /api/sse | Homepage | 5 |
| 16 | PredictionPoll | GET/POST /api/predictions | Sidebar, Coin | 5 |
| 17 | ArticleEngagement | GET/POST /api/views | Article | 5 |
| 18 | TrendingTopicsLive | GET /api/trending | Homepage | 5 |

