# Section 3: Auth, Billing & API Keys (Agents 11–15)

> These agents build the user authentication system, Stripe billing, API key management, usage tracking, and the developer dashboard.

---

## Agent 11 — User Authentication System

**Goal:** Build a complete authentication system with OAuth, email/password, and session management.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/auth/
  index.ts                  (auth configuration & exports)
  providers/
    github.ts               (GitHub OAuth)
    google.ts               (Google OAuth)
    email.ts                (email/password with bcrypt)
  session.ts                (JWT session management)
  middleware.ts             (auth middleware for API routes)
  guards.ts                 (role-based access control)
  tokens.ts                 (access + refresh token management)
  password.ts               (hashing, validation, reset flow)
  email-verification.ts     (email verification flow)
  types.ts                  (auth types/interfaces)
src/app/api/auth/
  login/route.ts
  register/route.ts
  logout/route.ts
  refresh/route.ts
  verify-email/route.ts
  reset-password/route.ts
  callback/github/route.ts
  callback/google/route.ts
  me/route.ts
```

**Requirements:**

1. **GitHub OAuth:** Authorization code flow. Scopes: `user:email`. Redirect URI: `https://cryptocurrency.cv/api/auth/callback/github`. Store provider_id. Auto-create user on first login.

2. **Google OAuth:** Authorization code flow. Scopes: `openid email profile`. Similar flow to GitHub.

3. **Email/password:** bcrypt hash (cost factor 12). Minimum 8 chars, require uppercase + number. Email verification required before API key generation. Password reset via time-limited token (1 hour expiry).

4. **JWT sessions:** Access token (15 min), Refresh token (7 days). Access token in response body. Refresh token in httpOnly secure cookie. Rotate refresh token on use (one-time use). Revoke all tokens on password change.

5. **Middleware:** `withAuth(handler)` wrapper for protected routes. Extract user from JWT. Attach to request context. Return 401 if invalid/expired. Support both cookie and `Authorization: Bearer` header.

6. **Role-based access:**
```typescript
enum Role { FREE = 'free', DEVELOPER = 'developer', PRO = 'pro', ENTERPRISE = 'enterprise', ADMIN = 'admin' }
// Guards: requireRole(Role.PRO), requireAnyRole([Role.PRO, Role.ENTERPRISE])
```

7. **Rate limiting on auth endpoints:** Max 5 login attempts per IP per 15 minutes. Max 3 password reset requests per email per hour. Max 10 registration attempts per IP per hour.

8. **Security:** CSRF protection on mutation endpoints. Constant-time comparison for tokens. Log all auth events (login, logout, password change, failed attempts). IP tracking for suspicious activity.

**Instructions:**
- Use `jose` library for JWT (Edge-compatible)
- Use `bcryptjs` for password hashing (or `@node-rs/bcrypt` for performance)
- Use the users table from Agent 6's schema
- Do NOT use next-auth/Auth.js — build from scratch for full control
- Do NOT touch files outside `src/auth/` and `src/app/api/auth/`
- Commit message: `feat(auth): add user authentication with OAuth and email/password`

---

## Agent 12 — Stripe Billing Integration

**Goal:** Integrate Stripe for subscription management, usage-based billing, and payment processing.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/billing/
  stripe.ts                 (Stripe client initialization)
  plans.ts                  (plan definitions & pricing)
  checkout.ts               (create checkout sessions)
  portal.ts                 (customer portal management)
  subscriptions.ts          (subscription lifecycle)
  usage.ts                  (usage-based metering)
  invoices.ts               (invoice management)
  webhooks.ts               (Stripe webhook handlers)
  x402.ts                   (x402 crypto payment integration)
  types.ts                  (billing types)
src/app/api/billing/
  checkout/route.ts
  portal/route.ts
  subscription/route.ts
  usage/route.ts
  invoices/route.ts
  webhooks/stripe/route.ts
  webhooks/x402/route.ts
  plans/route.ts
