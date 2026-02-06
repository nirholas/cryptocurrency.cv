# Utility & Meta Endpoints Tutorial

This tutorial covers utility endpoints for API health, metadata, configuration, and miscellaneous functionality.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/health` | API health status |
| `/api/status` | Detailed system status |
| `/api/version` | API version info |
| `/api/sources` | News sources list |
| `/api/categories` | Article categories |
| `/api/currencies` | Supported currencies |
| `/api/languages` | Supported languages |
| `/api/config` | API configuration |
| `/api/openapi` | OpenAPI specification |

---

## 1. Health & Status Checks

Monitor API health and system status.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def check_health():
        """Check API health."""
        response = requests.get(
            "https://cryptocurrency.cv/api/health"
        )
        return response.json()
    
    def get_status():
        """Get detailed system status."""
        response = requests.get(
            "https://cryptocurrency.cv/api/status"
        )
        return response.json()
    
    def get_version():
        """Get API version."""
        response = requests.get(
            "https://cryptocurrency.cv/api/version"
        )
        return response.json()
    
    # Health check
    print("🏥 API Health Check")
    print("=" * 70)
    
    health = check_health()
    
    status = health.get('status', 'unknown')
    status_icon = "✅" if status == "healthy" else "⚠️" if status == "degraded" else "❌"
    
    print(f"   Status: {status_icon} {status.upper()}")
    print(f"   Timestamp: {health.get('timestamp', 'N/A')}")
    
    # Component health
    components = health.get('components', {})
    if components:
        print("\n   📊 Component Status:")
        for component, comp_status in components.items():
            comp_icon = "✅" if comp_status.get('healthy') else "❌"
            latency = comp_status.get('latency', 'N/A')
            print(f"      {comp_icon} {component}: {latency}ms")
    
    # Detailed status
    print("\n" + "=" * 70)
    print("📊 Detailed System Status")
    print("-" * 70)
    
    status_data = get_status()
    
    # Uptime
    uptime = status_data.get('uptime', {})
    print(f"\n   ⏱️ Uptime:")
    print(f"      Current: {uptime.get('current', 'N/A')}")
    print(f"      30-Day SLA: {uptime.get('sla30d', 'N/A')}%")
    
    # Response times
    response_times = status_data.get('responseTimes', {})
    print(f"\n   ⚡ Response Times:")
    print(f"      P50: {response_times.get('p50', 'N/A')}ms")
    print(f"      P95: {response_times.get('p95', 'N/A')}ms")
    print(f"      P99: {response_times.get('p99', 'N/A')}ms")
    
    # Data freshness
    freshness = status_data.get('dataFreshness', {})
    print(f"\n   📰 Data Freshness:")
    print(f"      News: {freshness.get('news', 'N/A')}")
    print(f"      Market: {freshness.get('market', 'N/A')}")
    print(f"      Sentiment: {freshness.get('sentiment', 'N/A')}")
    
    # Version info
    print("\n" + "=" * 70)
    print("📦 API Version")
    print("-" * 70)
    
    version = get_version()
    
    print(f"   Version: {version.get('version', 'N/A')}")
    print(f"   Build: {version.get('build', 'N/A')}")
    print(f"   Released: {version.get('releaseDate', 'N/A')}")
    
    print("\n   📝 Recent Changes:")
    for change in version.get('changelog', [])[:5]:
        print(f"      • {change}")
    ```

=== "JavaScript"
    ```javascript
    async function checkHealth() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/health'
        );
        return response.json();
    }
    
    async function getStatus() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/status'
        );
        return response.json();
    }
    
    async function getVersion() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/version'
        );
        return response.json();
    }
    
    // Health check
    console.log("🏥 API Health Check");
    console.log("=".repeat(70));
    
    const health = await checkHealth();
    const statusIcon = health.status === 'healthy' ? '✅' : '❌';
    
    console.log(`   Status: ${statusIcon} ${health.status?.toUpperCase()}`);
    console.log(`   Timestamp: ${health.timestamp}`);
    
    // Components
    if (health.components) {
        console.log("\n   📊 Components:");
        for (const [comp, status] of Object.entries(health.components)) {
            const icon = status.healthy ? '✅' : '❌';
            console.log(`      ${icon} ${comp}: ${status.latency}ms`);
        }
    }
    
    // Detailed status
    console.log("\n📊 System Status");
    const status = await getStatus();
    
    console.log(`   Uptime: ${status.uptime?.current}`);
    console.log(`   P50: ${status.responseTimes?.p50}ms`);
    console.log(`   P99: ${status.responseTimes?.p99}ms`);
    
    // Version
    const version = await getVersion();
    console.log(`\n📦 Version: ${version.version}`);
    console.log(`   Build: ${version.build}`);
    ```

