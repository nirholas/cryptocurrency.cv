# Section 8: Frontend & Website (Agents 38–42)

> These agents build the Crypto Vision marketing website, API documentation site, and public-facing features.

---

## Agent 38 — Marketing Website (Template-Based)

**Goal:** Build the Crypto Vision marketing website at `cryptocurrency.cv` using a high-quality template.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Context:**
- Use a well-made open-source template — DO NOT build from scratch
- Recommended base: `shadcn-ui/taxonomy` (Next.js starter), or `cruip/open-react-template`, or any modern SaaS landing template
- The website should look like CoinGecko/CoinMarketCap's marketing pages but cleaner

**Files to create:**

```
website/
  package.json
  tsconfig.json
  next.config.js
  tailwind.config.js
  README.md
  src/
    app/
      layout.tsx              (root layout with metadata)
      page.tsx                (homepage / hero)
      pricing/page.tsx        (pricing plans)
      features/page.tsx       (feature showcase)
      about/page.tsx          (about us)
      blog/page.tsx           (blog index)
      contact/page.tsx        (contact form)
      changelog/page.tsx      (changelog)
      terms/page.tsx          (terms of service)
      privacy/page.tsx        (privacy policy)
    components/
      layout/
        header.tsx            (navigation header)
        footer.tsx            (footer with links)
        mobile-nav.tsx        (mobile hamburger menu)
      hero/
        hero-section.tsx      (animated hero with live price data)
        code-example.tsx      (code preview showing API usage)
        stats-bar.tsx         (live stats: coins tracked, API calls/day, etc)
      features/
        feature-grid.tsx      (feature cards grid)
        api-showcase.tsx      (interactive API explorer preview)
        sdk-tabs.tsx          (SDK code examples with tabs)
        comparison-table.tsx  (vs CoinGecko/CoinMarketCap feature comparison)
      pricing/
        pricing-cards.tsx     (Free/Developer/Pro/Enterprise cards)
        pricing-faq.tsx       (pricing FAQ accordion)
        pricing-comparison.tsx (detailed feature comparison table)
      social-proof/
        github-stars.tsx      (GitHub stars counter)
        testimonials.tsx      (user testimonials)
        integrations.tsx      (integration logos grid)
        usage-stats.tsx       (live usage statistics)
      cta/
        cta-section.tsx       (call to action with email signup)
        newsletter.tsx        (newsletter signup)
    styles/
      globals.css
    lib/
      api.ts                  (fetch live data for marketing site)
```

**Requirements:**

1. **Homepage sections (scrolling landing page):**
   - **Hero:** "The Complete Cryptocurrency API" headline. Animated code snippet showing API call + response. Live BTC/ETH prices updating in real-time. "Get Free API Key" and "View Documentation" CTAs.
   - **Stats bar:** "10,000+ tokens | 500+ exchanges | 200+ DeFi protocols | 99.9% uptime"
   - **Feature grid:** 8 feature cards (Market Data, DeFi Analytics, On-Chain Data, News & Sentiment, Real-Time Streaming, Historical Data, AI/ML Ready, Open Source)
   - **Code examples:** Tabbed code viewer showing Python, TypeScript, Go, curl usage
   - **Comparison table:** Feature comparison vs CoinGecko and CoinMarketCap APIs
   - **Pricing preview:** 4 plan cards with "Start Free" CTA
   - **Integration logos:** Shows who uses Crypto Vision (or "Trusted by developers building...")
   - **CTA:** "Get your free API key in 30 seconds"

2. **Pricing page:**
   - 4-tier cards: Free ($0), Developer ($29/mo), Pro ($99/mo), Enterprise ($499+/mo)
   - Annual toggle (20% discount)
   - Feature comparison table (detailed)
   - FAQ accordion (10 questions)
   - "Start Free" buttons linking to dashboard registration