```

**Requirements:**

1. **Plans:**
```typescript
const plans = {
  free: { 
    price: 0, stripePriceId: null,
    limits: { requestsPerMinute: 30, requestsPerDay: 1000, requestsPerMonth: 10000 },
    features: ['prices', 'market_data', 'basic_news']
  },
  developer: {
    price: 2900, // $29/mo in cents
    stripePriceId: 'price_developer_monthly',
    limits: { requestsPerMinute: 500, requestsPerDay: 50000, requestsPerMonth: 500000 },
    features: ['prices', 'market_data', 'news', 'defi', 'ohlcv', 'websocket_basic']
  },
  pro: {
    price: 9900, // $99/mo
    stripePriceId: 'price_pro_monthly',
    limits: { requestsPerMinute: 2000, requestsPerDay: 200000, requestsPerMonth: 2000000 },
    features: ['all', 'websocket_full', 'historical_data', 'priority_support']
  },
  enterprise: {
    price: 49900, // $499/mo base
    stripePriceId: 'price_enterprise_monthly',
    limits: { requestsPerMinute: null, requestsPerDay: null, requestsPerMonth: null }, // unlimited
    features: ['all', 'dedicated_support', 'sla', 'custom_endpoints', 'raw_data_export']
  }
}
```

2. **Checkout:** Create Stripe Checkout session. Redirect to Stripe-hosted page. Support monthly and annual billing (20% discount annual). Pass `client_reference_id` with user ID. Success/cancel URLs.

3. **Customer Portal:** Allow users to manage subscription, update payment method, view invoices, cancel. Use Stripe's hosted portal.

4. **Usage metering:** Track API calls per key per day in Redis. Sync to Stripe usage records daily via cron. Report overage for usage-based enterprise plans.

5. **Webhook handlers:**
```
checkout.session.completed → activate subscription, upgrade user role
invoice.paid → record payment, extend period
invoice.payment_failed → notify user, grace period (3 days)
customer.subscription.updated → sync plan changes
customer.subscription.deleted → downgrade to free
```

6. **x402 integration:** Keep existing x402 micropayment support. Allow users to pay per-request with USDC on Base. Track x402 payments separately. Credit toward monthly usage.

7. **Invoice management:** List user's invoices. Download PDF. Send receipt emails.

**Instructions:**
- Use `stripe` npm package v14+
- Webhook signature verification with `stripe.webhooks.constructEvent`
- Store Stripe customer ID and subscription ID in database (Agent 6 schema)
- ENV vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Do NOT touch files outside `src/billing/` and `src/app/api/billing/`
- Commit message: `feat(billing): add Stripe subscription billing with usage metering`

---

## Agent 13 — API Key Management System

**Goal:** Build a robust API key system with generation, validation, rotation, scoping, and usage tracking.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Context:**
- free-crypto-news has an existing API key system in `src/lib/api-keys.ts` using Vercel KV with `cda_` prefix keys. This agent builds a new, database-backed system for Crypto Vision.

**Files to create:**

```
src/api-keys/
  generate.ts               (key generation with crypto)
  validate.ts               (key validation & lookup)
  rotate.ts                 (key rotation flow)
  revoke.ts                 (key revocation)
  scopes.ts                 (permission scoping)
  rate-limit.ts             (per-key rate limiting)
  usage.ts                  (usage tracking & analytics)
  middleware.ts             (API key auth middleware)
  types.ts                  (key types & interfaces)
src/app/api/keys/
  route.ts                  (list keys, create key)
  [keyId]/
    route.ts                (get/update/delete specific key)
    rotate/route.ts         (rotate key)
    usage/route.ts          (get usage stats)
