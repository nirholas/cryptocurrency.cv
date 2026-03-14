# Section 1: Infrastructure & DevOps (Agents 1–5)

> These agents set up the cloud infrastructure, CI/CD, Docker, Kubernetes, and observability stack for Crypto Vision on GCP with $100k credits over 6 months.

---

## Agent 1 — GCP Terraform Foundation

**Goal:** Create all Terraform IaC for the core GCP infrastructure.

**Workspace:** `nirholas/xeepy` (now Crypto Vision, branch `master`)

**Context:**
- Brand: Crypto Vision — cryptocurrency.cv  
- Budget: $100k GCP credits, 6 months  
- The xeepy repo was wiped clean (orphan branch). Only a README.md exists.  
- This agent creates the entire `infra/` directory from scratch.

**Files to create:**

```
infra/
  terraform/
    main.tf
    variables.tf
    outputs.tf
    versions.tf
    terraform.tfvars.example
    modules/
      cloud-sql/
        main.tf
        variables.tf
        outputs.tf
      redis/
        main.tf
        variables.tf
        outputs.tf
      cloud-run/
        main.tf
        variables.tf
        outputs.tf
      cloud-cdn/
        main.tf
        variables.tf
        outputs.tf
      pubsub/
        main.tf
        variables.tf
        outputs.tf
      cloud-storage/
        main.tf
        variables.tf
        outputs.tf
      networking/
        main.tf
        variables.tf
        outputs.tf
      iam/
        main.tf
        variables.tf
        outputs.tf
```

**Requirements:**

1. **Cloud SQL module:** PostgreSQL 16 with TimescaleDB extension enabled. High-availability config. Private IP only (VPC peering). Automated backups. 2 vCPU / 8GB RAM initial sizing. Connection via Cloud SQL Auth Proxy.

2. **Redis module:** Memorystore Redis 7.x. 5GB initial, Standard tier for HA. Private service access. Used for: rate limiting, caching, pub/sub for real-time price streaming.

3. **Cloud Run module:** Two services — `api` (main API) and `workers` (data pipeline workers). Min 1 / Max 20 instances for API. Min 1 / Max 5 for workers. 2 vCPU / 2GB RAM per instance. Custom domain mapping for cryptocurrency.cv.

4. **Cloud CDN module:** Global HTTP(S) load balancer in front of Cloud Run. SSL certificate for cryptocurrency.cv and *.cryptocurrency.cv. Cache static responses (prices cached 10s, news cached 60s).

5. **Pub/Sub module:** Topics: `price-updates`, `news-ingested`, `alerts-triggered`, `webhook-delivery`. Subscriptions with dead-letter queues. Push subscriptions to Cloud Run workers.

6. **Cloud Storage module:** Buckets: `cv-archive` (nearline, for historical data), `cv-exports` (standard, for user data exports), `cv-backups` (coldline, DB backups).

7. **Networking module:** VPC with private subnets. Cloud NAT for outbound. Firewall rules. VPC connector for Cloud Run → Cloud SQL/Redis.

8. **IAM module:** Service accounts for Cloud Run API, Cloud Run Workers, CI/CD. Least-privilege roles. Workload Identity Federation for GitHub Actions.

9. **Variables:** Project ID, region (us-central1), environment (dev/staging/prod), domain name, alert email.

10. **Outputs:** Cloud SQL connection string, Redis host, Cloud Run URLs, CDN IP, Pub/Sub topic names.

**Instructions:**
- Use Google provider `~> 5.0`
- Use `google-beta` provider where needed (TimescaleDB, etc.)
- All resources should be tagged with `project = "crypto-vision"`, `environment = var.environment`
- Include cost estimation comments showing monthly cost for each resource
- Create a `README.md` in `infra/terraform/` explaining how to `terraform init/plan/apply`
- Do NOT touch any files outside `infra/terraform/`
- Commit message: `feat(infra): add Terraform GCP foundation modules`

---

## Agent 2 — CI/CD GitHub Actions

**Goal:** Create comprehensive GitHub Actions workflows for CI/CD, testing, and deployment.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
.github/
  workflows/
    ci.yml
    deploy-api.yml
    deploy-workers.yml
    deploy-website.yml
    terraform-plan.yml
    terraform-apply.yml
    security-scan.yml
    sdk-release.yml
    docker-build.yml
    scheduled-health.yml
  dependabot.yml
  CODEOWNERS
