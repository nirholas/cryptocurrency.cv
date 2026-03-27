# Architecture

Free Crypto News is a Next.js application built with the App Router, TypeScript, and Tailwind CSS. It aggregates crypto news from 200+ RSS/Atom feeds and exposes the data as a JSON REST API, embeddable widgets, real-time streams, and AI-ready endpoints.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19 + Tailwind CSS 4 |
| Styling | next-themes (dark mode), Framer Motion |
| API Runtime | Vercel Edge Runtime (82% of routes) |
| Database | Drizzle ORM + Neon (serverless Postgres) |
| Caching | Vercel KV / Upstash Redis (in-memory fallback) |
| Background Jobs | Inngest (event-driven functions) |
| Observability | OpenTelemetry (traces + metrics via OTLP HTTP), Pino (structured logging) |
| Archive | Static JSON files — `archive/` |
| Search | `archive/indexes/` + full-text route + RAG vector search |
| Internationalisation | `next-intl` (42 locales) |
| AI | Google Gemini, OpenAI, Anthropic, Groq (pluggable providers) |
| Payments | x402 (crypto-native HTTP 402 payments) |
| Testing | Vitest (unit), Playwright (E2E), Storybook 10 (visual) |
| Package manager | pnpm (install) + Bun (scripts) |
| Docs site | MkDocs (Material theme) |

---

## Directory layout

```
src/
├── app/                         # Next.js App Router
│   ├── [locale]/                # i18n wrapper — all user-facing pages
│   │   ├── page.tsx             # Homepage — latest news feed
│   │   ├── article/[slug]/      # Article detail
│   │   ├── category/[slug]/     # Category feed
│   │   ├── source/[source]/     # Source feed
│   │   ├── coin/[coinId]/       # Coin-specific news
│   │   ├── search/              # Full-text search
│   │   ├── read/                # Reading mode
│   │   └── ...
│   ├── api/                     # 150+ API routes (mostly Edge Runtime)
│   │   ├── news/                # /api/news — main news feed
│   │   ├── search/              # /api/search — full-text search
│   │   ├── article/             # /api/article — AI summary, extraction
│   │   ├── market/              # /api/market — price data, charts
│   │   ├── ai/                  # /api/ai — sentiment, summaries, RAG
│   │   ├── onchain/             # /api/onchain — on-chain metrics, whale alerts
│   │   ├── defi/                # /api/defi — yields, TVL, DEX volumes
│   │   ├── sentiment/           # /api/sentiment — market sentiment analysis
│   │   ├── sse/                 # /api/sse — Server-Sent Events stream
│   │   ├── rss/ , atom/ , opml/ # Feed endpoints (RSS, Atom, OPML)
│   │   ├── v1/ , v2/            # Versioned stable endpoints
│   │   ├── og/                  # /api/og — dynamic Open Graph images
│   │   ├── cron/                # Scheduled jobs (archive sync, sentiment)
│   │   ├── webhooks/            # Webhook delivery
│   │   └── ...
│   └── layout.tsx               # Root layout + providers
├── components/                  # 170+ React components
│   ├── cards/                   # ArticleCardLarge/Medium/Small/List
│   ├── rag-chat/                # RAG chat interface
│   ├── charts/                  # Market charts (Recharts)
│   ├── admin/                   # Admin dashboard components
│   ├── ui/                      # Base primitives (Button, Modal, …)
│   └── ...
├── hooks/                       # Custom React hooks
├── i18n/                        # Internationalization config
├── types/                       # TypeScript type definitions
├── __tests__/                   # Unit tests
└── lib/                         # 200+ library modules
    ├── archive-v2.ts            # Archive read/write helpers
    ├── distributed-cache.ts     # Redis / in-memory cache abstraction
    ├── news-sources.ts          # Source registry (200+ feeds)
    ├── rate-limiter.ts          # Distributed rate limiting
    ├── ai/                      # AI service integrations
    ├── market/                  # Market data providers
    ├── analytics/               # Analytics and metrics
    ├── security/                # Security utilities
    ├── rag/                     # RAG pipeline (embeddings, vector search)
    └── ...

archive/                         # Static JSON data store
├── index.json                   # Latest ~1000 articles
├── articles/                    # Individual article JSON files
├── indexes/                     # Source / category / date indexes
├── market/                      # Hourly market snapshots
├── social/                      # Social sentiment data
├── onchain/                     # On-chain metrics
├── predictions/                 # Market predictions archive
├── search/                      # Search index data
├── snapshots/                   # Point-in-time snapshots
└── YYYY/MM/DD/                  # Daily archives (2021–present)

mcp/                             # Claude MCP server
├── index.js                     # stdio transport (Claude Desktop)
└── http-server.js               # HTTP/SSE transport (ChatGPT, etc.)

sdk/                             # Official SDKs (13 languages)
├── python/ , typescript/ , go/  # Tier 1 SDKs
├── react/                       # React hooks & components
├── php/ , ruby/ , rust/         # Community SDKs
├── java/ , kotlin/ , swift/     # Mobile / JVM SDKs
├── csharp/ , r/                 # Specialised SDKs
└── javascript/                  # Vanilla JS SDK

widget/                          # Embeddable HTML widgets
├── crypto-news-widget.html      # Full news widget
├── carousel.html / carousel.js  # News carousel
└── ticker.html / ticker.js      # Price ticker

scripts/                         # Build, archive, and automation scripts
public/                          # Static assets
├── sw.js                        # Service Worker (offline + push notifications)
└── manifest.json                # PWA manifest
```

