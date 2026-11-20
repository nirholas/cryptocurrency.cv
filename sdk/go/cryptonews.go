// Copyright 2024-2026 nirholas. All rights reserved.
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// https://github.com/nirholas/cryptocurrency.cv

// Package cryptonews provides a client for the Free Crypto News API.
// The hosted API at https://cryptocurrency.cv is free to use and needs no API key.
//
// All methods accept a context.Context for cancellation and timeout control.
//
// Usage:
//
//	client := cryptonews.NewClient()
//	articles, err := client.GetLatest(context.Background(), 10)
//	if err != nil {
//	    log.Fatal(err)
//	}
//	for _, article := range articles {
//	    fmt.Printf("%s - %s\n", article.Title, article.Source)
//	}
package cryptonews

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

// DefaultBaseURL is the hosted API.
const DefaultBaseURL = "https://cryptocurrency.cv"

// ERROR TYPES

// SDKError is the base error type for all SDK errors.
type SDKError struct {
	Message string
	Cause   error
}

func (e *SDKError) Error() string { return e.Message }
func (e *SDKError) Unwrap() error { return e.Cause }

// NetworkError is returned when a network-level failure occurs
// (connection refused, DNS resolution, timeout).
type NetworkError struct {
	SDKError
}

// APIError is returned when the API returns a non-2xx status code.
type APIError struct {
	SDKError
	StatusCode int
	Body       string
}

// RateLimitError is returned when the API returns HTTP 429.
type RateLimitError struct {
	APIError
	// RetryAfter is the number of seconds to wait, or 0 if not provided.
	RetryAfter float64
}

func newNetworkError(msg string, cause error) *NetworkError {
	return &NetworkError{SDKError: SDKError{Message: msg, Cause: cause}}
}

func newAPIError(statusCode int, body string) *APIError {
	return &APIError{
		SDKError:   SDKError{Message: fmt.Sprintf("API error %d: %s", statusCode, body)},
		StatusCode: statusCode,
		Body:       body,
	}
}

func newRateLimitError(retryAfter float64) *RateLimitError {
	msg := "rate limit exceeded"
	if retryAfter > 0 {
		msg += fmt.Sprintf(" - retry after %.0fs", retryAfter)
	}
	return &RateLimitError{
		APIError:   APIError{SDKError: SDKError{Message: msg}, StatusCode: http.StatusTooManyRequests},
		RetryAfter: retryAfter,
	}
}

// RESPONSE TYPES (shapes match the live API)

// Article represents a news article.
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

// Pagination describes the paging block returned by list endpoints.
type Pagination struct {
	Page       int  `json:"page"`
	PerPage    int  `json:"perPage"`
	TotalPages int  `json:"totalPages"`
	HasMore    bool `json:"hasMore"`
}

