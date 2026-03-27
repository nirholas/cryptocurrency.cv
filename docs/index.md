---
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# 📰 Free Crypto News

<p class="tagline">100% Free Crypto News API — No API keys, no rate limits, no BS</p>

<span class="status free">✓ Always Free</span>
<span class="status beta">200+ Sources</span>

[Get Started :material-rocket-launch:](QUICKSTART.md){ .md-button .md-button--primary }
[API Reference :material-api:](API.md){ .md-button }

</div>

---

## :busts_in_silhouette: Who Is This For?

<div class="grid" markdown>

<div class="card" markdown>

### :man_technologist: Developers

Build bots, dashboards, and apps with our REST API and SDKs. No API key required — just `fetch()` and go.

[:material-arrow-right: Quick Start](QUICKSTART.md)

</div>

<div class="card" markdown>

### :chart_with_upwards_trend: Traders

Get real-time sentiment analysis, trading signals, whale alerts, and fear & greed index alongside breaking news.

[:material-arrow-right: Market Data](tutorials/market-data.md)

</div>

<div class="card" markdown>

### :microscope: Researchers

Analyze media narratives, credibility scores, coverage patterns, and historical archives with AI-powered analytics.

[:material-arrow-right: AI Features](AI-FEATURES.md)

</div>

<div class="card" markdown>

### :robot: AI / LLM Builders

Feed crypto news into ChatGPT, Claude, LangChain, or custom agents via MCP, plugins, or plain REST.

[:material-arrow-right: Integrations](integrations/index.md)

</div>

</div>

---

## :zap: Features

<div class="grid" markdown>

<div class="card" markdown>

### :newspaper: Real-Time News

Aggregated news from 200+ professional sources including CoinDesk, The Block, Decrypt, Cointelegraph, Bitcoin Magazine, CryptoSlate, and NewsBTC — updated every 5 minutes.

</div>

<div class="card" markdown>

### :robot: AI-Powered

Sentiment analysis, automatic summaries, daily digests, fact-checking, narrative tracking, and credibility scoring — powered by Groq LLM.

</div>

<div class="card" markdown>

### :electric_plug: Easy Integration

SDKs for Python, JavaScript, TypeScript, React, Go, PHP, Ruby, and Rust. Plus WebSocket, SSE, RSS, and Atom feeds.

</div>

<div class="card" markdown>

### :lock: No Auth Required

No API keys, no sign-up, no rate limits. Just make requests and get data. Start building in seconds.

</div>

</div>

---

## :rocket: Quick Start

=== "curl"

    ```bash
    # Get latest news
    curl https://cryptocurrency.cv/api/news
    
    # Get AI summary
    curl https://cryptocurrency.cv/api/digest
    ```

    **Response:**
    ```json
    {
      "articles": [
        {
          "title": "Bitcoin Surges Past $95K...",
          "source": "CoinDesk",
          "link": "https://...",
          "pubDate": "2026-03-01T14:30:00Z",
          "sentiment": "positive"
        }
      ],
      "count": 50
    }
    ```

=== "Python"

    ```python
    import requests
    
    news = requests.get("https://cryptocurrency.cv/api/news").json()
    
    for article in news["articles"][:5]:
        print(f"📰 {article['title']}")
        print(f"   Sentiment: {article.get('sentiment', 'N/A')}")
    ```

=== "JavaScript"

    ```javascript
    const response = await fetch('https://cryptocurrency.cv/api/news');
    const { articles } = await response.json();
    
    articles.slice(0, 5).forEach(article => {
      console.log(`📰 ${article.title} (${article.source})`);
    });
    ```

=== "React"

    ```jsx
    import { useCryptoNews } from '@free-crypto-news/react';
    
    function NewsFeed() {
      const { articles, loading, error } = useCryptoNews();
      
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error: {error.message}</p>;
      
      return articles.map(a => <Article key={a.id} {...a} />);
    }
    ```

---

## :bar_chart: API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Latest aggregated news |
| `GET /api/bitcoin` | Bitcoin-specific news |
| `GET /api/defi` | DeFi news and updates |
| `GET /api/breaking` | Breaking news only |
| `GET /api/trending` | Trending stories |
| `GET /api/digest` | AI-generated daily digest |
| `GET /api/sentiment` | Market sentiment analysis |
| `GET /api/search?q=` | Search news articles |

[:material-arrow-right: View Full API Reference](API.md)

---

## :package: SDKs & Integrations

<div class="grid" markdown>

<div class="card" markdown>
### :fontawesome-brands-python: Python
`pip install free-crypto-news`

[:material-arrow-right: Python SDK](sdks/python.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-js: JavaScript
`npm install free-crypto-news`

[:material-arrow-right: JavaScript SDK](sdks/javascript.md)
</div>

<div class="card" markdown>
### :simple-typescript: TypeScript
Full type definitions included

[:material-arrow-right: TypeScript SDK](sdks/typescript.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-react: React
Hooks & components

[:material-arrow-right: React SDK](sdks/react.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-golang: Go
`go get github.com/nirholas/free-crypto-news/sdk/go`

[:material-arrow-right: Go SDK](sdks/go.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-php: PHP
Composer package

[:material-arrow-right: PHP SDK](sdks/php.md)
</div>

<div class="card" markdown>
### :gem: Ruby
Gem package

[:material-arrow-right: Ruby SDK](sdks/ruby.md)
</div>

<div class="card" markdown>
### :crab: Rust
Cargo crate

[:material-arrow-right: Rust SDK](sdks/rust.md)
</div>

</div>

---

## :books: Tutorials

Learn by doing with step-by-step guides:

| Tutorial | What you'll learn |
|----------|-------------------|
| [News Basics](tutorials/news-basics.md) | Fetch, filter, and display crypto news |
| [AI Sentiment](tutorials/ai-sentiment.md) | Analyze article sentiment with AI |
| [Market Data](tutorials/market-data.md) | Get prices, charts, and market metrics |
| [Real-Time Streaming](tutorials/realtime-sse.md) | Set up live news via SSE/WebSocket |
| [Build a Discord Bot](examples/discord.md) | Post crypto news to Discord |
| [Build a Telegram Bot](examples/telegram.md) | Post crypto news to Telegram |

[:material-arrow-right: All Tutorials](tutorials/index.md)

---

## :speech_balloon: AI Integrations

Works with your favorite AI tools:

- **Claude** — via MCP Server
- **ChatGPT** — via Plugin/Actions  
- **LangChain** — as a custom tool
- **Any LLM** — via REST API

[:material-arrow-right: MCP Setup Guide](integrations/mcp.md)

---

## :bar_chart: Data API Integrations

Professional-grade market data from 10+ sources:

| Category | APIs |
|----------|------|
| **DeFi** | DefiLlama, The Graph, Aave, Uniswap, Curve |
| **On-Chain** | Glassnode, CryptoQuant |
| **Social** | LunarCrush |
| **Layer 2** | L2Beat |
| **NFT** | OpenSea, Reservoir |
| **News** | CryptoPanic, NewsAPI |
| **Research** | Messari, CoinMarketCap |

[:material-arrow-right: Data API Guide](integrations/data-apis.md)

---

## :floppy_disk: Database Layer

Unified storage abstraction supporting multiple backends:

- **Vercel KV** — Production Redis
- **Upstash** — Serverless Redis
- **File** — Local development
- **Memory** — Testing

[:material-arrow-right: Database Guide](DATABASE.md)

---

## :heart: Open Source

Free Crypto News is MIT licensed and open source. Contributions welcome!

[:fontawesome-brands-github: View on GitHub](https://github.com/nirholas/free-crypto-news){ .md-button }
