# Crypto News Mobile App

React Native mobile app for the Free Crypto News API, built with Expo.

![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-50-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.1-3178C6?logo=typescript)

## Features

- 📰 **Real-time News Feed** - Latest crypto news with pull-to-refresh
- 🔴 **Breaking News** - Priority alerts for major market events
- 🔥 **Trending Stories** - Most popular articles across sources
- 🔍 **Smart Search** - Search across all news with debouncing
- 📈 **Market Data** - Live prices for top cryptocurrencies
- 😰 **Fear & Greed Index** - Real-time market sentiment gauge
- 🔔 **Price Alerts** - Customizable notifications
- 🌙 **Dark Mode** - Automatic theme switching
- 📱 **Native Experience** - iOS & Android with haptic feedback

## Screenshots

| Home | Search | Markets | Alerts |
|:----:|:------:|:-------:|:------:|
| 📰 | 🔍 | 📈 | 🔔 |

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
cd mobile
npm install
```

### Run Development Server

```bash
# Start Expo
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Project Structure

```
mobile/
├── App.tsx                    # Main app with navigation
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── src/
    ├── api/
    │   └── client.ts          # API client for cryptocurrency.cv
    ├── components/
    │   ├── NewsCard.tsx       # Article card component
    │   ├── CoinCard.tsx       # Market coin row
    │   ├── FearGreedGauge.tsx # Sentiment gauge
    │   └── SentimentBadge.tsx # Market sentiment badge
    ├── hooks/
    │   ├── useNews.ts         # News data hooks
    │   └── useMarket.ts       # Market data hooks
    └── screens/
        ├── HomeScreen.tsx     # News feed with tabs
        ├── SearchScreen.tsx   # Search functionality
        ├── MarketsScreen.tsx  # Coin prices
        ├── AlertsScreen.tsx   # Price alerts
        ├── SettingsScreen.tsx # App settings
        └── ArticleScreen.tsx  # WebView for articles
```

## API Integration

The app uses the Free Crypto News API:

```typescript
import api from './src/api/client';

// Get latest news
const news = await api.getNews(20);

// Search articles
const results = await api.search('bitcoin');

// Get market sentiment
const sentiment = await api.getSentiment('BTC');

// Get Fear & Greed Index
const fng = await api.getFearGreed();

// Get coin prices
const coins = await api.getMarketCoins(50);
```

## Custom Hooks

### useNews

```typescript
const { articles, loading, error, refresh, loadMore } = useNews({
  limit: 20,
  source: 'coindesk',
  ticker: 'BTC',
  autoRefresh: true,
  refreshInterval: 60000,
});
```

### useSearch

```typescript
const { articles, loading, error } = useSearch('ethereum defi');
```

### useMarketCoins

```typescript
const { coins, loading, refresh } = useMarketCoins(50);
```

### useFearGreed

```typescript
const { data, loading, refresh } = useFearGreed();
// data: { value: 75, classification: 'Greed' }
```

## Building for Production

### iOS

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build APK
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://cryptocurrency.cv
```

### Push Notifications

Configure in `app.json`:

```json
{
  "expo": {
    "plugins": ["expo-notifications"]
  }
}
```

## Customization

### Theming

Colors are defined in `App.tsx`:

```typescript
const CryptoDarkTheme = {
  colors: {
    primary: '#f7931a',      // Bitcoin orange
    background: '#0a0a0a',   // Dark background
    card: '#1a1a1a',         // Card background
    text: '#ffffff',         // Text color
  },
};
```

### Adding New Screens

1. Create screen in `src/screens/`
2. Add to `TabParamList` in `App.tsx`
3. Register in `TabNavigator`

## API Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `/api/news` | Latest news articles |
| `/api/breaking` | Breaking news only |
| `/api/trending` | Trending articles |
| `/api/search` | Search articles |
| `/api/ai/sentiment` | Market sentiment |
| `/api/market/fear-greed` | Fear & Greed Index |
| `/api/market/coins` | Coin prices |

## Contributing

1. Fork the repository
2. Create feature branch
3. Submit pull request

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Links

- **API**: https://cryptocurrency.cv
- **Documentation**: https://cryptocurrency.cv/docs
- **GitHub**: https://github.com/AItoolsbyai/free-crypto-news
