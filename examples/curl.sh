#!/bin/bash

# Copyright 2024-2026 nirholas. All rights reserved.
# SPDX-License-Identifier: SEE LICENSE IN LICENSE
# https://github.com/nirholas/free-crypto-news
#
# This file is part of free-crypto-news.
# Unauthorized copying, modification, or distribution is strictly prohibited.

# Free Crypto News API - Comprehensive curl examples
# No API key required for public endpoints!
# Base URL: https://cryptocurrency.cv/api

API="https://cryptocurrency.cv"

# ──────────────────────────────────────────────
# NEWS ENDPOINTS
# ──────────────────────────────────────────────

echo "📰 Latest News"
curl -s "$API/api/news?limit=3" | jq '.articles[] | {title, source, timeAgo}'

echo -e "\n🔍 Search for 'ethereum'"
curl -s "$API/api/search?q=ethereum&limit=3" | jq '.articles[] | {title, source}'

echo -e "\n₿ Bitcoin News"
curl -s "$API/api/bitcoin?limit=3" | jq '.articles[] | {title, source}'

echo -e "\n💰 DeFi News"
curl -s "$API/api/defi?limit=3" | jq '.articles[] | {title, source}'

echo -e "\n🚨 Breaking News"
curl -s "$API/api/breaking?limit=3" | jq '.articles[] | {title, source, timeAgo}'

echo -e "\n🔥 Trending Topics"
curl -s "$API/api/trending?limit=5&period=24h" | jq '.'

echo -e "\n📋 Daily Digest"
curl -s "$API/api/digest?period=daily&format=brief" | jq '.'

echo -e "\n🌍 International News (Spanish)"
curl -s "$API/api/news/international?language=es&limit=3" | jq '.articles[] | {title, source}'

echo -e "\n🏷️ Tags"
curl -s "$API/api/tags" | jq '.tags[:5]'

echo -e "\n📂 News Categories"
curl -s "$API/api/news/categories" | jq '.'

echo -e "\n📡 Sources"
curl -s "$API/api/sources" | jq '.sources[] | {name, status}'

# ──────────────────────────────────────────────
# MARKET DATA ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n💹 Top Coins by Market Cap"
curl -s "$API/api/market/coins?per_page=5" | jq '.'

echo -e "\n📊 OHLC Data (Bitcoin, 7 days)"
curl -s "$API/api/market/ohlc/bitcoin?days=7&vs_currency=usd" | jq '.'

echo -e "\n💲 Current Prices"
curl -s "$API/api/prices?ids=bitcoin,ethereum&vs_currencies=usd" | jq '.'

echo -e "\n😱 Fear & Greed Index"
curl -s "$API/api/fear-greed" | jq '{value, classification}'

echo -e "\n🌐 Global Market Data"
curl -s "$API/api/global" | jq '.'

echo -e "\n📈 Top Gainers"
curl -s "$API/api/market/gainers" | jq '.'

echo -e "\n📉 Top Losers"
curl -s "$API/api/market/losers" | jq '.'

echo -e "\n🏦 Market Dominance"
curl -s "$API/api/market/dominance" | jq '.'

echo -e "\n🔍 Search Coins"
curl -s "$API/api/market/search?q=solana" | jq '.'

echo -e "\n⚖️ Compare Coins"
curl -s "$API/api/market/compare?coins=bitcoin,ethereum" | jq '.'

echo -e "\n🏢 Exchanges"
curl -s "$API/api/market/exchanges" | jq '.'

# ──────────────────────────────────────────────
# DeFi ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n🌾 DeFi Yields"
curl -s "$API/api/defi/yields" | jq '.'

echo -e "\n💵 Stablecoin Yields"
curl -s "$API/api/defi/yields/stablecoins" | jq '.'

echo -e "\n📊 DeFi Summary"
curl -s "$API/api/defi/summary" | jq '.'

echo -e "\n🔄 DEX Volumes"
curl -s "$API/api/defi/dex-volumes" | jq '.'

echo -e "\n🌉 Bridge Data"
curl -s "$API/api/defi/bridges" | jq '.'

echo -e "\n🪙 Stablecoins"
curl -s "$API/api/stablecoins" | jq '.'

# ──────────────────────────────────────────────
# TRADING ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n📊 Arbitrage Opportunities"
curl -s "$API/api/arbitrage?min_spread=0.5&limit=10" | jq '.'

echo -e "\n📡 Trading Signals"
curl -s "$API/api/signals?asset=BTC&timeframe=4h" | jq '.'

echo -e "\n💰 Funding Rates"
curl -s "$API/api/funding" | jq '.'

echo -e "\n💥 Liquidations"
curl -s "$API/api/liquidations?timeframe=24h" | jq '.'

