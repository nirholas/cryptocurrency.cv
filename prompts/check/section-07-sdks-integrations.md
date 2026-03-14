# Section 7: SDKs & Integrations (Agents 31–37)

> These agents build client SDKs, the MCP server, ChatGPT plugin, GraphQL layer, and embeddable widgets.

---

## Agent 31 — Python SDK

**Goal:** Build a production-quality Python SDK for the Crypto Vision API.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
sdk/python/
  pyproject.toml
  README.md
  LICENSE
  crypto_vision/
    __init__.py
    client.py                (main client class)
    async_client.py          (async version)
    auth.py                  (API key auth)
    models/
      __init__.py
      coins.py               (coin/price data models)
      markets.py             (exchange/ticker models)
      defi.py                (DeFi protocol models)
      news.py                (news article models)
      onchain.py             (on-chain data models)
      derivatives.py         (derivatives models)
      social.py              (social metrics models)
    endpoints/
      __init__.py
      coins.py               (coin endpoints)
      exchanges.py           (exchange endpoints)
      defi.py                (DeFi endpoints)
      news.py                (news endpoints)
      onchain.py             (on-chain endpoints)
      derivatives.py         (derivatives endpoints)
      social.py              (social endpoints)
      simple.py              (simple price endpoints)
      search.py              (search endpoints)
    websocket.py             (WebSocket streaming client)
    exceptions.py            (custom exceptions)
    rate_limit.py            (client-side rate limit handling)
    utils.py                 (helpers)
  tests/
    test_client.py
    test_coins.py
    test_websocket.py
    conftest.py
  examples/
    basic_usage.py
    websocket_streaming.py
    portfolio_tracker.py
```

**Requirements:**

1. **Client:**
```python
from crypto_vision import CryptoVision

cv = CryptoVision(api_key="cv_live_...")  # or no key for free tier

# Simple price
price = cv.simple.price("bitcoin", vs_currencies=["usd", "eur"])

# Coin detail
btc = cv.coins.get("bitcoin", market_data=True, sparkline=True)

# Markets with pagination
markets = cv.coins.markets(vs_currency="usd", per_page=250, page=1)

# Historical OHLCV
ohlcv = cv.coins.ohlcv("bitcoin", days=30, interval="daily")

# News
news = cv.news.latest(category="bitcoin", per_page=20)

# DeFi
protocols = cv.defi.protocols(chain="ethereum", order="tvl_desc")
```

2. **Async client:**
```python
from crypto_vision import AsyncCryptoVision

async with AsyncCryptoVision(api_key="cv_live_...") as cv:
    btc, eth = await asyncio.gather(
        cv.coins.get("bitcoin"),
        cv.coins.get("ethereum")
    )
```

3. **WebSocket:**
```python
from crypto_vision import CryptoVision

cv = CryptoVision(api_key="cv_live_...")

async def on_price(data):
    print(f"BTC: ${data['price']}")

await cv.ws.subscribe("prices:btc", callback=on_price)
```

4. **Data models:** Use Pydantic v2 for all response models. Full type hints. Optional fields properly typed.

5. **Error handling:**
```python
class CryptoVisionError(Exception): ...
class AuthenticationError(CryptoVisionError): ...  # 401
class RateLimitError(CryptoVisionError): ...        # 429, includes retry_after
class NotFoundError(CryptoVisionError): ...         # 404
class ServerError(CryptoVisionError): ...           # 5xx
```

6. **Rate limit handling:** Auto-retry on 429 with backoff. Respect `Retry-After` header. Optional rate limit callback. Show remaining requests.

7. **Configuration:** Base URL configurable (default: `https://api.cryptocurrency.cv/api/v1`). Timeout configurable. Proxy support. Custom headers.

**Instructions:**
- Use `httpx` for HTTP client (async + sync)
- Use `websockets` for WebSocket client
- Python 3.9+ compatibility
- 100% type-annotated
- Publish to PyPI as `crypto-vision`
- Match CoinGecko SDK patterns for easy migration
- Include comprehensive docstrings
- Do NOT touch files outside `sdk/python/`
- Commit message: `feat(sdk): add Python SDK for Crypto Vision API`

---

## Agent 32 — TypeScript/JavaScript SDK

