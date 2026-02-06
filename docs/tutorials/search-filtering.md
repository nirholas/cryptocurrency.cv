# 🔍 Search & Filtering Tutorial

Master advanced search techniques to find exactly the news you need.

---

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `GET /api/search` | Full-text search |
| `GET /api/trending` | Trending topics |
| `GET /api/tags` | Browse by tags |
| `GET /api/tags/[slug]` | Tag-specific articles |

---

## Full-Text Search

Search across all news articles with powerful query options.

=== "Python"

    ```python
    import requests
    from typing import Optional
    from datetime import datetime, timedelta
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def search_news(
        query: str,
        limit: int = 20,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        lang: str = "en"
    ) -> dict:
        """
        Full-text search across all news articles.
        
        Args:
            query: Search query (required)
            limit: Number of results (1-100)
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
            lang: Language code
        
        Returns:
            Search results with articles and metadata
        """
        params = {
            "q": query,
            "limit": limit,
            "lang": lang
        }
        
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        response = requests.get(f"{BASE_URL}/api/search", params=params)
        response.raise_for_status()
        return response.json()
    
    
    # Example: Search for Ethereum ETF news
    results = search_news("Ethereum ETF", limit=10)
    
    print(f"🔍 Search Results for 'Ethereum ETF'")
    print(f"   Found: {results.get('totalCount', 0)} articles")
    print(f"   Search time: {results.get('searchTime', 'N/A')}")
    print("-" * 60)
    
    for article in results.get("articles", []):
        print(f"\n📰 {article['title']}")
        print(f"   Source: {article['source']} | {article.get('timeAgo', '')}")
    ```

=== "JavaScript"

    ```javascript
    const BASE_URL = "https://cryptocurrency.cv";
    
    /**
     * Full-text search across all news articles.
     * @param {string} query - Search query
     * @param {Object} options - Search options
     */
    async function searchNews(query, { limit = 20, fromDate, toDate, lang = "en" } = {}) {
        const params = new URLSearchParams({
            q: query,
            limit: limit.toString(),
            lang
        });
        
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);
        
        const response = await fetch(`${BASE_URL}/api/search?${params}`);
        return response.json();
    }
    
    // Example usage
    const results = await searchNews("Ethereum ETF", { limit: 10 });
    
    console.log(`🔍 Search Results: ${results.totalCount} articles`);
    console.log(`   Search time: ${results.searchTime}`);
    
    results.articles.forEach(article => {
        console.log(`\n📰 ${article.title}`);
        console.log(`   ${article.source} | ${article.timeAgo}`);
    });
    ```

=== "cURL"

    ```bash
    # Basic search
    curl "https://cryptocurrency.cv/api/search?q=Ethereum%20ETF&limit=10"
    
    # Search with date range
    curl "https://cryptocurrency.cv/api/search?q=Bitcoin&from=2026-01-01&to=2026-01-31"
    
    # Pretty print titles only
    curl -s "https://cryptocurrency.cv/api/search?q=DeFi" | jq '.articles[].title'
    ```

---

## Search Response

```json
{
  "query": "Ethereum ETF",
  "articles": [
    {
      "title": "SEC Approves First Ethereum Spot ETF",
      "link": "https://...",
      "description": "The Securities and Exchange Commission has approved...",
      "pubDate": "2026-01-22T10:30:00Z",
      "source": "CoinDesk",
      "sourceKey": "coindesk",
      "relevanceScore": 0.95,
      "highlights": ["<mark>Ethereum</mark> <mark>ETF</mark> approval..."]
    }
  ],
  "totalCount": 42,
  "searchTime": "125ms",
  "suggestions": ["ethereum etf approval", "eth spot etf"]
}
```

---

## Advanced Search Queries

### Boolean Search

=== "Python"

    ```python
    # AND search (both terms required)
    results = search_news("Bitcoin AND regulation")
    
    # OR search (either term)
    results = search_news("Ethereum OR Solana")
    
    # NOT search (exclude term)
    results = search_news("cryptocurrency NOT meme")
    
    # Phrase search (exact match)
    results = search_news('"spot ETF approval"')
    
    # Wildcard search
    results = search_news("Layer*")  # Layer1, Layer2, etc.
    ```

