#!/bin/bash

# Free Crypto News Alfred Workflow
# Usage: ./crypto-news.sh [command] [args]

API_BASE="https://cryptocurrency.cv/api"
COMMAND="${1:-news}"
LIMIT="${2:-10}"

case "$COMMAND" in
  news|latest)
    curl -s "$API_BASE/news?limit=$LIMIT"
    ;;
  breaking)
    curl -s "$API_BASE/breaking?limit=$LIMIT"
    ;;
  bitcoin|btc)
    curl -s "$API_BASE/bitcoin?limit=$LIMIT"
    ;;
  defi)
    curl -s "$API_BASE/defi?limit=$LIMIT"
    ;;
  search)
    QUERY="$2"
    curl -s "$API_BASE/search?q=$(echo "$QUERY" | sed 's/ /%20/g')&limit=${3:-10}"
    ;;
  trending)
    curl -s "$API_BASE/trending?limit=$LIMIT"
    ;;
  *)
    echo '{"items": [{"title": "Unknown command", "subtitle": "Use: news, breaking, bitcoin, defi, search, trending"}]}'
    ;;
esac
