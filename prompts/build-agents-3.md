

## PROMPT 43 — Airdrops Tracker Page

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, font-serif headings, cn(), UI: Button/Badge/Card/Skeleton, Icons: lucide-react

API ROUTES:
- `/api/airdrops` — Active and upcoming airdrop data (project, chain, type, estimated value, deadline, requirements, status)

TASK: Build an Airdrops tracker page.

### PAGE: `src/app/[locale]/airdrops/page.tsx`

SECTIONS:
1. **Active Airdrops** — Create `src/components/AirdropCards.tsx` ("use client"):
   - Card grid of currently active airdrops
   - Each card: project name, chain badge (Ethereum/Solana/Arbitrum/etc.), estimated value, deadline countdown timer, requirements list (checkmarks), status badge (Active/Upcoming/Ended), "Learn More" external link
   - Sort by: Deadline (soonest), Estimated Value (highest), Newest
   - Filter by: chain, status

2. **Upcoming Airdrops** — Timeline view of anticipated airdrops:
   - Project name, expected date range, chain, eligibility criteria
   - "Confirmed" vs "Rumored" badges

3. **Past Airdrops** — Collapsed section showing historical airdrops:
   - Project, actual value distributed, date, chain
   - Useful for reference

4. **Eligibility Checker** — Simple checklist component:
   - "Common criteria" checkboxes: Wallet age > 6 months, Active on-chain, Token holder, Bridge user, DeFi user
   - Purely informational — helps users understand typical airdrop criteria

5. **Safety Disclaimer** — Warning card: "Never share your private keys. Legitimate airdrops never ask for seed phrases."

### FILES TO CREATE:
- `src/app/[locale]/airdrops/page.tsx`
- `src/components/AirdropCards.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add airdrop tracker with active, upcoming, and past airdrops"
```

---

## PROMPT 44 — Trading View & Chart Analysis Page

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, font-serif headings, cn(), UI: Button/Badge/Card/Skeleton, Icons: lucide-react

API ROUTES:
- `/api/tradingview` — TradingView data integration
- `/api/chart-analysis` — AI chart analysis (pattern detection)
- `/api/ohlc?coin={id}&days=30` — OHLC candle data
- `/api/signals` — Trading signals
- `/api/orderbook` — Order book data

EXISTING: `src/components/PriceChart.tsx` — basic price chart component

TASK: Create an advanced Trading/Charts page.

### PAGE: `src/app/[locale]/trading/page.tsx`

SECTIONS:
1. **Advanced Chart** — Create `src/components/AdvancedChart.tsx` ("use client"):
   - Full-width chart area (takes 70% of viewport height)
   - Coin selector dropdown at top
   - If `lightweight-charts` is installed (check package.json), use it for candlestick chart
   - If not, install: `pnpm add lightweight-charts`
   - Features: candlestick view, line view toggle, volume bars at bottom
   - Time range: 1D, 1W, 1M, 3M, 1Y, ALL buttons
   - Dark/light theme support (lightweight-charts has built-in theme support)
   - Crosshair with price/time tooltip

2. **AI Chart Analysis** — Create `src/components/ChartAnalysis.tsx` ("use client"):
   - Button: "Analyze Chart with AI" below the chart
   - Sends current coin + timeframe to `/api/chart-analysis`
   - Displays: detected patterns (Head & Shoulders, Double Bottom, etc.), support/resistance levels, trend direction, AI confidence score
   - Results shown in a card with pattern name badges

3. **Order Book** — Create `src/components/OrderBook.tsx` ("use client"):
   - Sidebar showing live order book depth
   - Bids (green, left-aligned) and Asks (red, right-aligned)
   - Price levels with horizontal bar visualization showing volume at each level
   - Fetch from `/api/orderbook?coin={id}`
   - Auto-refresh every 5 seconds

4. **Trading Signals Feed** — Bottom section:
   - Latest trading signals from `/api/signals`
   - Each: coin, signal (Buy/Sell/Hold), strength, reason, time

### FILES TO CREATE:
- `src/app/[locale]/trading/page.tsx`
- `src/components/AdvancedChart.tsx`
- `src/components/ChartAnalysis.tsx`
- `src/components/OrderBook.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add advanced trading page with charts, AI analysis, and order book"
```

---

## PROMPT 45 — Embeddable Widget System (iframe Widgets)