```

**Requirements:**

1. **Key format:** `cv_live_` prefix for production, `cv_test_` for sandbox. 32 bytes of crypto random, base62 encoded. Example: `cv_live_7kB9mX2pQ4...` (48 chars total). Store SHA-256 hash in DB, never store plaintext after initial display.

2. **Generation:** User can create up to 5 keys on free, 20 on developer, 50 on pro, unlimited on enterprise. Each key has a name, optional description, optional expiry date, and permission scopes.

3. **Validation middleware:**
```typescript
// Check X-API-Key header or ?api_key query param
// 1. Extract key → 2. Hash it → 3. Look up hash in DB → 4. Check active → 
// 5. Check expiry → 6. Check rate limit → 7. Check scope → 8. Log usage → 9. Continue
```
Fast path: cache validated keys in Redis for 60s to avoid DB lookup on every request.

4. **Permission scopes:**
```typescript
enum Scope {
  PRICES_READ = 'prices:read',
  MARKET_READ = 'market:read',
  DEFI_READ = 'defi:read',
  NEWS_READ = 'news:read',
  ONCHAIN_READ = 'onchain:read',
  SOCIAL_READ = 'social:read',
  HISTORICAL_READ = 'historical:read',
  WEBSOCKET = 'websocket',
  EXPORT = 'export',
  ALL = '*'
}
```
Free tier gets: PRICES_READ, MARKET_READ, NEWS_READ. Higher tiers get more.

5. **Rate limiting:** Per-key sliding window. Limits based on tier (from billing plans). Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. Return 429 with `Retry-After` when exceeded.

6. **Key rotation:** Generate new key → return new plaintext → old key remains valid for 24h grace period → old key auto-revoked after grace. Webhook notification on rotation.

7. **Usage tracking:** Record every API call: endpoint, method, status, response time, IP, timestamp. Aggregate in Redis, flush to TimescaleDB every minute. Provide usage analytics: calls by endpoint, by day, by status code, response time percentiles.

8. **Revocation:** Immediate soft-delete (mark inactive). Purge from Redis cache. Log revocation event. Webhook notification.

**Instructions:**
- Use Web Crypto API for key generation (Edge-compatible)
- Use Redis for rate limiting (sorted sets, sliding window algorithm)
- Use the api_keys and api_usage_log tables from Agent 6's schema
- The middleware should be designed to work with Next.js App Router middleware
- Do NOT touch files outside `src/api-keys/` and `src/app/api/keys/`
- Commit message: `feat(api-keys): add comprehensive API key management system`

---

## Agent 14 — Usage Dashboard & Analytics

**Goal:** Build a developer dashboard for API key management, usage analytics, billing, and account settings.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/dashboard/
  layout.tsx                (dashboard shell with sidebar)
  page.tsx                  (overview/home)
  keys/
    page.tsx                (list API keys)
    new/page.tsx            (create new key)
    [keyId]/page.tsx        (key details & usage)
  usage/
    page.tsx                (usage analytics)
  billing/
    page.tsx                (subscription & invoices)
    upgrade/page.tsx        (plan comparison & upgrade)
  settings/
    page.tsx                (account settings)
    security/page.tsx       (password, 2FA, sessions)
  webhooks/
    page.tsx                (webhook management)
src/components/dashboard/
  sidebar.tsx               (navigation sidebar)
  header.tsx                (top bar with user menu)
  stats-card.tsx            (metric card component)
  usage-chart.tsx           (time-series usage chart)
  key-table.tsx             (API keys table)
  plan-card.tsx             (pricing plan card)
  invoice-table.tsx         (invoices table)
  webhook-form.tsx          (webhook configuration form)
  code-snippet.tsx          (API key usage examples)
```

**Requirements:**

1. **Dashboard layout:** Sidebar navigation (Overview, API Keys, Usage, Billing, Settings, Webhooks, Docs link). Top bar: user avatar, plan badge, notification bell. Responsive — sidebar collapses to hamburger on mobile.

2. **Overview page:** Cards showing: total requests (today/this month), active API keys, current plan, days until renewal. Sparkline charts for requests over last 7 days. Quick actions: "Create API Key", "View Docs", "Upgrade Plan".

