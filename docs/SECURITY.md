# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: security@cryptocurrency.cv (or open a private security advisory)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response time**: Within 48 hours
- **Resolution timeline**: Critical issues within 7 days
- **Credit**: We'll credit you in the fix (unless you prefer anonymity)

### Scope

**In scope:**
- API endpoints (`/api/*`)
- Authentication/authorization issues
- Data exposure vulnerabilities
- Injection attacks (SQL, XSS, etc.)
- Rate limiting bypasses
- CORS misconfigurations
- SDK vulnerabilities

**Out of scope:**
- Third-party dependencies (report to them directly)
- Social engineering attacks
- Physical attacks
- DoS attacks on infrastructure

---

## Security Architecture

### Defence in Depth

The application implements multiple layers of protection:

```
Internet
  │
  ▼
┌─────────────────────────────────┐
│  Vercel Edge CDN                │  DDoS protection, WAF, TLS termination
├─────────────────────────────────┤
│  Security Headers Middleware    │  CSP, HSTS, X-Frame-Options, etc.
├─────────────────────────────────┤
│  Rate Limiter                   │  Sliding-window, per-IP or per-API-key
├─────────────────────────────────┤
│  Input Validation (Zod)         │  Schema validation on all user input
├─────────────────────────────────┤
│  Application Logic              │  Business rules, access control
├─────────────────────────────────┤
│  Output Sanitization            │  HTML encoding, JSON escaping
└─────────────────────────────────┘
```

### Content Security Policy (CSP)

The middleware (`middleware.ts`) sets a restrictive Content Security Policy:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://cryptocurrency.cv wss://cryptocurrency.cv;
  font-src 'self';
  frame-ancestors 'none';
```

Additional security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer data |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused APIs |

### CORS Configuration

The API supports configurable CORS:

- **Public endpoints** (`/api/news`, `/api/search`, etc.) — open to all origins
- **Write endpoints** (`POST /api/alerts`, etc.) — validated `Origin` header

### Rate Limiting

Distributed sliding-window rate limiter backed by Redis:

| Tier | Requests | Window | Notes |
|------|----------|--------|-------|
| Anonymous | 100 | 15 min | No API key required |
| Basic | 1,000 | 15 min | Free API key |
| Premium | 10,000 | 15 min | Paid tier |

Rate limit headers are returned on every response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709312400
```

When exceeded, the API returns `429 Too Many Requests` with a `Retry-After` header.

---

## API Key Management

### Key Generation

API keys are generated via `/api/register` and stored as hashed values in Neon Postgres via Drizzle ORM. Raw keys are returned **once** at creation time and never stored.

### Key Rotation

Users can regenerate their API key at any time. The old key is immediately invalidated.

### Key Transmission

API keys are transmitted via the `X-API-Key` header (preferred) or `apiKey` query parameter:

```bash
# Header (recommended)
curl -H "X-API-Key: your-key" https://cryptocurrency.cv/api/news

# Query parameter (less secure — logged in URLs)
curl "https://cryptocurrency.cv/api/news?apiKey=your-key"
```

---

## Input Validation

All API endpoints validate input using [Zod](https://zod.dev/) schemas:

```typescript
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().max(200).optional(),
  category: z.enum(['bitcoin', 'ethereum', 'defi', ...]).optional(),
});
```

This prevents:
- SQL injection (parameterised queries via Drizzle ORM)
- XSS (output encoding + CSP)
- Path traversal (validated file paths)
- Integer overflow (bounded numeric ranges)
- Excessive payloads (request size limits)

---

## Data Privacy

### What We Collect

- **Public API**: No personal data collected. Anonymous usage metrics only.
- **Registered users**: Email address (for API key recovery) and hashed API key.
- **Analytics**: Aggregated, anonymised endpoint usage statistics.

### What We Don't Collect

- No cookies on API endpoints
- No tracking pixels
- No third-party analytics on the API
- No IP address storage beyond rate-limiting windows

### Data Retention

- Rate limit counters: 15 minutes (auto-expire in Redis)
- API usage logs: 30 days (structured logs only)
- Archive data: Retained indefinitely (public news articles)

---

## Dependency Security

| Tool | Purpose | Frequency |
|------|---------|-----------|
| Dependabot | Automated dependency updates | Weekly |
| CodeQL | Static analysis for vulnerabilities | On push |
| `pnpm audit` | npm vulnerability database check | Before releases |
| Knip | Unused dependency detection | CI check |

### Update Policy

- **Critical/High CVEs**: Patched within 48 hours
- **Medium CVEs**: Patched within 1 week
- **Low CVEs**: Addressed in next regular update cycle

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 — Critical | Data breach, RCE, auth bypass | Immediate (< 4 hours) |
| P1 — High | Significant data exposure, rate limit bypass | < 24 hours |
| P2 — Medium | Limited impact, requires specific conditions | < 7 days |
| P3 — Low | Informational, best-practice improvements | Next release |

### Response Process

1. **Triage** — Confirm and assess severity
2. **Contain** — Disable affected endpoint if needed
3. **Fix** — Develop and test patch
4. **Deploy** — Push fix to production
5. **Notify** — Inform affected users (if applicable)
6. **Post-mortem** — Document lessons learned

---

## Security Measures Summary

This project implements:

- ✅ Security headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options)
- ✅ Distributed rate limiting (sliding-window, Redis-backed)
- ✅ Input validation and sanitization (Zod schemas)
- ✅ CORS configuration (per-endpoint)
- ✅ Dependency scanning (Dependabot + CodeQL)
- ✅ Parameterised database queries (Drizzle ORM)
- ✅ No secrets in code (environment variables only)
- ✅ TLS everywhere (HTTPS enforced via HSTS)
- ✅ API key hashing (keys never stored in plaintext)
- ✅ Structured logging (no sensitive data in logs)

## Best Practices for API Users

When using this API:

1. **Use HTTPS** — Always use the `https://` endpoint
2. **Transmit keys via headers** — Use `X-API-Key` header, not query parameters
3. **Validate responses** — Don't trust any external data blindly
4. **Implement retry logic** — Respect `Retry-After` headers on 429 responses  
5. **Don't store sensitive data** — This is a public news API
6. **Implement your own rate limiting** — Be a good citizen
7. **Keep SDKs updated** — Track releases for security patches

## Contact

- **Security issues**: security@cryptocurrency.cv
- **General questions**: [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)

---

## Related Docs

- [Architecture](ARCHITECTURE.md) — system design and security layers
- [API Reference](API.md) — endpoint documentation
- [Deployment](DEPLOYMENT.md) — secure deployment configuration
- [Scalability](SCALABILITY.md) — rate limiting architecture

For security concerns: Open a [GitHub Security Advisory](https://github.com/nirholas/free-crypto-news/security/advisories/new)

