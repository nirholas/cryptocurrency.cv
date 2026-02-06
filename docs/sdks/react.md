# React SDK

The React SDK provides hooks and components for building crypto news interfaces.

## Installation

```bash
npm install @fcn/react
# or
yarn add @fcn/react
```

## Quick Start

```tsx
import { CryptoNewsProvider, useNews, NewsFeed } from '@fcn/react';

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
import { useNews } from '@fcn/react';

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
import { useMarket } from '@fcn/react';

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
import { useFearGreed } from '@fcn/react';

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
import { useSearch } from '@fcn/react';
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
import { NewsFeed } from '@fcn/react';

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
import { MarketTicker } from '@fcn/react';

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
import { BreakingBanner } from '@fcn/react';

<BreakingBanner
  autoHide={10000} // Hide after 10 seconds
  onDismiss={() => console.log('Dismissed')}
  className="fixed top-0 left-0 right-0"
/>
```

### FearGreedWidget

Compact Fear & Greed display.

```tsx
import { FearGreedWidget } from '@fcn/react';

<FearGreedWidget
  size="sm" // 'sm' | 'md' | 'lg'
  showHistory={true}
  animated={true}
/>
```

## Provider Configuration

```tsx
import { CryptoNewsProvider } from '@fcn/react';

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
import { NewsFeed } from '@fcn/react';

const StyledFeed = styled(NewsFeed)`
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 1rem;
  padding: 1.5rem;
`;

<StyledFeed limit={10} />
```

## Server Components (Next.js 14+)

```tsx
// app/news/page.tsx
import { getNews } from '@fcn/react/server';

export default async function NewsPage() {
  const news = await getNews({ limit: 10 });
  
  return (
    <ul>
      {news.articles.map(article => (
        <li key={article.link}>{article.title}</li>
      ))}
    </ul>
  );
}
```

## Source Code

View the full React SDK: [sdk/react](https://github.com/nirholas/free-crypto-news/tree/main/sdk/react)
