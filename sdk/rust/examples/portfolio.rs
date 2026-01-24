//! Portfolio and tax report example
//!
//! Run with: cargo run --example portfolio

use fcn_sdk::Client;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create client
    let client = Client::new()?;
    
    println!("💼 Portfolio Analysis\n");
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
    // Get portfolio performance
    println!("📊 Fetching portfolio performance...\n");
    match client.get_portfolio_performance("demo", "30d").await {
        Ok(perf) => {
            println!("Portfolio Performance (30d):");
            println!("  Current Value: ${:.2}", perf.current_value);
            println!("  Total Return: {:.2}%", perf.total_return_percent);
            println!();
        }
        Err(e) => {
            println!("  Could not fetch performance: {}\n", e);
        }
    }
    
    // Generate tax report
    println!("📋 Generating Tax Report...\n");
    match client.get_tax_report("demo", 2024, "FIFO", "US").await {
        Ok(tax) => {
            println!("Tax Report (2024 - FIFO Method):");
            println!("  Total Gains: ${:.2}", tax.total_gains);
            println!("  Short-term Gains: ${:.2}", tax.short_term_gains);
            println!("  Long-term Gains: ${:.2}", tax.long_term_gains);
            println!();
            
            if !tax.capital_gains.is_empty() {
                println!("Capital Gains:");
                for gain in &tax.capital_gains {
                    let gain_type = if gain.holding_period_days > 365 { "LT" } else { "ST" };
                    println!(
                        "  {} {} ${:.2} → ${:.2} = ${:.2} ({})",
                        gain.asset,
                        gain.amount,
                        gain.cost_basis,
                        gain.proceeds,
                        gain.gain_loss,
                        gain_type
                    );
                }
            }
        }
        Err(e) => {
            println!("  Could not generate tax report: {}\n", e);
        }
    }
    
    println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("✅ Portfolio analysis complete!");
    
    Ok(())
}
