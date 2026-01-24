# Examples

Ready-to-use code examples for integrating Free Crypto News API.

## Available Examples

### curl.sh
Basic shell script using cURL to fetch news.

```bash
./curl.sh
```

### discord-bot.js
Discord bot that responds to news commands.

**Setup:**
```bash
npm install discord.js
export DISCORD_TOKEN=your-token
node discord-bot.js
```

**Commands:**
- `!news` - Latest crypto news
- `!bitcoin` - Bitcoin news
- `!defi` - DeFi news
- `!search <query>` - Search news

### slack-bot.js
Slack bot for crypto news in your workspace.

**Setup:**
```bash
npm install @slack/bolt
export SLACK_BOT_TOKEN=your-token
export SLACK_SIGNING_SECRET=your-secret
node slack-bot.js
```

### telegram-bot.py
Basic Telegram bot with news commands.

**Setup:**
```bash
pip install python-telegram-bot
export TELEGRAM_TOKEN=your-token
python telegram-bot.py
```

### telegram-digest.py
Advanced Telegram bot with scheduled daily digests.

**Setup:**
```bash
pip install python-telegram-bot aiohttp
export TELEGRAM_TOKEN=your-token
python telegram-digest.py
```

**Features:**
- `/news` - Latest news
- `/bitcoin` - Bitcoin news
- `/defi` - DeFi news
- `/trending` - Trending topics
- `/digest` - Full daily digest
- `/subscribe` - Daily digest subscription
- Scheduled digests at 9 AM UTC

### langchain-tool.py
LangChain tool integration for AI agents.

**Setup:**
```bash
pip install langchain openai
python langchain-tool.py
```

### ai-analysis.py
Demonstrates AI-powered article analysis.

**Setup:**
```bash
pip install requests
python ai-analysis.py
```

**Features:**
- Article summarization (short/medium/long)
- Sentiment analysis with confidence scores
- Fact extraction (entities, numbers, dates)
- Fact checking with verdicts
- Follow-up question generation
- Auto-categorization
- Translation to any language

### realtime-stream.js
Real-time news streaming using Server-Sent Events (SSE).

**Browser:**
```html
<script src="realtime-stream.js"></script>
```

**Node.js:**
```bash
npm install eventsource
node realtime-stream.js
```

**Features:**
- Live news updates every 30 seconds
- Breaking news alerts
- Price updates
- Auto-reconnect with exponential backoff
- Graceful shutdown handling

## No API Keys Required!

All examples connect to the free API at `https://free-crypto-news.vercel.app` - no authentication needed.

## Self-Hosted

To use a self-hosted API, change the base URL in each example:

```javascript
const API_URL = 'https://your-instance.vercel.app';
```

```python
API_URL = 'https://your-instance.vercel.app'
```

## More Resources

- [API Documentation](../docs/API.md)
- [AI Features Guide](../docs/AI-FEATURES.md)
- [Real-Time Guide](../docs/REALTIME.md)
- [SDK Documentation](../sdk/)

---

## x402 Payment Examples

For **premium API access**, we support x402 micropayments using USDC on Base (and Solana when configured).

### x402-client.ts (TypeScript/JavaScript)

Use the official `@x402/fetch` package for seamless payments.

**Setup:**
```bash
npm install @x402/fetch ethers
export WALLET_PRIVATE_KEY=your-private-key
npx ts-node x402-client.ts
```

**Features:**
- Automatic payment handling with `payFetch()`
- Multi-endpoint examples
- Manual 402 handling example
- Wallet balance checking

### x402-client.py (Python)

Python implementation of x402 payment flow.

**Setup:**
```bash
pip install requests eth-account web3
export WALLET_PRIVATE_KEY=your-private-key
python x402-client.py
```

**Features:**
- Parse 402 payment requirements
- Create payment signatures
- Auto-retry with payment headers
- API discovery via `.well-known/x402`

### x402-client.go (Go)

Go implementation for server-side integrations.

**Setup:**
```bash
go get github.com/ethereum/go-ethereum
export WALLET_PRIVATE_KEY=your-private-key
go run x402-client.go
```

**Features:**
- ECDSA signature creation
- 402 response parsing
- Payment header injection
- Endpoint discovery

### x402 Pricing

| Endpoint | Price |
|----------|-------|
| `/api/v1/news` | $0.001 |
| `/api/v1/coins` | $0.002 |
| `/api/v1/trending` | $0.001 |
| `/api/v1/market-data` | $0.002 |
| `/api/v1/analysis` | $0.005 |
| `/api/v1/export` | $0.01 |

Check all endpoints at: `https://free-crypto-news.vercel.app/api/.well-known/x402`