=== "cURL"
    ```bash
    # Health check
    curl "https://cryptocurrency.cv/api/health" | jq
    
    # Detailed status
    curl "https://cryptocurrency.cv/api/status" | jq
    
    # Version info
    curl "https://cryptocurrency.cv/api/version" | jq
    
    # Quick health check (returns 200 if healthy)
    curl -s -o /dev/null -w "%{http_code}" "https://cryptocurrency.cv/api/health"
    ```

---

## 2. News Sources

Get information about available news sources.

=== "Python"
    ```python
    import requests
    
    def get_sources(category: str = None, language: str = None):
        """Get news sources."""
        params = {}
        if category:
            params["category"] = category
        if language:
            params["language"] = language
        
        response = requests.get(
            "https://cryptocurrency.cv/api/sources",
            params=params
        )
        return response.json()
    
    # Get all sources
    sources = get_sources()
    
    print("📰 News Sources")
    print("=" * 70)
    print(f"   Total Sources: {sources.get('count', 0)}")
    
    # Group by category
    by_category = {}
    for source in sources.get('sources', []):
        cat = source.get('category', 'other')
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(source)
    
    print("\n📊 Sources by Category:")
    for cat, cat_sources in sorted(by_category.items(), key=lambda x: -len(x[1])):
        print(f"\n   {cat.title()} ({len(cat_sources)} sources):")
        for source in cat_sources[:5]:
            name = source.get('name', 'Unknown')
            reliability = source.get('reliabilityScore', 0)
            stars = "⭐" * int(reliability / 20)
            print(f"      • {name} {stars}")
    
    # Group by language
    by_lang = {}
    for source in sources.get('sources', []):
        lang = source.get('language', 'unknown')
        by_lang[lang] = by_lang.get(lang, 0) + 1
    
    print("\n🗣️ Sources by Language:")
    for lang, count in sorted(by_lang.items(), key=lambda x: -x[1])[:10]:
        bar = "█" * (count // 2) + "░" * (20 - count // 2)
        print(f"   {lang:5} [{bar}] {count}")
    
    # Top reliable sources
    print("\n🏆 Most Reliable Sources:")
    sorted_sources = sorted(
        sources.get('sources', []),
        key=lambda x: x.get('reliabilityScore', 0),
        reverse=True
    )
    
    for source in sorted_sources[:10]:
        name = source.get('name', 'Unknown')[:30]
        score = source.get('reliabilityScore', 0)
        articles = source.get('articleCount', 0)
        print(f"   {score:3.0f}% {name:30} ({articles:,} articles)")
    ```

