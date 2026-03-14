# Section 10: Advanced Features (Agents 48–50)

> These agents build advanced differentiating features: portfolio tracking, AI/ML analysis, and the data export/bulk download system.

---

## Agent 48 — Portfolio Tracking API

**Goal:** Build a portfolio tracking system where users can create, manage, and analyze cryptocurrency portfolios.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/portfolio/
  route.ts                          (GET/POST /portfolio — list/create portfolios)
  [portfolioId]/
    route.ts                        (GET/PUT/DELETE /portfolio/:id)
    transactions/route.ts           (GET/POST — transaction history)
    performance/route.ts            (GET — portfolio performance)
    allocation/route.ts             (GET — allocation breakdown)
    pnl/route.ts                    (GET — profit & loss)
    rebalance/route.ts              (GET — rebalancing suggestions)
    export/route.ts                 (GET — export portfolio data)
src/lib/services/
  portfolio.ts                      (portfolio service layer)
  portfolio-analytics.ts            (performance calculations)
src/db/schema/
  portfolio.ts                      (portfolio database tables)
```

**Database Tables:**

```typescript
portfolios: id, user_id, name, description, is_public (bool), 
  created_at, updated_at

portfolio_transactions: id, portfolio_id, coin_id, type (buy/sell/transfer_in/transfer_out),
  quantity, price_per_unit, total_cost, fee, fee_currency,
  exchange, notes, executed_at, created_at

portfolio_holdings: portfolio_id, coin_id, quantity, avg_cost_basis,
  total_invested, realized_pnl, updated_at
  (materialized from transactions)
```

**API Specifications:**

1. **POST /api/v1/portfolio**
```
Body: { name: "Main Portfolio", description: "Long-term holdings" }
Response: { id, name, description, holdings: [], total_value: 0, created_at }
```

2. **POST /api/v1/portfolio/:id/transactions**
```
Body: { coin_id: "bitcoin", type: "buy", quantity: 0.5, 
  price_per_unit: 95000, fee: 10, exchange: "coinbase",
  executed_at: "2026-02-15T10:30:00Z" }
Response: { transaction_id, updated_holdings: [...] }
```

3. **GET /api/v1/portfolio/:id/performance**
```
Query: period (24h/7d/30d/90d/1y/all)
Response: { total_value: 125000, total_invested: 100000,
  total_pnl: 25000, total_pnl_pct: 25.0,
  unrealized_pnl: 20000, realized_pnl: 5000,
  best_performer: { coin_id, pnl_pct: 150 },
  worst_performer: { coin_id, pnl_pct: -30 },
  sharpe_ratio: 1.8, max_drawdown: -15.2,
  history: [{ date, value, pnl }],
  vs_btc: { value_if_held_btc, btc_pnl_pct },
  vs_eth: { value_if_held_eth, eth_pnl_pct } }
```

4. **GET /api/v1/portfolio/:id/allocation**
```
Response: { holdings: [{ coin_id, symbol, name, quantity, 
  current_price, value, allocation_pct, pnl, pnl_pct,
  avg_cost, cost_basis }],
  by_category: [{ category: "L1", allocation_pct: 60 }, ...],
  by_chain: [{ chain: "ethereum", allocation_pct: 45 }, ...],
  concentration: { top_1_pct: 45, top_3_pct: 80, hhi: 0.25 } }
```

5. **GET /api/v1/portfolio/:id/pnl**
```
Query: period, coin_id (optional — filter by coin)
Response: { total_pnl: 25000, unrealized: 20000, realized: 5000,
  tax_report: { short_term_gains: 3000, long_term_gains: 2000,
  losses: 0, net_taxable: 5000 },
  by_coin: [{ coin_id, quantity, avg_cost, current_price, 
  unrealized_pnl, realized_pnl, holding_period_days }] }
```

6. **GET /api/v1/portfolio/:id/rebalance**
```
Query: target_allocation (JSON: { bitcoin: 50, ethereum: 30, solana: 20 })
Response: { current_allocation: [...], target_allocation: [...],
  trades_needed: [{ coin_id, action: "buy/sell", quantity, 
  estimated_cost, reason: "Underweight by 5%" }],
  estimated_fees: 50 }
```

**Instructions:**
- Portfolio data is private per user (requires auth)
- Support importing transactions from CSV (Coinbase, Binance, Kraken export formats)
- Cost basis methods: FIFO, LIFO, average cost (configurable per portfolio)
- Tax report calculation: US tax rules (short-term < 1 year, long-term >= 1 year)
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add portfolio tracking with performance analytics and tax reporting`

---

## Agent 49 — AI/ML Analysis & Research API

**Goal:** Build AI-powered analysis endpoints using Google Gemini for coin research, market analysis, and intelligent Q&A.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Context:**
- free-crypto-news already uses Google Gemini for AI features (`src/lib/rag/`) and has a RAG pipeline. This agent builds the v1 AI endpoints for Crypto Vision.

**Files to create:**

