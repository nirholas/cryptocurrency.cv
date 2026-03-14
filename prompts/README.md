# Scaling & Expansion Prompts

Actionable prompts designed to be fed to AI coding agents (Claude, Copilot, Codex) to execute multi-step engineering work on the free-crypto-news codebase.

Prompts are organized into priority folders. Completed work is archived.

## High Priority (`high-priority/`)

Critical path — everything else depends on this.

| #   | Prompt                                                                                                                  | Goal                                                                                            | Difficulty |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| 1   | [01-migrate-direct-apis-to-provider-framework.md](./high-priority/01-migrate-direct-apis-to-provider-framework.md)      | Wire all 366 API routes through ProviderChain with circuit breakers, caching, anomaly detection | Hard       |
| 59  | [59-fix-csp-inline-script-violation.md](./high-priority/59-fix-csp-inline-script-violation.md)                          | Fix CSP nonce propagation so inline scripts aren't blocked in production                        | Medium     |
| 60  | [60-fix-server-components-render-error.md](./high-priority/60-fix-server-components-render-error.md)                    | Diagnose and fix production Server Components render error with recursive stack trace           | Hard       |

## Medium Priority (`medium-priority/`)

### Infrastructure & Scale

| #   | Prompt                                                                                                 | Goal                                                                                                | Difficulty |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------- |
| 2   | [02-postgresql-migration.md](./medium-priority/02-postgresql-migration.md)                             | Move from file/Redis to PostgreSQL (Neon/Supabase) for structured data, full-text search, analytics | Medium     |
| 3   | [03-background-job-queue.md](./medium-priority/03-background-job-queue.md)                             | Replace Vercel cron with Inngest/Trigger.dev for retries, fan-out, dead-letter queues               | Medium     |
| 4   | [04-websocket-horizontal-scaling.md](./medium-priority/04-websocket-horizontal-scaling.md)             | Scale ws-server.js to 100K+ concurrent connections with Redis pub/sub + sharding                    | Medium     |

### Code Quality & Engineering

| #   | Prompt                                                                                             | Goal                                                                               | Difficulty |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| 36  | [36-unit-test-coverage-lib.md](./medium-priority/36-unit-test-coverage-lib.md)                     | Increase lib/ unit test coverage to meaningful thresholds                           | Medium     |
| 38  | [38-reduce-force-dynamic.md](./medium-priority/38-reduce-force-dynamic.md)                         | Convert remaining force-dynamic routes to ISR where possible                       | Medium     |
| 43  | [43-knip-dead-code-tighten.md](./medium-priority/43-knip-dead-code-tighten.md)                     | Tighten knip config to remove dead code ignore patterns                            | Medium     |
| 44  | [44-api-versioning.md](./medium-priority/44-api-versioning.md)                                     | Complete API v1 versioning with backward-compat redirects                          | Medium     |
| 46  | [46-websocket-resilience.md](./medium-priority/46-websocket-resilience.md)                         | Harden WebSocket server with health endpoints, structured shutdown, monitoring     | Medium     |

### Production Bug Fixes

| #   | Prompt                                                                                             | Goal                                                                               | Difficulty |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| 61  | [61-create-more-page-bottomnav-404.md](./medium-priority/61-create-more-page-bottomnav-404.md)     | Create missing `/more` page that BottomNav links to (currently 404)                | Easy       |
| 62  | [62-investigate-excessive-rsc-fetch-requests.md](./medium-priority/62-investigate-excessive-rsc-fetch-requests.md) | Diagnose and reduce excessive RSC fetch requests flooding the browser console | Medium     |

### Distribution & Growth

| #   | Prompt                                                                                             | Goal                                                                   | Difficulty |
| --- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- |
| 15  | [15-awesome-lists-prs.md](./medium-priority/15-awesome-lists-prs.md)                               | Submit PRs to 15+ GitHub "Awesome" lists (600k+ combined stars)        | Easy       |
| 16  | [16-api-directories.md](./medium-priority/16-api-directories.md)                                   | Submit to RapidAPI, Postman, APIs.guru & 10+ API directories           | Easy       |
| 17  | [17-ai-mcp-llm-directories.md](./medium-priority/17-ai-mcp-llm-directories.md)                    | Submit to MCP.so, Smithery, GPT Store & 10+ AI directories             | Easy       |
| 18  | [18-product-launches.md](./medium-priority/18-product-launches.md)                                 | Launch on Product Hunt, Hacker News, DevHunt, Indie Hackers            | Easy       |
| 19  | [19-community-posts.md](./medium-priority/19-community-posts.md)                                   | Post to 18 subreddits + Dev.to, Hashnode, Medium, Lobsters             | Easy       |
| 20  | [20-package-registries.md](./medium-priority/20-package-registries.md)                             | Publish SDKs to npm, PyPI, Go, Docker Hub, crates.io & more            | Medium     |
| 21  | [21-extension-app-stores.md](./medium-priority/21-extension-app-stores.md)                         | Submit to Chrome, Firefox, Edge, VS Code, Raycast, Homebrew            | Medium     |
| 22  | [22-self-hosting-templates.md](./medium-priority/22-self-hosting-templates.md)                     | Create one-click deploy templates for Railway, Vercel, Render & more   | Medium     |
| 23  | [23-data-research-platforms.md](./medium-priority/23-data-research-platforms.md)                    | Upload datasets to Kaggle, Hugging Face, Zenodo, Google Dataset Search | Easy       |
| 24  | [24-rss-newsletters-seo.md](./medium-priority/24-rss-newsletters-seo.md)                           | Submit to Feedly, Feedspot, AlternativeTo, TLDR & 20+ directories      | Easy       |
| 25  | [25-content-creation.md](./medium-priority/25-content-creation.md)                                 | Write articles/tutorials for Dev.to, Hashnode, Medium, freeCodeCamp    | Medium     |

