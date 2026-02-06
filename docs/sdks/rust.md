# Rust SDK

The Rust SDK provides an async, type-safe client for the Free Crypto News API with WebSocket streaming support.

## Features

- ✅ **Async/await** - Tokio-based async runtime
- ✅ **WebSocket streaming** - Real-time news updates
- ✅ **Type-safe** - Full Serde serialization
- ✅ **Automatic retries** - Exponential backoff
- ✅ **Rate limit handling** - Smart retry logic
- ✅ **Gzip compression** - Efficient transfers
- ✅ **Portfolio tools** - Tax reporting included
- ✅ **Tracing support** - Optional observability

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
fcn-sdk = "0.2"
tokio = { version = "1", features = ["full"] }
```

### Feature Flags

```toml
# Enable WebSocket streaming
fcn-sdk = { version = "0.2", features = ["websocket"] }

# Enable tracing for debugging
fcn-sdk = { version = "0.2", features = ["tracing"] }

# Enable all features
fcn-sdk = { version = "0.2", features = ["full"] }
```

| Feature | Description | Default |
|---------|-------------|---------|
| `websocket` | Real-time news streaming | ✅ |
| `tracing` | Debug/trace logging | ❌ |
| `full` | All features enabled | ❌ |

## Quick Start

```rust
use fcn_sdk::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client (no API key needed!)
    let client = Client::new()?;
    
    // Get latest news
    let news = client.get_news(10, None, None, None).await?;
    for article in news.articles {
        println!("📰 {} - {}", article.title, article.source);
    }
    
    Ok(())
}
```

## Configuration

```rust
use fcn_sdk::{Client, ClientConfig};
use std::time::Duration;

// Create with custom configuration
let config = ClientConfig::new()
    .with_api_key("your_api_key")  // Optional for premium
    .with_timeout(Duration::from_secs(60))
    .with_base_url("https://cryptocurrency.cv")
    .with_max_retries(3);

let client = Client::with_config(config)?;
```

## News API

```rust
// Get latest news
let news = client.get_news(10, None, None, None).await?;

// Filter by ticker
let btc_news = client.get_news(10, None, Some("BTC"), None).await?;

// Get breaking news
let breaking = client.get_breaking_news(5).await?;

// Get trending topics
let trending = client.get_trending(10).await?;
println!("🔥 Trending: {:?}", trending);

// Search articles
let results = client.search("ethereum upgrade", 10).await?;
```

## AI & Analytics

```rust
// Sentiment analysis
let sentiment = client.get_sentiment(20).await?;
println!("Market sentiment: {} ({:.2})", sentiment.overall, sentiment.score);

// AI-powered digest
let digest = client.get_digest().await?;
println!("📊 Today's summary:\n{}", digest.summary);

// Ask questions about crypto news
let answer = client.ask("What's happening with Bitcoin ETFs?").await?;
println!("🤖 {}", answer);

// Entity extraction
let entities = client.get_entities(30, Some("company")).await?;

// Price predictions
let predictions = client.get_predictions(Some("BTC")).await?;
```

## Real-time Streaming

Stream news updates via WebSocket:

```rust
use fcn_sdk::Client;
use futures_util::StreamExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new()?;
    
    // Stream real-time news
    let mut stream = client.stream_news().await?;
    
    println!("🔴 Listening for live news...");
    
    while let Some(result) = stream.next().await {
        match result {
            Ok(article) => {
                println!("🔴 LIVE: {} - {}", article.title, article.source);
            }
            Err(e) => eprintln!("Stream error: {}", e),
        }
    }
    
    Ok(())
}
```

### Filtered Streaming

```rust
// Stream only Bitcoin news
let mut stream = client.stream_news_filtered(Some("BTC")).await?;

