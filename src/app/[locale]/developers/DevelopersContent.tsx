"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Badge } from "@/components/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════
   QUICK START EXAMPLES
   ═══════════════════════════════════════════════════════════════ */

const quickStartExamples: { label: string; language: string; code: string }[] = [
  {
    label: "cURL",
    language: "bash",
    code: `curl "https://cryptocurrency.cv/api/news?limit=10"`,
  },
  {
    label: "Python",
    language: "python",
    code: `import requests

response = requests.get("https://cryptocurrency.cv/api/news", params={"limit": 10})
data = response.json()

for article in data["articles"]:
    print(article["title"], "-", article["source"])`,
  },
  {
    label: "JavaScript",
    language: "javascript",
    code: `const response = await fetch("https://cryptocurrency.cv/api/news?limit=10");
const data = await response.json();

data.articles.forEach(article => {
  console.log(article.title, "-", article.source);
});`,
  },
  {
    label: "Go",
    language: "go",
    code: `package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "io"
)

func main() {
    resp, err := http.Get("https://cryptocurrency.cv/api/news?limit=10")
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    var data map[string]interface{}
    json.Unmarshal(body, &data)
    fmt.Println(data)
}`,
  },
  {
    label: "PHP",
    language: "php",
    code: `<?php
$response = file_get_contents("https://cryptocurrency.cv/api/news?limit=10");
$data = json_decode($response, true);

foreach ($data["articles"] as $article) {
    echo $article["title"] . " - " . $article["source"] . "\\n";
}`,
  },
  {
    label: "Ruby",
    language: "ruby",
    code: `require 'net/http'
require 'json'

uri = URI("https://cryptocurrency.cv/api/news?limit=10")
response = Net::HTTP.get(uri)
data = JSON.parse(response)

data["articles"].each do |article|
  puts "#{article['title']} - #{article['source']}"
end`,
  },
  {
    label: "Rust",
    language: "rust",
    code: `use reqwest;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let body = reqwest::get("https://cryptocurrency.cv/api/news?limit=10")
        .await?
        .json::<Value>()
        .await?;

    if let Some(articles) = body["articles"].as_array() {
        for article in articles {
            println!("{} - {}", article["title"], article["source"]);
        }
    }
    Ok(())
}`,
  },
];

/* ═══════════════════════════════════════════════════════════════
   ENDPOINT CATEGORIES
   ═══════════════════════════════════════════════════════════════ */

interface EndpointParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

interface Endpoint {
  method: string;
  path: string;
  description: string;
  params: EndpointParam[];
  response: string;
  status?: "stable" | "beta" | "deprecated";
}

interface EndpointCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  endpoints: Endpoint[];
}

