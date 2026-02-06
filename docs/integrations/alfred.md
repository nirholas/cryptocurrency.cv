# Alfred Workflow

The Free Crypto News Alfred Workflow brings instant crypto news search to your Mac.

## Features

- ⚡ Instant news search
- 📰 Latest headlines
- 💰 Quick price checks
- 🔥 Breaking news
- 🎯 Category filters
- 📊 Trending topics

## Requirements

- macOS 10.14+
- [Alfred 5](https://www.alfredapp.com/) with Powerpack

## Installation

### From GitHub Releases

1. Download `Crypto-News.alfredworkflow` from [Releases](https://github.com/nirholas/free-crypto-news/releases)
2. Double-click to install
3. Click **Import** in Alfred

### From Source

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/alfred
open crypto-news.alfredworkflow
```

## Commands

| Keyword | Action | Example |
|---------|--------|---------|
| `news` / `latest` | Get latest news | `./crypto-news.sh news 10` |
| `breaking` | Breaking news (last 2h) | `./crypto-news.sh breaking 5` |
| `bitcoin` / `btc` | Bitcoin news | `./crypto-news.sh bitcoin 10` |
| `defi` | DeFi news | `./crypto-news.sh defi 10` |
| `search` | Search by keyword | `./crypto-news.sh search "ethereum ETF" 10` |
| `trending` | Trending topics | `./crypto-news.sh trending 10` |

## Usage

### Latest News

```bash
./crypto-news.sh news 10
```

### Search News

```bash
./crypto-news.sh search "bitcoin etf" 10
```

### Breaking News

```bash
./crypto-news.sh breaking 5
```

### Bitcoin/DeFi News

```bash
./crypto-news.sh bitcoin 10
./crypto-news.sh defi 10
```

### Trending Topics

```bash
./crypto-news.sh trending 10
```

## Snippets

The workflow includes text expansion snippets:

| Snippet | Expands To |
|---------|------------|
| `;btc` | Current Bitcoin price |
| `;eth` | Current Ethereum price |
| `;fear` | Fear & Greed value |

Enable in Alfred Preferences → Features → Snippets

## Troubleshooting

### No Results

1. Check internet connection
2. Test API directly:
   ```bash
   curl https://cryptocurrency.cv/api/health
   ```
3. Clear workflow cache

### Slow Performance

1. Reduce `news_limit` variable
2. Check network latency
3. Disable unnecessary features

### Script Errors

1. Ensure script permissions:
   ```bash
   chmod +x alfred/crypto-news.sh
   ```
2. Check Console.app for errors

## Updates

### Check for Updates

```
cnupdate
```

### Auto-Update

Enable automatic updates in workflow settings.

## Uninstall

1. Open Alfred Preferences
2. Go to Workflows
3. Right-click Crypto News
4. Select **Delete**

## Source Code

View the Alfred workflow source: [alfred/](https://github.com/nirholas/free-crypto-news/tree/main/alfred)
