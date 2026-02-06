# Rust Examples

Production-ready Rust examples for the Free Crypto News API.

## Overview

| Example | File | Description |
|---------|------|-------------|
| Basic | `basic.rs` | Core API: news, search, sentiment |
| AI Features | `ai_features.rs` | Analysis, summaries, embeddings |
| Portfolio | `portfolio.rs` | Watchlist, alerts, tracking |
| Streaming | `streaming.rs` | Real-time SSE event handling |
| Trading | `trading.rs` | Signals, orderbook, arbitrage |

## Cargo Setup

```toml
[package]
name = "crypto-news-examples"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
eventsource-client = "0.12"
futures = "0.3"
anyhow = "1"
```

---

## Basic Usage

Core API operations: news feed, search, and sentiment.

```rust
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const BASE_URL: &str = "https://cryptocurrency.cv";

#[derive(Debug, Deserialize)]
pub struct Article {
    pub title: String,
    pub link: String,
    pub source: String,
    #[serde(rename = "pubDate")]
    pub pub_date: String,
    #[serde(rename = "timeAgo")]
    pub time_ago: String,
}

#[derive(Debug, Deserialize)]
pub struct NewsResponse {
    pub articles: Vec<Article>,
    pub count: usize,
    #[serde(rename = "lastUpdate")]
    pub last_update: String,
}

#[derive(Debug, Deserialize)]
pub struct Sentiment {
    pub label: String,
    pub score: f64,
    pub confidence: f64,
}

pub struct CryptoNewsClient {
    client: Client,
    base_url: String,
}

impl CryptoNewsClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: BASE_URL.to_string(),
        }
    }

    /// Fetch latest news articles
    pub async fn get_news(&self, limit: Option<u32>) -> Result<NewsResponse> {
        let limit = limit.unwrap_or(20);
        let url = format!("{}/api/news?limit={}", self.base_url, limit);
        
        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<NewsResponse>()
            .await?;
        
        Ok(response)
    }

    /// Search news articles
    pub async fn search(&self, query: &str) -> Result<NewsResponse> {
        let url = format!(
            "{}/api/search?q={}",
            self.base_url,
            urlencoding::encode(query)
        );
        
        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<NewsResponse>()
            .await?;
        
        Ok(response)
    }

    /// Get sentiment for an asset
    pub async fn get_sentiment(&self, asset: &str) -> Result<Sentiment> {
        let url = format!("{}/api/ai/sentiment?asset={}", self.base_url, asset);
        
        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<Sentiment>()
            .await?;
        
        Ok(response)
    }

    /// Get news by source
    pub async fn get_by_source(&self, source: &str, limit: Option<u32>) -> Result<NewsResponse> {
        let limit = limit.unwrap_or(20);
        let url = format!(
            "{}/api/news?source={}&limit={}",
            self.base_url, source, limit
        );
        
        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<NewsResponse>()
            .await?;
        
        Ok(response)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let client = CryptoNewsClient::new();

    // Get latest news
    println!("=== Latest News ===");
    let news = client.get_news(Some(5)).await?;
    for article in &news.articles {
        println!("• {} ({})", article.title, article.source);
    }

    // Search for Bitcoin news
    println!("\n=== Bitcoin News ===");
    let results = client.search("Bitcoin ETF").await?;
    println!("Found {} articles", results.count);

    // Get sentiment
    println!("\n=== BTC Sentiment ===");
    let sentiment = client.get_sentiment("BTC").await?;
    println!("{}: {:.2} (confidence: {:.0}%)", 
        sentiment.label, 
        sentiment.score,
        sentiment.confidence * 100.0
    );

    Ok(())
}
```

---

## AI Features

Advanced AI analysis, summaries, and embeddings.

