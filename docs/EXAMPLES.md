# 📚 API Examples & Tutorials

> Complete examples for all 184 API endpoints in Python, JavaScript, Go, and cURL.

## 🚀 Quick Start

### Installation

```bash
# Python
pip install requests

# JavaScript/Node.js
npm install node-fetch  # or use built-in fetch in Node 18+

# Go
go get github.com/nirholas/free-crypto-news/sdk/go
```

### Your First API Call

<details>
<summary><b>Python</b></summary>

```python
import requests

response = requests.get("https://cryptocurrency.cv/api/news?limit=5")
news = response.json()

for article in news.get("articles", news)[:5]:
    print(f"📰 {article['title']}")
```
</details>

<details>
<summary><b>JavaScript</b></summary>

```javascript
const response = await fetch("https://cryptocurrency.cv/api/news?limit=5");
const news = await response.json();

news.articles.forEach(article => {
  console.log(`📰 ${article.title}`);
});
```
</details>

<details>
<summary><b>Go</b></summary>

```go
resp, _ := http.Get("https://cryptocurrency.cv/api/news?limit=5")
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)
fmt.Println(string(body))
```
</details>

<details>
<summary><b>cURL</b></summary>

```bash
curl "https://cryptocurrency.cv/api/news?limit=5"
```
</details>

---

## 📰 News Endpoints

### GET /api/news - Main News Feed

<details>
<summary><b>Python Example</b></summary>

```python
import requests

# Basic fetch
response = requests.get("https://cryptocurrency.cv/api/news", params={
    "limit": 20
})
news = response.json()

# With filters
response = requests.get("https://cryptocurrency.cv/api/news", params={
    "limit": 50,
    "category": "bitcoin",
    "source": "coindesk"
})
filtered_news = response.json()
```
</details>

<details>
<summary><b>JavaScript Example</b></summary>

```javascript
// Basic fetch
const response = await fetch("https://cryptocurrency.cv/api/news?limit=20");
const news = await response.json();

// With filters
const filtered = await fetch(
  "https://cryptocurrency.cv/api/news?limit=50&category=bitcoin&source=coindesk"
);
const filteredNews = await filtered.json();
```
</details>

<details>
<summary><b>cURL Example</b></summary>

```bash
# Basic fetch
curl "https://cryptocurrency.cv/api/news?limit=20"

# With filters
curl "https://cryptocurrency.cv/api/news?limit=50&category=bitcoin&source=coindesk"
```
</details>

### GET /api/news/international - International News (18 Languages)

<details>
<summary><b>Python Example</b></summary>

```python
import requests

# Korean news, translated
response = requests.get("https://cryptocurrency.cv/api/news/international", params={
    "lang": "ko",
    "translate": "true"
})
korean_news = response.json()

# Japanese news, original
response = requests.get("https://cryptocurrency.cv/api/news/international", params={
    "lang": "ja",
    "translate": "false"
})
japanese_news = response.json()
```
</details>

### POST /api/news/extract - Extract Article Content

<details>
<summary><b>Python Example</b></summary>

```python
import requests

response = requests.post(
    "https://cryptocurrency.cv/api/news/extract",
    json={"url": "https://example.com/article"},
    headers={"Content-Type": "application/json"}
)
article = response.json()
print(f"Title: {article['title']}")
print(f"Content: {article['content'][:500]}...")
```
</details>

### GET /api/bitcoin - Bitcoin News

```python
response = requests.get("https://cryptocurrency.cv/api/bitcoin?limit=20")
btc_news = response.json()
```

### GET /api/defi - DeFi News

```python
response = requests.get("https://cryptocurrency.cv/api/defi?limit=20")
defi_news = response.json()
```

### GET /api/breaking - Breaking News

```python
response = requests.get("https://cryptocurrency.cv/api/breaking")
breaking = response.json()
```

### GET /api/search - Search News

```python
response = requests.get("https://cryptocurrency.cv/api/search", params={
    "q": "Ethereum ETF",
    "limit": 50,
    "from": "2024-01-01",
    "to": "2024-06-30"
})
results = response.json()
```

### GET /api/trending - Trending Topics