```
src/app/api/v1/ai/
  analyze/route.ts                  (POST /ai/analyze — AI analysis of any coin)
  research/route.ts                 (POST /ai/research — deep research report)
  ask/route.ts                      (POST /ai/ask — natural language Q&A)
  summarize/route.ts                (POST /ai/summarize — summarize market events)
  compare/route.ts                  (POST /ai/compare — AI coin comparison)
  risk/route.ts                     (POST /ai/risk — risk assessment)
  explain/route.ts                  (POST /ai/explain — explain crypto concepts)
  report/
    daily/route.ts                  (GET /ai/report/daily — daily market report)
    weekly/route.ts                 (GET /ai/report/weekly)
src/lib/ai/
  gemini.ts                         (Gemini client wrapper)
  prompts/
    analysis.ts                     (coin analysis prompt templates)
    research.ts                     (research prompt templates)
    market.ts                       (market summary prompts)
    risk.ts                         (risk assessment prompts)
    qa.ts                           (Q&A prompt templates)
  rag/
    embeddings.ts                   (text embedding for RAG)
    vector-store.ts                 (vector similarity search)
    retriever.ts                    (relevant context retrieval)
  context-builder.ts                (build context from multiple sources)
  response-parser.ts                (parse and format AI responses)
  cache.ts                          (cache AI responses)
```

**API Specifications:**

1. **POST /api/v1/ai/analyze**
```
Body: { coin_id: "bitcoin", aspects: ["fundamentals", "technicals", "sentiment", "onchain"] }
Response: { coin_id: "bitcoin", analysis: {
  summary: "Bitcoin is showing strong bullish momentum...",
  fundamentals: { score: 8.5, analysis: "Strong network effects...", 
    key_metrics: { active_addresses_trend: "increasing", hashrate_trend: "ath" } },
  technicals: { score: 7.0, analysis: "RSI at 62 suggests...",
    support_levels: [90000, 85000], resistance_levels: [100000, 108000] },
  sentiment: { score: 7.5, analysis: "News sentiment is predominantly positive...",
    social_volume: "above average" },
  onchain: { score: 8.0, analysis: "Exchange outflows suggest accumulation...",
    key_signals: ["whale accumulation", "exchange supply decreasing"] },
  overall_score: 7.75,
  outlook: { short_term: "bullish", medium_term: "bullish", long_term: "bullish" },
  risks: ["Regulatory uncertainty", "Correlation with equities"],
  disclaimer: "This is AI-generated analysis, not financial advice."
}, model: "gemini-2.5-pro", generated_at, tokens_used }
PRO/ENTERPRISE tier only
```

2. **POST /api/v1/ai/research**
```
Body: { coin_id: "solana", depth: "comprehensive" }
Response: { report: {
  executive_summary: "...",
  sections: [
    { title: "Technology Overview", content: "...", sources: [...] },
    { title: "Tokenomics", content: "...", data: { supply_schedule: [...] } },
    { title: "Ecosystem Analysis", content: "...", metrics: { dapps: 500, tvl: 8e9 } },
    { title: "Competitive Positioning", content: "...", competitors: [...] },
    { title: "Risk Factors", content: "...", risks: [...] },
    { title: "Investment Thesis", content: "...", bull_case: "...", bear_case: "..." }
  ],
  data_sources: ["CoinGecko", "DeFiLlama", "Solana Explorer", "30 news articles"],
  confidence_score: 0.85
}, model, generated_at }
ENTERPRISE tier only — 1 report per day
```

3. **POST /api/v1/ai/ask**
```
Body: { question: "What are the best DeFi yield strategies right now?", 
  context: { max_risk: "medium", preferred_chains: ["ethereum", "arbitrum"] } }
Response: { answer: "Based on current data, here are the top opportunities...",
  data_cited: [{ source: "Aave v3 on Ethereum", apy: 4.2 }, ...],
  confidence: 0.80, sources_used: 15 }
Uses RAG to ground responses in actual current data
```

4. **POST /api/v1/ai/summarize**
```
Body: { topic: "ethereum", period: "24h" }
Response: { summary: "In the last 24 hours, Ethereum...",
  key_events: ["ETH broke above $4,000", "Ethereum ETF saw $200M inflows"],
  price_action: { start: 3950, end: 4050, high: 4100, low: 3900 },
  sentiment_shift: "positive", notable_transactions: [...] }
```

5. **GET /api/v1/ai/report/daily**
```
Response: { date: "2026-03-01", report: {
  market_overview: "...",
  top_movers: [...], biggest_stories: [...],
  defi_highlights: "...", onchain_insights: "...",
  outlook: "...", risk_events: [...]
}, generated_at }
Pre-generated daily at 08:00 UTC, cached for 24h
```

**Instructions:**
- Use Google Gemini 2.5 Pro for all AI analysis
- RAG pipeline: embed news articles + market data → retrieve relevant context → inject into prompts
- Cache AI responses: same query within 1 hour returns cached result
- Rate limit AI endpoints: 10 requests/hour free, 100 developer, 500 pro, unlimited enterprise
- Include confidence scores and data source citations
- Always include "not financial advice" disclaimer
- Reference free-crypto-news `src/lib/rag/` for RAG patterns
- Do NOT touch files outside specified directories
- Commit message: `feat(ai): add AI-powered analysis, research, and Q&A endpoints`

