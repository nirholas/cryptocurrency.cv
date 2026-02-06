# Premium Features Tutorial

This tutorial covers premium API endpoints including advanced analytics, priority access, and exclusive features.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/premium/status` | Check premium status |
| `/api/premium/usage` | API usage statistics |
| `/api/premium/limits` | Rate limits and quotas |
| `/api/premium/features` | Available premium features |
| `/api/premium/analytics` | Advanced analytics |
| `/api/premium/reports` | Custom reports |
| `/api/premium/priority` | Priority queue access |

---

## 1. Premium Status & Features

Check your premium subscription status and available features.

=== "Python"
    ```python
    import requests
    
    def get_premium_status():
        """Get premium subscription status."""
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/status"
        )
        return response.json()
    
    def get_premium_features():
        """Get available premium features."""
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/features"
        )
        return response.json()
    
    # Check status
    status = get_premium_status()
    
    print("⭐ Premium Status")
    print("=" * 70)
    
    is_premium = status.get('isPremium', False)
    tier = status.get('tier', 'free')
    expires = status.get('expiresAt', 'N/A')
    
    status_icon = "✅" if is_premium else "❌"
    print(f"   Premium Active: {status_icon}")
    print(f"   Tier: {tier.title()}")
    print(f"   Expires: {expires}")
    
    if status.get('trialAvailable'):
        print(f"   🎁 Free trial available!")
    
    # Get features
    features = get_premium_features()
    
    print("\n📦 Premium Features:")
    print("-" * 70)
    
    tiers = features.get('tiers', {})
    for tier_name, tier_features in tiers.items():
        print(f"\n   {tier_name.upper()} Tier:")
        for feature in tier_features.get('features', []):
            name = feature.get('name', 'Unknown')
            included = feature.get('included', False)
            icon = "✅" if included else "❌"
            print(f"      {icon} {name}")
    
    # Compare tiers
    print("\n📊 Tier Comparison:")
    print(f"   {'Feature':<30} {'Free':<10} {'Pro':<10} {'Enterprise':<10}")
    print("   " + "-" * 60)
    
    comparison = features.get('comparison', [])
    for item in comparison:
        name = item.get('name', 'Unknown')[:28]
        free = "✅" if item.get('free') else "❌"
        pro = "✅" if item.get('pro') else "❌"
        enterprise = "✅" if item.get('enterprise') else "❌"
        print(f"   {name:<30} {free:<10} {pro:<10} {enterprise:<10}")
    ```

=== "JavaScript"
    ```javascript
    async function getPremiumStatus() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/status'
        );
        return response.json();
    }
    
    async function getPremiumFeatures() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/features'
        );
        return response.json();
    }
    
    // Check status
    const status = await getPremiumStatus();
    
    console.log("⭐ Premium Status");
    console.log("=".repeat(70));
    
    const statusIcon = status.isPremium ? '✅' : '❌';
    console.log(`   Premium Active: ${statusIcon}`);
    console.log(`   Tier: ${status.tier || 'free'}`);
    console.log(`   Expires: ${status.expiresAt || 'N/A'}`);
    
    if (status.trialAvailable) {
        console.log("   🎁 Free trial available!");
    }
    
    // Get features
    const features = await getPremiumFeatures();
    
    console.log("\n📦 Premium Features:");
    console.log("-".repeat(70));
    
    for (const [tierName, tierFeatures] of Object.entries(features.tiers || {})) {
        console.log(`\n   ${tierName.toUpperCase()} Tier:`);
        tierFeatures.features?.forEach(feature => {
            const icon = feature.included ? '✅' : '❌';
            console.log(`      ${icon} ${feature.name}`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get premium status
    curl "https://cryptocurrency.cv/api/premium/status" | jq
    
    # Get premium features
    curl "https://cryptocurrency.cv/api/premium/features" | jq
    
    # Check if premium
    curl "https://cryptocurrency.cv/api/premium/status" | jq '.isPremium'
    ```

---

## 2. API Usage & Limits

Monitor your API usage and rate limits.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_api_usage():
        """Get API usage statistics."""
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/usage"
        )
        return response.json()
    
    def get_rate_limits():
        """Get rate limits and quotas."""
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/limits"
        )
        return response.json()
    
    # Get usage
    usage = get_api_usage()
    
    print("📊 API Usage Statistics")
    print("=" * 70)
    
    period = usage.get('period', {})
    print(f"   Period: {period.get('start', 'N/A')} to {period.get('end', 'N/A')}")
    
    print("\n   Requests:")
    requests_data = usage.get('requests', {})
    total = requests_data.get('total', 0)
    limit = requests_data.get('limit', 0)
    remaining = requests_data.get('remaining', 0)
    
    usage_pct = (total / limit * 100) if limit > 0 else 0
    bar = "█" * int(usage_pct / 5) + "░" * (20 - int(usage_pct / 5))
    
    print(f"      Total: {total:,} / {limit:,}")
    print(f"      Remaining: {remaining:,}")
    print(f"      Usage: [{bar}] {usage_pct:.1f}%")
    
    # By endpoint
    print("\n   Top Endpoints:")
    by_endpoint = usage.get('byEndpoint', [])
    for endpoint in by_endpoint[:10]:
        name = endpoint.get('endpoint', 'Unknown')[:40]
        count = endpoint.get('count', 0)
        print(f"      {name:<40} {count:>8,}")
    
    # By day
    print("\n   Daily Usage (Last 7 Days):")
    by_day = usage.get('byDay', [])
    max_count = max((d.get('count', 0) for d in by_day), default=1)
    
    for day in by_day[:7]:
        date = day.get('date', 'N/A')[:10]
        count = day.get('count', 0)
        bar_len = int(count / max_count * 20) if max_count > 0 else 0
        bar = "█" * bar_len + "░" * (20 - bar_len)
        print(f"      {date} [{bar}] {count:,}")
    
    # Get rate limits
    print("\n" + "=" * 70)
    print("⚡ Rate Limits")
    print("-" * 70)
    
    limits = get_rate_limits()
    
    print(f"   {'Limit Type':<25} {'Current':<15} {'Limit':<15} {'Resets':<20}")
    print("   " + "-" * 75)
    
    for limit_type in limits.get('limits', []):
        name = limit_type.get('name', 'Unknown')
        current = limit_type.get('current', 0)
        max_val = limit_type.get('limit', 0)
        resets = limit_type.get('resetsAt', 'N/A')[:19]
        
        usage_pct = (current / max_val * 100) if max_val > 0 else 0
        status = "🟢" if usage_pct < 80 else "🟡" if usage_pct < 95 else "🔴"
        
        print(f"   {status} {name:<23} {current:<15,} {max_val:<15,} {resets}")
    ```

=== "JavaScript"
    ```javascript
    async function getApiUsage() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/usage'
        );
        return response.json();
    }
    
    async function getRateLimits() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/limits'
        );
        return response.json();
    }
    
    // Get usage
    const usage = await getApiUsage();
    
    console.log("📊 API Usage Statistics");
    console.log("=".repeat(70));
    
    const requests = usage.requests || {};
    const usagePct = (requests.total / requests.limit * 100) || 0;
    const bar = '█'.repeat(Math.floor(usagePct / 5)) + '░'.repeat(20 - Math.floor(usagePct / 5));
    
    console.log(`   Total: ${requests.total?.toLocaleString()} / ${requests.limit?.toLocaleString()}`);
    console.log(`   Usage: [${bar}] ${usagePct.toFixed(1)}%`);
    
    // Top endpoints
    console.log("\n   Top Endpoints:");
    usage.byEndpoint?.slice(0, 10).forEach(endpoint => {
        console.log(`      ${endpoint.endpoint?.slice(0, 40).padEnd(40)} ${endpoint.count?.toLocaleString()}`);
    });
    
    // Rate limits
    const limits = await getRateLimits();
    
    console.log("\n⚡ Rate Limits");
    limits.limits?.forEach(limit => {
        const pct = (limit.current / limit.limit * 100) || 0;
        const status = pct < 80 ? '🟢' : pct < 95 ? '🟡' : '🔴';
        console.log(`   ${status} ${limit.name}: ${limit.current}/${limit.limit}`);
    });
    ```

=== "cURL"
    ```bash
    # Get API usage
    curl "https://cryptocurrency.cv/api/premium/usage" | jq
    
    # Get rate limits
    curl "https://cryptocurrency.cv/api/premium/limits" | jq
    
    # Get remaining requests
    curl "https://cryptocurrency.cv/api/premium/usage" | jq '.requests.remaining'
    
    # Get usage by endpoint
    curl "https://cryptocurrency.cv/api/premium/usage" | jq '.byEndpoint[:5]'
    ```

---

## 3. Advanced Analytics

Access premium analytics and insights.

=== "Python"
    ```python
    import requests
    
    def get_advanced_analytics(report_type: str, params: dict = None):
        """Get advanced analytics."""
        query_params = {"type": report_type}
        if params:
            query_params.update(params)
        
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/analytics",
            params=query_params
        )
        return response.json()
    
    # Market correlation analysis
    print("📈 Premium Analytics")
    print("=" * 70)
    
    correlations = get_advanced_analytics("correlations", {
        "assets": "BTC,ETH,SOL,AVAX,DOT",
        "period": "30d"
    })
    
    print("\n🔗 Asset Correlations (30 Days):")
    matrix = correlations.get('correlationMatrix', [])
    assets = correlations.get('assets', [])
    
    # Print header
    print(f"   {'':<8}", end="")
    for asset in assets:
        print(f"{asset:<8}", end="")
    print()
    
    # Print matrix
    for i, row in enumerate(matrix):
        print(f"   {assets[i]:<8}", end="")
        for val in row:
            color = "🟢" if val > 0.7 else "🟡" if val > 0.3 else "🔴" if val < -0.3 else "⚪"
            print(f"{val:>6.2f}{color} ", end="")
        print()
    
    # Sentiment trends
    print("\n📊 Sentiment Trends:")
    sentiment = get_advanced_analytics("sentiment-trends", {
        "assets": "BTC,ETH",
        "period": "7d"
    })
    
    for asset_data in sentiment.get('trends', []):
        asset = asset_data.get('asset', 'Unknown')
        print(f"\n   {asset}:")
        
        for day in asset_data.get('daily', [])[:7]:
            date = day.get('date', '')[:10]
            score = day.get('sentiment', 0)
            volume = day.get('volume', 0)
            
            bar_pos = int(max(0, score) * 10)
            bar_neg = int(max(0, -score) * 10)
            bar = "░" * (10 - bar_neg) + "█" * bar_neg + "|" + "█" * bar_pos + "░" * (10 - bar_pos)
            
            print(f"      {date} [{bar}] {score:+.2f} ({volume} mentions)")
    
    # Whale activity
    print("\n🐋 Whale Activity:")
    whales = get_advanced_analytics("whale-activity", {
        "minValue": 1000000,
        "period": "24h"
    })
    
    for tx in whales.get('transactions', [])[:10]:
        asset = tx.get('asset', 'N/A')
        amount = tx.get('amount', 0)
        value = tx.get('valueUsd', 0)
        direction = tx.get('direction', 'transfer')
        
        icon = "📥" if direction == "inflow" else "📤" if direction == "outflow" else "🔄"
        print(f"   {icon} {asset}: {amount:,.2f} (${value:,.0f})")
    
    # On-chain metrics
    print("\n⛓️ On-Chain Metrics:")
    onchain = get_advanced_analytics("onchain-metrics", {
        "asset": "BTC"
    })
    
    metrics = onchain.get('metrics', {})
    print(f"   Active Addresses: {metrics.get('activeAddresses', 0):,}")
    print(f"   Transaction Count: {metrics.get('txCount', 0):,}")
    print(f"   Hash Rate: {metrics.get('hashRate', 0):,.2f} EH/s")
    print(f"   Mining Difficulty: {metrics.get('difficulty', 0):,.0f}")
    print(f"   MVRV Ratio: {metrics.get('mvrv', 0):.2f}")
    print(f"   NVT Ratio: {metrics.get('nvt', 0):.2f}")
    ```

=== "JavaScript"
    ```javascript
    async function getAdvancedAnalytics(reportType, params = {}) {
        const queryParams = new URLSearchParams({ type: reportType, ...params });
        const response = await fetch(
            `https://cryptocurrency.cv/api/premium/analytics?${queryParams}`
        );
        return response.json();
    }
    
    console.log("📈 Premium Analytics");
    console.log("=".repeat(70));
    
    // Correlations
    const correlations = await getAdvancedAnalytics('correlations', {
        assets: 'BTC,ETH,SOL',
        period: '30d'
    });
    
    console.log("\n🔗 Asset Correlations:");
    const assets = correlations.assets || [];
    const matrix = correlations.correlationMatrix || [];
    
    assets.forEach((asset, i) => {
        console.log(`   ${asset}: ${matrix[i]?.map(v => v.toFixed(2)).join(' ')}`);
    });
    
    // Sentiment trends
    const sentiment = await getAdvancedAnalytics('sentiment-trends', {
        assets: 'BTC,ETH',
        period: '7d'
    });
    
    console.log("\n📊 Sentiment Trends:");
    sentiment.trends?.forEach(trend => {
        console.log(`\n   ${trend.asset}:`);
        trend.daily?.slice(0, 5).forEach(day => {
            const bar = day.sentiment >= 0 ? '█'.repeat(Math.floor(day.sentiment * 10)) : '';
            console.log(`      ${day.date?.slice(0,10)} [${bar.padEnd(10)}] ${day.sentiment?.toFixed(2)}`);
        });
    });
    
    // Whale activity
    console.log("\n🐋 Whale Activity:");
    const whales = await getAdvancedAnalytics('whale-activity', {
        minValue: 1000000,
        period: '24h'
    });
    
    whales.transactions?.slice(0, 10).forEach(tx => {
        const icon = tx.direction === 'inflow' ? '📥' : tx.direction === 'outflow' ? '📤' : '🔄';
        console.log(`   ${icon} ${tx.asset}: $${tx.valueUsd?.toLocaleString()}`);
    });
    ```

=== "cURL"
    ```bash
    # Get correlation analysis
    curl "https://cryptocurrency.cv/api/premium/analytics?type=correlations&assets=BTC,ETH,SOL&period=30d" | jq
    
    # Get sentiment trends
    curl "https://cryptocurrency.cv/api/premium/analytics?type=sentiment-trends&assets=BTC&period=7d" | jq
    
    # Get whale activity
    curl "https://cryptocurrency.cv/api/premium/analytics?type=whale-activity&minValue=1000000" | jq
    
    # Get on-chain metrics
    curl "https://cryptocurrency.cv/api/premium/analytics?type=onchain-metrics&asset=BTC" | jq
    ```

---

## 4. Custom Reports

Generate and retrieve custom reports.

=== "Python"
    ```python
    import requests
    import time
    
    def create_report(report_config: dict):
        """Create a custom report."""
        response = requests.post(
            "https://cryptocurrency.cv/api/premium/reports",
            json=report_config
        )
        return response.json()
    
    def get_report(report_id: str):
        """Get a generated report."""
        response = requests.get(
            f"https://cryptocurrency.cv/api/premium/reports/{report_id}"
        )
        return response.json()
    
    def list_reports():
        """List all reports."""
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/reports"
        )
        return response.json()
    
    # Create a custom report
    print("📋 Creating Custom Report...")
    
    report_config = {
        "name": "Weekly Portfolio Analysis",
        "type": "portfolio-analysis",
        "assets": ["BTC", "ETH", "SOL", "AVAX"],
        "metrics": [
            "price_performance",
            "volatility",
            "correlation",
            "sentiment",
            "news_volume"
        ],
        "period": "7d",
        "format": "json"
    }
    
    result = create_report(report_config)
    report_id = result.get('reportId')
    
    print(f"   Report ID: {report_id}")
    print(f"   Status: {result.get('status', 'N/A')}")
    
    # Wait for report generation
    print("\n⏳ Waiting for report generation...")
    for _ in range(10):
        report = get_report(report_id)
        status = report.get('status', 'unknown')
        print(f"   Status: {status}")
        
        if status == 'completed':
            break
        time.sleep(2)
    
    # Display report
    if report.get('status') == 'completed':
        print("\n📊 Report Results:")
        print("-" * 70)
        
        data = report.get('data', {})
        
        # Summary
        summary = data.get('summary', {})
        print(f"\n   📈 Summary:")
        print(f"      Period: {summary.get('period', 'N/A')}")
        print(f"      Total Return: {summary.get('totalReturn', 0):+.2f}%")
        print(f"      Best Performer: {summary.get('bestPerformer', 'N/A')}")
        print(f"      Worst Performer: {summary.get('worstPerformer', 'N/A')}")
        
        # Asset performance
        print(f"\n   📊 Asset Performance:")
        for asset in data.get('assets', []):
            symbol = asset.get('symbol', 'N/A')
            ret = asset.get('return', 0)
            vol = asset.get('volatility', 0)
            sentiment = asset.get('sentiment', 0)
            
            icon = "🟢" if ret >= 0 else "🔴"
            sent_icon = "😀" if sentiment > 0.3 else "😐" if sentiment > -0.3 else "😟"
            
            print(f"      {symbol}: {icon} {ret:+.2f}% | Vol: {vol:.2f}% | {sent_icon} {sentiment:+.2f}")
        
        # Insights
        print(f"\n   💡 Key Insights:")
        for insight in data.get('insights', [])[:5]:
            print(f"      • {insight}")
    
    # List all reports
    print("\n📁 Your Reports:")
    all_reports = list_reports()
    
    for r in all_reports.get('reports', [])[:10]:
        status_icon = "✅" if r.get('status') == 'completed' else "⏳"
        print(f"   {status_icon} {r.get('name', 'Unnamed')} - {r.get('createdAt', 'N/A')[:10]}")
    ```

=== "JavaScript"
    ```javascript
    async function createReport(config) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/reports',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            }
        );
        return response.json();
    }
    
    async function getReport(reportId) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/premium/reports/${reportId}`
        );
        return response.json();
    }
    
    async function listReports() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/reports'
        );
        return response.json();
    }
    
    // Create report
    console.log("📋 Creating Custom Report...");
    
    const result = await createReport({
        name: 'Weekly Portfolio Analysis',
        type: 'portfolio-analysis',
        assets: ['BTC', 'ETH', 'SOL'],
        metrics: ['price_performance', 'volatility', 'sentiment'],
        period: '7d',
        format: 'json'
    });
    
    console.log(`   Report ID: ${result.reportId}`);
    
    // Wait and get report
    await new Promise(r => setTimeout(r, 5000));
    
    const report = await getReport(result.reportId);
    
    if (report.status === 'completed') {
        console.log("\n📊 Report Results:");
        console.log(`   Total Return: ${report.data?.summary?.totalReturn}%`);
        
        report.data?.assets?.forEach(asset => {
            const icon = asset.return >= 0 ? '🟢' : '🔴';
            console.log(`   ${asset.symbol}: ${icon} ${asset.return?.toFixed(2)}%`);
        });
    }
    
    // List reports
    console.log("\n📁 Your Reports:");
    const allReports = await listReports();
    allReports.reports?.slice(0, 10).forEach(r => {
        const icon = r.status === 'completed' ? '✅' : '⏳';
        console.log(`   ${icon} ${r.name}`);
    });
    ```