```python
response = requests.get("https://cryptocurrency.cv/api/trending?limit=10")
trending = response.json()
```

### GET /api/digest - AI Daily Digest

```python
response = requests.get("https://cryptocurrency.cv/api/digest")
digest = response.json()
```

---

## 🤖 AI Endpoints

### GET /api/sentiment - Sentiment Analysis

<details>
<summary><b>Python Example</b></summary>

```python
import requests

# Get BTC sentiment
response = requests.get("https://cryptocurrency.cv/api/sentiment", params={
    "asset": "BTC",
    "limit": 50
})
sentiment = response.json()

print(f"Score: {sentiment['score']}")
print(f"Label: {sentiment['label']}")  # bullish, bearish, neutral
print(f"Positive: {sentiment['positive']}")
print(f"Negative: {sentiment['negative']}")
```
</details>

### GET /api/summarize - Article Summarization

```python
response = requests.get("https://cryptocurrency.cv/api/summarize", params={
    "url": "https://example.com/long-article"
})
summary = response.json()
print(summary['summary'])
```

### GET /api/ask - Ask AI Questions

```python
response = requests.get("https://cryptocurrency.cv/api/ask", params={
    "q": "What is the current Bitcoin market sentiment?",
    "context": "Include recent news analysis"
})
answer = response.json()
print(answer['response'])
```

### GET /api/ai/brief - Market Brief

```python
response = requests.get("https://cryptocurrency.cv/api/ai/brief")
brief = response.json()
print(brief['summary'])
```

### POST /api/ai/debate - AI Debate (Bull vs Bear)

```python
response = requests.post(
    "https://cryptocurrency.cv/api/ai/debate",
    json={"topic": "Bitcoin will reach $100k by end of year"},
    headers={"Content-Type": "application/json"}
)
debate = response.json()
print(f"Bull Case: {debate['bull']}")
print(f"Bear Case: {debate['bear']}")
```

### GET /api/ai/oracle - Price Predictions

```python
response = requests.get("https://cryptocurrency.cv/api/ai/oracle", params={
    "asset": "BTC"
})
prediction = response.json()
```

### GET /api/entities - Entity Extraction

```python
response = requests.get("https://cryptocurrency.cv/api/entities", params={
    "text": "Vitalik Buterin announced Ethereum's next upgrade at ETHDenver"
})
entities = response.json()
# Returns: {people: ["Vitalik Buterin"], organizations: ["Ethereum"], events: ["ETHDenver"]}
```

### GET /api/narratives - Narrative Detection

```python
response = requests.get("https://cryptocurrency.cv/api/narratives?limit=10")
narratives = response.json()
```

### GET /api/clickbait - Clickbait Detection

```python
response = requests.get("https://cryptocurrency.cv/api/clickbait", params={
    "title": "You WON'T BELIEVE what Bitcoin just did!!!"
})
result = response.json()
print(f"Clickbait Score: {result['score']}")  # 0-1
```

### GET /api/factcheck - Fact Checking

```python
response = requests.get("https://cryptocurrency.cv/api/factcheck", params={
    "claim": "Bitcoin uses more energy than Argentina"
})
check = response.json()
```

### POST /api/detect/ai-content - AI Content Detection

```python
response = requests.post(
    "https://cryptocurrency.cv/api/detect/ai-content",
    json={"text": "Your text to analyze..."},
    headers={"Content-Type": "application/json"}
)
result = response.json()
print(f"AI Probability: {result['probability']}")
```

---

## 📈 Market Data Endpoints

### GET /api/market/coins - All Coins

```python
response = requests.get("https://cryptocurrency.cv/api/market/coins", params={
    "limit": 100,
    "page": 1,
    "order": "market_cap_desc"
})
coins = response.json()
```

### GET /api/market/ohlc/{coinId} - OHLC Candlestick Data

```python
response = requests.get("https://cryptocurrency.cv/api/market/ohlc/bitcoin", params={
    "days": 30
})
ohlc = response.json()
# Returns: [[timestamp, open, high, low, close], ...]
```

### GET /api/market/history/{coinId} - Price History

```python
response = requests.get("https://cryptocurrency.cv/api/market/history/ethereum", params={
    "days": 90
})
history = response.json()
```

