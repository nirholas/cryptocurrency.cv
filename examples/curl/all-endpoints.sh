#!/bin/bash
# =============================================================================
# Free Crypto News API - cURL Examples
# https://github.com/nirholas/free-crypto-news
# 
# Complete cURL examples for all API endpoints
# =============================================================================

BASE_URL="https://cryptocurrency.cv"

# =============================================================================
# NEWS ENDPOINTS
# =============================================================================

echo "📰 NEWS ENDPOINTS"
echo "================="

# GET /api/news - Main News Feed
echo "1. Get latest news (20 articles)"
curl -s "$BASE_URL/api/news?limit=20" | head -c 500
echo -e "\n"

# GET /api/news - With category filter
echo "2. Get Bitcoin news"
curl -s "$BASE_URL/api/news?category=bitcoin&limit=10"
echo -e "\n"

# GET /api/news - With source filter
echo "3. Get news from CoinDesk"
curl -s "$BASE_URL/api/news?source=coindesk&limit=5"
echo -e "\n"

# GET /api/news/international - International news
echo "4. Get Korean news (translated)"
curl -s "$BASE_URL/api/news/international?lang=ko&translate=true"
echo -e "\n"

# POST /api/news/extract - Extract article content
echo "5. Extract article content"
curl -s -X POST "$BASE_URL/api/news/extract" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
echo -e "\n"

# GET /api/bitcoin - Bitcoin-specific news
echo "6. Get Bitcoin news"
curl -s "$BASE_URL/api/bitcoin?limit=10"
echo -e "\n"

# GET /api/defi - DeFi news
echo "7. Get DeFi news"
curl -s "$BASE_URL/api/defi?limit=10"
echo -e "\n"

# GET /api/breaking - Breaking news
echo "8. Get breaking news"
curl -s "$BASE_URL/api/breaking"
echo -e "\n"

# GET /api/search - Search news
echo "9. Search for 'Ethereum ETF'"
curl -s "$BASE_URL/api/search?q=Ethereum%20ETF&limit=10"
echo -e "\n"

# GET /api/trending - Trending topics
echo "10. Get trending topics"
curl -s "$BASE_URL/api/trending?limit=10"
echo -e "\n"

# GET /api/sources - Available sources
echo "11. Get all sources"
curl -s "$BASE_URL/api/sources"
echo -e "\n"

# GET /api/categories - Available categories
echo "12. Get all categories"
curl -s "$BASE_URL/api/news/categories"
echo -e "\n"

# GET /api/digest - Daily digest
echo "13. Get daily digest"
curl -s "$BASE_URL/api/digest"
echo -e "\n"

# GET /api/tags - Browse by tags
echo "14. Get all tags"
curl -s "$BASE_URL/api/tags"
echo -e "\n"

# GET /api/tags/[slug] - Articles by tag
echo "15. Get articles for 'bitcoin' tag"
curl -s "$BASE_URL/api/tags/bitcoin?limit=10"
echo -e "\n"

# =============================================================================
# AI ENDPOINTS
# =============================================================================

echo "🤖 AI ENDPOINTS"
echo "==============="

# GET /api/sentiment - Sentiment analysis
echo "1. Get BTC sentiment"
curl -s "$BASE_URL/api/sentiment?asset=BTC&limit=20"
echo -e "\n"

# GET /api/summarize - Summarize article
echo "2. Summarize article by URL"
curl -s "$BASE_URL/api/summarize?url=https://example.com/article"
echo -e "\n"

# GET /api/ask - Ask AI
echo "3. Ask AI a question"
curl -s "$BASE_URL/api/ask?q=What%20is%20the%20current%20Bitcoin%20sentiment"
echo -e "\n"

# GET /api/ai/brief - Market brief
echo "4. Get market brief"
curl -s "$BASE_URL/api/ai/brief"
echo -e "\n"

# POST /api/ai/debate - AI debate
echo "5. Generate AI debate"
curl -s -X POST "$BASE_URL/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Bitcoin will replace gold as a store of value"}'
echo -e "\n"

# POST /api/ai/counter - Counter arguments
echo "6. Get counter arguments"
curl -s -X POST "$BASE_URL/api/ai/counter" \
  -H "Content-Type: application/json" \
  -d '{"claim": "Bitcoin is too volatile for institutional adoption"}'
echo -e "\n"

