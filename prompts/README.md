# Scaling & Expansion Prompts

Actionable prompts designed to be fed to AI coding agents (Claude, Copilot, Codex) to execute multi-step engineering work on the free-crypto-news codebase.

## Prompts

### Infrastructure & Scale (prepare for 1M+ users)

| # | Prompt | Goal | Difficulty |
|---|--------|------|------------|
| 1 | [01-migrate-direct-apis-to-provider-framework.md](./01-migrate-direct-apis-to-provider-framework.md) | Wire all 366 API routes through ProviderChain with circuit breakers, caching, anomaly detection | Hard |
| 2 | [02-postgresql-migration.md](./02-postgresql-migration.md) | Move from file/Redis to PostgreSQL (Neon/Supabase) for structured data, full-text search, analytics | Medium |
| 3 | [03-background-job-queue.md](./03-background-job-queue.md) | Replace Vercel cron with Inngest/Trigger.dev for retries, fan-out, dead-letter queues | Medium |
| 4 | [04-websocket-horizontal-scaling.md](./04-websocket-horizontal-scaling.md) | Scale ws-server.js to 100K+ concurrent connections with Redis pub/sub + sharding | Medium |
| 5 | [05-observability-stack.md](./05-observability-stack.md) | Wire OpenTelemetry traces + Prometheus metrics + Grafana dashboards for every request | Medium |
| 6 | [06-load-testing-chaos-engineering.md](./06-load-testing-chaos-engineering.md) | k6 soak tests, breaking-news spike simulation, upstream failure injection | Medium |

### Data Source Expansion (surpass CoinGecko / DefiLlama)

| # | Prompt | New Sources | Auth Required? |
|---|--------|-------------|----------------|
| 7 | [07-derivatives-adapters.md](./07-derivatives-adapters.md) | Bybit, OKX, dYdX, Hyperliquid, GMX — funding rates, open interest, liquidations | Some (API keys) |
| 8 | [08-defi-adapters.md](./08-defi-adapters.md) | DefiLlama, Aave, Compound, Lido, EigenLayer — TVL, yields, staking, restaking | No |
| 9 | [09-onchain-adapters.md](./09-onchain-adapters.md) | Etherscan, Blockchair, Mempool.space, Dune, Nansen — gas, whale alerts, mempool, analytics | Some (API keys) |
| 10 | [10-social-sentiment-adapters.md](./10-social-sentiment-adapters.md) | LunarCrush, Santiment, CryptoPanic, Reddit, Farcaster — social volume, sentiment scoring | API keys |
| 11 | [11-nft-gaming-adapters.md](./11-nft-gaming-adapters.md) | OpenSea, Reservoir, DappRadar — NFT floors, volume, gaming DAU | API keys |
| 12 | [12-macro-tradfi-adapters.md](./12-macro-tradfi-adapters.md) | FRED, Yahoo Finance, TradingView, DXY, 10Y yield — macro context that moves crypto | Some |
| 13 | [13-cex-exchange-adapters.md](./13-cex-exchange-adapters.md) | Coinbase, Kraken, KuCoin, MEXC, Gate.io — order books, volumes, listings | API keys |
| 14 | [14-stablecoin-flow-adapters.md](./14-stablecoin-flow-adapters.md) | Glassnode, CryptoQuant, Artemis — USDT/USDC supply, bridge flows, exchange reserves | API keys |

### Distribution & Growth (get discovered)

| # | Prompt | Goal | Difficulty |
|---|--------|------|------------|
| 15 | [15-awesome-lists-prs.md](./15-awesome-lists-prs.md) | Submit PRs to 15+ GitHub "Awesome" lists (600k+ combined stars) | Easy |
| 16 | [16-api-directories.md](./16-api-directories.md) | Submit to RapidAPI, Postman, APIs.guru & 10+ API directories | Easy |
| 17 | [17-ai-mcp-llm-directories.md](./17-ai-mcp-llm-directories.md) | Submit to MCP.so, Smithery, GPT Store & 10+ AI directories | Easy |
| 18 | [18-product-launches.md](./18-product-launches.md) | Launch on Product Hunt, Hacker News, DevHunt, Indie Hackers | Easy |
| 19 | [19-community-posts.md](./19-community-posts.md) | Post to 18 subreddits + Dev.to, Hashnode, Medium, Lobsters | Easy |
| 20 | [20-package-registries.md](./20-package-registries.md) | Publish SDKs to npm, PyPI, Go, Docker Hub, crates.io & more | Medium |
| 21 | [21-extension-app-stores.md](./21-extension-app-stores.md) | Submit to Chrome, Firefox, Edge, VS Code, Raycast, Homebrew | Medium |
| 22 | [22-self-hosting-templates.md](./22-self-hosting-templates.md) | Create one-click deploy templates for Railway, Vercel, Render & more | Medium |
| 23 | [23-data-research-platforms.md](./23-data-research-platforms.md) | Upload datasets to Kaggle, Hugging Face, Zenodo, Google Dataset Search | Easy |
| 24 | [24-rss-newsletters-seo.md](./24-rss-newsletters-seo.md) | Submit to Feedly, Feedspot, AlternativeTo, TLDR & 20+ directories | Easy |
| 25 | [25-content-creation.md](./25-content-creation.md) | Write articles/tutorials for Dev.to, Hashnode, Medium, freeCodeCamp | Medium |