```rust
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const BASE_URL: &str = "https://cryptocurrency.cv";

#[derive(Debug, Deserialize)]
pub struct Analysis {
    pub summary: String,
    pub key_points: Vec<String>,
    pub sentiment: String,
    pub market_impact: String,
    pub confidence: f64,
}

#[derive(Debug, Deserialize)]
pub struct NewsDigest {
    pub title: String,
    pub summary: String,
    pub top_stories: Vec<TopStory>,
    pub market_outlook: String,
    pub generated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct TopStory {
    pub title: String,
    pub summary: String,
    pub impact: String,
}

#[derive(Debug, Deserialize)]
pub struct Embedding {
    pub text: String,
    pub embedding: Vec<f32>,
    pub dimensions: usize,
}

pub struct AIClient {
    client: Client,
    base_url: String,
    api_key: Option<String>,
}

impl AIClient {
    pub fn new(api_key: Option<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: BASE_URL.to_string(),
            api_key,
        }
    }

    fn add_auth(&self, request: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        match &self.api_key {
            Some(key) => request.header("X-API-Key", key),
            None => request,
        }
    }

    /// Analyze a specific article
    pub async fn analyze_article(&self, url: &str) -> Result<Analysis> {
        let request = self.client
            .post(&format!("{}/api/ai/analyze", self.base_url))
            .json(&serde_json::json!({ "url": url }));
        
        let response = self.add_auth(request)
            .send()
            .await?
            .json::<Analysis>()
            .await?;
        
        Ok(response)
    }

    /// Generate daily digest
    pub async fn get_digest(&self) -> Result<NewsDigest> {
        let request = self.client
            .get(&format!("{}/api/ai/digest", self.base_url));
        
        let response = self.add_auth(request)
            .send()
            .await?
            .json::<NewsDigest>()
            .await?;
        
        Ok(response)
    }

    /// Get market prediction
    pub async fn predict(&self, asset: &str, timeframe: &str) -> Result<serde_json::Value> {
        let request = self.client
            .get(&format!(
                "{}/api/ai/predict?asset={}&timeframe={}",
                self.base_url, asset, timeframe
            ));
        
        let response = self.add_auth(request)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        Ok(response)
    }

    /// Generate text embeddings
    pub async fn embed(&self, text: &str) -> Result<Embedding> {
        let request = self.client
            .post(&format!("{}/api/ai/embed", self.base_url))
            .json(&serde_json::json!({ "text": text }));
        
        let response = self.add_auth(request)
            .send()
            .await?
            .json::<Embedding>()
            .await?;
        
        Ok(response)
    }

    /// Semantic search
    pub async fn semantic_search(&self, query: &str, limit: Option<u32>) -> Result<Vec<serde_json::Value>> {
        let limit = limit.unwrap_or(10);
        let request = self.client
            .post(&format!("{}/api/ai/search", self.base_url))
            .json(&serde_json::json!({ 
                "query": query,
                "limit": limit
            }));
        
        let response = self.add_auth(request)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        Ok(response["results"].as_array().cloned().unwrap_or_default())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let client = AIClient::new(std::env::var("API_KEY").ok());

    // Get daily digest
    println!("=== Daily Digest ===");
    let digest = client.get_digest().await?;
    println!("📰 {}", digest.title);
    println!("{}", digest.summary);
    println!("\nTop Stories:");
    for story in &digest.top_stories {
        println!("• {} [{}]", story.title, story.impact);
    }

    // Market prediction
    println!("\n=== BTC Prediction ===");
    let prediction = client.predict("BTC", "24h").await?;
    println!("{}", serde_json::to_string_pretty(&prediction)?);

    // Generate embedding
    println!("\n=== Text Embedding ===");
    let embedding = client.embed("Bitcoin price surge").await?;
    println!("Dimensions: {}", embedding.dimensions);
    println!("First 5 values: {:?}", &embedding.embedding[..5]);

    Ok(())
}
```

---

## Portfolio Management

Watchlist and alert management.

