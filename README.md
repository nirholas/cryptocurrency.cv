---
name: Free Crypto News API
type: api
category: cryptocurrency
auth: none
pricing: free
endpoints: 450+
sources: 300+
llms_txt: https://cryptocurrency.cv/llms.txt
openapi: https://cryptocurrency.cv/api/openapi.json
mcp_server: https://cryptocurrency.cv/api/mcp (hosted) or npx -y @nirholas/free-crypto-news-mcp (local)
license: source-available (all rights reserved), hosted API free to use
---

🌐 **Languages (42):** English | [العربية](locales/README.ar.md) | [Български](locales/README.bg.md) | [বাংলা](locales/README.bn.md) | [Čeština](locales/README.cs.md) | [Dansk](locales/README.da.md) | [Deutsch](locales/README.de.md) | [Ελληνικά](locales/README.el.md) | [Español](locales/README.es.md) | [فارسی](locales/README.fa.md) | [Suomi](locales/README.fi.md) | [Français](locales/README.fr.md) | [עברית](locales/README.he.md) | [हिन्दी](locales/README.hi.md) | [Hrvatski](locales/README.hr.md) | [Magyar](locales/README.hu.md) | [Indonesia](locales/README.id.md) | [Italiano](locales/README.it.md) | [日本語](locales/README.ja.md) | [한국어](locales/README.ko.md) | [Melayu](locales/README.ms.md) | [Nederlands](locales/README.nl.md) | [Norsk](locales/README.no.md) | [Polski](locales/README.pl.md) | [Português](locales/README.pt.md) | [Română](locales/README.ro.md) | [Русский](locales/README.ru.md) | [Slovenčina](locales/README.sk.md) | [Slovenščina](locales/README.sl.md) | [Српски](locales/README.sr.md) | [Svenska](locales/README.sv.md) | [Kiswahili](locales/README.sw.md) | [தமிழ்](locales/README.ta.md) | [తెలుగు](locales/README.te.md) | [ไทย](locales/README.th.md) | [Filipino](locales/README.tl.md) | [Türkçe](locales/README.tr.md) | [Українська](locales/README.uk.md) | [اردو](locales/README.ur.md) | [Tiếng Việt](locales/README.vi.md) | [简体中文](locales/README.zh-CN.md) | [繁體中文](locales/README.zh-TW.md) · [all translations](locales/README.md)

# 🆓 Free Crypto News API

<p align="center">
  <a href="https://github.com/nirholas/cryptocurrency.cv/stargazers"><img src="https://img.shields.io/github/stars/nirholas/cryptocurrency.cv?style=for-the-badge&logo=github&color=yellow" alt="GitHub Stars"></a>
  <a href="https://github.com/nirholas/cryptocurrency.cv/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-source--available-blue?style=for-the-badge" alt="License: source-available"></a>
  <a href="https://github.com/nirholas/cryptocurrency.cv/issues"><img src="https://img.shields.io/github/issues/nirholas/cryptocurrency.cv?style=for-the-badge&color=orange" alt="Issues"></a>
</p>

<p align="center">
  <a href="https://github.com/nirholas/cryptocurrency.cv/commits/main"><img src="https://img.shields.io/github/last-commit/nirholas/cryptocurrency.cv?style=flat-square" alt="Last Commit"></a>
  <a href="https://github.com/nirholas/cryptocurrency.cv/graphs/contributors"><img src="https://img.shields.io/github/contributors/nirholas/cryptocurrency.cv?style=flat-square" alt="Contributors"></a>
  <a href="https://www.npmjs.com/package/@nirholas/crypto-news"><img src="https://img.shields.io/npm/v/@nirholas/crypto-news?style=flat-square&label=%40nirholas%2Fcrypto-news" alt="npm"></a>
  <a href="https://cryptocurrency.cv/api/mcp"><img src="https://img.shields.io/badge/MCP-hosted%20endpoint-5B4EFF?style=flat-square" alt="MCP Server"></a>
  <a href="https://cryptocurrency.cv/api/openapi.json"><img src="https://img.shields.io/badge/OpenAPI-3.1-6BA539?style=flat-square" alt="OpenAPI"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-what-you-get">What You Get</a> •
  <a href="#-endpoints">Endpoints</a> •
  <a href="#-mcp-server">MCP</a> •
  <a href="#-self-hosting">Self-Host</a> •
  <a href="https://cryptocurrency.cv/developers">Docs</a>