const endpointCategories: EndpointCategory[] = [
  {
    id: "news",
    title: "News",
    icon: "📰",
    description: "Aggregated crypto news from 300+ sources with search, categories, and real-time updates.",
    endpoints: [
      {
        method: "GET",
        path: "/api/news",
        description: "Fetch the latest aggregated crypto news from 300+ sources.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of articles to return (default: 20, max: 100)" },
          { name: "offset", type: "number", required: false, description: "Pagination offset (default: 0)" },
          { name: "category", type: "string", required: false, description: "Filter by category: bitcoin, ethereum, defi, nft, altcoins, regulation, trading, mining, web3" },
          { name: "source", type: "string", required: false, description: "Filter by source name (e.g., coindesk, cointelegraph)" },
        ],
        response: `{
  "articles": [
    {
      "title": "Bitcoin Hits New All-Time High",
      "source": "CoinDesk",
      "link": "https://...",
      "pubDate": "2026-03-01T12:00:00Z",
      "category": "bitcoin",
      "description": "Bitcoin surpassed...",
      "imageUrl": "https://..."
    }
  ],
  "totalCount": 150,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/news?search=",
        description: "Search news articles by keyword or phrase.",
        params: [
          { name: "search", type: "string", required: true, description: "Search query string" },
          { name: "limit", type: "number", required: false, description: "Number of results (default: 20)" },
        ],
        response: `{
  "articles": [...],
  "query": "ethereum merge",
  "totalCount": 42,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/breaking",
        description: "Get breaking news from the last 2 hours.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of articles (default: 5)" },
        ],
        response: `{
  "articles": [...],
  "totalCount": 3,
  "isBreaking": true,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/trending",
        description: "Discover currently trending topics and keywords across crypto news.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of topics (default: 10)" },
        ],
        response: `{
  "topics": [
    { "keyword": "bitcoin etf", "mentions": 847, "trend": "up" },
    { "keyword": "solana", "mentions": 523, "trend": "up" }
  ],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
    ],
  },
  {
    id: "markets",
    title: "Markets",
    icon: "📈",
    description: "Real-time prices, market caps, OHLC data, and the Fear & Greed Index.",
    endpoints: [
      {
        method: "GET",
        path: "/api/prices",
        description: "Get current cryptocurrency prices and 24h changes.",
        params: [
          { name: "coins", type: "string", required: false, description: "Comma-separated coin IDs (default: top 20)" },
          { name: "currency", type: "string", required: false, description: "Quote currency (default: usd)" },
        ],
        response: `{
  "prices": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "price": 98542.30,
      "change24h": 2.45,
      "marketCap": 1940000000000,
      "volume24h": 35200000000
    }
  ],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/market",
        description: "Get global market overview including total market cap and dominance.",
        params: [],
        response: `{
  "totalMarketCap": 3420000000000,
  "btcDominance": 56.7,
  "ethDominance": 12.3,
  "totalVolume24h": 142000000000,
  "activeCoins": 14523,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/fear-greed",
        description: "Get the current Crypto Fear & Greed Index value.",
        params: [],
        response: `{
  "value": 72,
  "label": "Greed",
  "timestamp": "2026-03-01T00:00:00Z",
  "history": [
    { "value": 68, "label": "Greed", "date": "2026-02-28" }
  ]
}`,
      },
      {
        method: "GET",
        path: "/api/ohlc",
        description: "Get OHLC (candlestick) data for a specific coin.",
        params: [
          { name: "coin", type: "string", required: true, description: "Coin ID (e.g., bitcoin)" },
          { name: "days", type: "number", required: false, description: "Number of days (default: 30)" },
        ],
        response: `{
  "coin": "bitcoin",
  "ohlc": [
    [1709251200000, 97200, 98800, 96500, 98542],
    [1709164800000, 95100, 97300, 94900, 97200]
  ],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
    ],
  },
  {
    id: "defi",
    title: "DeFi",
    icon: "🏦",
    description: "DeFi protocol TVL rankings, yield farming rates, DEX volumes, and stablecoin data.",
    endpoints: [
      {
        method: "GET",
        path: "/api/defi",
        description: "Get DeFi protocol rankings by total value locked (TVL).",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of protocols (default: 20)" },
          { name: "chain", type: "string", required: false, description: "Filter by chain (e.g., ethereum, solana)" },
        ],
        response: `{
  "protocols": [
    {
      "name": "Lido",
      "tvl": 35200000000,
      "change24h": 1.2,
      "chain": "ethereum",
      "category": "liquid-staking"
    }
  ],
  "totalTvl": 142000000000,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/yields",
        description: "Get top DeFi yield farming opportunities.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of pools (default: 20)" },
          { name: "chain", type: "string", required: false, description: "Filter by chain" },
        ],
        response: `{
  "pools": [
    {
      "protocol": "Aave",
      "pool": "USDC",
      "apy": 5.42,
      "tvl": 2100000000,
      "chain": "ethereum"
    }
  ],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/dex-volumes",
        description: "Get decentralized exchange trading volumes.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of DEXes (default: 10)" },
        ],
        response: `{
  "dexes": [
    {
      "name": "Uniswap",
      "volume24h": 2400000000,
      "change24h": 8.5,
      "chains": ["ethereum", "polygon", "arbitrum"]
    }
  ],
  "totalVolume24h": 8500000000,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/stablecoins",
        description: "Get stablecoin market caps and peg data.",
        params: [],
        response: `{
  "stablecoins": [
    {
      "name": "USDT",
      "marketCap": 142000000000,
      "peg": 1.0001,
      "change7d": 0.3
    }
  ],
  "totalMarketCap": 225000000000,
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
    ],
  },
  {
    id: "blockchain",
    title: "Blockchain",
    icon: "⛓️",
    description: "On-chain analytics, gas prices, and whale movement tracking.",
    endpoints: [
      {
        method: "GET",
        path: "/api/gas",
        description: "Get current gas prices for Ethereum and other chains.",
        params: [
          { name: "chain", type: "string", required: false, description: "Chain name (default: ethereum)" },
        ],
        response: `{
  "chain": "ethereum",
  "gas": {
    "slow": 12,
    "standard": 18,
    "fast": 25,
    "instant": 32
  },
  "unit": "gwei",
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/on-chain",
        description: "Get on-chain analytics including active addresses and transaction counts.",
        params: [
          { name: "chain", type: "string", required: false, description: "Chain (default: bitcoin)" },
        ],
        response: `{
  "chain": "bitcoin",
  "activeAddresses": 1200000,
  "transactions24h": 450000,
  "hashRate": "625 EH/s",
  "difficulty": "92.67T",
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/whale-alerts",
        description: "Get recent large cryptocurrency transfers (whale movements).",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of alerts (default: 10)" },
          { name: "min_value", type: "number", required: false, description: "Minimum USD value (default: 1000000)" },
        ],
        response: `{
  "alerts": [
    {
      "blockchain": "bitcoin",
      "amount": 500,
      "amountUsd": 49200000,
      "from": "unknown wallet",
      "to": "Coinbase",
      "timestamp": "2026-03-01T11:45:00Z"
    }
  ],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
    ],
  },
  {
    id: "social",
    title: "Social",
    icon: "💬",
    description: "Social media sentiment, trending discussions, and community metrics.",
    endpoints: [
      {
        method: "GET",
        path: "/api/sentiment",
        description: "Get aggregated social media sentiment for crypto topics.",
        params: [
          { name: "coin", type: "string", required: false, description: "Coin to analyze (e.g., bitcoin)" },
        ],
        response: `{
  "coin": "bitcoin",
  "sentiment": {
    "score": 0.72,
    "label": "Bullish",
    "positive": 68,
    "negative": 12,
    "neutral": 20
  },
  "sources": ["twitter", "reddit", "telegram"],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
      {
        method: "GET",
        path: "/api/social",
        description: "Get social media activity metrics and trending discussions.",
        params: [
          { name: "platform", type: "string", required: false, description: "Filter by platform: twitter, reddit, telegram" },
          { name: "limit", type: "number", required: false, description: "Number of results (default: 20)" },
        ],
        response: `{
  "posts": [
    {
      "platform": "twitter",
      "content": "...",
      "engagement": 45200,
      "sentiment": "positive",
      "timestamp": "2026-03-01T11:30:00Z"
    }
  ],
  "fetchedAt": "2026-03-01T12:05:00Z"
}`,
      },
    ],
  },
  {
    id: "feeds",
    title: "Feeds",
    icon: "📡",
    description: "RSS 2.0, Atom, and OPML feed formats for news reader integration.",
    endpoints: [
      {
        method: "GET",
        path: "/api/rss",
        description: "Get an RSS 2.0 feed of aggregated crypto news.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of items (default: 20)" },
          { name: "category", type: "string", required: false, description: "Filter by category" },
        ],
        response: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Crypto Vision News</title>
    <link>https://cryptocurrency.cv</link>
    <item>
      <title>Bitcoin Hits New High</title>
      <link>https://...</link>
      <pubDate>Sat, 01 Mar 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`,
      },
      {
        method: "GET",
        path: "/api/atom",
        description: "Get an Atom feed of aggregated crypto news.",
        params: [
          { name: "limit", type: "number", required: false, description: "Number of entries (default: 20)" },
          { name: "category", type: "string", required: false, description: "Filter by category" },
        ],
        response: `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Crypto Vision News</title>
  <entry>
    <title>Bitcoin Hits New High</title>
    <link href="https://..." />
    <updated>2026-03-01T12:00:00Z</updated>
  </entry>
</feed>`,
      },
      {
        method: "GET",
        path: "/api/opml",
        description: "Get OPML file listing all aggregated crypto news sources.",
        params: [],
        response: `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Crypto News Sources</title></head>
  <body>
    <outline text="CoinDesk" xmlUrl="https://..." />
    <outline text="CoinTelegraph" xmlUrl="https://..." />
  </body>
</opml>`,
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   SDK DATA — with full usage examples
   ═══════════════════════════════════════════════════════════════ */

interface SDK {
  name: string;
  language: string;
  install: string;
  installLang: string;
  repo: string;
  description: string;
  icon: string;
  usageCode: string;
  usageLang: string;
  features: string[];
}

const sdks: SDK[] = [
  {
    name: "Python SDK",
    language: "Python",
    install: "pip install free-crypto-news",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/python",
    description: "Full-featured Python client with async support, type hints, and automatic pagination.",
    icon: "🐍",
    features: ["Async/await support", "Type hints (mypy)", "Auto-pagination", "Retry with backoff"],
    usageLang: "python",
    usageCode: `from crypto_news import CryptoNews

client = CryptoNews()

# Get latest news
news = client.get_news(limit=10, category="bitcoin")
for article in news.articles:
    print(f"{article.title} — {article.source}")

# Get market prices
prices = client.get_prices(coins=["bitcoin", "ethereum"])
for coin in prices:
    print(f"{coin.symbol}: $" + f"{coin.price:,.2f}" + f" ({coin.change_24h:+.1f}%)")

# Async support
import asyncio
async def main():
    async with CryptoNews() as client:
        breaking = await client.get_breaking(limit=5)
        print(f"Breaking: {len(breaking.articles)} articles")

asyncio.run(main())`,
  },
  {
    name: "TypeScript SDK",
    language: "TypeScript",
    install: "npm install @cryptocurrency.cv/sdk",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/typescript",
    description: "Type-safe TypeScript/JavaScript client for Node.js and browsers.",
    icon: "📘",
    features: ["Full TypeScript types", "Tree-shakeable", "Browser & Node.js", "ESM & CJS"],
    usageLang: "typescript",
    usageCode: `import { CryptoNews } from "@cryptocurrency.cv/sdk";

const client = new CryptoNews();

// Get latest news with full type safety
const { articles, totalCount } = await client.news.list({
  limit: 10,
  category: "defi",
});

articles.forEach(article => {
  console.log(\`\${article.title} — \${article.source}\`);
});

// Market data
const prices = await client.prices.list({ coins: "bitcoin,ethereum" });
const fng = await client.fearGreed.get();
console.log(\`Fear & Greed: \${fng.value} (\${fng.label})\`);

// Streaming with WebSocket (Premium)
client.ws.subscribe("prices", (data) => {
  console.log("Price update:", data);
});`,
  },
  {
    name: "Go SDK",
    language: "Go",
    install: "go get github.com/nirholas/free-crypto-news/sdk/go",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/go",
    description: "Idiomatic Go client with context support and error handling.",
    icon: "🔵",
    features: ["Context support", "Struct responses", "Connection pooling", "Custom HTTP client"],
    usageLang: "go",
    usageCode: `package main

import (
    "context"
    "fmt"
    "log"

    cryptonews "github.com/nirholas/free-crypto-news/sdk/go"
)

func main() {
    client := cryptonews.NewClient()
    ctx := context.Background()

    // Get news
    news, err := client.News.List(ctx, &cryptonews.NewsParams{
        Limit:    10,
        Category: "bitcoin",
    })
    if err != nil {
        log.Fatal(err)
    }

    for _, article := range news.Articles {
        fmt.Printf("%s — %s\\n", article.Title, article.Source)
    }

    // Get prices
    prices, _ := client.Prices.List(ctx, nil)
    for _, p := range prices.Prices {
        fmt.Printf("%s: $%.2f (%+.1f%%)\\n", p.Symbol, p.Price, p.Change24h)
    }
}`,
  },
  {
    name: "React SDK",
    language: "React",
    install: "npm install @cryptocurrency.cv/react",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/react",
    description: "React hooks and components for embedding crypto news in your app.",
    icon: "⚛️",
    features: ["React hooks", "SSR ready", "Auto-refresh", "Suspense support"],
    usageLang: "tsx",
    usageCode: `import { useCryptoNews, usePrices, CryptoNewsProvider } from "@cryptocurrency.cv/react";

// Wrap your app
function App() {
  return (
    <CryptoNewsProvider>
      <NewsFeed />
      <PriceTicker />
    </CryptoNewsProvider>
  );
}

function NewsFeed() {
  const { articles, loading, error, refetch } = useCryptoNews({
    limit: 10,
    category: "bitcoin",
    refreshInterval: 60_000, // auto-refresh every 60s
  });

  if (loading) return <div>Loading...</div>;
  return (
    <ul>
      {articles.map(a => (
        <li key={a.link}>{a.title} — {a.source}</li>
      ))}
    </ul>
  );
}

function PriceTicker() {
  const { prices } = usePrices({ coins: ["bitcoin", "ethereum", "solana"] });
  return <div>{prices.map(p => <span key={p.id}>{p.symbol}: \${p.price}</span>)}</div>;
}`,
  },
  {
    name: "PHP SDK",
    language: "PHP",
    install: "composer require nirholas/free-crypto-news",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/php",
    description: "PHP client compatible with Laravel, Symfony, and vanilla PHP.",
    icon: "🐘",
    features: ["Laravel facade", "PSR-18 compatible", "Guzzle built-in", "Caching support"],
    usageLang: "php",
    usageCode: `<?php
use CryptoNews\\Client;

$client = new Client();

// Get latest news
$news = $client->news()->list(['limit' => 10, 'category' => 'defi']);
foreach ($news['articles'] as $article) {
    echo $article['title'] . ' — ' . $article['source'] . "\\n";
}

// Laravel facade
use CryptoNews\\Facades\\CryptoNews;

$prices = CryptoNews::prices(['coins' => 'bitcoin,ethereum']);
$fearGreed = CryptoNews::fearGreed();

// With caching (60 second TTL)
$trending = CryptoNews::cached(60)->trending(['limit' => 10]);`,
  },
];

/* ═══════════════════════════════════════════════════════════════
   INTEGRATIONS
   ═══════════════════════════════════════════════════════════════ */

interface Integration {
  name: string;
  description: string;
  link: string;
  icon: string;
  badge?: string;
  setupCode?: string;
  setupLang?: string;
}

const integrations: Integration[] = [
  {
    name: "ChatGPT Plugin",
    description: "Use Crypto Vision News directly within ChatGPT. Ask about latest crypto news, prices, and trends.",
    link: "https://github.com/nirholas/free-crypto-news/tree/main/chatgpt",
    icon: "🤖",
    badge: "OpenAI",
  },
  {
    name: "Claude MCP Server",
    description: "Connect Claude to live crypto data via the Model Context Protocol (MCP) server.",
    link: "https://github.com/nirholas/free-crypto-news/tree/main/mcp",
    icon: "🧠",
    badge: "Anthropic",
    setupCode: `// Add to your Claude Desktop config (claude_desktop_config.json):
{
  "mcpServers": {
    "crypto-news": {
      "command": "npx",
      "args": ["-y", "@cryptocurrency.cv/mcp-server"]
    }
  }
}`,
    setupLang: "json",
  },
  {
    name: "Discord Bot",
    description: "Add real-time crypto news alerts and price commands to your Discord server.",
    link: "https://github.com/nirholas/free-crypto-news",
    icon: "💜",
    badge: "Bot",
  },
  {
    name: "Telegram Bot",
    description: "Get instant crypto news notifications and market updates in Telegram.",
    link: "https://github.com/nirholas/free-crypto-news",
    icon: "✈️",
    badge: "Bot",
  },
  {
    name: "Raycast Extension",
    description: "Search crypto news instantly from Raycast. Quick look at prices and trending topics.",
    link: "https://github.com/nirholas/free-crypto-news/tree/main/raycast",
    icon: "🔍",
    badge: "macOS",
  },
  {
    name: "Alfred Workflow",
    description: "Access crypto news directly from Alfred on macOS with keyword shortcuts.",
    link: "https://github.com/nirholas/free-crypto-news/tree/main/alfred",
    icon: "🎩",
    badge: "macOS",
  },
];

/* ═══════════════════════════════════════════════════════════════
   ERROR CODES
   ═══════════════════════════════════════════════════════════════ */

const errorCodes = [
  { code: 200, text: "OK", description: "Request succeeded. Response body contains the requested data.", type: "success" as const },
  { code: 304, text: "Not Modified", description: "Data hasn't changed since last request (when using If-None-Match header).", type: "info" as const },
  { code: 400, text: "Bad Request", description: "Invalid parameters. Check the error message for details.", type: "warning" as const },
  { code: 404, text: "Not Found", description: "The requested endpoint or resource does not exist.", type: "warning" as const },
  { code: 429, text: "Too Many Requests", description: "Rate limit exceeded. Wait before making more requests (free: 100 req/min).", type: "warning" as const },
  { code: 500, text: "Internal Error", description: "Server error. Try again or check https://cryptocurrency.cv/status.", type: "error" as const },
  { code: 502, text: "Bad Gateway", description: "Upstream data source temporarily unavailable. Retry in a few seconds.", type: "error" as const },
  { code: 503, text: "Service Unavailable", description: "Server is under maintenance. Check /status for updates.", type: "error" as const },
];

/* ═══════════════════════════════════════════════════════════════
   CHANGELOG
   ═══════════════════════════════════════════════════════════════ */

const changelog = [
  { version: "v2.4", date: "Mar 2026", changes: ["Added /api/ohlc endpoint", "Improved search with fuzzy matching", "Added Ruby & Rust examples"] },
  { version: "v2.3", date: "Feb 2026", changes: ["Added /api/whale-alerts endpoint", "WebSocket streaming for premium users", "New /api/dex-volumes endpoint"] },
  { version: "v2.2", date: "Jan 2026", changes: ["Added /api/fear-greed endpoint", "New SDK: React hooks library", "Improved rate limit headers"] },
  { version: "v2.1", date: "Dec 2025", changes: ["Added /api/stablecoins endpoint", "New /api/on-chain analytics", "Go SDK v2 with generics"] },
  { version: "v2.0", date: "Nov 2025", changes: ["Major API redesign with consistent response format", "Added /api/sentiment and /api/social", "New PHP SDK", "Breaking: renamed /api/feed to /api/rss"] },
];

/* ═══════════════════════════════════════════════════════════════
   TOC SECTIONS
   ═══════════════════════════════════════════════════════════════ */

const tocSections = [
  { id: "quick-start", label: "Quick Start" },
  { id: "playground", label: "API Playground" },
  { id: "endpoints", label: "Endpoints" },
  { id: "news", label: "News", indent: true },
  { id: "markets", label: "Markets", indent: true },
  { id: "defi", label: "DeFi", indent: true },
  { id: "blockchain", label: "Blockchain", indent: true },
  { id: "social", label: "Social", indent: true },
  { id: "feeds", label: "Feeds", indent: true },
  { id: "sdks", label: "SDKs" },
  { id: "integrations", label: "Integrations" },
  { id: "errors", label: "Error Codes" },
  { id: "rate-limits", label: "Rate Limits & Auth" },
  { id: "changelog", label: "Changelog" },
];

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */

/** Scroll-spy: tracks which section is currently visible */
function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Pick the one closest to top
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/** API Playground — interactive endpoint tester */
function ApiPlayground() {
  const [endpoint, setEndpoint] = useState("/api/news");
  const [params, setParams] = useState<Record<string, string>>({ limit: "5" });
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const allEndpoints = useMemo(() => {
    const eps: string[] = [];
    endpointCategories.forEach((cat) =>
      cat.endpoints.forEach((ep) => {
        const basePath = ep.path.split("?")[0];
        if (!eps.includes(basePath)) eps.push(basePath);
      })
    );
    return eps;
  }, []);

  const currentEndpoint = useMemo(() => {
    for (const cat of endpointCategories) {
      for (const ep of cat.endpoints) {
        if (ep.path.split("?")[0] === endpoint) return ep;
      }
    }
    return null;
  }, [endpoint]);

  const buildUrl = useCallback(() => {
    const base = `https://cryptocurrency.cv${endpoint}`;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v.trim()) searchParams.set(k, v.trim());
    });
    const qs = searchParams.toString();
    return qs ? `${base}?${qs}` : base;
  }, [endpoint, params]);

  const executeRequest = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    setStatus(null);
    const start = performance.now();
    try {
      const res = await fetch(buildUrl());
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setStatus(res.status);
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const json = await res.json();
        setResponse(JSON.stringify(json, null, 2));
      } else {
        const text = await res.text();
        setResponse(text);
      }
    } catch (err) {
      setResponseTime(Math.round(performance.now() - start));
      setStatus(0);
      setResponse(`Error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setLoading(false);
    }
  }, [buildUrl]);

  const updateParam = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const addParam = () => {
    const key = `param${Object.keys(params).length + 1}`;
    setParams((prev) => ({ ...prev, [key]: "" }));
  };

  const removeParam = (key: string) => {
    setParams((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
      {/* Playground header */}
      <div className="bg-[var(--color-surface-secondary)] px-5 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
        <span className="text-lg" aria-hidden>⚡</span>
        <span className="font-serif font-bold text-[var(--color-text-primary)]">
          API Playground
        </span>
        <Badge>Interactive</Badge>
      </div>

      <div className="p-5 space-y-4">
        {/* Endpoint selector */}
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)] block mb-1">
              Endpoint
            </label>
            <select
              value={endpoint}
              onChange={(e) => {
                setEndpoint(e.target.value);
                setParams({ limit: "5" });
                setResponse(null);
              }}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              {allEndpoints.map((ep) => (
                <option key={ep} value={ep}>{ep}</option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={executeRequest}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Request"
            )}
          </Button>
        </div>

        {/* Built URL preview */}
        <div className="rounded-md bg-[var(--color-surface-tertiary)] px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)] overflow-x-auto">
          <span className="text-green-600 font-semibold">GET</span>{" "}
          {buildUrl()}
        </div>

        {/* Parameters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-[var(--color-text-tertiary)]">
              Query Parameters
            </label>
            <button
              onClick={addParam}
              className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
            >
              + Add Parameter
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newParams = { ...params };
                    delete newParams[key];
                    newParams[e.target.value] = value;
                    setParams(newParams);
                  }}
                  className="w-32 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  placeholder="key"
                />
                <span className="text-[var(--color-text-tertiary)]">=</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateParam(key, e.target.value)}
                  className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  placeholder="value"
                />
                <button
                  onClick={() => removeParam(key)}
                  className="text-[var(--color-text-tertiary)] hover:text-red-500 cursor-pointer p-1"
                  aria-label="Remove parameter"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {/* Suggested params */}
          {currentEndpoint && currentEndpoint.params.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-[10px] text-[var(--color-text-tertiary)]">Suggested:</span>
              {currentEndpoint.params.map((p) => (
                <button
                  key={p.name}
                  onClick={() => updateParam(p.name, p.default || "")}
                  className={cn(
                    "text-[10px] rounded px-1.5 py-0.5 cursor-pointer transition-colors",
                    params[p.name] !== undefined
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  )}
                >
                  {p.name}{p.required ? "*" : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Response */}
        {(response || loading) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--color-text-tertiary)]">
                Response
              </label>
              {status !== null && (
                <div className="flex items-center gap-3 text-xs">
                  <span className={cn(
                    "font-mono font-semibold",
                    status >= 200 && status < 300 ? "text-green-500" : status >= 400 ? "text-red-500" : "text-yellow-500"
                  )}>
                    {status === 0 ? "ERR" : status}
                  </span>
                  {responseTime !== null && (
                    <span className="text-[var(--color-text-tertiary)]">
                      {responseTime}ms
                    </span>
                  )}
                </div>
              )}
            </div>
            {loading ? (
              <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-8 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : response ? (
              <CodeBlock
                code={response}
                language={response.trim().startsWith("<") ? "xml" : response.trim().startsWith("{") || response.trim().startsWith("[") ? "json" : "bash"}
                maxHeight={400}
                showLineNumbers
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

/** Endpoint Search Modal */
function EndpointSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return endpointCategories.flatMap((cat) =>
        cat.endpoints.map((ep) => ({ ...ep, category: cat.title, categoryIcon: cat.icon }))
      );
    }
    const q = query.toLowerCase();
    return endpointCategories.flatMap((cat) =>
      cat.endpoints
        .filter(
          (ep) =>
            ep.path.toLowerCase().includes(q) ||
            ep.description.toLowerCase().includes(q) ||
            cat.title.toLowerCase().includes(q)
        )
        .map((ep) => ({ ...ep, category: cat.title, categoryIcon: cat.icon }))
    );
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl mx-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search endpoints... (e.g., /api/news, trending, gas)"
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-tertiary)]">
            ESC
          </kbd>
        </div>
        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">
              No endpoints match &quot;{query}&quot;
            </p>
          ) : (
            results.slice(0, 15).map((ep) => (
              <a
                key={ep.path}
                href={`#${ep.path.split("/")[2]?.split("?")[0] || "endpoints"}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-secondary)] transition-colors group"
              >
                <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                  {ep.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-[var(--color-text-primary)] truncate">
                    {ep.path}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                    {ep.description}
                  </p>
                </div>
                <span className="text-[10px] text-[var(--color-text-tertiary)] shrink-0">
                  {ep.categoryIcon} {ep.category}
                </span>
              </a>
            ))
          )}
        </div>
        {/* Footer */}
        <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
          <span>{results.length} endpoint{results.length === 1 ? "" : "s"}</span>
          <span>↵ to navigate · ESC to close</span>
        </div>
      </div>
    </div>
  );
}

/** API Status Indicator */
function ApiStatusBadge() {
  const [status, setStatus] = useState<"loading" | "online" | "degraded" | "offline">("loading");

  useEffect(() => {
    const check = async () => {
      try {
        const start = performance.now();
        const res = await fetch("https://cryptocurrency.cv/api/news?limit=1", { cache: "no-store" });
        const elapsed = performance.now() - start;
        if (res.ok && elapsed < 5000) setStatus("online");
        else if (res.ok) setStatus("degraded");
        else setStatus("offline");
      } catch {
        setStatus("offline");
      }
    };
    check();
  }, []);

  const colors = {
    loading: "bg-gray-400 dark:bg-gray-500",
    online: "bg-green-500",
    degraded: "bg-yellow-500",
    offline: "bg-red-500",
  };

  const labels = {
    loading: "Checking...",
    online: "All systems operational",
    degraded: "Slow response times",
    offline: "Service disruption",
  };

  return (
    <a
      href="/status"
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
    >
      <span className={cn("h-2 w-2 rounded-full", colors[status], status === "online" && "animate-pulse")} />
      {labels[status]}
    </a>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DevelopersContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["news"])
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSdk, setExpandedSdk] = useState<string | null>(null);

  const sectionIds = useMemo(() => tocSections.map((s) => s.id), []);
  const activeSection = useScrollSpy(sectionIds);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(endpointCategories.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <>
      {/* Endpoint Search Modal */}
      {searchOpen && <EndpointSearch onClose={() => setSearchOpen(false)} />}

      <main className="container-main py-10">
        <div className="flex gap-10">
          {/* ═══ Sidebar TOC (desktop) ═══ */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-0.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                On this page
              </p>
              {tocSections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm transition-all",
                    s.indent ? "pl-6" : "font-medium",
                    activeSection === s.id
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-l-2 border-[var(--color-accent)]"
                      : s.indent
                        ? "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                  )}
                >
                  {s.label}
                </a>
              ))}

              {/* TOC Actions */}
              <div className="pt-4 mt-4 border-t border-[var(--color-border)] space-y-2">
                <ApiStatusBadge />
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  Search endpoints
                  <kbd className="ml-auto rounded border border-[var(--color-border)] px-1 py-0.5 text-[10px] font-mono">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </nav>
          </aside>

          {/* ═══ Main content ═══ */}
          <div className="min-w-0 flex-1">
            {/* ── Hero ── */}
            <section className="mb-16">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge className="mb-0">No API Key Required</Badge>
                <ApiStatusBadge />
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-[var(--color-text-primary)]">
                Crypto Vision News API
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] mb-6 max-w-2xl">
                Access real-time cryptocurrency news, market data, DeFi analytics,
                on-chain metrics, and social sentiment — all from a single, free REST API.
                No API keys, no authentication, no rate limits to get started.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" asChild>
                  <a href="#quick-start">Get Started</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#playground">Try It Live</a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://github.com/nirholas/free-crypto-news"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-text-tertiary)]">
                <span>
                  Base URL:{" "}
                  <code className="rounded bg-[var(--color-surface-tertiary)] px-2 py-0.5 font-mono text-[var(--color-text-primary)]">
                    https://cryptocurrency.cv/api
                  </code>
                </span>
                <span>Format: JSON / XML</span>
                <span>Auth: None required</span>
              </div>
              {/* Mobile search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="mt-4 lg:hidden flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2 text-sm text-[var(--color-text-tertiary)] cursor-pointer w-full max-w-xs"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                Search all endpoints...
                <kbd className="ml-auto rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-mono">
                  ⌘K
                </kbd>
              </button>
            </section>

            {/* ── Quick Start ── */}
            <section id="quick-start" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6 text-[var(--color-text-primary)]">
                Quick Start
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Fetch your first crypto news in seconds. Choose your language:
              </p>

              {/* Language Tabs */}
              <div className="flex flex-wrap gap-1 mb-4 rounded-lg bg-[var(--color-surface-secondary)] p-1 w-fit">
                {quickStartExamples.map((ex, i) => (
                  <button
                    key={ex.label}
                    onClick={() => setActiveTab(i)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                      activeTab === i
                        ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    )}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>

              <CodeBlock
                code={quickStartExamples[activeTab].code}
                language={quickStartExamples[activeTab].language}
              />
            </section>

            {/* ── API Playground ── */}
            <section id="playground" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
                API Playground
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Try any endpoint directly from your browser — no tools needed.
              </p>
              <ApiPlayground />
            </section>

            {/* ── Endpoints Reference ── */}
            <section id="endpoints" className="mb-16 scroll-mt-20">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  Endpoints Reference
                </h2>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={expandAll}
                    className="text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    Expand all
                  </button>
                  <span className="text-[var(--color-text-tertiary)]">·</span>
                  <button
                    onClick={collapseAll}
                    className="text-[var(--color-accent)] hover:underline cursor-pointer"
                  >
                    Collapse all
                  </button>
                </div>
              </div>
              <p className="text-[var(--color-text-secondary)] mb-8">
                All endpoints accept GET requests and return JSON (except feed endpoints which return XML).
                Total: {endpointCategories.reduce((sum, c) => sum + c.endpoints.length, 0)} endpoints across {endpointCategories.length} categories.
              </p>

              <div className="space-y-6">
                {endpointCategories.map((cat) => {
                  const isExpanded = expandedCategories.has(cat.id);
                  return (
                    <div
                      key={cat.id}
                      id={cat.id}
                      className="scroll-mt-20 rounded-lg border border-[var(--color-border)] overflow-hidden"
                    >
                      {/* Category header */}
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="w-full flex items-center gap-3 bg-[var(--color-surface-secondary)] px-5 py-4 text-left cursor-pointer hover:bg-[var(--color-surface-tertiary)] transition-colors"
                      >
                        <span className="text-xl" aria-hidden>
                          {cat.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="font-serif text-lg font-bold text-[var(--color-text-primary)]">
                            {cat.title}
                          </span>
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
                            {cat.description}
                          </p>
                        </div>
                        <Badge>{cat.endpoints.length}</Badge>
                        <svg
                          className={cn(
                            "w-5 h-5 text-[var(--color-text-tertiary)] transition-transform shrink-0",
                            isExpanded && "rotate-180"
                          )}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Endpoints */}
                      {isExpanded && (
                        <div className="divide-y divide-[var(--color-border)]">
                          {cat.endpoints.map((ep) => (
                            <EndpointCard key={ep.path} endpoint={ep} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── SDKs ── */}
            <section id="sdks" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
                SDKs &amp; Client Libraries
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-8">
                Official SDK packages to integrate crypto news into your project in minutes.
                Click any SDK to see full usage examples.
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sdks.map((sdk) => {
                  const isOpen = expandedSdk === sdk.name;
                  return (
                    <Card
                      key={sdk.name}
                      className={cn(
                        "flex flex-col transition-all",
                        isOpen && "sm:col-span-2 lg:col-span-3"
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl" aria-hidden>
                            {sdk.icon}
                          </span>
                          <div className="flex-1">
                            <CardTitle>{sdk.name}</CardTitle>
                            <CardDescription>{sdk.language}</CardDescription>
                          </div>
                          <button
                            onClick={() => setExpandedSdk(isOpen ? null : sdk.name)}
                            className="text-xs text-[var(--color-accent)] hover:underline cursor-pointer"
                          >
                            {isOpen ? "Hide" : "Examples"}
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-4">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {sdk.description}
                        </p>
                        {/* Features */}
                        <div className="flex flex-wrap gap-1.5">
                          {sdk.features.map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-[var(--color-surface-tertiary)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                        <CodeBlock code={sdk.install} language={sdk.installLang} />
                        {/* Usage example */}
                        {isOpen && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2 mt-4">
                              Usage Example
                            </h4>
                            <CodeBlock
                              code={sdk.usageCode}
                              language={sdk.usageLang}
                              showLineNumbers
                            />
                          </div>
                        )}
                      </CardContent>
                      <div className="p-5 pt-0">
                        <Button variant="outline" size="sm" asChild className="w-full">
                          <a
                            href={sdk.repo}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on GitHub →
                          </a>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* ── Integrations ── */}
            <section id="integrations" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
                Integrations
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-8">
                Use Crypto Vision News with your favorite tools and platforms.
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integ) => (
                  <Card key={integ.name}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden>
                          {integ.icon}
                        </span>
                        <div className="flex-1">
                          <CardTitle>{integ.name}</CardTitle>
                        </div>
                        {integ.badge && (
                          <Badge>{integ.badge}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {integ.description}
                      </p>
                      {integ.setupCode && (
                        <CodeBlock
                          code={integ.setupCode}
                          language={integ.setupLang || "json"}
                          collapsible
                        />
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={integ.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Learn More →
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Error Codes ── */}
            <section id="errors" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
                HTTP Status Codes
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                All error responses include a JSON body with an <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">error</code> field.
              </p>

              <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                        <th className="text-left py-3 px-4 font-medium text-[var(--color-text-tertiary)]">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-[var(--color-text-tertiary)]">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-[var(--color-text-tertiary)]">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorCodes.map((ec) => (
                        <tr key={ec.code} className="border-b border-[var(--color-border)] last:border-b-0">
                          <td className="py-2.5 px-4">
                            <span className={cn(
                              "font-mono text-xs font-bold px-2 py-0.5 rounded",
                              ec.type === "success" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              ec.type === "info" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                              ec.type === "warning" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                              ec.type === "error" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                            )}>
                              {ec.code}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[var(--color-text-primary)]">
                            {ec.text}
                          </td>
                          <td className="py-2.5 px-4 text-[var(--color-text-secondary)]">
                            {ec.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error response example */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                  Error Response Example
                </h4>
                <CodeBlock
                  code={`{
  "error": "Invalid parameter: limit must be between 1 and 100",
  "code": 400,
  "timestamp": "2026-03-01T12:05:00Z"
}`}
                  language="json"
                />
              </div>
            </section>

            {/* ── Rate Limits & Authentication ── */}
            <section id="rate-limits" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
                Rate Limits &amp; Authentication
              </h2>

              <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Free Tier */}
                  <div>
                    <h3 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)] flex items-center gap-2">
                      <span className="text-green-500">✓</span> Free Tier — No API Key Required
                    </h3>
                    <p className="text-[var(--color-text-secondary)] mb-4">
                      The API is completely free to use. No registration,
                      no API keys, no authentication required. Just make HTTP requests
                      and get data back.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="text-left py-2 pr-6 font-medium text-[var(--color-text-tertiary)]">Feature</th>
                            <th className="text-left py-2 pr-6 font-medium text-[var(--color-text-tertiary)]">Free</th>
                            <th className="text-left py-2 font-medium text-[var(--color-text-tertiary)]">Premium</th>
                          </tr>
                        </thead>
                        <tbody className="text-[var(--color-text-secondary)]">
                          {[
                            ["API Key Required", "No", "Optional"],
                            ["Rate Limit", "100 req/min", "Unlimited"],
                            ["News Endpoints", "✓", "✓"],
                            ["Market Data", "✓", "✓"],
                            ["DeFi & On-Chain", "✓", "✓"],
                            ["Historical Data", "30 days", "Full archive"],
                            ["WebSocket Streaming", "—", "✓"],
                            ["Priority Support", "—", "✓"],
                            ["Custom Webhooks", "—", "✓"],
                          ].map(([feature, free, premium], i) => (
                            <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                              <td className="py-2 pr-6">{feature}</td>
                              <td className={cn("py-2 pr-6", free === "✓" || free === "No" ? "text-green-500" : free === "—" ? "text-[var(--color-text-tertiary)]" : "")}>{free}</td>
                              <td className={cn("py-2", premium === "✓" ? "text-green-500" : "")}>{premium}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Rate limit headers */}
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <h3 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
                      Rate Limit Headers
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                      Every response includes rate limit information via headers:
                    </p>
                    <CodeBlock
                      code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1709297160
Retry-After: 45`}
                      language="bash"
                    />
                  </div>

                  {/* CORS */}
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <h3 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
                      CORS Support
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      All API endpoints support CORS. The{" "}
                      <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">
                        Access-Control-Allow-Origin
                      </code>{" "}
                      header is set to <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">*</code>,
                      so you can make requests directly from browser-based applications.
                    </p>
                  </div>

                  {/* Response Format */}
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <h3 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
                      Response Format
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      All endpoints return JSON by default (<code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">Content-Type: application/json</code>),
                      except feed endpoints (/api/rss, /api/atom, /api/opml) which return XML.
                      Every response includes a <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">fetchedAt</code> ISO timestamp.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Changelog ── */}
            <section id="changelog" className="mb-16 scroll-mt-20">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
                API Changelog
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Recent API updates and new features.
              </p>

              <div className="space-y-0">
                {changelog.map((entry, i) => (
                  <div key={entry.version} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 shrink-0",
                        i === 0
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)]"
                      )} />
                      {i < changelog.length - 1 && (
                        <div className="w-px flex-1 bg-[var(--color-border)]" />
                      )}
                    </div>
                    <div className="pb-8 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm text-[var(--color-text-primary)]">
                          {entry.version}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {entry.date}
                        </span>
                        {i === 0 && <Badge>Latest</Badge>}
                      </div>
                      <ul className="space-y-1">
                        {entry.changes.map((change, j) => (
                          <li key={j} className="text-sm text-[var(--color-text-secondary)] flex gap-2">
                            <span className="text-[var(--color-text-tertiary)] shrink-0">•</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </main>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENDPOINT CARD — extracted for clarity
   ═══════════════════════════════════════════════════════════════ */

function EndpointCard({ endpoint: ep }: { endpoint: Endpoint }) {
  const [showUrlBuilder, setShowUrlBuilder] = useState(false);
  const [builderParams, setBuilderParams] = useState<Record<string, string>>({});

  const builtUrl = useMemo(() => {
    const base = `https://cryptocurrency.cv${ep.path.split("?")[0]}`;
    const searchParams = new URLSearchParams();
    Object.entries(builderParams).forEach(([k, v]) => {
      if (v.trim()) searchParams.set(k, v.trim());
    });
    const qs = searchParams.toString();
    return qs ? `${base}?${qs}` : base;
  }, [ep.path, builderParams]);

  const copyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
    } catch {
      /* fallback not needed for URL copy */
    }
  }, [builtUrl]);

  return (
    <div className="p-5 space-y-4">
      {/* Method + Path */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white uppercase">
          {ep.method}
        </span>
        <code className="font-mono text-sm text-[var(--color-text-primary)]">
          {ep.path}
        </code>
        {ep.status === "beta" && <Badge>Beta</Badge>}
        {ep.status === "deprecated" && (
          <span className="rounded bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400 uppercase">
            Deprecated
          </span>
        )}
        {/* URL Builder toggle */}
        {ep.params.length > 0 && (
          <button
            onClick={() => setShowUrlBuilder(!showUrlBuilder)}
            className="ml-auto text-xs text-[var(--color-accent)] hover:underline cursor-pointer flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {showUrlBuilder ? "Hide" : "Build URL"}
          </button>
        )}
      </div>
      <p className="text-[var(--color-text-secondary)] text-sm">
        {ep.description}
      </p>

      {/* URL Builder */}
      {showUrlBuilder && (
        <div className="rounded-lg bg-[var(--color-surface-secondary)] p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
            URL Builder
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ep.params.map((p) => (
              <div key={p.name}>
                <label className="text-xs text-[var(--color-text-tertiary)] mb-0.5 block">
                  {p.name}
                  {p.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={p.default || p.type}
                  value={builderParams[p.name] || ""}
                  onChange={(e) =>
                    setBuilderParams((prev) => ({
                      ...prev,
                      [p.name]: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-mono text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-[var(--color-surface-tertiary)] px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)] overflow-x-auto">
              {builtUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copyUrl}>
              Copy
            </Button>
          </div>
        </div>
      )}

      {/* Parameters table */}
      {ep.params.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
            Parameters
          </h4>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
                  <th className="text-left py-2 px-3 font-medium text-[var(--color-text-tertiary)]">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-[var(--color-text-tertiary)]">Type</th>
                  <th className="text-left py-2 px-3 font-medium text-[var(--color-text-tertiary)]">Required</th>
                  <th className="text-left py-2 px-3 font-medium text-[var(--color-text-tertiary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                {ep.params.map((p) => (
                  <tr
                    key={p.name}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="py-2 px-3">
                      <code className="font-mono text-xs bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)]">
                        {p.name}
                      </code>
                    </td>
                    <td className="py-2 px-3 text-[var(--color-text-tertiary)] font-mono text-xs">
                      {p.type}
                    </td>
                    <td className="py-2 px-3">
                      {p.required ? (
                        <span className="text-red-500 text-xs font-medium">required</span>
                      ) : (
                        <span className="text-[var(--color-text-tertiary)] text-xs">optional</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">
                      {p.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Example Response */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
          Example Response
        </h4>
        <CodeBlock
          code={ep.response}
          language={ep.response.trim().startsWith("<") ? "xml" : "json"}
          collapsible={ep.response.split("\n").length > 12}
          maxHeight={300}
        />
      </div>
    </div>
  );
}
