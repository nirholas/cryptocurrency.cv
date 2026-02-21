// Package cryptonews provides a client for the Free Crypto News API.
// 100% FREE - no API keys required!
//
// Usage:
//
//	client := cryptonews.NewClient()
//	articles, err := client.GetLatest(10)
//	if err != nil {
//	    log.Fatal(err)
//	}
//	for _, article := range articles {
//	    fmt.Printf("%s - %s\n", article.Title, article.Source)
//	}
package cryptonews

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const DefaultBaseURL = "https://cryptocurrency.cv"

// Article represents a news article
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

// NewsResponse is the API response for news endpoints
type NewsResponse struct {
	Articles   []Article `json:"articles"`
	TotalCount int       `json:"totalCount"`
	Sources    []string  `json:"sources"`
	FetchedAt  string    `json:"fetchedAt"`
	Pagination *struct {
		Page       int  `json:"page"`
		PerPage    int  `json:"perPage"`
		TotalPages int  `json:"totalPages"`
		HasMore    bool `json:"hasMore"`
	} `json:"pagination,omitempty"`
}

// SourceInfo represents a news source
type SourceInfo struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	URL      string `json:"url"`
	Category string `json:"category"`
	Status   string `json:"status"`
}

// SourcesResponse is the API response for sources endpoint
type SourcesResponse struct {
	Sources []SourceInfo `json:"sources"`
}

// TrendingTopic represents a trending topic
type TrendingTopic struct {
	Topic           string   `json:"topic"`
	Count           int      `json:"count"`
	Sentiment       string   `json:"sentiment"`
	RecentHeadlines []string `json:"recentHeadlines"`
}

// TrendingResponse is the API response for trending endpoint
type TrendingResponse struct {
	Trending         []TrendingTopic `json:"trending"`
	TimeWindow       string          `json:"timeWindow"`
	ArticlesAnalyzed int             `json:"articlesAnalyzed"`
	FetchedAt        string          `json:"fetchedAt"`
}

// HealthSource represents health of a single source
type HealthSource struct {
	Source       string `json:"source"`
	Status       string `json:"status"`
	ResponseTime int    `json:"responseTime"`
	Error        string `json:"error,omitempty"`
}

// HealthResponse is the API response for health endpoint
type HealthResponse struct {
	Status            string `json:"status"`
	Timestamp         string `json:"timestamp"`
	TotalResponseTime int    `json:"totalResponseTime"`
	Summary           struct {
		Healthy  int `json:"healthy"`
		Degraded int `json:"degraded"`
		Down     int `json:"down"`
		Total    int `json:"total"`
	} `json:"summary"`
	Sources []HealthSource `json:"sources"`
}