=== "JavaScript"
    ```javascript
    async function getSources(options = {}) {
        const params = new URLSearchParams();
        if (options.category) params.set('category', options.category);
        if (options.language) params.set('language', options.language);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/sources?${params}`
        );
        return response.json();
    }
    
    const sources = await getSources();
    
    console.log("📰 News Sources");
    console.log("=".repeat(70));
    console.log(`   Total: ${sources.count}`);
    
    // By category
    const byCategory = {};
    sources.sources?.forEach(source => {
        const cat = source.category || 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(source);
    });
    
    console.log("\n📊 By Category:");
    for (const [cat, catSources] of Object.entries(byCategory)) {
        console.log(`   ${cat}: ${catSources.length} sources`);
    }
    
    // Top reliable
    console.log("\n🏆 Most Reliable:");
    const sorted = [...(sources.sources || [])].sort((a, b) => 
        (b.reliabilityScore || 0) - (a.reliabilityScore || 0)
    );
    
    sorted.slice(0, 10).forEach(source => {
        console.log(`   ${source.reliabilityScore}% ${source.name}`);
    });
    ```

=== "cURL"
    ```bash
    # Get all sources
    curl "https://cryptocurrency.cv/api/sources" | jq
    
    # Get crypto sources only
    curl "https://cryptocurrency.cv/api/sources?category=crypto" | jq
    
    # Get English sources
    curl "https://cryptocurrency.cv/api/sources?language=en" | jq
    
    # Count sources
    curl "https://cryptocurrency.cv/api/sources" | jq '.count'
    ```

---

## 3. Categories & Classifications

Get article categories and classification systems.

=== "Python"
    ```python
    import requests
    
    def get_categories():
        """Get article categories."""
        response = requests.get(
            "https://cryptocurrency.cv/api/categories"
        )
        return response.json()
    
    # Get categories
    categories = get_categories()
    
    print("📁 Article Categories")
    print("=" * 70)
    
    print(f"\n   {'Category':<25} {'Articles':<15} {'Trending':<10}")
    print("   " + "-" * 50)
    
    for cat in categories.get('categories', []):
        name = cat.get('name', 'Unknown')
        slug = cat.get('slug', 'N/A')
        count = cat.get('articleCount', 0)
        trending = "🔥" if cat.get('trending') else ""
        
        print(f"   {name:<25} {count:<15,} {trending}")
    
    # Subcategories
    print("\n📂 Category Hierarchy:")
    
    for cat in categories.get('categories', [])[:5]:
        name = cat.get('name', 'Unknown')
        print(f"\n   📁 {name}:")
        
        for subcat in cat.get('subcategories', [])[:5]:
            sub_name = subcat.get('name', 'Unknown')
            sub_count = subcat.get('articleCount', 0)
            print(f"      📄 {sub_name} ({sub_count:,})")
    
    # Popular categories
    print("\n📊 Most Active Categories (24h):")
    
    sorted_cats = sorted(
        categories.get('categories', []),
        key=lambda x: x.get('articleCount24h', 0),
        reverse=True
    )
    
    for cat in sorted_cats[:10]:
        name = cat.get('name', 'Unknown')
        count_24h = cat.get('articleCount24h', 0)
        bar_len = min(count_24h // 10, 30)
        bar = "█" * bar_len + "░" * (30 - bar_len)
        print(f"   {name[:15]:<15} [{bar}] {count_24h}")
    ```

=== "JavaScript"
    ```javascript
    async function getCategories() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/categories'
        );
        return response.json();
    }
    
    const categories = await getCategories();
    
    console.log("📁 Article Categories");
    console.log("=".repeat(70));
    
    categories.categories?.forEach(cat => {
        const trending = cat.trending ? '🔥' : '';
        console.log(`   ${cat.name}: ${cat.articleCount?.toLocaleString()} ${trending}`);
    });
    
    // Subcategories
    console.log("\n📂 Hierarchy:");
    categories.categories?.slice(0, 5).forEach(cat => {
        console.log(`\n   📁 ${cat.name}:`);
        cat.subcategories?.slice(0, 3).forEach(sub => {
            console.log(`      📄 ${sub.name} (${sub.articleCount})`);
        });
    });
    
    // Most active
    console.log("\n📊 Most Active (24h):");
    const sorted = [...(categories.categories || [])].sort((a, b) =>
        (b.articleCount24h || 0) - (a.articleCount24h || 0)
    );
    
    sorted.slice(0, 10).forEach(cat => {
        console.log(`   ${cat.name}: ${cat.articleCount24h}`);
    });
    ```

=== "cURL"
    ```bash
    # Get categories
    curl "https://cryptocurrency.cv/api/categories" | jq
    
    # Get category names only
    curl "https://cryptocurrency.cv/api/categories" | jq '.categories[].name'
    
    # Get trending categories
    curl "https://cryptocurrency.cv/api/categories" | jq '.categories | map(select(.trending))'
    ```

---

## 4. Currencies & Languages

Get supported currencies and languages.

=== "Python"
    ```python
    import requests
    
    def get_currencies():
        """Get supported currencies."""
        response = requests.get(
            "https://cryptocurrency.cv/api/currencies"
        )
        return response.json()
    
    def get_languages():
        """Get supported languages."""
        response = requests.get(
            "https://cryptocurrency.cv/api/languages"
        )
        return response.json()
    
    # Currencies
    currencies = get_currencies()
    
    print("💰 Supported Currencies")
    print("=" * 70)
    print(f"   Total: {currencies.get('count', 0)} currencies")
    
    # Fiat currencies
    print("\n   💵 Fiat Currencies:")
    fiat = [c for c in currencies.get('currencies', []) if c.get('type') == 'fiat']
    for currency in fiat[:15]:
        code = currency.get('code', 'N/A')
        name = currency.get('name', 'Unknown')
        symbol = currency.get('symbol', '')
        print(f"      {code:5} {symbol:3} {name}")
    
    # Crypto currencies
    print("\n   🪙 Crypto Currencies:")
    crypto = [c for c in currencies.get('currencies', []) if c.get('type') == 'crypto']
    for currency in crypto[:15]:
        code = currency.get('code', 'N/A')
        name = currency.get('name', 'Unknown')
        print(f"      {code:10} {name}")
    
    # Languages
    languages = get_languages()
    
    print("\n" + "=" * 70)
    print("🗣️ Supported Languages")
    print("-" * 70)
    print(f"   Total: {languages.get('count', 0)} languages")
    
    print(f"\n   {'Code':<8} {'Language':<20} {'Sources':<10} {'Articles':<15}")
    print("   " + "-" * 55)
    
    for lang in languages.get('languages', [])[:20]:
        code = lang.get('code', 'N/A')
        name = lang.get('name', 'Unknown')
        sources = lang.get('sourcesCount', 0)
        articles = lang.get('articleCount', 0)
        
        print(f"   {code:<8} {name:<20} {sources:<10} {articles:<15,}")
    
    # Most common languages
    print("\n📊 Languages by Article Count:")
    sorted_langs = sorted(
        languages.get('languages', []),
        key=lambda x: x.get('articleCount', 0),
        reverse=True
    )
    
    total_articles = sum(l.get('articleCount', 0) for l in sorted_langs)
    
    for lang in sorted_langs[:10]:
        name = lang.get('name', 'Unknown')
        count = lang.get('articleCount', 0)
        pct = (count / total_articles * 100) if total_articles > 0 else 0
        bar = "█" * int(pct / 2) + "░" * (50 - int(pct / 2))
        print(f"   {name[:12]:<12} [{bar}] {pct:.1f}%")
    ```

=== "JavaScript"
    ```javascript
    async function getCurrencies() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/currencies'
        );
        return response.json();
    }
    
    async function getLanguages() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/languages'
        );
        return response.json();
    }
    
    // Currencies
    const currencies = await getCurrencies();
    
    console.log("💰 Currencies");
    console.log("=".repeat(70));
    console.log(`   Total: ${currencies.count}`);
    
    // Fiat
    console.log("\n   💵 Fiat:");
    currencies.currencies
        ?.filter(c => c.type === 'fiat')
        .slice(0, 10)
        .forEach(c => console.log(`      ${c.code} ${c.symbol} ${c.name}`));
    
    // Crypto
    console.log("\n   🪙 Crypto:");
    currencies.currencies
        ?.filter(c => c.type === 'crypto')
        .slice(0, 10)
        .forEach(c => console.log(`      ${c.code} ${c.name}`));
    
    // Languages
    const languages = await getLanguages();
    
    console.log("\n🗣️ Languages");
    console.log("=".repeat(70));
    console.log(`   Total: ${languages.count}`);
    
    languages.languages?.slice(0, 15).forEach(lang => {
        console.log(`   ${lang.code}: ${lang.name} (${lang.articleCount} articles)`);
    });
    ```

=== "cURL"
    ```bash
    # Get currencies
    curl "https://cryptocurrency.cv/api/currencies" | jq
    
    # Get just fiat currencies
    curl "https://cryptocurrency.cv/api/currencies" | jq '.currencies | map(select(.type=="fiat"))'
    
    # Get languages
    curl "https://cryptocurrency.cv/api/languages" | jq
    
    # Get language codes
    curl "https://cryptocurrency.cv/api/languages" | jq '.languages[].code'
    ```

---

## 5. API Configuration & OpenAPI Spec

Get API configuration and documentation.

=== "Python"
    ```python
    import requests
    import json
    
    def get_config():
        """Get API configuration."""
        response = requests.get(
            "https://cryptocurrency.cv/api/config"
        )
        return response.json()
    
    def get_openapi_spec():
        """Get OpenAPI specification."""
        response = requests.get(
            "https://cryptocurrency.cv/api/openapi"
        )
        return response.json()
    
    # Configuration
    config = get_config()
    
    print("⚙️ API Configuration")
    print("=" * 70)
    
    # Rate limits
    limits = config.get('rateLimits', {})
    print("\n   ⚡ Rate Limits:")
    print(f"      Requests/min: {limits.get('requestsPerMinute', 'N/A')}")
    print(f"      Requests/day: {limits.get('requestsPerDay', 'N/A')}")
    print(f"      Burst limit: {limits.get('burstLimit', 'N/A')}")
    
    # Pagination
    pagination = config.get('pagination', {})
    print("\n   📄 Pagination:")
    print(f"      Default limit: {pagination.get('defaultLimit', 'N/A')}")
    print(f"      Max limit: {pagination.get('maxLimit', 'N/A')}")
    
    # Features
    features = config.get('features', {})
    print("\n   🎯 Enabled Features:")
    for feature, enabled in features.items():
        icon = "✅" if enabled else "❌"
        print(f"      {icon} {feature}")
    
    # Endpoints count
    endpoints = config.get('endpoints', {})
    print("\n   📊 Endpoint Counts:")
    for category, count in endpoints.items():
        print(f"      {category}: {count} endpoints")
    
    # OpenAPI spec
    print("\n" + "=" * 70)
    print("📖 OpenAPI Specification")
    print("-" * 70)
    
    spec = get_openapi_spec()
    
    print(f"   Version: {spec.get('openapi', 'N/A')}")
    print(f"   Title: {spec.get('info', {}).get('title', 'N/A')}")
    print(f"   API Version: {spec.get('info', {}).get('version', 'N/A')}")
    
    # Count paths
    paths = spec.get('paths', {})
    print(f"\n   📍 Endpoints: {len(paths)}")
    
    # Group by tag
    by_tag = {}
    for path, methods in paths.items():
        for method, details in methods.items():
            if isinstance(details, dict):
                tags = details.get('tags', ['other'])
                for tag in tags:
                    by_tag[tag] = by_tag.get(tag, 0) + 1
    
    print("\n   📁 Endpoints by Category:")
    for tag, count in sorted(by_tag.items(), key=lambda x: -x[1]):
        print(f"      {tag}: {count}")
    
    # List some endpoints
    print("\n   📋 Sample Endpoints:")
    for path in list(paths.keys())[:20]:
        methods = list(paths[path].keys())
        print(f"      {', '.join(m.upper() for m in methods):6} {path}")
    ```

=== "JavaScript"
    ```javascript
    async function getConfig() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/config'
        );
        return response.json();
    }
    
    async function getOpenApiSpec() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/openapi'
        );
        return response.json();
    }
    
    // Configuration
    const config = await getConfig();
    
    console.log("⚙️ API Configuration");
    console.log("=".repeat(70));
    
    // Rate limits
    console.log("\n   ⚡ Rate Limits:");
    console.log(`      Per minute: ${config.rateLimits?.requestsPerMinute}`);
    console.log(`      Per day: ${config.rateLimits?.requestsPerDay}`);
    
    // Features
    console.log("\n   🎯 Features:");
    for (const [feature, enabled] of Object.entries(config.features || {})) {
        console.log(`      ${enabled ? '✅' : '❌'} ${feature}`);
    }
    
    // OpenAPI
    const spec = await getOpenApiSpec();
    
    console.log("\n📖 OpenAPI Spec");
    console.log(`   Version: ${spec.openapi}`);
    console.log(`   Endpoints: ${Object.keys(spec.paths || {}).length}`);
    
    // Sample endpoints
    console.log("\n   Sample Endpoints:");
    Object.keys(spec.paths || {}).slice(0, 15).forEach(path => {
        const methods = Object.keys(spec.paths[path]).map(m => m.toUpperCase()).join(',');
        console.log(`      ${methods.padEnd(6)} ${path}`);
    });
    ```

=== "cURL"
    ```bash
    # Get configuration
    curl "https://cryptocurrency.cv/api/config" | jq
    
    # Get OpenAPI spec
    curl "https://cryptocurrency.cv/api/openapi" | jq
    
    # Get just rate limits
    curl "https://cryptocurrency.cv/api/config" | jq '.rateLimits'
    
    # List all endpoints
    curl "https://cryptocurrency.cv/api/openapi" | jq '.paths | keys'
    ```

---

## Complete Utility Dashboard

```python
#!/usr/bin/env python3
"""API utility dashboard."""