// Stream with reconnection
loop {
    match client.stream_news().await {
        Ok(mut stream) => {
            while let Some(result) = stream.next().await {
                if let Ok(article) = result {
                    println!("📰 {}", article.title);
                }
            }
        }
        Err(e) => {
            eprintln!("Connection lost: {}. Reconnecting...", e);
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
    }
}
```

## Portfolio Tools

```rust
// Get portfolio performance
let performance = client.get_portfolio_performance("demo", "30d").await?;
println!("Portfolio value: ${:.2}", performance.current_value);
println!("24h change: {:.2}%", performance.change_24h);

// Generate tax report
let tax = client.get_tax_report("demo", 2025, "FIFO", "US").await?;
println!("Total gains: ${:.2}", tax.total_gains);
println!("Taxable events: {}", tax.events.len());

// Add transaction
client.add_transaction(
    "buy",
    "BTC",
    0.5,
    95000.0,
    chrono::Utc::now(),
).await?;
```

## On-chain Events

```rust
// Get on-chain events correlated to news
let events = client.get_onchain_events(Some("ethereum"), None).await?;
for event in events {
    println!("🔗 {} - {}", event.event_type, event.description);
}

// Filter by event type
let whale_events = client.get_onchain_events(
    Some("ethereum"),
    Some("whale_transfer")
).await?;
```

## Error Handling

```rust
use fcn_sdk::{Client, FcnError};

async fn fetch_news(client: &Client) -> Result<(), FcnError> {
    match client.get_news(10, None, None, None).await {
        Ok(news) => {
            println!("Got {} articles", news.articles.len());
            Ok(())
        }
        Err(FcnError::RateLimited { retry_after }) => {
            println!("Rate limited, retry after {}s", retry_after);
            tokio::time::sleep(Duration::from_secs(retry_after)).await;
            // Retry...
            Ok(())
        }
        Err(FcnError::Unauthorized) => {
            println!("Invalid API key");
            Err(FcnError::Unauthorized)
        }
        Err(FcnError::NotFound) => {
            println!("Resource not found");
            Err(FcnError::NotFound)
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            Err(e)
        }
    }
}
```

## Type Definitions

```rust
#[derive(Debug, Deserialize)]
pub struct NewsResponse {
    pub articles: Vec<Article>,
    pub total_count: u32,
    pub fetched_at: String,
}

#[derive(Debug, Deserialize)]
pub struct Article {
    pub title: String,
    pub link: String,
    pub description: Option<String>,
    pub pub_date: String,
    pub source: String,
    pub time_ago: String,
    pub ticker: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Sentiment {
    pub overall: String,
    pub score: f64,
    pub articles_analyzed: u32,
}
```

## API Reference

### Client Methods

| Method | Description |
|--------|-------------|
| `get_news(limit, source, ticker, category)` | Fetch latest news |
| `get_breaking_news(limit)` | Get breaking news (< 2h) |
| `get_trending(limit)` | Get trending tickers |
| `search(query, limit)` | Search articles |
| `get_sentiment(limit)` | Sentiment analysis |
| `get_digest()` | AI-generated digest |
| `ask(question)` | Natural language Q&A |
| `get_entities(limit, type)` | Entity extraction |
| `get_predictions(asset)` | Price predictions |
| `stream_news()` | Real-time WebSocket stream |
| `get_portfolio_performance(id, period)` | Portfolio metrics |
| `get_tax_report(id, year, method, country)` | Tax report |
| `get_onchain_events(chain, type)` | On-chain events |

### Error Types

| Error | Description |
|-------|-------------|
| `FcnError::RateLimited { retry_after }` | Rate limit exceeded |
| `FcnError::Unauthorized` | Invalid API key |
| `FcnError::NotFound` | Resource not found |
| `FcnError::Network(String)` | Connection error |
| `FcnError::Parse(String)` | JSON parse error |

## Examples

Run the included examples:

```bash
# Basic usage
cargo run --example basic

# Real-time streaming
cargo run --example streaming --features websocket

# Portfolio management
cargo run --example portfolio
```

### CLI Tool Example

```rust
use clap::Parser;
use fcn_sdk::Client;

#[derive(Parser)]
struct Args {
    #[arg(short, long, default_value = "10")]
    limit: u32,
    
    #[arg(short, long)]
    ticker: Option<String>,
    
    #[arg(short, long)]
    search: Option<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    let client = Client::new()?;
    
    let news = if let Some(query) = args.search {
        client.search(&query, args.limit).await?
    } else {
        client.get_news(args.limit, None, args.ticker.as_deref(), None).await?
    };
    
    for article in news.articles {
        println!("📰 {}", article.title);
        println!("   {} • {}", article.source, article.time_ago);
        println!();
    }
    
    Ok(())
}
```

### Axum Web Server

```rust
use axum::{extract::Query, routing::get, Json, Router};
use fcn_sdk::Client;
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
struct NewsParams {
    limit: Option<u32>,
    ticker: Option<String>,
}

async fn get_news(
    Query(params): Query<NewsParams>,
    client: Arc<Client>,
) -> Json<serde_json::Value> {
    let news = client
        .get_news(
            params.limit.unwrap_or(10),
            None,
            params.ticker.as_deref(),
            None,
        )
        .await
        .unwrap();
    
    Json(serde_json::to_value(news).unwrap())
}

#[tokio::main]
async fn main() {
    let client = Arc::new(Client::new().unwrap());
    
    let app = Router::new()
        .route("/news", get(move |q| get_news(q, client.clone())));
    
    axum::serve(
        tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap(),
        app,
    )
    .await
    .unwrap();
}
```

## License

MIT