=== "JavaScript"

    ```javascript
    // AND search
    const results1 = await searchNews("Bitcoin AND regulation");
    
    // OR search  
    const results2 = await searchNews("Ethereum OR Solana");
    
    // NOT search
    const results3 = await searchNews("cryptocurrency NOT meme");
    
    // Phrase search
    const results4 = await searchNews('"spot ETF approval"');
    ```

### Ticker Search

=== "Python"

    ```python
    def search_by_ticker(ticker: str, limit: int = 20) -> dict:
        """Search articles mentioning a specific ticker."""
        # Use $ prefix for exact ticker matching
        query = f"${ticker.upper()}"
        return search_news(query, limit=limit)
    
    
    # Find articles about $BTC, $ETH, $SOL
    btc_articles = search_by_ticker("BTC", limit=10)
    print(f"Articles mentioning $BTC: {btc_articles.get('totalCount', 0)}")
    ```

=== "JavaScript"

    ```javascript
    async function searchByTicker(ticker, limit = 20) {
        const query = `$${ticker.toUpperCase()}`;
        return searchNews(query, { limit });
    }
    
    const btcArticles = await searchByTicker("BTC", 10);
    console.log(`Articles about $BTC: ${btcArticles.totalCount}`);
    ```

---

## Trending Topics

Get the hottest topics being discussed right now.

=== "Python"

    ```python
    def get_trending(limit: int = 10) -> dict:
        """
        Get trending topics and keywords.
        
        Args:
            limit: Number of trending items (1-50)
        
        Returns:
            Trending topics with scores and metadata
        """
        response = requests.get(
            f"{BASE_URL}/api/trending",
            params={"limit": limit}
        )
        return response.json()
    
    
    # Get top 10 trending topics
    trending = get_trending(limit=10)
    
    print("🔥 TRENDING TOPICS")
    print("-" * 40)
    
    for i, topic in enumerate(trending.get("topics", []), 1):
        if isinstance(topic, dict):
            keyword = topic.get("keyword", "")
            score = topic.get("score", 0)
            articles = topic.get("articleCount", 0)
            print(f"{i:2}. {keyword:<20} (Score: {score:.1f}, {articles} articles)")
        else:
            print(f"{i:2}. {topic}")
    ```

=== "JavaScript"

    ```javascript
    async function getTrending(limit = 10) {
        const response = await fetch(`${BASE_URL}/api/trending?limit=${limit}`);
        return response.json();
    }
    
    const trending = await getTrending(10);
    
    console.log("🔥 TRENDING TOPICS");
    console.log("-".repeat(40));
    
    trending.topics.forEach((topic, i) => {
        const keyword = topic.keyword || topic;
        const score = topic.score?.toFixed(1) || "N/A";
        console.log(`${i + 1}. ${keyword} (Score: ${score})`);
    });
    ```

=== "cURL"

    ```bash
    # Get top 10 trending topics
    curl "https://cryptocurrency.cv/api/trending?limit=10"
    
    # Extract just keywords
    curl -s "https://cryptocurrency.cv/api/trending?limit=10" | \
        jq '.topics[] | .keyword // .'
    ```

---

## Browse by Tags

Discover and explore content organized by tags.

### List All Tags

=== "Python"

    ```python
    def get_tags(category: Optional[str] = None) -> dict:
        """
        Get all available tags.
        
        Args:
            category: Filter by category (optional)
        
        Returns:
            Tags organized by category with article counts
        """
        params = {}
        if category:
            params["category"] = category
        
        response = requests.get(f"{BASE_URL}/api/tags", params=params)
        return response.json()
    
    
    # List all tags
    tags = get_tags()
    
    print(f"🏷️ Total Tags: {tags.get('totalCount', 0)}")
    print("-" * 40)
    
    for category, tag_list in tags.get("categories", {}).items():
        print(f"\n{category.upper()}:")
        for tag in tag_list[:5]:
            name = tag.get("name", tag) if isinstance(tag, dict) else tag
            count = tag.get("count", "") if isinstance(tag, dict) else ""
            print(f"  • {name} {f'({count})' if count else ''}")
    ```