```

**Requirements:**

1. **ci.yml** — Runs on every PR. Steps: checkout, setup Bun, install deps (`pnpm install`), lint (`bun run lint`), typecheck (`bun run typecheck`), unit tests (`bun run test:run`), build (`bun run build`). Matrix: Node 20/22. Cache pnpm store. Fail fast.

2. **deploy-api.yml** — Deploys to Cloud Run on push to `master`. Steps: authenticate to GCP (Workload Identity Federation), build Docker image, push to Artifact Registry, deploy to Cloud Run `api` service. Environment: production. Requires CI passing.

3. **deploy-workers.yml** — Same as deploy-api but targets Cloud Run `workers` service. Triggered separately so workers can be deployed independently.

4. **deploy-website.yml** — Deploys the Crypto Vision marketing site. Trigger: push to `master` with changes in `website/` directory. Deploy to Cloud Run or Vercel.

5. **terraform-plan.yml** — Runs `terraform plan` on PRs that touch `infra/`. Comments the plan output on the PR. Uses Workload Identity Federation.

6. **terraform-apply.yml** — Runs `terraform apply -auto-approve` on merge to `master` for `infra/` changes. Requires approval from CODEOWNERS.

7. **security-scan.yml** — Weekly cron. Runs: Trivy container scan, npm audit, gitleaks secret scan, OWASP dependency check. Opens issues for findings.

8. **sdk-release.yml** — Triggered on tag `sdk-v*`. Publishes SDKs to: PyPI (Python), npm (TypeScript/JS), Go modules, RubyGems, crates.io (Rust), NuGet (C#), Maven (Java/Kotlin), Packagist (PHP). Each SDK has its own job.

9. **docker-build.yml** — Builds and pushes multi-arch Docker images (amd64/arm64) to GitHub Container Registry AND GCP Artifact Registry. Tags: `latest`, git SHA, semver if tagged.

10. **scheduled-health.yml** — Every 5 minutes. Hits `/api/health` on production. Posts to Slack/Discord webhook on failure. Tracks uptime.

11. **dependabot.yml** — Weekly updates for npm, pip, Docker, GitHub Actions, Terraform.

12. **CODEOWNERS** — `@nirholas` owns everything. `@nirholas` required for `infra/` changes.

**Instructions:**
- Use Bun for running scripts, pnpm for package management (per project rules)
- Git identity: `nirholas` / `22895867+nirholas@users.noreply.github.com`
- All workflows should use `ubuntu-latest`
- Use `actions/cache@v4` for dependencies
- Use `google-github-actions/auth@v2` for GCP auth
- Do NOT touch any files outside `.github/`
- Commit message: `ci: add comprehensive GitHub Actions workflows`

---

## Agent 3 — Docker & Container Setup

**Goal:** Create production-ready Docker configuration for all services.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
docker/
  api/
    Dockerfile
    .dockerignore
  workers/
    Dockerfile
    .dockerignore
  website/
    Dockerfile
    .dockerignore
docker-compose.yml
docker-compose.dev.yml
docker-compose.test.yml
```

**Requirements:**

1. **API Dockerfile:** Multi-stage build. Stage 1: `oven/bun:1` for install + build. Stage 2: `oven/bun:1-slim` for runtime. Copy only production deps and built output. Health check endpoint. Non-root user. ENV vars for DATABASE_URL, REDIS_URL, etc. Expose port 3000.

2. **Workers Dockerfile:** Similar multi-stage. Entry point runs data pipeline workers (price ingestion, news fetching, alert processing). Same base image. Expose port 3001 for health checks only.

3. **Website Dockerfile:** Next.js static export or SSR. Multi-stage with `node:20-alpine`. Optimized for minimal size.

4. **docker-compose.yml (production):** Services: api, workers, postgres (timescaledb/timescaledb:latest-pg16), redis (redis:7-alpine), nginx (reverse proxy). Volumes for persistent data. Networks: frontend, backend. Restart policies. Resource limits.

5. **docker-compose.dev.yml:** Extends production. Adds: hot reload (volume mounts), debug ports, pgAdmin, RedisInsight, Mailhog for email testing. No resource limits.

6. **docker-compose.test.yml:** Minimal setup for CI. Postgres + Redis only. Ephemeral (no volumes). Used by GitHub Actions.

**Instructions:**
- Follow Docker best practices (layer caching, minimal images, security scanning)
- Include `.dockerignore` files that exclude `node_modules`, `.git`, `.env`, `archive/`, `docs/`
- All images should be under 200MB production size
- Add labels: `org.opencontainers.image.source=https://github.com/nirholas/crypto-vision`
- Do NOT touch any files outside `docker/` and `docker-compose*.yml`
- Commit message: `feat(docker): add production Docker setup for all services`

---

## Agent 4 — Kubernetes Helm Charts

**Goal:** Create Helm charts for deploying Crypto Vision to GKE (Google Kubernetes Engine) as an alternative to Cloud Run.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
infra/helm/
  crypto-vision/
    Chart.yaml
    values.yaml
    values.production.yaml
    values.staging.yaml
    templates/
      _helpers.tpl
      api-deployment.yaml
      api-service.yaml
      api-hpa.yaml
      api-ingress.yaml
      workers-deployment.yaml
      workers-service.yaml
      workers-hpa.yaml
      redis-deployment.yaml
      redis-service.yaml
      configmap.yaml
      secrets.yaml
      serviceaccount.yaml
      networkpolicy.yaml
      poddisruptionbudget.yaml
      NOTES.txt
