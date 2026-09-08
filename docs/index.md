---
hide:
  - navigation
  - toc
---

<div class="hero" markdown>

# 📰 Free Crypto News

<p class="tagline">Free Crypto News API — no API key, no signup, just <code>curl</code></p>

<span class="status free">✓ Always Free</span>
<span class="status beta">358 Sources</span>

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

Aggregated news from 358 professional sources including CoinDesk, The Block, Decrypt, Cointelegraph, Bitcoin Magazine, CryptoSlate, and NewsBTC — updated every 5 minutes. The full catalog is public at `/api/sources`, and 146 long-form posts live at [/blog](https://cryptocurrency.cv/blog).

</div>

<div class="card" markdown>

### :robot: AI-Powered

Sentiment analysis, automatic summaries, daily digests, fact-checking, narrative tracking, and credibility scoring. Provider and model are configurable per deployment (Groq, OpenAI, Anthropic, OpenRouter, Gemini) with a fallback chain so a retired model never takes the feature down.

</div>

<div class="card" markdown>

### :electric_plug: Easy Integration

SDKs for Python, JavaScript, TypeScript, React, Go, PHP, Ruby, and Rust. Plus WebSocket, SSE, RSS, and Atom feeds.

</div>

<div class="card" markdown>

### :lock: No Auth Required

No API key, no sign-up, no browser `User-Agent` tricks. cURL, wget and AI agents are first-class callers. Anonymous requests get 120/hour per IP on the free-tier routes, and `/api/news` returns 3 articles per call until you [upgrade to a paid tier, or pay per request with x402](PREMIUM.md).

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
      "count": 3,
      "limited": true,
      "maxResults": 3
    }
    ```

    Anonymous requests to `/api/news` return **3 articles**, and the payload
    says so. `/feed.xml` and `/feed.json` are uncapped at 50 items.

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
    // Hooks ship in sdk/react of the repository (not on npm yet)
    import { useCryptoNews } from '@nirholas/react-crypto-news';
    
    function NewsFeed() {
      const { articles, loading, error } = useCryptoNews();
      
      if (loading) return <p>Loading...</p>;
      if (error) return <p>Error: {error.message}</p>;
      
      return articles.map(a => <Article key={a.id} {...a} />);
    }
    ```

---

## :bar_chart: API Endpoints

!!! info "Which API doc do I read?"
    - [API.md](API.md): the **public REST API reference** for `cryptocurrency.cv` (every endpoint we serve, auto-generated).
    - [API-INVENTORY.md](API-INVENTORY.md): gap analysis of the **third-party providers we consume** (used vs. unused upstream endpoints).
    - [EXTERNAL-API-ROUTES.md](EXTERNAL-API-ROUTES.md): catalog of **every external API and RSS feed** the platform calls, by category.
    - [apis/](apis/README.md): the same external catalog **split into one file per category**.
    - [SOURCES.md](SOURCES.md): the news feeds and market-data providers behind the API, with their keyless / free-tier status.

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
`pip install ./sdk/python` (from a clone)

[:material-arrow-right: Python SDK](sdks/python.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-js: JavaScript
`npm install @nirholas/crypto-news`

[:material-arrow-right: JavaScript SDK](sdks/javascript.md)
</div>

<div class="card" markdown>
### :simple-typescript: TypeScript
Full type definitions included

[:material-arrow-right: TypeScript SDK](sdks/typescript.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-react: React
Hooks & components (from a clone)

[:material-arrow-right: React SDK](sdks/react.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-golang: Go
`go get github.com/nirholas/cryptocurrency.cv/sdk/go`

[:material-arrow-right: Go SDK](sdks/go.md)
</div>

<div class="card" markdown>
### :fontawesome-brands-php: PHP
Composer package, from a clone

[:material-arrow-right: PHP SDK](sdks/php.md)
</div>

<div class="card" markdown>
### :gem: Ruby
Gem, built from a clone

[:material-arrow-right: Ruby SDK](sdks/ruby.md)
</div>

<div class="card" markdown>
### :crab: Rust
Cargo crate, via git dependency

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

- **Claude** — hosted MCP endpoint, nothing to install:
  `claude mcp add --transport http crypto-news https://cryptocurrency.cv/api/mcp`
- **ChatGPT** — Developer Mode over the same Streamable HTTP URL, or a Plugin/Action
- **LangChain** — as a custom tool
- **Any LLM** — via REST API, or the local `@nirholas/free-crypto-news-mcp` package

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

## :heart: Source and License

Free Crypto News is source-available (all rights reserved) and the hosted API is free to use; see [LICENSE](https://github.com/nirholas/cryptocurrency.cv/blob/main/LICENSE). Contributions welcome!

[:fontawesome-brands-github: View on GitHub](https://github.com/nirholas/cryptocurrency.cv){ .md-button }