</p>

<p align="center">
  <img src=".github/demo.svg" alt="Free Crypto News API Demo" width="700">
</p>

Real-time crypto news from **300+ sources** with one HTTP call. No API key, no signup, no rate-limit paperwork. Live at **[cryptocurrency.cv](https://cryptocurrency.cv)**.

**For AI agents:** `curl https://cryptocurrency.cv/api/news` • [llms.txt](https://cryptocurrency.cv/llms.txt) • [llms-full.txt](https://cryptocurrency.cv/llms-full.txt) • [OpenAPI](https://cryptocurrency.cv/api/openapi.json) • MCP: `https://cryptocurrency.cv/api/mcp` • [AGENTS.md](AGENTS.md) • [SKILLS.md](SKILLS.md)

> ⭐ If this saves you time, star the repo. It helps others find it.

---

## ⚡ Quick Start

Thirty seconds, no key required. cURL works as-is:

```bash
# Latest headlines from every source
curl https://cryptocurrency.cv/api/news

# Only the last two hours
curl https://cryptocurrency.cv/api/breaking

# Full-text search
curl "https://cryptocurrency.cv/api/search?q=bitcoin%20etf"

# Filter by category, cap the result size
curl "https://cryptocurrency.cv/api/news?category=defi&limit=20"

# Ask a question, answered from today's news (AI)
curl "https://cryptocurrency.cv/api/ask?q=why%20is%20ETH%20up%20today"
```

Every endpoint returns JSON, is CORS-enabled, and works from a browser, a script, or an agent tool call. Response shape:

```json
{
  "articles": [
    {
      "title": "Bitcoin Hits New ATH",
      "link": "https://coindesk.com/...",
      "description": "Bitcoin surpassed...",
      "pubDate": "2026-01-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2h ago"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2026-01-02T14:30:00Z"
}
```

From code, `npm install @nirholas/crypto-news`:

```ts
import { CryptoNews } from '@nirholas/crypto-news';
const news = await new CryptoNews().getLatest(10);
```

Python, Go, PHP, Rust, Ruby, Swift, Kotlin, Java, C#, and R clients live in [`sdk/`](sdk/) as copy-in source; runnable samples for bots, agents, and 12 languages live in [`examples/`](examples/).

---

## 🎁 What You Get

| Capability | Details |
| --- | --- |
| **Sources** | 300+ RSS feeds in 21 categories plus 77 international outlets (KO, ZH, JA, ES and more) with on-the-fly translation. Tiered by credibility. [Details](docs/reference/international-sources.md) |
| **Endpoints** | 450+ routes: news, search, categories, market data, DeFi, whales, regulatory, portfolio, trading signals, feeds. [Catalog](docs/reference/endpoints.md) |
| **Historical archive** | 662,047 articles from September 2017 onward, searchable by date, ticker, sentiment and full text. [Archive](docs/reference/archive.md) |
| **AI endpoints** | Summaries, sentiment, fact-checks, narratives, research mode, RAG over the archive, daily briefs. Free, powered by Groq. [AI docs](docs/AI-FEATURES.md) |
| **MCP server** | Hosted Streamable-HTTP endpoint plus a local stdio server, 40+ tools. [Below](#-mcp-server) |
| **Feeds and streaming** | RSS 2.0, Atom, OPML, Server-Sent Events, WebSocket. [Realtime](docs/REALTIME.md) |
| **Widgets** | Drop-in HTML/JS news ticker and carousel. [`widget/`](widget/) |
| **Web app** | 89 pages: dashboards, portfolio, watchlists, alerts, charts, installable PWA. [Pages](docs/reference/pages.md) |
| **SDK examples** | Clients in [`sdk/`](sdk/), samples in [`examples/`](examples/), guides in [`docs/sdks/`](docs/sdks/index.md) |
| **Agent-ready** | `llms.txt`, OpenAPI 3.1, `/.well-known/agent.json`, `/.well-known/ai-plugin.json`, x402 micropayments for premium routes. [AGENTS.md](AGENTS.md) |

### How it compares

|                   | Free Crypto News                | CryptoPanic  | Others   |
| ----------------- | ------------------------------- | ------------ | -------- |
| **Price**         | 🆓 Free                         | $29-299/mo   | Paid     |
| **API Key**       | ❌ None needed                  | Required     | Required |
| **Rate Limit**    | Unlimited\*                     | 100-1000/day | Limited  |
| **Sources**       | 300+ English + 77 international | 1            | Varies   |
| **Historical**    | 📚 662,000+ articles (2017-2026) | Limited      | None     |
| **International** | 🌏 KO, ZH, JA, ES + translation | No           | No       |
| **Self-host**     | ✅ Docker / Cloud Run / Vercel  | No           | No       |
| **PWA**           | ✅ Installable                  | No           | No       |
| **MCP**           | ✅ Hosted + local               | No           | No       |
| **SDK examples**  | 12 languages                    | 0            | 1-2      |
| **AI Features**   | 30+ AI endpoints (free)         | No           | No       |

\* Fair use. Cache on your side and identify your client with a `User-Agent`; abusive traffic gets throttled.

---

## 🔌 Endpoints

A compact map of the API, grouped by area. The interactive explorer is at **[cryptocurrency.cv/developers](https://cryptocurrency.cv/developers)**, the narrative reference is [docs/API.md](docs/API.md), and the complete 450+ route catalog is [docs/reference/endpoints.md](docs/reference/endpoints.md).

| Area | Endpoints | Notes |
| --- | --- | --- |
| **News** | `/api/news`, `/api/breaking`, `/api/search?q=`, `/api/news?category=` | `limit`, `source`, `page`, `category` params |
| **Categories** | `/api/bitcoin`, `/api/defi`, `/api/news?category=institutional` | 21 categories, see the catalog |
| **International** | `/api/news/international?lang=ko`, `/api/news?translate=es` | 77 outlets, 18 translation targets |
| **AI** | `/api/ask`, `/api/ai` (summarize, sentiment, fact-check), `/api/ai/summarize`, `/api/ai/narratives`, `/api/ai/research`, `/api/ai/brief`, `/api/rag`, `/api/predictions` | Free via Groq |
| **Sentiment and social** | `/api/sentiment`, `/api/fear-greed`, `/api/trending`, `/api/social` | Includes X/Twitter sentiment without a key |
| **Market data** | `/api/market`, `/api/prices`, `/api/defi`, `/api/gas`, `/api/yields`, `/api/hyperliquid` | Prices, DeFi, gas, derivatives |
| **On-chain** | `/api/whales`, `/api/whale-alerts`, `/api/flows`, `/api/liquidations`, `/api/unlocks` | Whale alerts, exchange flows, unlock calendar |
| **Portfolio and signals** | `/api/portfolio`, `/api/signals`, `/api/alerts` | Portfolio-aware news, trading signals |
| **Archive** | `/api/archive?date=2024-01`, `?ticker=BTC`, `?q=`, `?stats=true` | 662k articles, see [archive](docs/reference/archive.md) |
| **Feeds** | `/api/rss`, `/api/atom`, `/api/opml`, `/api/sse`, WebSocket | Streaming and syndication |
| **Meta** | `/api/sources`, `/api/health`, `/api/openapi.json`, `/api/stats` | Source list, uptime, spec |
| **Premium (x402)** | `/api/premium/*`, `/.well-known/x402` | Pay per call with USDC, no account. [x402 docs](docs/X402.md) |
| **x402 conformance** | `/api/x402/conformance` | Audit any x402 API's discovery contract against the challenges it actually returns. [docs](docs/x402-conformance.md), [page](https://cryptocurrency.cv/x402/conformance) |
| **Versioned** | `/api/v1/*` | Stable aliases for everything above |

### AI endpoint examples

The AI routes need no key either. They run on the hosted Groq integration:

```bash
# Natural-language question over today's news
curl "https://cryptocurrency.cv/api/ask?q=what%20happened%20with%20the%20SEC%20this%20week"

# One-paragraph summary of the current feed
curl "https://cryptocurrency.cv/api/ai/summarize"

# Emerging narratives, ranked by momentum
curl "https://cryptocurrency.cv/api/ai/narratives?emerging=true"

# Daily brief for a given date
curl "https://cryptocurrency.cv/api/ai/brief?date=2026-08-26&format=summary"

# Retrieval-augmented answer over the 662k-article archive
curl "https://cryptocurrency.cv/api/rag?q=bitcoin%20etf%20approval%20timeline"
```

### Historical archive

662,047 articles (CryptoPanic English coverage from September 2017 plus Odaily Chinese coverage), enriched with tickers, named entities, sentiment and the BTC/ETH price and Fear & Greed reading at capture time.

```bash
curl "https://cryptocurrency.cv/api/archive?date=2024-01"                 # one month
curl "https://cryptocurrency.cv/api/archive?ticker=BTC&limit=100"          # by ticker
curl "https://cryptocurrency.cv/api/archive?q=bitcoin%20etf"               # full text
curl "https://cryptocurrency.cv/api/archive?start_date=2025-01-01&end_date=2025-01-07"
curl "https://cryptocurrency.cv/api/archive?stats=true"                    # counts and coverage
```

Schema, directory layout and every query parameter: [docs/reference/archive.md](docs/reference/archive.md).

---

## 🔮 MCP Server

Use the whole API from Claude Desktop, Claude Code, Cursor, or any Model Context Protocol client. 40+ tools (news, search, archive, sentiment, market data, portfolio); the full tool list is in [mcp/README.md](mcp/README.md).

**Hosted endpoint, zero install.** A Streamable-HTTP server runs at `https://cryptocurrency.cv/api/mcp`:

```json
{
  "mcpServers": {
    "crypto-news": {
      "url": "https://cryptocurrency.cv/api/mcp"
    }
  }
}
```

Claude Code, one line:

```bash
claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp
```

**Local stdio server.** The same tools on your machine, published as [`@nirholas/free-crypto-news-mcp`](https://www.npmjs.com/package/@nirholas/free-crypto-news-mcp) (source in [`mcp/`](mcp/)):

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

Or run it from a checkout: `git clone https://github.com/nirholas/cryptocurrency.cv.git && cd cryptocurrency.cv/mcp && npm install && node index.js`.

Other agent surfaces: a ChatGPT custom GPT and OpenAI plugin manifest (`/.well-known/ai-plugin.json`), Google A2A agent card (`/.well-known/agent.json`), LangChain and CrewAI samples in [`examples/agents/`](examples/agents/), and copy-paste integrations for Discord, Telegram, Slack and LangChain in [docs/reference/integrations.md](docs/reference/integrations.md).

---

## 🧩 Widgets

Embed a live news feed in any page with one script tag. Source and examples in [`widget/`](widget/).

```html
<div id="crypto-ticker" data-limit="20" data-category="all" data-theme="dark"></div>
<script src="https://cryptocurrency.cv/widget/ticker.js"></script>
```

`ticker.js` scrolls headlines, `carousel.js` renders cards, `embed.js` drops a full feed into a container. All three read `data-*` attributes for limit, category, speed and theme.

---

## 🐳 Self-Hosting

Everything runs from one Next.js app. All environment variables are optional; without any, you get the full news API. Set `GROQ_API_KEY` (free at [console.groq.com](https://console.groq.com/keys)) to switch on the AI endpoints. The complete variable list, Kubernetes manifests and observability stack are in [docs/reference/self-hosting.md](docs/reference/deployment.md).

**Docker**

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv
docker compose up -d
# API on http://localhost:3000/api/news
```

The [`Dockerfile`](Dockerfile) builds a standalone image; [`docker-compose.yml`](docker-compose.yml) adds Redis for caching. Scale-out and observability variants: [`docker-compose.scale.yml`](docker-compose.scale.yml), [`docker-compose.observability.yml`](docker-compose.observability.yml).

**Google Cloud Run**

```bash
gcloud builds submit --config cloudbuild.yaml
```

Step-by-step, including Artifact Registry, secrets and a custom domain: [docs/DEPLOY-GCP.md](docs/DEPLOY-GCP.md).

**Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Fcryptocurrency.cv)

**From source**

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
```

Railway, Render, DigitalOcean, CasaOS, Unraid and Portainer templates are in the repo root (`railway.json`, `render.yaml`, `.do/`, `casaos-app.yaml`, `unraid-template.xml`, `portainer-template.json`). General deployment notes: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 🏗️ Architecture

1. **Next.js 15 App Router** on the Edge and Node runtimes; [`src/app/api/`](src/app/api/) holds every route handler.
2. **Source registry** in [`src/lib/crypto-news.ts`](src/lib/crypto-news.ts) (RSS feeds by category) and [`src/lib/international-sources.ts`](src/lib/international-sources.ts); credibility tiers in [`src/lib/source-tiers.ts`](src/lib/source-tiers.ts).
3. **Fetch layer** pulls feeds in parallel with per-source timeouts, dedupes by content hash, and normalises to the article schema above.
4. **Caching** at three levels: in-memory, Redis (optional), and CDN `s-maxage` headers, so a cold fetch is rare.
5. **AI layer** calls Groq for summaries, sentiment, fact-checks and briefs; RAG indexes the archive into pgvector ([docs/RAG.md](docs/RAG.md)).
6. **Archive** is append-only JSONL by month, enriched with tickers, entities, sentiment and market context, exposed through `/api/archive`.
7. **Realtime** via SSE and a WebSocket server ([`ws-server.js`](ws-server.js)) fed by the same fetch layer.
8. **Payments**: premium routes are gated by x402; the facilitator lives in [`x402-facilitator/`](x402-facilitator/). The discovery contract those routes publish is audited by [`sdk/x402-conformance/`](sdk/x402-conformance/), which also ships standalone: `npx @nirholas/x402-conformance <origin>`.
9. **Agents**: MCP (hosted at `/api/mcp`, local in [`mcp/`](mcp/)), OpenAPI, `llms.txt`, and `/.well-known/*` manifests are generated from the same route metadata.
10. **Web app**: 89 pages of React server and client components, installable as a PWA, localised into 42 languages.

Deeper reading: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/reference/architecture.md](docs/reference/architecture.md), [docs/SCALABILITY.md](docs/SCALABILITY.md).

---

## 📚 Documentation

| Document | What it covers |
| --- | --- |
| [Developer portal](https://cryptocurrency.cv/developers) | Interactive endpoint explorer |
| [docs/API.md](docs/API.md) | API reference with parameters and examples |
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Five-minute integration guide |
| [docs/AI-FEATURES.md](docs/AI-FEATURES.md) | AI endpoints and RAG |
| [docs/sdks/](docs/sdks/index.md) | Per-language client guides |
| [docs/reference/](docs/reference/README.md) | Everything that used to live in this README: full endpoint catalog, pages, sources, archive, PWA, integrations, deployment, roadmap |
| [docs/USER-GUIDE.md](docs/USER-GUIDE.md) | Web app features and keyboard shortcuts |
| [AGENTS.md](AGENTS.md) / [SKILLS.md](SKILLS.md) | Agent integration guide and skill catalog |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## 🤝 Contributing

Bug fixes, new sources, translations and docs are all welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, [SUPPORT.md](SUPPORT.md) for where to ask questions, and [SECURITY.md](SECURITY.md) to report a vulnerability. Contributions are accepted under the repository license below.

- Add a news source: open an issue with the [new source template](.github/ISSUE_TEMPLATE/new_source.md) or edit `src/lib/crypto-news.ts`.
- Improve a translation: edit the file under [`locales/`](locales/README.md).

---

## 📄 License

Source-available, all rights reserved. See [LICENSE](LICENSE) for the code terms.

The hosted API at [cryptocurrency.cv](https://cryptocurrency.cv) is free to use, with or without attribution. Running the code yourself, redistributing it, or building a competing hosted service requires permission under the terms in LICENSE.

---

## ⭐ Star History

<a href="https://star-history.com/#nirholas/cryptocurrency.cv&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=nirholas/cryptocurrency.cv&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=nirholas/cryptocurrency.cv&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=nirholas/cryptocurrency.cv&type=Date" />
 </picture>
</a>
