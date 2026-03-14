# Section 9: Testing, Docs & Quality (Agents 43–47)

> These agents build the test suite, documentation, data quality tools, and community infrastructure.

---

## Agent 43 — Comprehensive Test Suite

**Goal:** Build a complete testing infrastructure covering unit tests, integration tests, API tests, and load tests.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/__tests__/
  unit/
    services/
      coins.test.ts
      exchanges.test.ts
      defi.test.ts
      news.test.ts
      onchain.test.ts
      derivatives.test.ts
    api-keys/
      generate.test.ts
      validate.test.ts
      rate-limit.test.ts
    auth/
      session.test.ts
      password.test.ts
    cache/
      strategies.test.ts
      invalidation.test.ts
    billing/
      plans.test.ts
      usage.test.ts
    workers/
      aggregator.test.ts
      ohlcv-builder.test.ts
      circuit-breaker.test.ts
  integration/
    api/
      coins.integration.test.ts
      exchanges.integration.test.ts
      simple.integration.test.ts
      defi.integration.test.ts
      news.integration.test.ts
      auth.integration.test.ts
      keys.integration.test.ts
    db/
      schema.integration.test.ts
      migrations.integration.test.ts
    cache/
      redis.integration.test.ts
    websocket/
      connection.integration.test.ts
      streaming.integration.test.ts
  load/
    k6/
      baseline.js             (k6 load test: baseline performance)
      spike.js                (k6 spike test)
      stress.js               (k6 stress test)
      soak.js                 (k6 soak test)
    artillery/
      config.yml              (Artillery config)
      scenarios/
        simple-price.yml
        market-data.yml
        mixed-traffic.yml
  fixtures/
    coins.json                (mock coin data)
    exchanges.json            (mock exchange data)
    news.json                 (mock news articles)
    prices.json               (mock price data)
  helpers/
    setup.ts                  (test setup utilities)
    db.ts                     (test database setup/teardown)
    mocks.ts                  (shared mocks)
    factories.ts              (test data factories)
