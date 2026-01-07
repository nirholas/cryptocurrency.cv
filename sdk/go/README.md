# Free Crypto News Go SDK

100% FREE Go SDK for the Free Crypto News API. No API keys required!

## Installation

```bash
go get github.com/nirholas/free-crypto-news/sdk/go
```

## Usage

```go
package main

import (
    "fmt"
    "log"
    
    cryptonews "github.com/nirholas/free-crypto-news/sdk/go"
)

func main() {
    client := cryptonews.NewClient()
    
    // Get latest news
    articles, err := client.GetLatest(10)
    if err != nil {
        log.Fatal(err)
    }
    
    for _, article := range articles {
        fmt.Printf("📰 %s\n", article.Title)
        fmt.Printf("   %s • %s\n", article.Source, article.TimeAgo)
        fmt.Printf("   %s\n\n", article.Link)
    }
    
    // Search for specific topics
    results, _ := client.Search("ethereum,etf", 5)
    
    // Get DeFi news
    defi, _ := client.GetDeFi(5)
    
    // Get Bitcoin news
    btc, _ := client.GetBitcoin(5)
    
    // Get breaking news
    breaking, _ := client.GetBreaking(5)
    
    // Get trending topics
    trending, _ := client.GetTrending(10, 24)
    for _, topic := range trending.Trending {
        fmt.Printf("%s: %d mentions (%s)\n", topic.Topic, topic.Count, topic.Sentiment)
    }
    
    // Check API health
    health, _ := client.GetHealth()
    fmt.Printf("API Status: %s\n", health.Status)
}
```

## Analytics & Trends

```go
// Get API statistics
stats, _ := client.GetStats()
fmt.Printf("Total articles: %d\n", stats.TotalArticles)

// Analyze news with sentiment
analysis, _ := client.Analyze(20, "bitcoin", "bullish")
fmt.Printf("Market: %s\n", analysis.Summary.OverallSentiment)
```

## Historical & Sources

```go
// Get archived news
archive, _ := client.GetArchive("2024-01-15", "SEC", 20)

// Find original sources
origins, _ := client.GetOrigins("binance", "exchange", 10)
for _, item := range origins.Items {
    fmt.Printf("%s - Original: %s\n", item.Title, item.LikelyOriginalSource)
}
```

## Custom Base URL

For self-hosted instances:

```go
client := cryptonews.NewClientWithURL("https://your-instance.com")
```

## API Methods

| Method | Description |
|--------|-------------|
| `GetLatest(limit)` | Get latest news |
| `GetLatestFromSource(limit, source)` | Get news from specific source |
| `Search(keywords, limit)` | Search by keywords |
| `GetDeFi(limit)` | DeFi-specific news |
| `GetBitcoin(limit)` | Bitcoin-specific news |
| `GetBreaking(limit)` | Breaking news (last 2h) |
| `GetTrending(limit, hours)` | Trending topics |
| `GetStats()` | API statistics |
| `Analyze(limit, topic, sentiment)` | Sentiment analysis |
| `GetArchive(date, query, limit)` | Historical archive |
| `GetOrigins(query, category, limit)` | Find original sources |
| `GetSources()` | List all sources |
| `GetHealth()` | API health status |

## License

MIT