# GET /api/ai/agent - AI agent
echo "7. Use AI agent"
curl -s "$BASE_URL/api/ai/agent?task=Analyze%20Bitcoin%20market%20trends"
echo -e "\n"

# GET /api/ai/oracle - Price oracle
echo "8. Get BTC oracle prediction"
curl -s "$BASE_URL/api/ai/oracle?asset=BTC"
echo -e "\n"

# GET /api/entities - Entity extraction
echo "9. Extract entities"
curl -s "$BASE_URL/api/entities?text=Vitalik%20Buterin%20announced%20Ethereum%20upgrade"
echo -e "\n"

# GET /api/narratives - Narrative detection
echo "10. Get narratives"
curl -s "$BASE_URL/api/narratives?limit=10"
echo -e "\n"

# GET /api/clickbait - Clickbait detection
echo "11. Detect clickbait"
curl -s "$BASE_URL/api/clickbait?title=You%20WONT%20BELIEVE%20what%20Bitcoin%20did"
echo -e "\n"

# GET /api/factcheck - Fact check
echo "12. Fact check a claim"
curl -s "$BASE_URL/api/factcheck?claim=Bitcoin%20uses%20more%20energy%20than%20Argentina"
echo -e "\n"

# POST /api/detect/ai-content - AI content detection
echo "13. Detect AI-generated content"
curl -s -X POST "$BASE_URL/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a sample text to check if it was written by AI."}'
echo -e "\n"

# =============================================================================
# MARKET DATA ENDPOINTS
# =============================================================================

echo "📈 MARKET DATA ENDPOINTS"
echo "========================"

# GET /api/market/coins - All coins
echo "1. Get top 10 coins"
curl -s "$BASE_URL/api/market/coins?limit=10&order=market_cap_desc"
echo -e "\n"

# GET /api/market/ohlc/[coinId] - OHLC data
echo "2. Get Bitcoin OHLC (7 days)"
curl -s "$BASE_URL/api/market/ohlc/bitcoin?days=7"
echo -e "\n"

# GET /api/market/history/[coinId] - Price history
echo "3. Get Ethereum price history"
curl -s "$BASE_URL/api/market/history/ethereum?days=30"
echo -e "\n"

# GET /api/market/exchanges - Exchanges
echo "4. Get top exchanges"
curl -s "$BASE_URL/api/market/exchanges?limit=10"
echo -e "\n"

# GET /api/market/derivatives - Derivatives
echo "5. Get derivatives data"
curl -s "$BASE_URL/api/market/derivatives"
echo -e "\n"

# GET /api/market/categories - Market categories
echo "6. Get market categories"
curl -s "$BASE_URL/api/market/categories"
echo -e "\n"

# GET /api/market/search - Search markets
echo "7. Search for 'layer 2'"
curl -s "$BASE_URL/api/market/search?q=layer%202"
echo -e "\n"

# GET /api/market/defi - DeFi market
echo "8. Get DeFi market data"
curl -s "$BASE_URL/api/market/defi"
echo -e "\n"

# GET /api/market/compare - Compare coins
echo "9. Compare BTC, ETH, SOL"
curl -s "$BASE_URL/api/market/compare?coins=bitcoin,ethereum,solana"
echo -e "\n"

# GET /api/fear-greed - Fear & Greed Index
echo "10. Get Fear & Greed Index"
curl -s "$BASE_URL/api/fear-greed"
echo -e "\n"

# =============================================================================
# TRADING ENDPOINTS
# =============================================================================

echo "💹 TRADING ENDPOINTS"
echo "===================="

# GET /api/arbitrage - Arbitrage opportunities
echo "1. Get arbitrage opportunities"
curl -s "$BASE_URL/api/arbitrage?min_spread=0.5&limit=10"
echo -e "\n"

# GET /api/signals - Trading signals
echo "2. Get BTC trading signals"
curl -s "$BASE_URL/api/signals?asset=BTC&timeframe=4h"
echo -e "\n"

# GET /api/funding - Funding rates
echo "3. Get funding rates"
curl -s "$BASE_URL/api/funding"
echo -e "\n"

# GET /api/options - Options data
echo "4. Get BTC options"
curl -s "$BASE_URL/api/options?asset=BTC"
echo -e "\n"

# GET /api/liquidations - Liquidations
echo "5. Get liquidations (24h)"
curl -s "$BASE_URL/api/liquidations?timeframe=24h&min_value=500000"
echo -e "\n"