---

## Request flow

```
Browser / API client
        │
        ▼
  Vercel Edge CDN
        │  cache hit → returns immediately
        │  cache miss ↓
        ▼
  Next.js Edge Route Handler
        │
        ├──► archive/ (static JSON reads)      ← fastest path
        ├──► distributed-cache (Redis / KV)    ← hot data
        └──► upstream RSS feeds / price APIs   ← on cache miss
```

---

## Caching strategy

The `distributed-cache.ts` module provides a unified interface with **stale-while-revalidate** semantics:

```
newsCache        TTL 5 min  | stale 1 min
marketCache      TTL 1 min  | stale 30 s
aiCache          TTL 1 hour | stale 5 min
translationCache TTL 24 h   | stale 1 h
```

In development it falls back to an in-memory LRU cache. In production it uses `KV_REST_API_URL` (Upstash Redis / Vercel KV).

---

## Data pipeline

```
RSS / Atom feeds (200+ sources)
        │  archive scripts (scripts/)
        ▼
archive/articles/*.json          (individual articles)
        │
archive/index.json               (rolling latest)
        │
archive/indexes/                 (source, category, date)
        │
/api/v2/news → Next.js routes → clients
```

Archive scripts run via cron (GitHub Actions / Railway cron) and commit updated JSON. The Next.js app reads from the static archive — there is no database.

---

## AI / RAG architecture

```
User query
    │
    ▼
/api/ai/chat  (Edge)
    │
    ├──► Vector search → archive/search/ index
    │         (cosine similarity over article embeddings)
    │
    ├──► Retrieved article chunks (context)
    │
    └──► LLM (OpenAI / Anthropic) with injected context
              │
              ▼
         Streaming response → client
```

---

## Image fallback chain

All article cards use a three-tier image strategy:

1. **Article's own image** (`imageUrl` from RSS)
2. **Unsplash fallback** — deterministic crypto photo keyed to the source name (`src/lib/unsplash-fallback.ts`)
3. **Source gradient** — coloured gradient + source initial letter (`src/components/cards/CardImage.tsx`)

---

## Internationalisation

`next-intl` wraps all user-facing routes under `[locale]`. 42 locales are supported. Translation files live in `messages/`. The `i18n:translate` script auto-translates docs via the API.

---

## Database & storage architecture

The project uses a **hybrid storage** approach:

```
                    ┌───────────────────────┐
                    │   Neon (Postgres)      │
                    │   via Drizzle ORM      │
                    │   • User data          │
                    │   • API keys           │
                    │   • Predictions        │
                    │   • Analytics          │
                    └───────────┬───────────┘
                                │
    ┌───────────────────────────┼───────────────────────────┐
    │                           │                           │
    ▼                           ▼                           ▼
┌───────────┐          ┌───────────────┐          ┌───────────────┐
│  Archive  │          │ Upstash Redis │          │  In-memory    │
│  (JSON)   │          │  / Vercel KV  │          │  LRU cache    │
│ • Articles│          │ • Hot data    │          │ • Dev fallback│
│ • Indexes │          │ • Rate limits │          │ • Single-node │
│ • Market  │          │ • Sessions    │          │               │
│ • Social  │          │ • Counters    │          │               │
└───────────┘          └───────────────┘          └───────────────┘
```

### Storage backend priority

The `distributed-cache.ts` module auto-selects the best available backend:

1. **Vercel KV** — when `KV_REST_API_URL` is set (Vercel deployments)
2. **Upstash Redis** — when `UPSTASH_REDIS_REST_URL` is set
3. **In-memory LRU** — automatic fallback (development, single-instance)

### Drizzle ORM

Database schema is managed with Drizzle Kit. Migrations live in `drizzle/`:

```bash
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply pending migrations
bun run db:push       # Push schema directly (dev only)
bun run db:studio     # Open Drizzle Studio GUI
```

---

## Rate limiting

The API implements a **distributed sliding-window** rate limiter:

| Tier | Limit | Window | Description |
|------|-------|--------|-------------|
| Anonymous (no key) | 10 req | 1 hour | `/api/sample` only |
| x402 micropayment | Unlimited | — | $0.001/req in USDC on Base |
| Pro API key | 50,000 req | 1 day | Pro subscribers ($29/mo) |
| Enterprise key | 500,000 req | 1 day | Enterprise customers ($99/mo) |
| Internal / SperaxOS | Unlimited | — | Server-to-server |

