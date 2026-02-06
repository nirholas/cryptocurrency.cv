# International News Tutorial

This tutorial covers international news endpoints for accessing crypto news from 75+ global sources in multiple languages.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/news/international` | International news aggregation |
| `/api/news/international/sources` | Available international sources |
| `/api/news/international/languages` | Supported languages |
| `/api/news/international/regions` | Regional news feeds |

---

## 1. International News Feed

Access crypto news from global sources in multiple languages.

=== "Python"
    ```python
    import requests
    
    def get_international_news(
        language: str = None,
        region: str = None,
        translate: bool = False,
        limit: int = 50
    ):
        """Get international crypto news."""
        params = {"limit": limit, "translate": translate}
        if language:
            params["language"] = language
        if region:
            params["region"] = region
        
        response = requests.get(
            "https://cryptocurrency.cv/api/news/international",
            params=params
        )
        return response.json()
    
    # Get all international news
    news = get_international_news(limit=20)
    
    print("🌍 International Crypto News")
    print("=" * 70)
    print(f"Total Articles: {news.get('totalCount', 0)}")
    print(f"Languages: {', '.join(news.get('languages', []))}")
    
    # Group by language
    by_language = {}
    for article in news.get('articles', []):
        lang = article.get('language', 'unknown')
        if lang not in by_language:
            by_language[lang] = []
        by_language[lang].append(article)
    
    print("\n📰 Articles by Language:")
    for lang, articles in sorted(by_language.items()):
        print(f"\n   🗣️ {lang.upper()} ({len(articles)} articles):")
        for article in articles[:3]:
            print(f"      • {article.get('title', '')[:50]}...")
    
    # Get specific language
    print("\n" + "=" * 70)
    print("🇯🇵 Japanese News:")
    japanese = get_international_news(language="ja", limit=10)
    for article in japanese.get('articles', [])[:5]:
        print(f"   • {article.get('title', '')[:60]}...")
    
    # Get with translation
    print("\n🔄 Translated News:")
    translated = get_international_news(language="de", translate=True, limit=5)
    for article in translated.get('articles', []):
        print(f"   Original: {article.get('originalTitle', '')[:40]}...")
        print(f"   Translated: {article.get('title', '')[:40]}...")
        print()
    ```

=== "JavaScript"
    ```javascript
    async function getInternationalNews(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 50).toString(),
            translate: (options.translate || false).toString()
        });
        if (options.language) params.set('language', options.language);
        if (options.region) params.set('region', options.region);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/news/international?${params}`
        );
        return response.json();
    }
    
    // Get all international news
    const news = await getInternationalNews({ limit: 20 });
    
    console.log("🌍 International Crypto News");
    console.log("=".repeat(70));
    console.log(`Total Articles: ${news.totalCount}`);
    
    // Group by language
    const byLanguage = {};
    news.articles?.forEach(article => {
        const lang = article.language || 'unknown';
        if (!byLanguage[lang]) byLanguage[lang] = [];
        byLanguage[lang].push(article);
    });
    
    console.log("\n📰 Articles by Language:");
    for (const [lang, articles] of Object.entries(byLanguage)) {
        console.log(`\n   🗣️ ${lang.toUpperCase()} (${articles.length} articles):`);
        articles.slice(0, 3).forEach(a => {
            console.log(`      • ${a.title?.slice(0, 50)}...`);
        });
    }
    
    // Japanese news
    console.log("\n🇯🇵 Japanese News:");
    const japanese = await getInternationalNews({ language: 'ja', limit: 10 });
    japanese.articles?.slice(0, 5).forEach(a => {
        console.log(`   • ${a.title?.slice(0, 60)}...`);
    });
    
    // Translated
    console.log("\n🔄 Translated News:");
    const translated = await getInternationalNews({ 
        language: 'de', 
        translate: true, 
        limit: 5 
    });
    translated.articles?.forEach(a => {
        console.log(`   Original: ${a.originalTitle?.slice(0, 40)}...`);
        console.log(`   Translated: ${a.title?.slice(0, 40)}...`);
    });
    ```

=== "cURL"
    ```bash
    # Get all international news
    curl "https://cryptocurrency.cv/api/news/international?limit=20" | jq
    
    # Get Japanese news
    curl "https://cryptocurrency.cv/api/news/international?language=ja&limit=10" | jq
    
    # Get German news with translation
    curl "https://cryptocurrency.cv/api/news/international?language=de&translate=true" | jq
    
    # Get news by region
    curl "https://cryptocurrency.cv/api/news/international?region=asia" | jq
    
    # Get available languages
    curl "https://cryptocurrency.cv/api/news/international/languages" | jq
    ```

---

## 2. Regional News

Get news filtered by geographic region.