=== "cURL"
    ```bash
    # Create a custom report
    curl -X POST "https://cryptocurrency.cv/api/premium/reports" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Weekly Analysis",
        "type": "portfolio-analysis",
        "assets": ["BTC", "ETH"],
        "period": "7d"
      }' | jq
    
    # Get a report
    curl "https://cryptocurrency.cv/api/premium/reports/REPORT_ID" | jq
    
    # List all reports
    curl "https://cryptocurrency.cv/api/premium/reports" | jq
    ```

---

## 5. Priority Queue Access

Access priority processing for faster responses.

=== "Python"
    ```python
    import requests
    
    def get_priority_status():
        """Check priority queue status."""
        response = requests.get(
            "https://cryptocurrency.cv/api/premium/priority"
        )
        return response.json()
    
    def make_priority_request(endpoint: str, params: dict = None):
        """Make a priority API request."""
        headers = {"X-Priority": "true"}
        
        response = requests.get(
            f"https://cryptocurrency.cv{endpoint}",
            params=params or {},
            headers=headers
        )
        
        # Get timing info from headers
        response_time = response.headers.get('X-Response-Time', 'N/A')
        queue_position = response.headers.get('X-Queue-Position', 'N/A')
        
        return {
            "data": response.json(),
            "responseTime": response_time,
            "queuePosition": queue_position
        }
    
    # Check priority status
    priority = get_priority_status()
    
    print("⚡ Priority Queue Status")
    print("=" * 70)
    
    print(f"   Priority Access: {'✅ Enabled' if priority.get('enabled') else '❌ Disabled'}")
    print(f"   Queue Position: {priority.get('queuePosition', 'N/A')}")
    print(f"   Avg Wait Time: {priority.get('avgWaitTime', 'N/A')}ms")
    print(f"   Priority Credits: {priority.get('credits', 0)}")
    
    # Compare response times
    print("\n📊 Response Time Comparison:")
    
    # Standard request
    import time
    
    start = time.time()
    standard = requests.get(
        "https://cryptocurrency.cv/api/news",
        params={"limit": 50}
    )
    standard_time = (time.time() - start) * 1000
    
    # Priority request
    start = time.time()
    priority_result = make_priority_request("/api/news", {"limit": 50})
    priority_time = (time.time() - start) * 1000
    
    print(f"   Standard Request: {standard_time:.0f}ms")
    print(f"   Priority Request: {priority_time:.0f}ms")
    print(f"   Improvement: {((standard_time - priority_time) / standard_time * 100):.1f}%")
    
    # Priority queue metrics
    print("\n📈 Queue Metrics:")
    metrics = priority.get('metrics', {})
    print(f"   Requests Today: {metrics.get('requestsToday', 0)}")
    print(f"   Avg Response Time: {metrics.get('avgResponseTime', 0)}ms")
    print(f"   P99 Response Time: {metrics.get('p99ResponseTime', 0)}ms")
    print(f"   Success Rate: {metrics.get('successRate', 0):.2f}%")
    ```

