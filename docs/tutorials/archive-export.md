# Archive & Export Tutorial

This tutorial covers all archive and export endpoints for accessing historical data and exporting news.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/archive` | Query historical archive (with enhanced features) |
| `/api/archive/v2` | Redirect to /api/archive |
| `/api/archive/status` | Archive status |
| `/api/export` | Export news data |
| `/api/export/formats` | Available export formats |

---

## 1. Historical Archive Query

Access archived news data from past dates.

=== "Python"
    ```python
    import requests
    from datetime import datetime, timedelta
    
    def query_archive(
        date: str = None,
        start: str = None,
        end: str = None,
        source: str = None,
        ticker: str = None,
        limit: int = 100
    ):
        """Query the historical archive."""
        params = {"limit": limit}
        if date:
            params["date"] = date
        if start:
            params["start"] = start
        if end:
            params["end"] = end
        if source:
            params["source"] = source
        if ticker:
            params["ticker"] = ticker
        
        response = requests.get(
            "https://cryptocurrency.cv/api/archive",
            params=params
        )
        return response.json()
    
    # Query specific date
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    archive = query_archive(date=yesterday)
    
    print(f"📚 Archive Query: {yesterday}")
    print("=" * 70)
    print(f"Total Articles: {archive.get('totalCount', 0)}")
    
    articles = archive.get('articles', [])
    print(f"\n📰 Sample Articles ({len(articles)} returned):")
    
    for article in articles[:10]:
        title = article.get('title', 'No title')[:60]
        source = article.get('source', 'Unknown')
        pub_date = article.get('pubDate', 'Unknown')
        print(f"\n   📄 {title}...")
        print(f"      Source: {source} | Date: {pub_date}")
    
    # Query date range
    print("\n" + "=" * 70)
    print("📅 Date Range Query:")
    
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = datetime.now().strftime("%Y-%m-%d")
    
    range_archive = query_archive(start=start_date, end=end_date, limit=50)
    print(f"   Period: {start_date} to {end_date}")
    print(f"   Articles: {range_archive.get('totalCount', 0)}")
    
    # Query by source
    print("\n📰 Source-Specific Query:")
    source_archive = query_archive(
        start=start_date,
        end=end_date,
        source="coindesk",
        limit=20
    )
    print(f"   CoinDesk articles: {source_archive.get('totalCount', 0)}")
    
    # Query by ticker
    print("\n💰 Ticker-Specific Query:")
    btc_archive = query_archive(
        start=start_date,
        end=end_date,
        ticker="BTC",
        limit=20
    )
    print(f"   BTC-related articles: {btc_archive.get('totalCount', 0)}")
    ```

=== "JavaScript"
    ```javascript
    async function queryArchive(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 100).toString()
        });
        
        if (options.date) params.set('date', options.date);
        if (options.start) params.set('start', options.start);
        if (options.end) params.set('end', options.end);
        if (options.source) params.set('source', options.source);
        if (options.ticker) params.set('ticker', options.ticker);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/archive?${params}`
        );
        return response.json();
    }
    
    // Query yesterday's archive
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const archive = await queryArchive({ date: yesterday });
    
    console.log(`📚 Archive Query: ${yesterday}`);
    console.log("=".repeat(70));
    console.log(`Total Articles: ${archive.totalCount}`);
    
    console.log(`\n📰 Sample Articles:`);
    archive.articles?.slice(0, 10).forEach(article => {
        console.log(`\n   📄 ${article.title?.slice(0, 60)}...`);
        console.log(`      Source: ${article.source} | Date: ${article.pubDate}`);
    });
    
    // Date range
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    const rangeArchive = await queryArchive({ 
        start: startDate, 
        end: endDate, 
        limit: 50 
    });
    
    console.log("\n📅 Date Range Query:");
    console.log(`   Period: ${startDate} to ${endDate}`);
    console.log(`   Articles: ${rangeArchive.totalCount}`);
    
    // By source
    const sourceArchive = await queryArchive({
        start: startDate,
        end: endDate,
        source: 'coindesk'
    });
    console.log(`\n📰 CoinDesk articles: ${sourceArchive.totalCount}`);
    ```

