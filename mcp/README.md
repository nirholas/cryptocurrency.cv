# Free Crypto News MCP server

Give Claude, Cursor, ChatGPT or any other [Model Context Protocol](https://modelcontextprotocol.io) client live crypto news, prices, DeFi, derivatives and on-chain data from [cryptocurrency.cv](https://cryptocurrency.cv).

No API key. No account. No signup.

---

## Install

### Option 1: hosted (nothing to install)

The server runs on our infrastructure at `https://cryptocurrency.cv/api/mcp` over Streamable HTTP. Fastest path, and it stays up to date on its own.

**Claude Code**

```bash
claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp
```

**Claude Desktop / Cursor / Windsurf** (`claude_desktop_config.json`, `.cursor/mcp.json`, and friends)

```json
{
  "mcpServers": {
    "crypto-news": {
      "url": "https://cryptocurrency.cv/api/mcp"
    }
  }
}
```

### Option 2: local (stdio)

Runs on your machine and talks to the same public API. Useful behind a proxy, or when you want to point it at your own deployment.

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["-y", "@nirholas/free-crypto-news-mcp"]
    }
  }
}
```

### Option 3: from source

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv/mcp
npm install
npm run build
```

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "node",
      "args": ["/absolute/path/to/cryptocurrency.cv/mcp/dist/index.js"]
    }
  }
}
```

Restart your client after editing its config, then ask it something like *"what is the latest Bitcoin ETF news?"* or *"compare SOL and ETH over the last 30 days"*.

---

## Configuration

Every setting is optional.

| Variable | Default | What it does |
| --- | --- | --- |
| `API_BASE` | `https://cryptocurrency.cv` | Point the server at another deployment, for example `http://localhost:3000` |
| `API_KEY` | none | Sent as `x-api-key`. Raises rate limits and unlocks paid endpoints |
| `API_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds |

```json
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["-y", "@nirholas/free-crypto-news-mcp"],
      "env": { "API_KEY": "your-key" }
    }
  }
}
```

---

## Transports

| Transport | Command | Use for |
| --- | --- | --- |
| stdio | `npm start` | Local MCP clients (Claude Desktop, Cursor, Windsurf) |
| Streamable HTTP | `npm run start:http` | Self-hosting the HTTP endpoint yourself (`PORT`, default 8787) |

The hosted endpoint at `https://cryptocurrency.cv/api/mcp` serves this same tool registry from the main Next.js app (`src/app/api/mcp/route.ts`), stateless, one server instance per request.

---

## Paid endpoints

