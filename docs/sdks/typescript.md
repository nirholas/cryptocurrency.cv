# TypeScript SDK

The TypeScript SDK provides full type safety with comprehensive type definitions.

## Installation

```bash
npm install @fcn/sdk
# or
yarn add @fcn/sdk
```

## Quick Start

```typescript
import { CryptoNews, NewsArticle, MarketData } from '@fcn/sdk';

const client = new CryptoNews();

// Fully typed responses
const news = await client.getNews({ limit: 10 });
news.articles.forEach((article: NewsArticle) => {
  console.log(article.title, article.pubDate);
});

// Market data with types
const market: MarketData = await client.getMarket();
console.log(market.bitcoin.price);
```

## Type Definitions

### Core Types

```typescript
interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  timeAgo: string;
}

interface NewsResponse {
  articles: NewsArticle[];
  totalCount: number;
  sources: string[];
  fetchedAt: string;
  category?: string;
  pagination?: {
    page: number;
    perPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface MarketData {
  bitcoin: CoinData;
  ethereum: CoinData;
  [key: string]: CoinData;
}

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface FearGreedIndex {
  value: number;
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  timestamp: string;
  previousClose: number;
  weekAgo: number;
}
```

### Options Types

```typescript
interface NewsOptions {
  limit?: number;
  source?: string;
  category?: NewsCategory;
  lang?: SupportedLanguage;
  page?: number;
  perPage?: number;
}

type NewsCategory = 
  | 'general' | 'bitcoin' | 'defi' | 'nft' | 'research'
  | 'institutional' | 'etf' | 'derivatives' | 'onchain'
  | 'fintech' | 'macro' | 'quant' | 'journalism'
  | 'ethereum' | 'asia' | 'tradfi' | 'mainstream';

type SupportedLanguage = 
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl'
  | 'ru' | 'ar' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'tr';
```

## Usage Examples

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { CryptoNews, NewsResponse } from '@fcn/sdk';

const client = new CryptoNews();

function useNews(category?: string) {
  return useQuery<NewsResponse>({
    queryKey: ['news', category],
    queryFn: () => client.getNews({ limit: 10, category }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

function NewsList() {
  const { data, isLoading, error } = useNews('defi');
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading news</div>;
  
  return (
    <ul>
      {data?.articles.map(article => (
        <li key={article.link}>
          <a href={article.link}>{article.title}</a>
        </li>
      ))}
    </ul>
  );
}
```

### With Zod Validation

```typescript
import { z } from 'zod';
import { CryptoNews } from '@fcn/sdk';

const ArticleSchema = z.object({
  title: z.string(),
  description: z.string(),
  link: z.string().url(),
  pubDate: z.string().datetime(),
  source: z.string(),
});

const client = new CryptoNews();

async function getValidatedNews() {
  const response = await client.getNews({ limit: 10 });
  
  // Validate each article
  const validated = response.articles.map(article => 
    ArticleSchema.parse(article)
  );
  
  return validated;
}
```

### Generic Fetch Wrapper

```typescript
import { CryptoNews } from '@fcn/sdk';

class TypedNewsClient extends CryptoNews {
  async fetchTyped<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }
}

// Usage
const client = new TypedNewsClient();
const data = await client.fetchTyped<NewsResponse>('/api/news?limit=5');
```

## Strict Mode

Enable strict null checks for maximum type safety:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}
```

```typescript
import { CryptoNews, NewsResponse } from '@fcn/sdk';

const client = new CryptoNews();

async function getFirstArticle(): Promise<string | undefined> {
  const news: NewsResponse = await client.getNews({ limit: 1 });
  
  // TypeScript enforces null check
  if (news.articles.length > 0) {
    return news.articles[0].title;
  }
  
  return undefined;
}
```

## Error Types

```typescript
import { CryptoNews, FCNError, NetworkError, ValidationError } from '@fcn/sdk';

const client = new CryptoNews();

try {
  const news = await client.getNews({ limit: 10 });
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof FCNError) {
    console.error('API error:', error.status, error.message);
  }
}
```

## Source Code

View the full SDK source with type definitions: [sdk/typescript](https://github.com/nirholas/free-crypto-news/tree/main/sdk/typescript)