**Goal:** Build a TypeScript SDK for Node.js and browser usage.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
sdk/typescript/
  package.json
  tsconfig.json
  tsconfig.build.json
  README.md
  LICENSE
  src/
    index.ts                (main exports)
    client.ts               (main client class)
    auth.ts                 (API key auth)
    types/
      index.ts              (all type exports)
      coins.ts
      markets.ts
      defi.ts
      news.ts
      onchain.ts
      derivatives.ts
      social.ts
      common.ts             (pagination, error, etc)
    endpoints/
      coins.ts
      exchanges.ts
      defi.ts
      news.ts
      onchain.ts
      derivatives.ts
      social.ts
      simple.ts
      search.ts
    websocket.ts            (WebSocket client)
    errors.ts               (typed errors)
    utils.ts                (response parsing, etc)
  tests/
    client.test.ts
    coins.test.ts
    websocket.test.ts
  examples/
    basic.ts
    browser.html
    next-app/
      page.tsx
```

**Requirements:**

1. **Usage:**
```typescript
import { CryptoVision } from 'crypto-vision';

const cv = new CryptoVision({ apiKey: 'cv_live_...' });

// Fully typed responses
const btc = await cv.coins.get('bitcoin');
console.log(btc.market_data.current_price.usd); // number

// Simple price (most common)
const prices = await cv.simple.price(['bitcoin', 'ethereum'], {
  vsCurrencies: ['usd'], include24hChange: true
});

// Streaming
cv.ws.subscribe('prices:btc', (data) => {
  console.log(`BTC: $${data.price}`);
});
```

2. **Features:**
- Works in Node.js 18+ and modern browsers
- Tree-shakeable (ESM exports)
- Zero dependencies in browser build (use native fetch + WebSocket)
- Node.js build uses `undici` for better perf
- Full TypeScript types (no `any`)
- Auto-retry on 429 with exponential backoff
- Request/response interceptors
- AbortController support for cancellation

3. **Build outputs:**
- ESM: `dist/esm/index.js`
- CJS: `dist/cjs/index.cjs`
- Browser: `dist/browser/crypto-vision.min.js` (UMD)
- Types: `dist/types/index.d.ts`

4. **Error types:**
```typescript
class CryptoVisionError extends Error { status: number; code: string; }
class RateLimitError extends CryptoVisionError { retryAfter: number; remaining: number; }
class AuthError extends CryptoVisionError {}
class NotFoundError extends CryptoVisionError {}
```

**Instructions:**
- Use `tsup` for bundling (ESM + CJS + UMD)
- Use `vitest` for testing
- Publish to npm as `crypto-vision`
- Include JSDoc on all public APIs
- Browser bundle < 15KB gzipped
- Do NOT touch files outside `sdk/typescript/`
- Commit message: `feat(sdk): add TypeScript/JavaScript SDK for Crypto Vision API`

---

## Agent 33 — Go SDK

**Goal:** Build a Go SDK for the Crypto Vision API.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
sdk/go/
  go.mod
  go.sum
  README.md
  LICENSE
  client.go                 (main client)
  options.go                (client options)
  coins.go                  (coin endpoints)
  exchanges.go              (exchange endpoints)
  defi.go                   (DeFi endpoints)
  news.go                   (news endpoints)
  onchain.go                (on-chain endpoints)
  derivatives.go            (derivatives endpoints)
  social.go                 (social endpoints)
  simple.go                 (simple price endpoints)
  search.go                 (search endpoints)
  websocket.go              (WebSocket client)
  types.go                  (all data types)
  errors.go                 (error types)
  ratelimit.go              (rate limit handling)
  client_test.go
  coins_test.go
  examples/
    basic/main.go
    websocket/main.go
```

**Requirements:**

1. **Usage:**
```go
package main

import "github.com/nirholas/crypto-vision/sdk/go"

func main() {
    client := cryptovision.NewClient(
        cryptovision.WithAPIKey("cv_live_..."),
    )

    btc, err := client.Coins.Get(context.Background(), "bitcoin")
    if err != nil { log.Fatal(err) }

    prices, err := client.Simple.Price(context.Background(), []string{"bitcoin"}, 
        cryptovision.WithVsCurrencies([]string{"usd"}))
}
```

