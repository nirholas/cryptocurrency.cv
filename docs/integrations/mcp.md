# MCP Server

The [Model Context Protocol](https://modelcontextprotocol.io) server gives Claude, Cursor, ChatGPT, Windsurf and any other MCP client live crypto news, prices, DeFi, derivatives and on-chain data from cryptocurrency.cv.

No API key. No account. No signup.

There are two ways to run it, and the hosted one needs nothing installed at all.

!!! info "Source of truth"
    The tool tables in [`mcp/README.md`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/README.md) are generated from the tool registry itself (`npm run docs:tools`). If a count or a tool name here ever disagrees with that file, that file is right.

---

## Option 1: hosted endpoint (zero install)

The server runs on our infrastructure at `https://cryptocurrency.cv/api/mcp` over **Streamable HTTP**. It is stateless (one server instance per request), so it scales horizontally and stays up to date on its own.

**Claude Code**

```bash
claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp
```

**Claude Desktop, Cursor, Windsurf** (`claude_desktop_config.json`, `.cursor/mcp.json`, and friends)

```json
{
  "mcpServers": {
    "crypto-news": {
      "url": "https://cryptocurrency.cv/api/mcp"
    }
  }
}
```

**ChatGPT Developer Mode**, or any other Streamable HTTP client: add `https://cryptocurrency.cv/api/mcp` as the server URL with no authentication.

The hosted route exposes **47 tools**. It is served by the main Next.js app from `src/app/api/mcp/route.ts` and shares the tool registry in `src/lib/mcp/tools.ts`.

---

## Option 2: local server (stdio)

Runs on your machine and talks to the same public API. Useful behind a proxy, or when you want to point it at your own deployment. The published package is **`@nirholas/free-crypto-news-mcp`**.

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

The local server exposes **55 tools, 6 resources and 3 prompts** (the hosted route carries the tools only).

### From source

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv/mcp
npm install
npm run build
```

The build compiles TypeScript from `src/` into `dist/`, and the entry point is `dist/index.js`:

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
| `API_BASE` | `https://cryptocurrency.cv` | Point the server at another deployment, e.g. `http://localhost:3000` |
| `API_KEY` | none | Sent as `x-api-key`. Raises rate limits and unlocks paid endpoints |
| `API_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds |
| `PORT` | `3333` | Streamable HTTP mode only (`npm run start:http`) |

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
| Streamable HTTP | `npm run start:http` | Self-hosting the HTTP endpoint yourself |

Self-hosted HTTP mode serves the MCP endpoint at `POST /mcp` and a liveness probe at `GET /health` (also `GET /healthz`) on `PORT`. There is no SSE transport: Streamable HTTP replaced it in the MCP spec, and every current client speaks it.

---

## Tools

Every tool is read-only and maps onto one real REST route of the API, so anything a tool returns can also be fetched with `curl`. Read-only tools never trigger a confirmation prompt in ChatGPT Developer Mode.

| Group | Tools | Covers |
| --- | --- | --- |
| News | 10 | latest headlines, search, breaking, per-asset feeds |
| Analysis | 6 | sentiment, trending topics, article classification |
| Market | 12 | prices, tickers, global market data, fear and greed |
| DeFi | 6 | TVL, yields, protocol and chain breakdowns |
| Derivatives | 6 | funding rates, open interest, liquidations |
| On-chain | 5 | gas, whale transfers, wallet intelligence |
| Reference | 5 | source catalog, categories, health, version |
| AI | 3 | summaries, question answering, digests |
| Feeds & Discovery | 2 | `get_rss_feeds`, `list_endpoints` |

`list_endpoints` is the one to reach for when you want the live inventory: it returns the OpenAPI path list plus the REST route behind every MCP tool, so a model can discover the API without a docs round trip.

The full per-tool table, with the REST route each tool calls, lives in [`mcp/README.md`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/README.md#tools).

---

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

## Paid tools

Most tools are free and unauthenticated. A few sit behind the [x402](../X402.md) micropayment gate; those return a readable `Payment required` message naming the endpoint and its price rather than a raw HTTP error, so the model can explain the situation instead of retrying blindly. Set `API_KEY` to use them.

---

## Example prompts

- "Get me the latest crypto news"
- "Search for news about the Ethereum ETF"
- "What's happening in DeFi right now?"
- "Any breaking crypto news in the last two hours?"
- "Analyze recent news for bullish signals"
- "Get news for my portfolio: BTC, ETH, SOL, with prices"

In ChatGPT Developer Mode, be explicit about the app and tool name:

- "Use the Free Crypto News app's `get_crypto_news` tool to show me the latest headlines"
- "Call `get_trending_topics` to show what's trending in crypto right now"

---

## Troubleshooting

**The client does not list any tools.** Confirm the endpoint answers a protocol handshake:

```bash
curl -X POST https://cryptocurrency.cv/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

The `Accept` header matters: Streamable HTTP requires the client to accept both JSON and SSE, and a request without it is rejected by the transport.

**The local server will not start.** Node 18.17 or newer is required, and `dist/index.js` only exists after `npm run build`. Run `node dist/index.js` directly to see the error.

**Requests time out.** Check the API itself. It needs no key, and no browser user agent: cURL, wget and AI agents are all first-class callers.

```bash
curl https://cryptocurrency.cv/api/health
```

**Rate limited.** Anonymous callers get 120 requests per hour per IP on the free-tier routes. Set `API_KEY` for a higher tier.

---

## Source code

| File | Role |
| --- | --- |
| [`mcp/src/tools.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/src/tools.ts) | The local tool registry, one entry per tool |
| [`mcp/src/resources.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/src/resources.ts) | MCP resources |
| [`mcp/src/prompts.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/src/prompts.ts) | MCP prompts |
| [`mcp/src/index.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/src/index.ts) | stdio entry point |
| [`mcp/src/http.ts`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/src/http.ts) | Streamable HTTP entry point |
| [`mcp/README.md`](https://github.com/nirholas/cryptocurrency.cv/blob/main/mcp/README.md) | Full tool tables, generated from the registry |

## Related

- [Agents & Skills](../AGENTS.md)
- [ChatGPT Plugin](chatgpt.md)
- [API Reference](../API.md)
- [x402 Payments](../X402.md)

## License

Source-available: all rights reserved, see [LICENSE](https://github.com/nirholas/cryptocurrency.cv/blob/main/LICENSE). The hosted API and the hosted MCP endpoint are free to use.