### GET /api/market/exchanges - Exchange Data

```python
response = requests.get("https://cryptocurrency.cv/api/market/exchanges?limit=50")
exchanges = response.json()
```

### GET /api/market/compare - Compare Coins

```python
response = requests.get("https://cryptocurrency.cv/api/market/compare", params={
    "coins": "bitcoin,ethereum,solana"
})
comparison = response.json()
```

### GET /api/fear-greed - Fear & Greed Index

```python
response = requests.get("https://cryptocurrency.cv/api/fear-greed")
fg = response.json()
print(f"Value: {fg['value']} ({fg['classification']})")
```

---

## 💹 Trading Endpoints

### GET /api/arbitrage - Arbitrage Opportunities

```python
response = requests.get("https://cryptocurrency.cv/api/arbitrage", params={
    "min_spread": 0.5,
    "limit": 20
})
opportunities = response.json()
for opp in opportunities:
    print(f"{opp['symbol']}: Buy on {opp['buy_exchange']} at {opp['buy_price']}")
    print(f"           Sell on {opp['sell_exchange']} at {opp['sell_price']}")
    print(f"           Spread: {opp['spread']}%")
```

### GET /api/signals - Trading Signals

```python
response = requests.get("https://cryptocurrency.cv/api/signals", params={
    "asset": "BTC",
    "timeframe": "4h"
})
signals = response.json()
```

### GET /api/funding - Funding Rates

```python
response = requests.get("https://cryptocurrency.cv/api/funding")
funding = response.json()
```

### GET /api/options - Options Data

```python
response = requests.get("https://cryptocurrency.cv/api/options?asset=BTC")
options = response.json()
```

### GET /api/liquidations - Liquidation Data

```python
response = requests.get("https://cryptocurrency.cv/api/liquidations", params={
    "timeframe": "24h",
    "min_value": 500000
})
liquidations = response.json()
```

### GET /api/whale-alerts - Whale Transactions

```python
response = requests.get("https://cryptocurrency.cv/api/whale-alerts", params={
    "min_value": 5000000,
    "limit": 20
})
whales = response.json()
```

### GET /api/orderbook - Order Book

```python
response = requests.get("https://cryptocurrency.cv/api/orderbook", params={
    "symbol": "BTCUSDT",
    "exchange": "binance",
    "depth": 20
})
orderbook = response.json()
```

---

## 👥 Social & Community Endpoints

### GET /api/social/x - Twitter/X Feed

```python
response = requests.get("https://cryptocurrency.cv/api/social/x", params={
    "asset": "BTC",
    "limit": 20
})
tweets = response.json()
```

### GET /api/social/reddit - Reddit Feed

```python
response = requests.get("https://cryptocurrency.cv/api/social/reddit", params={
    "subreddit": "cryptocurrency",
    "limit": 20
})
posts = response.json()
```

### GET /api/social/youtube - YouTube Videos

```python
response = requests.get("https://cryptocurrency.cv/api/social/youtube?limit=20")
videos = response.json()
```

### GET /api/social/influencers - Crypto Influencers

```python
response = requests.get("https://cryptocurrency.cv/api/social/influencers?limit=50")
influencers = response.json()
```

### GET /api/governance - DAO Governance

```python
response = requests.get("https://cryptocurrency.cv/api/governance", params={
    "protocol": "aave",
    "limit": 20
})
proposals = response.json()
```

### GET /api/events - Crypto Events

```python
response = requests.get("https://cryptocurrency.cv/api/events", params={
    "type": "conference",
    "limit": 20
})
events = response.json()
```

---

## ⛓️ Blockchain & On-Chain Endpoints

### GET /api/nft - NFT News

```python
response = requests.get("https://cryptocurrency.cv/api/nft?limit=20")
nft_news = response.json()
```

### GET /api/onchain - On-Chain Data

```python
response = requests.get("https://cryptocurrency.cv/api/onchain", params={
    "chain": "ethereum",
    "metric": "transactions"
})
onchain = response.json()
```

### GET /api/onchain/gas - Gas Prices

