# Analytics & Research Tutorial

This tutorial covers all research and analytics endpoints for deep market analysis, narrative detection, and source credibility.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/narratives` | Narrative cluster detection |
| `/api/regulatory` | Regulatory intelligence |
| `/api/influencers` | Influencer tracking |
| `/api/analytics/anomalies` | Anomaly detection |
| `/api/analytics/headlines` | Headline tracking |
| `/api/analytics/credibility` | Source credibility scores |
| `/api/analytics/causality` | Causal analysis |

---

## 1. Narrative Detection

Identify and track emerging narratives in the crypto space.

=== "Python"
    ```python
    import requests
    from collections import defaultdict
    
    def get_narratives(period: str = "24h", limit: int = 10):
        """Detect narrative clusters in news."""
        response = requests.get(
            "https://cryptocurrency.cv/api/narratives",
            params={"period": period, "limit": limit}
        )
        return response.json()
    
    # Get current narratives
    data = get_narratives(period="24h", limit=10)
    
    print("📊 Crypto Narrative Clusters")
    print("=" * 60)
    
    for i, narrative in enumerate(data.get('narratives', []), 1):
        print(f"\n{i}. {narrative.get('theme')}")
        print(f"   📈 Strength: {narrative.get('strength', 0) * 100:.1f}%")
        print(f"   📰 Articles: {narrative.get('articleCount', 0)}")
        print(f"   🏷️ Keywords: {', '.join(narrative.get('keywords', [])[:5])}")
        
        if 'relatedAssets' in narrative:
            print(f"   💰 Assets: {', '.join(narrative['relatedAssets'][:3])}")
        
        if 'sentiment' in narrative:
            print(f"   😊 Sentiment: {narrative['sentiment']}")
    
    # Analyze trends
    print("\n" + "=" * 60)
    print("📈 Narrative Strength Distribution:")
    
    strength_buckets = defaultdict(int)
    for n in data.get('narratives', []):
        strength = n.get('strength', 0)
        if strength >= 0.7:
            strength_buckets['Strong (>70%)'] += 1
        elif strength >= 0.4:
            strength_buckets['Medium (40-70%)'] += 1
        else:
            strength_buckets['Weak (<40%)'] += 1
    
    for bucket, count in strength_buckets.items():
        print(f"   {bucket}: {count}")
    ```

=== "JavaScript"
    ```javascript
    async function getNarratives(period = '24h', limit = 10) {
        const params = new URLSearchParams({ period, limit: limit.toString() });
        const response = await fetch(
            `https://cryptocurrency.cv/api/narratives?${params}`
        );
        return response.json();
    }
    
    // Get and display narratives
    const data = await getNarratives('24h', 10);
    
    console.log("📊 Crypto Narrative Clusters");
    console.log("=".repeat(60));
    
    data.narratives?.forEach((narrative, i) => {
        console.log(`\n${i + 1}. ${narrative.theme}`);
        console.log(`   📈 Strength: ${(narrative.strength * 100).toFixed(1)}%`);
        console.log(`   📰 Articles: ${narrative.articleCount}`);
        console.log(`   🏷️ Keywords: ${narrative.keywords?.slice(0, 5).join(', ')}`);
        
        if (narrative.relatedAssets) {
            console.log(`   💰 Assets: ${narrative.relatedAssets.slice(0, 3).join(', ')}`);
        }
    });
    
    // Group by strength
    const strong = data.narratives?.filter(n => n.strength >= 0.7) || [];
    const medium = data.narratives?.filter(n => n.strength >= 0.4 && n.strength < 0.7) || [];
    const weak = data.narratives?.filter(n => n.strength < 0.4) || [];
    
    console.log("\n📈 Distribution:");
    console.log(`   Strong: ${strong.length} | Medium: ${medium.length} | Weak: ${weak.length}`);
    ```

=== "cURL"
    ```bash
    # Get narratives for last 24 hours
    curl "https://cryptocurrency.cv/api/narratives?period=24h&limit=10" | jq
    
    # Get weekly narratives
    curl "https://cryptocurrency.cv/api/narratives?period=7d" | jq '.narratives[:5]'
    
    # Extract just themes
    curl "https://cryptocurrency.cv/api/narratives" | jq '.narratives[].theme'
    ```

---

## 2. Regulatory Intelligence

Track regulatory developments across jurisdictions.

=== "Python"
    ```python
    import requests
    
    def get_regulatory(jurisdiction: str = None, type: str = None):
        """Get regulatory intelligence."""
        params = {}
        if jurisdiction:
            params["jurisdiction"] = jurisdiction
        if type:
            params["type"] = type
        
        response = requests.get(
            "https://cryptocurrency.cv/api/regulatory",
            params=params
        )
        return response.json()
    
    # Get all regulatory news
    data = get_regulatory()
    
    print("⚖️ Regulatory Intelligence")
    print("=" * 60)
    
    # Group by jurisdiction
    by_jurisdiction = {}
    for item in data.get('items', []):
        jur = item.get('jurisdiction', 'Unknown')
        if jur not in by_jurisdiction:
            by_jurisdiction[jur] = []
        by_jurisdiction[jur].append(item)
    
    for jurisdiction, items in sorted(by_jurisdiction.items()):
        print(f"\n🌍 {jurisdiction} ({len(items)} items):")
        for item in items[:3]:
            print(f"   • {item.get('title', 'N/A')[:60]}...")
            print(f"     Type: {item.get('type')} | Impact: {item.get('impact', 'N/A')}")
    
    # Get US-specific regulatory news
    print("\n" + "=" * 60)
    print("🇺🇸 US Regulatory Focus:")
    
    us_data = get_regulatory(jurisdiction="US")
    for item in us_data.get('items', [])[:5]:
        print(f"   • {item.get('title', 'N/A')[:70]}...")
    ```

=== "JavaScript"
    ```javascript
    async function getRegulatory(jurisdiction = null, type = null) {
        const params = new URLSearchParams();
        if (jurisdiction) params.set('jurisdiction', jurisdiction);
        if (type) params.set('type', type);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/regulatory?${params}`
        );
        return response.json();
    }
    
    // Get all regulatory news
    const data = await getRegulatory();
    
    console.log("⚖️ Regulatory Intelligence");
    console.log("=".repeat(60));
    
    // Group by jurisdiction
    const byJurisdiction = {};
    data.items?.forEach(item => {
        const jur = item.jurisdiction || 'Unknown';
        if (!byJurisdiction[jur]) byJurisdiction[jur] = [];
        byJurisdiction[jur].push(item);
    });
    
    for (const [jur, items] of Object.entries(byJurisdiction)) {
        console.log(`\n🌍 ${jur} (${items.length} items):`);
        items.slice(0, 3).forEach(item => {
            console.log(`   • ${item.title?.slice(0, 60)}...`);
        });
    }
    
    // US-specific
    console.log("\n🇺🇸 US Regulatory Focus:");
    const usData = await getRegulatory('US');
    usData.items?.slice(0, 5).forEach(item => {
        console.log(`   • ${item.title?.slice(0, 70)}...`);
    });
    ```

=== "cURL"
    ```bash
    # Get all regulatory news
    curl "https://cryptocurrency.cv/api/regulatory" | jq
    
    # Filter by jurisdiction
    curl "https://cryptocurrency.cv/api/regulatory?jurisdiction=US" | jq '.items[:5]'
    
    # Filter by type (e.g., enforcement, legislation)
    curl "https://cryptocurrency.cv/api/regulatory?type=enforcement" | jq
    ```

---

## 3. Influencer Tracking

Track crypto influencers and their impact.

=== "Python"
    ```python
    import requests
    
    def get_influencers(platform: str = None, limit: int = 20, sort_by: str = "followers"):
        """Get influencer data."""
        params = {"limit": limit, "sortBy": sort_by}
        if platform:
            params["platform"] = platform
        
        response = requests.get(
            "https://cryptocurrency.cv/api/influencers",
            params=params
        )
        return response.json()
    
    # Get top influencers
    data = get_influencers(limit=20)
    
    print("🌟 Top Crypto Influencers")
    print("=" * 60)
    
    for i, inf in enumerate(data.get('influencers', [])[:10], 1):
        print(f"\n{i}. @{inf.get('username')}")
        print(f"   Platform: {inf.get('platform')}")
        print(f"   Followers: {inf.get('followers', 0):,}")
        print(f"   Engagement: {inf.get('engagement', 0) * 100:.2f}%")
        
        if 'recentPosts' in inf:
            print(f"   Recent Posts: {len(inf['recentPosts'])}")
        
        if 'topics' in inf:
            print(f"   Topics: {', '.join(inf['topics'][:3])}")
    
    # Get Twitter-specific influencers
    print("\n" + "=" * 60)
    print("🐦 Twitter Crypto Influencers:")
    
    twitter_data = get_influencers(platform="twitter", sort_by="engagement")
    for inf in twitter_data.get('influencers', [])[:5]:
        print(f"   @{inf.get('username')}: {inf.get('followers', 0):,} followers")
    ```

=== "JavaScript"
    ```javascript
    async function getInfluencers(platform = null, limit = 20, sortBy = 'followers') {
        const params = new URLSearchParams({ 
            limit: limit.toString(), 
            sortBy 
        });
        if (platform) params.set('platform', platform);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/influencers?${params}`
        );
        return response.json();
    }
    
    // Get top influencers
    const data = await getInfluencers(null, 20);
    
    console.log("🌟 Top Crypto Influencers");
    console.log("=".repeat(60));
    
    data.influencers?.slice(0, 10).forEach((inf, i) => {
        console.log(`\n${i + 1}. @${inf.username}`);
        console.log(`   Platform: ${inf.platform}`);
        console.log(`   Followers: ${inf.followers?.toLocaleString()}`);
        console.log(`   Engagement: ${(inf.engagement * 100).toFixed(2)}%`);
    });
    
    // Twitter influencers
    console.log("\n🐦 Twitter Crypto Influencers:");
    const twitterData = await getInfluencers('twitter', 5, 'engagement');
    twitterData.influencers?.forEach(inf => {
        console.log(`   @${inf.username}: ${inf.followers?.toLocaleString()} followers`);
    });
    ```

=== "cURL"
    ```bash
    # Get top influencers
    curl "https://cryptocurrency.cv/api/influencers?limit=10" | jq
    
    # Filter by platform
    curl "https://cryptocurrency.cv/api/influencers?platform=twitter" | jq
    
    # Sort by engagement
    curl "https://cryptocurrency.cv/api/influencers?sortBy=engagement" | jq '.influencers[:5]'
    ```

---

## 4. Anomaly Detection

Detect unusual patterns in news and market activity.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_anomalies(hours: int = 24, severity: str = None):
        """Detect anomalies in news/market data."""
        params = {"hours": hours}
        if severity:
            params["severity"] = severity
        
        response = requests.get(
            "https://cryptocurrency.cv/api/analytics/anomalies",
            params=params
        )
        return response.json()
    
    # Get anomalies
    data = get_anomalies(hours=24)
    
    print("🚨 Anomaly Detection")
    print("=" * 60)
    print(f"Period: Last {data.get('period', '24h')}")
    print(f"Total Anomalies: {len(data.get('anomalies', []))}")
    
    # Group by severity
    by_severity = {}
    for anomaly in data.get('anomalies', []):
        sev = anomaly.get('severity', 'unknown')
        if sev not in by_severity:
            by_severity[sev] = []
        by_severity[sev].append(anomaly)
    
    print("\n📊 By Severity:")
    for sev in ['critical', 'high', 'medium', 'low']:
        if sev in by_severity:
            print(f"   {sev.upper()}: {len(by_severity[sev])}")
    
    # Show critical anomalies
    print("\n🔴 Critical Anomalies:")
    for anomaly in by_severity.get('critical', [])[:5]:
        print(f"   • {anomaly.get('type')}: {anomaly.get('description')}")
        print(f"     Detected: {anomaly.get('detectedAt')}")
        if 'affectedAssets' in anomaly:
            print(f"     Assets: {', '.join(anomaly['affectedAssets'])}")
    ```

