<?php
/**
 * Free Crypto News PHP SDK
 * 
 * 100% FREE - no API keys required!
 * 
 * Usage:
 *   require_once 'CryptoNews.php';
 *   
 *   $news = new CryptoNews();
 *   $articles = $news->getLatest(10);
 *   
 *   foreach ($articles as $article) {
 *       echo $article['title'] . ' - ' . $article['source'] . "\n";
 *   }
 */

class CryptoNews {
    private string $baseUrl;
    private int $timeout;
    
    const DEFAULT_BASE_URL = 'https://cryptocurrency.cv';
    
    /**
     * Create a new CryptoNews client
     * 
     * @param string|null $baseUrl Custom base URL for self-hosted instances
     * @param int $timeout Request timeout in seconds
     */
    public function __construct(?string $baseUrl = null, int $timeout = 30) {
        $this->baseUrl = $baseUrl ?? self::DEFAULT_BASE_URL;
        $this->timeout = $timeout;
    }
    
    /**
     * Make an API request
     */
    private function request(string $endpoint): array {
        $url = $this->baseUrl . $endpoint;
        
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Accept: application/json',
                    'User-Agent: CryptoNewsPHP/1.0'
                ],
                'timeout' => $this->timeout
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            throw new Exception("Failed to fetch from API: $url");
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON response: " . json_last_error_msg());
        }
        
        return $data;
    }
    
    /**
     * Get latest crypto news
     * 
     * @param int $limit Maximum articles (1-50)
     * @param string|null $source Filter by source
     * @return array List of articles
     */
    public function getLatest(int $limit = 10, ?string $source = null): array {
        $endpoint = "/api/news?limit=$limit";
        if ($source) {
            $endpoint .= "&source=" . urlencode($source);
        }
        $data = $this->request($endpoint);
        return $data['articles'] ?? [];
    }
    
    /**
     * Get full response with metadata
     */
    public function getLatestWithMeta(int $limit = 10, ?string $source = null): array {
        $endpoint = "/api/news?limit=$limit";
        if ($source) {
            $endpoint .= "&source=" . urlencode($source);
        }
        return $this->request($endpoint);
    }
    
    /**
     * Search news by keywords
     * 
     * @param string $keywords Comma-separated search terms
     * @param int $limit Maximum results (1-30)
     * @return array List of matching articles
     */
    public function search(string $keywords, int $limit = 10): array {
        $endpoint = "/api/search?q=" . urlencode($keywords) . "&limit=$limit";
        $data = $this->request($endpoint);
        return $data['articles'] ?? [];
    }
    
    /**
     * Get DeFi-specific news
     */
    public function getDefi(int $limit = 10): array {
        $data = $this->request("/api/defi?limit=$limit");
        return $data['articles'] ?? [];
    }
    
    /**
     * Get Bitcoin-specific news
     */
    public function getBitcoin(int $limit = 10): array {
        $data = $this->request("/api/bitcoin?limit=$limit");
        return $data['articles'] ?? [];
    }
    
    /**
     * Get breaking news (last 2 hours)
     */
    public function getBreaking(int $limit = 5): array {
        $data = $this->request("/api/breaking?limit=$limit");
        return $data['articles'] ?? [];
    }
    
    /**
     * Get trending topics
     * 
     * @param int $limit Maximum topics (1-20)
     * @param int $hours Time window (1-72)
     */
    public function getTrending(int $limit = 10, int $hours = 24): array {
        return $this->request("/api/trending?limit=$limit&hours=$hours");
    }
    
    /**
     * Get list of all news sources
     */
    public function getSources(): array {
        $data = $this->request('/api/sources');
        return $data['sources'] ?? [];
    }
    
    /**
     * Check API health status
     */
    public function getHealth(): array {
        return $this->request('/api/health');
    }
    
    /**
     * Get statistics
     */
    public function getStats(): array {
        return $this->request('/api/stats');
    }
    
    /**
     * Analyze news with sentiment
     * 
     * @param int $limit Maximum articles
     * @param string|null $topic Filter by topic
     * @param string|null $sentiment Filter by sentiment (bullish, bearish, neutral)
     */
    public function analyze(int $limit = 20, ?string $topic = null, ?string $sentiment = null): array {
        $endpoint = "/api/analyze?limit=$limit";
        if ($topic) {
            $endpoint .= "&topic=" . urlencode($topic);
        }
        if ($sentiment) {
            $endpoint .= "&sentiment=$sentiment";
        }
        return $this->request($endpoint);
    }
    
    /**
     * Get archived historical news
     * 
     * @param string|null $date Date in YYYY-MM-DD format
     * @param string|null $query Search query
     * @param int $limit Maximum articles
     */
    public function getArchive(?string $date = null, ?string $query = null, int $limit = 50): array {
        $params = ["limit=$limit"];
        if ($date) {
            $params[] = "date=$date";
        }
        if ($query) {
            $params[] = "q=" . urlencode($query);
        }
        return $this->request("/api/archive?" . implode("&", $params));
    }
    
    /**
     * Find original sources of news
     * 
     * @param string|null $query Search query
     * @param string|null $category Filter by category
     * @param int $limit Maximum results
     */
    public function getOrigins(?string $query = null, ?string $category = null, int $limit = 20): array {
        $params = ["limit=$limit"];
        if ($query) {
            $params[] = "q=" . urlencode($query);
        }
        if ($category) {
            $params[] = "category=$category";
        }
        return $this->request("/api/origins?" . implode("&", $params));
    }
    
    /**
     * Get RSS feed URL
     */
    public function getRssUrl(string $feed = 'all'): string {
        if ($feed === 'all') {
            return $this->baseUrl . '/api/rss';
        }
        return $this->baseUrl . "/api/rss?feed=$feed";
    }
    
    /**
     * Get Atom feed URL
     */
    public function getAtomUrl(string $feed = 'all'): string {
        if ($feed === 'all') {
            return $this->baseUrl . '/api/atom';
        }
        return $this->baseUrl . "/api/atom?feed=$feed";
    }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Quick function to get latest news
 */
function getCryptoNews(int $limit = 10): array {
    return (new CryptoNews())->getLatest($limit);
}

/**
 * Quick function to search news
 */
function searchCryptoNews(string $keywords, int $limit = 10): array {
    return (new CryptoNews())->search($keywords, $limit);
}

// Demo when run directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($argv[0] ?? '')) {
    echo "📰 Free Crypto News PHP SDK Demo\n";
    echo str_repeat("=", 50) . "\n\n";
    
    $news = new CryptoNews();
    
    echo "Latest News:\n";
    foreach ($news->getLatest(5) as $article) {
        echo "• {$article['title']}\n";
        echo "  {$article['source']} • {$article['timeAgo']}\n\n";
    }
    
    echo "\nTrending Topics:\n";
    $trending = $news->getTrending(5, 24);
    foreach ($trending['trending'] as $topic) {
        $emoji = $topic['sentiment'] === 'bullish' ? '🟢' : ($topic['sentiment'] === 'bearish' ? '🔴' : '⚪');
        echo "$emoji {$topic['topic']}: {$topic['count']} mentions\n";
    }
}
