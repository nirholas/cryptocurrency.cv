# Postman Collection

Import our Postman collection to explore and test the Free Crypto News API interactively.

## Features

- 📋 **182 pre-configured requests** for all API endpoints
- 🔄 **Environment variables** for easy configuration
- 📝 **Request examples** with sample responses
- 🧪 **Test scripts** for validation
- 📚 **Full documentation** embedded in collection

## Quick Import

### Option 1: One-Click Import

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/your-collection-id)

### Option 2: Import from URL

1. Open Postman
2. Click **Import** (top left)
3. Select **Link** tab
4. Paste this URL:

```
https://raw.githubusercontent.com/nirholas/free-crypto-news/main/postman/Free_Crypto_News_API.postman_collection.json
```

5. Click **Import**

### Option 3: Import from File

1. Download the collection:
   ```bash
   curl -O https://raw.githubusercontent.com/nirholas/free-crypto-news/main/postman/Free_Crypto_News_API.postman_collection.json
   ```
2. Open Postman → **Import** → Drag the file

## Collection Structure

### 📰 News Endpoints

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Get Latest News | GET | `/api/news` | Latest articles with pagination |
| Search News | GET | `/api/search` | Full-text search |
| Get Breaking News | GET | `/api/breaking` | News from last 2 hours |
| Get Trending | GET | `/api/trending` | Trending topics |
| Get Bitcoin News | GET | `/api/news?ticker=BTC` | Bitcoin-specific news |
| Get DeFi News | GET | `/api/defi` | DeFi-specific news |
| Get International | GET | `/api/news/international` | Multi-language news |

### 🤖 AI Endpoints

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Ask Question | GET | `/api/ask` | Natural language Q&A |
| Get Summary | GET | `/api/summarize` | AI-powered summarization |
| Get Digest | GET | `/api/digest` | Daily news digest |
| Get Sentiment | GET | `/api/sentiment` | Market sentiment analysis |
| Get Entities | GET | `/api/entities` | Named entity recognition |
| Fact Check | GET | `/api/factcheck` | Claim verification |
| Clickbait Detection | GET | `/api/clickbait` | Clickbait scoring |

### 📊 Market Data

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Get Market Overview | GET | `/api/market/coins` | Top cryptocurrencies |
| Get OHLCV | GET | `/api/market/ohlc` | Candlestick data |
| Fear & Greed Index | GET | `/api/fear-greed` | Market sentiment index |
| Get Funding Rates | GET | `/api/funding` | Perpetual funding rates |
| Get Liquidations | GET | `/api/liquidations` | Recent liquidations |
| Whale Alerts | GET | `/api/whale-alerts` | Large transactions |

### 📈 Trading & Signals

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Get Arbitrage | GET | `/api/arbitrage` | Arbitrage opportunities |
| Get Signals | GET | `/api/signals` | Trading signals |
| Options Flow | GET | `/api/options` | Options market activity |
| Order Book | GET | `/api/orderbook` | Aggregated order book |

### 🔗 DeFi & NFT

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Get DeFi TVL | GET | `/api/defi` | DeFi protocol data |
| Get Yields | GET | `/api/defi/yields` | Yield farming rates |
| Get NFT Data | GET | `/api/nft` | NFT market data |
| Get Collections | GET | `/api/nft/collections` | NFT collections |

### 📡 Real-time & Feeds

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| RSS Feed | GET | `/api/rss` | RSS 2.0 feed |
| Atom Feed | GET | `/api/atom` | Atom feed |
| OPML Export | GET | `/api/opml` | OPML for feed readers |
| SSE Stream | GET | `/api/sse` | Server-Sent Events |

### 🔐 Premium & Webhooks

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Register Webhook | POST | `/api/webhooks` | Create webhook |
| List Webhooks | GET | `/api/webhooks` | List webhooks |
| Delete Webhook | DELETE | `/api/webhooks/:id` | Remove webhook |
| Premium Status | GET | `/api/premium/status` | Check premium status |

### 🛠️ Utility

| Request | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Health Check | GET | `/api/health` | API status |
| List Sources | GET | `/api/sources` | Available sources |
| Get Categories | GET | `/api/categories` | News categories |
| OpenAPI Spec | GET | `/api/openapi.json` | OpenAPI specification |

## Environment Variables