---

## Agent 50 — Data Export, Bulk Download & Compliance API

**Goal:** Build data export, bulk download, and regulatory compliance endpoints.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/api/v1/export/
  route.ts                          (POST /export — create export job)
  [jobId]/route.ts                  (GET /export/:jobId — check job status)
  [jobId]/download/route.ts         (GET /export/:jobId/download — download file)
  formats/route.ts                  (GET /export/formats — available formats)
src/app/api/v1/bulk/
  coins/route.ts                    (GET /bulk/coins — full coin database)
  prices/route.ts                   (GET /bulk/prices — bulk price data)
  historical/route.ts               (GET /bulk/historical — historical bulk download)
src/app/api/v1/compliance/
  aml/route.ts                      (GET /compliance/aml — AML risk scoring)
  sanctions/route.ts                (GET /compliance/sanctions — sanctions list check)
  travel-rule/route.ts              (GET /compliance/travel-rule — travel rule data)
src/lib/services/
  export.ts                         (export service)
  bulk.ts                           (bulk data service)
  compliance.ts                     (compliance service)
src/lib/export/
  formats/
    csv.ts                          (CSV formatter)
    json.ts                         (JSON/JSONL formatter)
    parquet.ts                      (Apache Parquet formatter)
    excel.ts                        (XLSX formatter)
  storage.ts                        (Cloud Storage upload/signed URLs)
  scheduler.ts                      (export job scheduler)
src/db/schema/
  exports.ts                        (export job tracking table)
```

**API Specifications:**

1. **POST /api/v1/export**
```
Body: { type: "historical_prices", coin_ids: ["bitcoin", "ethereum"],
  from: "2025-01-01", to: "2026-03-01", interval: "1d",
  format: "csv", include_headers: true, 
  delivery: "download" | "email" | "webhook" }
Response: { job_id: "exp_abc123", status: "processing", 
  estimated_time_seconds: 30, download_url: null }
```

2. **GET /api/v1/export/:jobId**
```
Response: { job_id, status: "completed", progress: 100,
  file_size_bytes: 15000000, download_url: "https://...",
  expires_at: "2026-03-02T12:00:00Z", format: "csv",
  rows: 730, coins: 2 }
```

3. **Supported export formats:**
   - **CSV:** Standard CSV, configurable delimiter
   - **JSON:** Pretty-printed JSON or JSONL (one JSON object per line)
   - **Parquet:** Columnar format for big data tools (Pandas, Spark, BigQuery)
   - **XLSX:** Excel format with formatting

4. **GET /api/v1/bulk/coins**
```
Response: Full database dump in JSONL format (streaming response)
Headers: Content-Type: application/x-ndjson
One coin per line, includes all metadata
Updated daily at 00:00 UTC
PRO/ENTERPRISE only
```

5. **GET /api/v1/bulk/prices**
```
Query: date (YYYY-MM-DD)
Response: All coin prices for that day in JSONL format
Updated end of each day
```

6. **GET /api/v1/bulk/historical**
```
Query: coin_id, from, to, interval
Response: Streaming JSONL of OHLCV data
Max 5 years of data per request
ENTERPRISE only
```

7. **Compliance endpoints (ENTERPRISE only):**

   **GET /api/v1/compliance/aml/:address**
   ```
   Response: { address, chain, risk_score: 25 (0-100), risk_level: "low",
     flags: [], known_entity: "Coinbase", entity_type: "exchange",
     direct_exposure: { exchange: 80, defi: 15, unknown: 5 },
     indirect_exposure: { gambling: 0.1, darknet: 0, sanctions: 0 } }
   ```

   **GET /api/v1/compliance/sanctions/:address**
   ```
   Response: { address, is_sanctioned: false, 
     checked_against: ["OFAC SDN", "EU Sanctions", "UN Sanctions"],
     last_updated: "2026-03-01" }
   ```

**Export Job Flow:**
1. User creates export job (POST /export)
2. Job queued in Redis
3. Worker picks up job, queries database, formats data
4. File uploaded to Cloud Storage
5. Signed URL generated (24h expiry)
6. User notified (webhook/email) or polls for status
7. File auto-deleted after 24h

**Instructions:**
- Use streaming for large datasets (Node.js Readable streams → response)
- Parquet generation using `parquetjs` or `apache-arrow`
- Excel generation using `exceljs`
- Store export files in GCP Cloud Storage (`cv-exports` bucket from Agent 1)
- Compliance data from Chainalysis API or Crystal Blockchain (if available), otherwise build basic heuristics
- Rate limit exports: free (1/day), developer (10/day), pro (50/day), enterprise (unlimited)
- Max file size: 1GB
- Do NOT touch files outside specified directories
- Commit message: `feat(api): add data export, bulk download, and compliance endpoints`