```
You are building embeddable widgets for cryptocurrency.cv — a crypto news aggregator.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

CONTEXT: The `widget/` directory has basic HTML widget files (crypto-news-widget.html, ticker.html, carousel.html, ticker.js, carousel.js). These need to be modernized.

EXISTING API: All API endpoints at https://cryptocurrency.cv/api/

TASK: Build a modern embeddable widget system that anyone can drop into their website.

### 1. Widget Builder Page — `src/app/[locale]/widgets/page.tsx` ("use client"):
   - Create `src/components/WidgetBuilder.tsx` ("use client"):
   - Interactive widget configurator with LIVE PREVIEW
   - Widget types:
     a) **Price Ticker** — horizontal scrolling bar of crypto prices
     b) **News Feed** — card list of latest news (configurable count: 5/10/15)
     c) **Single Coin** — price card for one coin (configurable coin)
     d) **Market Overview** — mini dashboard with top 5 coins
     e) **Fear & Greed** — simple gauge widget
   - Configuration options per widget:
     - Theme: light/dark/auto
     - Width: responsive/fixed
     - Number of items (for feed)
     - Coin selection (for single coin)
     - Show/hide elements (title, branding, timestamp)
   - LIVE PREVIEW: render the widget in an iframe in the preview pane
   - EMBED CODE: generate `<iframe>` and `<script>` embed codes
   - Copy to clipboard button for embed code

### 2. Widget Endpoints — Create `src/app/embed/` (NO locale prefix):
   - `src/app/embed/ticker/page.tsx` — Standalone price ticker widget
   - `src/app/embed/news/page.tsx` — Standalone news feed widget
   - `src/app/embed/coin/page.tsx` — Single coin widget (accepts ?coin=bitcoin query param)
   - `src/app/embed/market/page.tsx` — Market overview widget
   - `src/app/embed/fear-greed/page.tsx` — Fear & Greed gauge widget
   - Each has its own minimal layout (no Header/Footer, just the widget content)
   - Accept query params: theme=light|dark, count=10, coin=bitcoin
   - Responsive, loads fast, minimal CSS (inline or tiny bundle)
   - Include "Powered by Free Crypto News" link at bottom

### 3. Widget Script — Update `widget/embed.js`:
   - Lightweight script (<5KB) that creates an iframe pointing to /embed/* routes
   - Usage: `<script src="https://cryptocurrency.cv/widget/embed.js" data-type="ticker" data-theme="dark"></script>`
   - Auto-sizes iframe height

### FILES TO CREATE:
- `src/app/[locale]/widgets/page.tsx`
- `src/components/WidgetBuilder.tsx`
- `src/app/embed/layout.tsx` (minimal layout — no Header/Footer)
- `src/app/embed/ticker/page.tsx`
- `src/app/embed/news/page.tsx`
- `src/app/embed/coin/page.tsx`
- `src/app/embed/market/page.tsx`
- `src/app/embed/fear-greed/page.tsx`
- `widget/embed.js`

After changes, run `bun run build` to verify. Commit: "feat: add embeddable widget system with builder and 5 widget types"
```

---

## PROMPT 46 — Browser Extension Update (Manifest V3)

```
You are updating the browser extension for cryptocurrency.cv — a crypto news aggregator.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING FILES in `extension/`:
- manifest.json — Chrome extension manifest
- background.js — Service worker
- popup.html + popup.js — Extension popup
- options.html + options.js — Options page
- README.md

API BASE: https://cryptocurrency.cv/api

TASK: Modernize the browser extension to Manifest V3 with a polished UI matching the main site's design.

### 1. Update `extension/manifest.json`:
   - Ensure Manifest V3 compliance
   - Permissions: "storage", "alarms", "notifications"
   - Host permissions: "https://cryptocurrency.cv/*"
   - Action: popup.html
   - Background: service_worker: "background.js"
   - Icons: reference proper icon paths

### 2. Rewrite `extension/popup.html` + `extension/popup.js`:
   - Modern, clean popup (400x500px) matching the site's design system
   - CSS inline: use Inter font, --color-surface/accent/border vars, dark mode support
   - Sections:
     a) **Price Bar** — BTC, ETH, SOL prices with 24h change (fetched from /api/prices)
     b) **Latest News** — 5 latest headlines with source + time, each clickable (opens in new tab)
     c) **Quick Links** — Buttons: Open FCN, Markets, Search, Portfolio
     d) **Settings Footer** — Theme toggle, notification toggle, link to options page
   - Loading skeleton while fetching
   - Cache responses for 60s in chrome.storage.local
   - Error state: "Offline — showing cached data"

### 3. Rewrite `extension/background.js`:
   - Periodic alarm (every 5 min) to check for breaking news
   - Show chrome.notifications for breaking news
   - Badge text: show number of unread breaking news items
   - Cache latest data in chrome.storage.local

### 4. Rewrite `extension/options.html` + `extension/options.js`:
   - Settings page:
     - Theme: light/dark/system
     - Notification preferences: breaking news on/off, price alerts on/off
     - Refresh interval: 1min, 5min, 15min, 30min
     - Default coin for badge: BTC/ETH/SOL
   - Save to chrome.storage.sync

### 5. Update `extension/README.md`:
   - Installation instructions (Chrome, Firefox, Edge)
   - Screenshots placeholder
   - Feature list
   - Development instructions

### FILES TO MODIFY:
- Rewrite: `extension/manifest.json`
- Rewrite: `extension/popup.html`
- Rewrite: `extension/popup.js`
- Rewrite: `extension/background.js`
- Rewrite: `extension/options.html`
- Rewrite: `extension/options.js`
- Update: `extension/README.md`

After changes, commit: "feat: modernize browser extension to Manifest V3 with polished UI"
```

---

## PROMPT 47 — CLI Tool Enhancement

```
You are enhancing the CLI tool for cryptocurrency.cv — a crypto news aggregator.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING FILES in `cli/`:
- index.js — Main CLI entry point
- package.json — CLI package
- README.md

API BASE: https://cryptocurrency.cv/api

TASK: Build a feature-rich CLI tool for accessing crypto news from the terminal.

### 1. Rewrite `cli/index.js` as a proper CLI with subcommands:

```
Usage: fcn <command> [options]

Commands:
  news          Get latest crypto news
  search <q>    Search news by keyword
  prices        Show live crypto prices
  market        Show market overview
  fear-greed    Show Fear & Greed Index
  gas           Show Ethereum gas prices
  trending      Show trending coins
  sources       List all news sources
  ask <q>       Ask AI a crypto question
  watch <coin>  Watch live price updates

Options:
  --limit, -l   Number of results (default: 10)
  --category    Filter by category (bitcoin, ethereum, defi, nft, etc.)
  --format      Output format: table, json, csv (default: table)
  --no-color    Disable colored output
  --help, -h    Show help
  --version     Show version