2. **Features:**
- Context-aware (all methods take `context.Context`)
- Functional options pattern for client config
- Pagination helpers (iterator pattern)
- Auto-retry on 429
- Connection pooling via `http.Client`
- WebSocket support via `gorilla/websocket`
- Concurrent-safe

3. **Types:** Use idiomatic Go types. JSON tags on all structs. Optional fields as pointers. Enums as typed strings with constants.

**Instructions:**
- Module path: `github.com/nirholas/crypto-vision/sdk/go`
- Go 1.21+ 
- Standard library HTTP client (no extra deps except websocket)
- golangci-lint clean
- Do NOT touch files outside `sdk/go/`
- Commit message: `feat(sdk): add Go SDK for Crypto Vision API`

---

## Agent 34 — React Hooks & Components Library

**Goal:** Build a React hooks library and pre-built components for displaying crypto data.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
sdk/react/
  package.json
  tsconfig.json
  README.md
  LICENSE
  src/
    index.ts
    provider.tsx             (CryptoVisionProvider context)
    hooks/
      index.ts
      usePrice.ts            (real-time price hook)
      useCoin.ts             (coin detail hook)
      useMarkets.ts          (markets list hook)
      useOHLCV.ts            (OHLCV data hook)
      useFearGreed.ts        (fear & greed hook)
      useNews.ts             (news feed hook)
      useTrending.ts         (trending coins hook)
      useSearch.ts           (search hook with debounce)
      useWebSocket.ts        (WebSocket connection hook)
      useAlerts.ts           (alerts hook)
    components/
      PriceTicker.tsx        (real-time price display)
      CoinCard.tsx           (coin summary card)
      MarketTable.tsx        (sortable market table)
      PriceChart.tsx         (price chart with TradingView-like UI)
      FearGreedGauge.tsx     (fear & greed gauge widget)
      NewsFeed.tsx           (scrolling news feed)
      CoinSearch.tsx         (search autocomplete)
      Sparkline.tsx          (inline sparkline chart)
      Heatmap.tsx            (market heatmap)
    utils/
      format.ts              (price/number formatting)
      colors.ts              (green/red colors for changes)
  stories/
    PriceTicker.stories.tsx
    CoinCard.stories.tsx
    MarketTable.stories.tsx
```

**Requirements:**

1. **Provider:**
```tsx
import { CryptoVisionProvider } from '@crypto-vision/react';

function App() {
  return (
    <CryptoVisionProvider apiKey="cv_live_..." options={{ refreshInterval: 10000 }}>
      <Dashboard />
    </CryptoVisionProvider>
  );
}
```

2. **Hooks:**
```tsx
// Real-time price with auto-refresh
const { price, change24h, isLoading } = usePrice('bitcoin');

// Markets with pagination
const { coins, isLoading, fetchNextPage } = useMarkets({ perPage: 50 });

// Real-time WebSocket
const { data, status } = useWebSocket('prices:btc');

// Search with debounce
const { results, search } = useSearch({ debounceMs: 300 });
```

3. **Components:**
```tsx
<PriceTicker coinId="bitcoin" showChange showSparkline />
<MarketTable coins={coins} sortBy="market_cap" columns={['rank', 'name', 'price', 'change24h', 'volume', 'marketCap']} />
<PriceChart coinId="bitcoin" days={30} interval="daily" height={400} />
<FearGreedGauge size={200} />
<NewsFeed category="bitcoin" limit={10} />
```

4. **Features:**
- SWR-based data fetching (stale-while-revalidate)
- Optimistic updates
- Error boundaries
- Responsive components
- Dark/light mode support
- Customizable styling (CSS variables + className props)
- Accessible (WCAG 2.1 AA)

**Instructions:**
- Use React 18+, works with Next.js App Router
- Use SWR or TanStack Query for data fetching
- Use `lightweight-charts` for price charts (TradingView's open-source library)
- Publish to npm as `@crypto-vision/react`
- Include Storybook stories for visual testing
- Do NOT touch files outside `sdk/react/`
- Commit message: `feat(sdk): add React hooks and components library`

---

## Agent 35 — MCP Server (Claude Integration)

**Goal:** Build a Model Context Protocol server for Claude AI integration.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Context:** free-crypto-news already has an MCP server in `/mcp/`. This agent builds a new, more comprehensive MCP server for Crypto Vision.

**Files to create:**

```
mcp/
  package.json
  tsconfig.json
  README.md
  src/
    index.ts                 (MCP server entry point)
    tools/
      prices.ts              (get_price, get_prices, get_ohlcv)
      coins.ts               (get_coin, search_coins, get_trending)
      markets.ts             (get_global, get_exchanges)
      defi.ts                (get_defi_protocols, get_tvl, get_yields)
      news.ts                (get_news, get_breaking_news, search_news)
      onchain.ts             (get_whale_alerts, get_gas, get_chain_metrics)
      derivatives.ts         (get_funding_rates, get_liquidations, get_oi)
      social.ts              (get_social_metrics, get_sentiment)
      analysis.ts            (analyze_coin, compare_coins, get_signals)
    resources/
      market-overview.ts     (market overview resource)
      coin-profile.ts        (coin profile resource template)
      portfolio.ts           (portfolio resource)
    prompts/
      market-analysis.ts     (market analysis prompt)
      coin-research.ts       (coin research prompt)
      defi-yield.ts          (DeFi yield analysis prompt)
      risk-assessment.ts     (risk assessment prompt)
    utils/
      api-client.ts          (API client for Crypto Vision)
      formatters.ts          (format data for LLM consumption)
