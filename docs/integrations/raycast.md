# Raycast Extension

The Free Crypto News Raycast extension provides quick access to crypto news and market data.

## Features

- 📰 Latest news with rich previews
- 🔍 Instant search
- 💰 Market prices
- 📊 Fear & Greed Index
- ⚡ Breaking news alerts
- 🔖 Favorite articles

## Installation

### From Raycast Store

1. Open Raycast
2. Type `Store`
3. Search for `Crypto News`
4. Click **Install**

*(Coming soon to the official store)*

### Manual Installation

```bash
git clone https://github.com/nirholas/free-crypto-news.git
cd free-crypto-news/raycast
npm install
npm run dev
```

## Commands

### Latest News

Open Raycast and type:
```
Crypto News
```

or use the shortcut (configurable):
```
⌘ + Shift + N
```

### Search News

```
Search Crypto News
```

Type your query to search across all sources.

### Market Prices

```
Crypto Prices
```

View real-time prices for top cryptocurrencies.

### Fear & Greed

```
Fear Greed Index
```

See current market sentiment with historical data.

### Breaking News

```
Breaking Crypto News
```

View urgent news from the last 2 hours.

## Keyboard Shortcuts

| Command | Default Shortcut |
|---------|------------------|
| Latest News | `⌘⇧N` |
| Search News | `⌘⇧S` |
| Crypto Prices | `⌘⇧P` |
| Fear & Greed | `⌘⇧F` |

Configure in Raycast Preferences → Extensions → Crypto News

## List Actions

### On News Items

| Action | Shortcut |
|--------|----------|
| Open in Browser | `↵` |
| Copy Link | `⌘C` |
| Copy Title | `⌘⇧C` |
| Add to Favorites | `⌘D` |
| Open Source Site | `⌘O` |

### On Price Items

| Action | Shortcut |
|--------|----------|
| View Details | `↵` |
| Copy Price | `⌘C` |
| Open CoinGecko | `⌘O` |
| Add to Watchlist | `⌘D` |

## Preferences

Open Raycast Preferences → Extensions → Crypto News:

| Setting | Options | Default |
|---------|---------|---------|
| News Limit | 5-50 | 10 |
| Default Category | All categories | All |
| Show Descriptions | On/Off | On |
| Price Coins | Comma-separated | BTC,ETH,SOL |
| Refresh Interval | 1-60 min | 5 min |

## Category Filters

Filter news by category in the search bar:

```
#defi          → DeFi news only
#bitcoin       → Bitcoin news only
#institutional → VC/Institutional news
#etf           → ETF news
```

Or use the dropdown filter in the action panel.

## Detail View

Press `→` on any article to see:

- Full article preview
- Related articles
- Source information
- Share options

## Favorites

Save articles for later:

1. Select an article
2. Press `⌘D` or choose **Add to Favorites**
3. Access via **Crypto News Favorites** command

## Widgets

### Menu Bar Widget

Show a live ticker in your menu bar:

1. Open Raycast Preferences
2. Go to Extensions → Crypto News
3. Enable **Menu Bar Prices**
4. Select coins to display

### Quick Links

Add to Raycast Quick Links:
- Latest News: `raycast://extensions/fcn/latest`
- Search: `raycast://extensions/fcn/search`
- Prices: `raycast://extensions/fcn/prices`

## Development

### Build from Source

```bash
cd raycast
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

Changes reload automatically in Raycast.

### Project Structure

```
raycast/
├── package.json
├── src/
│   ├── latest.tsx      # Latest news command
│   ├── search.tsx      # Search command
│   ├── prices.tsx      # Prices command
│   ├── fear-greed.tsx  # Fear & Greed command
│   └── components/     # Shared components
└── assets/
    └── icons/          # Command icons
```

## Troubleshooting

### Extension Not Loading

1. Reinstall the extension
2. Restart Raycast (`⌘Q` then reopen)
3. Check Raycast logs

### Slow Performance

1. Reduce news limit in preferences
2. Check network connection
3. Disable unnecessary features

### No Results

1. Check API status:
   ```bash
   curl https://free-crypto-news.vercel.app/api/health
   ```
2. Clear Raycast cache
3. Restart extension

## Source Code

View the Raycast extension source: [raycast/](https://github.com/nirholas/free-crypto-news/tree/main/raycast)
