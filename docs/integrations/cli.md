# Command Line Interface (CLI)

Get crypto news directly in your terminal with the Free Crypto News CLI.

## Features

- ⚡ Fast, lightweight news fetching
- 🔍 Search by keywords
- 📊 Trending topics
- 🔥 Breaking news alerts
- 📰 Multiple output formats (table, JSON)
- 🎨 Colorful terminal output
- 🔗 Pipe-friendly for scripting

## Installation

### NPM (Recommended)

```bash
npm install -g crypto-news-cli
```

### Run Without Installing

```bash
npx crypto-news-cli
```

### From Source

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/cli
npm install
npm link
```

## Quick Start

```bash
# Get latest 10 news articles
crypto-news

# Get top 5 articles
crypto-news -n 5

# Search for specific topics
crypto-news -s "bitcoin etf"

# Bitcoin-only news
crypto-news --bitcoin

# Breaking news (last 2 hours)
crypto-news --breaking

# Trending topics
crypto-news --trending
```

## Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help message | |
| `--version` | `-v` | Show version number | |
| `--limit <n>` | `-n` | Number of articles | 10 |
| `--search <query>` | `-s` | Search for keywords | |
| `--bitcoin` | | Bitcoin news only | |
| `--ethereum` | | Ethereum news only | |
| `--defi` | | DeFi news only | |
| `--breaking` | | Breaking news (< 2h) | |
| `--trending` | | Show trending topics | |
| `--sources` | | List all sources | |
| `--json` | | Output as JSON | |
| `--no-color` | | Disable colors | |

## Usage Examples

### Daily Workflow

```bash
# Morning routine - catch up on overnight news
crypto-news --breaking
crypto-news --trending
crypto-news -n 20

# Quick Bitcoin check
crypto-news --bitcoin -n 5
```

### Research

```bash
# Deep dive into a topic
crypto-news -s "SEC regulation" -n 30

# Export to file
crypto-news -s "ethereum upgrade" --json > eth-news.json

# Multiple topics
crypto-news -s "bitcoin OR ethereum" -n 20
```

### Integration with Other Tools

```bash
# Pipe to jq for JSON processing
crypto-news --json | jq '.articles[0].title'

# Count articles by source
crypto-news --json -n 50 | jq -r '.articles[].source' | sort | uniq -c | sort -rn

# Watch for breaking news every minute
watch -n 60 crypto-news --breaking -n 3

# Send to Slack webhook
crypto-news --json -n 1 | \
  jq -r '.articles[0] | "📰 \(.title)\n\(.source) • \(.timeAgo)\n\(.link)"' | \
  curl -X POST -d @- "$SLACK_WEBHOOK"

# Desktop notification (macOS)
crypto-news --breaking --json | \
  jq -r '.articles[0].title' | \
  xargs -I {} osascript -e 'display notification "{}" with title "Breaking Crypto News"'

# Desktop notification (Linux)
crypto-news --breaking --json | \
  jq -r '.articles[0].title' | \
  xargs notify-send "Breaking Crypto News"
```

### Scripting

```bash
#!/bin/bash
# daily-digest.sh - Send daily crypto digest

ARTICLES=$(crypto-news -n 10 --json)
COUNT=$(echo "$ARTICLES" | jq '.articles | length')

echo "📰 Daily Crypto Digest - $(date +%Y-%m-%d)"
echo "================================"
echo ""
echo "$ARTICLES" | jq -r '.articles[] | "• \(.title)\n  \(.source) • \(.timeAgo)\n"'
echo ""
echo "Total: $COUNT articles"
```

## Output Formats

### Default (Table)

```
📰 Latest Crypto News

1. Bitcoin Surges Past $100K as ETF Inflows Hit Record
   CoinDesk • 2 hours ago
   Institutional demand continues to drive the rally...

2. Ethereum Dencun Upgrade Goes Live
   The Block • 4 hours ago
   Major scalability improvements for Layer 2...

3. SEC Approves First Spot Ethereum ETF
   Reuters • 5 hours ago
   Historic decision opens institutional access...
```

### JSON Output

```bash
crypto-news --json
```

```json
{
  "articles": [
    {
      "title": "Bitcoin Surges Past $100K as ETF Inflows Hit Record",
      "link": "https://coindesk.com/...",
      "description": "Institutional demand continues...",
      "pubDate": "2026-02-02T10:00:00Z",
      "source": "CoinDesk",
      "timeAgo": "2 hours ago"
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2026-02-02T12:00:00Z"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FCN_BASE_URL` | API base URL | `https://cryptocurrency.cv` |
| `FCN_API_KEY` | API key (optional) | |
| `NO_COLOR` | Disable colors | |

```bash
# Use custom API endpoint
export FCN_BASE_URL="https://your-instance.com"
crypto-news

# Disable colors
NO_COLOR=1 crypto-news
```

### Aliases

Add to your shell profile (`~/.bashrc`, `~/.zshrc`):

```bash
# Quick aliases
alias cn="crypto-news"
alias btcnews="crypto-news --bitcoin"
alias ethnews="crypto-news --ethereum"
alias defi="crypto-news --defi"
alias breaking="crypto-news --breaking"
alias trending="crypto-news --trending"

# Functions
cryptosearch() {
  crypto-news -s "$1" -n "${2:-10}"
}
```

## Advanced Usage

### Cron Jobs

```bash
# Add to crontab
crontab -e

# Check breaking news every 15 minutes
*/15 * * * * /usr/local/bin/crypto-news --breaking --json >> /var/log/crypto-breaking.log

# Daily digest at 8 AM
0 8 * * * /usr/local/bin/crypto-news -n 20 | mail -s "Daily Crypto Digest" you@email.com
```

### Docker

```dockerfile
FROM node:20-alpine
RUN npm install -g crypto-news-cli
ENTRYPOINT ["crypto-news"]
```

```bash
docker build -t crypto-news .
docker run crypto-news --trending
```

### GitHub Actions

```yaml
name: Crypto News Alert
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours

jobs:
  alert:
    runs-on: ubuntu-latest
    steps:
      - name: Install CLI
        run: npm install -g crypto-news-cli
      
      - name: Check Breaking News
        run: |
          NEWS=$(crypto-news --breaking --json)
          COUNT=$(echo "$NEWS" | jq '.articles | length')
          if [ "$COUNT" -gt 0 ]; then
            echo "🔥 $COUNT breaking articles found"
            echo "$NEWS" | jq -r '.articles[].title'
          fi
```

## Troubleshooting

### No Results

1. Check internet connection
2. Verify API is accessible:
   ```bash
   curl https://cryptocurrency.cv/api/health
   ```
3. Try with `--json` flag to see raw response

### Slow Response

1. The API caches results, first request may be slower
2. Use `--limit` to reduce data transferred
3. Check your network latency

### Colors Not Working

1. Some terminals don't support ANSI colors
2. Use `--no-color` flag
3. Set `NO_COLOR=1` environment variable

## API Endpoints Used

| Command | Endpoint |
|---------|----------|
| `crypto-news` | `GET /api/news` |
| `--breaking` | `GET /api/breaking` |
| `--trending` | `GET /api/trending` |
| `--bitcoin` | `GET /api/news?ticker=BTC` |
| `--defi` | `GET /api/defi` |
| `-s <query>` | `GET /api/search?q=<query>` |
| `--sources` | `GET /api/sources` |

## Contributing

Found a bug or want a feature? [Open an issue](https://github.com/nirholas/free-crypto-news/issues)!

## License

MIT
