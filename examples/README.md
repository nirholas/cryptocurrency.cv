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
