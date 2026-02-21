# Architecture

Free Crypto News is a Next.js application built with the App Router, TypeScript, and Tailwind CSS. It aggregates crypto news from 200+ RSS/Atom feeds and exposes the data as a JSON REST API, embeddable widgets, real-time streams, and AI-ready endpoints.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS 3 |
| Styling | next-themes (dark mode), Framer Motion |
| API Runtime | Vercel Edge Runtime (82% of routes) |
| Caching | Vercel KV / Upstash Redis (in-memory fallback) |
| Archive | Static JSON files — `archive/` |
| Search | `archive/indexes/` + full-text route |
| Internationalisation | `next-intl` (40+ locales) |
| Testing | Vitest + Playwright |

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
│   ├── api/                     # API routes (serverless / edge)
│   │   ├── news/                # /api/news — main feed
│   │   ├── search/              # /api/search
│   │   ├── article/             # /api/article — AI summary, extraction
│   │   ├── market/              # /api/market — price data
│   │   ├── ai/                  # /api/ai — sentiment, summaries, RAG
│   │   ├── v2/                  # /api/v2 — stable versioned endpoints
│   │   ├── og/                  # /api/og — dynamic Open Graph images
│   │   └── ...
│   └── layout.tsx               # Root layout + providers
├── components/                  # Shared React components
│   ├── cards/                   # ArticleCardLarge/Medium/Small/List
│   ├── rag-chat/                # RAG chat interface
│   ├── ui/                      # Base primitives (Button, Modal, …)
│   └── ...
└── lib/                         # Pure utilities
    ├── archive-v2.ts            # Archive read/write helpers
    ├── distributed-cache.ts     # Redis / in-memory cache abstraction
    ├── news-sources.ts          # Source registry (200+ feeds)
    ├── unsplash-fallback.ts     # Image fallback pool
    └── ...

archive/                         # Static JSON data store
├── index.json                   # Latest ~1000 articles
├── articles/                    # Individual article JSON files
├── indexes/                     # Source / category / date indexes
├── market/                      # Hourly market snapshots
├── social/                      # Social sentiment data
├── onchain/                     # On-chain metrics
└── YYYY/MM/DD/                  # Daily archives

public/                          # Static assets
├── sw.js                        # Service Worker (offline support)
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

`next-intl` wraps all user-facing routes under `[locale]`. 40+ locales are supported. Translation files live in `messages/`. The `docs:translate` script auto-translates docs via the API.

---

## Related docs

- [Scalability](SCALABILITY.md) — caching, edge runtime, load handling
- [Developer Guide](DEVELOPER-GUIDE.md) — component reference, extending the app
- [API Reference](API.md) — endpoint catalogue
- [Deployment](DEPLOYMENT.md) — hosting options
