# Self-Hosting

> Deploying your own instance: one-click Vercel, manual install, every environment variable, Kubernetes, the observability stack, the docs site, Storybook, Inngest background jobs, and chaos/load testing. Google Cloud Run is covered in [docs/DEPLOY-GCP.md](../DEPLOY-GCP.md).
>
> Moved here from the project README. Back to the [reference index](https://github.com/nirholas/cryptocurrency.cv/blob/main/README.md).

## One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Fcryptocurrency.cv)

## Manual

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv
pnpm install
pnpm dev
```

Open http://localhost:3000/api/news

## Environment Variables

**All environment variables are optional.** The project works out of the box with zero configuration.

| Variable               | Default           | Description                                                                                                                 |
| ---------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `GROQ_API_KEY`         | -                 | Enables AI summarization, classification & real-time translation (40+ languages). **FREE!** Get yours at [console.groq.com/keys](https://console.groq.com/keys) |
| `REDDIT_CLIENT_ID`     | -                 | Enables Reddit social signals                                                                                               |
| `REDDIT_CLIENT_SECRET` | -                 | Reddit OAuth secret                                                                                                         |
| `X_AUTH_TOKEN`         | -                 | X/Twitter signals via [XActions](https://github.com/nirholas/XActions)                                                      |
| `ARCHIVE_DIR`          | `./archive`       | Archive storage path                                                                                                        |
| `API_URL`              | Production Vercel | API endpoint for archive collection                                                                                         |

### Feature Flags

| Variable              | Default | Description                               |
| --------------------- | ------- | ----------------------------------------- |
| `FEATURE_MARKET`      | `true`  | Market data (CoinGecko, DeFiLlama)        |
| `FEATURE_ONCHAIN`     | `true`  | On-chain events (BTC stats, DEX volumes)  |
| `FEATURE_SOCIAL`      | `true`  | Social signals (Reddit sentiment)         |
| `FEATURE_PREDICTIONS` | `true`  | Prediction markets (Polymarket, Manifold) |
| `FEATURE_CLUSTERING`  | `true`  | Story clustering & deduplication          |
| `FEATURE_RELIABILITY` | `true`  | Source reliability tracking               |

### GitHub Secrets (for Actions)

For full functionality, add these secrets to your repository:

```
GROQ_API_KEY        # For AI & translations (FREE! https://console.groq.com/keys)
REDDIT_CLIENT_ID    # For Reddit data (register at reddit.com/prefs/apps)
REDDIT_CLIENT_SECRET
X_AUTH_TOKEN        # For X/Twitter (from XActions login)
```

---

## Tech Stack

### Core

| Layer | Technology | Purpose |
|-------|------------|--------|
| **Runtime** | Next.js 14 (Edge Functions) | SSR, API routes, ISR |
| **Language** | TypeScript | Type-safe codebase |
| **Hosting** | Vercel (free tier) | Global edge deployment |
| **Data** | Direct RSS parsing | No database required |
| **Cache** | 4-layer (Memory → Redis → ISR → CDN) | <200ms TTFB |

### AI & ML

| Technology | Purpose |
|------------|--------|
| Groq (LLaMA 3.3) | Sentiment, summarization, NER, translation (**FREE**) |
| OpenAI (GPT-4o-mini) | Premium AI features |
| Anthropic (Claude) | Alternative AI provider |
| OpenRouter | Fallback AI routing |
| Google Generative AI (Gemini) | Multi-provider support |

### Data & Storage

| Technology | Purpose |
|------------|--------|
| Vercel KV / Upstash Redis | Persistent cache & data store |
| Drizzle ORM + Neon Postgres | Structured data (serverless) |
| Content-Addressable Storage | IPFS-style article integrity |
| JSONL Archives | Append-only historical data |

### Frontend

| Technology | Purpose |
|------------|--------|
| React 18 | Component framework |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations & transitions |
| Recharts | Charts & visualizations |
| SWR | Data fetching & caching |
| next-intl | Internationalization (42 languages) |

### Infrastructure

| Technology | Purpose |
|------------|--------|
| Docker + Docker Compose | Containerized deployment |
| Kubernetes + Helm | Production scaling (3-10 replicas) |
| Nginx | Reverse proxy & load balancing |
| Inngest | Background job orchestration |

### Observability

| Technology | Purpose |
|------------|--------|
| OpenTelemetry | Distributed tracing & metrics |
| Prometheus | Metrics collection & alerting |
| Grafana | Dashboards & visualization |
| Pino | Structured JSON logging |
| Sentry | Error tracking |
| web-vitals | Core Web Vitals monitoring |

### Testing & Quality

| Technology | Purpose |
|------------|--------|
| Vitest | Unit testing |
| Playwright | E2E testing (18 spec files) |
| Storybook | Component testing (60+ stories) |
| pa11y + axe-core | Accessibility testing |
| Lighthouse | Performance auditing |
| ESLint + Stylelint | Code & CSS linting |
| Secretlint | Secret scanning |
| Zod | Runtime schema validation |
| Husky | Git hooks |

### Payments

| Technology | Purpose |
|------------|--------|
| x402 Protocol | HTTP micropayments |
| USDC on Base L2 | Payment settlement |
| Stripe | Subscription billing |

---

## ☸️ Kubernetes Deployment

Production-grade Kubernetes deployment with Helm chart:

```bash
# Deploy with Helm
helm install free-crypto-news ./infra/helm/free-crypto-news \
  --set image.tag=latest \
  --set ingress.host=cryptocurrency.cv

# Scale up
helm upgrade free-crypto-news ./infra/helm/free-crypto-news \
  --set replicaCount=5
```

**Helm Chart Features:**

| Feature | Configuration |
|---------|---------------|
| **Autoscaling** | HPA: 3-10 replicas, CPU/memory targets |
| **Pod Disruption Budget** | Minimum 2 pods always available |
| **Ingress** | TLS termination, rate limiting |
| **Network Policies** | Namespace isolation, egress rules |
| **Service Accounts** | RBAC with least-privilege |
| **Separate Deployments** | Web + WebSocket split for scaling |
| **Resource Limits** | CPU/memory requests & limits |
| **Health Checks** | Liveness & readiness probes |

See [`/infra/helm/`](https://github.com/nirholas/cryptocurrency.cv/tree/main/infra) for the full Helm chart.

### Docker Compose

```bash
# Basic deployment
docker compose up -d

# With observability (Grafana + Prometheus)
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d

# Scaled deployment
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

---

## 📊 Observability Stack

Full observability with pre-built dashboards:

```bash
# Start with observability
docker compose -f docker-compose.yml -f docker-compose.observability.yml up -d

# Access dashboards
# Grafana:    http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

**Pre-built Grafana Dashboards:**
- **API Overview** — Request rates, latency percentiles, error rates, cache hit ratios
- **Production Dashboard** — System health, resource utilization, active connections

**Prometheus Alerting Rules:**
- High error rate (>5% for 5 min)
- Elevated latency (p99 >2s)
- Cache miss ratio spike
- RSS source failures

**OpenTelemetry Integration:**
```typescript
// Automatic instrumentation for all API routes
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('crypto-news');
const span = tracer.startSpan('fetch-news');
```

---

## 📖 Documentation Site

Full documentation site powered by MkDocs Material:

```bash
# Serve docs locally
pip install mkdocs-material
mkdocs serve

# Build static site
mkdocs build
```

**30+ documentation pages** covering:
- API Reference & Tutorials (19 step-by-step guides)
- Architecture & Database design
- AI Features & RAG system
- Security & Authentication
- Deployment & Scaling
- SDK documentation for all 13 languages
- Prompt templates for AI features
- Admin & operations guides

Live docs: [cryptocurrency.cv/developers](https://cryptocurrency.cv/developers)

---

## 📚 Storybook Component Gallery

Browse and test **60+ UI components** in isolation:

```bash
pnpm storybook
```

**Featured Stories:**

| Category | Components |
|----------|------------|
| **News** | NewsCard, FeaturedArticle, BreakingNewsBanner, LiveNewsTicker, ArticleIntelligenceBadges |
| **Market** | FearGreedIndex, MarketStats, DominanceChart, LivePrice, Screener |
| **AI** | BullBearDebate, ClickbaitDetector, SentimentDashboard, PredictionTracker |
| **Trading** | WhaleAlerts, CryptoCalculator, GasTracker |
| **Social** | InfluencerLeaderboard, SocialBuzz |
| **UX** | Animations, CategoryNav, BookmarkButton |

Each story includes interactive controls, responsive previews, and accessibility checks.

---

## 🔧 Inngest Background Jobs

11 background job functions that keep data fresh via [Inngest](https://inngest.com):

| Job | Schedule | Description |
|-----|----------|-------------|
| `archive/collect` | Every hour | Collect & enrich new articles |
| `archive/sentiment` | Every hour | Run sentiment analysis on new articles |
| `archive/market-snapshot` | Every hour | Capture BTC/ETH prices + Fear & Greed |
| `archive/coverage-gap` | Every 6 hours | Detect under-covered topics |
| `archive/derivatives` | Every hour | Snapshot derivatives market data |
| `social/collect` | Every 30 min | Collect social signals |
| `feeds/monitor` | Every 15 min | Monitor RSS feed health |
| `cleanup/expired-keys` | Daily | Remove expired API keys |
| `digest/generate` | Every 6 hours | Generate AI news digests |
| `predictions/resolve` | Daily | Resolve prediction outcomes |
| `newsletter/send` | Weekly | Send newsletter to subscribers |

Jobs are defined in `/api/inngest` and run automatically on Vercel or any Inngest-compatible host.

---

## 🧪 Chaos Engineering & Load Testing

Production resilience testing scripts:

```bash
# Chaos tests
scripts/chaos/network-latency.sh    # Simulate network delays
scripts/chaos/redis-failure.sh       # Test Redis failover
scripts/chaos/upstream-failure.sh    # Simulate source outages

# Load tests (k6)
k6 run scripts/load-tests/baseline.js         # Baseline performance
k6 run scripts/load-tests/breaking-news-spike.js  # Traffic spike
k6 run scripts/load-tests/soak.js              # Sustained load
k6 run scripts/load-tests/websocket.js         # WebSocket stress
```

**Performance Budgets** defined in `scripts/load-tests/budgets.json` enforce:
- p95 latency <500ms
- Error rate <1%
- Throughput >100 req/s per instance

