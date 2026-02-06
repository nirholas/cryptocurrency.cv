# Mobile App

React Native mobile app for the Free Crypto News API.

## Overview

The mobile app provides a native experience for accessing crypto news on iOS and Android devices. Built with Expo and React Native, it offers real-time news, market data, and price alerts.

## Features

| Feature | Description |
|---------|-------------|
| 📰 News Feed | Real-time crypto news with pull-to-refresh |
| 🔴 Breaking News | Priority alerts for major events |
| 🔥 Trending | Most popular articles |
| 🔍 Search | Full-text search with debouncing |
| 📈 Markets | Live coin prices and Fear & Greed Index |
| 🔔 Alerts | Customizable price notifications |
| 🌙 Dark Mode | Automatic theme switching |
| 📱 Native | iOS & Android with haptic feedback |

## Installation

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Or run on specific platform
npm run ios
npm run android
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
    │   └── client.ts          # API client
    ├── components/
    │   ├── NewsCard.tsx       # Article card
    │   ├── CoinCard.tsx       # Market coin row
    │   ├── FearGreedGauge.tsx # Sentiment gauge
    │   └── SentimentBadge.tsx # Market badge
    ├── hooks/
    │   ├── useNews.ts         # News data hooks
    │   └── useMarket.ts       # Market data hooks
    ├── screens/
    │   ├── HomeScreen.tsx     # News feed
    │   ├── SearchScreen.tsx   # Search
    │   ├── MarketsScreen.tsx  # Prices
    │   ├── AlertsScreen.tsx   # Alerts
    │   ├── SettingsScreen.tsx # Settings
    │   └── ArticleScreen.tsx  # WebView
    └── types/
        └── index.ts           # TypeScript types
```

## API Client

```typescript
import api from './src/api/client';

// Get latest news
const news = await api.getNews(20);

// Search articles
const results = await api.search('bitcoin');

// Get sentiment
const sentiment = await api.getSentiment('BTC');

// Get Fear & Greed
const fng = await api.getFearGreed();

// Get coin prices
const coins = await api.getMarketCoins(50);
```

## Custom Hooks

### useNews

```typescript
const { 
  articles, 
  loading, 
  error, 
  refresh, 
  loadMore,
  hasMore 
} = useNews({
  limit: 20,
  source: 'coindesk',
  ticker: 'BTC',
  autoRefresh: true,
  refreshInterval: 60000,
});
```

### useSearch

```typescript
const { articles, loading, error } = useSearch('ethereum');
```

### useMarketCoins

```typescript
const { coins, loading, refresh } = useMarketCoins(50);
```

### useFearGreed

```typescript
const { data, loading, refresh } = useFearGreed();
```

### useSentiment

```typescript
const { sentiment, loading, refresh } = useSentiment('BTC');
```

## Screens

### Home Screen

The main news feed with tabs:
- **Latest**: Real-time news with infinite scroll
- **Breaking**: Priority breaking news alerts
- **Trending**: Most popular articles

Features Fear & Greed gauge and market sentiment at the top.

### Search Screen

Full-text search with:
- Debounced input (300ms)
- Popular search suggestions
- Compact news card layout

### Markets Screen

Live cryptocurrency prices:
- Top 50 coins by market cap
- 24h price change indicators
- Pull-to-refresh (30s auto-refresh)
- Fear & Greed Index

### Alerts Screen

Price alert management:
- Create price alerts
- Toggle notifications
- Support for price, news, and sentiment triggers

### Settings Screen

App configuration:
- Push notification toggle
- Dark mode preference
- Haptic feedback toggle
- Links to API docs and GitHub

### Article Screen

WebView for reading full articles:
- Share functionality
- Open in external browser
- Native loading indicator

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
# Build APK for testing
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## Configuration

### app.json

Key configuration options:

```json
{
  "expo": {
    "name": "Crypto News",
    "slug": "crypto-news",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.cryptonews.app"
    },
    "android": {
      "package": "com.cryptonews.app"
    }
  }
}
```

### Environment Variables

Create `.env` file:

```env
EXPO_PUBLIC_API_URL=https://cryptocurrency.cv
```

## Theming

### Colors

```typescript
const CryptoDarkTheme = {
  colors: {
    primary: '#f7931a',      // Bitcoin orange
    background: '#0a0a0a',   // Dark background
    card: '#1a1a1a',         // Card background
    text: '#ffffff',
  },
};
```

### Adding Screens

1. Create screen in `src/screens/`
2. Add to navigation types in `App.tsx`
3. Register in `TabNavigator` or `Stack.Navigator`

## Dependencies

| Package | Purpose |
|---------|---------|
| expo | Development framework |
| @react-navigation/native | Navigation |
| @react-navigation/bottom-tabs | Tab navigation |
| react-native-webview | Article viewing |
| expo-haptics | Haptic feedback |
| expo-notifications | Push notifications |

## API Endpoints Used

| Endpoint | Screen |
|----------|--------|
| `/api/news` | Home, Search |
| `/api/breaking` | Home |
| `/api/trending` | Home |
| `/api/search` | Search |
| `/api/ai/sentiment` | Home |
| `/api/market/fear-greed` | Home, Markets |
| `/api/market/coins` | Markets |

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow existing code style
4. Submit pull request

## License

MIT License - see [LICENSE](../LICENSE) for details.
