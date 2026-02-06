# Web3 & Blockchain Integration

Decentralized features for Web3-native news consumption. Archive news to IPFS/Arweave, publish to Nostr, and integrate with on-chain oracles.

## Overview

| Feature | Endpoint | Description |
|---------|----------|-------------|
| Nostr | `/api/nostr` | Publish news to Nostr relays |
| IPFS Archive | `/api/archive/ipfs` | Archive to IPFS/Arweave |
| Chainlink Oracle | `/api/oracle/chainlink` | On-chain sentiment data |
| Farcaster Frames | `/api/frames` | Interactive Farcaster frames |
| Prediction Markets | `/api/predictions/markets` | Bet on news outcomes |
| AI Anchor | `/api/ai-anchor` | AI video news anchor |

---

## 📡 Nostr Integration

Publish crypto news to the decentralized Nostr network.

### Get Published Events

```bash
curl "https://cryptocurrency.cv/api/nostr"
```

### Publish News to Nostr

```bash
curl -X POST "https://cryptocurrency.cv/api/nostr" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Bitcoin breaks $100K milestone!",
    "tags": ["bitcoin", "milestone", "price"]
  }'
```

### Response

```json
{
  "success": true,
  "event": {
    "id": "abc123...",
    "pubkey": "npub1...",
    "kind": 30024,
    "created_at": 1706889600,
    "content": "Bitcoin breaks $100K milestone!",
    "tags": [["t", "bitcoin"], ["t", "milestone"]],
    "sig": "..."
  },
  "relays": ["wss://relay.damus.io", "wss://relay.nostr.band"]
}
```

### Python Example

```python
import requests

# Get events from Nostr
events = requests.get("https://cryptocurrency.cv/api/nostr").json()

for event in events["events"]:
    print(f"[{event['created_at']}] {event['content']}")

# Publish to Nostr
response = requests.post(
    "https://cryptocurrency.cv/api/nostr",
    json={
        "content": "ETH 2.0 staking rewards increase",
        "tags": ["ethereum", "staking"]
    }
)
print(f"Published: {response.json()['event']['id']}")
```

---

## 📦 IPFS/Arweave Archive

Archive news articles to decentralized, permanent storage.

### Get Archived Content

```bash
# Get all archived items
curl "https://cryptocurrency.cv/api/archive/ipfs"

# Get specific CID
curl "https://cryptocurrency.cv/api/archive/ipfs?cid=QmYwAPJzv5..."
```

### Archive New Content

```bash
curl -X POST "https://cryptocurrency.cv/api/archive/ipfs" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://coindesk.com/article/btc-100k",
    "storage": "both",
    "metadata": {
      "type": "article",
      "importance": "high"
    }
  }'
```

### Response

```json
{
  "success": true,
  "archived": {
    "id": "arch_003",
    "cid": "QmNewContent123...",
    "storage": "both",
    "contentHash": "sha256:ghi789...",
    "title": "Bitcoin Reaches New ATH",
    "archivedAt": "2026-02-02T12:00:00Z",
    "size": 28450,
    "gateway": "https://ipfs.io/ipfs/QmNewContent123...",
    "arweaveGateway": "https://arweave.net/TxId..."
  }
}
```

### JavaScript Example

```javascript
// Archive an article
const archive = await fetch('https://cryptocurrency.cv/api/archive/ipfs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/article',
    storage: 'ipfs'
  })
}).then(r => r.json());

console.log(`Archived to: ${archive.archived.gateway}`);

// Verify archived content
const content = await fetch(archive.archived.gateway).then(r => r.text());
```

---

## 🔮 Chainlink Oracle

Provide news sentiment data for on-chain smart contracts.

### Get Oracle Data

```bash
curl "https://cryptocurrency.cv/api/oracle/chainlink"
```

### Chainlink Job Format (POST)

```bash
curl -X POST "https://cryptocurrency.cv/api/oracle/chainlink" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "data": { "asset": "BTC" }
  }'
```

### Response

```json
{
  "jobRunID": "1",
  "data": {
    "sentiment": 72,
    "fearGreed": 68,
    "breakingNewsCount": 5,
    "topNarrative": "BULLISH",
    "lastUpdate": 1706889600,
    "dataHash": "0xabc123..."
  },
  "result": 72,
  "statusCode": 200
}
```

### Solidity Integration

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract CryptoSentiment is ChainlinkClient {
    uint256 public sentiment;
    
    function requestSentiment() public {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        req.add("get", "https://cryptocurrency.cv/api/oracle/chainlink");
        req.add("path", "data.sentiment");
        sendChainlinkRequest(req, fee);
    }
    
    function fulfill(bytes32 _requestId, uint256 _sentiment) public {
        sentiment = _sentiment;
    }
}
```

---

## 🎭 Farcaster Frames

Interactive news frames for Farcaster/Warpcast.

### Get Frame HTML

```bash
curl "https://cryptocurrency.cv/api/frames"
```

### Handle Frame Actions

```bash
curl -X POST "https://cryptocurrency.cv/api/frames" \
  -H "Content-Type: application/json" \
  -d '{
    "untrustedData": {
      "fid": 12345,
      "buttonIndex": 1,
      "inputText": "bitcoin"
    }
  }'