3. **Design:**
   - Dark mode by default (crypto aesthetic)
   - Brand colors: Deep blue (#0B1426) background, Electric blue (#3B82F6) accent, Gold (#F59E0B) for premium
   - Modern typography (Inter font)
   - Smooth scroll animations (Framer Motion)
   - Mobile-first responsive

4. **SEO:**
   - Full metadata on every page
   - JSON-LD structured data (Organization, Product, FAQ)
   - Open Graph images
   - Sitemap.xml
   - robots.txt

**Instructions:**
- Use Next.js 14+ App Router
- Use Tailwind CSS + shadcn/ui components
- Use Framer Motion for animations
- Fetch live data (BTC price, total coins, etc.) with ISR (revalidate: 60)
- The website is a SEPARATE Next.js app from the API — it lives in `website/`
- Do NOT touch files outside `website/`
- Commit message: `feat(website): add Crypto Vision marketing website`

---

## Agent 39 — API Documentation Site

**Goal:** Build a comprehensive API documentation site with interactive examples, similar to Stripe's docs.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
docs-site/
  package.json
  tsconfig.json
  next.config.js
  README.md
  src/
    app/
      layout.tsx
      page.tsx                (docs landing)
      getting-started/
        page.mdx              (quickstart guide)
        authentication/page.mdx
        rate-limits/page.mdx
        errors/page.mdx
        pagination/page.mdx
      api-reference/
        layout.tsx            (API ref layout with sidebar)
        coins/page.mdx
        exchanges/page.mdx
        simple/page.mdx
        defi/page.mdx
        news/page.mdx
        onchain/page.mdx
        derivatives/page.mdx
        social/page.mdx
        global/page.mdx
        search/page.mdx
        historical/page.mdx
        alerts/page.mdx
        websocket/page.mdx
      sdks/
        python/page.mdx
        typescript/page.mdx
        go/page.mdx
        react/page.mdx
      guides/
        migration-from-coingecko/page.mdx
        building-a-portfolio-tracker/page.mdx
        real-time-price-alerts/page.mdx
        defi-yield-dashboard/page.mdx
      changelog/page.mdx
    components/
      docs/
        sidebar.tsx           (docs navigation sidebar)
        api-playground.tsx    (interactive API tester)
        code-block.tsx        (syntax-highlighted code)
        endpoint-card.tsx     (endpoint documentation card)
        param-table.tsx       (parameter table)
        response-viewer.tsx   (formatted JSON response)
        language-tabs.tsx     (multi-language code examples)
        copy-button.tsx       (copy to clipboard)
        search.tsx            (docs search - Algolia or local)
```

**Requirements:**

1. **Interactive API playground:**
   - Select endpoint from dropdown
   - Fill in parameters via form
   - "Try it" button that makes real API call (using user's API key or demo key)
   - Show request (curl, Python, JS, Go) and formatted response
   - Show response time, status code, headers

2. **Each endpoint page includes:**
   - Endpoint URL + method
   - Description
   - Authentication requirements
   - Query/path parameters table (name, type, required, default, description)
   - Request example (curl + 4 SDK languages)
   - Response example (formatted JSON with field descriptions)
   - Rate limiting info (calls/minute by tier)
   - Error responses
   - Changelog (when endpoint was added/modified)

3. **Getting started guide:**
   - Step 1: Sign up for free API key
   - Step 2: Make your first request (curl)
   - Step 3: Install an SDK
   - Step 4: Build something (link to guides)
   - Under 5 minutes from sign up to first API call

4. **Migration guide from CoinGecko:**
   - Side-by-side endpoint mapping
   - Parameter name differences
   - Response format differences
   - Drop-in replacement instructions

5. **Search:** Full-text search across all docs (using Flexsearch or Algolia DocSearch)

**Instructions:**
- Use Next.js + MDX for documentation pages
- Use `next-mdx-remote` or `contentlayer` for MDX processing
- Use `shiki` for syntax highlighting
- Docs should be at `docs.cryptocurrency.cv`
- Auto-generate API reference from OpenAPI spec (Agent 36) where possible
- Do NOT touch files outside `docs-site/`
- Commit message: `feat(docs): add comprehensive API documentation site`

---

## Agent 40 — Public Coin Pages & Market Explorer

**Goal:** Build public-facing coin detail pages and market explorer — the "CoinGecko front-end" of Crypto Vision.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
website/src/app/
  coins/
    page.tsx                  (market overview / coin list)
    [coinId]/
      page.tsx                (coin detail page)
  exchanges/
    page.tsx                  (exchange list)
    [exchangeId]/page.tsx     (exchange detail)
  defi/
    page.tsx                  (DeFi overview)
  nft/
    page.tsx                  (NFT overview)
  gas/
    page.tsx                  (gas tracker)
  fear-greed/
    page.tsx                  (fear & greed dashboard)
website/src/components/
  market/
    coin-table.tsx            (sortable paginated coin table)
    coin-header.tsx           (coin name, logo, rank, links)
    price-chart.tsx           (interactive TradingView-style chart)
    market-stats.tsx          (market cap, volume, supply stats)
    coin-converter.tsx        (coin to fiat converter)
    coin-markets.tsx          (exchanges trading this coin)
    price-change-badges.tsx   (1h, 24h, 7d change badges)
    coin-info.tsx             (description, links, categories)
    similar-coins.tsx         (related coins section)
    exchange-table.tsx        (exchange listing table)
    gas-tracker.tsx           (live gas prices display)
    fear-greed-chart.tsx      (F&G historical chart)
```

**Requirements:**

1. **Coin list page (`/coins`):**
   - Table with: #, Coin (logo + name + symbol), Price, 1h%, 24h%, 7d%, 24h Volume, Market Cap, 7d Sparkline
   - Pagination: 100 per page
   - Filters: category, chain, price range
   - Sort by any column
   - Search bar at top
   - Tab navigation: Cryptocurrencies, DeFi, NFT, Gaming, Stablecoins
   - ISR: revalidate every 60s

2. **Coin detail page (`/coins/bitcoin`):**
   - Header: Logo, Name, Symbol, Rank badge, current price (large), 24h change
   - Interactive chart: TradingView lightweight-charts, timeframes (1D/1W/1M/3M/1Y/All)
   - Market stats: Market Cap, FDV, Volume, Circulating Supply, Max Supply, ATH, ATL
   - Converter: BTC ↔ USD input fields
   - Markets tab: exchanges trading this coin with price, volume, spread
   - Info tab: description, website, explorer, whitepaper, social links, categories
   - Similar coins section
   - SEO: Dynamic metadata (`<title>Bitcoin (BTC) Price, Chart, Market Cap | Crypto Vision</title>`)
   - OG image: auto-generated with price chart

3. **Exchange list page:**
   - Table: #, Exchange (logo + name), Trust Score, 24h Volume (BTC), Country, Established
   - Filter: centralized/decentralized
   - Sort by volume, trust score

4. **Gas tracker page:**
   - Live Ethereum gas prices (slow/standard/fast)
   - Gas price chart (24h/7d)
   - Estimated costs for common operations (transfer, swap, NFT mint)
   - Multi-chain: ETH, Polygon, Arbitrum, Base, BSC

5. **Fear & Greed page:**
   - Large gauge (current value + label)
   - Historical chart (30d, 90d, 1y)
   - Correlation with BTC price overlay

**Instructions:**
- These pages are PART of the `website/` Next.js app (Agent 38)
- Use ISR (Incremental Static Regeneration) for SEO + freshness
- TradingView `lightweight-charts` for price charts
- Mobile-responsive tables (horizontal scroll on small screens)
- Dark mode default
- Do NOT touch files outside `website/src/app/coins/`, `website/src/app/exchanges/`, `website/src/app/defi/`, `website/src/app/nft/`, `website/src/app/gas/`, `website/src/app/fear-greed/`, and `website/src/components/market/`
- Commit message: `feat(website): add public coin pages, exchange list, and market explorer`

---

## Agent 41 — GraphQL API Layer

**Goal:** Build a GraphQL API layer on top of the REST endpoints for clients that prefer GraphQL.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/graphql/
  schema.ts                  (root schema composition)
  context.ts                 (request context with auth)
  scalars.ts                 (custom scalars: DateTime, BigInt, JSON)
  types/
    coin.ts                  (Coin type + resolvers)
    exchange.ts              (Exchange type + resolvers)
    defi.ts                  (DeFi types + resolvers)
    news.ts                  (News types + resolvers)
    onchain.ts               (OnChain types + resolvers)
    derivatives.ts           (Derivatives types + resolvers)
    social.ts                (Social types + resolvers)
    market.ts                (Global market types)
    user.ts                  (User/API key types — authenticated)
  queries/
    coins.ts                 (coin queries)
    market.ts                (market queries)
    defi.ts                  (defi queries)
    news.ts                  (news queries)
  subscriptions/
    prices.ts                (real-time price subscriptions)
    news.ts                  (breaking news subscriptions)
  dataloaders/
    coin-loader.ts           (DataLoader for batch coin lookups)
    exchange-loader.ts       (DataLoader for exchanges)
src/app/api/graphql/
  route.ts                   (GraphQL HTTP endpoint)
```

**Requirements:**

1. **Schema (key types):**
```graphql
type Query {
  coin(id: ID!): Coin
  coins(page: Int, perPage: Int, order: CoinOrder): CoinConnection!
  coinPrice(id: ID!, vsCurrency: String!): Price!
  search(query: String!): SearchResult!
  global: GlobalMarket!
  trending: [TrendingCoin!]!
  news(category: String, limit: Int): [Article!]!
  defiProtocols(chain: String, category: String): [DefiProtocol!]!
  fearGreed: FearGreed!
}

type Subscription {
  priceUpdate(coinIds: [ID!]!): PriceUpdate!
  breakingNews: Article!
}

type Coin {
  id: ID!
  symbol: String!
  name: String!
  image: String
  currentPrice(vsCurrency: String = "usd"): Float
  marketCap: BigInt
  marketCapRank: Int
  priceChange24h: Float
  priceChangePercentage24h: Float
  volume24h: BigInt
  sparkline7d: [Float!]
  tickers(exchange: String, limit: Int): [Ticker!]!
  ohlcv(days: Int!, interval: String): [OHLCV!]!
  news(limit: Int): [Article!]!
  socialMetrics: SocialMetrics
  onchainMetrics: OnchainMetrics
}
```

2. **DataLoaders:** Batch coin lookups (N+1 prevention). Cache per-request.

3. **Subscriptions:** WebSocket-based (graphql-ws protocol). Subscribe to price updates and breaking news.

4. **Complexity limiting:** Max query depth: 5. Max complexity: 1000. Introspection disabled in production.

5. **Playground:** GraphiQL or Apollo Sandbox at `/api/graphql` in development.

**Instructions:**
- Use `graphql-yoga` v5+ (lightweight, works with Next.js App Router)
- Use `graphql-scalars` for custom scalars
- Use `dataloader` for batch loading
- GraphQL endpoint: `/api/graphql` (same API, different protocol)
- Auth: same API key auth as REST (`X-API-Key` header)
- Do NOT touch files outside `src/graphql/` and `src/app/api/graphql/`
- Commit message: `feat(graphql): add GraphQL API layer with subscriptions`

---

## Agent 42 — Remaining SDK Stubs (PHP, Ruby, Rust, Swift, Java, Kotlin, C#, R)

**Goal:** Create SDK stubs for all remaining languages with README, basic client, and package config.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create (for EACH language):**

```
sdk/php/
  composer.json
  README.md
  src/CryptoVision/Client.php
  src/CryptoVision/Endpoints/Coins.php
  src/CryptoVision/Endpoints/Simple.php
  tests/ClientTest.php

sdk/ruby/
  crypto_vision.gemspec
  README.md
  lib/crypto_vision.rb
  lib/crypto_vision/client.rb
  lib/crypto_vision/endpoints/coins.rb
  spec/client_spec.rb

sdk/rust/
  Cargo.toml
  README.md
  src/lib.rs
  src/client.rs
  src/endpoints/coins.rs
  src/endpoints/mod.rs
  src/types.rs
  src/error.rs

sdk/swift/
  Package.swift
  README.md
  Sources/CryptoVision/Client.swift
  Sources/CryptoVision/Endpoints/Coins.swift
  Sources/CryptoVision/Models/Coin.swift
  Tests/CryptoVisionTests/ClientTests.swift

sdk/java/
  pom.xml
  README.md
  src/main/java/cv/cryptovision/CryptoVisionClient.java
  src/main/java/cv/cryptovision/endpoints/CoinsEndpoint.java
  src/main/java/cv/cryptovision/models/Coin.java
  src/test/java/cv/cryptovision/ClientTest.java

sdk/kotlin/
  build.gradle.kts
  README.md
  src/main/kotlin/cv/cryptovision/CryptoVisionClient.kt
  src/main/kotlin/cv/cryptovision/endpoints/Coins.kt
  src/main/kotlin/cv/cryptovision/models/Coin.kt
  src/test/kotlin/cv/cryptovision/ClientTest.kt

sdk/csharp/
  CryptoVision.csproj
  README.md
  src/CryptoVisionClient.cs
  src/Endpoints/CoinsEndpoint.cs
  src/Models/Coin.cs
  tests/ClientTests.cs

sdk/r/
  DESCRIPTION
  README.md
  R/client.R
  R/coins.R
  man/crypto_vision.Rd
  tests/testthat/test-client.R
```

**Requirements per SDK:**
1. Basic client class with API key auth and base URL config
2. At least `coins.list()`, `coins.get(id)`, `simple.price(ids, vs_currencies)` implemented
3. Error handling (401, 429, 404, 500)
4. README with install + usage examples
5. Package manager config (composer.json, gemspec, Cargo.toml, Package.swift, pom.xml, build.gradle.kts, .csproj, DESCRIPTION)
6. One test file with basic client test
7. Consistent naming: package name `crypto-vision` or `crypto_vision` as per language conventions

**Instructions:**
- Each SDK should be immediately installable from its package manager
- Follow idiomatic patterns for each language
- Include API base URL: `https://api.cryptocurrency.cv/api/v1`
- Do NOT touch files outside `sdk/`
- Commit message: `feat(sdk): add PHP, Ruby, Rust, Swift, Java, Kotlin, C#, and R SDK stubs`