```

### 2. Features:
   - **Colored output** using ANSI codes (no external deps — use raw escape codes)
   - **Table formatting** for structured data (prices, market, gas)
   - **JSON output** with `--format json` flag for piping
   - **CSV output** with `--format csv` for exports
   - **Live mode** for `watch` command: clear screen and update every 10s
   - **Truncate** long titles to terminal width
   - **Error handling** with friendly messages for network failures
   - Use `fetch` (Node 18+ built-in) — no external HTTP dependencies

### 3. Update `cli/package.json`:
   - Set `"bin": { "fcn": "./index.js" }`
   - Set `"type": "module"`
   - Ensure `#!/usr/bin/env node` shebang at top of index.js

### 4. Update `cli/README.md`:
   - Installation: `npm install -g @nicholasrq/fcn-cli`
   - Usage examples for each command
   - Screenshots (placeholder)

### FILES TO MODIFY:
- Rewrite: `cli/index.js`
- Update: `cli/package.json`
- Update: `cli/README.md`

After changes, test with: `node cli/index.js news --limit 5`. Commit: "feat: enhance CLI tool with subcommands, colored output, and live mode"
```

---

## PROMPT 48 — Mobile App Screens (React Native)

```
You are enhancing the React Native mobile app for cryptocurrency.cv — a crypto news aggregator.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING FILES in `mobile/`:
- App.tsx — Main entry point
- package.json — React Native package
- app.json — Expo config
- babel.config.js
- src/api/ — API client
- src/components/ — Shared components
- src/hooks/ — Custom hooks
- src/screens/ — Screen components
- src/types/ — TypeScript types

API BASE: https://cryptocurrency.cv/api

TASK: Build/enhance the main screens for the React Native app. Read existing files first to understand the current state, then enhance.

### SCREENS TO BUILD/ENHANCE (in `mobile/src/screens/`):

1. **HomeScreen.tsx** — Main news feed:
   - Pull-to-refresh
   - FlatList of news cards (title, source, time, category badge, thumbnail)
   - Breaking news banner at top
   - Tab bar: Latest, Trending, Breaking

2. **MarketsScreen.tsx** — Prices & market data:
   - FlatList of top 50 coins: icon, name, price, 24h change
   - Pull-to-refresh, auto-update every 60s
   - Search filter at top
   - Tap coin → CoinDetailScreen

3. **CoinDetailScreen.tsx** — Individual coin view:
   - Large price display with change
   - Simple line chart (use react-native-svg for basic chart, or just show stats)
   - Stats grid: Market Cap, Volume, Supply, ATH
   - Related news cards at bottom

4. **SearchScreen.tsx** — Search news:
   - Search bar with debounce
   - Category filter chips
   - Results as FlatList
   - Recent searches (AsyncStorage)

5. **SettingsScreen.tsx** — App settings:
   - Theme toggle (light/dark/system)
   - Default currency
   - Notification preferences
   - About section with version, links

### SHARED COMPONENTS (`mobile/src/components/`):
- `NewsCard.tsx` — Reusable news item component
- `PriceRow.tsx` — Coin price list item
- `Header.tsx` — Screen header with logo
- `Badge.tsx` — Category badge

### UPDATE `mobile/App.tsx`:
- Set up React Navigation (check if installed)
- Tab navigator: Home, Markets, Search, Settings
- Stack navigator for detail screens

### FILES TO CREATE/MODIFY:
- Update: `mobile/App.tsx`
- Create/Enhance: `mobile/src/screens/HomeScreen.tsx`
- Create/Enhance: `mobile/src/screens/MarketsScreen.tsx`
- Create/Enhance: `mobile/src/screens/CoinDetailScreen.tsx`
- Create/Enhance: `mobile/src/screens/SearchScreen.tsx`
- Create/Enhance: `mobile/src/screens/SettingsScreen.tsx`
- Create/Enhance: `mobile/src/components/NewsCard.tsx`
- Create/Enhance: `mobile/src/components/PriceRow.tsx`

After changes, commit: "feat: build React Native mobile app screens"
```

---

## PROMPT 49 — Copilot Extension Enhancement

```
You are enhancing the GitHub Copilot extension for cryptocurrency.cv — a crypto news aggregator.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING FILES in `copilot-extension/`:
- src/extension.ts — Main extension entry
- package.json — Dependencies
- tsconfig.json — TypeScript config
- README.md

API BASE: https://cryptocurrency.cv/api

TASK: Build a full GitHub Copilot Chat extension that lets developers query crypto data from their IDE.

### 1. Rewrite `copilot-extension/src/extension.ts`:
   - Register as a Copilot Chat participant named `@crypto`
   - Handle commands:
     - `/news` — Get latest crypto news (returns formatted markdown)
     - `/price <coin>` — Get current price for a coin
     - `/market` — Market overview summary
     - `/search <query>` — Search news
     - `/gas` — Current Ethereum gas prices
     - `/fear-greed` — Current Fear & Greed index
     - `/explain <term>` — Explain a crypto term (from glossary API)
   - Each handler: fetches from API, formats as markdown response
   - Stream responses for better UX
   - Handle errors gracefully

### 2. Update `copilot-extension/package.json`:
   - Ensure proper VS Code extension fields:
     - `"engines": { "vscode": "^1.90.0" }`
     - `"activationEvents": ["onStartupFinished"]`
     - `"contributes": { "chatParticipants": [...] }`
   - Add build/watch scripts

### 3. Update `copilot-extension/README.md`:
   - Overview: what the extension does
   - Installation from marketplace (placeholder)
   - Usage examples with screenshots (placeholder)
   - Available commands list
   - Configuration options

### FILES TO MODIFY:
- Rewrite: `copilot-extension/src/extension.ts`
- Update: `copilot-extension/package.json`
- Update: `copilot-extension/README.md`

