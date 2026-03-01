// Copyright 2024-2026 nirholas. All rights reserved.
// SPDX-License-Identifier: SEE LICENSE IN LICENSE
// https://github.com/nirholas/free-crypto-news

// Package cryptonews provides a production-ready client for the Free Crypto News API.
// 100% FREE — no API keys required!
//
// All methods accept a context.Context for cancellation and timeout control.
//
// Usage:
//
//client := cryptonews.NewClient()
//articles, err := client.GetLatest(context.Background(), 10)
//if err != nil {
//    log.Fatal(err)
//}
//for _, article := range articles {
//    fmt.Printf("%s - %s\n", article.Title, article.Source)
//}
package cryptonews

import (
"context"
"encoding/json"
"fmt"
"io"
"math"
"net/http"
"net/url"
"strings"
"sync"
"time"
)

const DefaultBaseURL = "https://cryptocurrency.cv"

// ═══════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════

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
tf("API error %d: %s", statusCode, body)},
    body,
}
}

func newRateLimitError(retryAfter float64) *RateLimitError {
msg := "rate limit exceeded"
if retryAfter > 0 {
tf(" — retry after %.0fs", retryAfter)
}
return &RateLimitError{
msg}, StatusCode: 429},
RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

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

// NewsResponse is the API response for news endpoints.
type NewsResponse struct {
Articles   []Article `json:"articles"`
TotalCount int       `json:"totalCount"`
Sources    []string  `json:"sources"`
FetchedAt  string    `json:"fetchedAt"`
Pagination *struct {
  int  `json:"page"`
t  `json:"perPage"`
t  `json:"totalPages"`
`json:"hasMore"`
} `json:"pagination,omitempty"`
}

