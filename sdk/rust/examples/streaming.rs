//! Real-time news streaming example
//!
//! Run with: cargo run --example streaming --features websocket

use fcn_sdk::Client;
use futures_util::StreamExt;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client
    let client = Client::new()?;
    
    println!("🔴 Connecting to real-time news stream...\n");
    
    // Stream real-time news
    let mut stream = client.stream_news().await?;
    
    println!("✅ Connected! Waiting for news...\n");
    
    // Process incoming articles
    let mut count = 0;
    while let Some(result) = stream.next().await {
        match result {
            Ok(article) => {
                count += 1;
                println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                println!("📰 #{} | {}", count, article.title);
                println!("🏢 Source: {}", article.source);
                if let Some(tickers) = &article.tickers {
                    println!("📊 Tickers: {}", tickers.join(", "));
                }
                println!("🔗 {}", article.url);
                println!();
                
                // Stop after 10 articles for demo
                if count >= 10 {
                    println!("Demo complete! Received 10 articles.");
                    break;
                }
            }
            Err(e) => {
                eprintln!("❌ Error: {}", e);
            }
        }
    }
    
    Ok(())
}
