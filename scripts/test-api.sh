#!/bin/bash
# Test API endpoints

BASE_URL="http://localhost:3000"

echo "=== Testing API Endpoints ==="
echo ""

test_endpoint() {
  local endpoint=$1
  local result=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
  if [ "$result" == "200" ]; then
    echo "✅ $endpoint - $result OK"
  elif [ "$result" == "000" ]; then
    echo "⚠️  $endpoint - Server not reachable"
  else
    echo "❌ $endpoint - $result"
  fi
}

# Core endpoints
echo "--- Core Endpoints ---"
test_endpoint "/api/health"
test_endpoint "/api/news?limit=2"
test_endpoint "/api/news/categories"
test_endpoint "/api/sources"
test_endpoint "/api/stats"

echo ""
echo "--- Search & Trending ---"
test_endpoint "/api/search?q=bitcoin"
test_endpoint "/api/trending"
test_endpoint "/api/breaking"

echo ""
echo "--- Trading Endpoints ---"
test_endpoint "/api/fear-greed"
test_endpoint "/api/arbitrage"
test_endpoint "/api/signals"
test_endpoint "/api/funding"
test_endpoint "/api/liquidations"
test_endpoint "/api/whale-alerts"
test_endpoint "/api/options"
test_endpoint "/api/orderbook"

echo ""
echo "--- AI/Analysis Endpoints ---"
test_endpoint "/api/narratives"
test_endpoint "/api/sentiment"
test_endpoint "/api/claims"
test_endpoint "/api/entities"

echo ""
echo "--- Research Endpoints ---"
test_endpoint "/api/regulatory"
test_endpoint "/api/academic"
test_endpoint "/api/predictions"
test_endpoint "/api/citations"

echo ""
echo "--- Social Endpoints ---"
test_endpoint "/api/social"
test_endpoint "/api/influencers"

echo ""
echo "--- Market Data ---"
test_endpoint "/api/market/coins"
test_endpoint "/api/market/exchanges"

echo ""
echo "=== Test Complete ==="
