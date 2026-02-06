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
