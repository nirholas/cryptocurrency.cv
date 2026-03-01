# Free Crypto News — Raycast Extension

Real-time crypto news, prices, gas fees, Fear & Greed Index, and portfolio tracker — right from your Raycast command bar.

Powered by the free [cryptocurrency.cv](https://cryptocurrency.cv) API. No API key required.

## Commands

| Command | Description |
|---------|-------------|
| **Latest News** | All recent crypto news from 200+ sources |
| **Breaking News** | Urgent headlines from the last 2 hours |
| **Search News** | Full-text search with debounced input |
| **Crypto Prices** | Live top-20 coin prices with 24h change |
| **Fear & Greed Index** | Market emotion gauge with historical trend |
| **Ethereum Gas** | Current gas prices — slow / standard / fast |
| **Trending** | Trending articles and topics |
| **Portfolio** | Quick portfolio check with live valuations |

## Installation

### From Raycast Store (coming soon)

Search for **"Free Crypto News"** in Raycast.

### Manual Installation

```bash
cd raycast
pnpm install
pnpm run dev
```

## Usage

Open Raycast and type any command name (e.g. "Crypto Prices", "Search News").

### Search News

Type your query in the search bar — results are fetched with debounce for smooth UX.

### Prices

View live prices for the top 20 coins. Pull-to-refresh, copy a price, or open the coin page.

### Fear & Greed Index

A single Detail view with a visual gauge, historical trend, and one-click browser open.

### Ethereum Gas

Three gas tiers (slow / standard / fast) shown in gwei with estimated USD cost.

### Trending

Trending articles with title, source, and preview. Also shows trending topic hashtags with mention counts.

### Portfolio

Stores your holdings in Raycast local storage. Shows live valuation. Add / remove coins easily.

<!-- screenshot placeholder -->
<!-- ![screenshot](media/screenshot.png) -->

## Configuration

| Preference | Default | Description |
|------------|---------|-------------|
| `apiBaseUrl` | `https://cryptocurrency.cv/api` | Base URL for the API |

## Privacy

This extension:
- Only fetches from `cryptocurrency.cv`
- Stores portfolio data locally on your machine
- Does not track you or collect any data
- Fully open source

## License

See [LICENSE](../LICENSE) file.

## Links

- [cryptocurrency.cv](https://cryptocurrency.cv)
- [API Documentation](https://cryptocurrency.cv/developers)
- [GitHub Repository](https://github.com/nirholas/free-crypto-news)