```

**Requirements:**

1. **Tools (20+ tools):**
```typescript
// Prices
get_price: { coin_id, vs_currency } → current price + 24h change
get_prices: { coin_ids[], vs_currency } → batch prices
get_ohlcv: { coin_id, days, interval } → OHLCV data

// Market
get_global_stats: {} → total market cap, BTC dominance, etc.
get_trending: {} → trending coins
search_coins: { query } → search results

// DeFi
get_defi_overview: {} → total TVL, top protocols
get_yields: { chain, min_tvl, stablecoin_only } → yield opportunities
get_protocol: { protocol_id } → protocol detail

// Analysis
analyze_coin: { coin_id } → comprehensive analysis (price + sentiment + onchain)
compare_coins: { coin_ids[] } → side-by-side comparison
market_report: {} → AI-style market summary
```

2. **Resources:**
```typescript
// Dynamic resources
"crypto://market/overview" → current market state
"crypto://coin/{coinId}/profile" → coin profile with all data
"crypto://portfolio/{userId}" → user portfolio (if auth provided)
```

3. **Prompts:**
```typescript
// Prompt templates for common analyses
"market-analysis" → "Analyze the current crypto market conditions..."
"coin-research" → "Research {coinId}, covering fundamentals, technicals..."
"defi-yield" → "Find the best DeFi yield opportunities with these criteria..."
"risk-assessment" → "Assess the risk of investing in {coinId}..."
```

4. **Server config:**
- Support both stdio and HTTP transport
- HTTP transport: SSE for streaming
- Rate limiting: respect API key tier
- Format all numeric data as human-readable for LLM consumption

**Instructions:**
- Use `@modelcontextprotocol/sdk` for MCP server
- Reference the existing MCP server in free-crypto-news `/mcp/` for patterns
- All tool responses should be formatted for LLM consumption (human-readable, not raw JSON)
- Include install instructions for Claude Desktop (`claude_desktop_config.json`)
- Do NOT touch files outside `mcp/`
- Commit message: `feat(mcp): add comprehensive MCP server for Claude AI integration`

---

## Agent 36 — ChatGPT Plugin & OpenAPI Spec

**Goal:** Build the ChatGPT plugin manifest and comprehensive OpenAPI specification.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
chatgpt/
  README.md
  openapi.yaml              (complete OpenAPI 3.1 spec)
  ai-plugin.json            (ChatGPT plugin manifest)
src/app/.well-known/
  ai-plugin.json/route.ts   (serve plugin manifest)
src/app/api/openapi.json/
  route.ts                  (serve OpenAPI spec)
openapi/
  openapi.yaml              (master OpenAPI spec)
  schemas/
    coins.yaml
    exchanges.yaml
    defi.yaml
    news.yaml
    onchain.yaml
    derivatives.yaml
    social.yaml
    common.yaml
```

**Requirements:**

1. **OpenAPI 3.1 spec:**
- Cover ALL endpoints from Agents 16-30
- Include request/response schemas with examples
- Authentication: API key in header (`X-API-Key`) or query param (`api_key`)
- Rate limiting headers documented
- Error response schemas
- Pagination patterns
- Group by tags: Coins, Exchanges, DeFi, News, On-Chain, Derivatives, Social, Global, Simple

