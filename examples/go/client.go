// Package cryptonews provides a Go client for the Free Crypto News API.
// https://github.com/nirholas/free-crypto-news
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const BaseURL = "https://cryptocurrency.cv"

// Client is the API client
type Client struct {
	HTTPClient *http.Client
	BaseURL    string
	APIKey     string
}

// NewClient creates a new API client
func NewClient(apiKey string) *Client {
	return &Client{
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		BaseURL:    BaseURL,
		APIKey:     apiKey,
	}
}

// =============================================================================
// News Types
// =============================================================================

type Article struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	URL         string `json:"url"`
	Source      string `json:"source"`
	PublishedAt string `json:"publishedAt"`
	Category    string `json:"category"`
	ImageURL    string `json:"imageUrl"`
}

type NewsResponse struct {
	Articles []Article `json:"articles"`
	Total    int       `json:"total"`
}

// =============================================================================
// Market Types
// =============================================================================

type Coin struct {
	ID            string  `json:"id"`
	Symbol        string  `json:"symbol"`
	Name          string  `json:"name"`
	CurrentPrice  float64 `json:"current_price"`
	MarketCap     float64 `json:"market_cap"`
	PriceChange24 float64 `json:"price_change_percentage_24h"`
}

type FearGreedIndex struct {
	Value          int    `json:"value"`
	Classification string `json:"classification"`
	Timestamp      string `json:"timestamp"`
}

// =============================================================================
// Sentiment Types
// =============================================================================

type SentimentResult struct {
	Asset     string  `json:"asset"`
	Score     float64 `json:"score"`
	Label     string  `json:"label"`
	Positive  int     `json:"positive"`
	Negative  int     `json:"negative"`
	Neutral   int     `json:"neutral"`
	UpdatedAt string  `json:"updatedAt"`
}

// =============================================================================
// NEWS ENDPOINTS
// =============================================================================

// GetNews fetches the main news feed
func (c *Client) GetNews(limit int, category, source string) (*NewsResponse, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if category != "" {
		params.Set("category", category)
	}
	if source != "" {
		params.Set("source", source)
	}

	var response NewsResponse
	err := c.get("/api/news", params, &response)
	return &response, err
}

// GetBitcoinNews fetches Bitcoin-specific news
func (c *Client) GetBitcoinNews(limit int) (*NewsResponse, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response NewsResponse
	err := c.get("/api/bitcoin", params, &response)
	return &response, err
}

// GetDeFiNews fetches DeFi news
func (c *Client) GetDeFiNews(limit int) (*NewsResponse, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response NewsResponse
	err := c.get("/api/defi", params, &response)
	return &response, err
}

// GetBreakingNews fetches breaking news
func (c *Client) GetBreakingNews() (*NewsResponse, error) {
	var response NewsResponse
	err := c.get("/api/breaking", nil, &response)
	return &response, err
}

// SearchNews searches across all news
func (c *Client) SearchNews(query string, limit int) (*NewsResponse, error) {
	params := url.Values{}
	params.Set("q", query)
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response NewsResponse
	err := c.get("/api/search", params, &response)
	return &response, err
}

// GetTrending fetches trending topics
func (c *Client) GetTrending(limit int) ([]map[string]interface{}, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response []map[string]interface{}
	err := c.get("/api/trending", params, &response)
	return response, err
}

// GetInternationalNews fetches international news
func (c *Client) GetInternationalNews(lang string, translate bool) (*NewsResponse, error) {
	params := url.Values{}
	if lang != "" {
		params.Set("lang", lang)
	}
	params.Set("translate", fmt.Sprintf("%t", translate))

	var response NewsResponse
	err := c.get("/api/news/international", params, &response)
	return &response, err
}

// =============================================================================
// AI ENDPOINTS
// =============================================================================

// GetSentiment fetches sentiment analysis
func (c *Client) GetSentiment(asset string, limit int) (*SentimentResult, error) {
	params := url.Values{}
	if asset != "" {
		params.Set("asset", asset)
	}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response SentimentResult
	err := c.get("/api/sentiment", params, &response)
	return &response, err
}

// AskAI asks the AI a question
func (c *Client) AskAI(question string) (map[string]interface{}, error) {
	params := url.Values{}
	params.Set("q", question)

	var response map[string]interface{}
	err := c.get("/api/ask", params, &response)
	return response, err
}

// GetMarketBrief fetches the AI market brief
func (c *Client) GetMarketBrief() (map[string]interface{}, error) {
	var response map[string]interface{}
	err := c.get("/api/ai/brief", nil, &response)
	return response, err
}

