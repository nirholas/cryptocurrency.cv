# 🖥️ Crypto News Terminal Dashboard

Real-time crypto news in your terminal with live updates, price charts, sentiment analysis, and more.

![Terminal Dashboard](../docs/assets/terminal-dashboard.png)

## Quick Start

```bash
npx crypto-news-cli
```

## Installation

```bash
npm install -g crypto-news-cli
```

## Usage

```bash
# Full dashboard
crypto-news

# Watch mode with live updates
crypto-news --watch

# Minimal mode - just headlines
crypto-news --minimal

# Filter by ticker
crypto-news --ticker BTC

# Filter by source
crypto-news --source coindesk

# Custom limit
crypto-news --limit 50
```

## Dashboard Features

```
┌─────────────────────────────────────────────────────────────────┐
│ 🆓 FREE CRYPTO NEWS          | Press q to quit | r to refresh  │
├─────────────────────────────────────────┬───────────────────────┤
│ 📰 Latest News                          │ 😱 Fear & Greed: 72  │
│                                         │ ████████████░░░ 72%  │
│ 🟢 Bitcoin Surges Past $100K           ├───────────────────────┤
│   CoinDesk • 2 min ago                  │ 🔥 Trending          │
│                                         │ • Bitcoin (45)       │
│ 🔴 SEC Delays ETF Decision             │ • ETF (32)           │
│   The Block • 15 min ago                │ • Ethereum (28)      │
│                                         ├───────────────────────┤
│ ⚪ New DeFi Protocol Launches           │ 💰 Prices            │
│   Decrypt • 1 hour ago                  │ BTC  $98,500  +2.3%  │
│                                         │ ETH  $3,250   +1.8%  │
│                                         │ SOL  $145     +5.2%  │
├─────────────────────────────────────────┴───────────────────────┤
│ 📊 Sentiment    │ 📡 Sources      │ ℹ️ Status                  │
│  ██ Bullish 65% │ █████ CoinDesk │ Last update: 12:30:00      │
│  ░░ Bearish 35% │ ████  TheBlock │ 🔴 LIVE                    │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Options

| Option | Description |
|--------|-------------|
| `-w, --watch` | Enable real-time updates via SSE |
| `-t, --ticker <symbol>` | Filter by ticker (BTC, ETH, etc.) |
| `-l, --limit <number>` | Number of articles (default: 20) |
| `-s, --source <source>` | Filter by source |
| `--sentiment` | Show sentiment analysis |
| `--fear-greed` | Show Fear & Greed Index |
| `--minimal` | Minimal mode - just headlines |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` / `Esc` | Quit |
| `r` | Refresh |
| `↑` / `↓` | Scroll news |

## API

Uses the free [Free Crypto News API](https://cryptocurrency.cv):

- `/api/news` - Latest news
- `/api/sentiment` - AI sentiment analysis
- `/api/fear-greed` - Fear & Greed Index
- `/api/trending` - Trending topics
- `/api/sse` - Real-time updates

## License

MIT

