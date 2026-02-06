# Article Extraction & Content Tutorial

This tutorial covers article extraction endpoints for fetching full article content, reader mode, and content extraction.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/article/[slug]` | Get article by slug |
| `/api/article/extract` | Extract content from URL |
| `/api/article/reader` | Reader mode view |
| `/api/article/metadata` | Article metadata |
| `/api/article/related` | Related articles |
| `/api/article/comments` | Article comments |
| `/api/detect/ai-content` | Detect AI-generated content |

---

## 1. Fetch Article by Slug

Get full article content using its slug or ID.

=== "Python"
    ```python
    import requests
    
    def get_article(slug: str):
        """Get full article by slug."""
        response = requests.get(
            f"https://cryptocurrency.cv/api/article/{slug}"
        )
        return response.json()
    
    def get_article_metadata(slug: str):
        """Get article metadata only."""
        response = requests.get(
            f"https://cryptocurrency.cv/api/article/{slug}/metadata"
        )
        return response.json()
    
    # Get article
    slug = "bitcoin-reaches-new-all-time-high-2024"
    article = get_article(slug)
    
    print("📰 Article Details")
    print("=" * 70)
    
    print(f"   Title: {article.get('title', 'N/A')}")
    print(f"   Source: {article.get('source', 'N/A')}")
    print(f"   Author: {article.get('author', 'N/A')}")
    print(f"   Published: {article.get('publishedAt', 'N/A')}")
    print(f"   URL: {article.get('url', 'N/A')}")
    
    # Categories and tags
    print(f"\n   Categories: {', '.join(article.get('categories', []))}")
    print(f"   Tags: {', '.join(article.get('tags', []))}")
    
    # Sentiment
    sentiment = article.get('sentiment', {})
    print(f"\n   📊 Sentiment:")
    print(f"      Score: {sentiment.get('score', 0):.2f}")
    print(f"      Label: {sentiment.get('label', 'N/A')}")
    
    # Assets mentioned
    assets = article.get('assets', [])
    if assets:
        print(f"\n   🪙 Assets Mentioned:")
        for asset in assets[:10]:
            print(f"      • {asset.get('symbol', 'N/A')}: {asset.get('mentions', 0)} mentions")
    
    # Content
    content = article.get('content', '')
    print(f"\n   📝 Content Preview:")
    print(f"      {content[:500]}...")
    
    # Word count and reading time
    word_count = article.get('wordCount', 0)
    reading_time = article.get('readingTime', 0)
    print(f"\n   📖 {word_count} words • {reading_time} min read")
    
    # Metadata only
    print("\n" + "=" * 70)
    print("📋 Metadata Only:")
    
    metadata = get_article_metadata(slug)
    print(f"   Title: {metadata.get('title', 'N/A')}")
    print(f"   Description: {metadata.get('description', 'N/A')[:100]}...")
    print(f"   Image: {metadata.get('image', 'N/A')}")
    print(f"   Language: {metadata.get('language', 'N/A')}")
    ```

=== "JavaScript"
    ```javascript
    async function getArticle(slug) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/article/${slug}`
        );
        return response.json();
    }
    
    async function getArticleMetadata(slug) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/article/${slug}/metadata`
        );
        return response.json();
    }
    
    // Get article
    const slug = 'bitcoin-reaches-new-all-time-high-2024';
    const article = await getArticle(slug);
    
    console.log("📰 Article Details");
    console.log("=".repeat(70));
    
    console.log(`   Title: ${article.title}`);
    console.log(`   Source: ${article.source}`);
    console.log(`   Author: ${article.author}`);
    console.log(`   Published: ${article.publishedAt}`);
    
    // Categories
    console.log(`   Categories: ${article.categories?.join(', ')}`);
    console.log(`   Tags: ${article.tags?.join(', ')}`);
    
    // Sentiment
    console.log(`\n   📊 Sentiment: ${article.sentiment?.score?.toFixed(2)} (${article.sentiment?.label})`);
    
    // Assets
    if (article.assets?.length) {
        console.log("\n   🪙 Assets:");
        article.assets.slice(0, 10).forEach(asset => {
            console.log(`      • ${asset.symbol}: ${asset.mentions} mentions`);
        });
    }
    
    // Content preview
    console.log(`\n   📝 Content: ${article.content?.slice(0, 300)}...`);
    console.log(`\n   📖 ${article.wordCount} words • ${article.readingTime} min read`);
    ```

=== "cURL"
    ```bash
    # Get full article
    curl "https://cryptocurrency.cv/api/article/bitcoin-reaches-new-all-time-high" | jq
    
    # Get metadata only
    curl "https://cryptocurrency.cv/api/article/bitcoin-reaches-new-all-time-high/metadata" | jq
    
    # Get just title and sentiment
    curl "https://cryptocurrency.cv/api/article/bitcoin-reaches-new-all-time-high" | jq '{title, sentiment}'
    ```

---

## 2. Extract Content from URL

Extract article content from any URL.

=== "Python"
    ```python
    import requests
    
    def extract_article(url: str, options: dict = None):
        """Extract article content from URL."""
        data = {"url": url}
        if options:
            data.update(options)
        
        response = requests.post(
            "https://cryptocurrency.cv/api/article/extract",
            json=data
        )
        return response.json()
    
    # Extract article from URL
    url = "https://www.coindesk.com/markets/2024/01/15/bitcoin-etf-approval/"
    
    print("🔍 Extracting Article Content")
    print("=" * 70)
    print(f"   URL: {url}")
    
    extracted = extract_article(url, {
        "includeImages": True,
        "includeMetadata": True,
        "cleanContent": True
    })
    
    if extracted.get('success'):
        article = extracted.get('article', {})
        
        print(f"\n✅ Extraction Successful")
        print(f"   Title: {article.get('title', 'N/A')}")
        print(f"   Author: {article.get('author', 'N/A')}")
        print(f"   Published: {article.get('publishedAt', 'N/A')}")
        print(f"   Site: {article.get('siteName', 'N/A')}")
        
        # Content stats
        content = article.get('content', '')
        word_count = len(content.split())
        print(f"\n   📝 Content:")
        print(f"      Words: {word_count}")
        print(f"      Preview: {content[:300]}...")
        
        # Images
        images = article.get('images', [])
        if images:
            print(f"\n   🖼️ Images ({len(images)}):")
            for img in images[:5]:
                print(f"      • {img.get('url', 'N/A')[:60]}...")
        
        # Metadata
        metadata = article.get('metadata', {})
        if metadata:
            print(f"\n   📋 Metadata:")
            print(f"      Description: {metadata.get('description', 'N/A')[:80]}...")
            print(f"      Keywords: {', '.join(metadata.get('keywords', [])[:5])}")
    else:
        print(f"\n❌ Extraction failed: {extracted.get('error', 'Unknown error')}")
    
    # Batch extraction
    print("\n" + "=" * 70)
    print("📦 Batch Extraction:")
    
    urls = [
        "https://cointelegraph.com/news/example-article-1",
        "https://decrypt.co/news/example-article-2",
        "https://theblock.co/post/example-article-3"
    ]
    
    for url in urls:
        result = extract_article(url)
        status = "✅" if result.get('success') else "❌"
        title = result.get('article', {}).get('title', 'Failed')[:40]
        print(f"   {status} {title}...")
    ```

=== "JavaScript"
    ```javascript
    async function extractArticle(url, options = {}) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/article/extract',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, ...options })
            }
        );
        return response.json();
    }
    
    // Extract article
    const url = 'https://www.coindesk.com/markets/2024/01/15/bitcoin-etf-approval/';
    
    console.log("🔍 Extracting Article Content");
    console.log("=".repeat(70));
    console.log(`   URL: ${url}`);
    
    const extracted = await extractArticle(url, {
        includeImages: true,
        includeMetadata: true,
        cleanContent: true
    });
    
    if (extracted.success) {
        const article = extracted.article;
        
        console.log("\n✅ Extraction Successful");
        console.log(`   Title: ${article.title}`);
        console.log(`   Author: ${article.author}`);
        console.log(`   Site: ${article.siteName}`);
        
        // Content
        console.log(`\n   📝 Content: ${article.content?.slice(0, 300)}...`);
        
        // Images
        if (article.images?.length) {
            console.log(`\n   🖼️ Images (${article.images.length}):`);
            article.images.slice(0, 5).forEach(img => {
                console.log(`      • ${img.url?.slice(0, 60)}...`);
            });
        }
    } else {
        console.log(`\n❌ Failed: ${extracted.error}`);
    }
    ```

=== "cURL"
    ```bash
    # Extract article
    curl -X POST "https://cryptocurrency.cv/api/article/extract" \
      -H "Content-Type: application/json" \
      -d '{
        "url": "https://www.coindesk.com/markets/2024/01/15/example/",
        "includeImages": true,
        "includeMetadata": true
      }' | jq
    
    # Extract just content
    curl -X POST "https://cryptocurrency.cv/api/article/extract" \
      -H "Content-Type: application/json" \
      -d '{"url": "https://example.com/article"}' | jq '.article.content'
    ```

---

## 3. Reader Mode

Get clean, reader-friendly article content.

=== "Python"
    ```python
    import requests
    
    def get_reader_mode(url_or_slug: str, options: dict = None):
        """Get reader mode content."""
        params = {"url": url_or_slug}
        if options:
            params.update(options)
        
        response = requests.get(
            "https://cryptocurrency.cv/api/article/reader",
            params=params
        )
        return response.json()
    
    # Get reader mode
    url = "https://www.coindesk.com/markets/2024/bitcoin-analysis/"
    
    print("📖 Reader Mode")
    print("=" * 70)
    
    reader = get_reader_mode(url, {
        "fontSize": "medium",
        "theme": "light",
        "includeImages": True
    })
    
    if reader.get('success'):
        print(f"   Title: {reader.get('title', 'N/A')}")
        print(f"   Reading Time: {reader.get('readingTime', 0)} min")
        print(f"   Word Count: {reader.get('wordCount', 0)}")
        
        # Clean content
        content = reader.get('content', '')
        print(f"\n   📝 Clean Content:")
        print("-" * 70)
        
        # Show in paragraphs
        paragraphs = content.split('\n\n')
        for i, para in enumerate(paragraphs[:5]):
            print(f"   {para[:100]}...")
            print()
        
        if len(paragraphs) > 5:
            print(f"   ... and {len(paragraphs) - 5} more paragraphs")
        
        # Text-to-speech ready
        tts_content = reader.get('ttsContent', '')
        if tts_content:
            print(f"\n   🔊 TTS-Ready Content Available ({len(tts_content)} chars)")
    else:
        print(f"   ❌ Error: {reader.get('error', 'Unknown')}")
    ```

=== "JavaScript"
    ```javascript
    async function getReaderMode(urlOrSlug, options = {}) {
        const params = new URLSearchParams({ url: urlOrSlug, ...options });
        const response = await fetch(
            `https://cryptocurrency.cv/api/article/reader?${params}`
        );
        return response.json();
    }
    
    const url = 'https://www.coindesk.com/markets/2024/bitcoin-analysis/';
    
    console.log("📖 Reader Mode");
    console.log("=".repeat(70));
    
    const reader = await getReaderMode(url, {
        fontSize: 'medium',
        theme: 'light',
        includeImages: true
    });
    
    if (reader.success) {
        console.log(`   Title: ${reader.title}`);
        console.log(`   Reading Time: ${reader.readingTime} min`);
        console.log(`   Word Count: ${reader.wordCount}`);
        
        // Paragraphs
        const paragraphs = reader.content?.split('\n\n') || [];
        console.log("\n   📝 Content:");
        paragraphs.slice(0, 5).forEach(para => {
            console.log(`   ${para.slice(0, 100)}...`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get reader mode
    curl "https://cryptocurrency.cv/api/article/reader?url=https://example.com/article" | jq
    
    # Get just clean content
    curl "https://cryptocurrency.cv/api/article/reader?url=https://example.com/article" | jq '.content'
    ```

---

## 4. Related Articles

Get articles related to a specific article.

=== "Python"
    ```python
    import requests
    
    def get_related_articles(slug: str, limit: int = 10):
        """Get related articles."""
        response = requests.get(
            f"https://cryptocurrency.cv/api/article/{slug}/related",
            params={"limit": limit}
        )
        return response.json()
    
    # Get related articles
    slug = "bitcoin-etf-approval-sec-decision"
    
    print("🔗 Related Articles")
    print("=" * 70)
    
    related = get_related_articles(slug, limit=15)
    
    print(f"   Original: {slug}")
    print(f"   Found {related.get('count', 0)} related articles")
    
    print("\n   📰 Related Articles:")
    for i, article in enumerate(related.get('articles', [])[:10], 1):
        title = article.get('title', 'Unknown')[:50]
        relevance = article.get('relevanceScore', 0)
        source = article.get('source', 'N/A')
        
        relevance_bar = "█" * int(relevance * 10) + "░" * (10 - int(relevance * 10))
        print(f"   {i:2}. [{relevance_bar}] {title}...")
        print(f"       Source: {source}")
    
    # Group by topic
    print("\n📊 Related by Topic:")
    by_topic = {}
    for article in related.get('articles', []):
        topic = article.get('primaryTopic', 'Other')
        if topic not in by_topic:
            by_topic[topic] = []
        by_topic[topic].append(article)
    
    for topic, articles in sorted(by_topic.items(), key=lambda x: -len(x[1])):
        print(f"   {topic}: {len(articles)} articles")
    ```

=== "JavaScript"
    ```javascript
    async function getRelatedArticles(slug, limit = 10) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/article/${slug}/related?limit=${limit}`
        );
        return response.json();
    }
    
    const slug = 'bitcoin-etf-approval-sec-decision';
    
    console.log("🔗 Related Articles");
    console.log("=".repeat(70));
    
    const related = await getRelatedArticles(slug, 15);
    
    console.log(`   Original: ${slug}`);
    console.log(`   Found: ${related.count} related`);
    
    console.log("\n   📰 Related:");
    related.articles?.slice(0, 10).forEach((article, i) => {
        const bar = '█'.repeat(Math.floor(article.relevanceScore * 10));
        console.log(`   ${i+1}. [${bar.padEnd(10, '░')}] ${article.title?.slice(0, 50)}...`);
    });
    ```

=== "cURL"
    ```bash
    # Get related articles
    curl "https://cryptocurrency.cv/api/article/bitcoin-etf/related?limit=10" | jq
    
    # Get just titles
    curl "https://cryptocurrency.cv/api/article/bitcoin-etf/related" | jq '.articles[].title'
    ```

---

## 5. Detect AI-Generated Content

Analyze content to detect if it was AI-generated.

=== "Python"
    ```python
    import requests
    
    def detect_ai_content(text: str = None, url: str = None):
        """Detect AI-generated content."""
        data = {}
        if text:
            data["text"] = text
        if url:
            data["url"] = url
        
        response = requests.post(
            "https://cryptocurrency.cv/api/detect/ai-content",
            json=data
        )
        return response.json()
    
    # Detect AI content in text
    sample_text = """
    Bitcoin has reached a new all-time high of $100,000, marking a significant 
    milestone in the cryptocurrency's history. This achievement comes after years 
    of institutional adoption and growing mainstream acceptance. Analysts predict 
    continued growth as more companies add Bitcoin to their balance sheets.
    """
    
    print("🤖 AI Content Detection")
    print("=" * 70)
    
    result = detect_ai_content(text=sample_text)
    
    if result.get('success'):
        is_ai = result.get('isAiGenerated', False)
        confidence = result.get('confidence', 0)
        score = result.get('aiScore', 0)
        
        detection_icon = "🤖" if is_ai else "👤"
        print(f"   Detection: {detection_icon} {'AI-Generated' if is_ai else 'Human-Written'}")
        print(f"   Confidence: {confidence * 100:.1f}%")
        print(f"   AI Score: {score:.3f}")
        
        # Detailed analysis
        analysis = result.get('analysis', {})
        
        print(f"\n   📊 Analysis Breakdown:")
        print(f"      Perplexity: {analysis.get('perplexity', 'N/A')}")
        print(f"      Burstiness: {analysis.get('burstiness', 'N/A')}")
        print(f"      Vocabulary Diversity: {analysis.get('vocabularyDiversity', 'N/A')}")
        
        # Indicators
        indicators = result.get('indicators', [])
        if indicators:
            print(f"\n   🚩 AI Indicators Detected:")
            for indicator in indicators:
                print(f"      • {indicator}")
        
        # Patterns
        patterns = result.get('patterns', {})
        if patterns:
            print(f"\n   🔍 Pattern Analysis:")
            print(f"      Repetitive phrases: {patterns.get('repetitivePhrases', 0)}")
            print(f"      Generic language: {patterns.get('genericLanguage', 0)}")
            print(f"      Uniform sentence length: {patterns.get('uniformSentenceLength', False)}")
    else:
        print(f"   ❌ Error: {result.get('error', 'Unknown')}")
    
    # Detect from URL
    print("\n" + "=" * 70)
    print("🔗 Detecting from URL:")
    
    url_result = detect_ai_content(url="https://example.com/crypto-article")
    
    if url_result.get('success'):
        is_ai = url_result.get('isAiGenerated', False)
        confidence = url_result.get('confidence', 0)
        icon = "🤖" if is_ai else "👤"
        print(f"   {icon} {'AI-Generated' if is_ai else 'Human-Written'} ({confidence * 100:.1f}% confidence)")
    ```

=== "JavaScript"
    ```javascript
    async function detectAiContent(options) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/detect/ai-content',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            }
        );
        return response.json();
    }
    
    const sampleText = `
    Bitcoin has reached a new all-time high of $100,000, marking a significant 
    milestone in the cryptocurrency's history. This achievement comes after years 
    of institutional adoption and growing mainstream acceptance.
    `;
    
    console.log("🤖 AI Content Detection");
    console.log("=".repeat(70));
    
    const result = await detectAiContent({ text: sampleText });
    
    if (result.success) {
        const icon = result.isAiGenerated ? '🤖' : '👤';
        console.log(`   Detection: ${icon} ${result.isAiGenerated ? 'AI-Generated' : 'Human-Written'}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`   AI Score: ${result.aiScore?.toFixed(3)}`);
        
        // Indicators
        if (result.indicators?.length) {
            console.log("\n   🚩 Indicators:");
            result.indicators.forEach(ind => console.log(`      • ${ind}`));
        }
    }
    
    // From URL
    console.log("\n🔗 From URL:");
    const urlResult = await detectAiContent({ url: 'https://example.com/article' });
    
    if (urlResult.success) {
        const icon = urlResult.isAiGenerated ? '🤖' : '👤';
        console.log(`   ${icon} ${urlResult.isAiGenerated ? 'AI' : 'Human'} (${(urlResult.confidence * 100).toFixed(1)}%)`);
    }
    ```

=== "cURL"
    ```bash
    # Detect from text
    curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
      -H "Content-Type: application/json" \
      -d '{"text": "Bitcoin has reached a new all-time high..."}' | jq
    
    # Detect from URL
    curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
      -H "Content-Type: application/json" \
      -d '{"url": "https://example.com/article"}' | jq
    
    # Get just the result
    curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
      -H "Content-Type: application/json" \
      -d '{"text": "Sample text..."}' | jq '{isAiGenerated, confidence}'
    ```

---

## Complete Article Content Manager

```python
#!/usr/bin/env python3
"""Article content management application."""

import requests
from datetime import datetime
from typing import Dict, Any, Optional

class ArticleManager:
    """Article content management client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def _post(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.BASE_URL}{endpoint}",
            json=data
        )
        return response.json()
    
    def get_article(self, slug: str):
        return self._get(f"/api/article/{slug}")
    
    def get_metadata(self, slug: str):
        return self._get(f"/api/article/{slug}/metadata")
    
    def get_related(self, slug: str, limit: int = 10):
        return self._get(f"/api/article/{slug}/related", {"limit": limit})
    
    def extract(self, url: str, **options):
        return self._post("/api/article/extract", {"url": url, **options})
    
    def reader_mode(self, url: str, **options):
        return self._get("/api/article/reader", {"url": url, **options})
    
    def detect_ai(self, text: str = None, url: str = None):
        data = {}
        if text:
            data["text"] = text
        if url:
            data["url"] = url
        return self._post("/api/detect/ai-content", data)
    
    def analyze_article(self, slug_or_url: str):
        """Comprehensive article analysis."""
        print("=" * 80)
        print("📰 ARTICLE ANALYSIS")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Determine if slug or URL
        is_url = slug_or_url.startswith("http")
        
        if is_url:
            # Extract from URL
            print(f"\n🔍 Extracting from URL: {slug_or_url[:50]}...")
            extracted = self.extract(slug_or_url, includeMetadata=True)
            
            if not extracted.get('success'):
                print(f"   ❌ Extraction failed: {extracted.get('error')}")
                return
            
            article = extracted.get('article', {})
        else:
            # Get by slug
            print(f"\n📋 Fetching article: {slug_or_url}")
            article = self.get_article(slug_or_url)
        
        # Display article info
        print("\n📰 ARTICLE DETAILS")
        print("-" * 80)
        print(f"   Title: {article.get('title', 'N/A')}")
        print(f"   Source: {article.get('source', 'N/A')}")
        print(f"   Author: {article.get('author', 'N/A')}")
        print(f"   Published: {article.get('publishedAt', 'N/A')}")
        
        # Content stats
        content = article.get('content', '')
        word_count = len(content.split())
        print(f"\n📊 CONTENT STATS")
        print("-" * 80)
        print(f"   Words: {word_count}")
        print(f"   Reading Time: ~{word_count // 200} min")
        
        # Sentiment
        sentiment = article.get('sentiment', {})
        if sentiment:
            score = sentiment.get('score', 0)
            icon = "😀" if score > 0.3 else "😐" if score > -0.3 else "😟"
            print(f"   Sentiment: {icon} {score:.2f} ({sentiment.get('label', 'N/A')})")
        
        # AI Detection
        print("\n🤖 AI CONTENT DETECTION")
        print("-" * 80)
        if content:
            ai_result = self.detect_ai(text=content[:5000])
            if ai_result.get('success'):
                is_ai = ai_result.get('isAiGenerated', False)
                confidence = ai_result.get('confidence', 0)
                icon = "🤖" if is_ai else "👤"
                print(f"   Detection: {icon} {'AI-Generated' if is_ai else 'Human-Written'}")
                print(f"   Confidence: {confidence * 100:.1f}%")
            else:
                print("   Detection failed")
        
        # Related articles
        if not is_url and article.get('slug'):
            print("\n🔗 RELATED ARTICLES")
            print("-" * 80)
            related = self.get_related(article.get('slug'), 5)
            for r in related.get('articles', [])[:5]:
                print(f"   • {r.get('title', 'N/A')[:60]}...")
        
        print("\n" + "=" * 80)
        print("✅ Analysis complete!")

def main():
    manager = ArticleManager()
    
    # Analyze by slug
    manager.analyze_article("bitcoin-etf-approval-2024")
    
    # Or analyze by URL
    # manager.analyze_article("https://www.coindesk.com/example-article")

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [News Basics](news-basics.md) - Core news endpoints
- [AI Features](ai-features.md) - AI summarization and analysis
- [Search & Filtering](search-filtering.md) - Advanced search
