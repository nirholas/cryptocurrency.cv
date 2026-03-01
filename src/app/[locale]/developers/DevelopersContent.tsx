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

/* ─── SDKs ─── */

interface SDK {
  name: string;
  language: string;
  install: string;
  installLang: string;
  repo: string;
  description: string;
  icon: string;
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
  },
  {
    name: "TypeScript SDK",
    language: "TypeScript",
    install: "npm install @cryptocurrency.cv/sdk",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/typescript",
    description: "Type-safe TypeScript/JavaScript client for Node.js and browsers.",
    icon: "📘",
  },
  {
    name: "Go SDK",
    language: "Go",
    install: "go get github.com/nirholas/free-crypto-news/sdk/go",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/go",
    description: "Idiomatic Go client with context support and error handling.",
    icon: "🔵",
  },
  {
    name: "React SDK",
    language: "React",
    install: "npm install @cryptocurrency.cv/react",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/react",
    description: "React hooks and components for embedding crypto news in your app.",
    icon: "⚛️",
  },
  {
    name: "PHP SDK",
    language: "PHP",
    install: "composer require nirholas/free-crypto-news",
    installLang: "bash",
    repo: "https://github.com/nirholas/free-crypto-news/tree/main/sdk/php",
    description: "PHP client compatible with Laravel, Symfony, and vanilla PHP.",
    icon: "🐘",
  },
];

/* ─── Integrations ─── */

interface Integration {
  name: string;
  description: string;
  link: string;
  icon: string;
}

const integrations: Integration[] = [
  {
    name: "ChatGPT Plugin",
    description: "Use Crypto Vision News directly within ChatGPT. Ask about latest crypto news, prices, and trends.",
    link: "https://github.com/nirholas/free-crypto-news/tree/main/chatgpt",
    icon: "🤖",
  },
  {
    name: "Claude MCP Server",
    description: "Connect Claude to live crypto data via the Model Context Protocol (MCP) server.",
    link: "https://github.com/nirholas/free-crypto-news/tree/main/mcp",
    icon: "🧠",
  },
  {
    name: "Discord Bot",
    description: "Add real-time crypto news alerts and price commands to your Discord server.",
    link: "https://github.com/nirholas/free-crypto-news",
    icon: "💜",
  },
  {
    name: "Telegram Bot",
    description: "Get instant crypto news notifications and market updates in Telegram.",
    link: "https://github.com/nirholas/free-crypto-news",
    icon: "✈️",
  },
];

/* ─── TOC Section links ─── */

const tocSections = [
  { id: "quick-start", label: "Quick Start" },
  { id: "endpoints", label: "Endpoints" },
  { id: "news", label: "News", indent: true },
  { id: "markets", label: "Markets", indent: true },
  { id: "defi", label: "DeFi", indent: true },
  { id: "blockchain", label: "Blockchain", indent: true },
  { id: "social", label: "Social", indent: true },
  { id: "feeds", label: "Feeds", indent: true },
  { id: "sdks", label: "SDKs" },
  { id: "integrations", label: "Integrations" },
  { id: "rate-limits", label: "Rate Limits & Auth" },
];

/* ─── Component ─── */

