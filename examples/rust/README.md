# Rust Examples

Comprehensive examples for the Free Crypto News Rust SDK.

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to Cargo.toml
[dependencies]
fcn-sdk = "0.2"
tokio = { version = "1", features = ["full"] }
```

## Examples

### Basic Usage
```bash
cargo run --example basic
```
Demonstrates core functionality: news, search, trending, market data, and categories.

### Trading Intelligence
```bash
cargo run --example trading
```
Trading-focused features: signals, whale alerts, funding rates, liquidations, arbitrage, orderbook.

### AI Features
```bash
cargo run --example ai_features
```
AI-powered analysis: sentiment, digest, narratives, claims verification, Q&A.

### Real-Time Streaming
```bash
cargo run --example streaming --features websocket
```
WebSocket streaming: live news, prices, whale alerts, and combined event streams.

### Portfolio Management
```bash
cargo run --example portfolio
```
Portfolio tracking: valuation, allocation, watchlists, alerts, history, tax reporting.

## Quick Start

```rust
use fcn_sdk::{Client, NewsFilter};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize client (no API key needed)
    let client = Client::new(None)?;
    
    // Get latest news
    let news = client.get_news(Some(NewsFilter {
        limit: Some(10),
        ticker: Some("BTC".to_string()),
        ..Default::default()
    })).await?;
    
    for article in news.articles {
        println!("[{}] {}", article.source, article.title);
    }
    
    // Get trending
    let trending = client.get_trending(Some(10)).await?;
    for item in trending.trending {
        println!("${}: {} mentions", item.symbol, item.mentions);
    }
    
    // AI features
    let digest = client.get_digest().await?;
    println!("Market Mood: {}", digest.market_mood);
    
    Ok(())
}
```

## Features

Enable optional features in `Cargo.toml`:

```toml
[dependencies]
fcn-sdk = { version = "0.2", features = ["websocket", "tracing"] }
```

| Feature | Description |
|---------|-------------|
| `websocket` | Real-time streaming (default) |
| `tracing` | Debug logging with tracing |
| `full` | All features |

## Error Handling

```rust
use fcn_sdk::{Client, FcnError};

async fn example() {
    let client = Client::new(None).unwrap();
    
    match client.get_news(None).await {
        Ok(news) => println!("Got {} articles", news.count),
        Err(FcnError::RateLimited { retry_after }) => {
            println!("Rate limited, retry in {} seconds", retry_after);
        }
        Err(FcnError::ApiError { status, message }) => {
            println!("API error {}: {}", status, message);
        }
        Err(e) => println!("Error: {}", e),
    }
}
```

## Async Runtime

The SDK requires Tokio async runtime:

```rust
#[tokio::main]
async fn main() {
    // Your code here
}
```

Or with custom runtime:

```rust
fn main() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        // Your code here
    });
}
```

## API Reference

See the [full API documentation](https://cryptocurrency.cv/docs/sdk/rust).