vitest.config.ts
```

**Requirements:**

1. **Unit tests (target: 80% coverage):**
   - Test all service layer functions in isolation
   - Mock database and Redis calls
   - Test API key generation, validation, rate limiting logic
   - Test OHLCV aggregation logic (1m → 1h → 1d rollup)
   - Test circuit breaker state transitions
   - Test cache strategies (cache-aside, write-through)
   - Test auth: JWT creation/verification, password hashing, token rotation
   - Test billing: plan validation, usage calculation, overage detection

2. **Integration tests:**
   - Test actual API routes with mock HTTP requests (using `next/test-utils` or `supertest`)
   - Test database operations with a test database (use `docker-compose.test.yml`)
   - Test Redis caching with test Redis instance
   - Test WebSocket connections and message flow
   - API response format validation against OpenAPI schema
   - Test CoinGecko compatibility (response format matches CoinGecko for mapped endpoints)

3. **Load tests (k6):**
   - **Baseline:** 100 VUs, 5 minutes. Target: p95 < 200ms for `/simple/price`
   - **Spike:** Ramp to 1000 VUs in 30s. Verify no 500 errors. Auto-scale test.
   - **Stress:** Gradually increase to 2000 VUs over 10 min. Find breaking point.
   - **Soak:** 500 VUs for 1 hour. Check for memory leaks, connection pool exhaustion.
   - Key endpoints: `/simple/price` (50% of traffic), `/coins/markets` (20%), `/coins/:id` (15%), `/news` (10%), `/defi/protocols` (5%)

4. **Test data factories:**
```typescript
// Generate realistic test data
const coinFactory = (overrides?: Partial<Coin>) => ({
  id: faker.string.uuid(),
  symbol: faker.finance.currencyCode().toLowerCase(),
  name: faker.company.name(),
  market_cap_rank: faker.number.int({ min: 1, max: 10000 }),
  current_price: faker.number.float({ min: 0.001, max: 100000 }),
  ...overrides
});
```

5. **CI integration:**
   - Unit tests run on every PR
   - Integration tests run on every PR (using docker-compose.test.yml)
   - Load tests run on-demand (manual trigger) and nightly

**Instructions:**
- Use `vitest` for unit and integration tests (per project conventions)
- Use `k6` for load testing (install via brew/apt)
- Use `@faker-js/faker` for test data generation
- Use `msw` (Mock Service Worker) for mocking external API calls in integration tests
- Minimum 80% code coverage target
- Test files co-located with source where possible, otherwise in `src/__tests__/`
- Do NOT touch files outside `src/__tests__/`, `vitest.config.ts`
- Commit message: `test: add comprehensive unit, integration, and load test suite`

---

## Agent 44 — API Documentation (MkDocs)

**Goal:** Write comprehensive API documentation in Markdown for the MkDocs-based documentation site.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Context:** free-crypto-news already uses MkDocs with `mkdocs.yml`. This agent creates documentation content for the new API.

**Files to create:**

```
docs/
  index.md                   (docs home)
  getting-started/
    quickstart.md             (5-minute quickstart)
    authentication.md         (API key setup)
    rate-limits.md            (rate limiting documentation)
    errors.md                 (error codes and handling)
    pagination.md             (pagination patterns)
    versioning.md             (API versioning policy)
  api-reference/
    overview.md               (API overview)
    coins.md                  (coin endpoints)
    simple.md                 (simple price endpoints)
    exchanges.md              (exchange endpoints)
    defi.md                   (DeFi endpoints)
    news.md                   (news endpoints)
    onchain.md                (on-chain endpoints)
    derivatives.md            (derivatives endpoints)
    social.md                 (social endpoints)
    global.md                 (global market endpoints)
    search.md                 (search endpoints)
    historical.md             (historical data endpoints)
    alerts.md                 (alerts endpoints)
    stablecoins.md            (stablecoin endpoints)
    macro.md                  (macroeconomic endpoints)
    nft.md                    (NFT endpoints)
    bitcoin.md                (Bitcoin-specific endpoints)
    solana.md                 (Solana-specific endpoints)
    websocket.md              (WebSocket API)
    graphql.md                (GraphQL API)
  sdks/
    python.md
    typescript.md
    go.md
    react.md
    php.md
    ruby.md
    rust.md
    other-languages.md
  guides/
    migration-from-coingecko.md
    migration-from-coinmarketcap.md
    building-a-price-tracker.md
    building-a-portfolio-app.md
    real-time-alerts.md
    defi-yield-scanner.md
    whale-watching.md
    sentiment-analysis.md
    backtesting-strategies.md
  integrations/
    chatgpt-plugin.md
    claude-mcp.md
    zapier.md
    google-sheets.md
    excel.md
    tradingview.md
  self-hosting/
    docker.md
    kubernetes.md
    configuration.md
    scaling.md
  changelog.md
mkdocs.yml                   (MkDocs configuration)
```

**Requirements:**

1. **Each API reference page includes:**
   - Endpoint URL with method badge (GET/POST/PUT/DELETE)
   - Description and use cases
   - Authentication requirements (free/developer/pro/enterprise)
   - Parameters table (name, type, required, default, description)
   - Request examples in curl, Python, TypeScript, Go
   - Response example with field descriptions
   - Rate limits per tier
   - Common errors
   - Changelog for the endpoint

2. **Quickstart (under 200 words):**
   ```
   1. Sign up at cryptocurrency.cv → Get API key
   2. curl https://api.cryptocurrency.cv/api/v1/simple/price?ids=bitcoin&vs_currencies=usd
   3. Install SDK: pip install crypto-vision
   4. Five lines of Python to get started
   ```

3. **Migration guides:**
   - CoinGecko: Endpoint-by-endpoint mapping table. Show old URL → new URL. Response format differences. "In most cases, just change the base URL."
   - CoinMarketCap: Similar mapping but more differences to document.

4. **MkDocs config:**
   - Material theme with dark mode
   - Search enabled
   - Code block copy buttons
   - Navigation tabs
   - Auto-generated from markdown
   - Deploy to `docs.cryptocurrency.cv`

**Instructions:**
- Write in clear, developer-friendly language
- Include copy-paste ready examples
- Document EVERY endpoint from Agents 16-30
- Use HTTP status code badges
- Include "Try it" links to API playground
- Do NOT touch files outside `docs/` and `mkdocs.yml`
- Commit message: `docs: add comprehensive API documentation for all endpoints`

---

## Agent 45 — Data Quality & Validation

**Goal:** Build data quality monitoring, validation, and anomaly detection systems.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/lib/quality/
  validator.ts               (data validation rules)
  anomaly-detector.ts        (real-time anomaly detection)
  freshness-monitor.ts       (data staleness detection)
  consistency-checker.ts     (cross-source consistency)
  reconciliation.ts          (data reconciliation engine)
  report.ts                  (quality report generation)
  rules/
    price-rules.ts           (price validation rules)
    volume-rules.ts          (volume validation rules)
    market-cap-rules.ts      (market cap validation)
    supply-rules.ts          (supply validation)
    defi-rules.ts            (DeFi data validation)
src/app/api/internal/
  quality/
    route.ts                 (GET /internal/quality — quality dashboard API)
    report/route.ts          (GET /internal/quality/report)
src/workers/quality/
  scheduler.ts               (run quality checks periodically)
```

