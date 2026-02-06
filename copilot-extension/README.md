# Crypto News for GitHub Copilot

Get real-time crypto news, market sentiment, and whale alerts directly in GitHub Copilot Chat! 🚀

## Features

- 📰 **Breaking News** - Latest crypto headlines
- 📊 **Market Sentiment** - Bull/bear analysis
- 💰 **Live Prices** - Current crypto prices
- 😱 **Fear & Greed Index** - Market emotion gauge
- 🐋 **Whale Alerts** - Large transaction tracking
- 🔥 **Trending Topics** - What's hot in crypto

## Usage

In GitHub Copilot Chat, type `@cryptonews` followed by a command:

```
@cryptonews /breaking
@cryptonews /market
@cryptonews /prices
@cryptonews /feargreed
@cryptonews /whale
@cryptonews /trending
```

Or ask any crypto question:
```
@cryptonews what's happening with Bitcoin?
@cryptonews latest Ethereum news
```

## Installation

1. Install from VS Code Marketplace
2. Ensure GitHub Copilot Chat is enabled
3. Use `@cryptonews` in any Copilot Chat

## Commands

| Command | Description |
|---------|-------------|
| `/breaking` | Get breaking crypto news |
| `/market` | Market sentiment analysis |
| `/prices` | Current cryptocurrency prices |
| `/feargreed` | Fear & Greed Index |
| `/whale` | Whale activity alerts |
| `/trending` | Trending topics in crypto |

## Configuration

Access settings via `Preferences > Settings > Extensions > Crypto News`:

- `cryptonews.apiUrl` - API endpoint (default: https://cryptocurrency.cv)
- `cryptonews.defaultLimit` - Number of items to fetch (default: 5)
- `cryptonews.showSentiment` - Show sentiment indicators (default: true)

## API

This extension uses the [Free Crypto News API](https://cryptocurrency.cv):

- 200+ news sources
- Real-time updates
- Free tier available
- No API key required

## Development

```bash
cd copilot-extension
npm install
npm run compile
```

Press `F5` to launch Extension Development Host.

## License

MIT License - see LICENSE file.

## Links

- [Free Crypto News](https://cryptocurrency.cv)
- [API Documentation](https://cryptocurrency.cv/developers)
- [GitHub Repository](https://github.com/nirholas/free-crypto-news)