# GET /api/whale-alerts - Whale alerts
echo "6. Get whale alerts"
curl -s "$BASE_URL/api/whale-alerts?min_value=5000000&limit=10"
echo -e "\n"

# GET /api/orderbook - Order book
echo "7. Get BTC/USDT order book"
curl -s "$BASE_URL/api/orderbook?symbol=BTCUSDT&exchange=binance&depth=10"
echo -e "\n"

# =============================================================================
# SOCIAL & COMMUNITY ENDPOINTS
# =============================================================================

echo "👥 SOCIAL ENDPOINTS"
echo "==================="

# GET /api/social/x - Twitter/X
echo "1. Get X/Twitter feed"
curl -s "$BASE_URL/api/social/x?limit=10"
echo -e "\n"

# GET /api/social/reddit - Reddit
echo "2. Get Reddit posts"
curl -s "$BASE_URL/api/social/reddit?subreddit=cryptocurrency&limit=10"
echo -e "\n"

# GET /api/social/youtube - YouTube
echo "3. Get YouTube videos"
curl -s "$BASE_URL/api/social/youtube?limit=10"
echo -e "\n"

# GET /api/social/influencers - Influencers
echo "4. Get crypto influencers"
curl -s "$BASE_URL/api/social/influencers?limit=10"
echo -e "\n"

# GET /api/social/sentiment - Social sentiment
echo "5. Get BTC social sentiment"
curl -s "$BASE_URL/api/social/sentiment?asset=BTC"
echo -e "\n"

# GET /api/governance - Governance
echo "6. Get DAO governance proposals"
curl -s "$BASE_URL/api/governance?limit=10"
echo -e "\n"

# GET /api/events - Events
echo "7. Get upcoming events"
curl -s "$BASE_URL/api/events?limit=10"
echo -e "\n"

# =============================================================================
# BLOCKCHAIN & ON-CHAIN ENDPOINTS
# =============================================================================

echo "⛓️ BLOCKCHAIN ENDPOINTS"
echo "======================="

# GET /api/nft - NFT news
echo "1. Get NFT news"
curl -s "$BASE_URL/api/nft?limit=10"
echo -e "\n"

# GET /api/onchain - On-chain data
echo "2. Get Ethereum on-chain data"
curl -s "$BASE_URL/api/onchain?chain=ethereum&metric=transactions"
echo -e "\n"

# GET /api/onchain/gas - Gas prices
echo "3. Get ETH gas prices"
curl -s "$BASE_URL/api/onchain/gas?chain=ethereum"
echo -e "\n"

# GET /api/onchain/defi - DeFi TVL
echo "4. Get DeFi TVL"
curl -s "$BASE_URL/api/onchain/defi"
echo -e "\n"

# GET /api/staking - Staking
echo "5. Get staking opportunities"
curl -s "$BASE_URL/api/staking"
echo -e "\n"

# GET /api/layer2 - Layer 2
echo "6. Get Layer 2 data"
curl -s "$BASE_URL/api/layer2"
echo -e "\n"

# GET /api/yields - DeFi yields
echo "7. Get DeFi yields"
curl -s "$BASE_URL/api/yields?min_apy=10"
echo -e "\n"

# GET /api/airdrops - Airdrops
echo "8. Get active airdrops"
curl -s "$BASE_URL/api/airdrops?status=active"
echo -e "\n"

# GET /api/security - Security alerts
echo "9. Get security alerts"
curl -s "$BASE_URL/api/security?severity=high&limit=10"
echo -e "\n"

# GET /api/hacks - Hack reports
echo "10. Get hack reports"
curl -s "$BASE_URL/api/hacks?limit=10"
echo -e "\n"

# =============================================================================
# REGULATORY ENDPOINTS
# =============================================================================

echo "⚖️ REGULATORY ENDPOINTS"
echo "======================="

# GET /api/regulatory - Regulatory news
echo "1. Get regulatory news"
curl -s "$BASE_URL/api/regulatory?limit=10"
echo -e "\n"

# GET /api/regulatory/updates - Policy updates
echo "2. Get US policy updates"
curl -s "$BASE_URL/api/regulatory/updates?country=US"
echo -e "\n"

# GET /api/regulatory/etf - ETF news
echo "3. Get Bitcoin ETF news"
curl -s "$BASE_URL/api/regulatory/etf?type=bitcoin"
echo -e "\n"