=== "JavaScript"
    ```javascript
    async function getPriorityStatus() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/premium/priority'
        );
        return response.json();
    }
    
    async function makePriorityRequest(endpoint, params = {}) {
        const queryParams = new URLSearchParams(params);
        const start = performance.now();
        
        const response = await fetch(
            `https://cryptocurrency.cv${endpoint}?${queryParams}`,
            { headers: { 'X-Priority': 'true' } }
        );
        
        const responseTime = performance.now() - start;
        
        return {
            data: await response.json(),
            responseTime: Math.round(responseTime),
            queuePosition: response.headers.get('X-Queue-Position')
        };
    }
    
    // Check status
    const priority = await getPriorityStatus();
    
    console.log("⚡ Priority Queue Status");
    console.log("=".repeat(70));
    console.log(`   Priority Access: ${priority.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`   Queue Position: ${priority.queuePosition || 'N/A'}`);
    console.log(`   Priority Credits: ${priority.credits || 0}`);
    
    // Compare response times
    console.log("\n📊 Response Time Comparison:");
    
    const standardStart = performance.now();
    await fetch('https://cryptocurrency.cv/api/news?limit=50');
    const standardTime = performance.now() - standardStart;
    
    const priorityResult = await makePriorityRequest('/api/news', { limit: 50 });
    
    console.log(`   Standard: ${Math.round(standardTime)}ms`);
    console.log(`   Priority: ${priorityResult.responseTime}ms`);
    ```

=== "cURL"
    ```bash
    # Check priority status
    curl "https://cryptocurrency.cv/api/premium/priority" | jq
    
    # Make priority request
    curl -H "X-Priority: true" "https://cryptocurrency.cv/api/news?limit=50" -w "\nTime: %{time_total}s\n"
    
    # Compare with standard request
    curl "https://cryptocurrency.cv/api/news?limit=50" -w "\nTime: %{time_total}s\n"
    ```

---

## Complete Premium Dashboard

```python
#!/usr/bin/env python3
"""Premium features dashboard."""

import requests
from datetime import datetime
from typing import Dict, Any

class PremiumDashboard:
    """Premium features dashboard."""
    
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
        """Run premium dashboard."""
        print("=" * 80)
        print("⭐ PREMIUM FEATURES DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Status
        print("\n📋 SUBSCRIPTION STATUS")
        print("-" * 80)
        try:
            status = self._get("/api/premium/status")
            icon = "✅" if status.get('isPremium') else "❌"
            print(f"   Premium: {icon}")
            print(f"   Tier: {status.get('tier', 'free').title()}")
            print(f"   Expires: {status.get('expiresAt', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Usage
        print("\n📊 API USAGE")
        print("-" * 80)
        try:
            usage = self._get("/api/premium/usage")
            req = usage.get('requests', {})
            pct = (req.get('total', 0) / req.get('limit', 1)) * 100
            bar = "█" * int(pct / 5) + "░" * (20 - int(pct / 5))
            print(f"   Requests: {req.get('total', 0):,} / {req.get('limit', 0):,}")
            print(f"   Usage: [{bar}] {pct:.1f}%")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Rate limits
        print("\n⚡ RATE LIMITS")
        print("-" * 80)
        try:
            limits = self._get("/api/premium/limits")
            for limit in limits.get('limits', [])[:5]:
                pct = (limit.get('current', 0) / limit.get('limit', 1)) * 100
                icon = "🟢" if pct < 80 else "🟡" if pct < 95 else "🔴"
                print(f"   {icon} {limit.get('name', 'Unknown')}: {limit.get('current', 0)}/{limit.get('limit', 0)}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Priority
        print("\n🚀 PRIORITY ACCESS")
        print("-" * 80)
        try:
            priority = self._get("/api/premium/priority")
            icon = "✅" if priority.get('enabled') else "❌"
            print(f"   Enabled: {icon}")
            print(f"   Credits: {priority.get('credits', 0)}")
            print(f"   Avg Response: {priority.get('avgWaitTime', 'N/A')}ms")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    dashboard = PremiumDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [AI Features](ai-features.md) - Premium AI capabilities
- [Analytics & Research](analytics-research.md) - Advanced analytics
- [User Alerts](user-alerts.md) - Alert configuration
