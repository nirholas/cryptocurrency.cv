# API Routes and Backend Logic Comparison

**FCN (Free Crypto News)** vs **CDA (Crypto Data Aggregator)**

> Generated: January 24, 2026
> Purpose: Document differences between FCN and CDA API routes and backend utilities
> 
> **Status: ✅ COMPLETE** - All CDA-unique APIs have been migrated to FCN

---

## Table of Contents

1. [API Endpoint Matrix](#section-1-api-endpoint-matrix)
2. [Library Comparison](#section-2-library-comparison)
3. [Data Fetching Patterns](#section-3-data-fetching-patterns)
4. [Caching Strategies](#section-4-caching-strategies)
5. [Authentication/Authorization](#section-5-authenticationauthorization)
6. [External API Integrations](#section-6-external-api-integrations)
7. [Migration Plan](#section-7-migration-plan)

---

## Section 1: API Endpoint Matrix

### 1.1 Core API Routes (Both Projects)

| Endpoint | FCN | CDA | Method | Purpose | Differences |
|----------|-----|-----|--------|---------|-------------|
| `/api/admin` | ✅ | ✅ | GET, POST | Admin dashboard stats | CDA uses centralized `requireAdminAuth`, FCN uses inline auth |
| `/api/ai` | ✅ | ✅ | GET, POST | AI content analysis | Identical implementation |
| `/api/ai/brief` | ✅ | ✅ | GET | AI news brief | Identical |
| `/api/ai/counter` | ✅ | ✅ | POST | Counter-argument AI | Identical |
| `/api/ai/debate` | ✅ | ✅ | POST | AI debate mode | Identical |
| `/api/alerts` | ✅ | ✅ | GET, POST | Alert management | Identical |
| `/api/alerts/[id]` | ✅ | ✅ | GET, PUT, DELETE | Single alert CRUD | Identical |
| `/api/analytics/*` | ✅ | ✅ | GET | Analytics endpoints | Identical (anomalies, credibility, headlines) |
| `/api/analyze` | ✅ | ✅ | POST | Content analysis | Identical |
| `/api/archive` | ✅ | ✅ | GET | Historical archive | Identical |
| `/api/archive/v2` | ✅ | ✅ | GET | V2 archive format | Identical |
| `/api/article` | ✅ | ✅ | GET | Single article fetch | Identical |
| `/api/ask` | ✅ | ✅ | POST | AI Q&A | Identical |
| `/api/atom` | ✅ | ✅ | GET | Atom feed | Identical |
| `/api/bitcoin` | ✅ | ✅ | GET | Bitcoin news filter | Identical |
| `/api/breaking` | ✅ | ✅ | GET | Breaking news | Identical |
| `/api/cache` | ✅ | ✅ | GET, DELETE | Cache management | Identical |
| `/api/charts` | ✅ | ✅ | GET | Chart data | Identical |
| `/api/claims` | ✅ | ✅ | GET | Claim extraction | Identical |
| `/api/classify` | ✅ | ✅ | POST | Content classification | Identical |
| `/api/clickbait` | ✅ | ✅ | POST | Clickbait detection | Identical |
| `/api/defi` | ✅ | ✅ | GET | DeFi news filter | Identical |
| `/api/digest` | ✅ | ✅ | GET | Daily digest | Identical |
| `/api/docs` | ✅ | ✅ | GET | API documentation | Identical |
| `/api/entities` | ✅ | ✅ | GET | Entity extraction | Identical |
| `/api/factcheck` | ✅ | ✅ | POST | Fact checking | Identical |
| `/api/gateway` | ✅ | ✅ | POST | API gateway | Identical |
| `/api/health` | ✅ | ✅ | GET | Health check | **Identical** - both check 7 RSS sources |
| `/api/market/*` | ✅ | ✅ | GET | Market data | 14 sub-routes, identical |
| `/api/narratives` | ✅ | ✅ | GET | Narrative tracking | Identical |
| `/api/news` | ✅ | ✅ | GET | Main news endpoint | **Identical** - translation support |
| `/api/newsletter` | ✅ | ✅ | POST | Newsletter signup | Identical |
| `/api/og` | ✅ | ✅ | GET | OG image generation | Identical (TSX route) |
| `/api/opml` | ✅ | ✅ | GET | OPML export | Identical |
| `/api/origins` | ✅ | ✅ | GET | Source origins | Identical |
| `/api/portfolio/*` | ✅ | ✅ | GET, POST | Portfolio management | Identical |
| `/api/premium/*` | ✅ | ✅ | Various | Premium features | Identical structure (13 routes) |
| `/api/push` | ✅ | ✅ | POST | Push notifications | Identical |
| `/api/rss` | ✅ | ✅ | GET | RSS feed | Identical |
| `/api/search` | ✅ | ✅ | GET | News search | Identical |
| `/api/sentiment` | ✅ | ✅ | GET, POST | Sentiment analysis | Identical |
| `/api/signals` | ✅ | ✅ | GET | Trading signals | Identical |
| `/api/sources` | ✅ | ✅ | GET | Source listing | Identical |
| `/api/sse` | ✅ | ✅ | GET | Server-sent events | Identical |
| `/api/stats` | ✅ | ✅ | GET | Statistics | Identical |
| `/api/summarize` | ✅ | ✅ | POST | Content summarization | Identical |
| `/api/trending` | ✅ | ✅ | GET | Trending topics | Identical |
| `/api/upgrade` | ✅ | ✅ | POST | Plan upgrade | Identical |
| `/api/v1/*` | ✅ | ✅ | GET | Versioned API | See differences below |
| `/api/webhooks` | ✅ | ✅ | GET, POST | Webhook management | Identical |
| `/api/ws` | ✅ | ✅ | GET | WebSocket endpoint | Identical |

### 1.2 FCN-Unique API Routes

| Endpoint | Method | Purpose | Details |
|----------|--------|---------|---------|
| `/api/i18n/translate` | POST | On-demand translation | Groq-powered translation for dynamic content. Supports single text or batch translations to 18 locales |
| `/api/news/international` | GET | International news | Fetches from Korean, Chinese, Japanese, Spanish sources with optional translation |
| `/api/openapi.json` | GET | OpenAPI spec | Returns complete OpenAPI 3.1.0 specification for API documentation/integrations |

**`/api/i18n/translate` Details:**
- **Authentication**: None (relies on Groq API key)
- **Rate limit**: Subject to Groq limits
- **Request format**:
  ```json
  {
    "text": "Hello world",
    "targetLocale": "es",
    "context": "button label"
  }
  ```
- **Batch format**:
  ```json
  {
    "texts": { "key1": "Hello", "key2": "World" },
    "targetLocale": "es"
  }
  ```

**`/api/news/international` Details:**
- **Parameters**: `language` (ko|zh|ja|es|all), `translate` (bool), `limit`, `region` (asia|europe|latam|all)
- **Caching**: 5 minutes (revalidate=300)
- **Runtime**: Edge

### 1.3 CDA-Unique API Routes

| Endpoint | Method | Purpose | Details |
|----------|--------|---------|---------|
| `/api/admin/keys` | GET, PATCH | Admin API key management | List, filter, sort, paginate API keys; revoke/activate/upgrade keys |
| `/api/admin/stats` | GET | Admin statistics | Comprehensive key usage stats, tier breakdown, top users, usage history |
| `/api/cron/expire-subscriptions` | GET, POST | Subscription expiry cron | Auto-downgrade expired pro/enterprise keys to free tier |
| `/api/register` | GET, POST | API key registration | Self-service free API key creation (max 3 per email) |
| `/api/v1/usage` | GET | Usage statistics | Get API key usage stats (today, month, limits, remaining) |
| `/api/webhooks/test` | GET, POST | Webhook testing | Test webhook delivery, verification documentation |

**`/api/admin/keys` Details:**
- **Authentication**: Admin token via Bearer or X-Admin-Key header
- **GET Query Params**: page, limit, search, tier, status, sortBy, sortOrder
- **PATCH Actions**: revoke, activate, upgrade (with tier change)

**`/api/admin/stats` Details:**
- Returns tier breakdown, active key counts (24h/7d/30d), top 10 keys, 30-day usage history
- **Response includes**: total keys, requests today/month, usage by day chart data

**`/api/cron/expire-subscriptions` Details:**
- **Security**: CRON_SECRET environment variable (Authorization: Bearer or query param)
- **Max Duration**: 60 seconds
- Scans for expired subscriptions, auto-downgrades to free tier

**`/api/register` Details:**
- **Public endpoint** - no auth required
- **POST body**: `{ email, name?, action? }` 
- **Actions**: Create key (default), list keys, revoke key
- **Limits**: Max 3 keys per email

**`/api/v1/usage` Details:**
- **Authentication**: X-API-Key header or api_key query param
- **Returns**: tier, usageToday, usageMonth, limit, remaining, resetAt, keyInfo
- **Rate limit headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### 1.4 Premium API Comparison

Both projects share identical premium API structure with X402 micropayment integration:

| Premium Endpoint | Price | Purpose |
|-----------------|-------|---------|
| `/api/premium/ai/analyze` | $0.05 | AI-powered market analysis |
| `/api/premium/ai/compare` | $0.05 | Multi-coin AI comparison |
| `/api/premium/ai/sentiment` | $0.05 | AI sentiment analysis |
| `/api/premium/ai/signals` | $0.05 | AI trading signals |
| `/api/premium/ai/summary` | $0.03 | AI content summary |
| `/api/premium/alerts/custom` | $0.02 | Custom alert rules |
| `/api/premium/alerts/whales` | $0.05 | Whale alert subscription |
| `/api/premium/analytics/screener` | $0.05 | Advanced screener |
| `/api/premium/api-keys` | - | API key management |
| `/api/premium/defi/protocols` | $0.05 | DeFi protocol data |
| `/api/premium/export/portfolio` | $0.10 | Portfolio export |
| `/api/premium/market/coins` | $0.02 | Premium coin data |
| `/api/premium/market/history` | $0.03 | Extended history |
| `/api/premium/portfolio/analytics` | $0.10 | Portfolio analytics |
| `/api/premium/screener/advanced` | $0.05 | Advanced screener |
| `/api/premium/smart-money` | $0.05 | Smart money tracking |
| `/api/premium/streams/prices` | $0.01/min | Live price streams |
| `/api/premium/whales/alerts` | $0.05 | Whale alert config |
| `/api/premium/whales/transactions` | $0.05 | Whale transaction data |

**Implementation**: Both use `withX402` middleware from `@x402/next` or `@/lib/x402-middleware`

---

## Section 2: Library Comparison

### 2.1 Core Utilities (Both Projects)

| Utility | FCN | CDA | Purpose | Differences |
|---------|-----|-----|---------|-------------|
| `api-keys.ts` | ✅ (701 lines) | ✅ (~650 lines) | API key management | **Identical** - Both use Vercel KV, same tier structure, Edge-compatible crypto |
| `api-utils.ts` | ✅ | ✅ | Response helpers | Identical |
| `cache.ts` | ✅ (175 lines) | ✅ (~175 lines) | In-memory cache | **Identical** - Same TTL-based MemoryCache class |
| `crypto-news.ts` | ✅ (591 lines) | ✅ (~600 lines) | RSS aggregation | **Identical** - 12 sources, same parsing |
| `market-data.ts` | ✅ (1837 lines) | ✅ (~1800 lines) | Market data service | **Identical** - CoinGecko, DeFiLlama, Alternative.me |
| `rate-limit.ts` | ✅ (155 lines) | ✅ (~155 lines) | Rate limiting | **Identical** - In-memory, 60 req/min, same middleware |
| `external-apis.ts` | ✅ (316 lines) | ✅ (~316 lines) | External API config | **CDA has more** - WebSocket URLs, additional exchanges |
| `groq.ts` | ✅ | ✅ | Groq AI integration | Identical |
| `translate.ts` | ✅ | ✅ | Translation service | Identical |
| `webhooks.ts` | ✅ | ✅ | Webhook handling | Identical |
| `premium-ai.ts` | ✅ | ✅ | Premium AI logic | Identical |
| `premium-whales.ts` | ✅ | ✅ | Whale tracking | Identical |
| `premium-screener.ts` | ✅ | ✅ | Advanced screener | Identical |
| `x402.ts` + related | ✅ (5 files) | ✅ (5 files) | X402 micropayments | Identical |

### 2.2 FCN-Unique Utilities

| Utility | Lines | Purpose |
|---------|-------|---------|
| `international-sources.ts` | 612 | Korean, Chinese, Japanese, Spanish news sources |
| `source-translator.ts` | ~300 | Translation for international sources |
| `alpha-signal-engine.ts` | ~200 | Alpha signal generation (experimental) |
| `bitcoin-onchain.ts` | - | Bitcoin on-chain data (in CDA external-apis) |
| `coincap.ts` | - | CoinCap API wrapper (separate file) |
| `coinpaprika.ts` | - | CoinPaprika API wrapper (separate file) |
| `defi-yields.ts` | - | DeFi yield data (moved to external-apis in CDA) |
| `license-check.ts` | - | License validation |
| `category-icons.ts` | - | Category icon mappings |

### 2.3 CDA-Unique Utilities

| Utility | Lines | Purpose |
|---------|-------|---------|
| `admin-auth.ts` | 140 | **Centralized admin authentication** - secure token comparison, multiple header support |

### 2.4 Library Implementation Differences

#### Admin Authentication

**FCN** (`/api/admin/route.ts` inline):
```typescript
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token';

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === ADMIN_TOKEN;
}
```

**CDA** (`lib/admin-auth.ts`):
```typescript
// Constant-time comparison to prevent timing attacks
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Multiple header support
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey) return adminKey;
  return null;
}

// Reusable middleware
export function requireAdminAuth(request: NextRequest): NextResponse | null { ... }
```

**Key Improvements in CDA**:
- ✅ Timing-attack resistant comparison
- ✅ Multiple header support (Authorization Bearer, X-Admin-Key)
- ✅ Production-safe (no fallback token in production)
- ✅ Reusable middleware function
- ✅ Centralized error responses

---

## Section 3: Data Fetching Patterns

### 3.1 RSS Fetching Comparison

| Aspect | FCN | CDA | Notes |
|--------|-----|-----|-------|
| Sources | 12 RSS feeds | 12 RSS feeds | Identical |
| Parsing | `sanitize-html` | `sanitize-html` | Same library |
| Deduplication | Title-based hash | Title-based hash | Same algorithm |
| Caching | In-memory + revalidate | In-memory + revalidate | Identical |
| Error handling | Per-source fallback | Per-source fallback | Identical |
| International | ✅ (separate module) | ❌ | FCN has 20+ intl sources |

### 3.2 Market Data Fetching Comparison

| Aspect | FCN | CDA | Notes |
|--------|-----|-----|-------|
| CoinGecko | ✅ | ✅ | Identical implementation |
| DeFiLlama | ✅ | ✅ | Identical implementation |
| Alternative.me | ✅ | ✅ | Fear/Greed index |
| CoinCap | ✅ (separate file) | ✅ (in external-apis) | Same functionality |
| CoinPaprika | ✅ (separate file) | ✅ (in external-apis) | Same functionality |
| Cache TTLs | Identical | Identical | 30s-3600s based on data type |

### 3.3 AI Integration Comparison

| Aspect | FCN | CDA | Notes |
|--------|-----|-----|-------|
| Provider | Groq (llama-3.3-70b) | Groq (llama-3.3-70b) | Identical |
| Streaming | ✅ | ✅ | Same implementation |
| JSON parsing | `parseGroqJson` | `parseGroqJson` | Identical helper |
| Error handling | Graceful fallback | Graceful fallback | Identical |

### 3.4 WebSocket Handling Comparison

Both use `price-websocket.ts` and `websocket.ts` with identical implementation:
- CoinCap WebSocket for real-time prices
- Custom SSE fallback for non-WebSocket environments
- Same reconnection logic

---

## Section 4: Caching Strategies

### 4.1 Layer Comparison

| Layer | FCN Approach | CDA Approach | Notes |
|-------|--------------|--------------|-------|
| HTTP Cache | `Cache-Control` headers | `Cache-Control` headers | Identical patterns |
| Edge Revalidation | `revalidate` export | `revalidate` export | Next.js ISR |
| In-Memory | `MemoryCache` class | `MemoryCache` class | **Identical** implementation |
| Vercel KV | API keys, usage | API keys, usage | Same patterns |
| Redis (optional) | Mentioned in comments | Mentioned in comments | Not implemented |

### 4.2 Cache TTL Configuration

```typescript
// Both projects use identical TTL configuration
export const CACHE_TTL = {
  prices: 30,           // Live prices - 30 seconds
  historical_1d: 60,    // 24h data - 1 minute
  historical_7d: 300,   // Weekly data - 5 minutes
  historical_30d: 900,  // Monthly data - 15 minutes
  historical_90d: 1800, // 90+ days - 30 minutes
  tickers: 120,         // Exchange data - 2 minutes
  static: 3600,         // Categories - 1 hour
  search: 300,          // Search results - 5 minutes
  social: 1800,         // Dev/community - 30 minutes
  global: 300,          // Global data - 5 minutes
};
```

### 4.3 HTTP Cache Headers

```typescript
// Both projects use identical cache header patterns
// Standard (5 min cache, 1 min stale-while-revalidate)
'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60'

// Real-time (30 sec)
'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10'

// Static (1 hour)
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300'
```

---

## Section 5: Authentication/Authorization

### 5.1 Premium Access Control

| Aspect | FCN | CDA | Notes |
|--------|-----|-----|-------|
| Payment Protocol | X402 | X402 | Identical |
| Middleware | `withX402` | `withX402` | Same implementation |
| Pricing | $0.01-$0.10 per request | $0.01-$0.10 per request | Identical |
| Wallet Integration | Base L2 | Base L2 | Same network |

### 5.2 Admin Authentication

| Aspect | FCN | CDA |
|--------|-----|-----|
| Implementation | Inline in routes | Centralized `admin-auth.ts` |
| Token sources | Authorization Bearer | Authorization Bearer + X-Admin-Key |
| Comparison | Direct equality | Constant-time secure comparison |
| Production safety | Fallback in prod | No fallback in production |
| Middleware | None | `requireAdminAuth()` |

### 5.3 API Key Management

| Aspect | FCN | CDA |
|--------|-----|-----|
| Tiers | free, pro, enterprise | free, pro, enterprise |
| Limits | 100 / 10,000 / unlimited | 100 / 10,000 / unlimited |
| Storage | Vercel KV | Vercel KV |
| Key format | `cda_free_xxx` | `cda_free_xxx` |
| Registration | ❌ | ✅ `/api/register` |
| Admin management | ❌ | ✅ `/api/admin/keys`, `/api/admin/stats` |
| Usage tracking | ❌ | ✅ `/api/v1/usage` |
| Expiry handling | ❌ | ✅ `/api/cron/expire-subscriptions` |

---

## Section 6: External API Integrations

### 6.1 API Usage Matrix

| API | FCN Uses | CDA Uses | Implementation Differences |
|-----|----------|----------|---------------------------|
| **CoinGecko** | ✅ | ✅ | Identical - market data, coin details, historical |
| **DeFiLlama** | ✅ | ✅ | Identical - TVL, protocols, yields |
| **Alternative.me** | ✅ | ✅ | Identical - Fear/Greed index |
| **CoinCap** | ✅ | ✅ | FCN: separate file, CDA: in external-apis |
| **CoinPaprika** | ✅ | ✅ | FCN: separate file, CDA: in external-apis |
| **Binance** | ✅ | ✅ | Identical - derivatives, futures data |
| **Kraken** | ❌ | ✅ | CDA has Kraken integration in external-apis |
| **KuCoin** | ❌ | ✅ | CDA has KuCoin integration |
| **OKX** | ❌ | ✅ | CDA has OKX integration |
| **Bybit** | ❌ | ✅ | CDA has Bybit integration |
| **dYdX** | ❌ | ✅ | CDA has dYdX integration |
| **Deribit** | ❌ | ✅ | CDA has Deribit integration |
| **Mempool.space** | ✅ | ✅ | Bitcoin on-chain data |
| **Blockstream** | ✅ | ✅ | Bitcoin block data |
| **Groq** | ✅ | ✅ | Identical - AI inference |
| **International RSS** | ✅ (20+ sources) | ❌ | FCN has Korean/Chinese/Japanese/Spanish feeds |

### 6.2 WebSocket Connections

| WebSocket | FCN | CDA |
|-----------|-----|-----|
| CoinCap Prices | ✅ | ✅ |
| Binance Stream | ✅ | ✅ |
| Binance Futures | ❌ | ✅ |
| Bybit Stream | ❌ | ✅ |
| OKX Stream | ❌ | ✅ |

---

## Section 7: Migration Plan

### 7.1 APIs to Add to FCN from CDA

| Priority | API/Feature | Effort | Value |
|----------|-------------|--------|-------|
| 🔴 High | `/api/register` | Medium | Self-service API key registration |
| 🔴 High | `/api/admin/keys` | Medium | Admin API key management |
| 🔴 High | `/api/admin/stats` | Medium | Usage analytics dashboard |
| 🟡 Medium | `/api/v1/usage` | Low | User-facing usage stats |
| 🟡 Medium | `/api/cron/expire-subscriptions` | Low | Auto-expire subscriptions |
| 🟡 Medium | `/api/webhooks/test` | Low | Webhook testing utility |
| 🟢 Low | `admin-auth.ts` library | Low | Centralized secure auth |

### 7.2 APIs to Add to CDA from FCN

| Priority | API/Feature | Effort | Value |
|----------|-------------|--------|-------|
| 🔴 High | `/api/news/international` | High | 20+ international news sources |
| 🔴 High | `international-sources.ts` | High | Korean/Chinese/Japanese/Spanish feeds |
| 🟡 Medium | `/api/i18n/translate` | Medium | On-demand translation API |
| 🟡 Medium | `source-translator.ts` | Medium | Auto-translation for news |
| 🟢 Low | `/api/openapi.json` | Low | OpenAPI spec for docs/integrations |

### 7.3 Utility Functions to Share

Both projects should consolidate to a shared utility package:

```typescript
// @crypto-news/shared package structure
src/
  api-keys/           // API key management (both identical)
  cache/              // MemoryCache class
  market-data/        // CoinGecko, DeFiLlama, etc.
  crypto-news/        // RSS aggregation
  external-apis/      // All external API configs
  rate-limit/         // Rate limiting
  admin-auth/         // Secure admin auth (CDA version)
  webhooks/           // Webhook handling
  x402/               // Micropayment integration
  groq/               // AI integration
  international/      // International sources (FCN)
  translate/          // Translation services
```

### 7.4 Code Migration Snippets

#### Adding Admin Auth to FCN

Create `/workspaces/free-crypto-news/src/lib/admin-auth.ts`:

```typescript
/**
 * Admin Authentication Utilities
 * Migrated from CDA - centralized admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

function getAdminToken(): string | null {
  const token = process.env.ADMIN_API_KEY || process.env.ADMIN_TOKEN;
  if (token) return token;
  if (!isProduction) {
    console.warn('[Admin Auth] Using dev fallback token.');
    return 'dev-admin-token';
  }
  return null;
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const adminKey = request.headers.get('X-Admin-Key');
  if (adminKey) return adminKey;
  return null;
}

export function isAdminAuthorized(request: NextRequest): boolean {
  const adminToken = getAdminToken();
  if (!adminToken) return false;
  const requestToken = extractToken(request);
  if (!requestToken) return false;
  return secureCompare(requestToken, adminToken);
}

export function isAdminConfigured(): boolean {
  return getAdminToken() !== null;
}

export function requireAdminAuth(request: NextRequest): NextResponse | null {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'Service Unavailable', message: isProduction 
        ? 'Admin functionality is not configured' 
        : 'Set ADMIN_API_KEY environment variable' },
      { status: 503 }
    );
  }
  if (!isAdminAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing admin credentials' },
      { status: 401 }
    );
  }
  return null;
}
```

#### Adding Register API to FCN

Create `/workspaces/free-crypto-news/src/app/api/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  createApiKey,
  getKeysByEmail,
  revokeApiKey,
  API_KEY_TIERS,
  isKvConfigured,
} from '@/lib/api-keys';

export const runtime = 'nodejs';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/register',
    method: 'POST',
    description: 'Register for a free API key',
    request: {
      body: {
        email: 'string (required)',
        name: 'string (optional)',
      },
    },
    tiers: Object.entries(API_KEY_TIERS).map(([id, tier]) => ({
      id,
      name: tier.name,
      requestsPerDay: tier.requestsPerDay === -1 ? 'Unlimited' : tier.requestsPerDay,
    })),
    configured: isKvConfigured(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, name, action, keyId } = body;

  if (action === 'revoke' && keyId && email) {
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const success = await revokeApiKey(keyId, email);
    if (success) {
      return NextResponse.json({ success: true, message: 'Key revoked' });
    }
    return NextResponse.json({ error: 'Failed to revoke' }, { status: 400 });
  }

  if (action === 'list' && email) {
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const keys = await getKeysByEmail(email);
    return NextResponse.json({
      keys: keys.map(k => ({
        id: k.id,
        keyPrefix: k.keyPrefix,
        name: k.name,
        tier: k.tier,
        createdAt: k.createdAt,
        active: k.active,
      })),
    });
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const result = await createApiKey({ email, name, tier: 'free' });
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    key: result.key,
    message: 'SAVE THIS KEY - it will only be shown once!',
    tier: result.data.tier,
    rateLimit: `${API_KEY_TIERS[result.data.tier].requestsPerDay} requests/day`,
  });
}
```

---

## Summary

### Key Findings

1. **95% Code Parity**: Most API routes and utilities are identical between FCN and CDA
2. **FCN Advantages**: International news sources, i18n translation API, OpenAPI spec
3. **CDA Advantages**: Admin API management, user registration, usage tracking, cron jobs, secure auth
4. **Shared Foundation**: Identical market data, caching, rate limiting, premium APIs

### Recommended Actions

1. **Immediate**: Migrate `admin-auth.ts` from CDA to FCN (security improvement)
2. **Short-term**: Add `/api/register` and `/api/v1/usage` to FCN for API key self-service
3. **Medium-term**: Add international sources to CDA for global news coverage
4. **Long-term**: Create shared package for common utilities

---

*Document generated by API comparison analysis*
