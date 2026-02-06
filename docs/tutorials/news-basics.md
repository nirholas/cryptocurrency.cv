# 📰 News Feed Basics Tutorial

Learn how to fetch and display crypto news using the Free Crypto News API.

---

## Prerequisites

No API key required! All endpoints are free and open.

---

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `GET /api/news` | Main news feed |
| `GET /api/bitcoin` | Bitcoin-specific news |
| `GET /api/defi` | DeFi news |
| `GET /api/breaking` | Breaking news (1-min cache) |
| `GET /api/sources` | List all sources |
| `GET /api/news/categories` | Available categories |

---

## Basic News Fetch

=== "Python"

    ```python
    import requests
    from datetime import datetime
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def get_news(limit: int = 20, source: str = None, category: str = None) -> dict:
        """
        Fetch crypto news from all sources.
        
        Args:
            limit: Number of articles (1-100, default: 20)
            source: Filter by source (coindesk, cointelegraph, theblock, etc.)
            category: Filter by category (bitcoin, ethereum, defi, nft, etc.)
        
        Returns:
            dict: News response with articles, pagination, and metadata
        """
        params = {"limit": limit}
        
        if source:
            params["source"] = source
        if category:
            params["category"] = category
        
        response = requests.get(f"{BASE_URL}/api/news", params=params)
        response.raise_for_status()
        return response.json()
    
    
    # Example usage
    if __name__ == "__main__":
        # Get latest 10 articles
        news = get_news(limit=10)
        
        print(f"📰 Latest Crypto News ({news.get('totalCount', 0)} total)")
        print(f"Sources: {', '.join(news.get('sources', []))}")
        print("-" * 60)
        
        for article in news["articles"]:
            print(f"\n📌 {article['title']}")
            print(f"   Source: {article['source']} | {article.get('timeAgo', '')}")
            print(f"   Link: {article['link']}")
    ```