// GetNarratives fetches emerging narratives
func (c *Client) GetNarratives(limit int) ([]map[string]interface{}, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response []map[string]interface{}
	err := c.get("/api/narratives", params, &response)
	return response, err
}

// =============================================================================
// MARKET DATA ENDPOINTS
// =============================================================================

// GetCoins fetches coin market data
func (c *Client) GetCoins(limit int, order string) ([]Coin, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if order != "" {
		params.Set("order", order)
	}

	var response []Coin
	err := c.get("/api/market/coins", params, &response)
	return response, err
}

// GetOHLC fetches OHLC candlestick data
func (c *Client) GetOHLC(coinID string, days int) ([][]float64, error) {
	params := url.Values{}
	params.Set("days", fmt.Sprintf("%d", days))

	var response [][]float64
	err := c.get(fmt.Sprintf("/api/market/ohlc/%s", coinID), params, &response)
	return response, err
}

// GetFearGreed fetches the Fear & Greed Index
func (c *Client) GetFearGreed() (*FearGreedIndex, error) {
	var response FearGreedIndex
	err := c.get("/api/fear-greed", nil, &response)
	return &response, err
}

// CompareCoins compares multiple coins
func (c *Client) CompareCoins(coins []string) (map[string]interface{}, error) {
	params := url.Values{}
	params.Set("coins", strings.Join(coins, ","))

	var response map[string]interface{}
	err := c.get("/api/market/compare", params, &response)
	return response, err
}

// GetDefiMarket fetches DeFi market data
func (c *Client) GetDefiMarket() (map[string]interface{}, error) {
	var response map[string]interface{}
	err := c.get("/api/market/defi", nil, &response)
	return response, err
}

// =============================================================================
// TRADING ENDPOINTS
// =============================================================================

// GetArbitrage fetches arbitrage opportunities
func (c *Client) GetArbitrage(minSpread float64, limit int) ([]map[string]interface{}, error) {
	params := url.Values{}
	params.Set("min_spread", fmt.Sprintf("%.2f", minSpread))
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response []map[string]interface{}
	err := c.get("/api/arbitrage", params, &response)
	return response, err
}

// GetSignals fetches trading signals
func (c *Client) GetSignals(asset, timeframe string) (map[string]interface{}, error) {
	params := url.Values{}
	if asset != "" {
		params.Set("asset", asset)
	}
	params.Set("timeframe", timeframe)

	var response map[string]interface{}
	err := c.get("/api/signals", params, &response)
	return response, err
}

// GetFundingRates fetches perpetual funding rates
func (c *Client) GetFundingRates(exchange string) ([]map[string]interface{}, error) {
	params := url.Values{}
	if exchange != "" {
		params.Set("exchange", exchange)
	}

	var response []map[string]interface{}
	err := c.get("/api/funding", params, &response)
	return response, err
}

// GetWhaleAlerts fetches whale transactions
func (c *Client) GetWhaleAlerts(minValue int, limit int) ([]map[string]interface{}, error) {
	params := url.Values{}
	params.Set("min_value", fmt.Sprintf("%d", minValue))
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response []map[string]interface{}
	err := c.get("/api/whale-alerts", params, &response)
	return response, err
}

// GetOrderbook fetches order book data
func (c *Client) GetOrderbook(symbol, exchange string, depth int) (map[string]interface{}, error) {
	params := url.Values{}
	params.Set("symbol", symbol)
	params.Set("exchange", exchange)
	params.Set("depth", fmt.Sprintf("%d", depth))

	var response map[string]interface{}
	err := c.get("/api/orderbook", params, &response)
	return response, err
}

// =============================================================================
// REGULATORY ENDPOINTS
// =============================================================================

// GetRegulatoryNews fetches regulatory news
func (c *Client) GetRegulatoryNews(region string, limit int) (*NewsResponse, error) {
	params := url.Values{}
	if region != "" {
		params.Set("region", region)
	}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response NewsResponse
	err := c.get("/api/regulatory", params, &response)
	return &response, err
}

// GetETFNews fetches ETF news
func (c *Client) GetETFNews(etfType string) (*NewsResponse, error) {
	params := url.Values{}
	if etfType != "" {
		params.Set("type", etfType)
	}

	var response NewsResponse
	err := c.get("/api/regulatory/etf", params, &response)
	return &response, err
}

// =============================================================================
// BLOCKCHAIN ENDPOINTS
// =============================================================================

// GetNFTNews fetches NFT news
func (c *Client) GetNFTNews(limit int) (*NewsResponse, error) {
	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response NewsResponse
	err := c.get("/api/nft", params, &response)
	return &response, err
}

