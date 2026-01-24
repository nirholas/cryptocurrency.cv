# Alfred Workflow

The Free Crypto News Alfred Workflow brings instant crypto news search to your Mac.

## Features

- ⚡ Instant news search
- 📰 Latest headlines
- 💰 Quick price checks
- 🔥 Breaking news
- 🎯 Category filters

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

## Usage

### Latest News

Type `cn` to see the latest crypto headlines:

```
cn
```

Results show:
- Article title
- Source name
- Time ago

Press `Enter` to open article in browser.

### Search News

Type `cn` followed by keywords:

```
cn bitcoin etf
cn ethereum merge
cn defi hack
```

### Quick Price

Type `cp` for quick price check:

```
cp          → Show top coins
cp btc      → Bitcoin price
cp eth sol  → Multiple coins
```

### Breaking News

Type `cbreak` for breaking news (last 2 hours):

```
cbreak
```

### Category Filter

Type `ccat` to filter by category:

```
ccat defi
ccat institutional
ccat bitcoin
```

## Keyword Reference

| Keyword | Action |
|---------|--------|
| `cn` | Latest news / Search |
| `cp` | Price check |
| `cbreak` | Breaking news |
| `ccat` | Category filter |
| `cfear` | Fear & Greed Index |

## Hotkeys

Configure in Alfred Preferences → Workflows → Crypto News:

| Default | Action |
|---------|--------|
| `⌥N` | Open news search |
| `⌥P` | Quick price check |
| `⌥B` | Breaking news |

## Configuration

### Workflow Variables

Open Alfred Preferences → Workflows → Crypto News → [x] icon:

| Variable | Default | Description |
|----------|---------|-------------|
| `news_limit` | `10` | Number of articles |
| `default_category` | `all` | Default category |
| `price_coins` | `btc,eth,sol` | Default coins for price |

### Cache Settings

Results are cached for 5 minutes. Clear cache:

1. Open Alfred Preferences
2. Go to Workflows → Crypto News
3. Click **Clear Cache**

Or use the keyword:

```
cnclear
```

## Actions

### Primary Actions (Enter)

- **News items:** Open article in browser
- **Price items:** Copy price to clipboard
- **Fear & Greed:** Open detailed view

### Modifier Keys

| Key | Action |
|-----|--------|
| `⌘` | Copy article URL |
| `⌥` | Open source website |
| `⌃` | Show more details |
| `⇧` | Preview in Alfred |

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
   curl https://free-crypto-news.vercel.app/api/health
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