```rust
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const BASE_URL: &str = "https://cryptocurrency.cv";

#[derive(Debug, Deserialize, Serialize)]
pub struct WatchlistItem {
    pub symbol: String,
    pub added_at: String,
    pub target_price: Option<f64>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct WatchlistResponse {
    pub items: Vec<WatchlistItem>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Alert {
    pub id: String,
    pub asset: String,
    pub alert_type: String,
    pub value: f64,
    pub triggered: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct CreateAlert {
    pub asset: String,
    #[serde(rename = "type")]
    pub alert_type: String,
    pub value: f64,
}

pub struct PortfolioClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl PortfolioClient {
    pub fn new(api_key: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: BASE_URL.to_string(),
            api_key: api_key.to_string(),
        }
    }

    /// Get watchlist
    pub async fn get_watchlist(&self) -> Result<Vec<WatchlistItem>> {
        let response = self.client
            .get(&format!("{}/api/watchlist", self.base_url))
            .header("X-API-Key", &self.api_key)
            .send()
            .await?
            .json::<WatchlistResponse>()
            .await?;
        
        Ok(response.items)
    }

    /// Add to watchlist
    pub async fn add_to_watchlist(&self, symbol: &str) -> Result<WatchlistItem> {
        let response = self.client
            .post(&format!("{}/api/watchlist", self.base_url))
            .header("X-API-Key", &self.api_key)
            .json(&serde_json::json!({ "symbol": symbol }))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        Ok(serde_json::from_value(response["item"].clone())?)
    }

    /// Remove from watchlist
    pub async fn remove_from_watchlist(&self, symbol: &str) -> Result<()> {
        self.client
            .delete(&format!("{}/api/watchlist?symbol={}", self.base_url, symbol))
            .header("X-API-Key", &self.api_key)
            .send()
            .await?;
        
        Ok(())
    }

    /// Get all alerts
    pub async fn get_alerts(&self) -> Result<Vec<Alert>> {
        let response = self.client
            .get(&format!("{}/api/alerts", self.base_url))
            .header("X-API-Key", &self.api_key)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        let alerts: Vec<Alert> = serde_json::from_value(response["alerts"].clone())?;
        Ok(alerts)
    }

    /// Create a price alert
    pub async fn create_alert(&self, alert: CreateAlert) -> Result<Alert> {
        let response = self.client
            .post(&format!("{}/api/alerts", self.base_url))
            .header("X-API-Key", &self.api_key)
            .json(&alert)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        Ok(serde_json::from_value(response["alert"].clone())?)
    }

    /// Delete an alert
    pub async fn delete_alert(&self, alert_id: &str) -> Result<()> {
        self.client
            .delete(&format!("{}/api/alerts/{}", self.base_url, alert_id))
            .header("X-API-Key", &self.api_key)
            .send()
            .await?;
        
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let api_key = std::env::var("API_KEY").expect("API_KEY required");
    let client = PortfolioClient::new(&api_key);

    // Manage watchlist
    println!("=== Watchlist ===");
    client.add_to_watchlist("SOL").await?;
    let watchlist = client.get_watchlist().await?;
    for item in &watchlist {
        println!("• {} (added: {})", item.symbol, item.added_at);
    }

    // Create alert
    println!("\n=== Create Alert ===");
    let alert = client.create_alert(CreateAlert {
        asset: "BTC".to_string(),
        alert_type: "price_above".to_string(),
        value: 100000.0,
    }).await?;
    println!("Created alert: {} {} ${}", alert.asset, alert.alert_type, alert.value);

    // List alerts
    println!("\n=== Active Alerts ===");
    let alerts = client.get_alerts().await?;
    for alert in &alerts {
        let status = if alert.triggered { "✓" } else { "○" };
        println!("{} {} {} ${}", status, alert.asset, alert.alert_type, alert.value);
    }

    Ok(())
}
```

---

## Real-Time Streaming

Server-Sent Events (SSE) for live updates.

