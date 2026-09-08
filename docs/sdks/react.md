# React SDK

The React SDK provides hooks and components for building crypto news interfaces.

## Installation

The React package is **not published to npm yet**. Use it from a clone of the
repository, either by copying `sdk/react/src` into your app or by linking the
workspace package:

```bash
git clone https://github.com/nirholas/cryptocurrency.cv.git
cd cryptocurrency.cv/sdk/react
npm install && npm run build
npm link            # then `npm link @nirholas/react-crypto-news` in your app
```

Imports below use `@nirholas/react-crypto-news`, the package's own name. If you
copied the source in instead, point the import at your local path.

## Quick Start

```tsx
import { CryptoNewsProvider, useNews, NewsFeed } from '@nirholas/react-crypto-news';

function App() {
  return (
    <CryptoNewsProvider>
      <NewsFeed limit={10} />
    </CryptoNewsProvider>
  );
}
```

## Hooks

### useNews

Fetch news articles with automatic caching and refetching.

```tsx
import { useNews } from '@nirholas/react-crypto-news';

function LatestNews() {
  const { articles, isLoading, error, refetch } = useNews({
    limit: 10,
    category: 'defi',
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {articles.map(article => (
        <article key={article.link}>
          <h3>{article.title}</h3>
          <p>{article.description}</p>
          <span>{article.timeAgo}</span>
        </article>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### useMarket

Real-time market data with automatic updates.

```tsx
import { useMarket } from '@nirholas/react-crypto-news';

function MarketOverview() {
  const { data, isLoading } = useMarket({
    refetchInterval: 30000, // Update every 30 seconds
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <h4>Bitcoin</h4>
        <p>${data.bitcoin.price.toLocaleString()}</p>
        <span className={data.bitcoin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
          {data.bitcoin.change24h.toFixed(2)}%
        </span>
      </div>
      {/* More coins... */}
    </div>
  );
}
```

### useFearGreed

Fear & Greed Index with visualization support.

```tsx
import { useFearGreed } from '@nirholas/react-crypto-news';

function FearGreedGauge() {
  const { value, classification, isLoading } = useFearGreed();

  const getColor = () => {
    if (value < 25) return 'bg-red-500';
    if (value < 45) return 'bg-orange-500';
    if (value < 55) return 'bg-yellow-500';
    if (value < 75) return 'bg-lime-500';
    return 'bg-green-500';
  };

  return (
    <div className="text-center">
      <div className={`w-24 h-24 rounded-full ${getColor()} flex items-center justify-center`}>
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="mt-2">{classification}</p>
    </div>
  );
}
```

### useSearch

Search news with debouncing.

```tsx
import { useSearch } from '@nirholas/react-crypto-news';
import { useState } from 'react';

function SearchNews() {
  const [query, setQuery] = useState('');
  const { results, isSearching } = useSearch(query, {
    debounce: 300, // Wait 300ms before searching
    limit: 10,
  });

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search news..."
      />
      {isSearching && <span>Searching...</span>}
      <ul>
        {results.map(article => (
          <li key={article.link}>{article.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Components

### NewsFeed

Pre-built news feed component with customization options.

```tsx
import { NewsFeed } from '@nirholas/react-crypto-news';

<NewsFeed
  limit={10}
  category="institutional"
  showSource={true}
  showTimeAgo={true}
  showDescription={true}
  compact={false}
  className="my-news-feed"
  onArticleClick={(article) => console.log('Clicked:', article.title)}
/>
```

### MarketTicker

Horizontal scrolling market ticker.

```tsx
import { MarketTicker } from '@nirholas/react-crypto-news';

<MarketTicker
  coins={['bitcoin', 'ethereum', 'solana']}
  speed="normal" // 'slow' | 'normal' | 'fast'
  showChange={true}
  showVolume={false}
/>
```

### BreakingBanner

Breaking news alert banner.

```tsx
import { BreakingBanner } from '@nirholas/react-crypto-news';

<BreakingBanner
  autoHide={10000} // Hide after 10 seconds
  onDismiss={() => console.log('Dismissed')}
  className="fixed top-0 left-0 right-0"
/>
```

### FearGreedWidget

Compact Fear & Greed display.

```tsx
import { FearGreedWidget } from '@nirholas/react-crypto-news';

<FearGreedWidget
  size="sm" // 'sm' | 'md' | 'lg'
  showHistory={true}
  animated={true}
/>
```

## Provider Configuration

```tsx
import { CryptoNewsProvider } from '@nirholas/react-crypto-news';

<CryptoNewsProvider
  config={{
    baseUrl: 'https://cryptocurrency.cv',
    defaultLanguage: 'en',
    cacheTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 60 * 1000, // 1 minute
  }}
>
  <App />
</CryptoNewsProvider>
```

## Styling

### With Tailwind CSS

All components support className prop for Tailwind styling:

```tsx
<NewsFeed
  className="bg-slate-900 rounded-xl p-4 shadow-lg"
  articleClassName="border-b border-slate-700 py-3"
  titleClassName="text-white font-semibold"
  descriptionClassName="text-slate-400 text-sm"
/>
```

### With CSS Modules

```tsx
import styles from './News.module.css';

<NewsFeed
  className={styles.feed}
  articleClassName={styles.article}
/>
```

### With Styled Components

```tsx
import styled from 'styled-components';
import { NewsFeed } from '@nirholas/react-crypto-news';

const StyledFeed = styled(NewsFeed)`
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 1rem;
  padding: 1.5rem;
`;

<StyledFeed limit={10} />
```

## Server Components (Next.js 14+)

The React package exports hooks and components, which are client-side. In a
server component, call the REST API directly (or use the TypeScript SDK, which
has no React dependency):

```tsx
// app/news/page.tsx
import { CryptoNews } from '@nirholas/crypto-news';

export default async function NewsPage() {
  const client = new CryptoNews();
  const articles = await client.getLatest(10);

  return (
    <ul>
      {articles.map((article) => (
        <li key={article.link}>{article.title}</li>
      ))}
    </ul>
  );
}
```

## Source Code

View the full React SDK: [sdk/react](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/react)