After changes, commit: "feat: enhance GitHub Copilot extension with full crypto data commands"
```

---

## PROMPT 50 — Raycast Extension Enhancement

```
You are enhancing the Raycast extension for cryptocurrency.cv — a crypto news aggregator.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING FILES in `raycast/`:
- src/ — Source directory
- package.json — Raycast extension package
- README.md

API BASE: https://cryptocurrency.cv/api

TASK: Build a full Raycast extension for quick crypto lookups from the command bar.

### 1. Read existing files first, then enhance `raycast/src/` with commands:

   - **`search-news.tsx`** — Search crypto news:
     - Raycast List view with search bar
     - Each item: title, source, time, category icon
     - Action: Open in Browser, Copy Link, Read Summary
     - Debounced search against `/api/news?search=`

   - **`prices.tsx`** — Live crypto prices:
     - Raycast List showing top 20 coins
     - Each: icon, name, price, 24h change (colored)
     - Action: Open coin page, Copy price, View chart
     - Pull to refresh

   - **`fear-greed.tsx`** — Fear & Greed Index:
     - Raycast Detail view with gauge value
     - Show: current value, label, historical trend text
     - Action: Open in browser

   - **`gas.tsx`** — Ethereum gas prices:
     - Raycast Detail with 3 speeds (slow/standard/fast)
     - Show gwei and estimated USD

   - **`trending.tsx`** — Trending crypto news:
     - Raycast List of trending articles
     - Each with title, source, preview

   - **`portfolio.tsx`** — Quick portfolio check:
     - If localStorage data available, show holdings summary
     - Otherwise, show setup instructions

### 2. Update `raycast/package.json`:
   - Add all commands with titles, descriptions, icons
   - Set API preferences for base URL

### 3. Update `raycast/README.md`:
   - Installation: Raycast Store link
   - All available commands with descriptions
   - Screenshots placeholder

### FILES TO CREATE/MODIFY:
- Create: `raycast/src/search-news.tsx`
- Create: `raycast/src/prices.tsx`
- Create: `raycast/src/fear-greed.tsx`
- Create: `raycast/src/gas.tsx`
- Create: `raycast/src/trending.tsx`
- Create: `raycast/src/portfolio.tsx`
- Update: `raycast/package.json`
- Update: `raycast/README.md`

After changes, commit: "feat: build full Raycast extension with 6 crypto commands"
```

---

## PROMPT 51 — SDK Polish: Python, TypeScript, Go

```
You are polishing the SDKs for cryptocurrency.cv — a crypto news aggregator with a free API.

IMPORTANT RULES:
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING SDKs in `sdk/`: python, typescript, go, javascript, php, react, ruby, rust, swift, kotlin, java, csharp, r

API BASE: https://cryptocurrency.cv/api

TASK: Polish the 3 most popular SDKs — Python, TypeScript, and Go — to be production-ready.

### 1. Python SDK (`sdk/python/`):
Read existing files first, then ensure:
- Main module with class `CryptoNewsClient`:
  - `__init__(base_url="https://cryptocurrency.cv/api")`
  - `get_news(limit=10, category=None, search=None)` → list of dicts
  - `get_prices(coin=None)` → price data
  - `get_market()` → market overview
  - `get_fear_greed()` → fear & greed index
  - `get_gas()` → gas prices
  - `get_trending()` → trending news
  - `search(query, limit=10)` → search results
  - `get_sources()` → source list
- Async support: `AsyncCryptoNewsClient` using `aiohttp`
- Type hints throughout
- Error handling: `CryptoNewsError`, `RateLimitError`, `NetworkError`
- `README.md` with pip install, quick start, all methods documented
- `setup.py` or `pyproject.toml` for PyPI publishing
- Unit tests in `tests/`

### 2. TypeScript SDK (`sdk/typescript/`):
Read existing files first, then ensure:
- Typed client class with all endpoints
- Interface definitions for all response types
- Both ESM and CJS exports
- Full JSDoc documentation
- `README.md` with npm install, usage, TypeScript examples
- `package.json` with proper types, exports fields
- Built with `tsc`

### 3. Go SDK (`sdk/go/`):
Read existing files first, then ensure:
- Package `cryptonews` with `Client` struct
- Methods matching Python/TS SDKs
- Proper error types
- Context support (`context.Context` on all methods)
- `README.md` with go get, usage examples
- `go.mod` with proper module path
- Example programs in `examples/`

### FILES TO MODIFY:
- Polish all files in: `sdk/python/`, `sdk/typescript/`, `sdk/go/`

After changes, commit: "feat: polish Python, TypeScript, and Go SDKs to production quality"
```

---

## PROMPT 52 — ChatGPT Plugin & MCP Server Update

```
You are updating the ChatGPT plugin and Claude MCP server for cryptocurrency.cv.

IMPORTANT RULES:
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING FILES:
- `chatgpt/openapi.yaml` — OpenAPI spec for ChatGPT plugin
- `chatgpt/README.md`
- `mcp/index.js` — Claude MCP server entry
- `mcp/http-server.js` — HTTP transport
- `mcp/package.json`
- `mcp/README.md`

API BASE: https://cryptocurrency.cv/api

TASK: Update both integrations to cover all new API endpoints.

### 1. ChatGPT Plugin (`chatgpt/openapi.yaml`):
Read existing spec, then add all missing endpoints:
- `/api/news` (with search, category, limit params)
- `/api/prices` (with coin param)
- `/api/market`
- `/api/fear-greed`
- `/api/gas`
- `/api/trending`
- `/api/defi`
- `/api/yields`
- `/api/whale-alerts`
- `/api/sentiment`
- `/api/predictions`
- `/api/stablecoins`
- `/api/l2`
- `/api/liquidations`
- `/api/funding-rates`
- `/api/nft`
- `/api/airdrops`
- `/api/events`
- `/api/regulatory`
- `/api/macro`
- `/api/arbitrage`
- `/api/exchanges`
- `/api/sources`
- `/api/glossary`
- `/api/ask` (POST)

