//! # Free Crypto News Rust SDK
//!
//! Production-ready Rust client library for the Free Crypto News API.
//!
//! ## Features
//!
//! - **Async/await** - Built on Tokio for high-performance async operations
//! - **WebSocket streaming** - Real-time news and price updates
//! - **Automatic retries** - Exponential backoff for transient failures
//! - **Rate limiting** - Built-in rate limit handling
//! - **Type-safe** - Full Rust type safety with serde
//!
//! ## Quick Start
//!
//! ```rust
//! use fcn_sdk::{Client, NewsFilter};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let client = Client::new(None)?;
//!     
//!     let news = client.get_news(Some(NewsFilter {
//!         limit: Some(10),
//!         ticker: Some("BTC".to_string()),
//!         ..Default::default()
//!     })).await?;
//!     
//!     for article in news.articles {
//!         println!("{}: {}", article.source, article.title);
//!     }
//!     Ok(())
//! }
//! ```

use backoff::ExponentialBackoffBuilder;
use chrono::{DateTime, Utc};
use reqwest::{header, Client as HttpClient, Response, StatusCode};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use thiserror::Error;
use tokio::sync::RwLock;

#[cfg(feature = "websocket")]
use futures_util::{Stream, StreamExt};
#[cfg(feature = "websocket")]
use tokio_tungstenite::tungstenite::Message;

/// Base URL for the API
pub const BASE_URL: &str = "https://cryptocurrency.cv/api";
pub const WS_URL: &str = "wss://cryptocurrency.cv/ws";

// =============================================================================
// ERROR TYPES
// =============================================================================

#[derive(Error, Debug)]
pub enum FcnError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),
    #[error("API error ({status}): {message}")]
    ApiError { message: String, status: u16 },
    #[error("Rate limited - retry after {retry_after} seconds")]
    RateLimited { retry_after: u64 },
    #[error("JSON parsing failed: {0}")]
    ParseError(#[from] serde_json::Error),
    #[error("WebSocket error: {0}")]
    WebSocketError(String),
    #[error("Invalid configuration: {0}")]
    ConfigError(String),
}

pub type Result<T> = std::result::Result<T, FcnError>;