=== "Python"
    ```python
    import requests
    
    REGIONS = {
        "americas": ["US", "CA", "BR", "AR", "MX"],
        "europe": ["UK", "DE", "FR", "ES", "IT", "NL"],
        "asia": ["JP", "KR", "CN", "SG", "HK", "IN"],
        "oceania": ["AU", "NZ"],
        "africa": ["ZA", "NG", "KE"],
        "middle_east": ["AE", "IL", "SA"]
    }
    
    def get_regional_news(region: str, limit: int = 20):
        """Get news by region."""
        response = requests.get(
            "https://cryptocurrency.cv/api/news/international",
            params={"region": region, "limit": limit}
        )
        return response.json()
    
    # Get news from all regions
    print("🗺️ Regional Crypto News Overview")
    print("=" * 70)
    
    for region, countries in REGIONS.items():
        news = get_regional_news(region, limit=10)
        count = news.get('totalCount', 0)
        print(f"\n🌐 {region.replace('_', ' ').title()} ({count} articles):")
        print(f"   Countries: {', '.join(countries)}")
        
        for article in news.get('articles', [])[:3]:
            source = article.get('source', 'Unknown')
            title = article.get('title', '')[:45]
            print(f"   • [{source}] {title}...")
    
    # Detailed Asia focus
    print("\n" + "=" * 70)
    print("🌏 Asia-Pacific Deep Dive:")
    
    asia_news = get_regional_news("asia", limit=30)
    
    # Group by country
    by_country = {}
    for article in asia_news.get('articles', []):
        country = article.get('country', 'Unknown')
        if country not in by_country:
            by_country[country] = []
        by_country[country].append(article)
    
    for country, articles in sorted(by_country.items(), key=lambda x: -len(x[1])):
        print(f"\n   {country}: {len(articles)} articles")
        for article in articles[:2]:
            print(f"      • {article.get('title', '')[:50]}...")
    ```

=== "JavaScript"
    ```javascript
    const REGIONS = {
        americas: ['US', 'CA', 'BR', 'AR', 'MX'],
        europe: ['UK', 'DE', 'FR', 'ES', 'IT', 'NL'],
        asia: ['JP', 'KR', 'CN', 'SG', 'HK', 'IN'],
        oceania: ['AU', 'NZ'],
        africa: ['ZA', 'NG', 'KE'],
        middle_east: ['AE', 'IL', 'SA']
    };
    
    async function getRegionalNews(region, limit = 20) {
        const params = new URLSearchParams({ region, limit: limit.toString() });
        const response = await fetch(
            `https://cryptocurrency.cv/api/news/international?${params}`
        );
        return response.json();
    }
    
    console.log("🗺️ Regional Crypto News Overview");
    console.log("=".repeat(70));
    
    for (const [region, countries] of Object.entries(REGIONS)) {
        const news = await getRegionalNews(region, 10);
        const count = news.totalCount || 0;
        console.log(`\n🌐 ${region.replace('_', ' ')} (${count} articles):`);
        console.log(`   Countries: ${countries.join(', ')}`);
        
        news.articles?.slice(0, 3).forEach(article => {
            console.log(`   • [${article.source}] ${article.title?.slice(0, 45)}...`);
        });
    }
    
    // Asia deep dive
    console.log("\n🌏 Asia-Pacific Deep Dive:");
    const asiaNews = await getRegionalNews('asia', 30);
    
    const byCountry = {};
    asiaNews.articles?.forEach(article => {
        const country = article.country || 'Unknown';
        if (!byCountry[country]) byCountry[country] = [];
        byCountry[country].push(article);
    });
    
    for (const [country, articles] of Object.entries(byCountry)) {
        console.log(`\n   ${country}: ${articles.length} articles`);
        articles.slice(0, 2).forEach(a => {
            console.log(`      • ${a.title?.slice(0, 50)}...`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get Americas news
    curl "https://cryptocurrency.cv/api/news/international?region=americas" | jq
    
    # Get European news
    curl "https://cryptocurrency.cv/api/news/international?region=europe" | jq
    
    # Get Asian news
    curl "https://cryptocurrency.cv/api/news/international?region=asia" | jq
    
    # Get available regions
    curl "https://cryptocurrency.cv/api/news/international/regions" | jq
    ```

---

## 3. Available Sources & Languages

Query available international sources and supported languages.

=== "Python"
    ```python
    import requests
    
    def get_international_sources():
        """Get available international sources."""
        response = requests.get(
            "https://cryptocurrency.cv/api/news/international/sources"
        )
        return response.json()
    
    def get_supported_languages():
        """Get supported languages."""
        response = requests.get(
            "https://cryptocurrency.cv/api/news/international/languages"
        )
        return response.json()
    
    # Get sources
    sources = get_international_sources()
    
    print("📰 International News Sources")
    print("=" * 70)
    print(f"Total Sources: {sources.get('count', 0)}")
    
    # Group by language
    by_language = {}
    for source in sources.get('sources', []):
        lang = source.get('language', 'unknown')
        if lang not in by_language:
            by_language[lang] = []
        by_language[lang].append(source)
    
    print("\n📊 Sources by Language:")
    for lang, lang_sources in sorted(by_language.items(), key=lambda x: -len(x[1])):
        print(f"\n   {lang.upper()} ({len(lang_sources)} sources):")
        for source in lang_sources[:5]:
            print(f"      • {source.get('name')} - {source.get('url', 'N/A')}")
    
    # Get languages
    languages = get_supported_languages()
    
    print("\n" + "=" * 70)
    print("🗣️ Supported Languages:")
    
    for lang in languages.get('languages', []):
        code = lang.get('code', 'N/A')
        name = lang.get('name', 'Unknown')
        sources_count = lang.get('sourcesCount', 0)
        print(f"   {code}: {name} ({sources_count} sources)")
    ```

=== "JavaScript"
    ```javascript
    async function getInternationalSources() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/news/international/sources'
        );
        return response.json();
    }
    
    async function getSupportedLanguages() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/news/international/languages'
        );
        return response.json();
    }
    
    // Get sources
    const sources = await getInternationalSources();
    
    console.log("📰 International News Sources");
    console.log("=".repeat(70));
    console.log(`Total Sources: ${sources.count}`);
    
    // Group by language
    const byLanguage = {};
    sources.sources?.forEach(source => {
        const lang = source.language || 'unknown';
        if (!byLanguage[lang]) byLanguage[lang] = [];
        byLanguage[lang].push(source);
    });
    
    console.log("\n📊 Sources by Language:");
    for (const [lang, langSources] of Object.entries(byLanguage)) {
        console.log(`\n   ${lang.toUpperCase()} (${langSources.length} sources):`);
        langSources.slice(0, 5).forEach(s => {
            console.log(`      • ${s.name}`);
        });
    }
    
    // Get languages
    const languages = await getSupportedLanguages();
    
    console.log("\n🗣️ Supported Languages:");
    languages.languages?.forEach(lang => {
        console.log(`   ${lang.code}: ${lang.name} (${lang.sourcesCount} sources)`);
    });
    ```

=== "cURL"
    ```bash
    # Get all international sources
    curl "https://cryptocurrency.cv/api/news/international/sources" | jq
    
    # Get supported languages
    curl "https://cryptocurrency.cv/api/news/international/languages" | jq
    
    # Get source count
    curl "https://cryptocurrency.cv/api/news/international/sources" | jq '.count'
    
    # Get language codes
    curl "https://cryptocurrency.cv/api/news/international/languages" | jq '.languages[].code'
    ```

---

## Complete International News Application

Build a multi-language news aggregator:

```python
#!/usr/bin/env python3
"""Multi-language crypto news aggregator."""

