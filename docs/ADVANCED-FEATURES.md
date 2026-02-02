# 🚀 Advanced Features

Free Crypto News offers cutting-edge features that set it apart from other crypto news platforms.

## 🖥️ Terminal Dashboard (CLI)

A beautiful terminal-based dashboard with real-time updates.

```bash
npx crypto-news-cli
```

**Features:**
- Fear & Greed gauge
- Live news feed
- Trending topics
- Price tickers
- Sentiment analysis
- Real-time SSE updates

**Commands:**
- `npx crypto-news-cli` - Full dashboard
- `npx crypto-news-cli --watch` - Auto-refresh mode
- `npx crypto-news-cli --minimal` - Headlines only
- Press `q` to quit, `r` to refresh

## 📊 Trading Signal Backtester

Backtest trading strategies based on news sentiment.

**Endpoint:** `GET /api/backtest`

**Available Strategies:**

| Strategy | Description | Win Rate |
|----------|-------------|----------|
| sentiment_momentum | Trade with sentiment swings | ~58% |
| breaking_news_scalp | Quick trades on breaking news | ~54% |
| whale_follow | Follow large wallet movements | ~61% |
| narrative_momentum | Ride trending narratives | ~56% |
| fear_greed_contrarian | Buy fear, sell greed | ~52% |

```bash
# Get available strategies
curl /api/backtest?action=strategies

# Get performance data
curl /api/backtest?action=performance

# Run backtest
curl -X POST /api/backtest \
  -H "Content-Type: application/json" \
  -d '{"strategy": "sentiment_momentum", "period": "7d"}'
```

## 🖼️ Farcaster Frames

Interactive frames for the Farcaster social network.

**Endpoint:** `GET /api/frames`

**Features:**
- Browse news directly in Farcaster
- Vote on sentiment (bullish/bearish)
- Navigate through articles
- Real-time market data

## 🤖 GitHub Copilot Extension

Get crypto news directly in VS Code through Copilot Chat.

**Installation:** Search "Crypto News for Copilot" in VS Code Marketplace

**Usage:**
```
@cryptonews /breaking
@cryptonews /market
@cryptonews /prices
@cryptonews /feargreed
@cryptonews /whale
@cryptonews /trending
```

## 📦 On-chain Archive (IPFS/Arweave)

Permanently archive news to decentralized storage.

**Endpoint:** `GET /api/archive/ipfs`

**Features:**
- Archive articles to IPFS
- Permanent storage on Arweave
- Daily snapshots
- Verification proofs
- Multiple gateway support

```bash
# Archive an article
curl -X POST /api/archive/ipfs \
  -H "Content-Type: application/json" \
  -d '{"action": "archive", "url": "...", "title": "..."}'

# Create daily snapshot
curl -X POST /api/archive/ipfs \
  -d '{"action": "snapshot"}'
```

## ⛓️ Chainlink Oracle

On-chain sentiment data for smart contracts.

**Endpoint:** `GET /api/oracle/chainlink`

**Formats:**
- `?format=standard` - Full JSON response
- `?format=packed` - Single uint256 for gas efficiency
- `?format=abi` - ABI-encoded bytes

**Smart Contract:** See `contracts/CryptoNewsOracle.sol`

**Available Data:**
- Sentiment score (0-100)
- Fear & Greed index
- Breaking news count
- Market narrative (BULLISH/NEUTRAL/BEARISH)

## 📡 Nostr Integration

Publish and consume news on the Nostr protocol.

**Endpoint:** `GET /api/nostr`

**Features:**
- Publish news to Nostr relays
- NIP-05 verification
- Long-form articles (NIP-23)
- Relay discovery

```bash
# Get relay info
curl /api/nostr?action=relays

# Publish news
curl -X POST /api/nostr \
  -d '{"action": "publish", "articles": [...]}'
```

## 🎬 AI News Anchor

Generate AI video summaries with virtual anchors.

**Endpoint:** `GET /api/ai-anchor`

**Anchors:**
- Alex Chen (Professional)
- Sarah Mitchell (Casual)
- Max Turner (Energetic)
- Luna Hayes (Institutional)

```bash
# Preview script
curl -X POST /api/ai-anchor \
  -d '{"action": "preview", "style": "professional"}'

# Generate video
curl -X POST /api/ai-anchor \
  -d '{"action": "generate", "anchorId": "anchor_01"}'
```

## 🎰 Prediction Markets

Bet on news outcomes and track predictions.

**Endpoint:** `GET /api/predictions/markets`

**Market Categories:**
- Price predictions
- Regulatory outcomes
- Adoption events
- Technology milestones

```bash
# Get open markets
curl /api/predictions/markets?status=open

# Place a bet
curl -X POST /api/predictions/markets \
  -d '{"action": "bet", "marketId": "...", "position": "yes", "amount": 100}'

# View leaderboard
curl /api/predictions/markets?action=leaderboard
```

## 🐋 Whale Wallet Tracking

Monitor large crypto transactions and correlate with news.

**Endpoint:** `GET /api/whales`

**Features:**
- Known whale wallets database
- Real-time transaction alerts
- Exchange flow analysis
- News correlation insights

```bash
# Get whale activity
curl /api/whales?limit=20&min_usd=10000000

# Get correlation analysis
curl /api/whales?action=correlation
```

## 🌐 Browser Extension

Overlay crypto news on any website.

**Features:**
- Floating news ticker
- Quick price checks
- Breaking news alerts
- Sentiment indicators

See `/extension` folder for source code.

## 🔊 Alexa Voice Skill

Voice-activated crypto news.

**Endpoint:** `POST /api/alexa`

**Example Phrases:**
- "Alexa, open Crypto News"
- "Alexa, ask Crypto News for Bitcoin updates"
- "Alexa, ask Crypto News about market sentiment"
- "Alexa, ask Crypto News for the Fear and Greed Index"
- "Alexa, ask Crypto News for the price of Ethereum"

---

## API Summary

| Feature | Endpoint | Method |
|---------|----------|--------|
| Backtester | `/api/backtest` | GET/POST |
| Farcaster Frames | `/api/frames` | GET/POST |
| Chainlink Oracle | `/api/oracle/chainlink` | GET/POST |
| Nostr | `/api/nostr` | GET/POST |
| AI Anchor | `/api/ai-anchor` | GET/POST |
| IPFS Archive | `/api/archive/ipfs` | GET/POST |
| Prediction Markets | `/api/predictions/markets` | GET/POST |
| Whale Tracking | `/api/whales` | GET |
| Alexa Skill | `/api/alexa` | GET/POST |

---

*These features make Free Crypto News the most feature-rich crypto news platform available!*