echo -e "\n🐋 Whale Alerts"
curl -s "$API/api/whale-alerts?min_value=5000000&limit=10" | jq '.'

echo -e "\n📖 Orderbook"
curl -s "$API/api/orderbook?symbol=BTCUSDT&exchange=binance&depth=10" | jq '.'

echo -e "\n📈 Derivatives"
curl -s "$API/api/derivatives" | jq '.'

echo -e "\n📊 Options"
curl -s "$API/api/options?asset=BTC" | jq '.'

# ──────────────────────────────────────────────
# BLOCKCHAIN ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n₿ Bitcoin Mempool Fees"
curl -s "$API/api/bitcoin/mempool/fees" | jq '.'

echo -e "\n📊 Bitcoin Network Stats"
curl -s "$API/api/bitcoin/network-stats" | jq '.'

echo -e "\n⛽ Ethereum Gas Prices"
curl -s "$API/api/gas" | jq '.'

echo -e "\n📊 On-Chain Metrics"
curl -s "$API/api/onchain/metrics?asset=BTC&metric=active_addresses" | jq '.'

echo -e "\n🔄 Exchange Flows"
curl -s "$API/api/onchain/exchange-flows?asset=BTC" | jq '.'

echo -e "\n🖼️ NFT Overview"
curl -s "$API/api/nft" | jq '.'

echo -e "\n🔥 Trending NFTs"
curl -s "$API/api/nft/collections/trending" | jq '.'

echo -e "\n🔗 L2 Ecosystem"
curl -s "$API/api/l2" | jq '.'

echo -e "\n☀️ Solana Overview"
curl -s "$API/api/solana" | jq '.'

echo -e "\n🪂 Airdrops"
curl -s "$API/api/airdrops" | jq '.'

# ──────────────────────────────────────────────
# SOCIAL ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n👥 Social Overview"
curl -s "$API/api/social" | jq '.'

echo -e "\n📊 Social Sentiment"
curl -s "$API/api/social/sentiment" | jq '.'

echo -e "\n🌟 Top Influencers"
curl -s "$API/api/social/influencers" | jq '.'

echo -e "\n🔥 Trending Social Topics"
curl -s "$API/api/social/topics/trending" | jq '.'

echo -e "\n🏛️ Governance"
curl -s "$API/api/governance" | jq '.'

echo -e "\n📅 Events"
curl -s "$API/api/events" | jq '.'

# ──────────────────────────────────────────────
# AI / TOOLS ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n🤖 AI Sentiment Analysis"
curl -s "$API/api/sentiment?asset=bitcoin&period=24h" | jq '.'

echo -e "\n❓ Ask AI a Question"
curl -s "$API/api/ask?q=What%20is%20happening%20with%20Bitcoin%20ETFs?" | jq '.'

echo -e "\n📝 AI Daily Brief"
curl -s "$API/api/ai/brief?format=detailed" | jq '.'

echo -e "\n⚡ AI Flash Briefing"
curl -s "$API/api/ai/flash-briefing" | jq '.'

echo -e "\n📰 Narratives"
curl -s "$API/api/narratives" | jq '.'

echo -e "\n🏷️ Entities"
curl -s "$API/api/entities" | jq '.'

echo -e "\n🔍 Fact Check"
curl -s "$API/api/factcheck?claim=Bitcoin%20uses%20more%20energy%20than%20Argentina" | jq '.'

echo -e "\n📈 Predictions"
curl -s "$API/api/predictions" | jq '.'

echo -e "\n🔮 AI Oracle"
curl -s "$API/api/ai/oracle?asset=BTC" | jq '.'

echo -e "\n⚖️ Regulatory Updates"
curl -s "$API/api/regulatory" | jq '.'

echo -e "\n🌍 Macro Data"
curl -s "$API/api/macro" | jq '.'

echo -e "\n📊 Macro Indicators"
curl -s "$API/api/macro/indicators" | jq '.'

echo -e "\n🧠 Knowledge Graph"
curl -s "$API/api/knowledge-graph" | jq '.'

echo -e "\n📖 Glossary"
curl -s "$API/api/glossary" | jq '.'

echo -e "\n🎯 Clickbait Detection"
curl -s "$API/api/clickbait?title=You%20WONT%20BELIEVE%20what%20Bitcoin%20did" | jq '.'

echo -e "\n🤖 AI Analysis (POST)"
curl -s -X POST "$API/api/ai" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "summarize",
    "title": "Bitcoin ETF Approved",
    "content": "The SEC has approved the first spot Bitcoin ETF.",
    "options": {"length": "short"}
  }' | jq '.'

echo -e "\n🐂🐻 AI Debate (POST)"
curl -s -X POST "$API/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Will Bitcoin reach $200k in 2026?"}' | jq '.'