=== "JavaScript"

    ```javascript
    async function getTags(category) {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        
        const response = await fetch(`${BASE_URL}/api/tags?${params}`);
        return response.json();
    }
    
    const tags = await getTags();
    
    console.log(`🏷️ Total Tags: ${tags.totalCount}`);
    
    for (const [category, tagList] of Object.entries(tags.categories || {})) {
        console.log(`\n${category.toUpperCase()}:`);
        tagList.slice(0, 5).forEach(tag => {
            const name = tag.name || tag;
            const count = tag.count ? ` (${tag.count})` : "";
            console.log(`  • ${name}${count}`);
        });
    }
    ```

=== "cURL"

    ```bash
    # Get all tags
    curl "https://cryptocurrency.cv/api/tags"
    
    # Get specific category
    curl "https://cryptocurrency.cv/api/tags?category=coins"
    ```

### Get Articles by Tag

=== "Python"

    ```python
    def get_tag_articles(slug: str, limit: int = 20) -> dict:
        """
        Get articles for a specific tag.
        
        Args:
            slug: Tag slug (e.g., "bitcoin", "ethereum", "defi")
            limit: Number of articles
        
        Returns:
            Tag info with articles and related tags
        """
        response = requests.get(
            f"{BASE_URL}/api/tags/{slug}",
            params={"limit": limit}
        )
        return response.json()
    
    
    # Get Bitcoin-tagged articles
    bitcoin_tag = get_tag_articles("bitcoin", limit=5)
    
    print(f"📌 Tag: {bitcoin_tag.get('tag', {}).get('name', 'bitcoin')}")
    print(f"   Total articles: {bitcoin_tag.get('articleCount', 0)}")
    print("-" * 50)
    
    for article in bitcoin_tag.get("articles", []):
        print(f"\n• {article['title']}")
        print(f"  {article['source']} | {article.get('timeAgo', '')}")
    
    # Show related tags
    print(f"\n🔗 Related Tags:")
    for tag in bitcoin_tag.get("relatedTags", [])[:5]:
        print(f"  • {tag.get('name', tag) if isinstance(tag, dict) else tag}")
    ```

=== "JavaScript"

    ```javascript
    async function getTagArticles(slug, limit = 20) {
        const response = await fetch(
            `${BASE_URL}/api/tags/${slug}?limit=${limit}`
        );
        return response.json();
    }
    
    const bitcoinTag = await getTagArticles("bitcoin", 5);
    
    console.log(`📌 Tag: ${bitcoinTag.tag?.name || "bitcoin"}`);
    console.log(`   Total articles: ${bitcoinTag.articleCount}`);
    
    bitcoinTag.articles?.forEach(article => {
        console.log(`• ${article.title}`);
    });
    
    console.log("\n🔗 Related Tags:");
    bitcoinTag.relatedTags?.slice(0, 5).forEach(tag => {
        console.log(`  • ${tag.name || tag}`);
    });
    ```

=== "cURL"

    ```bash
    # Get articles tagged with 'bitcoin'
    curl "https://cryptocurrency.cv/api/tags/bitcoin?limit=10"
    
    # Get DeFi articles
    curl "https://cryptocurrency.cv/api/tags/defi?limit=10"
    ```

---