=== "cURL"
    ```bash
    # Query specific date
    curl "https://cryptocurrency.cv/api/archive?date=2024-01-15&limit=20" | jq
    
    # Query date range
    curl "https://cryptocurrency.cv/api/archive?start=2024-01-01&end=2024-01-31" | jq '.totalCount'
    
    # Filter by source
    curl "https://cryptocurrency.cv/api/archive?source=coindesk&limit=10" | jq
    
    # Filter by ticker
    curl "https://cryptocurrency.cv/api/archive?ticker=BTC&limit=10" | jq
    
    # Get article titles only
    curl "https://cryptocurrency.cv/api/archive?date=2024-01-15" | jq '.articles[].title'
    ```

---

## 2. Enhanced Archive (V2)

Use the enhanced V2 archive API with additional filtering options.

=== "Python"
    ```python
    import requests
    
    def query_archive_v2(
        start_date: str = None,
        end_date: str = None,
        source: str = None,
        query: str = None,
        sentiment: str = None,
        category: str = None,
        limit: int = 100,
        page: int = 1
    ):
        """Query the enhanced V2 archive."""
        params = {"limit": limit, "page": page}
        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if source:
            params["source"] = source
        if query:
            params["q"] = query
        if sentiment:
            params["sentiment"] = sentiment
        if category:
            params["category"] = category
        
        response = requests.get(
            "https://cryptocurrency.cv/api/archive",
            params=params
        )
        return response.json()
    
    # Query with sentiment filter
    print("📚 Enhanced Archive Query")
    print("=" * 70)
    
    # Bullish news from last week
    bullish_news = query_archive_v2(
        start_date="2024-01-08",
        end_date="2024-01-15",
        sentiment="bullish",
        limit=20
    )
    
    print(f"\n🟢 Bullish News:")
    print(f"   Total: {bullish_news.get('totalCount', 0)}")
    for article in bullish_news.get('articles', [])[:5]:
        print(f"   • {article.get('title', '')[:50]}...")
    
    # Bearish news
    bearish_news = query_archive_v2(
        start_date="2024-01-08",
        end_date="2024-01-15",
        sentiment="bearish",
        limit=20
    )
    
    print(f"\n🔴 Bearish News:")
    print(f"   Total: {bearish_news.get('totalCount', 0)}")
    for article in bearish_news.get('articles', [])[:5]:
        print(f"   • {article.get('title', '')[:50]}...")
    
    # Search within archive
    print("\n" + "=" * 70)
    print("🔍 Archive Search:")
    
    etf_news = query_archive_v2(
        start_date="2024-01-01",
        end_date="2024-01-31",
        query="ETF approval",
        limit=20
    )
    
    print(f"   Query: 'ETF approval' in January 2024")
    print(f"   Results: {etf_news.get('totalCount', 0)}")
    
    for article in etf_news.get('articles', [])[:5]:
        print(f"   • {article.get('title', '')[:60]}...")
    
    # Category filter
    defi_archive = query_archive_v2(
        start_date="2024-01-01",
        end_date="2024-01-31",
        category="defi",
        limit=20
    )
    
    print(f"\n📁 DeFi Category:")
    print(f"   Total: {defi_archive.get('totalCount', 0)} articles")
    ```

