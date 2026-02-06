#!/bin/bash
# Free Crypto News API - curl examples
# No API key required!

API="https://cryptocurrency.cv"

echo "📰 Latest News"
curl -s "$API/api/news?limit=3" | jq '.articles[] | {title, source, timeAgo}'

echo -e "\n🔍 Search for 'ethereum'"
curl -s "$API/api/search?q=ethereum&limit=3" | jq '.articles[] | {title, source}'

echo -e "\n💰 DeFi News"
curl -s "$API/api/defi?limit=3" | jq '.articles[] | {title, source}'

echo -e "\n₿ Bitcoin News"
curl -s "$API/api/bitcoin?limit=3" | jq '.articles[] | {title, source}'

echo -e "\n🚨 Breaking News"
curl -s "$API/api/breaking?limit=3" | jq '.articles[] | {title, source, timeAgo}'

echo -e "\n📡 Sources"
curl -s "$API/api/sources" | jq '.sources[] | {name, status}'