Most tools are free and unauthenticated. A few sit behind the [x402](https://cryptocurrency.cv/x402) micropayment gate; those tools return a readable `Payment required` message naming the endpoint and its price rather than a raw HTTP error, so the model can explain the situation instead of retrying blindly. Set `API_KEY` to use them.

---

## Tools

<!-- TOOLS:START -->

**59 tools.** Every tool maps onto one real REST route of the API.

### News (10)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_latest_news` | Latest crypto headlines from 300+ sources (CoinDesk, The Block, Decrypt, Bloomberg, Reuters and more). Filter by category or source, sort by AI impact score, or restrict to the curated tier-1 homepage feed. | `GET /api/news` |
| `get_breaking_news` | Breaking crypto news from the last few hours, ranked by urgency. Use for "what just happened" questions. | `GET /api/breaking` |
| `search_news` | Full-text search across every indexed article. Pass a topic, coin, company or event. Set semantic=true for embedding-based search that matches meaning rather than exact words. | `GET /api/search` |
| `get_article` | Fetch one article. Give an archive id or slug to read it from the archive, or give any article URL to extract its full text and metadata from the publisher page. | `GET /api/articles?id= \| GET /api/article?url=` |
| `get_archive` | Query the historical news archive by date range, ticker, source, sentiment or keyword. Every article carries market context (price at publish time). | `GET /api/archive` |
| `get_archive_stats` | Coverage statistics for the historical archive: article counts, date range, sources and categories. | `GET /api/archive?stats=true` |
| `get_regulatory_news` | Regulatory and legal developments: SEC, CFTC, MiCA, court rulings, enforcement. Filter by jurisdiction, agency, sector or lookback window, or ask for jurisdiction profiles, agencies, deadlines or an intelligence summary. | `GET /api/regulatory` |
| `get_portfolio_news` | News for a specific set of holdings, optionally with live prices for each coin. Use when the user names the coins they hold. | `GET /api/portfolio` |
| `get_daily_digest` | A compiled digest of the most important stories over the last 6, 12 or 24 hours, in full, brief or newsletter form. | `GET /api/digest` |
| `list_categories` | Every news category the API understands, with article counts. Use the ids as the category argument of get_latest_news. | `GET /api/news/categories` |

### Analysis (6)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_trending_topics` | Topics trending across the news flow right now, each tagged bullish, bearish or neutral with sample headlines. | `GET /api/trending` |
| `get_narratives` | The narratives currently driving coverage (e.g. RWA, restaking, ETF flows) with momentum, sentiment and related tickers. emerging=true surfaces narratives that are just starting to pick up. | `GET /api/narratives` |
| `get_sentiment` | AI sentiment for one asset or the whole market: score, confidence, and the headlines that drove it. | `GET /api/sentiment` |
| `analyze_news` | Recent articles with topic classification and sentiment labels, filterable by topic or sentiment. Good for "show me bearish regulation stories". | `GET /api/analyze` |
| `get_trading_signals` | News-derived trading signals with direction, confidence and the evidence behind each. Filter by ticker or minimum confidence. | `GET /api/signals` |
| `get_social_sentiment` | Aggregate social-media sentiment (X, Reddit, Telegram) across the market. | `GET /api/social/sentiment` |

### Market (12)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_fear_greed` | Crypto Fear & Greed Index (0 = extreme fear, 100 = extreme greed) with daily history. | `GET /api/fear-greed` |
| `get_market_overview` | Total market cap, 24h volume, BTC/ETH dominance, active coins and market-cap change. | `GET /api/global` |
| `get_coin_prices` | Live USD prices with 24h change for any list of CoinGecko coin ids. | `GET /api/prices` |
| `get_top_coins` | Ranked coin table: price, market cap, volume, supply, 24h/7d change. Up to 250 coins. | `GET /api/market/coins` |
| `get_coin_detail` | Detailed market data for one coin: price, market cap, volume, supply, ATH, 24h/7d/30d change. | `GET /api/market/compare?ids=` |
| `compare_coins` | Side-by-side comparison of 2 to 25 coins: price, market cap, volume, performance. | `GET /api/market/compare` |
| `get_ohlc` | Open/high/low/close candles for one coin over 1 to 365 days. | `GET /api/ohlc` |
| `get_price_chart` | Price, market cap and volume time series for one coin over a named range (1h to all-time). | `GET /api/charts` |
| `get_top_gainers` | Best-performing coins over 1h, 24h or 7d. | `GET /api/market/gainers` |
| `get_top_losers` | Worst-performing coins over 1h, 24h or 7d. | `GET /api/market/losers` |
| `search_coins` | Resolve a name, symbol or partial string to CoinGecko coin ids. Use before price or chart tools when you only know a ticker. | `GET /api/market/search` |
| `get_market_dominance` | Market-cap dominance split across BTC, ETH, stablecoins and the rest. | `GET /api/market/dominance` |

### DeFi (6)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_defi_overview` | DeFi total value locked summary: overall TVL, top protocols and chains, 24h/7d changes. | `GET /api/defi/summary` |
| `get_defi_yields` | Yield opportunities with APY, TVL, chain and project. Filter by chain, project, APY band, minimum TVL or stablecoin-only pools. | `GET /api/defi/yields` |
| `get_stablecoins` | Stablecoin market caps, peg status and 24h/7d supply changes, optionally broken down by chain. | `GET /api/stablecoins` |
| `get_dex_volumes` | Decentralised exchange trading volumes by protocol, optionally for one chain. | `GET /api/dex-volumes` |
| `get_layer2_data` | TVL, activity and stats for Ethereum layer 2 networks (Arbitrum, Base, Optimism, zkSync and more). | `GET /api/l2` |
| `get_gas_prices` | Current Ethereum gas prices (slow/standard/fast in gwei), base fee and congestion. | `GET /api/gas` |

### Derivatives (6)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_funding_rates` | Perpetual futures funding rates across Binance, Bybit, OKX and Hyperliquid, with cross-exchange spreads. Positive means longs pay shorts. | `GET /api/funding` |
| `get_liquidations` | Recent forced liquidations across exchanges: totals, long/short split and largest events. | `GET /api/liquidations` |
| `get_derivatives` | Perpetual and futures tickers: open interest, volume, funding and basis across major venues. | `GET /api/derivatives` |
| `get_options_data` | Options market for BTC or ETH: dashboard, flow, volatility surface, max pain or gamma views. | `GET /api/options` |
| `get_orderbook` | Order book depth (bids, asks, spread, liquidity) for a pair on one or more exchanges. | `GET /api/trading/orderbook` |
| `get_arbitrage` | Cross-exchange price spreads for a symbol, ranked by spread or estimated profit. | `GET /api/trading/arbitrage` |

### On-chain (5)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_whale_alerts` | Large on-chain transfers between wallets and exchanges, with USD value and direction, across major chains. | `GET /api/whale-alerts` |
| `get_exchange_flows` | Net inflow/outflow of an asset to and from centralised exchanges, a classic accumulation or distribution signal. | `GET /api/onchain/exchange-flows` |
| `get_token_unlocks` | Upcoming token unlock schedules with amounts, USD value and share of circulating supply. calendar=true groups them by date. | `GET /api/unlocks` |
| `get_events_calendar` | Upcoming crypto events: conferences, hard forks, mainnet launches, token unlocks, macro dates. | `GET /api/events` |
| `get_airdrops` | Upcoming, active and ended airdrops with eligibility notes and estimated value. | `GET /api/airdrops` |

### Reference (5)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_exchanges` | Exchange directory ranked by trust score or volume: 24h volume, trust score, year established, country. | `GET /api/exchanges` |
| `list_sources` | Every news source the aggregator indexes, with ids (usable as the source argument elsewhere), tiers and feed URLs. | `GET /api/sources` |
| `get_source_health` | Health of the API and each upstream feed: status, latency, last successful fetch, failing sources. | `GET /api/health` |
| `get_macro_indicators` | Macro backdrop for crypto: rates, CPI, DXY, equities and their correlation with BTC. | `GET /api/macro` |
| `get_glossary` | Look up a crypto term or browse a glossary category. | `GET /api/glossary` |

### AI (3)

| Tool | Does | Calls |
| --- | --- | --- |
| `summarize_news` | AI-written summary of the latest articles, optionally for one source, as a brief, detailed prose or bullet points. | `GET /api/summarize` |
| `ask_crypto` | Ask a natural-language question about crypto news and markets; the answer is grounded in current articles and cites its sources. | `POST /api/ask` |
| `get_ai_brief` | AI-generated daily market brief: price action, sentiment, key stories and what to watch. | `GET /api/ai/brief` |

### Feeds & Discovery (2)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_rss_feeds` | RSS, Atom and OPML feed URLs for the news categories. Pass fetch=true to return the XML of one feed instead of just its URL. | `GET /api/rss \| GET /api/atom \| GET /api/opml` |
| `list_endpoints` | Discover the REST API behind these tools: the live OpenAPI path list (optionally filtered) plus the endpoint each MCP tool maps to. | `GET /api/openapi.json` |

### Provenance (4)

| Tool | Does | Calls |
| --- | --- | --- |
| `get_stories` | The news collapsed into events instead of headlines. One entry per story, with the outlet credited with publishing first and every outlet that followed, including how far behind each was. Use this instead of get_latest_news when the question is "what happened" rather than "what was published", when you need to avoid counting one event forty times, or when you want to know who broke something. Each story carries a confidence level and a plain-English reason; attribution rests on publisher timestamps, and a story whose timing cannot be verified reports originator: null rather than guessing. | `GET /api/stories` |
| `get_story` | Everything known about a single clustered story: the originating outlet, every outlet that followed in order, the lag for each, and the terms that grouped them as evidence. Story ids come from get_stories and stay stable while a story is in the analysis window; they are not permanent archive identifiers. | `GET /api/stories/{id}` |
| `get_source_leaderboard` | Ranks news outlets by how often they published first across the current window, with median lag when they followed. Unlike any "top crypto news sites" list, this is measured from publication times over clustered stories rather than from traffic or popularity. Read meta.caveats before quoting it: the window is hours not history, timing comes from publisher feeds which are frequently wrong, and publishing first says nothing about accuracy. An outlet with too little evidence reports a null rate rather than a flattering percentage. | `GET /api/sources/leaderboard` |
| `get_source_health` | Per-source liveness for the RSS layer: success rate, latency, last error and last successful fetch. A feed that fails is turned into an empty result so one dead source never breaks the aggregate, which also means a source can rot invisibly. Use this to check whether thin coverage of a topic reflects the news or a broken feed. | `GET /api/sources/health` |

<!-- TOOLS:END -->

## Resources

| URI | Contents |
| --- | --- |
| `news://latest` | Latest headlines |
| `news://breaking` | Last two hours |
| `news://trending` | Trending topics |
| `market://overview` | Global market snapshot |
| `market://fear-greed` | Fear and Greed index |
| `defi://overview` | DeFi TVL and protocol summary |

## Prompts

| Prompt | Produces |
| --- | --- |
| `daily_brief` | A market brief from today's news, prices and sentiment |
| `coin_deep_dive` | A full workup on one asset: news, price action, on-chain |
| `defi_yield_scan` | Current yields with the risk context around them |

---

## Development

```bash
npm install
npm run build        # tsc -> dist/
npm run dev          # stdio server via tsx, no build step
npm run dev:http     # HTTP server via tsx
npm run typecheck
npm test             # offline: protocol handshake + registry invariants
npm run test:live    # additionally calls one tool against production
npm run docs:tools   # regenerate the tool table above from the registry
```

Source layout:

| File | Role |
| --- | --- |
| `src/api.ts` | HTTP client: URL building, timeouts, x402 handling, error shaping |
| `src/tools.ts` | The tool registry. One entry per tool, each naming its REST route |
| `src/resources.ts` | MCP resources |
| `src/prompts.ts` | MCP prompts |
| `src/server.ts` | Wires the registry into an MCP `Server` |
| `src/index.ts` | stdio entry point |
| `src/http.ts` | Streamable HTTP entry point |

Adding a tool means adding one entry to `src/tools.ts` with its `endpoint`, then running `npm run docs:tools`. The smoke test enforces that every tool has a unique snake_case name, a real description, and a route under `/api/`.

---

## Links

- API docs: <https://cryptocurrency.cv/developers>
- OpenAPI: <https://cryptocurrency.cv/api/openapi.json>
- LLM reference: <https://cryptocurrency.cv/llms.txt>
- Repository: <https://github.com/nirholas/cryptocurrency.cv>

## License

See [LICENSE](../LICENSE). The hosted API is free to use.