=== "JavaScript"
    ```javascript
    async function queryArchiveV2(options = {}) {
        const params = new URLSearchParams({
            limit: (options.limit || 100).toString(),
            page: (options.page || 1).toString()
        });
        
        if (options.startDate) params.set('start_date', options.startDate);
        if (options.endDate) params.set('end_date', options.endDate);
        if (options.source) params.set('source', options.source);
        if (options.query) params.set('q', options.query);
        if (options.sentiment) params.set('sentiment', options.sentiment);
        if (options.category) params.set('category', options.category);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/archive?${params}`
        );
        return response.json();
    }
    
    console.log("📚 Enhanced Archive Query");
    console.log("=".repeat(70));
    
    // Bullish news
    const bullishNews = await queryArchiveV2({
        startDate: '2024-01-08',
        endDate: '2024-01-15',
        sentiment: 'bullish',
        limit: 20
    });
    
    console.log("\n🟢 Bullish News:");
    console.log(`   Total: ${bullishNews.totalCount}`);
    bullishNews.articles?.slice(0, 5).forEach(a => {
        console.log(`   • ${a.title?.slice(0, 50)}...`);
    });
    
    // Search
    const etfNews = await queryArchiveV2({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        query: 'ETF approval',
        limit: 20
    });
    
    console.log("\n🔍 ETF Approval News:");
    console.log(`   Results: ${etfNews.totalCount}`);
    etfNews.articles?.slice(0, 5).forEach(a => {
        console.log(`   • ${a.title?.slice(0, 60)}...`);
    });
    ```

=== "cURL"
    ```bash
    # Query with sentiment filter
    curl "https://cryptocurrency.cv/api/archive?sentiment=bullish&limit=10" | jq
    
    # Search in archive
    curl "https://cryptocurrency.cv/api/archive?q=ETF+approval&start_date=2024-01-01" | jq
    
    # Filter by category
    curl "https://cryptocurrency.cv/api/archive?category=defi&limit=10" | jq
    
    # Combined filters
    curl "https://cryptocurrency.cv/api/archive?source=coindesk&sentiment=bearish&start_date=2024-01-01&end_date=2024-01-31" | jq
    ```

---

## 3. Archive Status

Check the status and coverage of the archive.

=== "Python"
    ```python
    import requests
    
    def get_archive_status():
        """Get archive status and statistics."""
        response = requests.get(
            "https://cryptocurrency.cv/api/archive/status"
        )
        return response.json()
    
    # Get archive status
    status = get_archive_status()
    
    print("📊 Archive Status")
    print("=" * 60)
    
    # Overall statistics
    print(f"\n📈 Overall Statistics:")
    print(f"   Total Articles: {status.get('totalArticles', 0):,}")
    print(f"   Date Range: {status.get('startDate')} to {status.get('endDate')}")
    print(f"   Sources Covered: {status.get('sourcesCount', 0)}")
    print(f"   Last Updated: {status.get('lastUpdated', 'Unknown')}")
    
    # Storage info
    if 'storage' in status:
        storage = status['storage']
        print(f"\n💾 Storage:")
        print(f"   Used: {storage.get('used', 'Unknown')}")
        print(f"   Available: {storage.get('available', 'Unknown')}")
    
    # Coverage by source
    if 'sourcesCoverage' in status:
        print(f"\n📰 Source Coverage:")
        for source, info in list(status['sourcesCoverage'].items())[:10]:
            count = info.get('count', 0)
            print(f"   {source}: {count:,} articles")
    
    # Coverage by month
    if 'monthlyCoverage' in status:
        print(f"\n📅 Monthly Coverage:")
        for month, count in list(status['monthlyCoverage'].items())[-6:]:
            bar = "█" * (count // 1000) if count >= 1000 else "▒"
            print(f"   {month}: {bar} {count:,}")
    
    # Health check
    if 'health' in status:
        health = status['health']
        status_emoji = "🟢" if health.get('status') == 'healthy' else "🔴"
        print(f"\n{status_emoji} Archive Health: {health.get('status', 'Unknown')}")
        if 'issues' in health:
            for issue in health['issues']:
                print(f"   ⚠️ {issue}")
    ```

=== "JavaScript"
    ```javascript
    async function getArchiveStatus() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/archive/status'
        );
        return response.json();
    }
    
    // Get archive status
    const status = await getArchiveStatus();
    
    console.log("📊 Archive Status");
    console.log("=".repeat(60));
    
    console.log("\n📈 Overall Statistics:");
    console.log(`   Total Articles: ${status.totalArticles?.toLocaleString()}`);
    console.log(`   Date Range: ${status.startDate} to ${status.endDate}`);
    console.log(`   Sources: ${status.sourcesCount}`);
    console.log(`   Last Updated: ${status.lastUpdated}`);
    
    if (status.storage) {
        console.log("\n💾 Storage:");
        console.log(`   Used: ${status.storage.used}`);
        console.log(`   Available: ${status.storage.available}`);
    }
    
    if (status.sourcesCoverage) {
        console.log("\n📰 Source Coverage:");
        Object.entries(status.sourcesCoverage).slice(0, 10).forEach(([source, info]) => {
            console.log(`   ${source}: ${info.count?.toLocaleString()} articles`);
        });
    }
    
    if (status.health) {
        const emoji = status.health.status === 'healthy' ? '🟢' : '🔴';
        console.log(`\n${emoji} Health: ${status.health.status}`);
    }
    ```

=== "cURL"
    ```bash
    # Get archive status
    curl "https://cryptocurrency.cv/api/archive/status" | jq
    
    # Get total article count
    curl "https://cryptocurrency.cv/api/archive/status" | jq '.totalArticles'
    
    # Get source coverage
    curl "https://cryptocurrency.cv/api/archive/status" | jq '.sourcesCoverage'
    
    # Get health status
    curl "https://cryptocurrency.cv/api/archive/status" | jq '.health'
    ```

---

## 4. Export News Data

Export news data in various formats.

=== "Python"
    ```python
    import requests
    import json
    import csv
    from io import StringIO
    
    def export_news(
        format: str = "json",
        limit: int = 100,
        source: str = None,
        from_date: str = None,
        to_date: str = None
    ):
        """Export news data in specified format."""
        params = {
            "format": format,
            "limit": limit
        }
        if source:
            params["source"] = source
        if from_date:
            params["from"] = from_date
        if to_date:
            params["to"] = to_date
        
        response = requests.get(
            "https://cryptocurrency.cv/api/export",
            params=params
        )
        
        if format == "json":
            return response.json()
        else:
            return response.text
    
    # Export as JSON
    print("📤 Export News Data")
    print("=" * 60)
    
    json_data = export_news(format="json", limit=10)
    
    print(f"\n📋 JSON Export:")
    print(f"   Articles: {len(json_data.get('articles', []))}")
    print(f"   Exported At: {json_data.get('exportedAt', 'N/A')}")
    
    # Save to file
    with open("news_export.json", "w") as f:
        json.dump(json_data, f, indent=2)
    print("   ✅ Saved to news_export.json")
    
    # Export as CSV
    csv_data = export_news(format="csv", limit=10)
    
    print(f"\n📊 CSV Export:")
    
    # Parse and count rows
    csv_reader = csv.reader(StringIO(csv_data))
    rows = list(csv_reader)
    print(f"   Rows: {len(rows) - 1}")  # Minus header
    print(f"   Columns: {', '.join(rows[0][:5])}...")
    
    with open("news_export.csv", "w") as f:
        f.write(csv_data)
    print("   ✅ Saved to news_export.csv")
    
    # Export as RSS
    rss_data = export_news(format="rss", limit=10)
    
    print(f"\n📰 RSS Export:")
    print(f"   Size: {len(rss_data)} bytes")
    
    with open("news_export.xml", "w") as f:
        f.write(rss_data)
    print("   ✅ Saved to news_export.xml")
    
    # Export filtered data
    print("\n" + "=" * 60)
    print("🔍 Filtered Export:")
    
    filtered = export_news(
        format="json",
        source="coindesk",
        from_date="2024-01-01",
        to_date="2024-01-31",
        limit=50
    )
    
    print(f"   Source: CoinDesk")
    print(f"   Period: January 2024")
    print(f"   Articles: {len(filtered.get('articles', []))}")
    ```

=== "JavaScript"
    ```javascript
    async function exportNews(options = {}) {
        const params = new URLSearchParams({
            format: options.format || 'json',
            limit: (options.limit || 100).toString()
        });
        
        if (options.source) params.set('source', options.source);
        if (options.from) params.set('from', options.from);
        if (options.to) params.set('to', options.to);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/export?${params}`
        );
        
        if (options.format === 'json' || !options.format) {
            return response.json();
        }
        return response.text();
    }
    
    console.log("📤 Export News Data");
    console.log("=".repeat(60));
    
    // JSON export
    const jsonData = await exportNews({ format: 'json', limit: 10 });
    
    console.log("\n📋 JSON Export:");
    console.log(`   Articles: ${jsonData.articles?.length}`);
    console.log(`   Exported At: ${jsonData.exportedAt}`);
    
    // CSV export
    const csvData = await exportNews({ format: 'csv', limit: 10 });
    
    console.log("\n📊 CSV Export:");
    const lines = csvData.split('\n');
    console.log(`   Rows: ${lines.length - 1}`);
    console.log(`   Headers: ${lines[0].split(',').slice(0, 5).join(', ')}...`);
    
    // RSS export
    const rssData = await exportNews({ format: 'rss', limit: 10 });
    
    console.log("\n📰 RSS Export:");
    console.log(`   Size: ${rssData.length} bytes`);
    
    // Filtered export
    console.log("\n🔍 Filtered Export:");
    const filtered = await exportNews({
        format: 'json',
        source: 'coindesk',
        from: '2024-01-01',
        to: '2024-01-31',
        limit: 50
    });
    console.log(`   CoinDesk (Jan 2024): ${filtered.articles?.length} articles`);
    ```

=== "cURL"
    ```bash
    # Export as JSON
    curl "https://cryptocurrency.cv/api/export?format=json&limit=10" -o news.json
    
    # Export as CSV
    curl "https://cryptocurrency.cv/api/export?format=csv&limit=100" -o news.csv
    
    # Export as RSS
    curl "https://cryptocurrency.cv/api/export?format=rss&limit=20" -o news.xml
    
    # Filtered export
    curl "https://cryptocurrency.cv/api/export?source=coindesk&from=2024-01-01&to=2024-01-31" -o coindesk_jan.json
    
    # View JSON export
    curl "https://cryptocurrency.cv/api/export?format=json&limit=5" | jq '.articles[].title'
    ```

---

## 5. Available Export Formats

Check available export formats and their options.

=== "Python"
    ```python
    import requests
    
    def get_export_formats():
        """Get available export formats."""
        response = requests.get(
            "https://cryptocurrency.cv/api/export/formats"
        )
        return response.json()
    
    # Get available formats
    formats = get_export_formats()
    
    print("📁 Available Export Formats")
    print("=" * 60)
    
    for fmt in formats.get('formats', []):
        print(f"\n   📄 {fmt.get('name', 'Unknown').upper()}")
        print(f"      Extension: .{fmt.get('extension', 'txt')}")
        print(f"      MIME Type: {fmt.get('mimeType', 'text/plain')}")
        print(f"      Description: {fmt.get('description', 'N/A')}")
        
        if 'options' in fmt:
            print(f"      Options:")
            for opt, desc in fmt['options'].items():
                print(f"         • {opt}: {desc}")
    
    # Show example for each format
    print("\n" + "=" * 60)
    print("📋 Format Examples:")
    
    format_examples = {
        "json": "Structured data with nested objects",
        "csv": "Flat tabular data, spreadsheet-compatible",
        "rss": "RSS 2.0 feed, reader-compatible",
        "markdown": "Human-readable markdown format",
        "atom": "Atom feed format"
    }
    
    for fmt, desc in format_examples.items():
        print(f"   • {fmt}: {desc}")
    ```

=== "JavaScript"
    ```javascript
    async function getExportFormats() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/export/formats'
        );
        return response.json();
    }
    
    // Get available formats
    const formats = await getExportFormats();
    
    console.log("📁 Available Export Formats");
    console.log("=".repeat(60));
    
    formats.formats?.forEach(fmt => {
        console.log(`\n   📄 ${fmt.name?.toUpperCase()}`);
        console.log(`      Extension: .${fmt.extension}`);
        console.log(`      MIME Type: ${fmt.mimeType}`);
        console.log(`      Description: ${fmt.description}`);
    });
    ```

=== "cURL"
    ```bash
    # Get available export formats
    curl "https://cryptocurrency.cv/api/export/formats" | jq
    
    # List format names
    curl "https://cryptocurrency.cv/api/export/formats" | jq '.formats[].name'
    ```

---

## Complete Archive & Export Application

Build a comprehensive archiving and export tool:

```python
#!/usr/bin/env python3
"""Complete archive and export tool."""

import requests
import json
import csv
from datetime import datetime, timedelta
from typing import Dict, Any, List
from pathlib import Path

class ArchiveExporter:
    """Archive and export tool."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self, output_dir: str = "./exports"):
        self.session = requests.Session()
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
    
    def _get(self, endpoint: str, params: Dict = None) -> Any:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
    
    def get_status(self) -> Dict[str, Any]:
        """Get archive status."""
        return self._get("/api/archive/status")
    
    def query_archive(
        self,
        start_date: str = None,
        end_date: str = None,
        source: str = None,
        query: str = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Query the archive."""
        params = {"limit": limit}
        if start_date:
            params["start"] = start_date
        if end_date:
            params["end"] = end_date
        if source:
            params["source"] = source
        if query:
            params["q"] = query
        
        return self._get("/api/archive", params)
    
    def export_data(
        self,
        format: str = "json",
        limit: int = 100,
        **filters
    ) -> str:
        """Export data in specified format."""
        params = {"format": format, "limit": limit, **filters}
        return self._get("/api/export", params)
    
    def save_export(
        self,
        data: Any,
        filename: str,
        format: str = "json"
    ) -> Path:
        """Save exported data to file."""
        filepath = self.output_dir / filename
        
        if format == "json":
            with open(filepath, "w") as f:
                json.dump(data, f, indent=2)
        else:
            with open(filepath, "w") as f:
                f.write(data)
        
        return filepath
    
    def run_backup(self, days: int = 7):
        """Run a backup of recent news."""
        print("=" * 70)
        print("📦 ARCHIVE BACKUP TOOL")
        print(f"   Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Check status
        print("\n📊 Archive Status:")
        try:
            status = self.get_status()
            print(f"   Total Articles: {status.get('totalArticles', 0):,}")
            print(f"   Coverage: {status.get('startDate')} to {status.get('endDate')}")
            print(f"   Health: {status.get('health', {}).get('status', 'Unknown')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        start_str = start_date.strftime("%Y-%m-%d")
        end_str = end_date.strftime("%Y-%m-%d")
        
        print(f"\n📅 Backup Period: {start_str} to {end_str} ({days} days)")
        
        # Query archive
        print("\n📥 Fetching Data...")
        try:
            archive = self.query_archive(
                start_date=start_str,
                end_date=end_str,
                limit=1000
            )
            
            articles = archive.get('articles', [])
            print(f"   Found: {len(articles)} articles")
            
            if not articles:
                print("   ⚠️ No articles found for this period")
                return
            
            # Export to JSON
            json_file = self.save_export(
                archive,
                f"backup_{start_str}_to_{end_str}.json",
                "json"
            )
            print(f"   ✅ Saved JSON: {json_file}")
            
            # Export to CSV
            csv_data = self.export_data(
                format="csv",
                limit=1000,
                **{"from": start_str, "to": end_str}
            )
            csv_file = self.save_export(
                csv_data,
                f"backup_{start_str}_to_{end_str}.csv",
                "csv"
            )
            print(f"   ✅ Saved CSV: {csv_file}")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        # Summary
        print("\n📈 Backup Summary:")
        
        if 'articles' in archive:
            # Sources
            sources = {}
            for a in articles:
                src = a.get('source', 'Unknown')
                sources[src] = sources.get(src, 0) + 1
            
            print("   By Source:")
            for src, count in sorted(sources.items(), key=lambda x: -x[1])[:5]:
                print(f"      {src}: {count}")
            
            # Categories
            categories = {}
            for a in articles:
                cat = a.get('category', 'General')
                categories[cat] = categories.get(cat, 0) + 1
            
            print("   By Category:")
            for cat, count in sorted(categories.items(), key=lambda x: -x[1])[:5]:
                print(f"      {cat}: {count}")
        
        print("\n" + "=" * 70)
        print("✅ Backup complete!")
        print(f"   Output: {self.output_dir.absolute()}")

def main():
    exporter = ArchiveExporter()
    exporter.run_backup(days=7)

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [News Basics Tutorial](news-basics.md) - Learn news API fundamentals
- [Search & Filtering](search-filtering.md) - Advanced search techniques
- [Real-time Streaming](realtime-sse.md) - Live news updates