**Requirements:**

1. **Price validation rules:**
   - Price must be > 0
   - Price change > 50% in 1 minute → flag as anomaly (possible bad data)
   - Price outside 3 standard deviations from mean across exchanges → flag
   - Stablecoin price deviation > 5% from peg → alert
   - Zero volume with price change → suspicious

2. **Volume validation:**
   - Volume must be >= 0
   - Volume spike > 10x average → flag for review (possible wash trading)
   - Zero volume for previously active coin → data source issue

3. **Data freshness:**
   - Price data age > 30s → warning
   - Price data age > 5min → stale, mark as stale in API response
   - News data age > 15min → warning
   - DeFi TVL age > 30min → warning
   - Automatic fallback to secondary data source on staleness

4. **Cross-source consistency:**
   - Compare price from 3+ exchanges. If one differs > 2% from median → flag
   - Compare market cap calculation (price * supply) → must match within 1%
   - Compare TVL from DeFiLlama vs calculated from on-chain → flag discrepancies

5. **Reconciliation engine:**
   - Run daily: compare database totals vs external sources
   - Report: coins missing from our data, coins we have that no longer exist
   - Supply updates: detect circulating supply changes

6. **Quality report:**
```json
{
  "timestamp": "...",
  "overall_score": 97.5,
  "metrics": {
    "data_freshness": { "score": 99, "stale_sources": 1, "details": [...] },
    "price_accuracy": { "score": 98, "anomalies_detected": 3, "details": [...] },
    "coverage": { "score": 96, "coins_tracked": 10423, "missing_data": [...] },
    "consistency": { "score": 97, "cross_source_mismatches": 5, "details": [...] }
  }
}
```

**Instructions:**
- Quality checks run continuously in the worker process
- Anomalies are logged and exposed via internal API (admin-only)
- Quality score exposed at `/api/health` for transparency
- Use statistical methods (z-score, IQR) for anomaly detection
- Do NOT touch files outside specified directories
- Commit message: `feat(quality): add data validation, anomaly detection, and quality monitoring`

---

## Agent 46 — Community & Open Source Infrastructure

**Goal:** Set up all community, contribution, and open source infrastructure files.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
README.md                    (main project README)
CONTRIBUTING.md              (contribution guide)
CODE_OF_CONDUCT.md           (code of conduct)
SECURITY.md                  (security policy)
LICENSE                      (MIT license)
CHANGELOG.md                 (changelog)
CITATION.cff                 (academic citation)
.github/
  ISSUE_TEMPLATE/
    bug_report.yml
    feature_request.yml
    data_issue.yml
    sdk_request.yml
  PULL_REQUEST_TEMPLATE.md
  DISCUSSION_TEMPLATE/
    ideas.yml
    q-and-a.yml
  FUNDING.yml
  SECURITY.md
