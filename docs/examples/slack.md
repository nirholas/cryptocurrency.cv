# Slack Bot Example

Build a Slack bot that delivers crypto news to your workspace.

## Features

- 📰 `/news` slash command
- 🔍 Search functionality
- 💰 Price updates
- 📊 Scheduled digests
- 🔔 Breaking news to channels

## Prerequisites

- Node.js 18+
- [Slack App](https://api.slack.com/apps) with bot token

## Quick Start

### 1. Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Add **Bot Token Scopes**:
   - `chat:write`
   - `commands`
   - `channels:read`
4. Install to workspace
5. Copy the **Bot User OAuth Token**

### 2. Install Dependencies

```bash
npm install @slack/bolt
```

### 3. Create the Bot

```javascript
// slack-bot.js
import { App } from '@slack/bolt';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const API_BASE = 'https://cryptocurrency.cv/api';

// Fetch news
async function getNews(limit = 5, category = null) {
  const url = category 
    ? `${API_BASE}/news?limit=${limit}&category=${category}`
    : `${API_BASE}/news?limit=${limit}`;
  const response = await fetch(url);
  return response.json();
}

// Search news
async function searchNews(query, limit = 5) {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.json();
}

// Format news for Slack
function formatNews(articles, title = '📰 Latest Crypto News') {
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: title },
    },
    { type: 'divider' },
  ];

  articles.forEach(article => {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${article.link}|${article.title}>*\n_${article.source} · ${article.timeAgo}_`,
      },
    });
  });

  return blocks;
}

// /news command
app.command('/news', async ({ command, ack, respond }) => {
  await ack();
  
  try {
    const category = command.text || null;
    const data = await getNews(5, category);
    const blocks = formatNews(data.articles);
    
    await respond({ blocks });
  } catch (error) {
    await respond('❌ Failed to fetch news.');
  }
});

// /search command
app.command('/search', async ({ command, ack, respond }) => {
  await ack();
  
  if (!command.text) {
    await respond('Usage: /search <query>');
    return;
  }
  
  try {
    const data = await searchNews(command.text);
    const blocks = formatNews(data.articles, `🔍 Results for "${command.text}"`);
    
    await respond({ blocks });
  } catch (error) {
    await respond('❌ Search failed.');
  }
});

// /fear command
app.command('/fear', async ({ ack, respond }) => {
  await ack();
  
  try {
    const response = await fetch(`${API_BASE}/fear-greed`);
    const data = await response.json();
    
    const emoji = data.value < 25 ? '😨' : data.value > 75 ? '🤑' : '😐';
    
    await respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Fear & Greed Index*\n\nValue: *${data.value}*\nClassification: *${data.classification}*`,
          },
        },
      ],
    });
  } catch (error) {
    await respond('❌ Failed to fetch Fear & Greed Index.');
  }
});

// Start the app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack bot is running!');
})();
```

### 4. Run the Bot

```bash
SLACK_BOT_TOKEN=xoxb-xxx \
SLACK_SIGNING_SECRET=xxx \
SLACK_APP_TOKEN=xapp-xxx \
node slack-bot.js
```

## Scheduled Digests

Send daily news digests:

```javascript
import cron from 'node-cron';

// Daily digest at 9 AM
cron.schedule('0 9 * * *', async () => {
  const data = await getNews(10);
  const blocks = formatNews(data.articles, '☀️ Your Daily Crypto Digest');
  
  await app.client.chat.postMessage({
    channel: 'C0123456789', // Your channel ID
    blocks,
  });
});

// Weekly summary on Sundays
cron.schedule('0 10 * * 0', async () => {
  const data = await getNews(20);
  const blocks = formatNews(data.articles, '📅 Weekly Crypto Roundup');
  
  await app.client.chat.postMessage({
    channel: 'C0123456789',
    blocks,
  });
});
```

## Interactive Messages

Add buttons for more actions:

```javascript
function formatNewsWithActions(articles) {
  const blocks = formatNews(articles);
  
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: '🔄 Refresh' },
        action_id: 'refresh_news',
      },
      {
        type: 'button',
        text: { type: 'plain_text', text: '📊 Market Data' },
        action_id: 'show_market',
      },
    ],
  });
  
  return blocks;
}

// Handle button clicks
app.action('refresh_news', async ({ ack, respond }) => {
  await ack();
  const data = await getNews(5);
  const blocks = formatNewsWithActions(data.articles);
  await respond({ blocks, replace_original: true });
});
```

## Breaking News Alerts

```javascript
async function checkBreakingNews() {
  const response = await fetch(`${API_BASE}/breaking?limit=3`);
  const data = await response.json();
  
  // Check for new articles
  for (const article of data.articles) {
    if (isNew(article)) {
      await app.client.chat.postMessage({
        channel: 'C0123456789',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🚨 *Breaking News*\n\n*<${article.link}|${article.title}>*\n_${article.source}_`,
            },
          },
        ],
      });
    }
  }
}

// Check every 5 minutes
setInterval(checkBreakingNews, 5 * 60 * 1000);
```

## Deployment

### Vercel

```bash
npm install @vercel/node
vercel deploy
```

### Heroku

```bash
heroku create my-crypto-slack-bot
heroku config:set SLACK_BOT_TOKEN=xoxb-xxx
git push heroku main
```

## Full Example

See the complete Slack bot: [examples/slack-bot.js](https://github.com/nirholas/free-crypto-news/blob/main/examples/slack-bot.js)