# GET /api/regulatory/sec - SEC news
echo "4. Get SEC news"
curl -s "$BASE_URL/api/regulatory/sec?limit=10"
echo -e "\n"

# GET /api/regulatory/enforcement - Enforcement actions
echo "5. Get enforcement actions"
curl -s "$BASE_URL/api/regulatory/enforcement?limit=10"
echo -e "\n"

# GET /api/regulatory/cbdc - CBDC news
echo "6. Get CBDC developments"
curl -s "$BASE_URL/api/regulatory/cbdc"
echo -e "\n"

# =============================================================================
# FEEDS & EXPORT ENDPOINTS
# =============================================================================

echo "📡 FEEDS & EXPORT ENDPOINTS"
echo "==========================="

# GET /api/rss - RSS feed
echo "1. Get RSS feed (XML)"
curl -s "$BASE_URL/api/rss?limit=10" | head -c 500
echo -e "\n"

# GET /api/rss.json - RSS feed (JSON)
echo "2. Get RSS feed (JSON)"
curl -s "$BASE_URL/api/rss.json?limit=10"
echo -e "\n"

# GET /api/feed/atom - Atom feed
echo "3. Get Atom feed"
curl -s "$BASE_URL/api/feed/atom?limit=10" | head -c 500
echo -e "\n"

# GET /api/export/csv - CSV export
echo "4. Export as CSV"
curl -s "$BASE_URL/api/export/csv?limit=10" | head -c 500
echo -e "\n"

# GET /api/export/json - JSON export
echo "5. Export as JSON"
curl -s "$BASE_URL/api/export/json?limit=10"
echo -e "\n"

# GET /api/llms.txt - LLM-friendly format
echo "6. Get llms.txt"
curl -s "$BASE_URL/api/llms.txt" | head -c 500
echo -e "\n"

# GET /api/archive - News archive
echo "7. Get archive (2024-06)"
curl -s "$BASE_URL/api/archive?year=2024&month=6"
echo -e "\n"

# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

echo "📊 ANALYTICS ENDPOINTS"
echo "======================"

# GET /api/analytics/overview - Overview
echo "1. Get analytics overview"
curl -s "$BASE_URL/api/analytics/overview"
echo -e "\n"

# GET /api/analytics/trends - Trends
echo "2. Get 7-day trends"
curl -s "$BASE_URL/api/analytics/trends?period=7d"
echo -e "\n"

# GET /api/analytics/sentiment - Sentiment trends
echo "3. Get BTC sentiment trends"
curl -s "$BASE_URL/api/analytics/sentiment?asset=BTC&period=7d"
echo -e "\n"

# GET /api/credibility - Source credibility
echo "4. Get source credibility"
curl -s "$BASE_URL/api/credibility"
echo -e "\n"

# GET /api/impact - News impact
echo "5. Get news impact"
curl -s "$BASE_URL/api/impact?period=24h"
echo -e "\n"

# GET /api/correlations - News-price correlations
echo "6. Get BTC correlations"
curl -s "$BASE_URL/api/correlations?asset=BTC&period=30d"
echo -e "\n"

# GET /api/heatmap - Activity heatmap
echo "7. Get news heatmap"
curl -s "$BASE_URL/api/heatmap?period=7d"
echo -e "\n"

# GET /api/statistics - Overall statistics
echo "8. Get statistics"
curl -s "$BASE_URL/api/statistics"
echo -e "\n"

# =============================================================================
# AUTHENTICATED ENDPOINTS (require API key)
# =============================================================================

echo "🔐 AUTHENTICATED ENDPOINTS"
echo "=========================="

API_KEY="your-api-key-here"

# Portfolio endpoints
echo "1. Get portfolio (requires API key)"
curl -s "$BASE_URL/api/portfolio" \
  -H "X-API-Key: $API_KEY"
echo -e "\n"

# Create alert
echo "2. Create price alert (requires API key)"
curl -s -X POST "$BASE_URL/api/alerts" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "type": "price",
    "asset": "BTC",
    "condition": "above",
    "value": 100000,
    "notification": "email"
  }'
echo -e "\n"

# Premium endpoints
echo "3. Get premium status (requires API key)"
curl -s "$BASE_URL/api/premium" \
  -H "X-API-Key: $API_KEY"
echo -e "\n"

echo "========================================"
echo "All cURL examples completed!"
echo "========================================"
