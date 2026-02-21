# Deployment

Free Crypto News supports three deployment targets out of the box: **Vercel** (recommended), **Docker / self-hosted**, and **Railway**.

---

## Vercel (recommended)

One-click deploy — no configuration required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### Cron jobs

`vercel.json` configures two automatic cron jobs:

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/archive-kv` | Every hour | Syncs latest articles to KV cache |
| `/api/cron/x-sentiment` | Daily at midnight | Refreshes X/Twitter sentiment data |

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_REST_API_URL` | Optional | Upstash Redis URL for distributed caching |
| `KV_REST_API_TOKEN` | Optional | Upstash Redis token |
| `OPENAI_API_KEY` | Optional | Enables AI summaries and RAG chat |
| `ANTHROPIC_API_KEY` | Optional | Alternative LLM for AI features |

Without Redis the app falls back to in-memory caching — fully functional but not shared across instances.

---

## Docker

### Quick start

```bash
docker compose up -d
```

This starts the Next.js app on port `3000` and an optional Redis container on `6379`.

### Manual build

```bash
docker build -t free-crypto-news .
docker run -p 3000:3000 free-crypto-news
```

### docker-compose.yml overview

```yaml
services:
  app:           # Next.js app — port 3000
  redis:         # Optional Redis cache — port 6379
```

Pass environment variables via `.env` or the `environment:` block in `docker-compose.yml`.

### Health check

The container exposes a health endpoint at `/api/health`. Docker Compose polls it every 30 s with a 40 s start grace period.

---

## Railway

`railway.json` is pre-configured for Railway deployments using Nixpacks:

```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node ws-server.js",
    "healthcheckPath": "/health"
  }
}
```

1. Connect your GitHub repo in the Railway dashboard
2. Railway will auto-detect `railway.json` and build with Nixpacks
3. Add environment variables in the Railway service settings
4. Domain is provisioned automatically

---

## WebSocket server

The real-time feed (`ws-server.js`) runs as a separate process alongside the Next.js app. On Railway it is the primary start command. On Vercel, Server-Sent Events (SSE) routes replace WebSockets.

---

## Building locally

```bash
npm install
npm run build
npm start          # production server on port 3000
```

---

## Related docs

- [Architecture](ARCHITECTURE.md) — system design and data flow
- [Scalability](SCALABILITY.md) — caching, edge runtime, load handling
- [Security](SECURITY.md) — security policy and reporting