The collection uses these variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `https://cryptocurrency.cv` | API base URL |
| `apiKey` | (empty) | Optional API key |

### Setting Variables

1. Click the **Environments** tab (left sidebar)
2. Click **+** to create new environment
3. Add variables:
   - `baseUrl`: Your API URL
   - `apiKey`: Your API key (if using premium)
4. Select the environment from dropdown

### Self-Hosted Instance

Change `baseUrl` to test against your own deployment:

```
baseUrl = https://your-instance.vercel.app
```

## No Authentication Required! 🆓

All endpoints work without API keys. Premium endpoints require x402 payment headers.

## Example Requests

### Get Latest News

```http
GET {{baseUrl}}/api/news?limit=10
```

**Response:**
```json
{
  "articles": [
    {
      "title": "Bitcoin Surges Past $100K",
      "link": "https://coindesk.com/...",
      "description": "Institutional demand...",
      "pubDate": "2026-02-02T12:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2 hours ago"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2026-02-02T14:00:00Z"
}
```

### Search News

```http
GET {{baseUrl}}/api/search?q=ethereum%20upgrade&limit=10
```

### Get AI Summary

```http
GET {{baseUrl}}/api/summarize?style=bullet&limit=10
```

### Ask a Question

```http
GET {{baseUrl}}/api/ask?q=What%20is%20happening%20with%20Bitcoin%20today
```

## Test Scripts

The collection includes test scripts to validate responses:

```javascript
// Validate status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Validate response structure
pm.test("Response has articles array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('articles');
    pm.expect(jsonData.articles).to.be.an('array');
});

// Validate article structure
pm.test("Articles have required fields", function () {
    var jsonData = pm.response.json();
    if (jsonData.articles.length > 0) {
        var article = jsonData.articles[0];
        pm.expect(article).to.have.property('title');
        pm.expect(article).to.have.property('link');
        pm.expect(article).to.have.property('source');
    }
});
```

## Running Collection

### In Postman

1. Select the collection
2. Click **Run** (top right)
3. Configure iterations and delay
4. Click **Run Free Crypto News API**

### With Newman (CLI)

```bash
# Install Newman
npm install -g newman

# Run collection
newman run Free_Crypto_News_API.postman_collection.json

# Run with environment
newman run Free_Crypto_News_API.postman_collection.json \
  -e your-environment.json

# Export results
newman run Free_Crypto_News_API.postman_collection.json \
  -r html,json \
  --reporter-html-export results.html
```

### In CI/CD

```yaml
# GitHub Actions
- name: Run API Tests
  run: |
    npm install -g newman
    newman run postman/Free_Crypto_News_API.postman_collection.json
```

## Exporting

### Export Collection

1. Right-click collection → **Export**
2. Select format (Collection v2.1 recommended)
3. Save file

### Export Environment

1. Click environment → **...** → **Export**
2. Save file

## Tips

### Pre-request Scripts

Set dynamic values before requests:

```javascript
// Set timestamp
pm.environment.set("timestamp", new Date().toISOString());

// Generate random limit
pm.environment.set("randomLimit", Math.floor(Math.random() * 20) + 1);
```

### Chained Requests

Use response data in subsequent requests:

```javascript
// Save article ID from response
var jsonData = pm.response.json();
if (jsonData.articles.length > 0) {
    pm.environment.set("articleId", jsonData.articles[0].id);
}
```

### Monitoring

Set up monitors for uptime testing:

1. Click collection → **Monitors** tab
2. **Create Monitor**
3. Configure schedule (e.g., every 5 minutes)
4. Select requests to run
5. Set up alerts

## Troubleshooting

### Import Fails

- Ensure you're using Postman v10+
- Try importing from URL instead of file
- Check JSON file for corruption

### Requests Fail

1. Verify `baseUrl` variable is set correctly
2. Check internet connection
3. Test API health: `GET {{baseUrl}}/api/health`

### Variables Not Resolving

1. Ensure environment is selected (top right dropdown)
2. Check variable names match exactly (case-sensitive)
3. Look for typos in `{{variable}}` syntax

## Resources

- [Collection JSON](https://github.com/nirholas/free-crypto-news/blob/main/postman/Free_Crypto_News_API.postman_collection.json)
- [API Documentation](../API.md)
- [Tutorials](../tutorials/index.md)

## License

MIT
