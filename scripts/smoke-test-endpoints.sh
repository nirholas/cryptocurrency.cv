#!/usr/bin/env bash
# Smoke-test all public API endpoints on cryptocurrency.cv
# Usage: bash scripts/smoke-test-endpoints.sh [BASE_URL]
#
# Hits every GET endpoint with a lightweight request and reports status codes.
# Skips endpoints that need auth, POST-only, dynamic [params], or internal routes.

set -euo pipefail

BASE="${1:-https://cryptocurrency.cv}"
PASS=0
FAIL=0
SLOW=0
ERRORS=()

# Generate the endpoint list from the filesystem (same approach as generate-route-manifest.js)
ENDPOINTS=$(find src/app/api -name 'route.ts' -print0 \
  | xargs -0 -I{} dirname {} \
  | sed 's|src/app||' \
  | grep -v '\[' \
  | grep -vE '/(admin|cron|internal|auth|inngest|well-known|register|dashboard|billing|push|monitor|cache|providers|gateway|storage|notifications|newsletter|contact|views|frames|pipelines|origins|keys|premium/api-keys|premium/streams)' \
  | sort -u)

TOTAL=$(echo "$ENDPOINTS" | wc -l)
echo "=== Smoke Testing $TOTAL endpoints against $BASE ==="
echo ""

i=0
for ep in $ENDPOINTS; do
  i=$((i + 1))
  
  # Add minimal query params for endpoints that require them 
  url="${BASE}${ep}"
  case "$ep" in
    /api/search|/api/search/v2|/api/v1/search)
      url="${url}?q=bitcoin" ;;
    /api/search/semantic)
      continue ;;  # POST only
    /api/ask|/api/v1/ask)
      url="${url}?q=what+is+bitcoin" ;;
    /api/sentiment|/api/v1/sentiment)
      url="${url}?asset=BTC" ;;
    /api/prices)
      url="${url}?coins=bitcoin" ;;
    /api/compare|/api/market/compare)
      url="${url}?coins=bitcoin,ethereum" ;;
    /api/ai|/api/ai/summarize|/api/ai/summarize/stream|/api/ai/relationships|/api/ai/entities)
      continue ;;  # POST only
    /api/rag/ask|/api/rag/search|/api/rag/stream|/api/rag/batch|/api/rag/timeline)
      continue ;;  # POST only
    /api/claims|/api/anomalies|/api/knowledge-graph|/api/export)
      continue ;;  # POST only or needs body
    /api/batch)
      continue ;;  # POST only
    /api/classify|/api/v1/classify)
      continue ;;  # needs body
    /api/translate)
      continue ;;  # POST only
    /api/forecast|/api/v1/forecast)
      url="${url}?asset=BTC" ;;
    /api/archive|/api/archive/v2)
      url="${url}?date=2025-01-01" ;;
    /api/ai/research|/api/v1/ai/research)
      url="${url}?q=bitcoin+ETF" ;;
    /api/ai/explain|/api/v1/ai/explain)
      url="${url}?topic=DeFi" ;;
    /api/ai/correlation)
      url="${url}?asset=BTC" ;;
    /api/social/sentiment)
      url="${url}?coin=BTC" ;;
    /api/detect/ai-content)
      continue ;;  # needs body
    /api/chart-analysis)
      continue ;;  # needs body
    /api/research/backtest)
      continue ;;  # POST only
    /api/analytics/causality|/api/analytics/forensics|/api/analytics/events)
      continue ;;  # POST only
    /api/market/orderbook)
      url="${url}?exchange=binance&symbol=BTC/USDT" ;;
    /api/v1/orderbook)
      url="${url}?symbol=BTC/USDT" ;;
    /api/v1/ohlcv)
      url="${url}?coin=bitcoin" ;;
    /api/portfolio/*)
      continue ;;  # needs auth
    /api/watchlist)
      continue ;;  # needs auth
    /api/dashboard/*)
      continue ;;  # needs auth
    /api/ai/counter)
      continue ;;  # POST only
    /api/inngest)
      continue ;;  # internal
    /api/sse|/api/ws|/api/prices/stream|/api/orderbook/stream|/api/market/stream|/api/news/stream)
      continue ;;  # streaming/websocket
  esac

  # Make the request with a 15s timeout
  start_ms=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))')
  HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || echo "000")
  end_ms=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1000))')
  
  # Calculate duration
  if [[ "$start_ms" =~ ^[0-9]+$ ]] && [[ "$end_ms" =~ ^[0-9]+$ ]]; then
    duration_ms=$(( (end_ms - start_ms) / 1000000 ))
  else
    duration_ms=0
  fi
  
  # Classify result
  if [[ "$HTTP_CODE" =~ ^2 ]]; then
    status="OK"
    PASS=$((PASS + 1))
    if [[ $duration_ms -gt 5000 ]]; then
      status="SLOW"
      SLOW=$((SLOW + 1))
    fi
  elif [[ "$HTTP_CODE" == "000" ]]; then
    status="TIMEOUT"
    FAIL=$((FAIL + 1))
    ERRORS+=("$ep → TIMEOUT")
  elif [[ "$HTTP_CODE" =~ ^4 ]]; then
    # 400/405 might just mean we need POST or params — not necessarily "down"
    if [[ "$HTTP_CODE" == "404" ]]; then
      status="NOT FOUND"
      FAIL=$((FAIL + 1))
      ERRORS+=("$ep → $HTTP_CODE")
    elif [[ "$HTTP_CODE" == "429" ]]; then
      status="RATE LIMITED"
      ERRORS+=("$ep → $HTTP_CODE")
      PASS=$((PASS + 1))  # endpoint is up, just rate limited
    else
      status="CLIENT ERR"
      PASS=$((PASS + 1))  # endpoint responded
    fi
  elif [[ "$HTTP_CODE" =~ ^5 ]]; then
    status="SERVER ERR"
    FAIL=$((FAIL + 1))
    ERRORS+=("$ep → $HTTP_CODE")
  else
    status="UNKNOWN"
    FAIL=$((FAIL + 1))
    ERRORS+=("$ep → $HTTP_CODE")
  fi

  printf "[%3d/%d] %3s  %-6s  %s\n" "$i" "$TOTAL" "$HTTP_CODE" "${duration_ms}ms" "$ep"
done

echo ""
echo "=== Results ==="
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo "Slow (>5s): $SLOW"
echo "Total tested: $((PASS + FAIL))"
echo ""

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo "=== ERRORS ==="
  for err in "${ERRORS[@]}"; do
    echo "  ✗ $err"
  done
  echo ""
fi

if [[ $FAIL -eq 0 ]]; then
  echo "All endpoints are UP ✓"
else
  echo "$FAIL endpoint(s) may be DOWN ✗"
  exit 1
fi