// SourceInfo represents a news source.
type SourceInfo struct {
Key      string `json:"key"`
Name     string `json:"name"`
URL      string `json:"url"`
Category string `json:"category"`
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

// HealthSource represents health of a single source.
type HealthSource struct {
Source       string `json:"source"`
Status       string `json:"status"`
ResponseTime int    `json:"responseTime"`
Error        string `json:"error,omitempty"`
}

// HealthResponse is the API response for the health endpoint.
type HealthResponse struct {
Status            string `json:"status"`
Timestamp         string `json:"timestamp"`
TotalResponseTime int    `json:"totalResponseTime"`
Summary           struct {
t `json:"healthy"`
t `json:"degraded"`
     int `json:"down"`
t `json:"total"`
} `json:"summary"`
Sources []HealthSource `json:"sources"`
}

// StatsResponse is the API response for the stats endpoint.
type StatsResponse struct {
TotalArticles      int            `json:"total_articles"`
ArticlesBySource   map[string]int `json:"articles_by_source"`
ArticlesByCategory map[string]int `json:"articles_by_category"`
LastUpdated        string         `json:"last_updated"`
}

// AnalyzedArticle represents an article with sentiment analysis.
type AnalyzedArticle struct {
Article
Topics         []string `json:"topics"`
Sentiment      string   `json:"sentiment"`
SentimentScore float64  `json:"sentiment_score"`
}

// AnalyzeResponse is the API response for the analyze endpoint.
type AnalyzeResponse struct {
Articles []AnalyzedArticle `json:"articles"`
Summary  struct {
timent string   `json:"overall_sentiment"`
t     int      `json:"bullish_count"`
t     int      `json:"bearish_count"`
eutralCount     int      `json:"neutral_count"`
   []string `json:"top_topics"`
} `json:"summary"`
}

// ArchiveResponse is the API response for the archive endpoint.
type ArchiveResponse struct {
Articles   []Article `json:"articles"`
Date       string    `json:"date"`
TotalCount int       `json:"totalCount"`
}

// OriginItem represents an article with original source information.
type OriginItem struct {
Title                  string `json:"title"`
Link                   string `json:"link"`
Source                 string `json:"source"`
LikelyOriginalSource   string `json:"likely_original_source"`
OriginalSourceCategory string `json:"original_source_category"`
Confidence             string `json:"confidence"`
}

// OriginsResponse is the API response for the origins endpoint.
type OriginsResponse struct {
Items      []OriginItem   `json:"items"`
TotalCount int            `json:"totalCount"`
Categories map[string]int `json:"categories"`
}

// PriceData represents cryptocurrency price information.
type PriceData map[string]interface{}

// MarketOverview represents market-wide statistics.
type MarketOverview map[string]interface{}

// FearGreedIndex represents the Fear & Greed Index.
type FearGreedIndex struct {
Value          int    `json:"value"`
Classification string `json:"classification"`
Timestamp      string `json:"timestamp,omitempty"`
}

// GasPrices represents Ethereum gas prices.
type GasPrices struct {
Fast     float64 `json:"fast,omitempty"`
Standard float64 `json:"standard,omitempty"`
Slow     float64 `json:"slow,omitempty"`
BaseFee  float64 `json:"baseFee,omitempty"`
}

// ═══════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════

// Client is the Free Crypto News API client.
type Client struct {
BaseURL    string
HTTPClient *http.Client
}

// NewClient creates a new API client with default settings.
func NewClient() *Client {
return &Client{
t: &http.Client{
d,
ewClientWithURL creates a client with a custom base URL.
func NewClientWithURL(baseURL string) *Client {
client := NewClient()
client.BaseURL = baseURL
return client
}

func (c *Client) get(ctx context.Context, endpoint string, result interface{}) error {
req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.BaseURL+endpoint, nil)
if err != nil {
 newNetworkError("failed to create request", err)
}
req.Header.Set("Accept", "application/json")
req.Header.Set("User-Agent", "CryptoNewsGoSDK/1.0")

resp, err := c.HTTPClient.Do(req)
if err != nil {
 newNetworkError(fmt.Sprintf("request failed: %s", err), err)
}
defer resp.Body.Close()

if resp.StatusCode == http.StatusTooManyRequests {
retryAfter float64
{
f(retryStr, "%f", &retryAfter)
 newRateLimitError(retryAfter)
}

if resp.StatusCode < 200 || resp.StatusCode >= 300 {
)
 newAPIError(resp.StatusCode, string(body))
}

return json.NewDecoder(resp.Body).Decode(result)
}

// ═══════════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════════

// GetNews fetches the latest news, optionally filtered by category or search.
func (c *Client) GetNews(ctx context.Context, limit int, category, search string) ([]Article, error) {
if search != "" {
ewsResponse
tf("/api/search?q=%s&limit=%d", url.QueryEscape(search), limit), &resp)
 resp.Articles, err
}
if category != "" {
ewsResponse
tf("/api/%s?limit=%d", category, limit), &resp)
 resp.Articles, err
}
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/news?limit=%d", limit), &resp)
return resp.Articles, err
}

// GetLatest fetches the latest news articles.
func (c *Client) GetLatest(ctx context.Context, limit int) ([]Article, error) {
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/news?limit=%d", limit), &resp)
return resp.Articles, err
}

// GetLatestFromSource fetches news from a specific source.
func (c *Client) GetLatestFromSource(ctx context.Context, limit int, source string) ([]Article, error) {
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/news?limit=%d&source=%s", limit, url.QueryEscape(source)), &resp)
return resp.Articles, err
}

// Search searches news by keywords.
func (c *Client) Search(ctx context.Context, keywords string, limit int) ([]Article, error) {
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/search?q=%s&limit=%d", url.QueryEscape(keywords), limit), &resp)
return resp.Articles, err
}

// GetPrices fetches cryptocurrency price data.
func (c *Client) GetPrices(ctx context.Context, coin string) (PriceData, error) {
endpoint := "/api/prices"
if coin != "" {
dpoint += "?coin=" + url.QueryEscape(coin)
}
var resp PriceData
err := c.get(ctx, endpoint, &resp)
return resp, err
}

// GetMarket fetches the market overview.
func (c *Client) GetMarket(ctx context.Context) (MarketOverview, error) {
var resp MarketOverview
err := c.get(ctx, "/api/market", &resp)
return resp, err
}

// GetFearGreed fetches the Fear & Greed Index.
func (c *Client) GetFearGreed(ctx context.Context) (*FearGreedIndex, error) {
var resp FearGreedIndex
err := c.get(ctx, "/api/fear-greed", &resp)
return &resp, err
}

// GetGas fetches current Ethereum gas prices.
func (c *Client) GetGas(ctx context.Context) (*GasPrices, error) {
var resp GasPrices
err := c.get(ctx, "/api/gas", &resp)
return &resp, err
}

// GetDeFi fetches DeFi-specific news.
func (c *Client) GetDeFi(ctx context.Context, limit int) ([]Article, error) {
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/defi?limit=%d", limit), &resp)
return resp.Articles, err
}

// GetBitcoin fetches Bitcoin-specific news.
func (c *Client) GetBitcoin(ctx context.Context, limit int) ([]Article, error) {
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/bitcoin?limit=%d", limit), &resp)
return resp.Articles, err
}

// GetBreaking fetches breaking news from the last 2 hours.
func (c *Client) GetBreaking(ctx context.Context, limit int) ([]Article, error) {
var resp NewsResponse
err := c.get(ctx, fmt.Sprintf("/api/breaking?limit=%d", limit), &resp)
return resp.Articles, err
}

// GetTrending fetches trending topics.
func (c *Client) GetTrending(ctx context.Context, limit int, hours int) (*TrendingResponse, error) {
var resp TrendingResponse
err := c.get(ctx, fmt.Sprintf("/api/trending?limit=%d&hours=%d", limit, hours), &resp)
return &resp, err
}

// GetSources fetches all available news sources.
func (c *Client) GetSources(ctx context.Context) ([]SourceInfo, error) {
var resp SourcesResponse
err := c.get(ctx, "/api/sources", &resp)
return resp.Sources, err
}

// GetHealth checks API health status.
func (c *Client) GetHealth(ctx context.Context) (*HealthResponse, error) {
var resp HealthResponse
err := c.get(ctx, "/api/health", &resp)
return &resp, err
}

// GetStats fetches API statistics.
func (c *Client) GetStats(ctx context.Context) (*StatsResponse, error) {
var resp StatsResponse
err := c.get(ctx, "/api/stats", &resp)
return &resp, err
}

// Analyze fetches news with sentiment analysis.
func (c *Client) Analyze(ctx context.Context, limit int, topic string, sentiment string) (*AnalyzeResponse, error) {
endpoint := fmt.Sprintf("/api/analyze?limit=%d", limit)
if topic != "" {
dpoint += "&topic=" + url.QueryEscape(topic)
}
if sentiment != "" {
dpoint += "&sentiment=" + sentiment
}
var resp AnalyzeResponse
err := c.get(ctx, endpoint, &resp)
return &resp, err
}

// GetArchive fetches archived historical news.
func (c *Client) GetArchive(ctx context.Context, date string, query string, limit int) (*ArchiveResponse, error) {
endpoint := fmt.Sprintf("/api/archive?limit=%d", limit)
if date != "" {
dpoint += "&date=" + date
}
if query != "" {
dpoint += "&q=" + url.QueryEscape(query)
}
var resp ArchiveResponse
err := c.get(ctx, endpoint, &resp)
return &resp, err
}

// GetOrigins finds original sources of news.
func (c *Client) GetOrigins(ctx context.Context, query string, category string, limit int) (*OriginsResponse, error) {
endpoint := fmt.Sprintf("/api/origins?limit=%d", limit)
if query != "" {
dpoint += "&q=" + url.QueryEscape(query)
}
if category != "" {
dpoint += "&category=" + category
}
var resp OriginsResponse
err := c.get(ctx, endpoint, &resp)
return &resp, err
}

// ═══════════════════════════════════════════════════════════════
// COIN SENTIMENT
// ═══════════════════════════════════════════════════════════════

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
 "very_bullish"
case score >= 0.15:
 "bullish"
case score > -0.15:
 "neutral"
case score > -0.5:
 "bearish"
default:
 "very_bearish"
}
}