```

**Requirements:**

1. **API deployment:** 3 replicas min, 20 max. Liveness/readiness probes on `/api/health`. Resource requests: 500m CPU, 512Mi memory. Limits: 2 CPU, 2Gi. Rolling update strategy. Pod anti-affinity (spread across zones).

2. **Workers deployment:** 2 replicas min, 10 max. Separate resource profile. Priority class lower than API.

3. **HPA:** CPU target 70%, custom metrics on request latency p99.

4. **Ingress:** NGINX ingress controller. TLS via cert-manager. Host rules for `cryptocurrency.cv`, `api.cryptocurrency.cv`. Rate limiting annotations.

5. **Network policies:** API can talk to Redis and Postgres. Workers can talk to Redis, Postgres, and external APIs. Redis/Postgres only accessible from within cluster.

6. **ConfigMap:** Non-sensitive config (API URLs, feature flags, cache TTLs).

7. **Secrets:** Template for DATABASE_URL, REDIS_URL, API keys (externalized via GCP Secret Manager).

8. **PodDisruptionBudget:** At least 2 API pods always available.

**Instructions:**
- Chart version: 0.1.0, App version: 1.0.0
- Use Helm 3 conventions
- Include `helm lint` and `helm template` examples in a README
- Do NOT touch any files outside `infra/helm/`
- Commit message: `feat(k8s): add Helm charts for GKE deployment`

---

## Agent 5 — Observability & Monitoring

**Goal:** Set up comprehensive observability: logging, metrics, tracing, alerting, and dashboards.

**Workspace:** `nirholas/xeepy` (Crypto Vision, branch `master`)

**Files to create:**

```
infra/monitoring/
  grafana/
    dashboards/
      api-overview.json
      data-pipeline.json
      infrastructure.json
      business-metrics.json
    provisioning/
      dashboards.yml
      datasources.yml
  prometheus/
    prometheus.yml
    alerts/
      api-alerts.yml
      pipeline-alerts.yml
      infrastructure-alerts.yml
  alertmanager/
    alertmanager.yml
docker-compose.observability.yml
src/lib/observability/
  metrics.ts
  tracing.ts
  logger.ts
  health.ts
```

**Requirements:**

1. **Metrics (metrics.ts):** Export Prometheus-compatible metrics using `prom-client`. Metrics: `http_requests_total` (counter, labels: method, path, status), `http_request_duration_seconds` (histogram), `data_pipeline_fetch_duration_seconds` (histogram, labels: source), `data_pipeline_errors_total` (counter), `cache_hit_ratio` (gauge), `active_websocket_connections` (gauge), `api_key_usage_total` (counter, label: tier), `rate_limit_exceeded_total` (counter).

2. **Tracing (tracing.ts):** OpenTelemetry setup using `@opentelemetry/sdk-trace-node`. Export to Google Cloud Trace (production) and Jaeger (development). Auto-instrument HTTP, PostgreSQL, Redis. Custom spans for data pipeline operations.

3. **Logger (logger.ts):** Pino-based structured logging. JSON format in production. Pretty print in dev. Log levels: trace/debug/info/warn/error/fatal. Include request ID, trace ID, user agent. Redact sensitive fields (API keys, tokens).

4. **Health (health.ts):** Deep health check endpoint. Check: PostgreSQL connection, Redis connection, upstream API reachability (CoinGecko, Binance), disk space, memory usage. Return detailed status JSON with response times for each dependency.

5. **Grafana dashboards:**
   - API Overview: Request rate, latency p50/p95/p99, error rate, top endpoints, geographic distribution
   - Data Pipeline: Fetch success/failure rates per source, latency, staleness (time since last update), circuit breaker states
   - Infrastructure: CPU/memory/disk per service, PostgreSQL connections/queries, Redis memory/hit rate
   - Business Metrics: API key registrations, request volume by tier, revenue (x402 payments), top consumers

6. **Prometheus config:** Scrape API metrics endpoint every 15s. Scrape Cloud SQL exporter. Scrape Redis exporter.

7. **Alert rules:**
   - API: Error rate > 5% for 5min, p99 latency > 2s for 5min, any 5xx spike
   - Pipeline: Data staleness > 5min for prices, > 15min for news, circuit breaker open > 10min
   - Infra: CPU > 80% for 10min, memory > 90%, disk > 85%, PostgreSQL connections > 80% of max

8. **Alertmanager:** Route critical alerts to PagerDuty/Slack. Route warnings to email. Group by service. Inhibit rules (don't alert on API errors if database is down).

**Instructions:**
- The `src/lib/observability/` directory already exists in free-crypto-news — design these files to be compatible but for the NEW Crypto Vision repo
- Use `prom-client` v15+ for metrics
- Use `@opentelemetry/sdk-trace-node` for tracing
- Use `pino` v9+ for logging
- docker-compose.observability.yml should add: Prometheus, Grafana, Jaeger, Alertmanager
- Do NOT touch any files outside `infra/monitoring/`, `docker-compose.observability.yml`, and `src/lib/observability/`
- Commit message: `feat(observability): add monitoring, tracing, logging, and alerting`