import requests
from datetime import datetime
from typing import Dict, List, Any

class InternationalNewsAggregator:
    """International crypto news aggregator."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def get_news(self, language: str = None, region: str = None, 
                 translate: bool = False, limit: int = 50) -> Dict[str, Any]:
        params = {"limit": limit, "translate": translate}
        if language:
            params["language"] = language
        if region:
            params["region"] = region
        return self._get("/api/news/international", params)
    
    def get_sources(self) -> Dict[str, Any]:
        return self._get("/api/news/international/sources")
    
    def get_languages(self) -> Dict[str, Any]:
        return self._get("/api/news/international/languages")
    
    def run_dashboard(self):
        """Run international news dashboard."""
        print("=" * 80)
        print("🌍 INTERNATIONAL CRYPTO NEWS DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Available languages
        print("\n🗣️ AVAILABLE LANGUAGES")
        print("-" * 80)
        try:
            languages = self.get_languages()
            for lang in languages.get('languages', [])[:10]:
                print(f"   {lang.get('code', 'N/A')}: {lang.get('name', 'Unknown')} "
                      f"({lang.get('sourcesCount', 0)} sources)")
        except Exception as e:
            print(f"   Error: {e}")
        
        # News by region
        regions = ['americas', 'europe', 'asia']
        for region in regions:
            print(f"\n🌐 {region.upper()} NEWS")
            print("-" * 80)
            try:
                news = self.get_news(region=region, limit=10)
                for article in news.get('articles', [])[:5]:
                    lang = article.get('language', '??')
                    source = article.get('source', 'Unknown')[:15]
                    title = article.get('title', '')[:45]
                    print(f"   [{lang}] [{source}] {title}...")
            except Exception as e:
                print(f"   Error: {e}")
        
        # Top languages
        print("\n📊 TOP LANGUAGE COVERAGE")
        print("-" * 80)
        try:
            all_news = self.get_news(limit=100)
            by_lang = {}
            for article in all_news.get('articles', []):
                lang = article.get('language', 'unknown')
                by_lang[lang] = by_lang.get(lang, 0) + 1
            
            for lang, count in sorted(by_lang.items(), key=lambda x: -x[1])[:10]:
                bar = "█" * (count // 5) + "░" * (20 - count // 5)
                print(f"   {lang}: [{bar}] {count}")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    aggregator = InternationalNewsAggregator()
    aggregator.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [News Basics Tutorial](news-basics.md) - Core news API
- [Search & Filtering](search-filtering.md) - Advanced search
- [AI Features](ai-features.md) - Translation and summarization
