/**
 * 🔮 GraphQL API Endpoint
 * 
 * Flexible GraphQL interface for crypto news queries.
 * 
 * POST /api/graphql - Execute GraphQL queries
 * GET /api/graphql - GraphQL Playground
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';

// GraphQL Schema
const SCHEMA = `
type Article {
  id: ID!
  title: String!
  source: String!
  sourceKey: String
  link: String!
  timeAgo: String!
  timestamp: String
  sentiment: String
  sentimentScore: Float
  isBreaking: Boolean
  topics: [String!]
  summary: String
}

type MarketSentiment {
  score: Int!
  label: String!
  bullish: Int!
  bearish: Int!
  neutral: Int!
}

type FearGreed {
  value: Int!
  classification: String!
  timestamp: String
  previousClose: Int
  weekAgo: Int
  monthAgo: Int
}

type Price {
  symbol: String!
  usd: Float!
  change24h: Float
  change7d: Float
  marketCap: Float
  volume24h: Float
}

type TrendingTopic {
  name: String!
  mentions: Int!
  sentiment: String
  change: Float
}

type WhaleAlert {
  hash: String!
  blockchain: String!
  symbol: String!
  amount: Float!
  usdValue: Float!
  from: String
  to: String
  type: String
  timestamp: String
}

type Query {
  # News queries
  news(limit: Int, offset: Int, source: String, topic: String): [Article!]!
  breaking(limit: Int): [Article!]!
  search(query: String!, limit: Int): [Article!]!
  article(id: ID!): Article
  
  # Market data
  sentiment: MarketSentiment!
  fearGreed: FearGreed!
  prices(symbols: [String!]): [Price!]!
  price(symbol: String!): Price
  
  # Trends
  trending(limit: Int, hours: Int): [TrendingTopic!]!
  
  # Whale activity
  whales(limit: Int, minUsd: Float): [WhaleAlert!]!
  
  # Meta
  sources: [String!]!
  topics: [String!]!
}
`;

// Resolvers
async function fetchFromAPI(endpoint: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error(`GraphQL fetch error for ${endpoint}:`, error);
    return null;
  }
}

const resolvers: Record<string, (args: any) => Promise<any>> = {
  // News
  async news({ limit = 20, offset = 0, source, topic }) {
    let endpoint = `/api/news?limit=${limit}&offset=${offset}`;
    if (source) endpoint += `&source=${source}`;
    if (topic) endpoint += `&topic=${topic}`;
    const data = await fetchFromAPI(endpoint);
    return data?.articles || [];
  },
  
  async breaking({ limit = 10 }) {
    const data = await fetchFromAPI(`/api/breaking?limit=${limit}`);
    return data?.articles || [];
  },
  
  async search({ query, limit = 20 }) {
    const data = await fetchFromAPI(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return data?.articles || [];
  },
  
  // Market
  async sentiment() {
    const data = await fetchFromAPI('/api/sentiment');
    return data?.market || { score: 50, label: 'Neutral', bullish: 33, bearish: 33, neutral: 34 };
  },
  
  async fearGreed() {
    const data = await fetchFromAPI('/api/fear-greed');
    return data || { value: 50, classification: 'Neutral' };
  },
  
  async prices({ symbols }) {
    const data = await fetchFromAPI('/api/prices');
    const prices = data?.prices || {};
    
    let result = Object.entries(prices).map(([symbol, info]: [string, any]) => ({
      symbol,
      usd: info.usd || 0,
      change24h: info.change24h || 0,
      change7d: info.change7d,
      marketCap: info.marketCap,
      volume24h: info.volume24h,
    }));
    
    if (symbols && symbols.length > 0) {
      result = result.filter(p => symbols.includes(p.symbol.toLowerCase()));
    }
    
    return result;
  },
  
  async price({ symbol }) {
    const data = await fetchFromAPI('/api/prices');
    const info = data?.prices?.[symbol.toLowerCase()];
    if (!info) return null;
    return {
      symbol,
      usd: info.usd || 0,
      change24h: info.change24h || 0,
      change7d: info.change7d,
      marketCap: info.marketCap,
      volume24h: info.volume24h,
    };
  },
  
  // Trends
  async trending({ limit = 10, hours = 24 }) {
    const data = await fetchFromAPI(`/api/trending?limit=${limit}&hours=${hours}`);
    return data?.topics || [];
  },
  
  // Whales
  async whales({ limit = 10, minUsd = 1000000 }) {
    const data = await fetchFromAPI(`/api/whales?limit=${limit}&min_usd=${minUsd}`);
    return (data?.alerts || []).map((a: any) => ({
      hash: a.hash,
      blockchain: a.blockchain,
      symbol: a.symbol,
      amount: a.amount,
      usdValue: a.usd_value || a.amountUsd,
      from: a.from?.owner || a.from?.address,
      to: a.to?.owner || a.to?.address,
      type: a.type,
      timestamp: a.timestamp,
    }));
  },
  
  // Meta
  async sources() {
    const data = await fetchFromAPI('/api/sources');
    return data?.sources?.map((s: any) => s.name || s.key) || [];
  },
  
  async topics() {
    const data = await fetchFromAPI('/api/topics');
    return data?.topics?.map((t: any) => t.name || t) || [];
  },
};

// Simple GraphQL parser (for demo - in production use graphql-js)
function parseQuery(query: string): { field: string; args: Record<string, any> } | null {
  // Extract the first query field
  const match = query.match(/\{\s*(\w+)(?:\s*\(([^)]*)\))?\s*\{/);
  if (!match) return null;
  
  const field = match[1];
  const argsStr = match[2] || '';
  
  // Parse arguments
  const args: Record<string, any> = {};
  const argMatches = argsStr.matchAll(/(\w+)\s*:\s*("([^"]+)"|(\d+)|\[([^\]]+)\])/g);
  for (const m of argMatches) {
    const key = m[1];
    if (m[3] !== undefined) args[key] = m[3]; // string
    else if (m[4] !== undefined) args[key] = parseInt(m[4]); // number
    else if (m[5] !== undefined) args[key] = m[5].split(',').map(s => s.trim().replace(/"/g, '')); // array
  }
  
  return { field, args };
}

// Execute GraphQL query
async function executeQuery(query: string, variables?: Record<string, any>) {
  const parsed = parseQuery(query);
  if (!parsed) {
    return { errors: [{ message: 'Could not parse query' }] };
  }
  
  const resolver = resolvers[parsed.field];
  if (!resolver) {
    return { errors: [{ message: `Unknown field: ${parsed.field}` }] };
  }
  
  try {
    const data = await resolver({ ...parsed.args, ...variables });
    return { data: { [parsed.field]: data } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { errors: [{ message }] };
  }
}

// GET - GraphQL Playground
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  // If query provided, execute it
  if (query) {
    const result = await executeQuery(query);
    return NextResponse.json(result);
  }
  
  // Return playground HTML
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Crypto News GraphQL</title>
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
</head>
<body style="margin: 0;">
  <div id="graphiql" style="height: 100vh;"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: '/api/graphql' });
    ReactDOM.render(
      React.createElement(GraphiQL, { 
        fetcher,
        defaultQuery: \`# Crypto News GraphQL API
{
  news(limit: 5) {
    title
    source
    sentiment
    timeAgo
  }
}
\`
      }),
      document.getElementById('graphiql'),
    );
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

// POST - Execute GraphQL queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables } = body;
    
    if (!query) {
      return NextResponse.json({ errors: [{ message: 'Query required' }] }, { status: 400 });
    }
    
    const result = await executeQuery(query, variables);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