## Low Priority (`low-priority/`)

### Incomplete Features

| #   | Prompt                                                                                                               | Goal                                                                              | Difficulty |
| --- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| 26  | [26-pro-tier-stripe-billing.md](./low-priority/26-pro-tier-stripe-billing.md)                                        | Implement Stripe billing, subscription management, feature gating for Pro tier    | Hard       |
| 27  | [27-email-notification-system.md](./low-priority/27-email-notification-system.md)                                    | Wire up Resend/SendGrid email delivery, notification preferences, digest emails   | Medium     |
| 28  | [28-blog-content-cms.md](./low-priority/28-blog-content-cms.md)                                                      | Fix blog page to render 12 existing markdown posts, add pagination & SEO          | Easy       |
| 29  | [29-webhooks-realtime-alerts.md](./low-priority/29-webhooks-realtime-alerts.md)                                      | Build webhook registration, delivery with retries, HMAC signing, management UI    | Hard       |
| 30  | [30-redis-job-queue-adapter.md](./low-priority/30-redis-job-queue-adapter.md)                                        | Replace in-memory job queue with Redis-backed adapter using BullMQ                | Medium     |
| 31  | [31-mobile-app-completion.md](./low-priority/31-mobile-app-completion.md)                                            | Complete React Native app: real chart, push notifications, app store submission   | Hard       |
| 32  | [32-onchain-data-integration.md](./low-priority/32-onchain-data-integration.md)                                      | Wire live on-chain data (Etherscan, Alchemy, Blockchair) into existing API routes | Medium     |
| 33  | [33-translation-feature-flag-removal.md](./low-priority/33-translation-feature-flag-removal.md)                      | Remove FEATURE_TRANSLATION gate, enable real-time translation by default          | Easy       |
| 34  | [34-php-sdk-composer-package.md](./low-priority/34-php-sdk-composer-package.md)                                      | Publish PHP SDK to Packagist with CI, tests, and version tagging                  | Easy       |
| 35  | [35-telegram-bot-missing-handlers.md](./low-priority/35-telegram-bot-missing-handlers.md)                            | Implement all "coming soon" callback handlers in Telegram bot                     | Easy       |

### Competitive Parity

| #   | Prompt                                                                                                       | Goal                                                                                      | Difficulty |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------- |
| 47  | [47-videos-hub.md](./low-priority/47-videos-hub.md)                                                          | Aggregate crypto YouTube content into a branded video hub with embeds and filters          | Medium     |
| 48  | [48-newsletters-hub.md](./low-priority/48-newsletters-hub.md)                                                | Build newsletters landing page with 5 named newsletters and per-newsletter subscribe      | Medium     |
| 49  | [49-opinion-editorial-section.md](./low-priority/49-opinion-editorial-section.md)                            | Create dedicated opinion section with auto-detection and clear labeling                   | Medium     |
| 50  | [50-author-pages.md](./low-priority/50-author-pages.md)                                                      | Build author directory and per-author article pages with cross-source aggregation         | Medium     |
| 51  | [51-tag-pages.md](./low-priority/51-tag-pages.md)                                                            | Create tag system with tag cloud, trending tags, and per-tag article listings             | Medium     |
| 52  | [52-crypto-glossary.md](./low-priority/52-crypto-glossary.md)                                                | Build 150+ term crypto glossary with search, tooltips, and per-term SEO pages             | Medium     |
| 53  | [53-educational-guides.md](./low-priority/53-educational-guides.md)                                          | Create 12 beginner guide series with 60+ educational articles and progress tracking       | Hard       |
| 54  | [54-advertise-sponsorship-page.md](./low-priority/54-advertise-sponsorship-page.md)                          | Build advertising info page with audience stats and sponsorship options                    | Easy       |
| 55  | [55-ethics-editorial-policy.md](./low-priority/55-ethics-editorial-policy.md)                                | Publish editorial policy covering source selection, AI disclosure, and conflicts           | Easy       |
| 56  | [56-masthead-team-page.md](./low-priority/56-masthead-team-page.md)                                          | Create team page with bios, GitHub contributors integration, and join-us CTA              | Easy       |
| 57  | [57-press-release-submission.md](./low-priority/57-press-release-submission.md)                              | Build self-serve PR submission system with form, review workflow, and listing page         | Hard       |
| 58  | [58-news-verticals.md](./low-priority/58-news-verticals.md)                                                  | Split news into Business, Tech, Web3, DeFi verticals with auto-classification             | Medium     |