// GetGasPrices fetches gas prices
func (c *Client) GetGasPrices(chain string) (map[string]interface{}, error) {
	params := url.Values{}
	params.Set("chain", chain)

	var response map[string]interface{}
	err := c.get("/api/onchain/gas", params, &response)
	return response, err
}

// GetDefiTVL fetches DeFi TVL
func (c *Client) GetDefiTVL(protocol string) (map[string]interface{}, error) {
	params := url.Values{}
	if protocol != "" {
		params.Set("protocol", protocol)
	}

	var response map[string]interface{}
	err := c.get("/api/onchain/defi", params, &response)
	return response, err
}

// =============================================================================
// FEEDS & EXPORT ENDPOINTS
// =============================================================================

// GetRSSFeed fetches RSS feed as JSON
func (c *Client) GetRSSFeed(category string, limit int) (*NewsResponse, error) {
	params := url.Values{}
	if category != "" {
		params.Set("category", category)
	}
	params.Set("limit", fmt.Sprintf("%d", limit))

	var response NewsResponse
	err := c.get("/api/rss.json", params, &response)
	return &response, err
}

// =============================================================================
// HTTP HELPERS
// =============================================================================

func (c *Client) get(path string, params url.Values, result interface{}) error {
	urlStr := c.BaseURL + path
	if params != nil && len(params) > 0 {
		urlStr += "?" + params.Encode()
	}

	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return err
	}

	if c.APIKey != "" {
		req.Header.Set("X-API-Key", c.APIKey)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	return json.Unmarshal(body, result)
}

func (c *Client) post(path string, payload interface{}, result interface{}) error {
	urlStr := c.BaseURL + path

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", urlStr, strings.NewReader(string(jsonPayload)))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	if c.APIKey != "" {
		req.Header.Set("X-API-Key", c.APIKey)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	return json.Unmarshal(body, result)
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

func main() {
	fmt.Println("=".repeat(60))
	fmt.Println("FREE CRYPTO NEWS API - GO EXAMPLES")
	fmt.Println("=".repeat(60))

	client := NewClient("")

	// 1. Latest News
	fmt.Println("\n📰 1. Latest News (5 articles)")
	news, err := client.GetNews(5, "", "")
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		for i, article := range news.Articles {
			if i >= 5 {
				break
			}
			title := article.Title
			if len(title) > 60 {
				title = title[:60] + "..."
			}
			fmt.Printf("   %d. %s\n", i+1, title)
		}
	}

	// 2. Bitcoin News
	fmt.Println("\n₿ 2. Bitcoin News")
	btcNews, err := client.GetBitcoinNews(3)
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		for _, article := range btcNews.Articles {
			title := article.Title
			if len(title) > 60 {
				title = title[:60] + "..."
			}
			fmt.Printf("   - %s\n", title)
		}
	}

	// 3. Search
	fmt.Println("\n🔍 3. Search 'Ethereum ETF'")
	searchResults, err := client.SearchNews("Ethereum ETF", 3)
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		for _, article := range searchResults.Articles {
			title := article.Title
			if len(title) > 60 {
				title = title[:60] + "..."
			}
			fmt.Printf("   - %s\n", title)
		}
	}

	// 4. Sentiment
	fmt.Println("\n📊 4. BTC Sentiment")
	sentiment, err := client.GetSentiment("BTC", 20)
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Printf("   Score: %.2f (%s)\n", sentiment.Score, sentiment.Label)
	}

	// 5. Fear & Greed
	fmt.Println("\n😱 5. Fear & Greed Index")
	fg, err := client.GetFearGreed()
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Printf("   Value: %d (%s)\n", fg.Value, fg.Classification)
	}

	// 6. Top Coins
	fmt.Println("\n💰 6. Top 5 Coins")
	coins, err := client.GetCoins(5, "market_cap_desc")
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		for _, coin := range coins {
			fmt.Printf("   %s: $%.2f\n", coin.Name, coin.CurrentPrice)
		}
	}

	// 7. Arbitrage
	fmt.Println("\n💹 7. Arbitrage Opportunities")
	arb, err := client.GetArbitrage(0.5, 5)
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Printf("   Found %d opportunities\n", len(arb))
	}

	// 8. Whale Alerts
	fmt.Println("\n🐋 8. Whale Alerts")
	whales, err := client.GetWhaleAlerts(5000000, 5)
	if err != nil {
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Printf("   Found %d whale transactions\n", len(whales))
	}

	fmt.Println("\n" + "=".repeat(60))
	fmt.Println("All Go examples completed!")
	fmt.Println("=".repeat(60))
}

// Helper function for string repeat
func repeatString(s string, count int) string {
	result := ""
	for i := 0; i < count; i++ {
		result += s
	}
	return result
}

func init() {
	// Make = symbol repeat work
}