```rust
use anyhow::Result;
use eventsource_client::{Client as SSEClient, SSE};
use futures::stream::StreamExt;
use serde::Deserialize;

const BASE_URL: &str = "https://cryptocurrency.cv";

#[derive(Debug, Deserialize)]
pub struct StreamEvent {
    pub title: String,
    pub link: String,
    pub source: String,
    #[serde(rename = "pubDate")]
    pub pub_date: String,
}

#[derive(Debug, Deserialize)]
pub struct PriceEvent {
    pub symbol: String,
    pub price: f64,
    pub change_24h: f64,
    pub timestamp: String,
}

pub async fn stream_news() -> Result<()> {
    println!("Connecting to news stream...");
    
    let client = eventsource_client::ClientBuilder::for_url(&format!("{}/api/sse", BASE_URL))?
        .build();
    
    let mut stream = client.stream();
    
    while let Some(event) = stream.next().await {
        match event {
            Ok(SSE::Event(ev)) => {
                if let Ok(article) = serde_json::from_str::<StreamEvent>(&ev.data) {
                    println!("\n📰 NEW ARTICLE");
                    println!("   Title: {}", article.title);
                    println!("   Source: {}", article.source);
                    println!("   Link: {}", article.link);
                }
            }
            Ok(SSE::Comment(_)) => {}
            Err(e) => {
                eprintln!("Stream error: {:?}", e);
                break;
            }
        }
    }
    
    Ok(())
}

pub async fn stream_prices(symbols: Vec<&str>) -> Result<()> {
    let symbols_param = symbols.join(",");
    let url = format!("{}/api/sse?type=prices&symbols={}", BASE_URL, symbols_param);
    
    println!("Connecting to price stream for: {:?}", symbols);
    
    let client = eventsource_client::ClientBuilder::for_url(&url)?.build();
    let mut stream = client.stream();
    
    while let Some(event) = stream.next().await {
        match event {
            Ok(SSE::Event(ev)) if ev.event_type == "price" => {
                if let Ok(price) = serde_json::from_str::<PriceEvent>(&ev.data) {
                    let change_symbol = if price.change_24h >= 0.0 { "↑" } else { "↓" };
                    println!(
                        "{} ${:.2} {} {:.2}%",
                        price.symbol, price.price, change_symbol, price.change_24h.abs()
                    );
                }
            }
            Ok(_) => {}
            Err(e) => {
                eprintln!("Stream error: {:?}", e);
                break;
            }
        }
    }
    
    Ok(())
}

// Alternative: Using reqwest for simple SSE
pub async fn simple_stream() -> Result<()> {
    use reqwest::Client;
    use tokio::io::{AsyncBufReadExt, BufReader};
    
    let client = Client::new();
    let response = client
        .get(&format!("{}/api/sse", BASE_URL))
        .send()
        .await?;
    
    let mut reader = BufReader::new(
        tokio_util::io::StreamReader::new(
            response.bytes_stream().map(|r| {
                r.map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))
            })
        )
    );
    
    let mut line = String::new();
    
    loop {
        line.clear();
        if reader.read_line(&mut line).await? == 0 {
            break;
        }
        
        if line.starts_with("data: ") {
            let data = &line[6..];
            if let Ok(article) = serde_json::from_str::<StreamEvent>(data) {
                println!("📰 {}", article.title);
            }
        }
    }
    
    Ok(())
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("=== Real-Time News Stream ===\n");
    
    // Stream news (runs indefinitely)
    stream_news().await?;
    
    // Or stream prices
    // stream_prices(vec!["BTC", "ETH", "SOL"]).await?;
    
    Ok(())
}
```

---

## Trading Tools

Signals, orderbook, and arbitrage detection.

