package cryptonews

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

// Response bodies below are trimmed copies of what https://cryptocurrency.cv
// returns today, so the decoders are checked against the real wire format.
var routes = map[string]string{
	"/api/news":         `{"articles":[{"title":"T","link":"https://x/y","pubDate":"2026-11-20T19:10:33.000Z","source":"CNBC Crypto","sourceKey":"cnbc_crypto","category":"mainstream","timeAgo":"just now"}],"totalCount":1,"pagination":{"page":1,"perPage":1,"totalPages":1,"hasMore":false}}`,
	"/api/fear-greed":   `{"current":{"value":12,"valueClassification":"Extreme Fear","timestamp":1795132800000},"historical":[]}`,
	"/api/gas":          `{"slow":1.5,"standard":1.6,"fast":1.7,"instant":2.0,"baseFee":1.5,"unit":"gwei"}`,
	"/api/market/coins": `{"coins":[{"id":"bitcoin","current_price":58185.7}]}`,
	"/api/stats":        `{"summary":{"totalArticles":1543,"activeSources":96,"totalSources":359,"avgArticlesPerHour":64.3,"timeRange":"24h"},"bySource":[{"source":"A","articleCount":20,"percentage":40,"latestArticle":"x","latestTime":"t"}]}`,
	"/api/health":       `{"status":"healthy","timestamp":"t","version":"1.0.10","uptime":12,"checks":{"api":{"status":"healthy","responseTime":3}}}`,
	"/api/analyze":      `{"articles":[{"title":"a","sentiment":"bullish","sentimentScore":0.5,"topics":["Bitcoin"]},{"title":"b","sentiment":"bullish","topics":[]},{"title":"c","sentiment":"bullish","topics":[]},{"title":"d","sentiment":"bullish","topics":[]},{"title":"e","sentiment":"neutral","topics":[]}],"totalCount":5,"analysis":{"topTopics":[{"topic":"Bitcoin","count":1}],"sentimentBreakdown":{"bullish":4,"neutral":1},"overallSentiment":"bullish"}}`,
}

func testClient(t *testing.T) *Client {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/limited" {
			w.Header().Set("Retry-After", "7")
			w.WriteHeader(http.StatusTooManyRequests)
			return
		}
		body, ok := routes[r.URL.Path]
		if !ok {
			http.Error(w, "nope", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return NewClientWithURL(srv.URL)
}

func TestDecodesLiveShapes(t *testing.T) {
	c, ctx := testClient(t), context.Background()

	arts, err := c.GetLatest(ctx, 1)
	if err != nil || len(arts) != 1 || arts[0].SourceKey != "cnbc_crypto" {
		t.Fatalf("GetLatest: %v %+v", err, arts)
	}
	fg, err := c.GetFearGreed(ctx)
	if err != nil || fg.Value != 12 || fg.Classification != "Extreme Fear" {
		t.Fatalf("GetFearGreed: %v %+v", err, fg)
	}
	gas, err := c.GetGas(ctx)
	if err != nil || gas.Fast != 1.7 || gas.Instant != 2.0 {
		t.Fatalf("GetGas: %v %+v", err, gas)
	}
	m, err := c.GetMarket(ctx)
	if err != nil || len(m.Coins) != 1 {
		t.Fatalf("GetMarket: %v %+v", err, m)
	}
	st, err := c.GetStats(ctx)
	if err != nil || st.Summary.TotalArticles != 1543 || st.BySource[0].ArticleCount != 20 {
		t.Fatalf("GetStats: %v %+v", err, st)
	}
	h, err := c.GetHealth(ctx)
	if err != nil || h.Status != "healthy" || h.Checks["api"].ResponseTime != 3 {
		t.Fatalf("GetHealth: %v %+v", err, h)
	}
	an, err := c.Analyze(ctx, 5, "", "")
	if err != nil || an.Analysis.OverallSentiment != "bullish" || an.Articles[0].SentimentScore != 0.5 {
		t.Fatalf("Analyze: %v %+v", err, an)
	}
}

func TestTypedErrors(t *testing.T) {
	c, ctx := testClient(t), context.Background()

	var api *APIError
	if err := c.get(ctx, "/api/missing", &struct{}{}); !errors.As(err, &api) || api.StatusCode != 404 {
		t.Fatalf("want APIError 404, got %v", err)
	}
	var rl *RateLimitError
	if err := c.get(ctx, "/api/limited", &struct{}{}); !errors.As(err, &rl) || rl.RetryAfter != 7 {
		t.Fatalf("want RateLimitError 7s, got %v", err)
	}
	dead := NewClientWithURL("http://127.0.0.1:1")
	var ne *NetworkError
	if _, err := dead.GetLatest(ctx, 1); !errors.As(err, &ne) {
		t.Fatalf("want NetworkError, got %v", err)
	}
}

func TestCoinSentiment(t *testing.T) {
	c := testClient(t)
	res, err := c.GetCoinSentiment(context.Background(), &GetCoinSentimentOptions{Coins: CoinPairs{"BTCUSD": "Bitcoin"}})
	if err != nil {
		t.Fatal(err)
	}
	r := res["BTCUSD"]
	if r.Articles != 5 || r.Pos != 80 || r.Signal != "bullish" || !r.Tradeable {
		t.Fatalf("unexpected result %+v", r)
	}
}

// TestLiveAPI hits the hosted API; enable with CRYPTONEWS_LIVE=1.
func TestLiveAPI(t *testing.T) {
	if os.Getenv("CRYPTONEWS_LIVE") == "" {
		t.Skip("set CRYPTONEWS_LIVE=1 to run against https://cryptocurrency.cv")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	c := NewClient()
	if a, err := c.GetLatest(ctx, 1); err != nil || len(a) == 0 {
		t.Fatalf("live GetLatest: %v", err)
	}
	if fg, err := c.GetFearGreed(ctx); err != nil || fg.Classification == "" {
		t.Fatalf("live GetFearGreed: %v %+v", err, fg)
	}
	if m, err := c.GetMarket(ctx); err != nil || len(m.Coins) == 0 {
		t.Fatalf("live GetMarket: %v", err)
	}
	if s, err := c.GetStats(ctx); err != nil || s.Summary.TotalArticles == 0 {
		t.Fatalf("live GetStats: %v", err)
	}
}
