# Deploying cryptocurrency.cv to Google Cloud Run

Production moved off Vercel on 2026-07-19 after Vercel disabled the deployment
(`x-vercel-error: DEPLOYMENT_DISABLED`). The app now runs on Google Cloud Run
behind a global external HTTPS load balancer, in the same GCP project and with
the same architecture as three.ws.

## Architecture

```
DNS (Namecheap or Cloudflare)
  A @   -> 8.233.190.191   (global static IP: compute address "cryptocurrency-cv-ip")
  A www -> 8.233.190.191
        |
Global External Application Load Balancer (EXTERNAL_MANAGED)
  :80  forwarding rule "cryptocurrency-cv-http"  -> url-map "cryptocurrency-cv-http-redirect" (301 -> https)
  :443 forwarding rule "cryptocurrency-cv-https" -> ssl-certificate "cryptocurrency-cv-cert"
        (Google-managed, cryptocurrency.cv + www, auto-renews)
        -> url-map "cryptocurrency-cv-lb"
        -> backend-service "cryptocurrency-cv-backend" (Cloud CDN ON, USE_ORIGIN_HEADERS)
        -> serverless NEG "cryptocurrency-cv-neg" (us-central1)
        |
Cloud Run service "cryptocurrency-cv" (us-central1, min 1 / max 4,
  2 vCPU / 2 Gi, port 3000, allow-unauthenticated,
  runtime SA three-ws@aerial-vehicle-466722-p5.iam.gserviceaccount.com)
        |
Cloud Scheduler "cryptocurrency-cv-warm" (every minute)
  -> GET <service>/api/cron/warm with Authorization: Bearer $CRON_SECRET
```

- **Project:** `aerial-vehicle-466722-p5`, region `us-central1`.
- **Image:** `us-central1-docker.pkg.dev/aerial-vehicle-466722-p5/cloud-run-source-deploy/cryptocurrency-cv:latest`, built from the repo-root `Dockerfile` (standalone Next.js output via `DOCKER_BUILD=1`).
- **Container port is 3000 on purpose:** `/api/cron/warm` self-fetches `http://localhost:3000` when `NEXT_PUBLIC_APP_URL` is unset, so the warm cron warms its own instance with no extra config.

## Deploying

From the repo root:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --region us-central1 --project aerial-vehicle-466722-p5
```

That single command builds the image (E2_HIGHCPU_32, BuildKit layer cache) and
deploys it to Cloud Run. Both service accounts are pinned in `cloudbuild.yaml`
because the project's default compute SA was deleted.

## Environment variables

The app boots and serves with zero env vars (in-memory cache, no AI features).
Everything from `.env.example` is optional at runtime; set what you have:

```bash
gcloud run services update cryptocurrency-cv \
  --region us-central1 --project aerial-vehicle-466722-p5 \
  --update-env-vars KEY=value
```

Never use `--set-env-vars` for a single key (it replaces the whole set).
Currently set: `CRON_SECRET` (protects `/api/cron/warm`).

Recommended next: `GROQ_API_KEY` (free, enables AI summaries + translation),
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (persistent cache),
`PAYMENT_ADDRESS` (enables the x402 paid API tier).

## DNS cutover

Point at the load balancer IP from any DNS provider:

```
A  @    8.233.190.191
A  www  8.233.190.191
```

The Google-managed cert leaves PROVISIONING within ~15-60 min of DNS resolving
to that IP. Check with:

```bash
gcloud compute ssl-certificates describe cryptocurrency-cv-cert --global \
  --project aerial-vehicle-466722-p5 --format='value(managed.status)'
```

If using Cloudflare: add the records DNS-only (grey cloud) until the cert is
ACTIVE, then optionally enable the proxy (orange cloud) with SSL mode
"Full (strict)". Do not enable the proxy before the cert is ACTIVE or the
Google cert validation cannot complete.