```rust
use anyhow::Result;
use reqwest::Client;
use serde::Deserialize;

const BASE_URL: &str = "https://cryptocurrency.cv";

#[derive(Debug, Deserialize)]
pub struct Signal {
    pub asset: String,
    pub action: String,  // "buy", "sell", "hold"
    pub entry: f64,
    pub target: f64,
    pub stop_loss: f64,
    pub confidence: f64,
    pub reason: String,
    pub generated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct Orderbook {
    pub pair: String,
    pub bids: Vec<(f64, f64)>,  // (price, amount)
    pub asks: Vec<(f64, f64)>,
    pub timestamp: String,
}

#[derive(Debug, Deserialize)]
pub struct ArbitrageOpportunity {
    pub pair: String,
    pub buy_exchange: String,
    pub buy_price: f64,
    pub sell_exchange: String,
    pub sell_price: f64,
    pub profit_percent: f64,
    pub volume: f64,
}

pub struct TradingClient {
    client: Client,
    base_url: String,
}

impl TradingClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: BASE_URL.to_string(),
        }
    }

    /// Get trading signals
    pub async fn get_signals(&self, asset: Option<&str>) -> Result<Vec<Signal>> {
        let mut url = format!("{}/api/signals", self.base_url);
        if let Some(a) = asset {
            url.push_str(&format!("?asset={}", a));
        }
        
        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        Ok(serde_json::from_value(response["signals"].clone())?)
    }

    /// Get orderbook for a trading pair
    pub async fn get_orderbook(&self, pair: &str) -> Result<Orderbook> {
        let url = format!(
            "{}/api/orderbook?pair={}",
            self.base_url,
            urlencoding::encode(pair)
        );
        
        let response = self.client
            .get(&url)
            .send()
            .await?
            .json::<Orderbook>()
            .await?;
        
        Ok(response)
    }

    /// Get arbitrage opportunities
    pub async fn get_arbitrage(&self) -> Result<Vec<ArbitrageOpportunity>> {
        let response = self.client
            .get(&format!("{}/api/arbitrage", self.base_url))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        
        Ok(serde_json::from_value(response["opportunities"].clone())?)
    }

    /// Calculate position size based on risk
    pub fn calculate_position(
        &self,
        capital: f64,
        risk_percent: f64,
        entry: f64,
        stop_loss: f64,
    ) -> (f64, f64) {
        let risk_amount = capital * (risk_percent / 100.0);
        let price_risk = (entry - stop_loss).abs();
        let position_size = risk_amount / price_risk;
        let position_value = position_size * entry;
        
        (position_size, position_value)
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let client = TradingClient::new();

    // Get trading signals
    println!("=== Trading Signals ===");
    let signals = client.get_signals(None).await?;
    for signal in &signals {
        let emoji = match signal.action.as_str() {
            "buy" => "🟢",
            "sell" => "🔴",
            _ => "⚪",
        };
        println!(
            "{} {} {} | Entry: ${:.2} Target: ${:.2} Stop: ${:.2}",
            emoji, signal.action.to_uppercase(), signal.asset,
            signal.entry, signal.target, signal.stop_loss
        );
        println!("   Confidence: {:.0}% - {}", signal.confidence * 100.0, signal.reason);
    }

    // Get orderbook
    println!("\n=== BTC/USDT Orderbook ===");
    let orderbook = client.get_orderbook("BTC/USDT").await?;
    
    println!("Top 5 Bids:");
    for (price, amount) in orderbook.bids.iter().take(5) {
        println!("  ${:.2} - {:.4} BTC", price, amount);
    }
    
    println!("\nTop 5 Asks:");
    for (price, amount) in orderbook.asks.iter().take(5) {
        println!("  ${:.2} - {:.4} BTC", price, amount);
    }

    // Get arbitrage opportunities
    println!("\n=== Arbitrage Opportunities ===");
    let opportunities = client.get_arbitrage().await?;
    for opp in &opportunities {
        println!(
            "💰 {} | Buy @ {} (${:.2}) → Sell @ {} (${:.2}) | Profit: {:.2}%",
            opp.pair,
            opp.buy_exchange, opp.buy_price,
            opp.sell_exchange, opp.sell_price,
            opp.profit_percent
        );
    }

    // Position sizing example
    println!("\n=== Position Calculator ===");
    if let Some(signal) = signals.first() {
        let capital = 10000.0;
        let risk_percent = 2.0;
        let (size, value) = client.calculate_position(
            capital, risk_percent, signal.entry, signal.stop_loss
        );
        println!(
            "For ${} capital with {}% risk on {}:",
            capital, risk_percent, signal.asset
        );
        println!("  Position Size: {:.4}", size);
        println!("  Position Value: ${:.2}", value);
    }

    Ok(())
}
```

---

## Error Handling

Robust error handling for production use.

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoNewsError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),
    
    #[error("JSON parsing failed: {0}")]
    JsonError(#[from] serde_json::Error),
    
    #[error("API error: {status} - {message}")]
    ApiError { status: u16, message: String },
    
    #[error("Rate limited: retry after {retry_after} seconds")]
    RateLimited { retry_after: u64 },
    
    #[error("Authentication required")]
    Unauthorized,
    
    #[error("Resource not found: {0}")]
    NotFound(String),
}

pub async fn safe_request(client: &Client, url: &str) -> Result<serde_json::Value, CryptoNewsError> {
    let response = client.get(url).send().await?;
    
    match response.status().as_u16() {
        200..=299 => Ok(response.json().await?),
        401 => Err(CryptoNewsError::Unauthorized),
        404 => Err(CryptoNewsError::NotFound(url.to_string())),
        429 => {
            let retry_after = response
                .headers()
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|v| v.parse().ok())
                .unwrap_or(60);
            Err(CryptoNewsError::RateLimited { retry_after })
        }
        status => {
            let message = response.text().await.unwrap_or_default();
            Err(CryptoNewsError::ApiError { status, message })
        }
    }
}
```

---

## Related

- [Rust SDK](../sdks/rust.md)
- [API Reference](../API.md)
- [Real-Time API](../REALTIME.md)