Each endpoint: proper description, parameters, response schema.
Update info section with current version and description.

### 2. MCP Server (`mcp/`):
Read existing server code, then add tools for all new endpoints:
- Tools should be named clearly: `get_crypto_news`, `get_crypto_prices`, `get_market_overview`, `get_fear_greed`, `get_gas_prices`, `get_trending`, `get_defi_data`, `get_whale_alerts`, `get_sentiment`, `ask_crypto_question`, etc.
- Each tool: name, description, input schema (JSON Schema), handler that fetches from API
- Add resource endpoints for commonly accessed data
- Update README with all available tools

### FILES TO MODIFY:
- Rewrite: `chatgpt/openapi.yaml`
- Enhance: `mcp/index.js`
- Update: `mcp/README.md`
- Update: `chatgpt/README.md`

After changes, commit: "feat: update ChatGPT plugin and MCP server with all new endpoints"
```

---

## PROMPT 53 — Postman Collection & API Examples Update

```
You are updating API documentation artifacts for cryptocurrency.cv.

IMPORTANT RULES:
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

EXISTING:
- `postman/Free_Crypto_News_API.postman_collection.json` — Postman collection
- `postman/README.md`
- `examples/` — Example scripts in multiple languages (curl, python, javascript, go, react, rust, swift, kotlin, csharp, typescript)

API BASE: https://cryptocurrency.cv/api

TASK: Update the Postman collection and all example scripts to cover all API endpoints.

### 1. Postman Collection (`postman/`):
Read existing collection, then ensure ALL endpoints are covered:
- Organize into folders: News, Markets, DeFi, Blockchain, Social, Trading, Tools, Feeds
- Each request: name, description, URL, query params with examples, example response
- Environment variables: `{{base_url}}` = `https://cryptocurrency.cv/api`
- Pre-request scripts where needed
- Tests for response validation (status 200, has required fields)

### 2. Examples (`examples/`):
Read each existing example file, then update/enhance:

- **`examples/curl.sh`** — Complete curl examples for every major endpoint
- **`examples/python/`** — Comprehensive Python examples (requests + async aiohttp)
- **`examples/javascript/`** — Node.js fetch examples
- **`examples/typescript/`** — TypeScript examples with type definitions
- **`examples/go/`** — Go examples with proper struct definitions
- **`examples/react/`** — React component examples (hooks, SWR/React Query patterns)

Add NEW examples for:
- **`examples/discord-bot.js`** — Update Discord bot to use new endpoints
- **`examples/telegram-bot.py`** — Update Telegram bot
- **`examples/langchain-tool.py`** — Update LangChain integration
- **`examples/ai-analysis.py`** — AI analysis example using /api/ask

Each example should:
- Be runnable as-is (copy-paste ready)
- Include error handling
- Show multiple endpoints
- Have comments explaining the code

### FILES TO MODIFY:
- Update: `postman/Free_Crypto_News_API.postman_collection.json`
- Update/Create: All files in `examples/`

After changes, commit: "docs: update Postman collection and API examples for all endpoints"
```

---

## PROMPT 54 — Notification System (Push + In-App)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, cn(), UI: Button/Badge/Card, Icons: lucide-react

API ROUTES:
- `/api/push` — Push notification registration/delivery
- `/api/breaking` — Breaking news
- `/api/alerts` — User alerts

EXISTING: PWAProvider at `src/components/PWAProvider.tsx`, ToastProvider at `src/components/Toast.tsx`

TASK: Build a comprehensive notification system.

### 1. Notification Center — Create `src/components/NotificationCenter.tsx` ("use client"):
   - Bell icon button in header (with unread count badge)
   - Dropdown panel showing recent notifications:
     - Breaking news alerts
     - Price alert triggers
     - System updates
   - Each notification: icon, title, message, timestamp, read/unread indicator
   - "Mark all as read" button
   - "Clear all" button
   - Group by: Today, Yesterday, This Week
   - Store notifications in localStorage `"fcn-notifications"`
   - Max 100 notifications

### 2. Notification Preferences Page — Create `src/app/[locale]/notifications/page.tsx`:
   - Push notification permission request button
   - Notification types toggles:
     - Breaking News (on/off)
     - Price Alerts (on/off, if alerts exist)
     - Daily Digest (on/off)
     - Market Movers (on/off — notify when coin moves > 10% in 1h)
   - Quiet hours: set start/end time (don't disturb)
   - Channel preferences: In-App / Push / Email (email disabled/coming soon)

### 3. Push Notification Registration:
   - Create `src/lib/push-notifications.ts`:
     - `requestPermission()` — request browser notification permission
     - `subscribeToPush(subscription)` — POST to `/api/push` with subscription
     - `unsubscribeFromPush()` — Remove push subscription
     - `sendLocalNotification(title, body, icon?)` — show browser notification

### 4. Integration:
   - Add NotificationCenter bell icon to Header.tsx (next to theme toggle)
   - When breaking news arrives, show both in-app toast AND push notification (if enabled)
   - When price alert triggers, show notification

### FILES TO CREATE:
- `src/components/NotificationCenter.tsx`
- `src/app/[locale]/notifications/page.tsx`
- `src/lib/push-notifications.ts`

### FILES TO MODIFY:
- `src/components/Header.tsx` — add bell icon with NotificationCenter

After changes, run `bun run build` to verify. Commit: "feat: add notification center with push notifications and preferences"
```

---

## PROMPT 55 — Data Export & API Playground

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, font-serif headings, font-mono for code, cn(), UI: Button/Badge/Card, Icons: lucide-react