=== "JavaScript"
    ```javascript
    async function getAnomalies(hours = 24, severity = null) {
        const params = new URLSearchParams({ hours: hours.toString() });
        if (severity) params.set('severity', severity);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/analytics/anomalies?${params}`
        );
        return response.json();
    }
    
    // Get anomalies
    const data = await getAnomalies(24);
    
    console.log("🚨 Anomaly Detection");
    console.log("=".repeat(60));
    console.log(`Period: Last ${data.period}`);
    console.log(`Total Anomalies: ${data.anomalies?.length || 0}`);
    
    // Group by severity
    const bySeverity = {};
    data.anomalies?.forEach(a => {
        const sev = a.severity || 'unknown';
        if (!bySeverity[sev]) bySeverity[sev] = [];
        bySeverity[sev].push(a);
    });
    
    console.log("\n📊 By Severity:");
    ['critical', 'high', 'medium', 'low'].forEach(sev => {
        if (bySeverity[sev]) {
            console.log(`   ${sev.toUpperCase()}: ${bySeverity[sev].length}`);
        }
    });
    
    // Show critical
    console.log("\n🔴 Critical Anomalies:");
    bySeverity.critical?.slice(0, 5).forEach(a => {
        console.log(`   • ${a.type}: ${a.description}`);
    });
    ```

=== "cURL"
    ```bash
    # Get all anomalies
    curl "https://cryptocurrency.cv/api/analytics/anomalies?hours=24" | jq
    
    # Get critical anomalies only
    curl "https://cryptocurrency.cv/api/analytics/anomalies?severity=critical" | jq
    
    # Get high and critical
    curl "https://cryptocurrency.cv/api/analytics/anomalies?severity=high" | jq '.anomalies'
    ```

---

## 5. Headline Tracking

Track changes and patterns in news headlines.

=== "Python"
    ```python
    import requests
    
    def get_headlines(hours: int = 24, changes_only: bool = False):
        """Track headline patterns and changes."""
        response = requests.get(
            "https://cryptocurrency.cv/api/analytics/headlines",
            params={"hours": hours, "changesOnly": changes_only}
        )
        return response.json()
    
    # Get headline analysis
    data = get_headlines(hours=24)
    
    print("📰 Headline Analysis")
    print("=" * 60)
    
    if 'patterns' in data:
        print("\n📊 Common Patterns:")
        for pattern in data['patterns'][:5]:
            print(f"   • {pattern.get('pattern')}: {pattern.get('count')} occurrences")
    
    if 'changedHeadlines' in data:
        print("\n🔄 Changed Headlines:")
        for change in data['changedHeadlines'][:5]:
            print(f"   Before: {change.get('before')[:50]}...")
            print(f"   After:  {change.get('after')[:50]}...")
            print()
    
    if 'topWords' in data:
        print("🔤 Top Words in Headlines:")
        for word in data['topWords'][:10]:
            print(f"   {word.get('word')}: {word.get('count')}")
    
    if 'sentimentTrend' in data:
        trend = data['sentimentTrend']
        print(f"\n📈 Sentiment Trend: {trend.get('direction')} ({trend.get('change'):+.1f}%)")
    ```

=== "JavaScript"
    ```javascript
    async function getHeadlines(hours = 24, changesOnly = false) {
        const params = new URLSearchParams({ 
            hours: hours.toString(),
            changesOnly: changesOnly.toString()
        });
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/analytics/headlines?${params}`
        );
        return response.json();
    }
    
    // Get headline analysis
    const data = await getHeadlines(24);
    
    console.log("📰 Headline Analysis");
    console.log("=".repeat(60));
    
    if (data.patterns) {
        console.log("\n📊 Common Patterns:");
        data.patterns.slice(0, 5).forEach(p => {
            console.log(`   • ${p.pattern}: ${p.count} occurrences`);
        });
    }
    
    if (data.changedHeadlines) {
        console.log("\n🔄 Changed Headlines:");
        data.changedHeadlines.slice(0, 3).forEach(c => {
            console.log(`   Before: ${c.before?.slice(0, 50)}...`);
            console.log(`   After:  ${c.after?.slice(0, 50)}...`);
        });
    }
    
    if (data.topWords) {
        console.log("\n🔤 Top Words:");
        data.topWords.slice(0, 10).forEach(w => {
            console.log(`   ${w.word}: ${w.count}`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get headline analysis
    curl "https://cryptocurrency.cv/api/analytics/headlines?hours=24" | jq
    
    # Get only changed headlines
    curl "https://cryptocurrency.cv/api/analytics/headlines?changesOnly=true" | jq
    
    # Get patterns
    curl "https://cryptocurrency.cv/api/analytics/headlines" | jq '.patterns'
    ```

---

## 6. Source Credibility

Analyze credibility scores for news sources.

=== "Python"
    ```python
    import requests
    
    def get_credibility(source: str = None, sort_by: str = "score"):
        """Get source credibility scores."""
        params = {"sortBy": sort_by}
        if source:
            params["source"] = source
        
        response = requests.get(
            "https://cryptocurrency.cv/api/analytics/credibility",
            params=params
        )
        return response.json()
    
    # Get all source credibility
    data = get_credibility(sort_by="score")
    
    print("🏆 Source Credibility Scores")
    print("=" * 60)
    
    # Top credible sources
    print("\n✅ Most Credible Sources:")
    for source in data.get('sources', [])[:10]:
        score = source.get('score', 0)
        bar = "█" * int(score / 10) + "░" * (10 - int(score / 10))
        print(f"   {source.get('name')[:20]:<20} [{bar}] {score:.1f}")
    
    # Metrics breakdown
    print("\n📊 Scoring Factors:")
    print("   • Accuracy: Historical fact-checking score")
    print("   • Timeliness: Speed of breaking news coverage")
    print("   • Bias: Political/ideological neutrality")
    print("   • Transparency: Source citation practices")
    
    # Check specific source
    if data.get('sources'):
        specific = get_credibility(source=data['sources'][0]['name'])
        if 'details' in specific:
            print(f"\n🔍 {specific['source']} Details:")
            for factor, value in specific['details'].items():
                print(f"   {factor}: {value}")
    ```

=== "JavaScript"
    ```javascript
    async function getCredibility(source = null, sortBy = 'score') {
        const params = new URLSearchParams({ sortBy });
        if (source) params.set('source', source);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/analytics/credibility?${params}`
        );
        return response.json();
    }
    
    // Get source credibility
    const data = await getCredibility(null, 'score');
    
    console.log("🏆 Source Credibility Scores");
    console.log("=".repeat(60));
    
    console.log("\n✅ Most Credible Sources:");
    data.sources?.slice(0, 10).forEach(source => {
        const score = source.score || 0;
        const filled = Math.floor(score / 10);
        const bar = "█".repeat(filled) + "░".repeat(10 - filled);
        console.log(`   ${source.name?.padEnd(20)} [${bar}] ${score.toFixed(1)}`);
    });
    
    // Check specific source
    if (data.sources?.length > 0) {
        const specific = await getCredibility(data.sources[0].name);
        if (specific.details) {
            console.log(`\n🔍 ${specific.source} Details:`);
            for (const [factor, value] of Object.entries(specific.details)) {
                console.log(`   ${factor}: ${value}`);
            }
        }
    }
    ```

=== "cURL"
    ```bash
    # Get all sources sorted by credibility
    curl "https://cryptocurrency.cv/api/analytics/credibility?sortBy=score" | jq
    
    # Get specific source credibility
    curl "https://cryptocurrency.cv/api/analytics/credibility?source=coindesk" | jq
    
    # Get top 5 sources
    curl "https://cryptocurrency.cv/api/analytics/credibility" | jq '.sources[:5]'
    ```

---

## 7. Causal Analysis

Understand cause-and-effect relationships between events and market movements.

=== "Python"
    ```python
    import requests
    
    def get_causality(event_id: str = None, type: str = None, asset: str = None):
        """Get causal analysis."""
        params = {}
        if event_id:
            params["eventId"] = event_id
        if type:
            params["type"] = type
        if asset:
            params["asset"] = asset
        
        response = requests.get(
            "https://cryptocurrency.cv/api/analytics/causality",
            params=params
        )
        return response.json()
    
    # Get causal relationships
    data = get_causality(asset="BTC")
    
    print("🔗 Causal Analysis")
    print("=" * 60)
    
    if 'relationships' in data:
        print("\n📊 Event → Market Relationships:")
        for rel in data['relationships'][:10]:
            cause = rel.get('cause', {})
            effect = rel.get('effect', {})
            confidence = rel.get('confidence', 0)
            
            print(f"\n   Cause: {cause.get('event')}")
            print(f"   Effect: {effect.get('description')}")
            print(f"   Confidence: {confidence * 100:.1f}%")
            print(f"   Lag: {rel.get('lagTime', 'N/A')}")
    
    if 'patterns' in data:
        print("\n🔄 Recurring Patterns:")
        for pattern in data['patterns'][:5]:
            print(f"   • {pattern.get('description')}")
            print(f"     Occurrences: {pattern.get('occurrences')}")
    ```

=== "JavaScript"
    ```javascript
    async function getCausality(eventId = null, type = null, asset = null) {
        const params = new URLSearchParams();
        if (eventId) params.set('eventId', eventId);
        if (type) params.set('type', type);
        if (asset) params.set('asset', asset);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/analytics/causality?${params}`
        );
        return response.json();
    }
    
    // Get causal relationships for BTC
    const data = await getCausality(null, null, 'BTC');
    
    console.log("🔗 Causal Analysis");
    console.log("=".repeat(60));
    
    if (data.relationships) {
        console.log("\n📊 Event → Market Relationships:");
        data.relationships.slice(0, 10).forEach(rel => {
            console.log(`\n   Cause: ${rel.cause?.event}`);
            console.log(`   Effect: ${rel.effect?.description}`);
            console.log(`   Confidence: ${(rel.confidence * 100).toFixed(1)}%`);
            console.log(`   Lag: ${rel.lagTime || 'N/A'}`);
        });
    }
    
    if (data.patterns) {
        console.log("\n🔄 Recurring Patterns:");
        data.patterns.slice(0, 5).forEach(p => {
            console.log(`   • ${p.description}`);
            console.log(`     Occurrences: ${p.occurrences}`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get causal analysis for BTC
    curl "https://cryptocurrency.cv/api/analytics/causality?asset=BTC" | jq
    
    # Get specific event analysis
    curl "https://cryptocurrency.cv/api/analytics/causality?eventId=evt_123" | jq
    
    # Get by event type
    curl "https://cryptocurrency.cv/api/analytics/causality?type=regulatory" | jq
    ```

---

## Complete Analytics Dashboard

Build a comprehensive analytics dashboard:

```python
#!/usr/bin/env python3
"""Complete crypto analytics dashboard."""

import requests
from datetime import datetime

class AnalyticsDashboard:
    """Crypto analytics dashboard client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: dict = None):
        """Make GET request."""
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def get_narratives(self, period="24h"):
        return self._get("/api/narratives", {"period": period})
    
    def get_regulatory(self, jurisdiction=None):
        params = {"jurisdiction": jurisdiction} if jurisdiction else {}
        return self._get("/api/regulatory", params)
    
    def get_influencers(self, limit=10):
        return self._get("/api/influencers", {"limit": limit})
    
    def get_anomalies(self, hours=24):
        return self._get("/api/analytics/anomalies", {"hours": hours})
    
    def get_credibility(self):
        return self._get("/api/analytics/credibility")
    
    def get_causality(self, asset="BTC"):
        return self._get("/api/analytics/causality", {"asset": asset})
    
    def run_dashboard(self):
        """Run complete analytics dashboard."""
        print("=" * 70)
        print("📊 CRYPTO ANALYTICS DASHBOARD")
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Narratives
        print("\n🔥 TOP NARRATIVES")
        print("-" * 70)
        try:
            narratives = self.get_narratives()
            for n in narratives.get('narratives', [])[:5]:
                strength = n.get('strength', 0) * 100
                print(f"  {n.get('theme')}: {strength:.0f}%")
        except Exception as e:
            print(f"  Error: {e}")
        
        # Anomalies
        print("\n🚨 ANOMALIES (Last 24h)")
        print("-" * 70)
        try:
            anomalies = self.get_anomalies()
            critical = [a for a in anomalies.get('anomalies', []) 
                       if a.get('severity') in ['critical', 'high']]
            print(f"  Critical/High: {len(critical)}")
            for a in critical[:3]:
                print(f"    • {a.get('type')}: {a.get('description')[:50]}...")
        except Exception as e:
            print(f"  Error: {e}")
        
        # Regulatory
        print("\n⚖️ REGULATORY UPDATES")
        print("-" * 70)
        try:
            regulatory = self.get_regulatory()
            by_jur = {}
            for item in regulatory.get('items', [])[:20]:
                jur = item.get('jurisdiction', 'Unknown')
                by_jur[jur] = by_jur.get(jur, 0) + 1
            
            for jur, count in sorted(by_jur.items(), key=lambda x: -x[1])[:5]:
                print(f"  {jur}: {count} updates")
        except Exception as e:
            print(f"  Error: {e}")
        
        # Influencers
        print("\n🌟 TOP INFLUENCERS")
        print("-" * 70)
        try:
            influencers = self.get_influencers(5)
            for inf in influencers.get('influencers', []):
                followers = inf.get('followers', 0)
                print(f"  @{inf.get('username')}: {followers:,} followers")
        except Exception as e:
            print(f"  Error: {e}")
        
        # Credibility
        print("\n🏆 MOST CREDIBLE SOURCES")
        print("-" * 70)
        try:
            credibility = self.get_credibility()
            for source in credibility.get('sources', [])[:5]:
                print(f"  {source.get('name')}: {source.get('score', 0):.1f}/100")
        except Exception as e:
            print(f"  Error: {e}")
        
        print("\n" + "=" * 70)
        print("✅ Dashboard complete!")

def main():
    dashboard = AnalyticsDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [Market Data Tutorial](market-data.md) - Get real-time market data
- [Social Intelligence](social-intelligence.md) - Analyze social media
- [Premium Features](premium-features.md) - Access advanced features
