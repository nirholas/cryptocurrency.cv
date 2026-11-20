# Free Crypto News Go SDK

Production-ready Go client for the [Free Crypto News API](https://cryptocurrency.cv). No API keys required!

## Installation

```bash
go get github.com/nirholas/free-crypto-news/sdk/go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    cryptonews "github.com/nirholas/free-crypto-news/sdk/go"
)

func main() {
    client := cryptonews.NewClient()
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Get latest news
    articles, err := client.GetLatest(ctx, 10)
    if err != nil {
        log.Fatal(err)
    }

    for _, article := range articles {
        fmt.Printf("%s\n  %s • %s\n  %s\n\n", article.Title, article.Source, article.TimeAgo, article.Link)
    }
}
```

## Context Support

All methods accept `context.Context` as the first argument for cancellation and timeout:

```go
// With timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
articles, err := client.GetLatest(ctx, 10)

// With cancellation
ctx, cancel := context.WithCancel(context.Background())
go func() {
    time.Sleep(2 * time.Second)
    cancel()
}()
articles, err := client.GetLatest(ctx, 10)
```

## Market Data

```go
// Cryptocurrency prices
prices, _ := client.GetPrices(ctx, "bitcoin")

// Market overview
market, _ := client.GetMarket(ctx)

// Fear & Greed Index
fg, _ := client.GetFearGreed(ctx)
fmt.Printf("Fear & Greed: %d (%s)\n", fg.Value, fg.Classification)

// Ethereum gas prices
gas, _ := client.GetGas(ctx)
fmt.Printf("Gas: fast=%.0f standard=%.0f\n", gas.Fast, gas.Standard)
```

## News Endpoints

```go
// Search
results, _ := client.Search(ctx, "ethereum,etf", 5)

// DeFi news
defi, _ := client.GetDeFi(ctx, 5)

// Bitcoin news
btc, _ := client.GetBitcoin(ctx, 5)

// Breaking news
breaking, _ := client.GetBreaking(ctx, 5)

// Trending topics
trending, _ := client.GetTrending(ctx, 10, 24)
for _, topic := range trending.Trending {
    fmt.Printf("%s: %d mentions (%s)\n", topic.Topic, topic.Count, topic.Sentiment)
}
```

## Error Handling

The SDK provides typed errors for structured error handling:

```go
import "errors"

articles, err := client.GetLatest(ctx, 5)
if err != nil {
    var rateLimitErr *cryptonews.RateLimitError
    var apiErr *cryptonews.APIError
    var netErr *cryptonews.NetworkError

    switch {
    case errors.As(err, &rateLimitErr):
        fmt.Printf("Rate limited — retry after %.0fs\n", rateLimitErr.RetryAfter)
    case errors.As(err, &apiErr):
        fmt.Printf("API error (HTTP %d): %s\n", apiErr.StatusCode, apiErr.Body)
    case errors.As(err, &netErr):
        fmt.Printf("Network error: %s\n", netErr.Message)
    }
}
```

Error hierarchy:

```
SDKError            ← base, implements error + Unwrap()
├── NetworkError    ← connection failures, DNS, timeouts
└── APIError        ← non-2xx HTTP responses
    └── RateLimitError  ← HTTP 429, includes RetryAfter
```

## Analytics

```go
// API statistics
stats, _ := client.GetStats(ctx)
fmt.Printf("Total articles: %d\n", stats.TotalArticles)

// Sentiment analysis
analysis, _ := client.Analyze(ctx, 20, "bitcoin", "bullish")
fmt.Printf("Market: %s\n", analysis.Summary.OverallSentiment)
```

## Historical & Sources

```go
// Archived news
archive, _ := client.GetArchive(ctx, "2024-01-15", "SEC", 20)

// Find original sources
origins, _ := client.GetOrigins(ctx, "binance", "exchange", 10)
for _, item := range origins.Items {
    fmt.Printf("%s — Original: %s\n", item.Title, item.LikelyOriginalSource)
}

// List all sources
sources, _ := client.GetSources(ctx)
```

## Examples

See the [examples/](examples/) directory for runnable programs:

- [basic](examples/basic/main.go) — fetch news, search, trending, prices
- [errors](examples/errors/main.go) — typed error handling

## Custom Base URL

```go
client := cryptonews.NewClientWithURL("https://your-instance.com")
```

## API Methods

All methods require `context.Context` as the first argument.

| Method | Description |
|--------|-------------|
| `GetLatest(ctx, limit)` | Get latest news |
| `GetLatestFromSource(ctx, limit, source)` | News from specific source |
| `GetNews(ctx, limit, category, search)` | News with optional filters |
| `Search(ctx, keywords, limit)` | Search by keywords |
| `GetPrices(ctx, coin)` | Cryptocurrency prices |
| `GetMarket(ctx)` | Market overview (top coins, `/api/market/coins`) |
| `GetFearGreed(ctx)` | Fear & Greed Index |
| `GetGas(ctx)` | Ethereum gas prices |
| `GetDeFi(ctx, limit)` | DeFi-specific news |
| `GetBitcoin(ctx, limit)` | Bitcoin-specific news |
| `GetBreaking(ctx, limit)` | Breaking news (last 2h) |
| `GetTrending(ctx, limit, hours)` | Trending topics |
| `GetStats(ctx)` | API statistics |
| `Analyze(ctx, limit, topic, sentiment)` | Sentiment analysis |
| `GetArchive(ctx, date, query, limit)` | Historical archive |
| `GetOrigins(ctx, query, category, limit)` | Find original sources |
| `GetSources(ctx)` | List all sources |
| `GetHealth(ctx)` | API health status |
| `GetCoinSentiment(ctx, opts)` | Per-coin sentiment with trade signals |

## License

MIT