import requests
from datetime import datetime
from typing import Dict, Any

class UtilityDashboard:
    """API utility dashboard."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def run_dashboard(self):
        """Run utility dashboard."""
        print("=" * 80)
        print("🔧 API UTILITY DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Health
        print("\n🏥 HEALTH STATUS")
        print("-" * 80)
        try:
            health = self._get("/api/health")
            icon = "✅" if health.get('status') == 'healthy' else "❌"
            print(f"   Status: {icon} {health.get('status', 'unknown').upper()}")
            
            for comp, status in health.get('components', {}).items():
                c_icon = "✅" if status.get('healthy') else "❌"
                print(f"      {c_icon} {comp}: {status.get('latency', 'N/A')}ms")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Version
        print("\n📦 VERSION INFO")
        print("-" * 80)
        try:
            version = self._get("/api/version")
            print(f"   Version: {version.get('version', 'N/A')}")
            print(f"   Build: {version.get('build', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Sources
        print("\n📰 NEWS SOURCES")
        print("-" * 80)
        try:
            sources = self._get("/api/sources")
            print(f"   Total: {sources.get('count', 0)} sources")
            
            # Top 5 by reliability
            sorted_sources = sorted(
                sources.get('sources', []),
                key=lambda x: x.get('reliabilityScore', 0),
                reverse=True
            )
            print("   Top by reliability:")
            for s in sorted_sources[:5]:
                print(f"      • {s.get('name')}: {s.get('reliabilityScore', 0)}%")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Categories
        print("\n📁 CATEGORIES")
        print("-" * 80)
        try:
            categories = self._get("/api/categories")
            total = len(categories.get('categories', []))
            print(f"   Total: {total} categories")
            
            trending = [c for c in categories.get('categories', []) if c.get('trending')]
            if trending:
                print(f"   Trending: {', '.join(c.get('name', '') for c in trending[:5])}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Languages
        print("\n🗣️ LANGUAGES")
        print("-" * 80)
        try:
            languages = self._get("/api/languages")
            print(f"   Supported: {languages.get('count', 0)} languages")
            
            top_langs = sorted(
                languages.get('languages', []),
                key=lambda x: x.get('articleCount', 0),
                reverse=True
            )[:5]
            print(f"   Top: {', '.join(l.get('name', '') for l in top_langs)}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Config
        print("\n⚙️ CONFIGURATION")
        print("-" * 80)
        try:
            config = self._get("/api/config")
            limits = config.get('rateLimits', {})
            print(f"   Rate limit: {limits.get('requestsPerMinute', 'N/A')}/min")
            print(f"   Daily limit: {limits.get('requestsPerDay', 'N/A')}/day")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    dashboard = UtilityDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [News Basics](news-basics.md) - Get started with news endpoints
- [API Reference](../API.md) - Complete API documentation
- [SDKs](../../examples/README.md) - Official SDK libraries
