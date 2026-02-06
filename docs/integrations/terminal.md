# Terminal Dashboard

Real-time crypto news in your terminal with live updates, charts, and sentiment.

## Overview

A beautiful terminal-based dashboard built with blessed/blessed-contrib.

| Feature | Description |
|---------|-------------|
| **Live News** | Real-time SSE news stream |
| **Price Charts** | ASCII price charts |
| **Fear & Greed** | Visual gauge |
| **Trending** | Hot topics sidebar |
| **Sentiment** | Color-coded sentiment |

## Installation

```bash
# Global install
npm install -g crypto-news-cli

# Or run directly
npx crypto-news-cli
```

## Usage

```bash
# Default dashboard
crypto-news

# Watch mode (real-time updates)
crypto-news --watch

# Filter by ticker
crypto-news --ticker BTC

# Minimal mode (just headlines)
crypto-news --minimal

# Show sentiment analysis
crypto-news --sentiment

# Show Fear & Greed Index
crypto-news --fear-greed

# Custom limit
crypto-news --limit 50

# Filter by source
crypto-news --source coindesk
```

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ███████╗██████╗ ███████╗███████╗     ██████╗██████╗ ██╗   ██╗██████╗ ████████╗ │
│  ██╔════╝██╔══██╗██╔════╝██╔════╝    ██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝ │
│  █████╗  ██████╔╝█████╗  █████╗      ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║    │
│  ██╔══╝  ██╔══██╗██╔══╝  ██╔══╝      ██║     ██╔══██╗  ╚██╔╝  ██╔═══╝    ██║    │
│  ██║     ██║  ██║███████╗███████╗    ╚██████╗██║  ██║   ██║   ██║        ██║    │
│  ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝     ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝        ╚═╝    │
├─────────────────────────────────────────────┬───────────────────────────────────┤
│  📰 LATEST NEWS                              │  📊 FEAR & GREED                   │
├─────────────────────────────────────────────┤                                     │
│  01. Bitcoin ETF sees record inflows        │  ████████████████░░░░░░░░  67      │
│      CoinDesk • 5 minutes ago       🟢      │           GREED                    │
│                                             ├───────────────────────────────────┤
│  02. Ethereum upgrade scheduled for Q2      │  🔥 TRENDING                       │
│      The Block • 12 minutes ago     ⚪      │                                     │
│                                             │  1. Bitcoin ETF      ↑ 234%        │
│  03. SEC delays spot ETH decision           │  2. Ethereum 2.0    ↑ 156%        │
│      Bloomberg • 23 minutes ago     🔴      │  3. Solana DeFi     ↑ 89%         │
│                                             │  4. NFT Revival     ↑ 67%         │
│  04. Solana TVL reaches new ATH             │  5. Layer 2         ↑ 45%         │
│      DeFiLlama • 31 minutes ago     🟢      ├───────────────────────────────────┤
│                                             │  💰 PRICES                         │
│  05. Major exchange adds new pairs          │                                     │
│      CryptoNews • 45 minutes ago    ⚪      │  BTC  $67,234  ↑ 2.3%             │
│                                             │  ETH  $3,456   ↑ 1.8%             │
│  [Press 'r' to refresh, 'q' to quit]        │  SOL  $145     ↑ 5.2%             │
└─────────────────────────────────────────────┴───────────────────────────────────┘
```

---

## Features

### Real-Time Updates

```bash
# Enable SSE streaming
crypto-news --watch
```

The dashboard automatically updates when new articles arrive via Server-Sent Events.

### Sentiment Colors

- 🟢 **Green** - Bullish sentiment
- 🔴 **Red** - Bearish sentiment  
- ⚪ **Gray** - Neutral sentiment

### Breaking News

Breaking news articles are highlighted with a red `BREAKING` badge.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `r` | Refresh data |
| `q` / `Ctrl+C` | Quit |
| `↑` / `↓` | Scroll news |
| `Enter` | Open article in browser |
| `s` | Toggle sentiment panel |
| `t` | Toggle trending panel |
| `f` | Toggle Fear & Greed |

---

## Minimal Mode

For a simpler output without the full dashboard:

```bash
crypto-news --minimal
```

Output:
```
   ____                  _          _   _                    
  / ___|_ __ _   _ _ __ | |_ ___   | \ | | _____      _____  
 | |   | '__| | | | '_ \| __/ _ \  |  \| |/ _ \ \ /\ / / __| 
 | |___| |  | |_| | |_) | || (_) | | |\  |  __/\ V  V /\__ \ 
  \____|_|   \__, | .__/ \__\___/  |_| \_|\___| \_/\_/ |___/ 
             |___/|_|                                         

