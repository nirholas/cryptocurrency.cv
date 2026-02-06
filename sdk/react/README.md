# React Crypto News Components

Drop-in React components for crypto news. **100% FREE - no API keys!**

## Installation

```bash
npm install @nirholas/react-crypto-news
```

## Quick Start

```tsx
import { CryptoNews } from '@nirholas/react-crypto-news';

function App() {
  return <CryptoNews limit={10} />;
}
```

## Components

### `<CryptoNews />`

Main news component with multiple display variants.

```tsx
// List view (default)
<CryptoNews limit={10} />

// Card grid
<CryptoNews variant="cards" limit={6} />

// Compact list
<CryptoNews variant="compact" limit={20} />

// Scrolling ticker
<CryptoNews variant="ticker" limit={15} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'list' \| 'cards' \| 'compact' \| 'ticker'` | `'list'` | Display style |
| `limit` | `number` | `10` | Max articles |
| `endpoint` | `'news' \| 'bitcoin' \| 'defi' \| 'breaking'` | `'news'` | News category |
| `source` | `string` | - | Filter by source |
| `showSource` | `boolean` | `true` | Show source badge |
| `showTime` | `boolean` | `true` | Show time ago |
| `showDescription` | `boolean` | `true` | Show description |
| `refreshInterval` | `number` | `0` | Auto-refresh (ms) |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color theme |
| `className` | `string` | - | CSS class |
| `style` | `CSSProperties` | - | Inline styles |
| `onArticleClick` | `(article) => void` | - | Click handler |
| `renderArticle` | `(article, i) => ReactNode` | - | Custom renderer |

### Specialized Components

```tsx
// Bitcoin news only
<BitcoinNews limit={5} />

// DeFi news only
<DefiNews limit={5} variant="cards" />

// Breaking news (last 2 hours)
<BreakingNews limit={3} />

// Scrolling ticker
<NewsTicker limit={20} />

// Trending topics
<TrendingTopics limit={10} hours={24} />
```

## Hooks

### `useCryptoNews`

Fetch news for custom UI:

```tsx
import { useCryptoNews } from '@nirholas/react-crypto-news';

function CustomNews() {
  const { articles, loading, error, refresh } = useCryptoNews({
    endpoint: 'news',
    limit: 10,
    refreshInterval: 60000, // Refresh every minute
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      {articles.map(article => (
        <div key={article.link}>
          <a href={article.link}>{article.title}</a>
          <span>{article.source}</span>
        </div>
      ))}
    </div>
  );
}
```

### `useSearchNews`

Search news by keywords:

```tsx
import { useSearchNews } from '@nirholas/react-crypto-news';

function SearchResults({ query }) {
  const { articles, loading } = useSearchNews(query, { limit: 20 });
  
  if (loading) return <div>Searching...</div>;
  
  return articles.map(a => <div key={a.link}>{a.title}</div>);
}
```

### `useTrendingTopics`

Get trending topics:

```tsx
import { useTrendingTopics } from '@nirholas/react-crypto-news';

function Trending() {
  const { topics, loading } = useTrendingTopics({ limit: 10, hours: 24 });
  
  return topics.map(t => (
    <div key={t.topic}>
      {t.topic}: {t.count} mentions ({t.sentiment})
    </div>
  ));
}
```

## Theming

### Auto Theme (System Preference)

```tsx
<CryptoNews theme="auto" />
```

### Dark Theme

```tsx
<CryptoNews theme="dark" />
```

### Custom Styling

```tsx
<CryptoNews 
  className="my-news"
  style={{ maxWidth: 600, margin: '0 auto' }}
/>
```

CSS variables for customization:

```css
.my-news {
  --text-color: #111;
  --text-secondary: #666;
  --border-color: #e5e7eb;
  --card-bg: #fff;
}
```

## Custom Rendering

```tsx
<CryptoNews
  renderArticle={(article, index) => (
    <div key={article.link} className="custom-article">
      <span className="index">{index + 1}</span>
      <a href={article.link}>{article.title}</a>
    </div>
  )}
  renderLoading={() => <Spinner />}
  renderError={(error) => <ErrorMessage error={error} />}
  renderEmpty={() => <p>No news today!</p>}
  renderHeader={() => <h2>Latest Crypto News</h2>}
/>
```

## Self-Hosted API

```tsx
<CryptoNews baseUrl="https://your-instance.vercel.app" />
```

## TypeScript

Full TypeScript support included:

```tsx
import type { 
  NewsArticle, 
  TrendingTopic,
  UseCryptoNewsOptions,
  CryptoNewsProps 
} from '@nirholas/react-crypto-news';
```

## Examples

### News Dashboard

```tsx
function Dashboard() {
  return (
    <div className="dashboard">
      <section>
        <h2>🔥 Breaking</h2>
        <BreakingNews limit={3} variant="cards" />
      </section>
      
      <section>
        <h2>₿ Bitcoin</h2>
        <BitcoinNews limit={5} />
      </section>
      
      <section>
        <h2>📈 Trending</h2>
        <TrendingTopics limit={5} />
      </section>
    </div>
  );
}
```

### Auto-Refreshing Ticker

```tsx
<NewsTicker 
  limit={20} 
  refreshInterval={120000} // 2 minutes
  theme="dark"
/>
```

### Search Page

```tsx
function SearchPage() {
  const [query, setQuery] = useState('');
  const { articles, loading } = useSearchNews(query, { limit: 20 });
  
  return (
    <div>
      <input 
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search crypto news..."
      />
      {loading ? (
        <p>Searching...</p>
      ) : (
        <CryptoNews 
          variant="list"
          renderArticle={(a) => /* custom render */}
        />
      )}
    </div>
  );
}
```

## No API Key Required!

This package uses the free API at `cryptocurrency.cv` - no authentication needed!

## License

MIT
