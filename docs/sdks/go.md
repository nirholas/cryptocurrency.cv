# Go SDK

The Go SDK provides a performant, idiomatic Go client for the Free Crypto News API.

## Installation

```bash
go get github.com/nirholas/free-crypto-news/sdk/go
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"

    fcn "github.com/nirholas/free-crypto-news/sdk/go"
)

func main() {
    // Create client (no API key needed!)
    client := fcn.NewClient()

    // Get latest news
    news, err := client.GetNews(fcn.NewsOptions{Limit: 10})
    if err != nil {
        log.Fatal(err)
    }

    for _, article := range news.Articles {
        fmt.Printf("%s - %s\n", article.Title, article.Source)
    }
}
```

## Configuration

```go
// Default client
client := fcn.NewClient()

// Custom configuration
client := fcn.NewClient(
    fcn.WithBaseURL("https://cryptocurrency.cv"),
    fcn.WithTimeout(30 * time.Second),
    fcn.WithHTTPClient(customHTTPClient),
)
```

## API Reference

### News Methods

```go
// Get latest news
news, err := client.GetNews(fcn.NewsOptions{
    Limit:    10,
    Source:   "coindesk",    // optional
    Category: "defi",        // optional
    Lang:     "en",          // optional
})

// Search news
results, err := client.SearchNews("bitcoin etf", fcn.SearchOptions{
    Limit: 10,
})

// Get breaking news
breaking, err := client.GetBreakingNews(fcn.NewsOptions{Limit: 5})

// Get DeFi news
defi, err := client.GetDefiNews(fcn.NewsOptions{Limit: 10})

// Get Bitcoin news
btc, err := client.GetBitcoinNews(fcn.NewsOptions{Limit: 10})
```

### Market Methods

```go
// Get market overview
market, err := client.GetMarket()
fmt.Printf("BTC: $%.2f\n", market.Bitcoin.Price)

// Get specific coin
coin, err := client.GetCoin("ethereum")

// Get Fear & Greed Index
fg, err := client.GetFearGreedIndex()
fmt.Printf("Fear & Greed: %d (%s)\n", fg.Value, fg.Classification)

// Get trending coins
trending, err := client.GetTrending()
```

### Category Filter

```go
// Get institutional research
institutional, err := client.GetNews(fcn.NewsOptions{
    Category: "institutional",
    Limit:    20,
})

// Available categories
categories, err := client.GetCategories()
for _, cat := range categories.Categories {
    fmt.Printf("%s: %d sources\n", cat.ID, cat.SourceCount)
}
```

## Types

```go
type Article struct {
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Link        string    `json:"link"`
    PubDate     time.Time `json:"pubDate"`
    Source      string    `json:"source"`
    Category    string    `json:"category"`
    TimeAgo     string    `json:"timeAgo"`
}

type NewsResponse struct {
    Articles   []Article `json:"articles"`
    TotalCount int       `json:"totalCount"`
    Sources    []string  `json:"sources"`
    FetchedAt  time.Time `json:"fetchedAt"`
}

type MarketData struct {
    Bitcoin  CoinData `json:"bitcoin"`
    Ethereum CoinData `json:"ethereum"`
}

type CoinData struct {
    ID        string  `json:"id"`
    Symbol    string  `json:"symbol"`
    Name      string  `json:"name"`
    Price     float64 `json:"price"`
    Change24h float64 `json:"change24h"`
    MarketCap float64 `json:"marketCap"`
    Volume24h float64 `json:"volume24h"`
}

type FearGreedIndex struct {
    Value          int       `json:"value"`
    Classification string    `json:"classification"`
    Timestamp      time.Time `json:"timestamp"`
}
```

## Error Handling

```go
news, err := client.GetNews(fcn.NewsOptions{Limit: 10})
if err != nil {
    var apiErr *fcn.APIError
    if errors.As(err, &apiErr) {
        fmt.Printf("API Error: %d - %s\n", apiErr.StatusCode, apiErr.Message)
    } else if errors.Is(err, fcn.ErrTimeout) {
        fmt.Println("Request timed out")
    } else {
        fmt.Printf("Unknown error: %v\n", err)
    }
    return
}
```

## Concurrency

```go
import "golang.org/x/sync/errgroup"

func fetchAll(client *fcn.Client) error {
    var g errgroup.Group
    var news *fcn.NewsResponse
    var market *fcn.MarketData
    var fearGreed *fcn.FearGreedIndex

    g.Go(func() error {
        var err error
        news, err = client.GetNews(fcn.NewsOptions{Limit: 10})
        return err
    })

    g.Go(func() error {
        var err error
        market, err = client.GetMarket()
        return err
    })

    g.Go(func() error {
        var err error
        fearGreed, err = client.GetFearGreedIndex()
        return err
    })

    if err := g.Wait(); err != nil {
        return err
    }

    fmt.Printf("News: %d articles\n", len(news.Articles))
    fmt.Printf("BTC: $%.2f\n", market.Bitcoin.Price)
    fmt.Printf("Fear & Greed: %d\n", fearGreed.Value)
    return nil
}
```

## Context Support

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

news, err := client.GetNewsWithContext(ctx, fcn.NewsOptions{Limit: 10})
if err != nil {
    if errors.Is(err, context.DeadlineExceeded) {
        fmt.Println("Request timed out")
    }
}
```

## Example: HTTP Server

```go
package main

import (
    "encoding/json"
    "net/http"

    fcn "github.com/nirholas/free-crypto-news/sdk/go"
)

func main() {
    client := fcn.NewClient()

    http.HandleFunc("/api/news", func(w http.ResponseWriter, r *http.Request) {
        news, err := client.GetNews(fcn.NewsOptions{Limit: 10})
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(news)
    })

    http.ListenAndServe(":8080", nil)
}
```

## Source Code

View the full Go SDK: [sdk/go](https://github.com/nirholas/free-crypto-news/tree/main/sdk/go)
