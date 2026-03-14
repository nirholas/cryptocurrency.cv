# 44 — Add API Versioning with /api/v1/ Prefix

## Goal

Introduce explicit API versioning to prevent breaking changes from disrupting consumers. The project already has a few `/api/v1/` routes (system/status, knowledge-graph, x402) but the vast majority of 100+ API routes are unversioned at `/api/`. Add a v1 prefix to all public-facing API endpoints while maintaining backward compatibility.

## Context

- **Framework:** Next.js 16 App Router (file-system routing)
- **Current routes:** 100+ API directories under `src/app/api/`
- **Already versioned:** `src/app/api/v1/` exists with system/status, knowledge-graph, x402
- **Consumers:** SDKs (Python, TypeScript, Go, React, PHP), ChatGPT plugin, MCP server, Telegram bot, CLI, embeddable widgets
- **OpenAPI spec:** `chatgpt/openapi.yaml` and `/api/openapi.json` route
- **Documentation:** `docs/API.md`, `llms.txt`, `llms-full.txt`

## Important Public-Facing API Routes to Version

These are the routes used by external consumers and documented in the API:

| Route | Purpose |
|-------|---------|
| `/api/news` | Main news endpoint |
| `/api/breaking` | Breaking news |
| `/api/trending` | Trending articles |
| `/api/search` | Full-text search |
| `/api/sources` | News source listing |
| `/api/stats` | API statistics |
| `/api/rss` | RSS feed generation |
| `/api/atom` | Atom feed generation |
| `/api/prices` | Crypto prices |
| `/api/market` | Market data |
| `/api/fear-greed` | Fear & Greed Index |
| `/api/sentiment` | Sentiment analysis |
| `/api/signals` | AI trading signals |
| `/api/defi` | DeFi data |
| `/api/whale-alerts` | Whale transaction alerts |
| `/api/health` | Health check |

## Task

### 1. Audit Current API Routes

Read all existing routes under `src/app/api/v1/` to understand the pattern they use. Then categorize all `/api/` routes into:

- **Public API** (used by SDKs, documented, external consumers) — must be versioned
- **Internal** (admin, cron, inngest, webhooks, internal) — do NOT version
- **Feed routes** (rss, atom, opml, feed.xml) — do NOT version (feed URLs should be stable)
- **Well-known routes** (.well-known) — do NOT version

### 2. Create Versioned Route Aliases

For each public API route, create a versioned route that re-exports from the original:

```
src/app/api/v1/news/route.ts
src/app/api/v1/breaking/route.ts
src/app/api/v1/trending/route.ts
...etc
```

Each versioned route simply re-exports from the unversioned route:

```typescript
// src/app/api/v1/news/route.ts
export { GET, dynamic, revalidate } from '@/app/api/news/route';
```

This approach:
- Keeps the original routes working (backward compatible)
- Adds `/api/v1/` as the canonical versioned path
- No code duplication
- Easy to create `/api/v2/` later with different implementations

### 3. Add Deprecation Headers to Unversioned Routes

Create a utility middleware wrapper that adds deprecation headers when unversioned routes are hit:

```typescript
// src/lib/api-versioning.ts
import { NextResponse } from 'next/server';

export function withDeprecationNotice(handler: Function) {
  return async (...args: any[]) => {
    const response = await handler(...args);
    
    // Clone response to add headers
    const newResponse = new NextResponse(response.body, response);
    newResponse.headers.set('Deprecation', 'true');
    newResponse.headers.set('Sunset', '2027-01-01T00:00:00Z');
    newResponse.headers.set('Link', '</api/v1>; rel="successor-version"');
    
    return newResponse;
  };
}
```

**Do NOT apply this yet** — just create the utility. Deprecation notices should be enabled later via feature flag when the team is ready to sunset unversioned endpoints.

### 4. Update OpenAPI Spec

Read `chatgpt/openapi.yaml` and update the server URL and paths to use `/api/v1/`:

```yaml
servers:
  - url: https://cryptocurrency.cv/api/v1
    description: Production API v1
  - url: https://cryptocurrency.cv/api
    description: Legacy unversioned (deprecated)
```

### 5. Update API Documentation

Add a versioning section to `docs/API.md`:

```markdown
## API Versioning

All API endpoints are available under `/api/v1/`. The unversioned `/api/` endpoints
continue to work but are considered legacy and may be removed in a future release.

**Recommended:** Always use versioned endpoints:
```
https://cryptocurrency.cv/api/v1/news
https://cryptocurrency.cv/api/v1/search?q=bitcoin
https://cryptocurrency.cv/api/v1/prices
```

**Legacy (deprecated):**
```
https://cryptocurrency.cv/api/news
https://cryptocurrency.cv/api/search?q=bitcoin
```
```

### 6. Update SDK Examples

Search for API URLs in `sdk/`, `cli/`, `mcp/`, `examples/` and update them to use `/api/v1/`:

```bash
grep -r "api/news\|api/breaking\|api/trending\|api/search\|api/prices" sdk/ cli/ mcp/ examples/
```

Update the base URLs in SDK configurations.

### 7. Update llms.txt and llms-full.txt

These AI-optimized reference files should reflect the versioned URLs. Update any API endpoint references to use `/api/v1/`.

## Routes to NOT Version (leave unversioned)

- `/api/cron/*` — Internal cron jobs
- `/api/inngest` — Background job webhook
- `/api/admin/*` — Admin-only routes
- `/api/internal/*` — Internal routes
- `/api/webhooks/*` — Webhook receivers
- `/api/register` — Key registration
- `/api/rss`, `/api/atom`, `/api/opml` — Feed URLs (must be stable)
- `/api/.well-known/*` — Protocol discovery
- `/api/health` — Health check (keep both versioned and unversioned)
- `/api/openapi.json` — OpenAPI spec endpoint

## Requirements

- Backward compatibility: ALL existing unversioned routes must continue to work
- The v1 routes must return identical responses to unversioned routes
- No code duplication — v1 routes re-export from unversioned
- Internal/admin routes stay unversioned
- Feed URLs stay unversioned (RSS readers rely on stable URLs)
- SDKs and documentation must be updated
- `bun run build` must succeed

## Success Criteria

- All public API routes accessible at both `/api/<route>` and `/api/v1/<route>`
- Responses are identical between versioned and unversioned
- OpenAPI spec updated with v1 server URL
- API documentation includes versioning guidance
- SDKs point to versioned endpoints
- `bun run build` succeeds
- `bun run test:e2e` still passes (if routes are tested)