### Incomplete Features (finish what's started)

| # | Prompt | Goal | Difficulty |
|---|--------|------|------------|
| 26 | [26-pro-tier-stripe-billing.md](./26-pro-tier-stripe-billing.md) | Implement Stripe billing, subscription management, feature gating for Pro tier | Hard |
| 27 | [27-email-notification-system.md](./27-email-notification-system.md) | Wire up Resend/SendGrid email delivery, notification preferences, digest emails | Medium |
| 28 | [28-blog-content-cms.md](./28-blog-content-cms.md) | Fix blog page to render 12 existing markdown posts, add pagination & SEO | Easy |
| 29 | [29-webhooks-realtime-alerts.md](./29-webhooks-realtime-alerts.md) | Build webhook registration, delivery with retries, HMAC signing, management UI | Hard |
| 30 | [30-redis-job-queue-adapter.md](./30-redis-job-queue-adapter.md) | Replace in-memory job queue with Redis-backed adapter using BullMQ | Medium |
| 31 | [31-mobile-app-completion.md](./31-mobile-app-completion.md) | Complete React Native app: real chart, push notifications, app store submission | Hard |
| 32 | [32-onchain-data-integration.md](./32-onchain-data-integration.md) | Wire live on-chain data (Etherscan, Alchemy, Blockchair) into existing API routes | Medium |
| 33 | [33-translation-feature-flag-removal.md](./33-translation-feature-flag-removal.md) | Remove FEATURE_TRANSLATION gate, enable real-time translation by default | Easy |
| 34 | [34-php-sdk-composer-package.md](./34-php-sdk-composer-package.md) | Publish PHP SDK to Packagist with CI, tests, and version tagging | Easy |
| 35 | [35-telegram-bot-missing-handlers.md](./35-telegram-bot-missing-handlers.md) | Implement all "coming soon" callback handlers in Telegram bot | Easy |

## How to Use

1. Copy the entire contents of a prompt file
2. Paste it into your AI agent of choice (Claude, Copilot Chat, Codex)
3. The agent will execute the multi-step engineering work described
4. Review the changes, run tests, commit

Each prompt is self-contained with:
- Exact files to create/modify
- API documentation for external services
- TypeScript interfaces to implement
- Test cases to write
- Environment variables to add

## Priority Order

**Phase 1 — Foundation (Week 1-2)**
- Prompt 01 (Provider framework migration) — everything else builds on this
- Prompt 05 (Observability) — you need to see what's happening before you scale

**Phase 2 — Data Moat (Week 2-4)**
- Prompts 07-10 (Derivatives, DeFi, On-chain, Social) — highest user value
- Prompt 14 (Stablecoin flows) — unique signal most competitors miss

**Phase 3 — Scale (Week 3-5)**
- Prompt 02 (PostgreSQL) — structured storage for all the new data
- Prompt 03 (Background jobs) — handle enrichment/archival at scale
- Prompt 04 (WebSocket scaling) — real-time at 100K+ connections

**Phase 4 — Breadth (Week 4-6)**
- Prompts 11-13 (NFT, Macro, CEX) — full market coverage
- Prompt 06 (Load testing) — validate everything under pressure

**Phase 5 — Distribution (Week 5-7)**
- Prompts 15-19 (Awesome lists, directories, launches) — get discovered
- Prompts 20-25 (Registries, stores, content) — long-tail growth

**Phase 6 — Complete Features (Week 6-8)**
- Prompt 28 (Blog) + 33 (Translation) + 34 (PHP SDK) + 35 (Telegram) — quick wins
- Prompt 26 (Pro tier) + 27 (Email) + 29 (Webhooks) — monetization
- Prompt 30 (Redis queue) + 32 (On-chain) + 31 (Mobile) — infrastructure