## Complete Search Application

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Complete Search Application
    Interactive CLI for searching crypto news.
    """
    
    import requests
    from datetime import datetime, timedelta
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    class CryptoNewsSearch:
        def __init__(self):
            self.session = requests.Session()
        
        def search(self, query: str, **kwargs) -> dict:
            """Full-text search."""
            params = {"q": query, **kwargs}
            response = self.session.get(f"{BASE_URL}/api/search", params=params)
            return response.json()
        
        def trending(self, limit: int = 10) -> dict:
            """Get trending topics."""
            response = self.session.get(
                f"{BASE_URL}/api/trending",
                params={"limit": limit}
            )
            return response.json()
        
        def tags(self) -> dict:
            """Get all tags."""
            return self.session.get(f"{BASE_URL}/api/tags").json()
        
        def tag_articles(self, slug: str, limit: int = 10) -> dict:
            """Get articles by tag."""
            return self.session.get(
                f"{BASE_URL}/api/tags/{slug}",
                params={"limit": limit}
            ).json()
    
    
    def main():
        search_client = CryptoNewsSearch()
        
        print("=" * 60)
        print("🔍 CRYPTO NEWS SEARCH ENGINE")
        print("=" * 60)
        
        # Show trending first
        print("\n📈 What's Trending Right Now:")
        trending = search_client.trending(5)
        for topic in trending.get("topics", [])[:5]:
            keyword = topic.get("keyword", topic) if isinstance(topic, dict) else topic
            print(f"   • {keyword}")
        
        # Perform sample searches
        queries = ["Bitcoin ETF", "Ethereum staking", "DeFi hack"]
        
        for query in queries:
            print(f"\n🔍 Searching: '{query}'")
            print("-" * 40)
            
            results = search_client.search(query, limit=3)
            print(f"   Found: {results.get('totalCount', 0)} articles")
            
            for article in results.get("articles", [])[:3]:
                print(f"\n   📰 {article['title'][:50]}...")
                print(f"      {article['source']}")
        
        # Browse by tag
        print("\n\n📌 Articles tagged 'regulation':")
        print("-" * 40)
        
        reg_articles = search_client.tag_articles("regulation", limit=3)
        for article in reg_articles.get("articles", []):
            print(f"   • {article['title'][:50]}...")
        
        print("\n" + "=" * 60)
        print("✅ Search demo complete!")
    
    
    if __name__ == "__main__":
        main()
    ```

=== "JavaScript"

    ```javascript
    /**
     * Complete Search Application
     * Interactive CLI for searching crypto news.
     */
    
    const BASE_URL = "https://cryptocurrency.cv";
    
    class CryptoNewsSearch {
        async search(query, options = {}) {
            const params = new URLSearchParams({ q: query, ...options });
            const response = await fetch(`${BASE_URL}/api/search?${params}`);
            return response.json();
        }
        
        async trending(limit = 10) {
            const response = await fetch(`${BASE_URL}/api/trending?limit=${limit}`);
            return response.json();
        }
        
        async tags() {
            const response = await fetch(`${BASE_URL}/api/tags`);
            return response.json();
        }
        
        async tagArticles(slug, limit = 10) {
            const response = await fetch(
                `${BASE_URL}/api/tags/${slug}?limit=${limit}`
            );
            return response.json();
        }
    }
    
    async function main() {
        const client = new CryptoNewsSearch();
        
        console.log("=".repeat(60));
        console.log("🔍 CRYPTO NEWS SEARCH ENGINE");
        console.log("=".repeat(60));
        
        // Show trending
        console.log("\n📈 What's Trending:");
        const trending = await client.trending(5);
        trending.topics?.slice(0, 5).forEach(topic => {
            const keyword = topic.keyword || topic;
            console.log(`   • ${keyword}`);
        });
        
        // Sample searches
        const queries = ["Bitcoin ETF", "Ethereum staking", "DeFi hack"];
        
        for (const query of queries) {
            console.log(`\n🔍 Searching: '${query}'`);
            console.log("-".repeat(40));
            
            const results = await client.search(query, { limit: 3 });
            console.log(`   Found: ${results.totalCount} articles`);
            
            results.articles?.slice(0, 3).forEach(article => {
                console.log(`\n   📰 ${article.title.slice(0, 50)}...`);
            });
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("✅ Search demo complete!");
    }
    
    main().catch(console.error);
    ```

---

## Next Steps

- [International News](international-news.md) - Access 75+ international sources
- [Article Extraction](article-extraction.md) - Extract full article content  
- [AI Sentiment Analysis](ai-sentiment.md) - Analyze sentiment of search results