```python
response = requests.get("https://cryptocurrency.cv/api/onchain/gas?chain=ethereum")
gas = response.json()
print(f"Fast: {gas['fast']} gwei")
print(f"Standard: {gas['standard']} gwei")
print(f"Slow: {gas['slow']} gwei")
```

### GET /api/onchain/defi - DeFi TVL

```python
response = requests.get("https://cryptocurrency.cv/api/onchain/defi")
tvl = response.json()
```

### GET /api/staking - Staking Opportunities

```python
response = requests.get("https://cryptocurrency.cv/api/staking?asset=ETH")
staking = response.json()
```

### GET /api/layer2 - Layer 2 Data

```python
response = requests.get("https://cryptocurrency.cv/api/layer2")
l2 = response.json()
```

### GET /api/yields - DeFi Yields

```python
response = requests.get("https://cryptocurrency.cv/api/yields", params={
    "chain": "ethereum",
    "min_apy": 10
})
yields = response.json()
```

### GET /api/airdrops - Airdrop Opportunities

```python
response = requests.get("https://cryptocurrency.cv/api/airdrops?status=active")
airdrops = response.json()
```

### GET /api/security - Security Alerts

```python
response = requests.get("https://cryptocurrency.cv/api/security", params={
    "severity": "high",
    "limit": 20
})
alerts = response.json()
```

### GET /api/hacks - Hack Reports

```python
response = requests.get("https://cryptocurrency.cv/api/hacks?limit=20")
hacks = response.json()
```

---

## ⚖️ Regulatory Endpoints

### GET /api/regulatory - Regulatory News

```python
response = requests.get("https://cryptocurrency.cv/api/regulatory", params={
    "region": "us",
    "limit": 20
})
regulatory = response.json()
```

### GET /api/regulatory/etf - ETF News

```python
response = requests.get("https://cryptocurrency.cv/api/regulatory/etf?type=bitcoin")
etf = response.json()
```

### GET /api/regulatory/sec - SEC News

```python
response = requests.get("https://cryptocurrency.cv/api/regulatory/sec?limit=20")
sec = response.json()
```

### GET /api/regulatory/enforcement - Enforcement Actions

```python
response = requests.get("https://cryptocurrency.cv/api/regulatory/enforcement?limit=20")
enforcement = response.json()
```

### GET /api/regulatory/cbdc - CBDC Developments

```python
response = requests.get("https://cryptocurrency.cv/api/regulatory/cbdc")
cbdc = response.json()
```

---

## 📡 Feeds & Export Endpoints

### GET /api/rss - RSS Feed (XML)

```bash
curl "https://cryptocurrency.cv/api/rss?category=bitcoin&limit=50"
```

### GET /api/rss.json - RSS Feed (JSON)

```python
response = requests.get("https://cryptocurrency.cv/api/rss.json?limit=50")
feed = response.json()
```

### GET /api/export/csv - CSV Export

```python
response = requests.get("https://cryptocurrency.cv/api/export/csv?limit=100")
csv_data = response.text

# Save to file
with open("crypto_news.csv", "w") as f:
    f.write(csv_data)
```

### GET /api/export/json - JSON Export

```python
response = requests.get("https://cryptocurrency.cv/api/export/json", params={
    "limit": 100,
    "pretty": "true"
})
json_data = response.json()
```

### GET /api/llms.txt - LLM-Friendly Format

```bash
curl "https://cryptocurrency.cv/api/llms.txt"
```

### GET /api/archive - News Archive

```python
response = requests.get("https://cryptocurrency.cv/api/archive", params={
    "year": 2024,
    "month": 6
})
archive = response.json()
```

---

## 📊 Analytics Endpoints

### GET /api/analytics/overview - Analytics Dashboard

```python
response = requests.get("https://cryptocurrency.cv/api/analytics/overview")
overview = response.json()
```

### GET /api/analytics/trends - Trend Analysis

```python
response = requests.get("https://cryptocurrency.cv/api/analytics/trends", params={
    "period": "7d",
    "category": "bitcoin"
})
trends = response.json()
```

### GET /api/credibility - Source Credibility

```python
response = requests.get("https://cryptocurrency.cv/api/credibility")
credibility = response.json()
```

### GET /api/impact - News Impact

```python
response = requests.get("https://cryptocurrency.cv/api/impact?period=24h")
impact = response.json()
```