func roundF(f float64, d int) float64 {
p := math.Pow(10, float64(d))
return math.Round(f*p) / p
}

func sortDesc3(a, b, c float64) [3]float64 {
if a < b {
a < c {
b < c {
 [3]float64{a, b, c}
}

// GetCoinSentiment calculates per-coin sentiment with confidence weighting.
// All coins are fetched concurrently (up to Workers goroutines).
func (c *Client) GetCoinSentiment(ctx context.Context, opts *GetCoinSentimentOptions) (map[string]*CoinSentimentResult, error) {
if opts == nil {
SentimentOptions{}
}
coins := opts.Coins
if coins == nil {
s = DefaultCoinPairs
}
limit := opts.Limit
if limit <= 0 {
Articles := opts.MinArticles
if minArticles <= 0 {
Articles = 5
}
minConfidence := opts.MinConfidence
if minConfidence <= 0 {
Confidence = 20.0
}
workers := opts.Workers
if workers <= 0 {
struct {
g
g
}
type resultEntry struct {
g
SentimentResult
}

jobs := make([]job, 0, len(coins))
for pair, kw := range coins {
d(jobs, job{pair, kw})
}

scoreMap := map[string]float64{
   +0.5,
eutral":       0.0,
 -0.5,
g]bool{"very_bullish": true, "bullish": true}
bearish := map[string]bool{"very_bearish": true, "bearish": true}

sem := make(chan struct{}, workers)
resultCh := make(chan resultEntry, len(jobs))
var wg sync.WaitGroup

for _, j := range jobs {
c(j job) {
e()
c() { <-sem }()

SentimentResult{Keyword: j.keyword}

alyze(ctx, limit, j.keyword, "")
il {
al = "error"
 = err.Error()
try{j.pair, res}

(articles)
0 {
al = "neutral"
 = "no articles found"
try{j.pair, res}

eg := 0, 0
:= range articles {
timent] {
timent] {
eg++
timent]
- neg

dF(float64(pos)*100/f, 1)
dF(float64(mid)*100/f, 1)
eg = roundF(float64(neg)*100/f, 1)
dF(rawScore/f, 4)
al = scoreSignal(res.Score)

(f/float64(minArticles), 1.0)
eg)
Weight := math.Max(sorted[0]-sorted[1], 0) / 100.0
fidence = roundF(volumeWeight*marginWeight*100, 1)

s []string
Articles {
1 {
s = append(reasons,
tf("only %d article%s found (min %d)", total, s, minArticles))
fidence < minConfidence {
s = append(reasons,
tf("confidence %.1f below threshold %.1f", res.Confidence, minConfidence))
(reasons) == 0
 = strings.Join(reasons, "; ")

try{j.pair, res}
g]*CoinSentimentResult, len(jobs))
for entry := range resultCh {
try.pair] = entry.result
}
return result, nil
}