API ROUTES:
- `/api/export` or `/api/exports` — Export endpoints
- All API routes listed previously

EXISTING: `src/components/CodeBlock.tsx` — Code block component with copy button

TASK: Build Data Export tools and an interactive API Playground.

### 1. API Playground — `src/app/[locale]/playground/page.tsx` ("use client"):
   - Create `src/components/APIPlayground.tsx` ("use client"):
   - Split view: Left = Request Builder, Right = Response Viewer
   
   **Request Builder:**
   - Endpoint dropdown: list all major `/api/*` endpoints
   - Method badge (GET/POST)
   - Dynamic parameter inputs based on selected endpoint:
     - `/api/news`: limit (number), category (dropdown), search (text)
     - `/api/prices`: coin (text)
     - `/api/ohlc`: coin (text), days (number)
     - etc.
   - "Send Request" button
   - Show the constructed URL
   
   **Response Viewer:**
   - Syntax-highlighted JSON response (use CodeBlock component)
   - Response time badge
   - Status code badge (green 200, red 4xx/5xx)
   - Response headers collapsible section
   - Copy response button
   - "Format JSON" toggle (pretty vs compact)

### 2. Data Export Page — `src/app/[locale]/export/page.tsx` ("use client"):
   - Create `src/components/DataExporter.tsx` ("use client"):
   - Choose data type: News, Prices, Market, DeFi, Sources
   - Configure: date range, category, limit
   - Export format: JSON, CSV, XML
   - Preview first 5 rows
   - "Download" button → triggers file download
   - "Copy to Clipboard" button for JSON
   - Show estimated file size

### 3. RSS/Atom Feed Configurator:
   - Section on export page showing RSS/Atom feed URLs
   - Configurable: category, language, limit
   - Live preview of feed XML
   - Copy URL button for each feed
   - OPML export link

### FILES TO CREATE:
- `src/app/[locale]/playground/page.tsx`
- `src/components/APIPlayground.tsx`
- `src/app/[locale]/export/page.tsx`
- `src/components/DataExporter.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add API playground and data export tools"
```

---

## PROMPT 56 — Archive & Historical Data Explorer

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, font-serif headings, cn(), UI: Button/Badge/Card/Skeleton, Icons: lucide-react. News: NewsCard/NewsCardCompact from @/components/NewsCard

EXISTING DATA: `archive/` directory has years 2021-2026, articles/, market/, indexes/, etc.

API ROUTES:
- `/api/archive` — Historical news archive data
- `/api/articles` — All articles endpoint
- `/api/article` — Single article

TASK: Build a historical archive explorer.

### PAGE: `src/app/[locale]/archive/page.tsx`

SECTIONS:
1. **Date Navigation** — Create `src/components/ArchiveExplorer.tsx` ("use client"):
   - Year selector: 2021, 2022, 2023, 2024, 2025, 2026
   - Month grid: Jan-Dec (for selected year)
   - Day calendar: when month selected, show daily calendar
   - Click any date → load articles from that date
   - URL synced: `/archive?year=2025&month=03&day=15`

2. **Archive Results**:
   - Grid of articles for selected date/period
   - Uses NewsCardCompact component
   - Article count for the period
   - Navigate between days with prev/next buttons

3. **Market Context** — For any selected date, show:
   - BTC price on that day (from archive/market/)
   - Market cap
   - Key event of the day (if available)
   - "On this day in crypto" — notable historical facts

4. **Statistics Dashboard** — Summary stats:
   - Total articles in archive
   - Articles per year bar chart (CSS bars)
   - Top sources over time
   - Most covered topics

5. **Search within Archive** — Search with date range filter:
   - Start date, end date, search query
   - Results from historical data only

### FILES TO CREATE:
- `src/app/[locale]/archive/page.tsx`
- `src/components/ArchiveExplorer.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add historical archive explorer with date navigation and market context"
```

---

## PROMPT 57 — Knowledge Graph & Entity Relationships Visualization

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, cn(), UI: Button/Badge/Card/Skeleton, Icons: lucide-react

EXISTING: `src/components/EntityRelationships.tsx` — exists but may be empty/stub

API ROUTES:
- `/api/knowledge-graph` — Graph data (nodes: entities, edges: relationships)
- `/api/entities` — Named entities extracted from news
- `/api/relationships` — Entity relationship data
- `/api/tags` — Tag/topic data

TASK: Build a Knowledge Graph visualization page.

### PAGE: `src/app/[locale]/explore/page.tsx`

SECTIONS:
1. **Entity Graph** — Create/Rewrite `src/components/EntityRelationships.tsx` ("use client"):
   - Interactive force-directed graph visualization using SVG:
     - Nodes: circles representing entities (coins, people, companies, protocols)
     - Edges: lines connecting related entities
     - Node size: based on mention count
     - Node color: by type (coins=blue, people=green, companies=purple, protocols=orange)
     - Click node → show details panel (recent news, stats, connections)
     - Hover → highlight connected nodes
     - Zoom + Pan (mouse wheel + drag)
     - Implement basic force simulation in JavaScript (no external library — use requestAnimationFrame with simple physics: repulsion between nodes, attraction along edges, centering force)
   - Fetch from `/api/knowledge-graph` or `/api/entities`

2. **Entity Search** — Search bar to find any entity and center the graph on it

3. **Trending Connections** — Sidebar showing top 10 strongest entity relationships right now:
   - "Bitcoin ↔ Federal Reserve" (strength: 85)
   - "Ethereum ↔ Layer 2" (strength: 72)
   - Each clickable → highlights in graph

4. **Topic Clusters** — Tag cloud of current topics:
   - Tags sized by frequency
   - Click tag → filter graph to only show related entities

