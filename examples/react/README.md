# React Examples

Comprehensive examples for the Free Crypto News React SDK.

## Installation

```bash
npm install @nirholas/react-crypto-news
# or
yarn add @nirholas/react-crypto-news
# or
pnpm add @nirholas/react-crypto-news
```

## Examples

### Basic Usage ([basic.tsx](./basic.tsx))
Simple news feed components and hooks.

```tsx
import { CryptoNews, useCryptoNews } from '@nirholas/react-crypto-news';

// Drop-in component
<CryptoNews limit={10} showSource showTime />

// Custom hook for full control
const { articles, loading, error, refresh } = useCryptoNews({ limit: 10 });
```

### Market Data ([market-data.tsx](./market-data.tsx))
Price tickers, charts, market cap, and Fear & Greed.

```tsx
import { 
  usePrices, 
  useMarketData, 
  useFearGreed,
  PriceChart 
} from '@nirholas/react-crypto-news';

const { prices } = usePrices({ symbols: ['BTC', 'ETH'] });
<PriceChart symbol="BTC" timeframe="7d" />
```

### Trading Dashboard ([trading.tsx](./trading.tsx))
Signals, whale alerts, funding rates, liquidations, orderbook.

```tsx
import { 
  useSignals, 
  useWhaleAlerts, 
  useFundingRates,
  useOrderbook 
} from '@nirholas/react-crypto-news';

const { signals } = useSignals({ limit: 10 });
const { alerts } = useWhaleAlerts({ minValue: 1000000 });
```

### Real-Time Streaming ([streaming.tsx](./streaming.tsx))
WebSocket connections for live updates.

```tsx
import { 
  useNewsStream, 
  usePriceStream, 
  useWhaleStream 
} from '@nirholas/react-crypto-news';

const { articles, status } = useNewsStream({ maxItems: 50 });
const { prices } = usePriceStream({ symbols: ['BTC', 'ETH'] });
```

### Portfolio Management ([portfolio.tsx](./portfolio.tsx))
Portfolio tracking, watchlists, alerts, and performance.

```tsx
import { 
  usePortfolio, 
  useWatchlist, 
  usePriceAlerts 
} from '@nirholas/react-crypto-news';

const { portfolio } = usePortfolio({ holdings });
const { watchlist } = useWatchlist({ items });
```

## Quick Start

```tsx
import React from 'react';
import { CryptoNews, CryptoNewsTicker, useCryptoNews } from '@nirholas/react-crypto-news';

function App() {
  return (
    <div>
      {/* Breaking news ticker */}
      <CryptoNewsTicker endpoint="breaking" />
      
      {/* Main news feed */}
      <CryptoNews 
        limit={10}
        variant="cards"
        showSource
        showDescription
        refreshInterval={60000}
      />
    </div>
  );
}
```

## Available Hooks

### News Hooks
| Hook | Description |
|------|-------------|
| `useCryptoNews` | Fetch news articles |
| `useTrendingTopics` | Get trending tickers/topics |
| `useNewsStream` | Real-time news WebSocket |

### Market Hooks
| Hook | Description |
|------|-------------|
| `usePrices` | Current prices for symbols |
| `useMarketData` | Market cap, volume, dominance |
| `useFearGreed` | Fear & Greed Index |
| `usePriceStream` | Real-time price WebSocket |

### Trading Hooks
| Hook | Description |
|------|-------------|
| `useSignals` | Trading signals |
| `useWhaleAlerts` | Large transactions |
| `useFundingRates` | Perpetual funding rates |
| `useLiquidations` | Liquidation data |
| `useOrderbook` | Order book depth |
| `useArbitrage` | Arbitrage opportunities |

### Portfolio Hooks
| Hook | Description |
|------|-------------|
| `usePortfolio` | Portfolio valuation |
| `useWatchlist` | Watchlist with targets |
| `usePriceAlerts` | Price alert management |
| `usePortfolioHistory` | Historical performance |

## Components

### Ready-to-Use Components
| Component | Description |
|-----------|-------------|
| `<CryptoNews />` | News feed widget |
| `<CryptoNewsTicker />` | Scrolling news ticker |
| `<PriceTicker />` | Price bar |
| `<PriceChart />` | Interactive price chart |
| `<FearGreedGauge />` | Fear & Greed visualization |
| `<OrderbookDepth />` | Order book display |
| `<AllocationPieChart />` | Portfolio allocation |
| `<PortfolioChart />` | Performance chart |

## Theming

```tsx
<CryptoNews 
  theme="dark"  // 'light' | 'dark' | 'auto'
  className="my-custom-class"
  style={{ borderRadius: '12px' }}
/>
```

## Custom Rendering

```tsx
<CryptoNews 
  renderArticle={(article, index) => (
    <div key={index} className="my-article">
      <h3>{article.title}</h3>
      <span>{article.source}</span>
    </div>
  )}
  renderLoading={() => <MySpinner />}
  renderError={(error) => <MyError error={error} />}
  renderEmpty={() => <div>No news available</div>}
/>
```

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type { 
  NewsArticle, 
  TrendingTopic,
  UseCryptoNewsOptions,
  UseCryptoNewsResult,
} from '@nirholas/react-crypto-news';
```

## API Reference

See the [full documentation](https://cryptocurrency.cv/docs/sdk/react).