echo -e "\n🔄 AI Counter Arguments (POST)"
curl -s -X POST "$API/api/ai/counter" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Bitcoin is too volatile for institutional adoption"}' | jq '.'

echo -e "\n🔎 AI Content Detection (POST)"
curl -s -X POST "$API/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{"content": "Bitcoin is the future of finance."}' | jq '.'

# ──────────────────────────────────────────────
# DeFi ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n📊 DeFi Protocol Health"
curl -s "$API/api/defi/protocol-health" | jq '.'

echo -e "\n📈 Yield Stats"
curl -s "$API/api/defi/yields/stats" | jq '.'

echo -e "\n🔗 DeFi Yield Chains"
curl -s "$API/api/defi/yields/chains" | jq '.'

echo -e "\n🪙 Stablecoin Depeg Monitor"
curl -s "$API/api/stablecoins/depeg" | jq '.'

echo -e "\n📊 Stablecoin Dominance"
curl -s "$API/api/stablecoins/dominance" | jq '.'

# ──────────────────────────────────────────────
# BLOCKCHAIN ENDPOINTS (extended)
# ──────────────────────────────────────────────

echo -e "\n⛏️ Bitcoin Difficulty"
curl -s "$API/api/bitcoin/difficulty" | jq '.'

echo -e "\n📦 Bitcoin Blocks"
curl -s "$API/api/bitcoin/blocks" | jq '.'

echo -e "\n📊 Bitcoin Block Height"
curl -s "$API/api/bitcoin/block-height" | jq '.'

echo -e "\n⛽ Gas Estimation"
curl -s "$API/api/gas/estimate" | jq '.'

echo -e "\n📊 Gas History"
curl -s "$API/api/gas/history" | jq '.'

echo -e "\n🔗 L2 Projects"
curl -s "$API/api/l2/projects" | jq '.'

echo -e "\n📊 L2 Activity"
curl -s "$API/api/l2/activity" | jq '.'

echo -e "\n☀️ Solana Tokens"
curl -s "$API/api/solana/tokens" | jq '.'

echo -e "\n🪂 Token Unlocks"
curl -s "$API/api/token-unlocks" | jq '.'

echo -e "\n🐋 Whale Alerts with Context"
curl -s "$API/api/whale-alerts/context" | jq '.'

echo -e "\n📊 NFT Market"
curl -s "$API/api/nft/market" | jq '.'

echo -e "\n💰 NFT Recent Sales"
curl -s "$API/api/nft/sales/recent" | jq '.'

# ──────────────────────────────────────────────
# TRADING ENDPOINTS (extended)
# ──────────────────────────────────────────────

echo -e "\n💰 Funding Dashboard"
curl -s "$API/api/funding/dashboard" | jq '.'

echo -e "\n📊 Funding History (BTCUSDT)"
curl -s "$API/api/funding/history/BTCUSDT" | jq '.'

echo -e "\n📊 Derivatives Opportunities"
curl -s "$API/api/derivatives/opportunities" | jq '.'

echo -e "\n🔙 Backtest Strategy"
curl -s "$API/api/backtest?strategy=sma_crossover&asset=BTC&period=30d" | jq '.'

# ──────────────────────────────────────────────
# FEEDS & EXPORT ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n📡 RSS Feed"
curl -s "$API/api/rss?limit=3" | head -50

echo -e "\n📡 JSON Feed"
curl -s "$API/api/rss.json" | jq '.items[:2]'

echo -e "\n📡 Atom Feed"
curl -s "$API/api/atom?limit=3" | head -50

echo -e "\n📋 OPML"
curl -s "$API/api/opml" | head -20

echo -e "\n📤 Export"
curl -s "$API/api/export?format=json&limit=5" | jq '.'

echo -e "\n📦 Archive"
curl -s "$API/api/archive?date=2025-01-01&limit=3" | jq '.'

echo -e "\n🤖 LLMs.txt"
curl -s "$API/api/llms.txt" | head -20

echo -e "\n📄 OpenAPI Spec"
curl -s "$API/api/openapi.json" | jq '.info'

# ──────────────────────────────────────────────
# UTILITY ENDPOINTS
# ──────────────────────────────────────────────

echo -e "\n🏥 Health Check"
curl -s "$API/api/health" | jq '.'

echo -e "\n📊 Statistics"
curl -s "$API/api/stats" | jq '.'

echo -e "\n📊 Global Data"
curl -s "$API/api/global" | jq '.'

echo -e "\n💱 Exchange Rates"
curl -s "$API/api/exchange-rates" | jq '.'

echo -e "\n🔄 Convert BTC to USD"
curl -s "$API/api/exchange-rates/convert?from=BTC&to=USD&amount=1" | jq '.'

echo -e "\n✅ Done! All endpoints tested."
