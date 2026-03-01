# 20 Agent Build Prompts for Free Crypto News

> Each prompt is self-contained. Paste one per chat session. Agents can run in parallel — no dependencies between prompts unless noted.

---

## PROMPT 1 — Enhanced Header: Price Ticker Strip + Cmd+K Search Modal

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts (e.g. `bun run build`, `bun run dev`)
- Use `pnpm` for package management (e.g. `pnpm install`, `pnpm add <pkg>`)
- Always use background terminals (isBackground: true) and kill them after
- Never create or modify GitHub Actions workflows
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- Fonts: Inter (sans), Source Serif 4 (serif), JetBrains Mono (mono)
- Colors via CSS vars: --color-surface (#fff / dark #0a0a0a), --color-text-primary, --color-text-secondary, --color-text-tertiary, --color-accent (#3b82f6), --color-border (#e2e8f0 / dark #262626)
- Container: .container-main (max-width 1280px, auto margins, responsive padding)
- Headings use font-serif; body uses font-sans
- Use `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- UI primitives in `src/components/ui/` (Button, Badge, Card, Skeleton)
- Icons: lucide-react
- i18n: use `Link` from `@/i18n/navigation`, `useTranslations` from `next-intl`
- Theme: `useTheme()` from `@/components/ThemeProvider` returns `{ resolvedTheme, setTheme }`

EXISTING FILE: `src/components/Header.tsx` ("use client") — has basic nav with NAV_ITEMS array, theme toggle, mobile menu, search link.

TASK: Enhance `src/components/Header.tsx` with TWO new features:

1. **LIVE PRICE TICKER STRIP** — a thin (40px, --ticker-height) horizontal scrolling bar ABOVE the main header showing live crypto prices. Requirements:
   - Fetch from `/api/prices` on mount (returns JSON array with coin name, price, 24h change %)
   - Show BTC, ETH, SOL, BNB, XRP, ADA, DOGE, DOT, AVAX, LINK with price and ▲/▼ % change
   - Green for positive, red for negative change
   - Auto-scroll marquee animation (CSS, not JS) with `gap-8`, pause on hover
   - Refresh every 60s via `setInterval`
   - Dark/light mode compatible using CSS vars
   - The hook `useLivePrice` exists at `src/hooks/useLivePrice.ts` — check if it's useful, otherwise use local state

2. **CMD+K GLOBAL SEARCH MODAL** — Replace the search icon link with a clickable button that opens a modal. Also replace `src/components/GlobalSearch.tsx` (currently a stub that returns null).
   - Trigger: Click the search icon OR press Cmd+K (Ctrl+K on Windows/Linux)
   - Modal: Full-screen overlay with max-w-2xl centered dialog
   - Search input auto-focused, debounced 300ms
   - Fetch from `/api/news?search={query}&limit=10`
   - Show results as compact list items: title, source, timeAgo, category badge
   - Click result → navigate to article link (external) or `/article/{id}` page
   - Keyboard nav: arrow keys to navigate results, Enter to select, Escape to close
   - "No results" and loading states
   - Use @radix-ui/react-dialog (already installed)

FILES TO CREATE/MODIFY:
- Modify: `src/components/Header.tsx`
- Rewrite: `src/components/GlobalSearch.tsx` (currently stub returning null)
- May need: `src/hooks/useDebounce.ts` if it doesn't exist

After changes, run `bun run build` to verify no errors. Commit with message: "feat: add live price ticker and Cmd+K search modal to header"
```

---

## PROMPT 2 — Markets Page: Full Market Dashboard

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts (e.g. `bun run build`, `bun run dev`)
- Use `pnpm` for package management
- Always use background terminals (isBackground: true) and kill them after
- Never create or modify GitHub Actions workflows
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-text-primary, --color-text-secondary, --color-accent (#3b82f6), --color-border
- Container: .container-main (1280px max)
- Headings: font-serif; Body: font-sans
- cn() from @/lib/utils, UI primitives in src/components/ui/ (Button, Badge, Card, Skeleton)
- Icons: lucide-react

EXISTING FILE: `src/app/[locale]/markets/page.tsx` — currently a placeholder shell with static cards.

API ROUTES AVAILABLE:
- `/api/prices` — returns top crypto prices with 24h changes
- `/api/market` — returns market overview (total market cap, volume, dominance)
- `/api/fear-greed` — returns Fear & Greed index data
- `/api/global` — returns global crypto market data
- `/api/trending` — returns trending coins

TASK: Build a FULL markets dashboard page. This should be a Server Component that fetches data server-side.

SECTIONS TO BUILD:
1. **Market Stats Bar** — top row of 4-6 stat cards showing: Total Market Cap, 24h Volume, BTC Dominance, ETH Dominance, Fear & Greed Index, Active Coins. Use Card component. Green/red for changes.

2. **Top Coins Table** — responsive data table showing top 50 coins:
   - Columns: #, Coin (icon+name+symbol), Price, 24h %, 7d %, Market Cap, Volume, Sparkline (optional)
   - Sortable by clicking column headers (client-side sort)
   - Create a `src/components/MarketTable.tsx` ("use client") for interactive sorting
   - Row click → navigate to `/coin/{id}` page
   - Green/red text for price changes
   - Mobile-friendly: hide less important columns on small screens

3. **Market News Sidebar** (optional if space) — latest 5 market-related news from `/api/news?category=trading&limit=5`

HELPER: Create `src/lib/format.ts` with:
- `formatCurrency(value: number, options?)` — format USD with compact notation for large numbers
- `formatPercent(value: number)` — format percentage with + sign and color classes
- `formatLargeNumber(value: number)` — e.g., 1.2T, 45.6B, 123.4M

SEO: Use `generateSEOMetadata` from `@/lib/seo` for metadata.

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/markets/page.tsx`
- Create: `src/components/MarketTable.tsx` (client component for sorting)
- Create: `src/lib/format.ts` (currency/number formatting utilities)

After changes, run `bun run build` to verify. Commit: "feat: build full markets dashboard with price table and stats"
```

---

## PROMPT 3 — Coin Detail Page: Individual Crypto Pages

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts (e.g. `bun run build`, `bun run dev`)
- Use `pnpm` for package management
- Always use background terminals (isBackground: true) and kill them after
- Never create or modify GitHub Actions workflows
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-text-primary, --color-text-secondary, --color-accent (#3b82f6), --color-border
- Container: .container-main (1280px max)
- Headings: font-serif; Body: font-sans
- cn() from @/lib/utils, UI components in src/components/ui/
- Icons: lucide-react

EXISTING FILE: `src/app/[locale]/coin/[id]/page.tsx` — currently a shell page.

API ROUTES AVAILABLE:
- `/api/prices` — returns price data for all coins
- `/api/prices?coin={id}` — returns data for specific coin
- `/api/ohlc?coin={id}&days=30` — OHLC candle data
- `/api/news?search={coinName}&limit=10` — related news
- `/api/market` — market overview
- `/api/sentiment` — market sentiment data

SEO: Use `generateCoinMetadata` from `@/lib/seo`.

TASK: Build a rich coin detail page.

SECTIONS:
1. **Coin Header** — Large coin name, symbol, current price, 24h/7d/30d change percentages, market cap rank badge

2. **Price Chart** — Create `src/components/PriceChart.tsx` ("use client"):
   - Use a SIMPLE chart implementation (either lightweight-charts from TradingView, or a pure CSS/SVG chart to avoid heavy deps)
   - If adding a library, use `pnpm add lightweight-charts` (only 45KB)
   - Time range selector: 24H, 7D, 30D, 1Y, ALL
   - Fetch from `/api/ohlc?coin={id}&days={n}`
   - Responsive, dark/light theme aware

3. **Stats Grid** — Two-column grid showing: Market Cap, 24h Volume, Circulating Supply, Total Supply, All-Time High, All-Time Low, ATH Date, ATL Date

4. **Related News** — Latest 8 news articles related to this coin, using `NewsCardCompact` component from `@/components/NewsCard`

5. **Breadcrumbs** — Home > Markets > {Coin Name}

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/coin/[id]/page.tsx`
- Create: `src/components/PriceChart.tsx` (client component)

After changes, run `bun run build` to verify. Commit: "feat: build coin detail page with price chart and stats"
```

---

## PROMPT 4 — Category Pages: Full News by Category

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border, etc.
- .container-main, font-serif headings, cn() from @/lib/utils
- UI: Button, Badge, Card, Skeleton from src/components/ui/
- News cards: FeaturedCard, NewsCard (default), NewsCardCompact, NewsCardHeadline from src/components/NewsCard

EXISTING FILE: `src/app/[locale]/category/[slug]/page.tsx` — has basic layout with `getNewsByCategory()` call and grid of NewsCard components.

LIB AVAILABLE:
- `getNewsByCategory(slug, limit)` from `@/lib/crypto-news` returns `NewsResponse { articles, totalCount, sources, fetchedAt }`
- `getCategoryBySlug(slug)` from `@/lib/categories` returns `Category { slug, name, icon, description, keywords, color, bgColor }`
- `categories` array from `@/lib/categories` — all category objects
- `generateCategoryMetadata()` from `@/lib/seo`

TASK: Enhance the category page to be a fully-featured news listing.

REQUIREMENTS:
1. **Category Header** — Show category icon, name, description, colored accent bar matching category color from `getCategoryBySlug()`

2. **Featured Article** — First article displayed as `FeaturedCard` (large hero card)

3. **News Grid** — Remaining articles in responsive grid: 2 columns on tablet, 3 on desktop, using `NewsCard` (default variant)

4. **Load More** — Client component `src/components/LoadMoreButton.tsx`:
   - Initial load: 20 articles server-side
   - "Load More" button fetches next page from `/api/news?category={slug}&page={n}&limit=20`
   - Appends to existing list
   - Disable when no more results

5. **Category Sidebar** — On desktop, show a sidebar with:
   - Links to all other categories (from `categories` array)
   - Current category highlighted
   - Each showing category icon + name

6. **Breadcrumbs** — Home > {Category Name}

7. **generateStaticParams** — Generate static params for all category slugs from `categories` array

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/category/[slug]/page.tsx`
- Create: `src/components/LoadMoreButton.tsx` ("use client")

After changes, run `bun run build` to verify. Commit: "feat: enhance category pages with featured article, load more, sidebar"
```

---

## PROMPT 5 — Search Page: Advanced Search with Filters

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, cn() from @/lib/utils
- UI: Button, Badge, Card, Skeleton
- News: NewsCardCompact from @/components/NewsCard

EXISTING FILE: `src/app/[locale]/search/page.tsx` — "use client", has basic search input and results list.

API: `/api/news?search={query}&category={cat}&source={source}&limit={n}&page={p}`
Also: `/api/search?q={query}` endpoint may exist.
Also: `/api/sources` — returns list of all news sources

TASK: Build a comprehensive search page with filters.

REQUIREMENTS:
1. **Search Bar** — Large, prominent search input with magnifying glass icon
   - Debounced search (300ms) using a custom `useDebounce` hook
   - URL-synced: query param `?q=bitcoin&category=defi` so searches are sharable/bookmarkable
   - Use `useSearchParams` and `useRouter` from next/navigation

2. **Filter Bar** — Below search bar:
   - Category filter: horizontal scrollable pill buttons for each category (from `@/lib/categories`)
   - Source filter: dropdown to filter by source
   - Sort: "Newest First" / "Relevance" toggle
   - Date range: "Today", "This Week", "This Month", "All Time" filter buttons

3. **Results** — Grid of `NewsCardCompact` components
   - Show result count: "42 results for 'bitcoin'"
   - Infinite scroll OR "Load More" button for pagination
   - Loading skeleton state while fetching

4. **Empty States**:
   - Initial state (no query): Show popular searches, trending topics
   - No results: Show helpful message with suggestions

5. **Search History** (nice-to-have): Store recent searches in localStorage, show as chips below search bar

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/search/page.tsx`
- Create: `src/hooks/useDebounce.ts` (if doesn't exist)

After changes, run `bun run build` to verify. Commit: "feat: build advanced search page with filters and URL sync"
```

---

## PROMPT 6 — Article Reader Page

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif for headings, font-sans for body
- cn() from @/lib/utils
- UI: Button, Badge, Card

EXISTING FILE: `src/app/[locale]/article/[id]/page.tsx` — has 283 lines, includes sentiment badges, article fetching from `getArticleById` in `@/lib/archive-v2`.

LIB: `@/lib/archive-v2` exports:
- `getArticleById(id)` → `EnrichedArticle { title, description, content, source, source_url, pub_date, first_seen, last_seen, category, tickers, tags, slug, sentiment_label, sentiment_score, ai_summary, related_articles, enrichments }`
- `getRelatedArticles(id, limit)` → related articles array

SEO: `generateArticleMetadata()` from `@/lib/seo`

TASK: Review and enhance the article reader page.

REQUIREMENTS:
1. **Article Header** — Title (font-serif, large), source attribution with link, publication date (formatted), category badge, reading time estimate

2. **Content Area** — Max-width 720px centered prose:
   - Use Tailwind Typography plugin (`prose dark:prose-invert` classes)
   - Render `article.content` or `article.description` with proper HTML sanitization
   - If only description available, show "Read full article at {source}" CTA button

3. **AI Summary Box** — If `ai_summary` exists, show a highlighted card above the content:
   - Blue-ish accent background
   - "AI Summary" label with sparkles icon
   - The summary text

4. **Sentiment Indicator** — Visual indicator (Bullish/Bearish/Neutral) with colored badge based on `sentiment_label`

5. **Tickers & Tags** — Show mentioned tickers (e.g., $BTC, $ETH) as clickable badges linking to `/coin/{ticker}`. Show tags as regular badges.

6. **Related Articles** — At bottom, grid of 4 related articles using `NewsCard` component. Fetch via `getRelatedArticles(id, 4)` or fallback to `/api/news?category={category}&limit=4`

7. **Share Bar** — Floating or inline share buttons: Copy Link, Twitter/X, Reddit, Telegram

8. **Navigation** — Breadcrumbs: Home > {Category} > {Article Title (truncated)}

FILES TO MODIFY:
- Enhance: `src/app/[locale]/article/[id]/page.tsx`
- May create: `src/components/ShareBar.tsx` ("use client")

After changes, run `bun run build` to verify. Commit: "feat: enhance article reader page with AI summary, share bar, related articles"
```

---

## PROMPT 7 — DeFi Dashboard Page

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent (#3b82f6), --color-border
- .container-main, font-serif headings, cn()
- UI: Button, Badge, Card, Skeleton
- News: NewsCardCompact from @/components/NewsCard

EXISTING FILE: `src/app/[locale]/defi/page.tsx` — currently a minimal shell page.

API ROUTES:
- `/api/defi` — DeFi protocol data (TVL, protocols)
- `/api/yields` — DeFi yield/APY data for pools
- `/api/dex-volumes` — DEX trading volume data
- `/api/bridges` — Cross-chain bridge data
- `/api/stablecoins` — Stablecoin market data
- `/api/news?category=defi&limit=10` — DeFi news
- `getDefiNews(limit)` from `@/lib/crypto-news` — server-side DeFi news

TASK: Build a DeFi dashboard page.

SECTIONS:
1. **DeFi Stats Row** — 4-6 stat cards: Total DeFi TVL, DEX Volume (24h), Stablecoin Market Cap, Active Protocols, Top Yield %, Number of Chains

2. **Top Protocols Table** — Sortable table of top 20 DeFi protocols:
   - Columns: Rank, Protocol Name, Chain(s), TVL, 24h Change %, Category (Lending/DEX/Yield/etc.)
   - Client component for sorting: `src/components/DefiTable.tsx`
   - Color-coded chain badges (Ethereum=blue, BSC=yellow, Solana=purple, Arbitrum=blue, etc.)

3. **Top Yields** — Card grid showing top 10 yield opportunities:
   - Pool name, protocol, chain, APY %, TVL
   - Sort by APY descending
   - Warning badge on yields > 100% ("High Risk")

4. **DeFi News** — Latest 6 DeFi news articles using `NewsCardCompact`

5. **Quick Links** — Card with links to: DEX Volumes, Bridge Stats, Stablecoin Data, Gas Tracker

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/defi/page.tsx`
- Create: `src/components/DefiTable.tsx` ("use client")

After changes, run `bun run build` to verify. Commit: "feat: build DeFi dashboard with TVL, yields, and protocol table"
```

---

## PROMPT 8 — Fear & Greed, Heatmap, and Screener Pages

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif headings, cn()
- UI: Button, Badge, Card, Skeleton

API ROUTES:
- `/api/fear-greed` — Fear & Greed index (value 0-100, label, historical data)
- `/api/prices` — All coin prices with changes
- `/api/market` — Market overview

TASK: Create 3 NEW market tool pages. Each is a separate file under `src/app/[locale]/`.

### PAGE 1: Fear & Greed Index — `src/app/[locale]/fear-greed/page.tsx`
- **Gauge Component** (`src/components/FearGreedGauge.tsx`, "use client"):
  - Semi-circular gauge (SVG) showing 0-100 score
  - Color gradient: red (0-25 Extreme Fear) → orange (25-45 Fear) → yellow (45-55 Neutral) → green (55-75 Greed) → dark green (75-100 Extreme Greed)
  - Large center number with label text
  - Animated on mount (needle sweeps from 0 to value)
- **Historical Chart** — Bar/line chart of last 30 days of Fear & Greed values
- **What it means** — Educational card explaining the index
- **Market Context** — Current BTC price and 24h change alongside the index

### PAGE 2: Market Heatmap — `src/app/[locale]/heatmap/page.tsx`
- **Heatmap Component** (`src/components/MarketHeatmap.tsx`, "use client"):
  - Treemap visualization of top 50 coins by market cap
  - Each block sized by market cap, colored by 24h change (green = up, red = down)
  - Show coin symbol and % change inside each block
  - Pure CSS/SVG implementation (no external chart library needed — use flexbox or CSS grid with proportional sizes)
  - Hover shows tooltip with full details (price, market cap, volume)
- **Time Range Toggle** — 1h, 24h, 7d change view
- Fetch from `/api/prices` (has all needed data)

### PAGE 3: Crypto Screener — `src/app/[locale]/screener/page.tsx`
- **ScreenerTable** (`src/components/ScreenerTable.tsx`, "use client"):
  - Full data table of 100+ coins
  - Multi-column sort
  - Filter inputs: min/max price, min/max market cap, min/max volume, min/max % change
  - Category filter checkboxes
  - Export as CSV button
  - Column visibility toggles
  - Pagination (25/50/100 per page)
- Fetch from `/api/prices`

SEO: Use `generateSEOMetadata` from `@/lib/seo` for all pages.

FILES TO CREATE:
- `src/app/[locale]/fear-greed/page.tsx`
- `src/components/FearGreedGauge.tsx`
- `src/app/[locale]/heatmap/page.tsx`
- `src/components/MarketHeatmap.tsx`
- `src/app/[locale]/screener/page.tsx`
- `src/components/ScreenerTable.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add fear & greed, market heatmap, and crypto screener pages"
```

---

## PROMPT 9 — Gas Tracker + Calculator + Compare Pages

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif headings, cn()
- UI: Button, Badge, Card, Skeleton

API ROUTES:
- `/api/gas` — Ethereum gas prices (slow, standard, fast in gwei + estimated USD costs)
- `/api/prices` — All coin prices
- `/api/compare?coins=bitcoin,ethereum` — Comparison data

TASK: Create 3 NEW tool pages.

### PAGE 1: Gas Tracker — `src/app/[locale]/gas/page.tsx`
- Server component that fetches from `/api/gas`
- **3 Speed Cards**: Slow (🐢), Standard (⚡), Fast (🚀) — each showing gwei price and estimated USD for common actions (transfer, swap, NFT mint, contract deploy)
- **Gas History** — Simple bar chart of last 24h gas prices (if historical data available)
- **Tips Card** — "Best time to transact" recommendations
- Clean, compact layout

### PAGE 2: Crypto Calculator — `src/app/[locale]/calculator/page.tsx`
- **CryptoCalculator** (`src/components/CryptoCalculator.tsx`, "use client"):
  - Convert between any crypto and USD/EUR/GBP
  - Two input fields: amount + currency selector dropdowns
  - Real-time conversion using `/api/prices`
  - Swap button (↕) to flip currencies
  - Show current rate: "1 BTC = $XX,XXX.XX"
  - Support entering amounts in either field
  - Common quick-select buttons: BTC, ETH, SOL, BNB

### PAGE 3: Coin Compare — `src/app/[locale]/compare/page.tsx`
- **CoinCompare** (`src/components/CoinCompare.tsx`, "use client"):
  - Select 2-4 coins to compare side-by-side
  - Searchable coin selector dropdown
  - Comparison table: Price, Market Cap, Volume, Supply, 24h Change, 7d Change, ATH, ATL
  - Visual bar charts for each metric
  - "Add Coin" button to add more (max 4)
  - URL-synced: `/compare?coins=bitcoin,ethereum,solana`

FILES TO CREATE:
- `src/app/[locale]/gas/page.tsx`
- `src/app/[locale]/calculator/page.tsx`
- `src/components/CryptoCalculator.tsx`
- `src/app/[locale]/compare/page.tsx`
- `src/components/CoinCompare.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add gas tracker, crypto calculator, and coin comparison pages"
```

---

## PROMPT 10 — Watchlist System (Full Provider + UI)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, cn(), UI: Button, Badge, Card, Skeleton, Icons: lucide-react

EXISTING FILE: `src/components/watchlist/index.tsx` — currently a STUB provider that just returns `{children}` and exports dummy `useWatchlist` hook.

TASK: Build a full watchlist system with persistence and UI.

### Part 1: WatchlistProvider — Rewrite `src/components/watchlist/index.tsx`
- Context with: `coins: WatchlistCoin[]`, `addCoin(id)`, `removeCoin(id)`, `isCoinWatched(id)`, `reorderCoins(newOrder)`
- `WatchlistCoin` type: `{ id: string, name: string, symbol: string, addedAt: string }`
- Persist to localStorage key `"fcn-watchlist"`
- Sync across tabs via `storage` event listener
- Max 50 coins

### Part 2: Watchlist Page — Create `src/app/[locale]/watchlist/page.tsx`
- "use client" page that uses `useWatchlist()` hook
- Shows user's watchlisted coins with live prices from `/api/prices`
- Table format: Coin, Price, 24h%, 7d%, Market Cap, Volume, Sparkline (optional)
- Remove button (trash icon) on each row
- Drag to reorder (optional: just up/down buttons is fine too)
- Empty state: "Your watchlist is empty" with CTA to browse Markets

### Part 3: Add to Watchlist Button — Create `src/components/WatchlistButton.tsx`
- Small star icon button (★ filled if watched, ☆ outline if not)
- Toggle watchlist on click
- Toast notification on add/remove
- Import `useToast` from `@/components/Toast`
- This component should be used on Coin pages and Market table rows

FILES TO CREATE/MODIFY:
- Rewrite: `src/components/watchlist/index.tsx`
- Create: `src/app/[locale]/watchlist/page.tsx`
- Create: `src/components/WatchlistButton.tsx`

After changes, run `bun run build` to verify. Commit: "feat: build full watchlist system with persistence and UI"
```

---

## PROMPT 11 — Bookmarks System (Full Provider + UI)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, cn(), UI: Button, Badge, Card, Skeleton

EXISTING FILE: `src/components/BookmarksProvider.tsx` — currently a STUB that returns `{children}`.

TASK: Build a full article bookmarks system.

### Part 1: BookmarksProvider — Rewrite `src/components/BookmarksProvider.tsx`
- Context with: `bookmarks: BookmarkedArticle[]`, `addBookmark(article)`, `removeBookmark(link)`, `isBookmarked(link)`, `clearAll()`
- `BookmarkedArticle` type: `{ link: string, title: string, source: string, category: string, imageUrl?: string, savedAt: string }`
- Persist to localStorage key `"fcn-bookmarks"`
- Sort by `savedAt` descending (newest first)
- Max 200 bookmarks

### Part 2: Bookmarks Page — Create `src/app/[locale]/bookmarks/page.tsx`
- "use client" page using `useBookmarks()` hook
- Grid of bookmarked articles using `NewsCard` or `NewsCardCompact` components
- Filter by category (pills)
- Search within bookmarks (client-side)
- "Clear All" button with confirmation
- Empty state: "No bookmarks yet" with message

### Part 3: Bookmark Button — Create `src/components/BookmarkButton.tsx`
- Bookmark icon button (filled if bookmarked, outline if not)
- Accepts `article: { link, title, source, category, imageUrl? }` prop
- Toggle bookmark on click with toast notification
- Can be used in NewsCard variants and Article page

### Part 4: Integration
- Add `BookmarkButton` to `src/components/NewsCard.tsx` — show on hover for each card variant (NewsCard, NewsCardCompact, FeaturedCard). Don't break existing layout — position absolute in top-right corner, visible on group-hover.

FILES TO CREATE/MODIFY:
- Rewrite: `src/components/BookmarksProvider.tsx`
- Create: `src/app/[locale]/bookmarks/page.tsx`
- Create: `src/components/BookmarkButton.tsx`
- Modify: `src/components/NewsCard.tsx` (add bookmark button)

After changes, run `bun run build` to verify. Commit: "feat: build full bookmarks system with persistence and article page"
```

---

## PROMPT 12 — Portfolio Tracker (Full Provider + UI)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, cn(), UI: Button, Badge, Card, Skeleton
- Icons: lucide-react

EXISTING FILE: `src/components/portfolio/index.tsx` — currently a STUB returning `{children}`.

API: `/api/prices` — returns live prices for all coins

TASK: Build a portfolio tracker.

### Part 1: PortfolioProvider — Rewrite `src/components/portfolio/index.tsx`
- Context: `holdings: Holding[]`, `addHolding(coin, amount, buyPrice)`, `removeHolding(id)`, `updateHolding(id, updates)`, `totalValue`, `totalCost`, `totalPnL`
- `Holding` type: `{ id: string, coinId: string, coinName: string, symbol: string, amount: number, buyPrice: number, addedAt: string }`
- Persist to localStorage key `"fcn-portfolio"`
- Calculate PnL against live prices

### Part 2: Portfolio Page — Create `src/app/[locale]/portfolio/page.tsx`
- "use client" page

**Dashboard Section:**
- Total portfolio value (large number)
- Total P&L ($ and %) — green/red colored
- Allocation pie chart (pure CSS/SVG — conic-gradient donut chart)

**Holdings Table:**
- Columns: Coin, Amount, Avg Buy Price, Current Price, Value, P&L ($), P&L (%), Actions
- Green/red for profit/loss
- Edit button (pencil icon) — inline edit amount/buy price
- Delete button (trash icon) with confirmation

**Add Holding Modal:**
- Search/select coin (searchable dropdown)
- Input: Amount, Buy Price
- "Add to Portfolio" button
- Use @radix-ui/react-dialog (installed)

**Empty State:**
- "Start tracking your portfolio" message
- Quick-add buttons for BTC, ETH, SOL

FILES TO CREATE/MODIFY:
- Rewrite: `src/components/portfolio/index.tsx`
- Create: `src/app/[locale]/portfolio/page.tsx`
- Create: `src/components/AddHoldingModal.tsx` ("use client")

After changes, run `bun run build` to verify. Commit: "feat: build portfolio tracker with holdings, PnL, and allocation chart"
```

---

## PROMPT 13 — Developers / API Docs Page

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border, --color-surface-secondary, --color-surface-tertiary
- .container-main, font-serif headings, font-mono for code, cn()
- UI: Button, Badge, Card

EXISTING FILE: `src/app/[locale]/developers/page.tsx` — currently a minimal shell.

The site is at cryptocurrency.cv. The API base URL is https://cryptocurrency.cv/api

TASK: Build a clean, comprehensive API documentation page.

SECTIONS:
1. **Hero** — "Free Crypto News API" headline, subtitle about no API keys needed, "Get Started" anchor link

2. **Quick Start** — Code block (styled with bg-surface-tertiary, font-mono, rounded):
   ```bash
   curl https://cryptocurrency.cv/api/news?limit=10
   ```
   With copy button, and equivalent examples in Python, JavaScript, Go, PHP

3. **Endpoints Reference** — Organized in collapsible sections (use @radix-ui/react-tabs or just <details>):
   - **News**: GET /api/news, /api/news?category=, /api/news?search=, /api/breaking, /api/trending
   - **Markets**: GET /api/prices, /api/market, /api/fear-greed, /api/ohlc
   - **DeFi**: GET /api/defi, /api/yields, /api/dex-volumes, /api/stablecoins
   - **Blockchain**: GET /api/gas, /api/on-chain, /api/whale-alerts
   - **Social**: GET /api/sentiment, /api/social
   - **Feeds**: GET /api/rss, /api/atom, /api/opml
   
   Each endpoint shows: Method, Path, Description, Parameters (table), Example Response (code block)

4. **SDKs Section** — Cards for each SDK: Python, TypeScript, Go, React, PHP — with install commands and links to repos

5. **Integrations** — Cards for: ChatGPT Plugin, Claude MCP Server, Discord Bot, Telegram Bot

6. **Rate Limits & Authentication** — Explain that no API key is needed, mention optional premium tier

7. **Sidebar TOC** — Sticky sidebar with section links (desktop only)

Create a `src/components/CodeBlock.tsx` ("use client") component:
- Accepts `code` string and `language` prop
- Syntax highlighting via simple regex-based highlighter (no external dependency)
- Copy button with success toast
- Dark theme background always (even in light mode)

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/developers/page.tsx`
- Create: `src/components/CodeBlock.tsx`

After changes, run `bun run build` to verify. Commit: "feat: build comprehensive API docs page with code samples and endpoint reference"
```

---

## PROMPT 14 — About, Contact, Pricing Pages (Polish)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent (#3b82f6), --color-border
- .container-main, font-serif headings, cn()
- UI: Button, Badge, Card, Skeleton

EXISTING FILES (all shells):
- `src/app/[locale]/about/page.tsx`
- `src/app/[locale]/contact/page.tsx`
- `src/app/[locale]/pricing/page.tsx`

TASK: Rewrite all 3 pages to be polished, production-ready.

### ABOUT PAGE (`about/page.tsx`):
- Hero with mission statement: "Real-time crypto news for everyone. Free. Forever."
- Stats row: 300+ Sources, 10K+ Articles/Day, 100+ Languages, 0 API Keys Required
- "What We Do" section: 3-column feature grid (Real-Time Aggregation, AI Analysis, Open API)
- "Open Source" section with GitHub link (https://github.com/nirholas/free-crypto-news)
- Team/Community section (open source contributors)
- Tech stack badges: Next.js, React, TypeScript, Tailwind CSS, Vercel

### CONTACT PAGE (`contact/page.tsx`):
- Contact form (purely client-side, POST to `/api/contact`):
  - Fields: Name, Email, Subject (dropdown: General, Bug Report, Feature Request, API Support, Partnership), Message
  - Basic validation, submit button with loading state
  - Success/error toast messages
- Alternative contact methods: GitHub Issues, Twitter @freecryptonews, Email
- FAQ accordion with 5-6 common questions

### PRICING PAGE (`pricing/page.tsx`):
- 3-tier pricing cards in a row:
  - **Free (forever)**: No API key, 300+ sources, RSS/Atom feeds, Basic endpoints, Community support — "Get Started" button (link to /developers)
  - **Pro ($29/mo)**: Everything in Free + AI analysis, Historical archive, Webhooks, Priority support, Custom feeds — "Coming Soon" badge
  - **Enterprise (Custom)**: Everything in Pro + Custom integrations, SLA, Dedicated support, On-premise option — "Contact Us" button (link to /contact)
- Feature comparison table below the cards
- FAQ: "Is it really free?", "Do I need an API key?", etc.
- "Free forever" guarantee banner

FILES TO MODIFY:
- Rewrite: `src/app/[locale]/about/page.tsx`
- Rewrite: `src/app/[locale]/contact/page.tsx`
- Rewrite: `src/app/[locale]/pricing/page.tsx`

After changes, run `bun run build` to verify. Commit: "feat: polish about, contact, and pricing pages"
```

---

## PROMPT 15 — Sources Page + Status Page Polish

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif headings, cn()
- UI: Button, Badge, Card, Skeleton

EXISTING FILES:
- `src/app/[locale]/sources/page.tsx` — shell page
- `src/app/[locale]/status/page.tsx` — pre-existing status page (survived deletion, keep its existing logic but restyle)

API ROUTES:
- `/api/sources` — returns list of all news sources with status
- `/api/health` — returns health check data
- `/api/stats` — returns system statistics

LIB: `getSources()` from `@/lib/crypto-news` returns `{ sources: SourceInfo[] }` where `SourceInfo = { key, name, url, category, status }`

TASK: Build polished Sources and Status pages.

### SOURCES PAGE (`sources/page.tsx`):
- **Source Count Header** — "300+ News Sources" with search/filter
- **Filter Bar** — Category filter pills (News, DeFi, Trading, etc.)
- **Sources Grid** — Cards for each source:
  - Source name, favicon (from Google favicons API: `https://www.google.com/s2/favicons?domain={url}&sz=32`)
  - Category badge
  - Status indicator (green dot = active, red = down)
  - External link to source website
  - Grouped by category with section headers
- **Search** — Filter sources by name (client-side)
- Create `src/components/SourcesGrid.tsx` ("use client") for search/filter interactivity

### STATUS PAGE (`status/page.tsx`):
- Read the existing file first to understand what it does
- Restyle to match new design system
- **Overall Status** — Large "All Systems Operational" / "Degraded" banner with colored indicator
- **Service Status Cards** — API, RSS, Atom, WebSocket, Search — each with uptime %
- **Source Health** — Grid showing each source's status
- **Performance Metrics** — Response time, articles parsed, etc.
- Auto-refresh every 30s

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/sources/page.tsx`
- Modify: `src/app/[locale]/status/page.tsx` (restyle, keep logic)
- Create: `src/components/SourcesGrid.tsx`

After changes, run `bun run build` to verify. Commit: "feat: build sources directory and polish status page"
```

---

## PROMPT 16 — Learn Page + Blog System

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif headings (prose uses Tailwind Typography: prose dark:prose-invert)
- cn(), UI: Button, Badge, Card

EXISTING FILES:
- `src/app/[locale]/learn/page.tsx` — shell page
- `content/blog/` — directory for blog content (may have files, check first)

API ROUTES:
- `/api/glossary` — Crypto glossary terms
- `/api/blog` — Blog posts (if available)

TASK: Build educational Learn hub and Blog system.

### LEARN PAGE (`learn/page.tsx`):
- **Hero** — "Learn Crypto" with subtitle about educational resources
- **Beginner Guides Grid** — 6-8 cards with static content:
  1. "What is Bitcoin?" — brief description, icon, "Read" link
  2. "What is Ethereum?" 
  3. "What is DeFi?"
  4. "How to Read Charts"
  5. "Crypto Wallet Guide"
  6. "Understanding Market Cap"
  7. "What are NFTs?"
  8. "Crypto Trading Basics"
  
  Each card links to `/learn/{slug}` (create template page below)
  
- **Glossary Section** — Searchable A-Z glossary:
  - Create `src/components/Glossary.tsx` ("use client")
  - Fetch terms from `/api/glossary` or define inline
  - Alphabet jump links (A, B, C, ... Z)
  - Search/filter input
  - Each term: Title + Definition in expandable accordion

- **Resources Section** — Links to external learning resources, recommended books, podcasts

### LEARN ARTICLE TEMPLATE — `src/app/[locale]/learn/[slug]/page.tsx`
- Template page for individual learn articles
- Pull content from a simple JSON/TS data file `src/data/learn-articles.ts`
- Prose styling with Tailwind Typography
- Related articles sidebar
- Breadcrumbs: Home > Learn > {Article Title}

### BLOG INDEX — Check `content/blog/` for existing posts
- If blog posts exist, create `src/app/[locale]/blog/page.tsx` listing them
- If not, create a minimal blog index that says "Blog coming soon"
- Use Card components for blog post previews

FILES TO CREATE/MODIFY:
- Rewrite: `src/app/[locale]/learn/page.tsx`
- Create: `src/app/[locale]/learn/[slug]/page.tsx`
- Create: `src/data/learn-articles.ts` (static content data)
- Create: `src/components/Glossary.tsx`
- Create: `src/app/[locale]/blog/page.tsx` (if blog content exists)

After changes, run `bun run build` to verify. Commit: "feat: build learn hub with guides, glossary, and blog system"
```

---

## PROMPT 17 — Privacy, Terms, and Legal Pages (Polish)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif headings
- Prose: use `prose dark:prose-invert max-w-none` for long-form content
- cn(), UI: Card

EXISTING FILES (shells):
- `src/app/[locale]/privacy/page.tsx`
- `src/app/[locale]/terms/page.tsx`

TASK: Rewrite privacy and terms pages with proper legal-style content.

### PRIVACY POLICY (`privacy/page.tsx`):
Write a comprehensive privacy policy page for a crypto news aggregator. Include:
- Table of contents sidebar (sticky, desktop)
- Sections with smooth-scroll IDs:
  1. Information We Collect (minimal — no accounts, just usage analytics via Vercel)
  2. How We Use Information
  3. Cookies and Tracking (Vercel Analytics, localStorage for preferences)
  4. Third-Party Services (Vercel, Google Fonts, CoinGecko API, RSS source websites)
  5. Data Retention
  6. Your Rights (GDPR, CCPA)
  7. API Usage Data
  8. Children's Privacy (13+)
  9. Changes to This Policy
  10. Contact Us
- Last updated date
- Clean prose formatting with proper headings, lists, and paragraphs

### TERMS OF SERVICE (`terms/page.tsx`):
Same format as privacy. Sections:
  1. Acceptance of Terms
  2. Description of Service (free crypto news aggregator, API provider)
  3. API Usage Terms (free tier, fair use, no abuse)
  4. User Conduct
  5. Intellectual Property (aggregated content belongs to original publishers)
  6. Disclaimer of Warranties (not financial advice)
  7. Limitation of Liability
  8. Indemnification
  9. Governing Law
  10. Changes to Terms
  11. Contact Information

Both pages should have:
- `generateSEOMetadata` for SEO
- Proper heading hierarchy
- Dark mode compatible
- Print-friendly styles

FILES TO MODIFY:
- Rewrite: `src/app/[locale]/privacy/page.tsx`
- Rewrite: `src/app/[locale]/terms/page.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add comprehensive privacy policy and terms of service"
```

---

## PROMPT 18 — PWA, Cookie Consent, Bottom Nav, Offline Indicator

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- cn(), UI: Button, Badge, Card
- Icons: lucide-react

EXISTING STUBS (all return null or children):
- `src/components/PWAProvider.tsx`
- `src/components/CookieConsent.tsx`
- `src/components/BottomNav.tsx`
- `src/components/OfflineIndicator.tsx`
- `src/components/UpdatePrompt.tsx`

These are all rendered in `src/app/[locale]/layout.tsx` (or imported there). Do NOT modify the layout — just make these components functional.

TASK: Implement all 5 stub components.

### 1. PWAProvider (`PWAProvider.tsx`):
- Register service worker from `/sw.js`
- Create `/public/sw.js` — simple service worker with cache-first strategy for static assets, network-first for API routes
- Handle install/update prompts
- Store `deferredPrompt` for A2HS (Add to Home Screen)
- Provide context: `{ isInstalled, isUpdateAvailable, promptInstall, applyUpdate }`

### 2. Cookie Consent (`CookieConsent.tsx`):
- Bottom banner (not modal) that slides up
- Text: "We use cookies for analytics and to improve your experience."
- Two buttons: "Accept" (primary) and "Decline" (ghost)
- Store preference in localStorage `"fcn-cookie-consent"`
- Don't show again after user decides
- Animated entrance (slide up from bottom)
- Fixed position, z-50, dark/light theme compatible

### 3. Bottom Nav (`BottomNav.tsx`):
- Mobile-only bottom navigation bar (hidden on md+ screens)
- 5 items: Home (🏠), Markets (📊), Search (🔍), Bookmarks (🔖), More (⋯)
- Active item highlighted with accent color
- Fixed bottom, safe-area padding for notched devices
- Use Link from `@/i18n/navigation`
- Icons from lucide-react: Home, BarChart3, Search, Bookmark, MoreHorizontal

### 4. Offline Indicator (`OfflineIndicator.tsx`):
- Listen to `navigator.onLine` and `online`/`offline` events
- When offline: show a thin banner at top of page "You are offline. Some features may be limited."
- Yellow/amber colored banner
- Auto-dismiss when back online with "Back online!" green flash

### 5. Update Prompt (`UpdatePrompt.tsx`):
- When service worker detects update (via PWAProvider context), show a toast/banner
- "A new version is available!" with "Update" button
- Calls `applyUpdate()` from PWAProvider which triggers `skipWaiting` + reload

FILES TO CREATE/MODIFY:
- Rewrite: `src/components/PWAProvider.tsx`
- Rewrite: `src/components/CookieConsent.tsx`
- Rewrite: `src/components/BottomNav.tsx`
- Rewrite: `src/components/OfflineIndicator.tsx`
- Rewrite: `src/components/UpdatePrompt.tsx`
- Create: `public/sw.js` (service worker)

After changes, run `bun run build` to verify. Commit: "feat: implement PWA, cookie consent, bottom nav, and offline support"
```

---

## PROMPT 19 — Alerts System + Keyboard Shortcuts + Toast Enhancements

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages  
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- cn(), UI: Button, Badge, Card
- Icons: lucide-react

EXISTING STUBS:
- `src/components/alerts/index.tsx` — stub AlertsProvider returning `{children}`
- `src/components/KeyboardShortcuts.tsx` — stub returning `{children}`
- `src/components/Toast.tsx` — functional ToastProvider with useToast() hook, auto-dismiss

TASK: Implement alerts and keyboard shortcuts.

### 1. AlertsProvider — Rewrite `src/components/alerts/index.tsx`
- Context: `alerts: Alert[]`, `addAlert(config)`, `removeAlert(id)`, `updateAlert(id, updates)`, `triggered: TriggeredAlert[]`, `clearTriggered()`
- `Alert` type: `{ id: string, type: 'price_above' | 'price_below' | 'percent_change', coinId: string, coinName: string, target: number, enabled: boolean, createdAt: string }`
- `TriggeredAlert` type: extends Alert with `triggeredAt: string, currentPrice: number`
- Persist to localStorage `"fcn-alerts"`
- Background polling: every 60s fetch `/api/prices`, check all enabled alerts
- When triggered: push to `triggered` array, show toast notification, optionally browser Notification API (if permitted)
- Max 20 alerts

### 2. Alerts Page — Create `src/app/[locale]/alerts/page.tsx`
- "use client" page using `useAlerts()` hook
- **Active Alerts Table**: Coin, Type, Target, Status (enabled/disabled toggle), Created, Actions (edit/delete)
- **Create Alert Form**: Select coin, select type, enter target value, "Create Alert" button
- **Triggered History**: List of recently triggered alerts with timestamp
- Empty state with explanation of price alerts

### 3. KeyboardShortcuts — Rewrite `src/components/KeyboardShortcuts.tsx`
- Global keyboard event listener in a provider
- Shortcuts:
  - `Cmd+K` / `Ctrl+K` → Open search (dispatch custom event or call function)
  - `/` → Focus search (when not in input)
  - `Escape` → Close modal/menu
  - `?` → Show shortcuts help modal
  - `g h` → Go to Home
  - `g m` → Go to Markets
  - `g d` → Go to DeFi
  - `g s` → Go to Settings (or Sources)
- **Shortcuts Help Modal**: Beautiful modal listing all shortcuts, triggered by `?` key
- Use @radix-ui/react-dialog for the help modal
- Don't capture when user is typing in an input/textarea

FILES TO CREATE/MODIFY:
- Rewrite: `src/components/alerts/index.tsx`
- Create: `src/app/[locale]/alerts/page.tsx`
- Rewrite: `src/components/KeyboardShortcuts.tsx`

After changes, run `bun run build` to verify. Commit: "feat: implement price alerts system and keyboard shortcuts"
```

---

## PROMPT 20 — Homepage Polish + Footer Enhancement + Final Integration

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- CSS vars: --color-surface, --color-accent, --color-border
- .container-main, font-serif headings, cn()
- UI: Button, Badge, Card, Skeleton
- News: FeaturedCard, NewsCard, NewsCardCompact, NewsCardHeadline from @/components/NewsCard

EXISTING FILES:
- `src/app/[locale]/page.tsx` — homepage with hero, top stories, latest feed, sidebar
- `src/components/Footer.tsx` — basic 4-section footer
- `src/components/Header.tsx` — nav with theme toggle

TASK: Polish the homepage and footer, plus navigation updates.

### 1. HOMEPAGE ENHANCEMENTS (`page.tsx`):

Add these sections (in order, after existing content):

**a) Breaking News Banner** (top of page, before hero):
- If `data.breaking.articles.length > 0`, show a red banner: "🔴 BREAKING: {title}" with marquee scroll
- Link to the breaking article
- Dismiss button (X)

**b) Markets Snapshot Section** (between top stories and latest):
- 6 small inline price cards: BTC, ETH, SOL, BNB, XRP, ADA
- Each shows: price + 24h% change (green/red)
- Fetch from getHomepageNews (already has breaking/trending) — add a prices fetch from `/api/prices` OR use a new server function
- Link to `/markets`

**c) Newsletter CTA Section** (after latest feed):
- Full-width card with gradient accent background
- "Stay updated with crypto news" headline
- Email input + "Subscribe" button (POST to `/api/newsletter`)
- Show success toast on submit

**d) "Explore More" Section** (bottom):
- Grid of tool cards linking to: Markets, DeFi, Portfolio, Gas Tracker, Calculator, API Docs
- Each card: Icon, Title, Short description, Arrow link

### 2. FOOTER ENHANCEMENTS (`Footer.tsx`):
- Add newsletter signup form (mini version — just email input + button)
- Add language selector dropdown (showing current locale, switching via next-intl)
- Add "Download App" section with coming soon badges (App Store, Google Play)
- Social links: GitHub, Twitter/X, Discord, Telegram
- Add schema.org footer structured data

### 3. NAV UPDATES (`Header.tsx`):
- Update NAV_ITEMS to include new pages created by other agents:
  - Under Markets: add "Fear & Greed", "Heatmap", "Screener" if not already there
  - Under Tools: add "Calculator", "Compare", "Gas Tracker" if not already there
  - Add "Watchlist" and "Portfolio" items (maybe under a "My" dropdown or as icon buttons)
- Ensure all nav links point to actual pages that now exist

FILES TO MODIFY:
- Enhance: `src/app/[locale]/page.tsx`
- Enhance: `src/components/Footer.tsx`
- Enhance: `src/components/Header.tsx`

After changes, run `bun run build` to verify. Commit: "feat: polish homepage with breaking news, market snapshot, newsletter, and footer enhancements"
```

---

## Summary Table

| # | Prompt | Pages/Components | Priority |
|---|--------|-----------------|----------|
| 1 | Header: Price Ticker + Cmd+K Search | Header, GlobalSearch | HIGH |
| 2 | Markets Dashboard | markets/page, MarketTable, format.ts | HIGH |
| 3 | Coin Detail Page | coin/[id]/page, PriceChart | HIGH |
| 4 | Category Pages Enhanced | category/[slug]/page, LoadMoreButton | HIGH |
| 5 | Search Page Advanced | search/page, useDebounce | HIGH |
| 6 | Article Reader | article/[id]/page, ShareBar | HIGH |
| 7 | DeFi Dashboard | defi/page, DefiTable | MEDIUM |
| 8 | Fear & Greed, Heatmap, Screener | 3 new pages + 3 components | MEDIUM |
| 9 | Gas, Calculator, Compare | 3 new pages + 2 components | MEDIUM |
| 10 | Watchlist System | watchlist provider + page + button | MEDIUM |
| 11 | Bookmarks System | bookmarks provider + page + button | MEDIUM |
| 12 | Portfolio Tracker | portfolio provider + page + modal | MEDIUM |
| 13 | API Docs Page | developers/page, CodeBlock | HIGH |
| 14 | About, Contact, Pricing | 3 pages polished | MEDIUM |
| 15 | Sources + Status Pages | sources/page, SourcesGrid, status | MEDIUM |
| 16 | Learn Hub + Blog | learn/page, learn/[slug], Glossary, blog | LOW |
| 17 | Privacy + Terms | 2 legal pages | LOW |
| 18 | PWA, Cookie, BottomNav, Offline | 5 components + sw.js | LOW |
| 19 | Alerts + Keyboard Shortcuts | alerts provider + page, KeyboardShortcuts | LOW |
| 20 | Homepage Polish + Footer + Nav | page.tsx, Footer, Header updates | HIGH (run last) |

**Recommended execution order**: Run 1-6 first (HIGH priority, core pages). Then 7-15 (MEDIUM, feature pages). Then 16-19 (LOW, polish). Run 20 LAST as it integrates everything.

**Parallel-safe groups** (no conflicts):
- Group A: Prompts 2, 3, 7, 8, 9 (different pages, no shared components)
- Group B: Prompts 10, 11, 12 (different providers, different pages)
- Group C: Prompts 14, 15, 16, 17 (content pages, no shared components)
- Do NOT run in parallel: 1 & 20 (both modify Header), 4 & 11 (both modify NewsCard), 1 & 19 (both handle keyboard shortcuts / search)
