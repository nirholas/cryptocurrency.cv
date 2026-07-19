#!/usr/bin/env bash
# One-shot production deploy + env configuration for cryptocurrency-cv on GCP.
#
# Prereq: `gcloud auth login` (the nich@sperax.io token expires under Google's
# periodic reauth policy — invalid_rapt). Run this from the repo root.
#
# Env keys are OPTIONAL: the app boots and serves without any of them. Set the
# ones you have; each unlocks a capability. Ranked by impact:
#   COINGECKO_API_KEY  - free demo key at coingecko.com/en/api; raises the
#                        keyless rate-limit ceiling that currently forces the
#                        CoinPaprika/CoinCap/DefiLlama fallbacks. Highest impact.
#   GROQ_API_KEY       - free at console.groq.com; enables AI summaries +
#                        real-time translation.
#   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN - free at upstash.com;
#                        shared cache across instances (cuts upstream calls,
#                        further reduces 429s). Without it: per-instance memory.
#   DATABASE_URL       - Neon/Postgres; enables API keys, usage, user features.
#   OPENROUTER_API_KEY / ANTHROPIC_API_KEY / OPENAI_API_KEY - AI fallback chain.
#   ETHERSCAN_API_KEY, LUNARCRUSH_API_KEY, DUNE_API_KEY, ... - richer data lanes.
#
# Several of these already exist in the three.ws Cloud Run service env
# (same GCP project) and can be reused:
#   gcloud run services describe three-ws-api --region us-central1 \
#     --project aerial-vehicle-466722-p5 --format=yaml | grep -A1 -iE 'GROQ|UPSTASH|DATABASE|OPENROUTER'
set -euo pipefail
P=aerial-vehicle-466722-p5
R=us-central1
SVC=cryptocurrency-cv

echo "== Build + deploy image =="
gcloud builds submit --config cloudbuild.yaml --region "$R" --project "$P"

# Set only the env vars that are exported in this shell (skip the empties).
UPDATES=""
for K in COINGECKO_API_KEY GROQ_API_KEY UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN \
         DATABASE_URL OPENROUTER_API_KEY ANTHROPIC_API_KEY OPENAI_API_KEY \
         ETHERSCAN_API_KEY LUNARCRUSH_API_KEY DUNE_API_KEY NEXT_PUBLIC_APP_URL; do
  V="${!K:-}"
  [ -n "$V" ] && UPDATES="${UPDATES}${UPDATES:+,}${K}=${V}"
done

if [ -n "$UPDATES" ]; then
  echo "== Applying env: $(echo "$UPDATES" | tr ',' '\n' | cut -d= -f1 | tr '\n' ' ') =="
  gcloud run services update "$SVC" --region "$R" --project "$P" --update-env-vars "$UPDATES"
else
  echo "== No env vars exported; deployed with existing config =="
fi

echo "== Verify =="
curl -s -o /dev/null -w "home: %{http_code}\n" https://cryptocurrency.cv/
curl -s -A axios/1.0 -o /dev/null -w "api/market/global-defi: %{http_code}\n" https://cryptocurrency.cv/api/market/global-defi