### FILES TO CREATE/MODIFY:
- `src/app/[locale]/explore/page.tsx`
- Rewrite: `src/components/EntityRelationships.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add knowledge graph explorer with entity relationship visualization"
```

---

## PROMPT 58 — Admin Dashboard (Internal)

```
You are building the frontend for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9, next-intl.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM: CSS vars, .container-main, cn(), UI: Button/Badge/Card/Skeleton, Icons: lucide-react

API ROUTES:
- `/api/admin` — Admin endpoints (requires auth)
- `/api/stats` — System statistics
- `/api/health` — Health check
- `/api/metrics` — Performance metrics
- `/api/analytics` — Usage analytics
- `/api/monitor` — Monitoring data
- `/api/cache` — Cache management

EXISTING: `src/lib/admin-auth.ts` — admin authentication library

TASK: Build an admin dashboard at a protected route.

### PAGE: `src/app/[locale]/admin/page.tsx`
### LAYOUT: `src/app/[locale]/admin/layout.tsx`
   - Check admin auth (simple password or env-based token)
   - If not authenticated, show login form
   - Separate layout from main site (admin sidebar nav, no public Header/Footer)

### ADMIN PAGES:

1. **Dashboard** (`admin/page.tsx`):
   - Stats cards: Total Articles (today/all-time), Active Sources, API Requests (24h), Unique Visitors, Cache Hit Rate, Avg Response Time
   - Charts: Articles per hour (24h bar chart), API requests per hour
   - Recent errors/warnings list
   - System health indicators: API (green/red), RSS Parser (green/red), Database (green/red)

2. **Sources Management** (`admin/sources/page.tsx`):
   - Table of all sources with status (active/down/disabled)
   - Toggle enable/disable per source
   - Last fetch time, articles fetched count
   - "Refresh Source" button per source
   - "Refresh All" button
   - Add new source form (URL, name, category)

3. **Cache Management** (`admin/cache/page.tsx`):
   - Current cache stats: entries, size, hit/miss ratio
   - "Clear Cache" button (POST to `/api/cache/clear`)
   - "Warm Cache" button (pre-fetch popular endpoints)
   - Cache entry list with TTL remaining

4. **Analytics** (`admin/analytics/page.tsx`):
   - Top endpoints by request count
   - Top search queries
   - Geographic distribution (if available)
   - Device/browser breakdown

### SHARED:
- `src/components/admin/AdminSidebar.tsx` — Admin navigation sidebar
- `src/components/admin/AdminLogin.tsx` — Simple login form
- `src/components/admin/StatsCard.tsx` — Metric card with trend indicator

### FILES TO CREATE:
- `src/app/[locale]/admin/layout.tsx`
- `src/app/[locale]/admin/page.tsx`
- `src/app/[locale]/admin/sources/page.tsx`
- `src/app/[locale]/admin/cache/page.tsx`
- `src/app/[locale]/admin/analytics/page.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminLogin.tsx`
- `src/components/admin/StatsCard.tsx`

After changes, run `bun run build` to verify. Commit: "feat: add admin dashboard with source management, cache control, and analytics"
```

---

## PROMPT 59 — Dark Mode Polish + Theme System Enhancement

```
You are polishing the visual design for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

DESIGN SYSTEM:
- `src/app/globals.css` — CSS theme with light/dark via `.dark` class
- `src/components/ThemeProvider.tsx` — ThemeScript + ThemeProvider + useTheme hook
- Light: --color-surface: #ffffff, --color-text-primary: #0f172a
- Dark: --color-surface: #0a0a0a, --color-text-primary: #f5f5f5

TASK: Deep polish of dark mode across every component and add theme system enhancements.

### 1. Dark Mode Audit — Check EVERY component for dark mode issues:
   - Search for hardcoded colors (hex values like `#fff`, `bg-white`, `text-black`, `bg-gray-*`, `text-gray-*`) that don't use CSS vars
   - Replace with CSS variable equivalents: `bg-[var(--color-surface)]`, `text-[var(--color-text-primary)]`, etc.
   - Check all files in `src/components/` and `src/app/[locale]/`
   - Common offenders: form inputs, tables, modals, dropdowns, cards, badges, tooltips

### 2. Tailwind Dark Variants — Where CSS vars aren't used, ensure proper `dark:` prefixes:
   - `bg-white dark:bg-neutral-900`
   - `text-gray-900 dark:text-gray-100`
   - `border-gray-200 dark:border-neutral-800`
   - `hover:bg-gray-100 dark:hover:bg-neutral-800`

### 3. Theme Transition — Add smooth transition when switching themes:
   In globals.css:
   ```css
   html.theme-transitioning,
   html.theme-transitioning *,
   html.theme-transitioning *::before,
   html.theme-transitioning *::after {
     transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
   }
   ```
   Update ThemeProvider to add/remove this class on theme change.

### 4. Additional Theme: "Midnight Blue" — Add a third theme option:
   ```css
   .midnight {
     --color-surface: #0d1117;
     --color-surface-secondary: #161b22;
     --color-surface-tertiary: #21262d;
     --color-border: #30363d;
     --color-text-primary: #c9d1d9;
     --color-text-secondary: #8b949e;
     --color-accent: #58a6ff;
   }
   ```
   Update ThemeProvider to support: light, dark, midnight, system.

### 5. Chart/Graph Dark Mode:
   - Ensure PriceChart, FearGreedGauge, MarketHeatmap all respect dark mode
   - Chart backgrounds should be transparent or use --color-surface
   - Chart text should use --color-text-secondary

### 6. Image Dark Mode:
   - Add subtle brightness reduction for images in dark mode:
   ```css
   .dark img:not([data-no-dark-filter]) {
     filter: brightness(0.9);
   }
   ```