// =============================================================================
// DATA TYPES
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Article {
    pub title: String,
    pub link: String,
    #[serde(default)]
    pub description: Option<String>,
    pub source: String,
    #[serde(alias = "pubDate")]
    pub pub_date: String,
    #[serde(default)]
    pub tickers: Vec<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub sentiment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewsResponse {
    pub articles: Vec<Article>,
    pub count: usize,
    #[serde(alias = "generatedAt")]
    pub generated_at: String,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct NewsFilter {
    pub limit: Option<u32>,
    pub source: Option<String>,
    pub category: Option<String>,
    pub ticker: Option<String>,
    pub q: Option<String>,
    pub since: Option<String>,
    pub cursor: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Coin {
    pub id: String,
    pub symbol: String,
    pub name: String,
    pub current_price: f64,
    pub market_cap: f64,
    #[serde(default)]
    pub price_change_24h: Option<f64>,
    #[serde(default)]
    pub price_change_percentage_24h: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketResponse {
    pub coins: Vec<Coin>,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendingResponse {
    pub trending: Vec<TrendingItem>,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendingItem {
    pub symbol: String,
    #[serde(default)]
    pub name: Option<String>,
    pub mentions: u32,
    #[serde(default)]
    pub sentiment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentimentResult {
    pub title: String,
    pub sentiment: String,
    pub score: f64,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DigestResponse {
    pub summary: String,
    pub top_stories: Vec<String>,
    pub market_mood: String,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxReport {
    pub summary: TaxSummary,
    pub capital_gains: Vec<CapitalGain>,
    pub generated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaxSummary {
    pub tax_year: u32,
    pub jurisdiction: String,
    pub cost_basis_method: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapitalGain {
    pub asset: String,
    pub acquired_at: String,
    pub disposed_at: String,
    pub proceeds: f64,
    pub cost_basis: f64,
    pub gain: f64,
    pub holding_period: String,
}

// =============================================================================
// CLIENT CONFIG
// =============================================================================

#[derive(Debug, Clone)]
pub struct ClientConfig {
    pub api_key: Option<String>,
    pub base_url: String,
    pub ws_url: String,
    pub timeout: u64,
    pub max_retries: u32,
    pub retry_enabled: bool,
}

impl Default for ClientConfig {
    fn default() -> Self {
        Self {
            api_key: None,
            base_url: BASE_URL.to_string(),
            ws_url: WS_URL.to_string(),
            timeout: 30,
            max_retries: 3,
            retry_enabled: true,
        }
    }
}

impl ClientConfig {
    pub fn new() -> Self { Self::default() }
    pub fn with_api_key(mut self, key: impl Into<String>) -> Self { self.api_key = Some(key.into()); self }
    pub fn with_base_url(mut self, url: impl Into<String>) -> Self { self.base_url = url.into(); self }
    pub fn with_timeout(mut self, timeout: u64) -> Self { self.timeout = timeout; self }
}

// =============================================================================
// CLIENT
// =============================================================================

pub struct Client {
    http: HttpClient,
    config: ClientConfig,
    rate_limit: Arc<RwLock<RateLimitState>>,
}

#[derive(Debug, Default)]
struct RateLimitState {
    remaining: Option<u32>,
}

impl Client {
    pub fn new(api_key: Option<String>) -> Result<Self> {
        let config = ClientConfig { api_key, ..Default::default() };
        Self::with_config(config)
    }

    pub fn with_config(config: ClientConfig) -> Result<Self> {
        let mut headers = header::HeaderMap::new();
        headers.insert(header::CONTENT_TYPE, header::HeaderValue::from_static("application/json"));
        headers.insert(header::USER_AGENT, header::HeaderValue::from_static("fcn-rust-sdk/0.2.0"));

        if let Some(ref key) = config.api_key {
            headers.insert(
                header::AUTHORIZATION,
                header::HeaderValue::from_str(&format!("Bearer {}", key))
                    .map_err(|_| FcnError::ConfigError("Invalid API key".into()))?,
            );
        }

        let http = HttpClient::builder()
            .default_headers(headers)
            .timeout(Duration::from_secs(config.timeout))
            .gzip(true)
            .build()?;

        Ok(Self { http, config, rate_limit: Arc::new(RwLock::new(RateLimitState::default())) })
    }

    pub fn with_base_url(mut self, base_url: &str) -> Self { self.config.base_url = base_url.to_string(); self }

    // News API
    pub async fn get_news(&self, filter: Option<NewsFilter>) -> Result<NewsResponse> {
        let mut params: Vec<(&str, String)> = vec![];
        if let Some(f) = filter {
            if let Some(limit) = f.limit { params.push(("limit", limit.to_string())); }
            if let Some(source) = f.source { params.push(("source", source)); }
            if let Some(category) = f.category { params.push(("category", category)); }
            if let Some(ticker) = f.ticker { params.push(("ticker", ticker)); }
            if let Some(q) = f.q { params.push(("q", q)); }
        }
        self.get("/news", &params).await
    }

    pub async fn search(&self, query: &str, limit: Option<u32>) -> Result<NewsResponse> {
        let mut params = vec![("q", query.to_string())];
        if let Some(l) = limit { params.push(("limit", l.to_string())); }
        self.get("/search", &params).await
    }

    pub async fn get_trending(&self, limit: Option<u32>) -> Result<TrendingResponse> {
        let params = match limit { Some(l) => vec![("limit", l.to_string())], None => vec![] };
        self.get("/trending", &params).await
    }

    // AI & Analytics
    pub async fn get_sentiment(&self, limit: Option<u32>) -> Result<Vec<SentimentResult>> {
        let params = match limit { Some(l) => vec![("limit", l.to_string())], None => vec![] };
        let result: HashMap<String, serde_json::Value> = self.get("/sentiment", &params).await?;
        if let Some(s) = result.get("sentiments") { return Ok(serde_json::from_value(s.clone())?); }
        Ok(vec![])
    }

    pub async fn get_digest(&self) -> Result<DigestResponse> { self.get("/digest", &[]).await }

    pub async fn ask(&self, question: &str) -> Result<String> {
        let params = vec![("q", urlencoding::encode(question).to_string())];
        let result: HashMap<String, serde_json::Value> = self.get("/ask", &params).await?;
        if let Some(a) = result.get("answer").and_then(|v| v.as_str()) { return Ok(a.to_string()); }
        Ok("No answer".to_string())
    }

    pub async fn get_entities(&self, limit: Option<u32>) -> Result<serde_json::Value> {
        let params = match limit { Some(l) => vec![("limit", l.to_string())], None => vec![] };
        self.get("/entities", &params).await
    }

    pub async fn get_relationships(&self, limit: Option<u32>) -> Result<serde_json::Value> {
        let params = match limit { Some(l) => vec![("limit", l.to_string())], None => vec![] };
        self.get("/relationships", &params).await
    }

    pub async fn get_predictions(&self) -> Result<serde_json::Value> { self.get("/predictions", &[]).await }

    // Market Data
    pub async fn get_market(&self, limit: Option<u32>) -> Result<MarketResponse> {
        let params = match limit { Some(l) => vec![("limit", l.to_string())], None => vec![] };
        self.get("/market/coins", &params).await
    }

    pub async fn get_coin(&self, coin_id: &str) -> Result<Coin> { self.get(&format!("/market/coins/{}", coin_id), &[]).await }

    // On-chain
    pub async fn get_onchain_events(&self, chain: Option<&str>) -> Result<serde_json::Value> {
        let params = match chain { Some(c) => vec![("chain", c.to_string())], None => vec![] };
        self.get("/onchain/events", &params).await
    }

    // Portfolio
    pub async fn get_portfolio_performance(&self, portfolio_id: Option<&str>, period: Option<&str>) -> Result<serde_json::Value> {
        let mut params = vec![];
        if let Some(id) = portfolio_id { params.push(("portfolio_id", id.to_string())); }
        if let Some(p) = period { params.push(("period", p.to_string())); }
        self.get("/portfolio/performance", &params).await
    }

    pub async fn get_tax_report(&self, year: Option<u32>, method: Option<&str>) -> Result<TaxReport> {
        let mut params = vec![];
        if let Some(y) = year { params.push(("year", y.to_string())); }
        if let Some(m) = method { params.push(("method", m.to_string())); }
        self.get("/portfolio/tax", &params).await
    }

    // Health
    pub async fn health(&self) -> Result<bool> {
        let result: HashMap<String, serde_json::Value> = self.get("/health", &[]).await?;
        Ok(result.get("status").and_then(|v| v.as_str()) == Some("ok"))
    }

    // WebSocket streaming
    #[cfg(feature = "websocket")]
    pub async fn stream_news(&self) -> Result<impl Stream<Item = Result<Article>>> {
        use tokio_tungstenite::connect_async;
        let (ws, _) = connect_async(&format!("{}/news", self.config.ws_url)).await.map_err(|e| FcnError::WebSocketError(e.to_string()))?;
        let (_, read) = ws.split();
        Ok(read.filter_map(|msg| async {
            match msg {
                Ok(Message::Text(t)) => Some(serde_json::from_str(&t).map_err(FcnError::ParseError)),
                Ok(Message::Close(_)) => None,
                Err(e) => Some(Err(FcnError::WebSocketError(e.to_string()))),
                _ => None,
            }
        }))
    }

    // Internal
    async fn get<T: serde::de::DeserializeOwned>(&self, path: &str, params: &[(&str, String)]) -> Result<T> {
        let url = if params.is_empty() {
            format!("{}{}", self.config.base_url, path)
        } else {
            let q: String = params.iter().map(|(k, v)| format!("{}={}", k, urlencoding::encode(v))).collect::<Vec<_>>().join("&");
            format!("{}{}?{}", self.config.base_url, path, q)
        };
        if self.config.retry_enabled { self.get_with_retry(&url).await } else { self.execute_get(&url).await }
    }

    async fn get_with_retry<T: serde::de::DeserializeOwned>(&self, url: &str) -> Result<T> {
        let mut retries = 0;
        loop {
            match self.execute_get::<T>(url).await {
                Ok(r) => return Ok(r),
                Err(FcnError::RateLimited { retry_after }) => { tokio::time::sleep(Duration::from_secs(retry_after)).await; }
                Err(e) if retries < self.config.max_retries => { retries += 1; tokio::time::sleep(Duration::from_millis(100 * 2u64.pow(retries))).await; }
                Err(e) => return Err(e),
            }
        }
    }

    async fn execute_get<T: serde::de::DeserializeOwned>(&self, url: &str) -> Result<T> {
        let resp = self.http.get(url).send().await?;
        self.handle_response(resp).await
    }

    async fn handle_response<T: serde::de::DeserializeOwned>(&self, resp: Response) -> Result<T> {
        if let Some(r) = resp.headers().get("x-ratelimit-remaining").and_then(|v| v.to_str().ok()).and_then(|v| v.parse().ok()) {
            self.rate_limit.write().await.remaining = Some(r);
        }
        if resp.status() == StatusCode::TOO_MANY_REQUESTS {
            let retry = resp.headers().get("retry-after").and_then(|v| v.to_str().ok()).and_then(|v| v.parse().ok()).unwrap_or(60);
            return Err(FcnError::RateLimited { retry_after: retry });
        }
        if !resp.status().is_success() {
            return Err(FcnError::ApiError { message: resp.text().await.unwrap_or_default(), status: resp.status().as_u16() });
        }
        Ok(serde_json::from_str(&resp.text().await?)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_client_creation() { assert!(Client::new(None).is_ok()); }
    #[test]
    fn test_client_with_key() { assert!(Client::new(Some("key".into())).is_ok()); }
}

pub use reqwest;
pub use serde_json;