// Client is the Free Crypto News API client
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient creates a new API client with default settings
func NewClient() *Client {
	return &Client{
		BaseURL: DefaultBaseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// NewClientWithURL creates a client with a custom base URL
func NewClientWithURL(baseURL string) *Client {
	client := NewClient()
	client.BaseURL = baseURL
	return client
}

func (c *Client) get(endpoint string, result interface{}) error {
	resp, err := c.HTTPClient.Get(c.BaseURL + endpoint)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error %d: %s", resp.StatusCode, string(body))
	}

	return json.NewDecoder(resp.Body).Decode(result)
}

// GetLatest fetches the latest news articles
func (c *Client) GetLatest(limit int) ([]Article, error) {
	var resp NewsResponse
	err := c.get(fmt.Sprintf("/api/news?limit=%d", limit), &resp)
	if err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// GetLatestFromSource fetches news from a specific source
func (c *Client) GetLatestFromSource(limit int, source string) ([]Article, error) {
	var resp NewsResponse
	err := c.get(fmt.Sprintf("/api/news?limit=%d&source=%s", limit, url.QueryEscape(source)), &resp)
	if err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// Search searches news by keywords
func (c *Client) Search(keywords string, limit int) ([]Article, error) {
	var resp NewsResponse
	err := c.get(fmt.Sprintf("/api/search?q=%s&limit=%d", url.QueryEscape(keywords), limit), &resp)
	if err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// GetDeFi fetches DeFi-specific news
func (c *Client) GetDeFi(limit int) ([]Article, error) {
	var resp NewsResponse
	err := c.get(fmt.Sprintf("/api/defi?limit=%d", limit), &resp)
	if err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// GetBitcoin fetches Bitcoin-specific news
func (c *Client) GetBitcoin(limit int) ([]Article, error) {
	var resp NewsResponse
	err := c.get(fmt.Sprintf("/api/bitcoin?limit=%d", limit), &resp)
	if err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// GetBreaking fetches breaking news from the last 2 hours
func (c *Client) GetBreaking(limit int) ([]Article, error) {
	var resp NewsResponse
	err := c.get(fmt.Sprintf("/api/breaking?limit=%d", limit), &resp)
	if err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// GetTrending fetches trending topics
func (c *Client) GetTrending(limit int, hours int) (*TrendingResponse, error) {
	var resp TrendingResponse
	err := c.get(fmt.Sprintf("/api/trending?limit=%d&hours=%d", limit, hours), &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetSources fetches all available news sources
func (c *Client) GetSources() ([]SourceInfo, error) {
	var resp SourcesResponse
	err := c.get("/api/sources", &resp)
	if err != nil {
		return nil, err
	}
	return resp.Sources, nil
}

// GetHealth checks API health status
func (c *Client) GetHealth() (*HealthResponse, error) {
	var resp HealthResponse
	err := c.get("/api/health", &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// StatsResponse is the API response for stats endpoint
type StatsResponse struct {
	TotalArticles      int            `json:"total_articles"`
	ArticlesBySource   map[string]int `json:"articles_by_source"`
	ArticlesByCategory map[string]int `json:"articles_by_category"`
	LastUpdated        string         `json:"last_updated"`
}

// GetStats fetches API statistics
func (c *Client) GetStats() (*StatsResponse, error) {
	var resp StatsResponse
	err := c.get("/api/stats", &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// AnalyzedArticle represents an article with sentiment analysis
type AnalyzedArticle struct {
	Article
	Topics         []string `json:"topics"`
	Sentiment      string   `json:"sentiment"`
	SentimentScore float64  `json:"sentiment_score"`
}

// AnalyzeResponse is the API response for analyze endpoint
type AnalyzeResponse struct {
	Articles []AnalyzedArticle `json:"articles"`
	Summary  struct {
		OverallSentiment string   `json:"overall_sentiment"`
		BullishCount     int      `json:"bullish_count"`
		BearishCount     int      `json:"bearish_count"`
		NeutralCount     int      `json:"neutral_count"`
		TopTopics        []string `json:"top_topics"`
	} `json:"summary"`
}

// Analyze fetches news with sentiment analysis
func (c *Client) Analyze(limit int, topic string, sentiment string) (*AnalyzeResponse, error) {
	endpoint := fmt.Sprintf("/api/analyze?limit=%d", limit)
	if topic != "" {
		endpoint += "&topic=" + url.QueryEscape(topic)
	}
	if sentiment != "" {
		endpoint += "&sentiment=" + sentiment
	}
	var resp AnalyzeResponse
	err := c.get(endpoint, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// ArchiveResponse is the API response for archive endpoint
type ArchiveResponse struct {
	Articles   []Article `json:"articles"`
	Date       string    `json:"date"`
	TotalCount int       `json:"totalCount"`
}

// GetArchive fetches archived historical news
func (c *Client) GetArchive(date string, query string, limit int) (*ArchiveResponse, error) {
	endpoint := fmt.Sprintf("/api/archive?limit=%d", limit)
	if date != "" {
		endpoint += "&date=" + date
	}
	if query != "" {
		endpoint += "&q=" + url.QueryEscape(query)
	}
	var resp ArchiveResponse
	err := c.get(endpoint, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// OriginItem represents an article with original source information
type OriginItem struct {
	Title                  string `json:"title"`
	Link                   string `json:"link"`
	Source                 string `json:"source"`
	LikelyOriginalSource   string `json:"likely_original_source"`
	OriginalSourceCategory string `json:"original_source_category"`
	Confidence             string `json:"confidence"`
}

// OriginsResponse is the API response for origins endpoint
type OriginsResponse struct {
	Items      []OriginItem   `json:"items"`
	TotalCount int            `json:"totalCount"`
	Categories map[string]int `json:"categories"`
}

// GetOrigins finds original sources of news
func (c *Client) GetOrigins(query string, category string, limit int) (*OriginsResponse, error) {
	endpoint := fmt.Sprintf("/api/origins?limit=%d", limit)
	if query != "" {
		endpoint += "&q=" + url.QueryEscape(query)
	}
	if category != "" {
		endpoint += "&category=" + category
	}
	var resp OriginsResponse
	err := c.get(endpoint, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// CoinPairs maps trading pair symbols to search keywords.
// e.g. {"BTCUSD": "Bitcoin", "ETHUSD": "Ethereum"}
type CoinPairs map[string]string

// DefaultCoinPairs is the default set of 19 trading pairs used by GetCoinSentiment.
// Inspired by CyberPunkMetalHead/cryptocurrency-news-analysis.
var DefaultCoinPairs = CoinPairs{
	"BTCUSD":   "Bitcoin",
	"ETHUSD":   "Ethereum",
	"LTCUSD":   "Litecoin",
	"XRPUSD":   "Ripple",
	"SOLUSD":   "Solana",
	"BNBUSD":   "Binance",
	"ADAUSD":   "Cardano",
	"AVAXUSD":  "Avalanche",
	"DOTUSD":   "Polkadot",
	"MATICUSD": "Polygon",
	"DOGEUSD":  "Dogecoin",
	"TRXUSD":   "Tron",
	"XLMUSD":   "Stellar Lumens",
	"XMRUSD":   "Monero",
	"ZECUSD":   "Zcash",
	"BATUSD":   "Basic Attention Token",
	"EOSUSD":   "EOS",
	"NEOUSD":   "NEO",
	"ETCUSD":   "Ethereum Classic",
}

// CoinSentimentResult holds the per-coin sentiment output from GetCoinSentiment.
type CoinSentimentResult struct {
	// Keyword is the search term used to fetch articles.
	Keyword string `json:"keyword"`
	// Articles is the number of articles analysed.
	Articles int `json:"articles"`
	// Pos is the percentage of bullish/very_bullish articles.
	Pos float64 `json:"pos"`
	// Mid is the percentage of neutral articles.
	Mid float64 `json:"mid"`
	// Neg is the percentage of bearish/very_bearish articles.
	Neg float64 `json:"neg"`
	// Score is the weighted average: -1.0 (strongly bearish) to +1.0 (strongly bullish).
	// very_bullish=+1, bullish=+0.5, neutral=0, bearish=-0.5, very_bearish=-1.
	Score float64 `json:"score"`
	// Signal is a 5-tier label derived from Score:
	// very_bullish | bullish | neutral | bearish | very_bearish | error
	Signal string `json:"signal"`
	// Confidence is a composite score 0-100:
	// confidence = volumeWeight * marginWeight * 100.
	// A single-article signal can never reach the default tradeable threshold.
	Confidence float64 `json:"confidence"`
	// Tradeable is true only when Articles >= MinArticles AND Confidence >= MinConfidence.
	Tradeable bool `json:"tradeable"`
	// Reason is a human-readable suppression message when Tradeable=false.
	// Empty when Tradeable=true.
	Reason string `json:"reason"`
	// Error is set when the fetch for this coin failed.
	Error string `json:"error,omitempty"`
}

// scoreSignal maps a graded score to a 5-tier signal label.
func scoreSignal(score float64) string {
	switch {
	case score >= 0.5:
		return "very_bullish"
	case score >= 0.15:
		return "bullish"
	case score > -0.15:
		return "neutral"
	case score > -0.5:
		return "bearish"
	default:
		return "very_bearish"
	}
}

// round rounds f to d decimal places.
func round(f float64, d int) float64 {
	p := 1.0
	for i := 0; i < d; i++ {
		p *= 10
	}
	return float64(int64(f*p+0.5)) / p
}

// maxFloat returns the larger of two float64 values.
func maxFloat(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

// minFloat returns the smaller of two float64 values.
func minFloat(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

// sortDesc sorts three float64 values in descending order.
func sortDesc(a, b, c float64) [3]float64 {
	if a < b {
		a, b = b, a
	}
	if a < c {
		a, c = c, a
	}
	if b < c {
		b, c = c, b
	}
	return [3]float64{a, b, c}
}

// GetCoinSentimentOptions configures the behaviour of GetCoinSentiment.
type GetCoinSentimentOptions struct {
	// Coins is the map of trading pair → search keyword.
	// Defaults to DefaultCoinPairs when nil.
	Coins CoinPairs
	// Limit is the maximum number of articles to fetch per coin (default 30).
	Limit int
	// MinArticles is the minimum number of articles required for Tradeable=true (default 5).
	// A single bullish headline will NOT produce Tradeable=true.
	MinArticles int
	// MinConfidence is the minimum confidence score (0-100) for Tradeable=true (default 20).
	MinConfidence float64
	// Workers is the maximum number of concurrent goroutines (default 8).
	// Set to 1 to disable concurrency.
	Workers int
}

// GetCoinSentiment calculates per-coin sentiment with confidence weighting and
// trade filtering. All coins are fetched concurrently (up to Workers goroutines
// in parallel), so a 19-coin scan takes approximately ceil(19/workers)
// round-trips of wall-clock latency rather than 19 serial requests.
//
// Confidence formula:
//
//	confidence = volumeWeight × marginWeight × 100
//	  - volumeWeight: 0→1 as article count reaches MinArticles. A single
//	    article can never exceed 1/MinArticles on this axis alone.
//	  - marginWeight: normalised %-gap between dominant and second bucket.
//	    A 50/49 split produces near-zero weight.
//
// Signal is derived from a graded score (-1 … +1) giving 5 tiers that match
// the API's own vocabulary: very_bullish / bullish / neutral / bearish / very_bearish.
//
// Example:
//
//	report, err := client.GetCoinSentiment(&GetCoinSentimentOptions{
//	    Coins: CoinPairs{"BTCUSD": "Bitcoin", "ETHUSD": "Ethereum"},
//	})
//	for pair, data := range report {
//	    if data.Tradeable {
//	        fmt.Printf("TRADE %s: %s conf=%.1f\n", pair, data.Signal, data.Confidence)
//	    } else {
//	        fmt.Printf("SKIP  %s: %s\n", pair, data.Reason)
//	    }
//	}
func (c *Client) GetCoinSentiment(opts *GetCoinSentimentOptions) (map[string]*CoinSentimentResult, error) {
	if opts == nil {
		opts = &GetCoinSentimentOptions{}
	}
	coins := opts.Coins
	if coins == nil {
		coins = DefaultCoinPairs
	}
	limit := opts.Limit
	if limit <= 0 {
		limit = 30
	}
	minArticles := opts.MinArticles
	if minArticles <= 0 {
		minArticles = 5
	}
	minConfidence := opts.MinConfidence
	if minConfidence <= 0 {
		minConfidence = 20.0
	}
	workers := opts.Workers
	if workers <= 0 {
		workers = 8
	}

	type job struct {
		pair    string
		keyword string
	}
	type resultEntry struct {
		pair   string
		result *CoinSentimentResult
	}

	// Build ordered job list.
	jobs := make([]job, 0, len(coins))
	for pair, kw := range coins {
		jobs = append(jobs, job{pair, kw})
	}

	// Score map for the 5 sentiment labels.
	scoreMap := map[string]float64{
		"very_bullish": +1.0,
		"bullish":      +0.5,
		"neutral":       0.0,
		"bearish":      -0.5,
		"very_bearish": -1.0,
	}
	bullish := map[string]bool{"very_bullish": true, "bullish": true}
	bearish := map[string]bool{"very_bearish": true, "bearish": true}

	sem := make(chan struct{}, workers)
	resultCh := make(chan resultEntry, len(jobs))
	var wg sync.WaitGroup

	for _, j := range jobs {
		wg.Add(1)
		go func(j job) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			res := &CoinSentimentResult{Keyword: j.keyword}

			data, err := c.Analyze(limit, j.keyword, "")
			if err != nil {
				res.Signal = "error"
				res.Error = err.Error()
				res.Reason = err.Error()
				resultCh <- resultEntry{j.pair, res}
				return
			}

			articles := data.Articles
			total := len(articles)
			res.Articles = total

			if total == 0 {
				res.Signal = "neutral"
				res.Reason = "no articles found"
				resultCh <- resultEntry{j.pair, res}
				return
			}

			pos, neg := 0, 0
			rawScore := 0.0
			for _, a := range articles {
				if bullish[a.Sentiment] {
					pos++
				} else if bearish[a.Sentiment] {
					neg++
				}
				rawScore += scoreMap[a.Sentiment]
			}
			mid := total - pos - neg

			f := float64(total)
			res.Pos = round(float64(pos)*100/f, 1)
			res.Mid = round(float64(mid)*100/f, 1)
			res.Neg = round(float64(neg)*100/f, 1)
			res.Score = round(rawScore/f, 4)
			res.Signal = scoreSignal(res.Score)

			volumeWeight := minFloat(f/float64(minArticles), 1.0)
			sorted := sortDesc(res.Pos, res.Mid, res.Neg)
			marginWeight := maxFloat(sorted[0]-sorted[1], 0) / 100.0
			res.Confidence = round(volumeWeight*marginWeight*100, 1)

			var reasons []string
			if total < minArticles {
				s := "s"
				if total == 1 {
					s = ""
				}
				reasons = append(reasons,
					fmt.Sprintf("only %d article%s found (min %d)", total, s, minArticles))
			}
			if res.Confidence < minConfidence {
				reasons = append(reasons,
					fmt.Sprintf("confidence %.1f below threshold %.1f", res.Confidence, minConfidence))
			}
			res.Tradeable = len(reasons) == 0
			res.Reason = strings.Join(reasons, "; ")

			resultCh <- resultEntry{j.pair, res}
		}(j)
	}

	wg.Wait()
	close(resultCh)

	result := make(map[string]*CoinSentimentResult, len(jobs))
	for entry := range resultCh {
		result[entry.pair] = entry.result
	}
	return result, nil
}
