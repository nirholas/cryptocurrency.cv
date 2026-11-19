# fcn — Free Crypto News CLI

> Feature-rich command-line interface for crypto news, prices, market data & more — powered by [cryptocurrency.cv](https://cryptocurrency.cv).

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-SEE%20LICENSE-lightgrey)

## Installation

```bash
npm install -g @nirholas/fcn-cli
```

Or run directly with npx:

```bash
npx @nirholas/fcn-cli news
```

After installing globally, use the `fcn` command:

```bash
fcn news
fcn prices
fcn watch bitcoin
```

## Usage

```
Usage: fcn <command> [options]

Commands:
  news              Get latest crypto news
  search <query>    Search news by keyword
  prices            Show live crypto prices
  market            Show market overview
  fear-greed        Show Fear & Greed Index
  gas               Show Ethereum gas prices
  trending          Show trending coins
  sources           List all news sources
  ask <question>    Ask AI a crypto question
  watch <coin>      Watch live price updates (10s refresh)

Options:
  --limit, -l       Number of results (default: 10)
  --category        Filter by category (bitcoin, ethereum, defi, nft, etc.)
  --format          Output format: table, json, csv (default: table)
  --no-color        Disable colored output
  --help, -h        Show help
  --version         Show version
```

## Commands

### `fcn news` — Latest News

```bash
# Get the latest 10 articles
fcn news

# Top 5 articles
fcn news --limit 5

# Filter by category
fcn news --category bitcoin
fcn news --category defi
```

### `fcn search` — Search News

```bash
# Search for a topic
fcn search "ethereum ETF"

# Search with limited results
fcn search "SEC regulation" --limit 20
```

### `fcn prices` — Crypto Prices

```bash
# Show top 10 crypto prices
fcn prices

# Show more coins
fcn prices --limit 25

# Export as JSON
fcn prices --format json
```

### `fcn market` — Market Overview

```bash
# Total market cap, BTC dominance, volume, etc.
fcn market
```

### `fcn fear-greed` — Fear & Greed Index

```bash
# Visual gauge of market sentiment
fcn fear-greed
```

### `fcn gas` — Ethereum Gas Prices

```bash
# Current gas prices (slow, standard, fast, instant)
fcn gas
```

### `fcn trending` — Trending Coins

```bash
# What's hot right now
fcn trending
```

### `fcn sources` — News Sources

```bash
# List all 130+ news sources
fcn sources
```

### `fcn ask` — Ask AI

```bash
# Ask a crypto question
fcn ask "What is DeFi?"
fcn ask "Explain Bitcoin halving"
```

### `fcn watch` — Live Price Ticker

```bash
# Watch Bitcoin price (updates every 10 seconds)
fcn watch bitcoin

# Watch Ethereum
fcn watch ethereum

# Press Ctrl+C to stop
```

## Output Formats

### Table (default)

```bash
fcn prices
```

```
 #  Coin            Price      24h %     Market Cap
 ── ──────────────  ─────────  ────────  ──────────
  1  BTC Bitcoin    $104,230   +2.31%    $2.05T
  2  ETH Ethereum   $3,891     -0.45%    $468.2B
  3  SOL Solana     $187.50    +5.12%    $82.1B
```

### JSON

```bash
fcn prices --format json | jq '.prices[0]'
```

### CSV

```bash
fcn prices --format csv > prices.csv
```

## Real-World Examples

### Morning Routine

```bash
# Check what happened overnight
fcn news --limit 5
fcn market
fcn fear-greed
```

### Research Workflow

```bash
# Deep dive into a topic
fcn search "SEC regulation" --limit 30 --format json > sec-news.json

# Export prices for analysis
fcn prices --limit 100 --format csv > prices.csv
```

### Pipeline Integration

```bash
# Pipe to jq for processing
fcn prices --format json | jq '.prices[] | select(.change24h > 5)'

# Monitor breaking news
watch -n 60 'fcn news --limit 3 --no-color'

# Send to Slack
fcn news --limit 1 --format json | jq -r '.articles[0] | "📰 \(.title) — \(.source)"' | curl -X POST -d @- "$SLACK_WEBHOOK"
```

### Scripting

```bash
#!/bin/bash
# Daily crypto digest
echo "=== Crypto Daily Digest ==="
echo ""
echo "--- Market ---"
fcn market --no-color
echo "--- Fear & Greed ---"
fcn fear-greed --no-color
echo "--- Top News ---"
fcn news --limit 5 --no-color
```

## Screenshot

```
📰 Latest Crypto News

 1. Bitcoin Surges Past $100K as ETF Inflows Hit Record
    CoinDesk • 2 hours ago
    Institutional demand continues to drive the rally...

 2. Ethereum L2s Process More Transactions Than Mainnet
    The Block • 3 hours ago
    Base and Arbitrum lead the scaling race...

 3. DeFi TVL Reaches All-Time High of $200B
    The Defiant • 4 hours ago

───
Powered by Free Crypto News API • https://cryptocurrency.cv
```

## Requirements

- Node.js >= 18 (uses built-in `fetch`)
- No external dependencies

## License

SEE LICENSE IN LICENSE

