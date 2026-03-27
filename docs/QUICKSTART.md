# 🚀 Quick Start Tutorial

Get up and running with Free Crypto News in 5 minutes. No signup, no API key — just make a request.

---

## Choose Your Path

| I want to... | Go to |
|--------------|-------|
| **Call the API from my terminal** | [Step 1: Your First API Call](#1-your-first-api-call) |
| **Use a Python/JS/Go SDK** | [Step 3: Use an SDK](#3-use-an-sdk) |
| **Self-host the project** | [Self-Hosting](#self-hosting) |
| **Contribute code** | [Development Setup](#development-setup) |
| **Build a bot (Discord/Slack/Telegram)** | [Integration Examples](#integration-examples) |

---

## API Quick Start

### 1. Your First API Call

No signup, no API key — just call it:

```bash
curl https://cryptocurrency.cv/api/news?limit=3
```

**Example response:**

```json
{
  "articles": [
    {
      "title": "Bitcoin Surges Past $95K as Institutional Demand Grows",
      "source": "CoinDesk",
      "link": "https://coindesk.com/...",
      "pubDate": "2026-03-01T14:30:00Z",
      "category": "bitcoin",
      "sentiment": "positive"
    },
    {
      "title": "Ethereum Layer 2 TVL Hits New Record",
      "source": "The Block",
      "link": "https://theblock.co/...",
      "pubDate": "2026-03-01T13:15:00Z",
      "category": "ethereum",
      "sentiment": "positive"
    }
  ],
  "count": 3,
  "source": "aggregated"
}
```

> **That's it!** Every endpoint works the same way — just `GET` the URL and parse the JSON.

### 2. Filter by Topic

```bash
# Bitcoin news only
curl https://cryptocurrency.cv/api/bitcoin

# DeFi news
curl https://cryptocurrency.cv/api/defi

# Search for specific topics
curl "https://cryptocurrency.cv/api/search?q=ethereum+ETF"

# Get AI-generated daily digest
curl https://cryptocurrency.cv/api/digest

# Market sentiment
curl https://cryptocurrency.cv/api/sentiment
```

### 3. Use an SDK

Install an SDK to skip boilerplate. Available for [Python](./sdks/python.md), [JavaScript](./sdks/javascript.md), [TypeScript](./sdks/typescript.md), [React](./sdks/react.md), [Go](./sdks/go.md), [PHP](./sdks/php.md), [Ruby](./sdks/ruby.md), [Rust](./sdks/rust.md), [Java](./sdks/java.md), [Kotlin](./sdks/kotlin.md), [Swift](./sdks/swift.md), [C#](./sdks/csharp.md), and [R](./sdks/r.md).

**Python:**
```python
from cryptonews import CryptoNews

news = CryptoNews()
for article in news.get_latest(5):
    print(f"{article['source']}: {article['title']}")
```

**JavaScript:**
```javascript
import { CryptoNews } from '@cryptonews/sdk';

const client = new CryptoNews();
const articles = await client.getLatest(5);
articles.forEach(a => console.log(a.title));
```

**Go:**
```go
package main

import (
	"fmt"
	cryptonews "github.com/nirholas/free-crypto-news/sdk/go"
)

func main() {
	client := cryptonews.NewClient()
	articles, _ := client.GetLatest(5)
	for _, a := range articles {
		fmt.Printf("%s: %s\n", a.Source, a.Title)
	}
}
```

**React:**
```jsx
import { useCryptoNews } from '@cryptonews/react';

function NewsFeed() {
  const { articles, loading } = useCryptoNews({ limit: 10 });
  
  if (loading) return <p>Loading...</p>;
  return articles.map(a => <ArticleCard key={a.link} article={a} />);
}
```

**PHP:**
```php
<?php
require_once 'vendor/autoload.php';

$client = new CryptoNews\Client();
$articles = $client->getLatest(5);

foreach ($articles as $article) {
    echo $article['source'] . ': ' . $article['title'] . "\n";
}
```

**cURL (no SDK needed):**
```bash
# Get latest 5 articles as JSON
curl -s https://cryptocurrency.cv/api/news?limit=5 | jq '.articles[] | .title'
```

### 4. Enable Real-Time Updates

Subscribe to live news via Server-Sent Events (SSE):

```javascript
const eventSource = new EventSource('https://cryptocurrency.cv/api/sse');

eventSource.addEventListener('news', (event) => {
  cError Handling

### HTTP Status Codes

All API endpoints return standard HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request — check your parameters |
| 404 | Endpoint or resource not found |
| 429 | Rate limited — slow down and check `Retry-After` header |
| 500 | Server error — try again later |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87  
X-RateLimit-Reset: 1709312400
```

The free tier allows **100 requests per 15 minutes** — no API key needed. For higher limits, [register for a free API key](./API-KEY-SIGNUP.md).

### Example: Handling Errors in Python

```python
import requests

response = requests.get('https://cryptocurrency.cv/api/news?limit=5')

if response.status_code == 200:
    articles = response.json()['articles']
    for a in articles:
        print(a['title'])
elif response.status_code == 429:
    retry_after = response.headers.get('Retry-After', 60)
    print(f"Rate limited. Retry in {retry_after} seconds.")
else:
    print(f"Error: {response.status_code}")
```

---

## onst { articles } = JSON.parse(event.data);
  updateFeed(articles);
});

eventSource.addEventListener('breaking', (event) => {
  const article = JSON.parse(event.data);
  showBreakingAlert(article.title);
});
```

> See [Real-Time docs](./REALTIME.md) for WebSocket and push notification options.

### 5. Add AI Analysis

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sentiment",
    "title": "Bitcoin Surges Past $100K",
    "content": "Bitcoin reached a new all-time high today..."
  }'
```

**Example response:**

```json
{
  "sentiment": "bullish",
  "score": 0.87,
  "confidence": "high",
  "summary": "Strong positive sentiment driven by price milestone and institutional interest."
}
```

---

## Self-Hosting

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nirholas/free-crypto-news)

### Option 2: Local Setup

```bash
# Clone the repo
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# Install dependencies
pnpm install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### Option 3: Docker

```bash
docker run -p 3000:3000 ghcr.io/nirholas/free-crypto-news
```

---

## Development Setup

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org/)
- **pnpm** — `npm install -g pnpm` (package manager)
- **Bun** — `curl -fsSL https://bun.sh/install | bash` (script runner)
- **Git** — [Download](https://git-scm.com/)

### Setup

```bash
# Clone
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# Install
pnpm install

# Create environment file
cp .env.example .env.local

# Start dev server
bun run dev
```

### Optional: Enable AI Features

Add to `.env.local`:

```env
# Choose one AI provider:
GROQ_API_KEY=gsk_...          # Free at console.groq.com (recommended)
# or
OPENAI_API_KEY=sk-...         # OpenAI - GPT models
# or
ANTHROPIC_API_KEY=sk-ant-...  # Anthropic - Claude models
```

> **Tip:** Groq is free and fast — great for getting started. You can switch providers later.

### Run Tests

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# All tests
bun run test:all
```

### Build for Production

```bash
bun run build
bun run start
```

---

## Integration Examples

### Discord Bot

```javascript
// discord-bot.js
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.on('messageCreate', async (message) => {
  if (message.content === '!news') {
    const res = await fetch('https://cryptocurrency.cv/api/news?limit=5');
    const { articles } = await res.json();
    
    const text = articles.map(a => `📰 **${a.title}**\n${a.link}`).join('\n\n');
    message.reply(text);
  }
});

client.login(process.env.DISCORD_TOKEN);
```

### Slack Bot

```javascript
// slack-bot.js
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.message('crypto news', async ({ message, say }) => {
  const res = await fetch('https://cryptocurrency.cv/api/news?limit=5');
  const { articles } = await res.json();
  
  await say({
    blocks: articles.map(a => ({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${a.title}*\n${a.source} • <${a.link}|Read more>` }
    }))
  });
});

app.start(3000);
```

### Telegram Bot

```python
# telegram-bot.py
from telegram import Update
from telegram.ext import Application, CommandHandler
import requests

async def news(update: Update, context):
    res = requests.get('https://cryptocurrency.cv/api/news?limit=5')
    articles = res.json()['articles']
    
    text = '\n\n'.join([f"📰 *{a['title']}*\n{a['link']}" for a in articles])
    await update.message.reply_text(text, parse_mode='Markdown')

app = Application.builder().token(os.getenv('TELEGRAM_TOKEN')).build()
app.add_handler(CommandHandler('news', news))
app.run_polling()
```

### Website Widget

```html
<!-- Add to your HTML -->
<div id="crypto-news-widget"></div>
<script src="https://cryptocurrency.cv/widget/ticker.js"></script>
<script>
  CryptoNewsWidget.init('#crypto-news-widget', {
    limit: 5,
    theme: 'dark',
    autoRefresh: true
  });
</script>
```

---

## What's Next?

Now that you're up and running, explore deeper:

| I want to... | Read this |
|--------------|-----------|
| See all API endpoints | [API Reference](./API.md) |
| Build an AI-powered app | [AI Features Guide](./AI-FEATURES.md) |
| Stream real-time news | [Real-Time Guide](./REALTIME.md) |
| Follow step-by-step tutorials | [Tutorials](./tutorials/index.md) |
| Use an SDK | [SDKs](./sdks/index.md) |
| Integrate with ChatGPT or Claude | [AI Integrations](./integrations/index.md) |
| Browse all features | [Features Guide](./FEATURES.md) |

---

## Troubleshooting

### Common Issues

**"Cannot connect to localhost:3000"**

- Make sure you ran `bun run dev` and it completed without errors
- Check that port 3000 isn't already in use: `lsof -i :3000`
- Try a different port: `PORT=3001 bun run dev`

**"pnpm: command not found"**

```bash
npm install -g pnpm
```

**"bun: command not found"**

```bash
curl -fsSL https://bun.sh/install | bash
```

**API returns empty `articles` array**

- This is normal on a fresh install — news is fetched every 5 minutes
- Wait a few minutes, then try again
- Or use the hosted API at `https://cryptocurrency.cv/api/news` immediately

**AI endpoints return errors**

- Make sure you've set an AI provider key in `.env.local`
- Groq is the easiest to set up (free at [console.groq.com](https://console.groq.com))

---

## Get Help

- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions) — Ask questions
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues) — File bug reports
- ⭐ [Star the repo](https://github.com/nirholas/free-crypto-news) if you find it useful!