### FILES TO MODIFY:
- `src/app/globals.css` (theme transition, midnight theme, image filter)
- `src/components/ThemeProvider.tsx` (midnight theme, transition class)
- Multiple components likely need hardcoded color fixes — audit and fix all

After changes, run `bun run build` to verify. Commit: "fix: comprehensive dark mode polish and add midnight theme"
```

---

## PROMPT 60 — Final Build Fix, Lint, & Production Readiness Verification

```
You are doing the FINAL integration and production readiness pass for cryptocurrency.cv — a crypto news aggregator built with Next.js 16, React 19, Tailwind CSS v4, TypeScript 5.9.

IMPORTANT RULES:
- Use `bun` to run scripts; Use `pnpm` for packages
- Always use background terminals (isBackground: true) and kill them after
- Commit and push as `nirholas` (email: 22895867+nirholas@users.noreply.github.com)

CONTEXT: 60 separate agents have been building different parts of the application. There will be integration issues. Your job is to make EVERYTHING work.

TASK: Fix ALL errors and verify production readiness.

### PHASE 1 — Build (fix until zero errors):
```bash
rm -rf .next
bun run build 2>&1 | tee /tmp/build-errors.log
```
- If errors: fix each one, re-run build, repeat until clean
- Common issues: missing imports, type mismatches, duplicate exports, JSX errors

### PHASE 2 — TypeScript (fix until zero errors):
```bash
bunx tsc --noEmit 2>&1 | tee /tmp/ts-errors.log
```
- Fix all type errors
- Add missing type annotations where needed
- Ensure all component props are properly typed

### PHASE 3 — Lint:
```bash
bun run lint 2>&1 | head -100
```
- Fix critical lint errors (unused vars, missing deps, a11y issues)
- Ignore style-only warnings

### PHASE 4 — Dead code removal:
```bash
bun run audit:unused 2>&1 | head -50
```
- Remove truly unused exports/files
- Don't remove things that are used dynamically

### PHASE 5 — Navigation Integrity:
- Verify ALL nav links in Header.tsx point to pages that exist
- Verify ALL Footer links point to pages/URLs that exist
- Check for orphaned pages (pages that exist but aren't linked from anywhere) — add nav links for them
- Check for 404 links (nav links pointing to pages that don't exist) — either create the page or remove the link

### PHASE 6 — Component Import Audit:
- Check all barrel exports (index.ts files in ui/, watchlist/, alerts/, portfolio/)
- Ensure every component imported in other files actually exists
- Check for circular dependencies

### PHASE 7 — Runtime check:
```bash
bun run dev &
sleep 10
curl -s http://localhost:3000 | head -20
curl -s http://localhost:3000/en/markets | head -5
curl -s http://localhost:3000/en/defi | head -5
```
Verify pages load without runtime errors.

### PHASE 8 — Package Audit:
```bash
pnpm ls --depth 0 | head -30
```
- Check for missing peer dependencies
- Ensure all required packages are installed

### APPROACH:
- Be systematic: one phase at a time
- Don't rewrite components — only fix errors and integration issues
- When two implementations conflict, keep the more complete one
- Document any significant decisions in commit message

After ALL errors are fixed:
```bash
bun run build
```
Must succeed with 0 errors.

Commit: "fix: final integration pass — all build/type/lint errors resolved, production ready"
```

---

## Summary Table (Prompts 41–60)

| # | Prompt | Pages/Components | Category |
|---|--------|-----------------|----------|
| 41 | AI Chat / Ask Page | ask page, AIChatInterface, MarkdownRenderer | Feature |
| 42 | Podcast & AI Anchor | podcast page, AudioPlayer | Feature |
| 43 | Airdrops Tracker | airdrops page, AirdropCards | Feature |
| 44 | Trading View & Charts | trading page, AdvancedChart, ChartAnalysis, OrderBook | Feature |
| 45 | Embeddable Widgets | widgets page, WidgetBuilder, 5 embed pages, embed.js | Feature |
| 46 | Browser Extension | 6 extension files rewritten | Extension |
| 47 | CLI Tool | cli/index.js rewritten | CLI |
| 48 | Mobile App Screens | 5 screens, 2 components | Mobile |
| 49 | Copilot Extension | extension.ts enhanced | Extension |
| 50 | Raycast Extension | 6 Raycast commands | Extension |
| 51 | SDK Polish (Py/TS/Go) | 3 SDK packages polished | SDK |
| 52 | ChatGPT + MCP Update | openapi.yaml, mcp/index.js | Integration |
| 53 | Postman & Examples | collection + example files | Docs |
| 54 | Notification System | NotificationCenter, notifications page, push lib | Feature |
| 55 | API Playground + Export | playground page, export page | Feature |
| 56 | Archive Explorer | archive page, ArchiveExplorer | Feature |
| 57 | Knowledge Graph | explore page, EntityRelationships | Feature |
| 58 | Admin Dashboard | 4 admin pages, 3 admin components | Admin |
| 59 | Dark Mode Polish | globals.css, ThemeProvider, component fixes | Polish |
| 60 | Final Build Fix | Fix everything, verify build | Critical |

**Parallel-safe groups:**
- Group A: 41, 42, 43, 44 (completely different pages)
- Group B: 46, 47, 48, 49, 50 (different platforms — extension, CLI, mobile, Copilot, Raycast)
- Group C: 51, 52, 53 (different artifacts — SDKs, plugins, docs)
- Group D: 54, 55, 56, 57 (different feature pages)
- Run 58 independently (admin pages, separate layout)
- Run 59 after most feature work (touches many components)
- **Run 60 LAST** — final integration fixer