=== "JavaScript"

    ```javascript
    const BASE_URL = "https://cryptocurrency.cv";
    
    /**
     * Fetch crypto news from all sources.
     * @param {Object} options - Query options
     * @param {number} options.limit - Number of articles (1-100)
     * @param {string} options.source - Filter by source
     * @param {string} options.category - Filter by category
     * @returns {Promise<Object>} News response
     */
    async function getNews({ limit = 20, source, category } = {}) {
        const params = new URLSearchParams({ limit: limit.toString() });
        
        if (source) params.set("source", source);
        if (category) params.set("category", category);
        
        const response = await fetch(`${BASE_URL}/api/news?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Example usage
    async function main() {
        const news = await getNews({ limit: 10 });
        
        console.log(`📰 Latest Crypto News (${news.totalCount} total)`);
        console.log(`Sources: ${news.sources.join(", ")}`);
        console.log("-".repeat(60));
        
        for (const article of news.articles) {
            console.log(`\n📌 ${article.title}`);
            console.log(`   Source: ${article.source} | ${article.timeAgo}`);
            console.log(`   Link: ${article.link}`);
        }
    }
    
    main().catch(console.error);
    ```

=== "TypeScript"

    ```typescript
    interface Article {
        title: string;
        link: string;
        description: string;
        pubDate: string;
        source: string;
        sourceKey: string;
        category?: string;
        timeAgo?: string;
        image?: string;
    }
    
    interface NewsResponse {
        articles: Article[];
        totalCount: number;
        sources: string[];
        fetchedAt: string;
        pagination: {
            page: number;
            perPage: number;
            totalPages: number;
            hasMore: boolean;
        };
        lang: string;
        responseTime: string;
    }
    
    interface GetNewsOptions {
        limit?: number;
        source?: string;
        category?: string;
        page?: number;
    }
    
    const BASE_URL = "https://cryptocurrency.cv";
    
    async function getNews(options: GetNewsOptions = {}): Promise<NewsResponse> {
        const { limit = 20, source, category, page = 1 } = options;
        
        const params = new URLSearchParams({
            limit: limit.toString(),
            page: page.toString(),
        });
        
        if (source) params.set("source", source);
        if (category) params.set("category", category);
        
        const response = await fetch(`${BASE_URL}/api/news?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Example usage
    async function main(): Promise<void> {
        const news = await getNews({ limit: 10 });
        
        console.log(`📰 Latest Crypto News (${news.totalCount} total)`);
        news.articles.forEach((article) => {
            console.log(`- ${article.title}`);
        });
    }
    
    main();
    ```

=== "cURL"

    ```bash
    # Basic fetch - latest 10 articles
    curl "https://cryptocurrency.cv/api/news?limit=10"
    
    # Pretty print with jq
    curl -s "https://cryptocurrency.cv/api/news?limit=5" | jq '.articles[] | {title, source, timeAgo}'
    
    # Filter by source
    curl "https://cryptocurrency.cv/api/news?source=coindesk&limit=5"
    
    # Filter by category
    curl "https://cryptocurrency.cv/api/news?category=defi&limit=5"
    ```

---

## Response Format

```json
{
  "articles": [
    {
      "title": "Bitcoin Surges Past $100K as Institutional Demand Grows",
      "link": "https://coindesk.com/markets/2026/01/22/bitcoin-surges...",
      "description": "Bitcoin reached a new all-time high amid increased ETF inflows...",
      "pubDate": "2026-01-22T10:30:00Z",
      "source": "CoinDesk",
      "sourceKey": "coindesk",
      "category": "markets",
      "timeAgo": "2 hours ago",
      "image": "https://coindesk.com/..."
    }
  ],
  "totalCount": 1250,
  "sources": ["CoinDesk", "The Block", "Decrypt", "Cointelegraph", "DeFiant", "Blockworks", "Bitcoin Magazine"],
  "fetchedAt": "2026-01-22T12:30:00Z",
  "pagination": {
    "page": 1,
    "perPage": 10,
    "totalPages": 125,
    "hasMore": true
  },
  "lang": "en",
  "availableLanguages": ["en", "zh-CN", "ja-JP", "ko-KR", "es", "de", "fr", "pt", "ru"],
  "responseTime": "245ms"
}
```

---

## Category-Specific News

### Bitcoin News

=== "Python"

    ```python
    def get_bitcoin_news(limit: int = 20, lang: str = "en") -> dict:
        """Get Bitcoin-specific news and analysis."""
        params = {"limit": limit, "lang": lang}
        response = requests.get(f"{BASE_URL}/api/bitcoin", params=params)
        return response.json()
    
    
    # Get latest Bitcoin news
    btc_news = get_bitcoin_news(limit=5)
    print("₿ Bitcoin News:")
    for article in btc_news["articles"]:
        print(f"  - {article['title']}")
    ```

=== "JavaScript"

    ```javascript
    async function getBitcoinNews(limit = 20, lang = "en") {
        const params = new URLSearchParams({ limit, lang });
        const response = await fetch(`${BASE_URL}/api/bitcoin?${params}`);
        return response.json();
    }
    
    // Get latest Bitcoin news
    const btcNews = await getBitcoinNews(5);
    console.log("₿ Bitcoin News:");
    btcNews.articles.forEach(article => {
        console.log(`  - ${article.title}`);
    });
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/bitcoin?limit=5"
    ```

### DeFi News

=== "Python"

    ```python
    def get_defi_news(limit: int = 20, lang: str = "en") -> dict:
        """Get DeFi protocol news and updates."""
        params = {"limit": limit, "lang": lang}
        response = requests.get(f"{BASE_URL}/api/defi", params=params)
        return response.json()
    
    
    # Get latest DeFi news
    defi_news = get_defi_news(limit=5)
    print("🔷 DeFi News:")
    for article in defi_news["articles"]:
        print(f"  - {article['title']}")
    ```

=== "JavaScript"

    ```javascript
    async function getDefiNews(limit = 20, lang = "en") {
        const params = new URLSearchParams({ limit, lang });
        const response = await fetch(`${BASE_URL}/api/defi?${params}`);
        return response.json();
    }
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/defi?limit=5"
    ```

### Breaking News

=== "Python"

    ```python
    def get_breaking_news() -> dict:
        """
        Get breaking/urgent news from the last hour.
        Cached for only 1 minute for freshness.
        """
        response = requests.get(f"{BASE_URL}/api/breaking")
        return response.json()
    
    
    # Get breaking news
    breaking = get_breaking_news()
    print(f"⚡ {len(breaking.get('articles', []))} Breaking Stories:")
    for article in breaking["articles"][:5]:
        print(f"  🔴 {article['title']}")
    ```

=== "JavaScript"

    ```javascript
    async function getBreakingNews() {
        const response = await fetch(`${BASE_URL}/api/breaking`);
        return response.json();
    }
    
    const breaking = await getBreakingNews();
    console.log(`⚡ ${breaking.articles.length} Breaking Stories`);
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/breaking"
    ```

---

## List Available Sources

=== "Python"

    ```python
    def get_sources() -> dict:
        """Get all available news sources with metadata."""
        response = requests.get(f"{BASE_URL}/api/sources")
        return response.json()
    
    
    # List all sources
    sources = get_sources()
    print(f"📡 {sources.get('count', 0)} News Sources Available:")
    for source in sources.get("sources", []):
        if isinstance(source, dict):
            print(f"  - {source.get('name', 'Unknown')} ({source.get('key', '')})")
        else:
            print(f"  - {source}")
    ```

=== "JavaScript"

    ```javascript
    async function getSources() {
        const response = await fetch(`${BASE_URL}/api/sources`);
        return response.json();
    }
    
    const sources = await getSources();
    console.log(`📡 ${sources.count} News Sources Available`);
    sources.sources.forEach(source => {
        console.log(`  - ${source.name} (${source.key})`);
    });
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/sources" | jq '.sources[].name'
    ```

---

## List Categories

=== "Python"

    ```python
    def get_categories() -> dict:
        """Get all available news categories with article counts."""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        return response.json()
    
    
    # List categories
    categories = get_categories()
    print(f"🏷️ {categories.get('totalCategories', 0)} Categories:")
    for cat in categories.get("categories", []):
        name = cat.get("name", cat) if isinstance(cat, dict) else cat
        count = cat.get("count", "") if isinstance(cat, dict) else ""
        print(f"  - {name} {f'({count} articles)' if count else ''}")
    ```

=== "JavaScript"

    ```javascript
    async function getCategories() {
        const response = await fetch(`${BASE_URL}/api/news/categories`);
        return response.json();
    }
    
    const categories = await getCategories();
    console.log(`🏷️ ${categories.totalCategories} Categories`);
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/news/categories"
    ```

---

## Pagination

Handle large result sets with pagination:

=== "Python"

    ```python
    def get_all_news_paginated(max_pages: int = 5, per_page: int = 20):
        """
        Fetch multiple pages of news.
        
        Args:
            max_pages: Maximum pages to fetch
            per_page: Articles per page
        
        Yields:
            Article dictionaries
        """
        page = 1
        
        while page <= max_pages:
            response = requests.get(
                f"{BASE_URL}/api/news",
                params={"page": page, "per_page": per_page}
            )
            data = response.json()
            
            articles = data.get("articles", [])
            if not articles:
                break
            
            for article in articles:
                yield article
            
            # Check if more pages exist
            pagination = data.get("pagination", {})
            if not pagination.get("hasMore", False):
                break
            
            page += 1
    
    
    # Example: Fetch first 100 articles
    all_articles = list(get_all_news_paginated(max_pages=5, per_page=20))
    print(f"Fetched {len(all_articles)} articles across multiple pages")
    ```

=== "JavaScript"

    ```javascript
    async function* getAllNewsPaginated(maxPages = 5, perPage = 20) {
        let page = 1;
        
        while (page <= maxPages) {
            const params = new URLSearchParams({
                page: page.toString(),
                per_page: perPage.toString()
            });
            
            const response = await fetch(`${BASE_URL}/api/news?${params}`);
            const data = await response.json();
            
            if (!data.articles?.length) break;
            
            for (const article of data.articles) {
                yield article;
            }
            
            if (!data.pagination?.hasMore) break;
            page++;
        }
    }
    
    // Collect all articles
    const allArticles = [];
    for await (const article of getAllNewsPaginated(5, 20)) {
        allArticles.push(article);
    }
    console.log(`Fetched ${allArticles.length} articles`);
    ```

---

## Date Filtering

Filter news by date range:

=== "Python"

    ```python
    from datetime import datetime, timedelta
    
    def get_news_by_date(from_date: str, to_date: str, limit: int = 50) -> dict:
        """
        Get news within a date range.
        
        Args:
            from_date: Start date (YYYY-MM-DD or ISO format)
            to_date: End date (YYYY-MM-DD or ISO format)
            limit: Max articles
        
        Returns:
            Filtered news articles
        """
        params = {
            "from": from_date,
            "to": to_date,
            "limit": limit
        }
        response = requests.get(f"{BASE_URL}/api/news", params=params)
        return response.json()
    
    
    # Get yesterday's news
    today = datetime.now()
    yesterday = today - timedelta(days=1)
    
    news = get_news_by_date(
        from_date=yesterday.strftime("%Y-%m-%d"),
        to_date=today.strftime("%Y-%m-%d"),
        limit=50
    )
    print(f"Yesterday's news: {len(news.get('articles', []))} articles")
    ```

=== "JavaScript"

    ```javascript
    async function getNewsByDate(fromDate, toDate, limit = 50) {
        const params = new URLSearchParams({
            from: fromDate,
            to: toDate,
            limit: limit.toString()
        });
        
        const response = await fetch(`${BASE_URL}/api/news?${params}`);
        return response.json();
    }
    
    // Get yesterday's news
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const news = await getNewsByDate(
        yesterday.toISOString().split('T')[0],
        today.toISOString().split('T')[0],
        50
    );
    console.log(`Yesterday's news: ${news.articles.length} articles`);
    ```

---

## Complete Example: News Dashboard

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Complete News Dashboard Example
    Demonstrates fetching news from multiple endpoints.
    """
    
    import requests
    from datetime import datetime
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def main():
        print("=" * 70)
        print("🚀 CRYPTO NEWS DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # 1. Breaking News
        print("\n⚡ BREAKING NEWS")
        print("-" * 70)
        breaking = requests.get(f"{BASE_URL}/api/breaking").json()
        for article in breaking.get("articles", [])[:3]:
            print(f"🔴 {article['title'][:65]}...")
            print(f"   {article['source']} | {article.get('timeAgo', '')}")
        
        # 2. Bitcoin News
        print("\n₿ BITCOIN NEWS")
        print("-" * 70)
        btc = requests.get(f"{BASE_URL}/api/bitcoin?limit=3").json()
        for article in btc.get("articles", btc)[:3]:
            print(f"• {article['title'][:65]}...")
        
        # 3. DeFi News
        print("\n🔷 DEFI NEWS")
        print("-" * 70)
        defi = requests.get(f"{BASE_URL}/api/defi?limit=3").json()
        for article in defi.get("articles", defi)[:3]:
            print(f"• {article['title'][:65]}...")
        
        # 4. Trending Topics
        print("\n🔥 TRENDING TOPICS")
        print("-" * 70)
        trending = requests.get(f"{BASE_URL}/api/trending?limit=5").json()
        topics = trending.get("topics", trending)[:5]
        for i, topic in enumerate(topics, 1):
            name = topic.get("keyword", topic) if isinstance(topic, dict) else topic
            print(f"   {i}. {name}")
        
        # 5. Available Sources
        print("\n📡 NEWS SOURCES")
        print("-" * 70)
        sources = requests.get(f"{BASE_URL}/api/sources").json()
        source_list = sources.get("sources", [])
        source_names = [s.get("name", s) if isinstance(s, dict) else s for s in source_list[:7]]
        print(f"   {', '.join(source_names)}")
        
        print("\n" + "=" * 70)
        print("✅ Dashboard complete! All data from cryptocurrency.cv")
        print("=" * 70)
    
    
    if __name__ == "__main__":
        main()
    ```

=== "JavaScript"

    ```javascript
    /**
     * Complete News Dashboard Example
     * Demonstrates fetching news from multiple endpoints.
     */
    
    const BASE_URL = "https://cryptocurrency.cv";
    
    async function main() {
        console.log("=".repeat(70));
        console.log("🚀 CRYPTO NEWS DASHBOARD");
        console.log(`   Generated: ${new Date().toISOString()}`);
        console.log("=".repeat(70));
        
        // 1. Breaking News
        console.log("\n⚡ BREAKING NEWS");
        console.log("-".repeat(70));
        const breaking = await fetch(`${BASE_URL}/api/breaking`).then(r => r.json());
        breaking.articles?.slice(0, 3).forEach(article => {
            console.log(`🔴 ${article.title.slice(0, 65)}...`);
            console.log(`   ${article.source} | ${article.timeAgo || ''}`);
        });
        
        // 2. Bitcoin News
        console.log("\n₿ BITCOIN NEWS");
        console.log("-".repeat(70));
        const btc = await fetch(`${BASE_URL}/api/bitcoin?limit=3`).then(r => r.json());
        (btc.articles || btc).slice(0, 3).forEach(article => {
            console.log(`• ${article.title.slice(0, 65)}...`);
        });
        
        // 3. DeFi News
        console.log("\n🔷 DEFI NEWS");
        console.log("-".repeat(70));
        const defi = await fetch(`${BASE_URL}/api/defi?limit=3`).then(r => r.json());
        (defi.articles || defi).slice(0, 3).forEach(article => {
            console.log(`• ${article.title.slice(0, 65)}...`);
        });
        
        // 4. Trending Topics
        console.log("\n🔥 TRENDING TOPICS");
        console.log("-".repeat(70));
        const trending = await fetch(`${BASE_URL}/api/trending?limit=5`).then(r => r.json());
        (trending.topics || trending).slice(0, 5).forEach((topic, i) => {
            const name = topic.keyword || topic;
            console.log(`   ${i + 1}. ${name}`);
        });
        
        console.log("\n" + "=".repeat(70));
        console.log("✅ Dashboard complete!");
        console.log("=".repeat(70));
    }
    
    main().catch(console.error);
    ```

---

## Error Handling

=== "Python"

    ```python
    import requests
    from requests.exceptions import RequestException, Timeout
    
    def safe_get_news(limit: int = 20, timeout: int = 10) -> dict:
        """Fetch news with proper error handling."""
        try:
            response = requests.get(
                f"{BASE_URL}/api/news",
                params={"limit": limit},
                timeout=timeout
            )
            response.raise_for_status()
            return response.json()
        
        except Timeout:
            print("⚠️ Request timed out. Try again later.")
            return {"articles": [], "error": "timeout"}
        
        except RequestException as e:
            print(f"❌ Network error: {e}")
            return {"articles": [], "error": str(e)}
        
        except ValueError as e:
            print(f"❌ Invalid JSON response: {e}")
            return {"articles": [], "error": "invalid_json"}
    ```

=== "JavaScript"

    ```javascript
    async function safeGetNews(limit = 20, timeoutMs = 10000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        try {
            const response = await fetch(
                `${BASE_URL}/api/news?limit=${limit}`,
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === "AbortError") {
                console.warn("⚠️ Request timed out");
                return { articles: [], error: "timeout" };
            }
            
            console.error(`❌ Error: ${error.message}`);
            return { articles: [], error: error.message };
        }
    }
    ```

---

## Next Steps

- [Search & Filtering](search-filtering.md) - Advanced search techniques
- [International News](international-news.md) - Access 75+ international sources
- [Article Extraction](article-extraction.md) - Extract full article content
- [AI Sentiment Analysis](ai-sentiment.md) - Add sentiment analysis to news
