//! Basic usage example for FCN SDK

use fcn_sdk::{Client, NewsFilter};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create a client (no API key needed for free tier)
    let client = Client::new(None)?;

    // Check API health
    println!("Checking API health...");
    let healthy = client.health().await?;
    println!("API healthy: {}", healthy);

    // Get latest news
    println!("\n--- Latest News ---");
    let news = client.get_news(Some(NewsFilter {
        limit: Some(5),
        ..Default::default()
    })).await?;

    for article in &news.articles {
        println!("[{}] {}", article.source, article.title);
        if !article.tickers.is_empty() {
            println!("    Tickers: {}", article.tickers.join(", "));
        }
    }

    // Get trending tickers
    println!("\n--- Trending Tickers ---");
    let trending = client.get_trending(Some(10)).await?;
    
    for item in &trending.trending {
        println!("${}: {} mentions", item.symbol, item.mentions);
    }

    // Search for Bitcoin news
    println!("\n--- Bitcoin News ---");
    let btc_news = client.search("bitcoin", Some(3)).await?;
    
    for article in &btc_news.articles {
        println!("• {}", article.title);
    }

    // Get AI digest
    println!("\n--- AI Digest ---");
    match client.get_digest().await {
        Ok(digest) => {
            println!("Market Mood: {}", digest.market_mood);
            println!("Summary: {}", digest.summary);
        }
        Err(e) => println!("Digest not available: {}", e),
    }

    // Ask a question
    println!("\n--- Ask AI ---");
    match client.ask("What's happening with Bitcoin ETFs?").await {
        Ok(answer) => println!("Answer: {}", answer),
        Err(e) => println!("AI not available: {}", e),
    }

    Ok(())
}