2. **ChatGPT plugin manifest:**
```json
{
  "schema_version": "v1",
  "name_for_human": "Crypto Vision",
  "name_for_model": "crypto_vision",
  "description_for_human": "Get real-time cryptocurrency prices, market data, DeFi analytics, news, and on-chain data.",
  "description_for_model": "Plugin for accessing comprehensive cryptocurrency data including real-time prices, market cap rankings, DeFi protocol TVL, yield farming APY, on-chain analytics, news sentiment, and derivatives data for 10,000+ tokens across 500+ exchanges.",
  "auth": { "type": "service_http", "authorization_type": "bearer", "verification_tokens": {} },
  "api": { "type": "openapi", "url": "https://api.cryptocurrency.cv/openapi.json" },
  "logo_url": "https://cryptocurrency.cv/logo.png",
  "contact_email": "api@cryptocurrency.cv",
  "legal_info_url": "https://cryptocurrency.cv/terms"
}
```

3. **Split schemas:** Large spec split into domain-specific YAML files in `openapi/schemas/`, composed into master spec.

**Instructions:**
- OpenAPI 3.1.0 format (latest)
- Include extensive `example` values in all schemas
- Include `x-codeSamples` for curl, Python, JavaScript, Go
- Validate spec with `swagger-cli validate`
- Do NOT touch files outside specified directories
- Commit message: `feat(openapi): add comprehensive OpenAPI 3.1 spec and ChatGPT plugin`

---

## Agent 37 — Embeddable Widgets

**Goal:** Build embeddable JavaScript widgets that anyone can add to their website.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
widget/
  package.json
  tsconfig.json
  README.md
  src/
    loader.ts                (widget loader script)
    widgets/
      price-ticker.ts        (single coin price ticker)
      price-table.ts         (multi-coin price table)
      chart.ts               (price chart widget)
      fear-greed.ts          (fear & greed gauge)
      news-feed.ts           (news ticker/feed)
      market-cap.ts          (market cap ticker)
      converter.ts           (crypto converter)
      heatmap.ts             (market heatmap)
    styles/
      base.css               (base widget styles)
      themes/
        light.css
        dark.css
    utils/
      api.ts                 (API client)
      dom.ts                 (DOM helpers)
      format.ts              (number formatting)
  dist/                      (built output)
  examples/
    index.html               (widget showcase)
```

**Requirements:**

1. **Embed code (simple):**
```html
<!-- Price Ticker -->
<div data-cv-widget="price-ticker" data-coin="bitcoin" data-theme="dark"></div>
<script src="https://widgets.cryptocurrency.cv/v1/loader.js" async></script>
```

2. **JavaScript API:**
```javascript
CryptoVision.widget('price-ticker', {
  target: '#my-ticker',
  coin: 'bitcoin',
  theme: 'dark',
  showChange: true,
  showSparkline: true,
  refreshInterval: 10000
});
```

3. **Widgets:**
- **Price Ticker:** Single coin, shows price + 24h change. Animated updates.
- **Price Table:** Top N coins by market cap. Sortable columns.
- **Chart:** Interactive price chart with timeframe selector (1D/1W/1M/1Y).
- **Fear & Greed:** Circular gauge with current value + label.
- **News Feed:** Scrolling news headlines. Click to read.
- **Converter:** Convert between crypto and fiat currencies.
- **Market Cap Ticker:** Scrolling ticker of top coins.
- **Heatmap:** Color-coded market heatmap (green = up, red = down).

4. **Technical:**
- Self-contained (no external dependencies)
- Shadow DOM for style isolation
- < 30KB gzipped per widget
- Responsive (works in any container size)
- CORS-safe (loads data from API)
- No cookies/tracking
- CSP-compatible
- Customizable via CSS variables

**Instructions:**
- Build with `esbuild` for minimal bundle size
- Serve from `widgets.cryptocurrency.cv` CDN
- Include "Powered by Crypto Vision" link (removable on paid plans)
- free-crypto-news already has widgets in `/widget/` — reference for patterns
- Do NOT touch files outside `widget/`
- Commit message: `feat(widgets): add embeddable price ticker, chart, and news widgets`
