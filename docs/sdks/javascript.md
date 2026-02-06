# JavaScript SDK

The JavaScript SDK provides a lightweight client for Node.js and browser environments.

## Installation

```bash
npm install @fcn/sdk
# or
yarn add @fcn/sdk
# or
pnpm add @fcn/sdk
```

## Quick Start

```javascript
import { CryptoNews } from '@fcn/sdk';

// Initialize client (no API key needed!)
const client = new CryptoNews();

// Get latest news
const news = await client.getNews({ limit: 10 });
news.articles.forEach(article => {
  console.log(`${article.title} - ${article.source}`);
});

// Search for specific topics
const results = await client.search('ethereum merge', { limit: 5 });

// Get market data
const market = await client.getMarket();
console.log(`BTC: $${market.bitcoin.price.toLocaleString()}`);
```

## API Reference

### Constructor

```javascript
const client = new CryptoNews({
  baseUrl: 'https://cryptocurrency.cv', // optional
  timeout: 10000, // optional, in milliseconds
});
```

### Methods

#### News Methods

```javascript
// Get latest news
const news = await client.getNews({
  limit: 10,        // optional, default 10
  source: 'coindesk', // optional
  category: 'defi', // optional
  lang: 'en',       // optional
});

// Search news
const results = await client.search('bitcoin etf', {
  limit: 10,
});

// Get breaking news (last 2 hours)
const breaking = await client.getBreakingNews({ limit: 5 });

// Get DeFi news
const defi = await client.getDefiNews({ limit: 10 });

// Get Bitcoin news
const bitcoin = await client.getBitcoinNews({ limit: 10 });
```

#### Market Methods

```javascript
// Get market overview
const market = await client.getMarket();

// Get specific coin
const btc = await client.getCoin('bitcoin');

// Get Fear & Greed Index
const fearGreed = await client.getFearGreedIndex();

// Get trending coins
const trending = await client.getTrending();
```

#### Utility Methods

```javascript
// Get all sources
const sources = await client.getSources();

// Get all categories
const categories = await client.getCategories();

// Health check
const health = await client.health();
```

## Browser Usage

```html
<script type="module">
  import { CryptoNews } from 'https://esm.sh/@fcn/sdk';
  
  const client = new CryptoNews();
  const news = await client.getNews({ limit: 5 });
  
  document.getElementById('news').innerHTML = news.articles
    .map(a => `<li><a href="${a.link}">${a.title}</a></li>`)
    .join('');
</script>
```

## Category Filter

```javascript
// Get institutional research
const institutional = await client.getNews({ 
  category: 'institutional',
  limit: 20 
});

// Get on-chain analytics
const onchain = await client.getNews({ 
  category: 'onchain',
  limit: 10 
});

// Available categories
const { categories } = await client.getCategories();
console.log(categories.map(c => c.id));
// ['general', 'bitcoin', 'defi', 'institutional', 'etf', ...]
```

## Translation

```javascript
// Get news in different languages
const spanish = await client.getNews({ lang: 'es', limit: 10 });
const japanese = await client.getNews({ lang: 'ja', limit: 10 });
const arabic = await client.getNews({ lang: 'ar', limit: 10 });
```

## Error Handling

```javascript
import { CryptoNews, FCNError } from '@fcn/sdk';

const client = new CryptoNews();

try {
  const news = await client.getNews({ limit: 10 });
} catch (error) {
  if (error instanceof FCNError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.status}`);
  } else {
    throw error;
  }
}
```

## Examples

### Express.js API Proxy

```javascript
import express from 'express';
import { CryptoNews } from '@fcn/sdk';

const app = express();
const client = new CryptoNews();

app.get('/api/news', async (req, res) => {
  const { limit = 10, category } = req.query;
  const news = await client.getNews({ limit: Number(limit), category });
  res.json(news);
});

app.listen(3000);
```

### Discord.js Bot

```javascript
import { Client, GatewayIntentBits } from 'discord.js';
import { CryptoNews } from '@fcn/sdk';

const discord = new Client({ intents: [GatewayIntentBits.Guilds] });
const crypto = new CryptoNews();

discord.on('interactionCreate', async interaction => {
  if (interaction.commandName === 'news') {
    const news = await crypto.getNews({ limit: 5 });
    const embed = {
      title: '📰 Latest Crypto News',
      fields: news.articles.map(a => ({
        name: a.source,
        value: `[${a.title}](${a.link})`,
      })),
    };
    await interaction.reply({ embeds: [embed] });
  }
});

discord.login(process.env.DISCORD_TOKEN);
```

## Source Code

View the full SDK source on GitHub: [sdk/javascript](https://github.com/nirholas/free-crypto-news/tree/main/sdk/javascript)
