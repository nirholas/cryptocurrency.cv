# Free Crypto News CLI

Command-line interface for getting crypto news in your terminal.

## Installation

```bash
npm install -g crypto-news-cli
```

Or run directly with npx:

```bash
npx crypto-news-cli
```

## Usage

```bash
# Get latest news
crypto-news

# Get top 5 articles
crypto-news -n 5

# Bitcoin news only
crypto-news --bitcoin

# DeFi news only
crypto-news --defi

# Breaking news (< 2 hours old)
crypto-news --breaking

# Search for keywords
crypto-news -s "ethereum ETF"

# Trending topics
crypto-news --trending

# List all sources
crypto-news --sources

# Output as JSON
crypto-news --json
```

## Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help |
| `--limit <n>` | `-n` | Number of articles (default: 10) |
| `--search <query>` | `-s` | Search for keywords |
| `--bitcoin` | | Bitcoin news only |
| `--defi` | | DeFi news only |
| `--breaking` | | Breaking news (< 2 hours) |
| `--trending` | | Show trending topics |
| `--sources` | | List all sources |
| `--json` | | Output as JSON |

## Examples

### Daily Digest

```bash
# Morning routine - check what happened overnight
crypto-news --breaking
crypto-news --trending
crypto-news -n 20
```

### Research Workflow

```bash
# Deep dive into a topic
crypto-news -s "SEC regulation" -n 30 --json > sec-news.json
```

### Integration with Other Tools

```bash
# Pipe to jq for processing
crypto-news --json | jq '.articles[0].title'

# Watch for breaking news
watch -n 60 crypto-news --breaking

# Send to Slack via webhook
crypto-news --json | jq -r '.articles[0] | "📰 \(.title) - \(.source)"' | curl -X POST -d @- $SLACK_WEBHOOK
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

---
Powered by Free Crypto News API
https://cryptocurrency.cv
```

## License

MIT