01. 🟢 Bitcoin ETF sees record inflows as institutional demand surges
    CoinDesk • 5 minutes ago

02. ⚪ Ethereum foundation announces major upgrade timeline
    The Block • 12 minutes ago

03. 🔴 SEC commissioner raises concerns about crypto regulations
    Bloomberg • 23 minutes ago
```

---

## Configuration

Create `~/.crypto-news.json`:

```json
{
  "theme": "dark",
  "defaultLimit": 20,
  "autoRefresh": true,
  "refreshInterval": 30,
  "showSentiment": true,
  "showTrending": true,
  "showPrices": true,
  "sources": ["coindesk", "theblock", "cointelegraph"],
  "tickers": ["BTC", "ETH", "SOL"]
}
```

---

## Code Example

```javascript
#!/usr/bin/env node

import blessed from 'blessed';
import contrib from 'blessed-contrib';
import EventSource from 'eventsource';

const API_BASE = 'https://cryptocurrency.cv/api';

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Crypto News Dashboard'
});

// Create grid layout
const grid = new contrib.grid({ rows: 12, cols: 12, screen });

// News log
const newsLog = grid.set(0, 0, 8, 8, contrib.log, {
  label: ' 📰 Latest News ',
  fg: 'white',
  selectedFg: 'green'
});

// Fear & Greed gauge
const fearGreedGauge = grid.set(0, 8, 4, 4, contrib.gauge, {
  label: ' Fear & Greed ',
  stroke: 'green',
  fill: 'white'
});

// Trending table
const trendingTable = grid.set(4, 8, 4, 4, contrib.table, {
  label: ' 🔥 Trending ',
  columnWidth: [20, 10]
});

// Price sparklines
const priceChart = grid.set(8, 0, 4, 12, contrib.sparkline, {
  label: ' 💰 Price (24h) ',
  style: { fg: 'cyan' }
});

// Fetch and display news
async function fetchNews() {
  const response = await fetch(`${API_BASE}/news?limit=20`);
  const { articles } = await response.json();
  
  newsLog.log('');
  articles.forEach((article, i) => {
    const sentiment = article.sentiment || 'neutral';
    const icon = sentiment === 'bullish' ? '🟢' : 
                 sentiment === 'bearish' ? '🔴' : '⚪';
    
    newsLog.log(`${String(i + 1).padStart(2)}. ${icon} ${article.title}`);
    newsLog.log(`    ${article.source} • ${article.timeAgo}`);
  });
}

// Fetch Fear & Greed
async function fetchFearGreed() {
  const response = await fetch(`${API_BASE}/fear-greed`);
  const data = await response.json();
  
  fearGreedGauge.setPercent(data.value);
  fearGreedGauge.setLabel(` ${data.classification} (${data.value}) `);
}

// Real-time updates via SSE
function connectSSE() {
  const es = new EventSource(`${API_BASE}/sse`);
  
  es.onmessage = (event) => {
    const article = JSON.parse(event.data);
    const icon = article.isBreaking ? '🔴 BREAKING' : '📰';
    newsLog.log(`${icon} ${article.title}`);
    screen.render();
  };
}

// Key bindings
screen.key(['q', 'C-c'], () => process.exit(0));
screen.key('r', () => {
  fetchNews();
  fetchFearGreed();
});

// Initial load
fetchNews();
fetchFearGreed();
connectSSE();

screen.render();
```

---

## Dependencies

```json
{
  "dependencies": {
    "blessed": "^0.1.81",
    "blessed-contrib": "^4.11.0",
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "eventsource": "^2.0.2",
    "figlet": "^1.7.0",
    "gradient-string": "^2.0.2"
  }
}
```

---

## Related

- [CLI Integration](cli.md)
- [Real-Time API](../REALTIME.md)
- [API Reference](../API.md)