humans.txt
```

**Requirements:**

1. **README.md (comprehensive, 500+ lines):**
   - Hero banner with logo
   - Badges: GitHub stars, npm version, PyPI version, Discord, license, uptime
   - "What is Crypto Vision?" — 1 paragraph
   - Quick Start (curl + Python + TypeScript + Go)
   - Feature comparison table vs CoinGecko and CoinMarketCap
   - API Coverage summary (endpoints count, coins, exchanges)
   - SDK overview with install commands for all 13+ languages
   - Architecture diagram (Mermaid)
   - Data sources list
   - Self-hosting instructions
   - Contributing section
   - License
   - Sponsors/supporters section

2. **CONTRIBUTING.md:**
   - How to set up development environment
   - How to add a new data source
   - How to add a new API endpoint
   - How to add a new SDK
   - Code style guidelines
   - PR process
   - Issue triage labels

3. **Issue templates:**
   - Bug report: steps to reproduce, expected vs actual, environment
   - Feature request: use case, proposed API, alternatives considered
   - Data issue: coin ID, data type, expected vs actual value, source
   - SDK request: language, use case, priority

4. **FUNDING.yml:**
   - GitHub Sponsors
   - Open Collective
   - Custom: cryptocurrency.cv/sponsor
   - Crypto: Bitcoin, Ethereum, USDC addresses

5. **CHANGELOG.md:**
   - Keep a Changelog format
   - Start with v1.0.0 entries
   - Categories: Added, Changed, Deprecated, Removed, Fixed, Security

6. **Repo description (set on GitHub):**
```
The most comprehensive cryptocurrency API. Real-time prices, OHLCV, order books & market cap for 10,000+ tokens across 500+ exchanges. DeFi TVL, yields & protocol metrics. On-chain analytics & whale alerts. Crypto news & AI sentiment. REST, WebSocket & GraphQL. Python, TypeScript, Go, React SDKs. Open source.
```
(398 chars — within 400 limit, no website URL, no "free")

**Instructions:**
- Make README visually appealing with emojis, badges, and tables
- Include Mermaid architecture diagram
- All links should point to cryptocurrency.cv domain
- Include README translations list (reference the 30+ translations in free-crypto-news)
- Do NOT touch files outside specified files
- Commit message: `docs: add comprehensive README, contributing guide, and community files`

---

## Agent 47 — Postman Collection & Developer Tools

**Goal:** Create a Postman/Insomnia collection, CLI tool, and developer utilities.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
postman/
  crypto-vision.postman_collection.json
  crypto-vision.postman_environment.json
  README.md
cli/
  package.json
  README.md
  src/
    index.ts                 (CLI entry point)
    commands/
      price.ts               (cv price bitcoin)
      markets.ts             (cv markets --top 10)
      coin.ts                (cv coin bitcoin)
      search.ts              (cv search "ethereum")
      news.ts                (cv news --category defi)
      gas.ts                 (cv gas)
      fear-greed.ts          (cv fear-greed)
      config.ts              (cv config set api-key <key>)
    utils/
      api.ts                 (API client)
      config.ts              (config file management)
      format.ts              (table/JSON output formatting)
      colors.ts              (terminal colors)
  bin/
    cv.ts                    (shebang entry)
tools/
  google-sheets/
    Code.gs                  (Google Apps Script for Google Sheets)
    README.md
  excel/
    crypto-vision.xlsm       (description only — link to download)
    README.md
  alfred/
    crypto-vision.alfredworkflow/
      info.plist
      script.sh
    README.md
  raycast/
    package.json
    src/
      price.tsx
      search.tsx
    README.md
```

**Requirements:**

1. **Postman collection:**
   - All endpoints organized in folders matching API structure
   - Each request has pre-populated parameters, description, and example response
   - Environment with `base_url` and `api_key` variables
   - Pre-request scripts for auth
   - Test scripts validating response schema
   - Import-ready for both Postman and Insomnia

2. **CLI tool (`cv`):**
```bash
# Install
npm install -g @crypto-vision/cli

# Configure
cv config set api-key cv_live_...

# Usage
cv price bitcoin ethereum solana          # Quick price check
cv markets --top 20 --sort volume         # Top coins by volume
cv coin bitcoin --detail                  # Full coin detail
cv search "layer 2"                       # Search
cv news --category defi --limit 5         # Latest DeFi news
cv gas                                    # Gas prices
cv fear-greed                             # Fear & Greed index
cv alerts list                            # Your alerts
```
   - Table output by default, `--json` for JSON, `--csv` for CSV
   - Colors: green for positive, red for negative
   - Config stored in `~/.crypto-vision/config.json`

3. **Google Sheets integration:**
   - `=CV_PRICE("bitcoin")` — current price
   - `=CV_CHANGE("ethereum", "24h")` — 24h change
   - `=CV_MARKETCAP("bitcoin")` — market cap
   - Custom function that calls Crypto Vision API
   - Setup instructions in README

4. **Alfred/Raycast:**
   - Quick price lookup: type "cv bitcoin" → see price
   - Copy price to clipboard
   - Open coin page in browser

**Instructions:**
- CLI uses `commander` for argument parsing and `cli-table3` for tables
- Postman collection should be auto-generatable from OpenAPI spec
- Publish CLI to npm as `@crypto-vision/cli`
- Do NOT touch files outside specified directories
- Commit message: `feat(tools): add Postman collection, CLI tool, and developer utilities`