```

### Frame Features

| Button | Action |
|--------|--------|
| 📰 Latest | Show latest news |
| 🔍 Search | Search for topic |
| 📈 Bullish | Vote bullish sentiment |
| 📉 Bearish | Vote bearish sentiment |
| ➡️ Next | Next article |

### Embed in Warpcast

Share this URL in Warpcast to display the interactive frame:

```
https://cryptocurrency.cv/api/frames
```

---

## 🎰 Prediction Markets

Bet on crypto news outcomes and track prediction accuracy.

### Get Active Markets

```bash
curl "https://cryptocurrency.cv/api/predictions/markets"
```

### Response

```json
{
  "markets": [
    {
      "id": "mkt_eth_etf_q1",
      "question": "Will a spot ETH ETF be approved by Q1 2026?",
      "category": "regulatory",
      "status": "open",
      "options": {
        "yes": { "odds": 1.85, "volume": 1890000 },
        "no": { "odds": 2.10, "volume": 1450000 }
      },
      "totalVolume": 3340000,
      "resolvesAt": "2026-03-31T23:59:59Z"
    }
  ],
  "stats": {
    "totalMarkets": 15,
    "totalVolume": 12500000,
    "resolvedAccuracy": 0.78
  }
}
```

### Place a Bet (POST)

```bash
curl -X POST "https://cryptocurrency.cv/api/predictions/markets" \
  -H "Content-Type: application/json" \
  -d '{
    "marketId": "mkt_eth_etf_q1",
    "position": "yes",
    "amount": 100
  }'
```

---

## 🎬 AI News Anchor

Generate AI video summaries of crypto news.

### Get Available Anchors

```bash
curl "https://cryptocurrency.cv/api/ai-anchor"
```

### Generate Video

```bash
curl -X POST "https://cryptocurrency.cv/api/ai-anchor" \
  -H "Content-Type: application/json" \
  -d '{
    "style": "professional",
    "anchor": "anchor_01",
    "topic": "bitcoin",
    "duration": 60
  }'
```

### Response

```json
{
  "jobId": "vid_abc123",
  "status": "queued",
  "estimatedTime": 120,
  "checkUrl": "/api/ai-anchor?jobId=vid_abc123"
}
```

### Check Video Status

```bash
curl "https://cryptocurrency.cv/api/ai-anchor?jobId=vid_abc123"
```

### Available Anchors

| ID | Name | Style | Description |
|----|------|-------|-------------|
| anchor_01 | Alex Chen | Professional | Clear, authoritative delivery |
| anchor_02 | Sarah Mitchell | Casual | Friendly, approachable style |
| anchor_03 | Max Turner | Energetic | High-energy market updates |
| anchor_04 | Luna Hayes | Technical | Deep-dive analysis |

---

## Smart Contract

Deploy the included Solidity oracle contract:

```solidity
// contracts/CryptoNewsOracle.sol
// See full implementation in repository
```

### Deployment

```bash
npx hardhat deploy --network mainnet
```

### Verify

```bash
npx hardhat verify --network mainnet DEPLOYED_ADDRESS
```

---

## Use Cases

### 1. Censorship-Resistant News

```python
# Archive breaking news to IPFS immediately
news = requests.get("https://cryptocurrency.cv/api/breaking").json()

for article in news["articles"][:5]:
    archived = requests.post(
        "https://cryptocurrency.cv/api/archive/ipfs",
        json={"url": article["link"], "storage": "both"}
    ).json()
    print(f"Archived: {archived['archived']['cid']}")
```

### 2. On-Chain Trading Signals

```javascript
// Smart contract reads sentiment before executing trades
const sentiment = await oracle.getSentiment();
if (sentiment > 70) {
  await tradingContract.executeBuy();
}
```

### 3. Social Engagement

```javascript
// Post news to Nostr for decentralized distribution
const result = await fetch('/api/nostr', {
  method: 'POST',
  body: JSON.stringify({
    content: `🚀 ${article.title}\n\n${article.link}`,
    tags: ['crypto', 'news']
  })
});
```

---

## Related Documentation

- [IPFS Documentation](https://docs.ipfs.io/)
- [Nostr Protocol](https://nostr.com/)
- [Chainlink External Adapters](https://docs.chain.link/docs/external-adapters/)
- [Farcaster Frames](https://docs.farcaster.xyz/frames/)