> **Free API keys are no longer issued.** All endpoints except `/api/sample` require payment.

Expensive endpoints (AI, export, search, backtest) also have per-route limits (5–30 req/min 
depending on the endpoint) applied in addition to the tier limit.

Rate limit state is stored in Redis (or in-memory fallback). Response headers include:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709312400
```

---

## Real-time architecture

```
                  ┌──────────────────────┐
                  │   Clients            │
                  │   (browsers, bots)   │
                  └──────┬───────┬───────┘
                         │       │
      SSE (Vercel)──────┘       └──────WebSocket (Railway/Docker)
                         │       │
            ┌────────────▼──┐  ┌─▼────────────────┐
            │ /api/sse      │  │ ws-server.js      │
            │ Edge Runtime  │  │ Node.js process   │
            │ event: news   │  │ rooms: topics,    │
            │ event: break  │  │   coins, #general │
            │ event: price  │  │ auto-reconnect    │
            └────────────┬──┘  └─┬────────────────┘
                         │       │
                         ▼       ▼
                   ┌─────────────────┐
                   │  News pipeline  │
                   │  (RSS ingest +  │
                   │   archive sync) │
                   └─────────────────┘
```

- **SSE** (Server-Sent Events) — primary real-time channel on Vercel (Edge Runtime, no WebSocket support)
- **WebSocket** — full-duplex channel available on Railway / Docker / self-hosted deployments
- **Push notifications** — VAPID-based web push via Service Worker
- **Webhooks** — outbound HTTP POST to registered URLs on new articles

---

## Error handling strategy

### API routes

All API routes follow a consistent error response format:

```json
{
  "error": "Human-readable message",
  "code": "RATE_LIMIT_EXCEEDED",
  "status": 429,
  "timestamp": "2026-03-01T12:00:00Z"
}
```

Standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request (invalid parameters) |
| 401 | Authentication required |
| 402 | Payment required (x402 premium endpoints) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Upstream source unavailable |

### Graceful degradation

The app is designed to work with **zero external dependencies**:

- No Redis → in-memory cache
- No database → archive JSON as primary store
- No AI key → AI endpoints return helpful error messages
- No upstream RSS → serves cached/archived articles

---

## Observability

### OpenTelemetry

Instrumentation is configured in `instrumentation.ts`:

```
App → OTLP HTTP exporter → Collector → Backend (Jaeger, Grafana, etc.)
```

Traces cover:
- Incoming HTTP requests
- Outgoing fetch calls (RSS feeds, price APIs)
- Cache hits/misses
- Database queries

### Structured logging

[Pino](https://github.com/pinojs/pino) is used for JSON-structured logs:

```json
{"level":30,"time":1709312400,"msg":"RSS fetch completed","source":"coindesk","articles":12,"duration":340}
```

### Health endpoint

`/api/health` returns system status:

```json
{
  "status": "healthy",
  "uptime": 86400,
  "cache": "redis",
  "version": "1.x.x",
  "timestamp": "2026-03-01T12:00:00Z"
}
```

---

## Security architecture

### Defence in depth

```
Client → Vercel Edge CDN (DDoS protection, WAF)
       → Security headers middleware (CSP, HSTS, X-Frame-Options)
       → Rate limiter (sliding-window, per-IP or per-key)
       → Input validation (Zod schemas)
       → Route handler logic
       → Output sanitization
```

Key security measures:
- **Content Security Policy** — restrictive CSP via middleware
- **CORS** — configurable allowed origins
- **Input validation** — Zod schemas on all user input
- **Output encoding** — prevents XSS in rendered content
- **Dependency scanning** — Dependabot + CodeQL
- **Secret management** — environment variables only, never committed

See [Security Policy](SECURITY.md) for vulnerability reporting.

---

## CI/CD pipeline

The project deploys via **platform-native CI/CD** (no GitHub Actions):

| Platform | Trigger | Pipeline |
|----------|---------|----------|
| Vercel | Git push to `main` | Build → Deploy → Health check |
| Railway | Git push to `main` | Nixpacks build → Deploy |
| Docker | Manual `docker build` | Multi-stage Dockerfile |

### Build process

```bash
pnpm install          # Install dependencies
bun run build         # Next.js production build (standalone output)
bun run start         # Start production server
```

The standalone output (`next.config.js: output: 'standalone'`) produces a minimal Node.js server with all dependencies bundled — ideal for Docker containers.

---

## Related docs

- [Scalability](SCALABILITY.md) — caching tiers, edge runtime, load handling
- [Database](DATABASE.md) — storage backends, Drizzle ORM, migrations
- [Developer Guide](DEVELOPER-GUIDE.md) — component reference, extending the app
- [API Reference](API.md) — endpoint catalogue (150+ endpoints)
- [Deployment](DEPLOYMENT.md) — hosting options and configuration
- [Real-Time](REALTIME.md) — SSE, WebSocket, push notifications, webhooks
- [Security](SECURITY.md) — security policy and reporting