3. **API Keys page:** Table with: key name, prefix (first 8 chars), created date, last used, status (active/expired/revoked), actions (copy, rotate, revoke, delete). "Create New Key" modal with name, description, scopes, expiry. Show plaintext key ONCE on creation with copy button and warning.

4. **Usage analytics page:** Time-series chart (requests per hour/day/month). Filters: date range, API key, endpoint. Breakdown tables: top endpoints, status code distribution, response time p50/p95/p99. Export to CSV.

5. **Billing page:** Current plan and status. Next invoice date and amount. Payment method (last 4 digits). Plan comparison table. "Upgrade" and "Manage Subscription" buttons (link to Stripe portal). Invoice history table with "Download PDF" links.

6. **Settings page:** Update name, email, avatar. Change password. View active sessions. Delete account (with confirmation). Connected OAuth providers (GitHub, Google).

7. **Webhooks page:** List configured webhooks. Add new webhook (URL, events to listen for, secret). Test webhook (send sample payload). View delivery history (success/failure, response code, response time).

**Instructions:**
- Use Tailwind CSS for styling
- Use shadcn/ui components where appropriate (Card, Table, Button, Dialog, etc.)
- Use `recharts` or `@tremor/react` for charts
- Client-side data fetching with SWR or React Query (`@tanstack/react-query`)
- All pages require authentication (redirect to login if not authenticated)
- Use `next/navigation` for routing
- Do NOT touch files outside `src/app/dashboard/` and `src/components/dashboard/`
- Commit message: `feat(dashboard): add developer dashboard with usage analytics`

---

## Agent 15 — Admin Panel

**Goal:** Build an admin panel for managing users, monitoring the platform, and operational tasks.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
src/app/admin/
  layout.tsx                (admin layout with auth guard)
  page.tsx                  (admin overview)
  users/
    page.tsx                (user management)
    [userId]/page.tsx       (user detail)
  keys/
    page.tsx                (all API keys across users)
  usage/
    page.tsx                (platform-wide usage analytics)
  billing/
    page.tsx                (revenue dashboard)
  health/
    page.tsx                (system health dashboard)
  data-sources/
    page.tsx                (data source status & circuit breakers)
  moderation/
    page.tsx                (content moderation queue)
src/components/admin/
  user-table.tsx
  revenue-chart.tsx
  health-status.tsx
  source-status.tsx
```

**Requirements:**

1. **Admin auth guard:** Only users with role `admin` can access. Return 403 for non-admins.

2. **Overview:** Total users, total API keys, requests today, revenue (MTD/YTD), error rate, uptime. All as cards with trend indicators (up/down vs yesterday).

3. **User management:** Search/filter users. View user details: plan, API keys, usage, billing history. Actions: suspend user, change plan, reset password, impersonate (login as user for debugging).

4. **Platform usage:** Global request volume chart. Top consumers. Top endpoints. Error rates by endpoint. Geographic distribution of requests.

5. **Revenue dashboard:** MRR, ARR, churn rate, ARPU. Revenue by plan tier. Growth chart. x402 payment volume.

6. **System health:** PostgreSQL: connections, query latency, replication lag. Redis: memory usage, hit rate, connected clients. Cloud Run: instance count, CPU/memory, request queue. Data pipeline: last fetch time per source, circuit breaker states, error counts.

7. **Data sources:** Status of each upstream API (CoinGecko, Binance, etc). Circuit breaker state (closed/open/half-open). Last successful fetch. Error count. Toggle enable/disable per source.

**Instructions:**
- Reuse shared components from the user dashboard where possible
- Admin routes should be server-rendered for SEO (no client-side-only pages)
- Use the existing admin auth pattern from free-crypto-news `src/app/admin/`
- Do NOT touch files outside `src/app/admin/` and `src/components/admin/`
- Commit message: `feat(admin): add admin panel with user management and system health`
