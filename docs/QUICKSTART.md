# 🚀 Quick Start Tutorial

Get up and running with Free Crypto News in 5 minutes.

---

## Choose Your Path

| I want to... | Go to |
|--------------|-------|
| **Use the API** | [API Quick Start](#api-quick-start) |
| **Self-host** | [Self-Hosting](#self-hosting) |
| **Contribute** | [Development Setup](#development-setup) |
| **Build an app** | [Integration Examples](#integration-examples) |

---

## API Quick Start

### 1. Fetch Latest News

No signup, no API key - just call it:

```bash
curl https://cryptocurrency.cv/api/news
```

### 2. Filter by Topic

```bash
# Bitcoin news only
curl https://cryptocurrency.cv/api/bitcoin

# DeFi news
curl https://cryptocurrency.cv/api/defi

# Search for specific topics
curl "https://cryptocurrency.cv/api/search?q=ethereum+ETF"
```

### 3. Use an SDK

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

**React:**
```jsx
import { useCryptoNews } from '@cryptonews/react';

function NewsFeed() {
  const { articles, loading } = useCryptoNews({ limit: 10 });
  
  if (loading) return <p>Loading...</p>;
  return articles.map(a => <ArticleCard key={a.link} article={a} />);
}
```

### 4. Enable Real-Time Updates

```javascript
const eventSource = new EventSource('/api/sse');

eventSource.addEventListener('news', (event) => {
  const { articles } = JSON.parse(event.data);
  updateFeed(articles);
});

eventSource.addEventListener('breaking', (event) => {
  const article = JSON.parse(event.data);
  showBreakingAlert(article.title);
});
```

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
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### Option 3: Docker

```bash
docker run -p 3000:3000 ghcr.io/nirholas/free-crypto-news
```

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news

# Install
npm install

# Create environment file
cp .env.example .env.local

# Start dev server
npm run dev
```

### Optional: Enable AI Features

Add to `.env.local`:

```env
# Choose one AI provider
GROQ_API_KEY=gsk_...          # Free at console.groq.com
# or
OPENAI_API_KEY=sk-...         # OpenAI
# or
ANTHROPIC_API_KEY=sk-ant-...  # Anthropic
```

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Build for Production

```bash
npm run build
npm start
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

| Topic | Documentation |
|-------|---------------|
| Full API reference | [API.md](./API.md) |
| AI features | [AI-FEATURES.md](./AI-FEATURES.md) |
| Real-time streaming | [REALTIME.md](./REALTIME.md) |
| Component library | [COMPONENTS.md](./COMPONENTS.md) |
| Testing guide | [TESTING.md](TESTING.md) |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Admin dashboard | [ADMIN.md](ADMIN.md) |

---

## Get Help

- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
- ⭐ [Star the repo](https://github.com/nirholas/free-crypto-news) if you find it useful!