export default function DevelopersContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["news"])
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="container-main py-10">
      <div className="flex gap-10">
        {/* ─── Sidebar TOC (desktop) ─── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
              On this page
            </p>
            {tocSections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]",
                  s.indent
                    ? "pl-6 text-[var(--color-text-tertiary)]"
                    : "font-medium text-[var(--color-text-secondary)]"
                )}
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* ─── Main content ─── */}
        <div className="min-w-0 flex-1">
          {/* ── Hero ── */}
          <section className="mb-16">
            <Badge className="mb-4">No API Key Required</Badge>
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
                <a
                  href="https://github.com/nirholas/free-crypto-news"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-[var(--color-text-tertiary)]">
              Base URL:{" "}
              <code className="rounded bg-[var(--color-surface-tertiary)] px-2 py-0.5 font-mono text-[var(--color-text-primary)]">
                https://cryptocurrency.cv/api
              </code>
            </p>
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

          {/* ── Endpoints Reference ── */}
          <section id="endpoints" className="mb-16 scroll-mt-20">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
              Endpoints Reference
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-8">
              All endpoints accept GET requests and return JSON (except feed endpoints which return XML).
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
                      <span className="font-serif text-lg font-bold text-[var(--color-text-primary)] flex-1">
                        {cat.title}
                      </span>
                      <Badge>{cat.endpoints.length} endpoints</Badge>
                      <svg
                        className={cn(
                          "w-5 h-5 text-[var(--color-text-tertiary)] transition-transform",
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
                          <div key={ep.path} className="p-5 space-y-4">
                            {/* Method + Path */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white uppercase">
                                {ep.method}
                              </span>
                              <code className="font-mono text-sm text-[var(--color-text-primary)]">
                                {ep.path}
                              </code>
                            </div>
                            <p className="text-[var(--color-text-secondary)] text-sm">
                              {ep.description}
                            </p>

                            {/* Parameters table */}
                            {ep.params.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-2">
                                  Parameters
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-[var(--color-border)]">
                                        <th className="text-left py-2 pr-4 font-medium text-[var(--color-text-tertiary)]">
                                          Name
                                        </th>
                                        <th className="text-left py-2 pr-4 font-medium text-[var(--color-text-tertiary)]">
                                          Type
                                        </th>
                                        <th className="text-left py-2 pr-4 font-medium text-[var(--color-text-tertiary)]">
                                          Required
                                        </th>
                                        <th className="text-left py-2 font-medium text-[var(--color-text-tertiary)]">
                                          Description
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ep.params.map((p) => (
                                        <tr
                                          key={p.name}
                                          className="border-b border-[var(--color-border)] last:border-b-0"
                                        >
                                          <td className="py-2 pr-4">
                                            <code className="font-mono text-xs bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-[var(--color-text-primary)]">
                                              {p.name}
                                            </code>
                                          </td>
                                          <td className="py-2 pr-4 text-[var(--color-text-tertiary)]">
                                            {p.type}
                                          </td>
                                          <td className="py-2 pr-4">
                                            {p.required ? (
                                              <span className="text-red-500 text-xs font-medium">
                                                required
                                              </span>
                                            ) : (
                                              <span className="text-[var(--color-text-tertiary)] text-xs">
                                                optional
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 text-[var(--color-text-secondary)]">
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
                                language={
                                  ep.response.trim().startsWith("<") ? "bash" : "json"
                                }
                              />
                            </div>
                          </div>
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
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sdks.map((sdk) => (
                <Card key={sdk.name} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden>
                        {sdk.icon}
                      </span>
                      <div>
                        <CardTitle>{sdk.name}</CardTitle>
                        <CardDescription>{sdk.language}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {sdk.description}
                    </p>
                    <CodeBlock code={sdk.install} language={sdk.installLang} />
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
              ))}
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

            <div className="grid gap-6 sm:grid-cols-2">
              {integrations.map((integ) => (
                <Card key={integ.name}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden>
                        {integ.icon}
                      </span>
                      <CardTitle>{integ.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      {integ.description}
                    </p>
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
                    The Crypto Vision News API is completely free to use. No registration,
                    no API keys, no authentication required. Just make HTTP requests
                    and get data back.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="text-left py-2 pr-6 font-medium text-[var(--color-text-tertiary)]">
                            Feature
                          </th>
                          <th className="text-left py-2 pr-6 font-medium text-[var(--color-text-tertiary)]">
                            Free
                          </th>
                          <th className="text-left py-2 font-medium text-[var(--color-text-tertiary)]">
                            Premium
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-[var(--color-text-secondary)]">
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">API Key Required</td>
                          <td className="py-2 pr-6 text-green-500">No</td>
                          <td className="py-2">Optional</td>
                        </tr>
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">Rate Limit</td>
                          <td className="py-2 pr-6">100 req/min</td>
                          <td className="py-2">Unlimited</td>
                        </tr>
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">News Endpoints</td>
                          <td className="py-2 pr-6 text-green-500">✓</td>
                          <td className="py-2 text-green-500">✓</td>
                        </tr>
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">Market Data</td>
                          <td className="py-2 pr-6 text-green-500">✓</td>
                          <td className="py-2 text-green-500">✓</td>
                        </tr>
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">DeFi &amp; On-Chain</td>
                          <td className="py-2 pr-6 text-green-500">✓</td>
                          <td className="py-2 text-green-500">✓</td>
                        </tr>
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">Historical Data</td>
                          <td className="py-2 pr-6">30 days</td>
                          <td className="py-2">Full archive</td>
                        </tr>
                        <tr className="border-b border-[var(--color-border)]">
                          <td className="py-2 pr-6">WebSocket Streaming</td>
                          <td className="py-2 pr-6 text-[var(--color-text-tertiary)]">—</td>
                          <td className="py-2 text-green-500">✓</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-6">Priority Support</td>
                          <td className="py-2 pr-6 text-[var(--color-text-tertiary)]">—</td>
                          <td className="py-2 text-green-500">✓</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CORS */}
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h3 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
                    CORS Support
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    All API endpoints support CORS, so you can make requests directly
                    from browser-based applications without any proxy. The{" "}
                    <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">
                      Access-Control-Allow-Origin
                    </code>{" "}
                    header is set to <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">*</code>.
                  </p>
                </div>

                {/* Response Format */}
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <h3 className="font-serif text-lg font-bold mb-2 text-[var(--color-text-primary)]">
                    Response Format
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    All endpoints return JSON by default (Content-Type: application/json),
                    except feed endpoints (/api/rss, /api/atom, /api/opml) which return XML.
                    Errors return a JSON object with an{" "}
                    <code className="font-mono bg-[var(--color-surface-tertiary)] px-1.5 py-0.5 rounded text-xs">
                      error
                    </code>{" "}
                    field and an appropriate HTTP status code.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