### PWA & UX Polish

| #   | Prompt                                                                                                       | Goal                                                                                      | Difficulty |
| --- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------- |
| 63  | [63-fix-pwa-install-banner-suppression.md](./low-priority/63-fix-pwa-install-banner-suppression.md)          | Fix PWA install prompt — currently captured but never shown to users                      | Easy       |

## Archived — Completed (`archive/`)

These prompts have been implemented and verified in the codebase.

| #    | Prompt                                       | What was delivered                                                        |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------- |
| —    | 01-remove-content-farm-sources               | Tier4/fintech sources removed, OPML cleaned                              |
| —    | 02-add-quality-filter-to-api                 | `quality` query param with `all/high/premium` + tier filtering            |
| —    | 03-expose-tier-metadata-in-responses         | `tier`, `credibility`, `reputation` fields on NewsArticle                 |
| —    | 04-update-docs-opml-proxy                    | Docs & OPML updated after source removal                                 |
| —    | 05-update-tests                              | Tests updated for new tiers & quality param                               |
| 5    | 05-observability-stack                       | OpenTelemetry + Prometheus + Grafana dashboards                           |
| 6    | 06-load-testing-chaos-engineering            | K6 scripts (baseline, spike, ws-scale) + chaos scripts                   |
| 7    | 07-derivatives-adapters                      | 8 adapters (Binance, Bybit, Coinglass, dYdX, Hyperliquid, OKX…)         |
| 8    | 08-defi-adapters                             | 11 adapters (Aave, DefiLlama, EigenLayer, L2Beat, Lido…)                |
| 9    | 09-onchain-adapters                          | 12 adapters (Arkham, CryptoQuant, Dune, Etherscan, Glassnode…)          |
| 10   | 10-social-sentiment-adapters                 | 7 adapters (CryptoPanic, Farcaster, LunarCrush, Reddit, Santiment)      |
| 11   | 11-nft-gaming-adapters                       | NFT (OpenSea, Reservoir, SimpleHash) + Gaming (DappRadar, PlayToEarn)    |
| 12   | 12-macro-tradfi-adapters                     | Macro adapters (Alpha Vantage, FRED, Yahoo Finance, Twelve Data)         |
| 13   | 13-cex-exchange-adapters                     | Order book adapters (Binance, Coinbase, Kraken, OKX, Bybit)             |
| 14   | 14-stablecoin-flow-adapters                  | 6 adapters (Artemis, CryptoQuant, DefiLlama, Dune, Glassnode)           |
| —    | 37-middleware-refactor                       | Thin `compose()` orchestrator + 19 middleware modules + 12 test files    |
| —    | 39-prettier-setup                            | .prettierrc + .prettierignore + format scripts + quality gate            |
| —    | 40-structured-logging                        | Pino logger with JSON (prod) / pino-pretty (dev) across 10+ routes      |
| —    | 41-database-migration-strategy               | DATABASE-MIGRATIONS.md + 3 Drizzle migrations + rollback strategy        |
| —    | 42-coverage-ratchet                          | coverage-ratchet.sh + quality gate integration                           |
| —    | 45-translation-staleness                     | translation-freshness.js + i18n:freshness scripts + quality gate         |
| —    | build-agents                                 | Agent prompt catalog (delivered as-is)                                    |
| —    | build-agents-3                               | Agent prompt catalog continuation (delivered as-is)                       |
| —    | sperax-api-consumer                          | Sperax reference doc + SperaxOS support in middleware                     |
| —    | DISTRIBUTION                                 | Distribution prompt index (delivered as-is)                               |

## How to Use

1. Pick a prompt from the priority folder that matches your focus
2. Copy the entire contents of the prompt file
3. Paste it into your AI agent of choice (Claude, Copilot Chat, Codex)
4. The agent will execute the multi-step engineering work described
5. Review the changes, run tests, commit
6. Move the completed prompt to `archive/`

Each prompt is self-contained with:

- Exact files to create/modify
- API documentation for external services
- TypeScript interfaces to implement
- Test cases to write
- Environment variables to add

## Summary

| Folder            | Count | Status                  |
| ----------------- | ----- | ----------------------- |
| `high-priority/`  | 3     | Critical path           |
| `medium-priority/` | 18   | Infrastructure + Growth |
| `low-priority/`   | 23    | Features + Parity       |
| `archive/`        | 25    | Done                    |
