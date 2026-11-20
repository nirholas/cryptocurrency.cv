# Go SDK

The Go SDK is a dependency-free, context-aware client for the Free Crypto News API. It lives in [sdk/go](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/go) and the package name is `cryptonews`.

## Installation

```bash
go get github.com/nirholas/cryptocurrency.cv/sdk/go
```

## Quick Start

```go
package main

import (
	"context"
	"fmt"
	"log"

	cryptonews "github.com/nirholas/cryptocurrency.cv/sdk/go"
)

func main() {
	client := cryptonews.NewClient() // no API key needed

	news, err := client.GetLatest(context.Background(), 10)
	if err != nil {
		log.Fatal(err)
	}
	for _, article := range news.Articles {
		fmt.Printf("%s - %s\n", article.Title, article.Source)
	}
}
```

Every request method takes a `context.Context` as its first argument, so cancellation and deadlines are controlled by the caller.

## Configuration

```go
// Default client (https://cryptocurrency.cv)
client := cryptonews.NewClient()

// Self-hosted or staging instance
client := cryptonews.NewClientWithURL("https://example.com")
```

## API Reference

### News

```go
ctx := context.Background()

// Filtered news: limit, category, search (empty string skips a filter)
news, err := client.GetNews(ctx, 10, "defi", "")

// Latest headlines, optionally from one source
latest, err := client.GetLatest(ctx, 10)
fromSource, err := client.GetLatestFromSource(ctx, 10, "coindesk")

// Keyword search (comma-separated keywords)
results, err := client.Search(ctx, "bitcoin,etf", 10)

// Topic feeds
defi, err := client.GetDeFi(ctx, 10)
btc, err := client.GetBitcoin(ctx, 10)
breaking, err := client.GetBreaking(ctx, 5)

// Trending topics over the last N hours
trending, err := client.GetTrending(ctx, 10, 24)

// News sources
sources, err := client.GetSources(ctx)
```

### Market

```go
// Prices for a coin: map of coin id to currency to value
prices, err := client.GetPrices(ctx, "bitcoin")
fmt.Println(prices)

// Market overview: top coins as generic maps
market, err := client.GetMarket(ctx)
for _, coin := range market.Coins {
	fmt.Println(coin["id"], coin["current_price"])
}

// Fear & Greed Index
fg, err := client.GetFearGreed(ctx)
fmt.Printf("Fear & Greed: %d (%s)\n", fg.Value, fg.Classification)

// Gas prices
gas, err := client.GetGas(ctx)
fmt.Printf("Fast: %v Standard: %v Slow: %v\n", gas.Fast, gas.Standard, gas.Slow)
```

### Analytics, health and archive

```go
health, err := client.GetHealth(ctx)
fmt.Println(health.Status, health.Version)

stats, err := client.GetStats(ctx)
fmt.Println(stats.Summary)

// Analyze: limit, topic, sentiment (empty string skips a filter)
analysis, err := client.Analyze(ctx, 20, "", "positive")
fmt.Println(analysis.TotalCount, analysis.Analysis.OverallSentiment)

// Archive: date (YYYY-MM-DD), query, limit
archive, err := client.GetArchive(ctx, "2025-01-15", "bitcoin", 20)
fmt.Println(archive.Total, len(archive.Articles))

// Origins of a story: query, category, limit
origins, err := client.GetOrigins(ctx, "bitcoin", "", 10)
fmt.Println(origins.Analyzed, len(origins.Articles))
```

### Per-coin sentiment

`GetCoinSentiment` fans out across coins with a bounded worker pool and returns a result per pair symbol (for example `BTCUSD`).

```go
results, err := client.GetCoinSentiment(ctx, &cryptonews.GetCoinSentimentOptions{
	Coins:         cryptonews.CoinPairs{"BTCUSD": "Bitcoin", "ETHUSD": "Ethereum"}, // defaults to DefaultCoinPairs
	Limit:         50,
	MinArticles:   3,
	MinConfidence: 0.5,
	Workers:       4,
})
if err != nil {
	log.Fatal(err)
}
for pair, r := range results {
	if r.Err != nil {
		fmt.Printf("%s: %v\n", pair, r.Err)
		continue
	}
	fmt.Printf("%s: %s (score %.2f, confidence %.2f, tradeable %v)\n",
		pair, r.Signal, r.Score, r.Confidence, r.Tradeable)
}
```

## Types

```go
type Article struct {
	Title       string `json:"title"`
	Link        string `json:"link"`
	Description string `json:"description,omitempty"`
	PubDate     string `json:"pubDate"`
	Source      string `json:"source"`
	SourceKey   string `json:"sourceKey"`
	Category    string `json:"category"`
	TimeAgo     string `json:"timeAgo"`
}

type NewsResponse struct {
	Articles   []Article   `json:"articles"`
	TotalCount int         `json:"totalCount"`
	Sources    []string    `json:"sources"`
	FetchedAt  string      `json:"fetchedAt"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

type PriceData map[string]map[string]float64

type MarketOverview struct {
	Coins []map[string]interface{} `json:"coins"`
}

type FearGreedIndex struct {
	Value          int
	Classification string
	Timestamp      int64
}
```

See [sdk/go/cryptonews.go](https://github.com/nirholas/cryptocurrency.cv/blob/main/sdk/go/cryptonews.go) for every response type.

## Error Handling

All errors wrap a typed value, so use `errors.As` to branch on them.

```go
news, err := client.GetLatest(ctx, 10)
if err != nil {
	var rl *cryptonews.RateLimitError
	var apiErr *cryptonews.APIError
	var netErr *cryptonews.NetworkError

	switch {
	case errors.As(err, &rl):
		fmt.Printf("rate limited, retry after %.0fs\n", rl.RetryAfter)
	case errors.As(err, &apiErr):
		fmt.Printf("API error %d: %s\n", apiErr.StatusCode, apiErr.Message)
	case errors.As(err, &netErr):
		fmt.Printf("network error: %v\n", netErr)
	case errors.Is(err, context.DeadlineExceeded):
		fmt.Println("request timed out")
	default:
		fmt.Printf("unexpected error: %v\n", err)
	}
	return
}
fmt.Println(len(news.Articles))
```

## Concurrency

The client is safe for concurrent use.

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, client *cryptonews.Client) error {
	g, ctx := errgroup.WithContext(ctx)

	var news *cryptonews.NewsResponse
	var fearGreed *cryptonews.FearGreedIndex

	g.Go(func() (err error) {
		news, err = client.GetLatest(ctx, 10)
		return err
	})
	g.Go(func() (err error) {
		fearGreed, err = client.GetFearGreed(ctx)
		return err
	})

	if err := g.Wait(); err != nil {
		return err
	}
	fmt.Printf("News: %d articles\n", len(news.Articles))
	fmt.Printf("Fear & Greed: %d\n", fearGreed.Value)
	return nil
}
```

## Timeouts

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

news, err := client.GetLatest(ctx, 10)
if errors.Is(err, context.DeadlineExceeded) {
	fmt.Println("request timed out")
}
```

## Example: HTTP Server

```go
package main

import (
	"encoding/json"
	"net/http"

	cryptonews "github.com/nirholas/cryptocurrency.cv/sdk/go"
)

func main() {
	client := cryptonews.NewClient()

	http.HandleFunc("/news", func(w http.ResponseWriter, r *http.Request) {
		news, err := client.GetLatest(r.Context(), 10)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadGateway)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(news)
	})

	http.ListenAndServe(":8080", nil)
}
```

## Source Code

View the full Go SDK: [sdk/go](https://github.com/nirholas/cryptocurrency.cv/tree/main/sdk/go)