// NewsResponse is the API response for news endpoints.
type NewsResponse struct {
	Articles   []Article   `json:"articles"`
	TotalCount int         `json:"totalCount"`
	Sources    []string    `json:"sources"`
	FetchedAt  string      `json:"fetchedAt"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

// SourceInfo represents a news source.
type SourceInfo struct {
	Key      string `json:"key"`
	Name     string `json:"name"`
	URL      string `json:"url"`
	Category string `json:"category"`
	Tier     string `json:"tier,omitempty"`
	Status   string `json:"status"`
}

// SourcesResponse is the API response for the sources endpoint.
type SourcesResponse struct {
	Sources []SourceInfo `json:"sources"`
}

// TrendingTopic represents a trending topic.
type TrendingTopic struct {
	Topic           string   `json:"topic"`
	Count           int      `json:"count"`
	Sentiment       string   `json:"sentiment"`
	RecentHeadlines []string `json:"recentHeadlines"`
}

// TrendingResponse is the API response for the trending endpoint.
type TrendingResponse struct {
	Trending         []TrendingTopic `json:"trending"`
	TimeWindow       string          `json:"timeWindow"`
	ArticlesAnalyzed int             `json:"articlesAnalyzed"`
	FetchedAt        string          `json:"fetchedAt"`
}

// HealthCheck is the status of one subsystem in the health response.
type HealthCheck struct {
	Status       string `json:"status"`
	Message      string `json:"message,omitempty"`
	ResponseTime int    `json:"responseTime"`
}

// HealthResponse is the API response for the health endpoint.
type HealthResponse struct {
	Status    string                 `json:"status"`
	Timestamp string                 `json:"timestamp"`
	Version   string                 `json:"version"`
	Uptime    float64                `json:"uptime"`
	Checks    map[string]HealthCheck `json:"checks"`
}

// StatsSummary is the headline block of the stats response.
type StatsSummary struct {
	TotalArticles      int     `json:"totalArticles"`
	ActiveSources      int     `json:"activeSources"`
	TotalSources       int     `json:"totalSources"`
	AvgArticlesPerHour float64 `json:"avgArticlesPerHour"`
	TimeRange          string  `json:"timeRange"`
}

// SourceStat is the per-source article count in the stats response.
type SourceStat struct {
	Source        string  `json:"source"`
	ArticleCount  int     `json:"articleCount"`
	Percentage    float64 `json:"percentage"`
	LatestArticle string  `json:"latestArticle"`
	LatestTime    string  `json:"latestTime"`
}

// StatsResponse is the API response for the stats endpoint.
type StatsResponse struct {
	Summary   StatsSummary `json:"summary"`
	BySource  []SourceStat `json:"bySource"`
	FetchedAt string       `json:"fetchedAt"`
}

// AnalyzedArticle represents an article with sentiment analysis.
type AnalyzedArticle struct {
	Article
	Topics         []string `json:"topics"`
	Sentiment      string   `json:"sentiment"`
	SentimentScore float64  `json:"sentimentScore"`
}

// TopicCount is a topic with its article count.
type TopicCount struct {
	Topic string `json:"topic"`
	Count int    `json:"count"`
}

// AnalysisSummary is the aggregate block of the analyze response.
type AnalysisSummary struct {
	TopTopics          []TopicCount   `json:"topTopics"`
	SentimentBreakdown map[string]int `json:"sentimentBreakdown"`
	OverallSentiment   string         `json:"overallSentiment"`
}

// AnalyzeResponse is the API response for the analyze endpoint.
type AnalyzeResponse struct {
	Articles   []AnalyzedArticle `json:"articles"`
	TotalCount int               `json:"totalCount"`
	Analysis   AnalysisSummary   `json:"analysis"`
}

// ArchiveArticle is an article from the historical archive (snake_case schema).
type ArchiveArticle struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Link      string   `json:"link"`
	Source    string   `json:"source"`
	Category  string   `json:"category"`
	PubDate   string   `json:"pub_date"`
	Tickers   []string `json:"tickers"`
	Sentiment struct {
		Score      float64 `json:"score"`
		Label      string  `json:"label"`
		Confidence float64 `json:"confidence"`
	} `json:"sentiment"`
}

// ArchiveResponse is the API response for the archive endpoint.
type ArchiveResponse struct {
	Success    bool             `json:"success"`
	Count      int              `json:"count"`
	Total      int              `json:"total"`
	Articles   []ArchiveArticle `json:"articles"`
	Pagination struct {
		Limit   int  `json:"limit"`
		Offset  int  `json:"offset"`
		HasMore bool `json:"hasMore"`
	} `json:"pagination"`
}

// OriginArticle is an article whose original source could be traced.
type OriginArticle struct {
	Title                  string `json:"title"`
	Link                   string `json:"link"`
	Source                 string `json:"source"`
	LikelyOriginalSource   string `json:"likely_original_source,omitempty"`
	OriginalSourceCategory string `json:"original_source_category,omitempty"`
	Confidence             string `json:"confidence,omitempty"`
	Reason                 string `json:"reason,omitempty"`
}

// OriginsResponse is the API response for the origins endpoint.
type OriginsResponse struct {
	Success   bool            `json:"success"`
	Analyzed  int             `json:"analyzed"`
	Articles  []OriginArticle `json:"articles"`
	Untracked []OriginArticle `json:"untracked"`
}

// PriceData is the /api/prices response: coin id to {usd, usd_market_cap, ...}.
type PriceData map[string]map[string]float64

// MarketOverview is the /api/market/coins response (a "coins" array of CoinGecko-style rows).
type MarketOverview struct {
	Coins []map[string]interface{} `json:"coins"`
}

// FearGreedIndex is the current Fear & Greed reading.
type FearGreedIndex struct {
	Value          int    `json:"value"`
	Classification string `json:"valueClassification"`
	Timestamp      int64  `json:"timestamp,omitempty"`
}

// GasPrices represents Ethereum gas prices in gwei.
type GasPrices struct {
	Fast     float64 `json:"fast,omitempty"`
	Standard float64 `json:"standard,omitempty"`
	Slow     float64 `json:"slow,omitempty"`
	Instant  float64 `json:"instant,omitempty"`
	BaseFee  float64 `json:"baseFee,omitempty"`
}

// CLIENT

// Client is the Free Crypto News API client.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient creates a new API client with default settings.
func NewClient() *Client {
	return &Client{
		BaseURL:    DefaultBaseURL,
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// NewClientWithURL creates a client with a custom base URL.
func NewClientWithURL(baseURL string) *Client {
	client := NewClient()
	client.BaseURL = strings.TrimRight(baseURL, "/")
	return client
}

func (c *Client) get(ctx context.Context, endpoint string, result interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.BaseURL+endpoint, nil)
	if err != nil {
		return newNetworkError("failed to create request", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "CryptoNewsGoSDK/1.0")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return newNetworkError(fmt.Sprintf("request failed: %s", err), err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusTooManyRequests {
		var retryAfter float64
		if retryStr := resp.Header.Get("Retry-After"); retryStr != "" {
			if v, perr := strconv.ParseFloat(retryStr, 64); perr == nil {
				retryAfter = v
			}
		}
		return newRateLimitError(retryAfter)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
		return newAPIError(resp.StatusCode, string(body))
	}

	if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
		return &SDKError{Message: fmt.Sprintf("failed to decode response: %s", err), Cause: err}
	}
	return nil
}

// API METHODS

func (c *Client) articles(ctx context.Context, endpoint string) ([]Article, error) {
	var resp NewsResponse
	if err := c.get(ctx, endpoint, &resp); err != nil {
		return nil, err
	}
	return resp.Articles, nil
}

// GetNews fetches the latest news, optionally filtered by category or search.
func (c *Client) GetNews(ctx context.Context, limit int, category, search string) ([]Article, error) {
	if search != "" {
		return c.Search(ctx, search, limit)
	}
	if category != "" {
		return c.articles(ctx, fmt.Sprintf("/api/news?limit=%d&category=%s", limit, url.QueryEscape(category)))
	}
	return c.GetLatest(ctx, limit)
}

// GetLatest fetches the latest news articles.
func (c *Client) GetLatest(ctx context.Context, limit int) ([]Article, error) {
	return c.articles(ctx, fmt.Sprintf("/api/news?limit=%d", limit))
}

// GetLatestFromSource fetches news from a specific source.
func (c *Client) GetLatestFromSource(ctx context.Context, limit int, source string) ([]Article, error) {
	return c.articles(ctx, fmt.Sprintf("/api/news?limit=%d&source=%s", limit, url.QueryEscape(source)))
}

// Search searches news by keywords.
func (c *Client) Search(ctx context.Context, keywords string, limit int) ([]Article, error) {
	return c.articles(ctx, fmt.Sprintf("/api/search?q=%s&limit=%d", url.QueryEscape(keywords), limit))
}

// GetPrices fetches cryptocurrency price data. An empty coin returns the default set.
func (c *Client) GetPrices(ctx context.Context, coin string) (PriceData, error) {
	endpoint := "/api/prices"
	if coin != "" {
		endpoint += "?coin=" + url.QueryEscape(coin)
	}
	var resp PriceData
	err := c.get(ctx, endpoint, &resp)
	return resp, err
}

// GetMarket fetches the market overview (top coins by market cap).
func (c *Client) GetMarket(ctx context.Context) (*MarketOverview, error) {
	var resp MarketOverview
	if err := c.get(ctx, "/api/market/coins", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetFearGreed fetches the current Fear & Greed Index.
func (c *Client) GetFearGreed(ctx context.Context) (*FearGreedIndex, error) {
	var resp struct {
		Current FearGreedIndex `json:"current"`
	}
	if err := c.get(ctx, "/api/fear-greed", &resp); err != nil {
		return nil, err
	}
	return &resp.Current, nil
}

// GetGas fetches current Ethereum gas prices.
func (c *Client) GetGas(ctx context.Context) (*GasPrices, error) {
	var resp GasPrices
	if err := c.get(ctx, "/api/gas", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetDeFi fetches DeFi-specific news.
func (c *Client) GetDeFi(ctx context.Context, limit int) ([]Article, error) {
	return c.articles(ctx, fmt.Sprintf("/api/defi?limit=%d", limit))
}

// GetBitcoin fetches Bitcoin-specific news.
func (c *Client) GetBitcoin(ctx context.Context, limit int) ([]Article, error) {
	return c.articles(ctx, fmt.Sprintf("/api/bitcoin?limit=%d", limit))
}

// GetBreaking fetches breaking news from the last 2 hours.
func (c *Client) GetBreaking(ctx context.Context, limit int) ([]Article, error) {
	return c.articles(ctx, fmt.Sprintf("/api/breaking?limit=%d", limit))
}

// GetTrending fetches trending topics.
func (c *Client) GetTrending(ctx context.Context, limit int, hours int) (*TrendingResponse, error) {
	var resp TrendingResponse
	if err := c.get(ctx, fmt.Sprintf("/api/trending?limit=%d&hours=%d", limit, hours), &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetSources fetches all available news sources.
func (c *Client) GetSources(ctx context.Context) ([]SourceInfo, error) {
	var resp SourcesResponse
	if err := c.get(ctx, "/api/sources", &resp); err != nil {
		return nil, err
	}
	return resp.Sources, nil
}

// GetHealth checks API health status.
func (c *Client) GetHealth(ctx context.Context) (*HealthResponse, error) {
	var resp HealthResponse
	if err := c.get(ctx, "/api/health", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetStats fetches API statistics.
func (c *Client) GetStats(ctx context.Context) (*StatsResponse, error) {
	var resp StatsResponse
	if err := c.get(ctx, "/api/stats", &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// Analyze fetches news with sentiment analysis.
func (c *Client) Analyze(ctx context.Context, limit int, topic string, sentiment string) (*AnalyzeResponse, error) {
	endpoint := fmt.Sprintf("/api/analyze?limit=%d", limit)
	if topic != "" {
		endpoint += "&topic=" + url.QueryEscape(topic)
	}
	if sentiment != "" {
		endpoint += "&sentiment=" + url.QueryEscape(sentiment)
	}
	var resp AnalyzeResponse
	if err := c.get(ctx, endpoint, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetArchive fetches archived historical news.
func (c *Client) GetArchive(ctx context.Context, date string, query string, limit int) (*ArchiveResponse, error) {
	endpoint := fmt.Sprintf("/api/archive?limit=%d", limit)
	if date != "" {
		endpoint += "&date=" + url.QueryEscape(date)
	}
	if query != "" {
		endpoint += "&q=" + url.QueryEscape(query)
	}
	var resp ArchiveResponse
	if err := c.get(ctx, endpoint, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetOrigins finds original sources of news.
func (c *Client) GetOrigins(ctx context.Context, query string, category string, limit int) (*OriginsResponse, error) {
	endpoint := fmt.Sprintf("/api/origins?limit=%d", limit)
	if query != "" {
		endpoint += "&q=" + url.QueryEscape(query)
	}
	if category != "" {
		endpoint += "&category=" + url.QueryEscape(category)
	}
	var resp OriginsResponse
	if err := c.get(ctx, endpoint, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// COIN SENTIMENT

// CoinPairs maps trading pair symbols to search keywords.
type CoinPairs map[string]string

// DefaultCoinPairs is the default set of 19 trading pairs.
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

// CoinSentimentResult holds the per-coin sentiment output.
type CoinSentimentResult struct {
	Keyword    string  `json:"keyword"`
	Articles   int     `json:"articles"`
	Pos        float64 `json:"pos"`
	Mid        float64 `json:"mid"`
	Neg        float64 `json:"neg"`
	Score      float64 `json:"score"`
	Signal     string  `json:"signal"`
	Confidence float64 `json:"confidence"`
	Tradeable  bool    `json:"tradeable"`
	Reason     string  `json:"reason"`
	Err        string  `json:"error,omitempty"`
}

// GetCoinSentimentOptions configures GetCoinSentiment behaviour.
type GetCoinSentimentOptions struct {
	Coins         CoinPairs
	Limit         int
	MinArticles   int
	MinConfidence float64
	Workers       int
}

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

func roundF(f float64, d int) float64 {
	p := math.Pow(10, float64(d))
	return math.Round(f*p) / p
}

func sortDesc3(a, b, c float64) [3]float64 {
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

// GetCoinSentiment calculates per-coin sentiment with confidence weighting.
// All coins are fetched concurrently (up to Workers goroutines).
//
// confidence = volumeWeight * marginWeight * 100, where volumeWeight rises
// from 0 to 1 as the article count reaches MinArticles and marginWeight is the
// gap between the dominant and second bucket.
func (c *Client) GetCoinSentiment(ctx context.Context, opts *GetCoinSentimentOptions) (map[string]*CoinSentimentResult, error) {
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

	jobs := make([]job, 0, len(coins))
	for pair, kw := range coins {
		jobs = append(jobs, job{pair, kw})
	}

	scoreMap := map[string]float64{
		"very_bullish": +1.0,
		"bullish":      +0.5,
		"neutral":      0.0,
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

			data, err := c.Analyze(ctx, limit, j.keyword, "")
			if err != nil {
				res.Signal = "error"
				res.Err = err.Error()
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
			res.Pos = roundF(float64(pos)*100/f, 1)
			res.Mid = roundF(float64(mid)*100/f, 1)
			res.Neg = roundF(float64(neg)*100/f, 1)
			res.Score = roundF(rawScore/f, 4)
			res.Signal = scoreSignal(res.Score)

			volumeWeight := math.Min(f/float64(minArticles), 1.0)
			sorted := sortDesc3(res.Pos, res.Mid, res.Neg)
			marginWeight := math.Max(sorted[0]-sorted[1], 0) / 100.0
			res.Confidence = roundF(volumeWeight*marginWeight*100, 1)

			var reasons []string
			if total < minArticles {
				s := ""
				if total != 1 {
					s = "s"
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