### GET /api/correlations - News-Price Correlations

```python
response = requests.get("https://cryptocurrency.cv/api/correlations", params={
    "asset": "BTC",
    "period": "30d"
})
correlations = response.json()
```

---

## 🔐 Authenticated Endpoints

These endpoints require an API key:

```python
headers = {"X-API-Key": "your-api-key"}
```

### Portfolio Management

```python
# Get portfolio
response = requests.get(
    "https://cryptocurrency.cv/api/portfolio",
    headers=headers
)

# Add holding
response = requests.post(
    "https://cryptocurrency.cv/api/portfolio/add",
    headers={**headers, "Content-Type": "application/json"},
    json={"symbol": "BTC", "amount": 0.5, "price": 45000}
)
```

### Alerts

```python
# Create price alert
response = requests.post(
    "https://cryptocurrency.cv/api/alerts",
    headers={**headers, "Content-Type": "application/json"},
    json={
        "type": "price",
        "asset": "BTC",
        "condition": "above",
        "value": 100000,
        "notification": "email"
    }
)

# Get alerts
response = requests.get(
    "https://cryptocurrency.cv/api/alerts",
    headers=headers
)
```

### Watchlist

```python
# Add to watchlist
response = requests.post(
    "https://cryptocurrency.cv/api/watchlist",
    headers={**headers, "Content-Type": "application/json"},
    json={"symbol": "SOL"}
)

# Get watchlist
response = requests.get(
    "https://cryptocurrency.cv/api/watchlist",
    headers=headers
)
```

---

## ⚡ Real-time Streaming

### WebSocket - News Stream

```javascript
const ws = new WebSocket('wss://cryptocurrency.cv/api/stream/news');

ws.onmessage = (event) => {
  const article = JSON.parse(event.data);
  console.log(`📰 ${article.title}`);
};

// Subscribe to categories
ws.send(JSON.stringify({
  type: 'subscribe',
  categories: ['bitcoin', 'ethereum']
}));
```

### SSE - Server-Sent Events

```javascript
const es = new EventSource('https://cryptocurrency.cv/api/sse/news?category=bitcoin');

es.onmessage = (event) => {
  const article = JSON.parse(event.data);
  console.log(`📰 ${article.title}`);
};
```

### WebSocket - Market Data

```javascript
const ws = new WebSocket('wss://cryptocurrency.cv/api/stream/market');

ws.send(JSON.stringify({
  type: 'subscribe',
  symbols: ['BTC', 'ETH', 'SOL']
}));

ws.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  console.log(`${tick.symbol}: $${tick.price}`);
};
```

---

## 📁 Example Files

All examples are available as runnable files:

| Language | Directory | Files |
|----------|-----------|-------|
| Python | [`examples/python/`](examples/python/) | `news.py`, `ai.py`, `market.py`, `trading.py`, `social.py`, `blockchain.py`, `regulatory.py`, `analytics.py`, `portfolio.py`, `premium.py`, `feeds.py` |
| JavaScript | [`examples/javascript/`](examples/javascript/) | `news.js`, `ai.js`, `market.js`, `trading.js`, `streaming.js` |
| Go | [`examples/go/`](examples/go/) | `client.go` |
| cURL | [`examples/curl/`](examples/curl/) | `all-endpoints.sh` |

### Run Examples

```bash
# Python
cd examples/python
python news.py
python ai.py
python market.py

# JavaScript
cd examples/javascript
node news.js
node ai.js

# Go
cd examples/go
go run client.go

# cURL
cd examples/curl
chmod +x all-endpoints.sh
./all-endpoints.sh
```

---

## 🔧 SDKs

Official SDKs for quick integration:

- **Python**: `pip install crypto-news-sdk`
- **JavaScript**: `npm install @crypto-news/sdk`
- **Go**: `go get github.com/nirholas/free-crypto-news/sdk/go`

See [sdk/](sdk/) directory for SDK source code.

---

## 📞 Support

- 📖 [Full API Documentation](docs/API.md)
- 💬 [Discord Community](https://discord.gg/cryptonews)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
- 📧 [Email Support](mailto:support@cryptonews.dev)
