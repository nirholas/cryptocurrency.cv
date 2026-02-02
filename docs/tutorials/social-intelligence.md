# Social Intelligence Tutorial

This tutorial covers all social media intelligence endpoints for tracking sentiment, influencers, and community activity.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/social` | Aggregated social sentiment |
| `/api/social/x/sentiment` | Twitter/X sentiment |
| `/api/social/monitor` | Community monitoring |
| `/api/social/influencer-score` | Influencer scoring |

---

## 1. Aggregated Social Sentiment

Get combined sentiment analysis from multiple social platforms.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_social_sentiment(asset: str = None, platforms: str = None):
        """Get aggregated social sentiment."""
        params = {}
        if asset:
            params["asset"] = asset
        if platforms:
            params["platforms"] = platforms
        
        response = requests.get(
            "https://news-crypto.vercel.app/api/social",
            params=params
        )
        return response.json()
    
    # Get overall social sentiment
    sentiment = get_social_sentiment()
    
    print("📱 Social Media Sentiment")
    print("=" * 60)
    print(f"Analyzed: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Overall sentiment
    overall = sentiment.get('overall', {})
    score = overall.get('score', 0)
    
    # Visual meter
    bar_pos = int((score + 1) * 10)  # Convert -1 to 1 → 0 to 20
    bar = "░" * bar_pos + "█" + "░" * (20 - bar_pos)
    
    print(f"\n📊 Overall Sentiment: {overall.get('label', 'Unknown')}")
    print(f"   Bearish [{bar}] Bullish")
    print(f"   Score: {score:.2f} (range: -1 to +1)")
    
    # Platform breakdown
    if 'platforms' in sentiment:
        print("\n📈 By Platform:")
        for platform, data in sentiment['platforms'].items():
            p_score = data.get('score', 0)
            p_emoji = "🟢" if p_score > 0.2 else "🔴" if p_score < -0.2 else "⚪"
            volume = data.get('volume', 0)
            print(f"   {p_emoji} {platform:<12}: {p_score:+.2f} ({volume:,} posts)")
    
    # Asset-specific sentiment
    print("\n" + "=" * 60)
    print("💰 Asset-Specific Sentiment:")
    
    for asset in ["BTC", "ETH", "SOL"]:
        try:
            asset_data = get_social_sentiment(asset=asset)
            a_score = asset_data.get('overall', {}).get('score', 0)
            a_emoji = "🟢" if a_score > 0.2 else "🔴" if a_score < -0.2 else "⚪"
            print(f"   {a_emoji} {asset}: {a_score:+.2f}")
        except Exception:
            pass
    ```

=== "JavaScript"
    ```javascript
    async function getSocialSentiment(asset = null, platforms = null) {
        const params = new URLSearchParams();
        if (asset) params.set('asset', asset);
        if (platforms) params.set('platforms', platforms);
        
        const response = await fetch(
            `https://news-crypto.vercel.app/api/social?${params}`
        );
        return response.json();
    }
    
    // Get overall sentiment
    const sentiment = await getSocialSentiment();
    
    console.log("📱 Social Media Sentiment");
    console.log("=".repeat(60));
    
    // Overall sentiment
    const overall = sentiment.overall || {};
    const score = overall.score || 0;
    
    // Visual meter
    const barPos = Math.floor((score + 1) * 10);
    const bar = "░".repeat(barPos) + "█" + "░".repeat(20 - barPos);
    
    console.log(`\n📊 Overall Sentiment: ${overall.label || 'Unknown'}`);
    console.log(`   Bearish [${bar}] Bullish`);
    console.log(`   Score: ${score.toFixed(2)} (range: -1 to +1)`);
    
    // Platform breakdown
    if (sentiment.platforms) {
        console.log("\n📈 By Platform:");
        for (const [platform, data] of Object.entries(sentiment.platforms)) {
            const pScore = data.score || 0;
            const emoji = pScore > 0.2 ? '🟢' : pScore < -0.2 ? '🔴' : '⚪';
            console.log(`   ${emoji} ${platform.padEnd(12)}: ${pScore >= 0 ? '+' : ''}${pScore.toFixed(2)}`);
        }
    }
    
    // Asset-specific
    console.log("\n💰 Asset-Specific:");
    for (const asset of ['BTC', 'ETH', 'SOL']) {
        try {
            const assetData = await getSocialSentiment(asset);
            const aScore = assetData.overall?.score || 0;
            const emoji = aScore > 0.2 ? '🟢' : aScore < -0.2 ? '🔴' : '⚪';
            console.log(`   ${emoji} ${asset}: ${aScore >= 0 ? '+' : ''}${aScore.toFixed(2)}`);
        } catch (e) {}
    }
    ```

=== "cURL"
    ```bash
    # Get overall social sentiment
    curl "https://news-crypto.vercel.app/api/social" | jq
    
    # Get sentiment for specific asset
    curl "https://news-crypto.vercel.app/api/social?asset=BTC" | jq
    
    # Get sentiment from specific platforms
    curl "https://news-crypto.vercel.app/api/social?platforms=twitter,reddit" | jq
    
    # Extract overall score
    curl "https://news-crypto.vercel.app/api/social" | jq '.overall'
    ```

---

## 2. Twitter/X Sentiment

Get detailed sentiment analysis from Twitter/X.

=== "Python"
    ```python
    import requests
    
    def get_twitter_sentiment(query: str = None, accounts: str = None):
        """Get Twitter/X sentiment analysis."""
        params = {}
        if query:
            params["query"] = query
        if accounts:
            params["accounts"] = accounts
        
        response = requests.get(
            "https://news-crypto.vercel.app/api/social/x/sentiment",
            params=params
        )
        return response.json()
    
    # Get overall Twitter sentiment
    twitter = get_twitter_sentiment()
    
    print("🐦 Twitter/X Sentiment Analysis")
    print("=" * 60)
    
    # Overall metrics
    overall = twitter.get('overall', {})
    print(f"\n📊 Overall Metrics:")
    print(f"   Sentiment Score: {overall.get('score', 0):+.2f}")
    print(f"   Confidence: {overall.get('confidence', 0) * 100:.1f}%")
    print(f"   Posts Analyzed: {overall.get('postCount', 0):,}")
    
    # Sentiment breakdown
    if 'breakdown' in twitter:
        breakdown = twitter['breakdown']
        print(f"\n📈 Sentiment Distribution:")
        
        bullish = breakdown.get('bullish', 0)
        neutral = breakdown.get('neutral', 0)
        bearish = breakdown.get('bearish', 0)
        total = bullish + neutral + bearish or 1
        
        bull_bar = "🟢" * int(bullish / total * 20)
        neut_bar = "⚪" * int(neutral / total * 20)
        bear_bar = "🔴" * int(bearish / total * 20)
        
        print(f"   Bullish: {bull_bar} {bullish / total * 100:.1f}%")
        print(f"   Neutral: {neut_bar} {neutral / total * 100:.1f}%")
        print(f"   Bearish: {bear_bar} {bearish / total * 100:.1f}%")
    
    # Top mentions
    if 'topMentions' in twitter:
        print(f"\n🔥 Top Mentioned:")
        for mention in twitter['topMentions'][:10]:
            print(f"   #{mention.get('tag')}: {mention.get('count')} mentions")
    
    # Trending topics
    if 'trending' in twitter:
        print(f"\n📈 Trending Topics:")
        for topic in twitter['trending'][:5]:
            print(f"   • {topic.get('topic')}: {topic.get('volume')} tweets")
    
    # Query specific hashtag
    print("\n" + "=" * 60)
    print("🔍 Hashtag Analysis:")
    
    for hashtag in ["#Bitcoin", "#Ethereum", "#DeFi"]:
        result = get_twitter_sentiment(query=hashtag)
        score = result.get('overall', {}).get('score', 0)
        emoji = "🟢" if score > 0.2 else "🔴" if score < -0.2 else "⚪"
        print(f"   {emoji} {hashtag}: {score:+.2f}")
    ```

=== "JavaScript"
    ```javascript
    async function getTwitterSentiment(query = null, accounts = null) {
        const params = new URLSearchParams();
        if (query) params.set('query', query);
        if (accounts) params.set('accounts', accounts);
        
        const response = await fetch(
            `https://news-crypto.vercel.app/api/social/x/sentiment?${params}`
        );
        return response.json();
    }
    
    // Get Twitter sentiment
    const twitter = await getTwitterSentiment();
    
    console.log("🐦 Twitter/X Sentiment Analysis");
    console.log("=".repeat(60));
    
    // Overall metrics
    const overall = twitter.overall || {};
    console.log("\n📊 Overall Metrics:");
    console.log(`   Sentiment Score: ${(overall.score || 0).toFixed(2)}`);
    console.log(`   Confidence: ${((overall.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`   Posts Analyzed: ${(overall.postCount || 0).toLocaleString()}`);
    
    // Breakdown
    if (twitter.breakdown) {
        const { bullish = 0, neutral = 0, bearish = 0 } = twitter.breakdown;
        const total = bullish + neutral + bearish || 1;
        
        console.log("\n📈 Sentiment Distribution:");
        console.log(`   Bullish: ${"🟢".repeat(Math.floor(bullish/total*10))} ${(bullish/total*100).toFixed(1)}%`);
        console.log(`   Neutral: ${"⚪".repeat(Math.floor(neutral/total*10))} ${(neutral/total*100).toFixed(1)}%`);
        console.log(`   Bearish: ${"🔴".repeat(Math.floor(bearish/total*10))} ${(bearish/total*100).toFixed(1)}%`);
    }
    
    // Top mentions
    if (twitter.topMentions) {
        console.log("\n🔥 Top Mentioned:");
        twitter.topMentions.slice(0, 10).forEach(m => {
            console.log(`   #${m.tag}: ${m.count} mentions`);
        });
    }
    
    // Hashtag analysis
    console.log("\n🔍 Hashtag Analysis:");
    for (const hashtag of ['#Bitcoin', '#Ethereum', '#DeFi']) {
        const result = await getTwitterSentiment(hashtag);
        const score = result.overall?.score || 0;
        const emoji = score > 0.2 ? '🟢' : score < -0.2 ? '🔴' : '⚪';
        console.log(`   ${emoji} ${hashtag}: ${score >= 0 ? '+' : ''}${score.toFixed(2)}`);
    }
    ```

=== "cURL"
    ```bash
    # Get overall Twitter sentiment
    curl "https://news-crypto.vercel.app/api/social/x/sentiment" | jq
    
    # Search specific query
    curl "https://news-crypto.vercel.app/api/social/x/sentiment?query=%23Bitcoin" | jq
    
    # Track specific accounts
    curl "https://news-crypto.vercel.app/api/social/x/sentiment?accounts=VitalikButerin,saboroivmilk" | jq
    
    # Get sentiment breakdown
    curl "https://news-crypto.vercel.app/api/social/x/sentiment" | jq '.breakdown'
    ```

---

## 3. Community Monitoring

Monitor crypto communities across platforms.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_community_monitor(platform: str = None, hours: int = 24):
        """Monitor community activity."""
        params = {"hours": hours}
        if platform:
            params["platform"] = platform
        
        response = requests.get(
            "https://news-crypto.vercel.app/api/social/monitor",
            params=params
        )
        return response.json()
    
    # Get community monitoring data
    monitor = get_community_monitor(hours=24)
    
    print("👥 Community Monitoring Dashboard")
    print("=" * 60)
    print(f"Period: Last 24 hours")
    print(f"Analyzed: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    
    # Activity summary
    if 'summary' in monitor:
        summary = monitor['summary']
        print(f"\n📊 Activity Summary:")
        print(f"   Total Posts: {summary.get('totalPosts', 0):,}")
        print(f"   Active Users: {summary.get('activeUsers', 0):,}")
        print(f"   Engagement Rate: {summary.get('engagementRate', 0) * 100:.2f}%")
    
    # Platform breakdown
    if 'platforms' in monitor:
        print(f"\n📱 By Platform:")
        for platform, data in monitor['platforms'].items():
            posts = data.get('posts', 0)
            users = data.get('users', 0)
            sentiment = data.get('sentiment', 0)
            emoji = "🟢" if sentiment > 0.2 else "🔴" if sentiment < -0.2 else "⚪"
            print(f"   {emoji} {platform:<12}: {posts:>6} posts, {users:>5} users")
    
    # Trending topics
    if 'trending' in monitor:
        print(f"\n🔥 Trending Topics:")
        for topic in monitor['trending'][:10]:
            growth = topic.get('growth', 0)
            arrow = "📈" if growth > 0 else "📉" if growth < 0 else "➡️"
            print(f"   {arrow} {topic.get('topic')}: {topic.get('mentions'):,} mentions ({growth:+.1f}%)")
    
    # Alerts
    if 'alerts' in monitor:
        print(f"\n🚨 Community Alerts:")
        for alert in monitor['alerts'][:5]:
            print(f"   ⚠️ {alert.get('type')}: {alert.get('description')}")
    
    # Top communities
    if 'topCommunities' in monitor:
        print(f"\n🏆 Most Active Communities:")
        for comm in monitor['topCommunities'][:5]:
            print(f"   • {comm.get('name')}: {comm.get('activity'):,} interactions")
    ```

=== "JavaScript"
    ```javascript
    async function getCommunityMonitor(platform = null, hours = 24) {
        const params = new URLSearchParams({ hours: hours.toString() });
        if (platform) params.set('platform', platform);
        
        const response = await fetch(
            `https://news-crypto.vercel.app/api/social/monitor?${params}`
        );
        return response.json();
    }
    
    // Get community monitoring
    const monitor = await getCommunityMonitor(null, 24);
    
    console.log("👥 Community Monitoring Dashboard");
    console.log("=".repeat(60));
    console.log("Period: Last 24 hours");
    
    // Summary
    if (monitor.summary) {
        console.log("\n📊 Activity Summary:");
        console.log(`   Total Posts: ${monitor.summary.totalPosts?.toLocaleString()}`);
        console.log(`   Active Users: ${monitor.summary.activeUsers?.toLocaleString()}`);
        console.log(`   Engagement: ${((monitor.summary.engagementRate || 0) * 100).toFixed(2)}%`);
    }
    
    // Platforms
    if (monitor.platforms) {
        console.log("\n📱 By Platform:");
        for (const [platform, data] of Object.entries(monitor.platforms)) {
            const sentiment = data.sentiment || 0;
            const emoji = sentiment > 0.2 ? '🟢' : sentiment < -0.2 ? '🔴' : '⚪';
            console.log(`   ${emoji} ${platform.padEnd(12)}: ${data.posts} posts, ${data.users} users`);
        }
    }
    
    // Trending
    if (monitor.trending) {
        console.log("\n🔥 Trending Topics:");
        monitor.trending.slice(0, 10).forEach(topic => {
            const growth = topic.growth || 0;
            const arrow = growth > 0 ? '📈' : growth < 0 ? '📉' : '➡️';
            console.log(`   ${arrow} ${topic.topic}: ${topic.mentions?.toLocaleString()} mentions`);
        });
    }
    
    // Alerts
    if (monitor.alerts) {
        console.log("\n🚨 Community Alerts:");
        monitor.alerts.slice(0, 5).forEach(alert => {
            console.log(`   ⚠️ ${alert.type}: ${alert.description}`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get community monitoring data
    curl "https://news-crypto.vercel.app/api/social/monitor?hours=24" | jq
    
    # Filter by platform
    curl "https://news-crypto.vercel.app/api/social/monitor?platform=reddit" | jq
    
    # Get trending topics
    curl "https://news-crypto.vercel.app/api/social/monitor" | jq '.trending[:10]'
    
    # Get alerts only
    curl "https://news-crypto.vercel.app/api/social/monitor" | jq '.alerts'
    ```

---

## 4. Influencer Scoring

Get detailed influencer scores and analytics.

=== "Python"
    ```python
    import requests
    
    def get_influencer_score(username: str = None, platform: str = None):
        """Get influencer scores."""
        params = {}
        if username:
            params["username"] = username
        if platform:
            params["platform"] = platform
        
        response = requests.get(
            "https://news-crypto.vercel.app/api/social/influencer-score",
            params=params
        )
        return response.json()
    
    # Get influencer rankings
    influencers = get_influencer_score()
    
    print("🌟 Crypto Influencer Scores")
    print("=" * 70)
    
    if 'influencers' in influencers:
        print(f"\n{'#':<4} {'Username':<20} {'Platform':<12} {'Score':<8} {'Followers':<12}")
        print("-" * 70)
        
        for i, inf in enumerate(influencers['influencers'][:15], 1):
            username = inf.get('username', 'Unknown')[:18]
            platform = inf.get('platform', 'Unknown')[:10]
            score = inf.get('score', 0)
            followers = inf.get('followers', 0)
            
            # Score visualization
            score_bar = "★" * int(score / 20) + "☆" * (5 - int(score / 20))
            followers_str = f"{followers/1e6:.1f}M" if followers >= 1e6 else f"{followers/1e3:.0f}K"
            
            print(f"{i:<4} @{username:<19} {platform:<12} {score_bar} {score:<6.0f} {followers_str:<12}")
    
    # Score breakdown for specific influencer
    print("\n" + "=" * 70)
    print("🔍 Detailed Influencer Analysis:")
    
    # Example analysis
    if influencers.get('influencers'):
        top_inf = influencers['influencers'][0]
        details = get_influencer_score(username=top_inf.get('username'))
        
        if 'metrics' in details:
            metrics = details['metrics']
            print(f"\n   @{top_inf.get('username')} Breakdown:")
            print(f"   ├─ Reach Score: {metrics.get('reach', 0):.0f}/100")
            print(f"   ├─ Engagement Score: {metrics.get('engagement', 0):.0f}/100")
            print(f"   ├─ Credibility Score: {metrics.get('credibility', 0):.0f}/100")
            print(f"   ├─ Consistency Score: {metrics.get('consistency', 0):.0f}/100")
            print(f"   └─ Overall Score: {metrics.get('overall', 0):.0f}/100")
    
    # Topics they cover
    if 'topics' in influencers:
        print(f"\n📌 Top Topics Covered:")
        for topic in influencers.get('topics', [])[:5]:
            print(f"   • {topic.get('name')}: {topic.get('count')} posts")
    ```

=== "JavaScript"
    ```javascript
    async function getInfluencerScore(username = null, platform = null) {
        const params = new URLSearchParams();
        if (username) params.set('username', username);
        if (platform) params.set('platform', platform);
        
        const response = await fetch(
            `https://news-crypto.vercel.app/api/social/influencer-score?${params}`
        );
        return response.json();
    }
    
    // Get influencer rankings
    const influencers = await getInfluencerScore();
    
    console.log("🌟 Crypto Influencer Scores");
    console.log("=".repeat(70));
    
    if (influencers.influencers) {
        console.log(`\n${'#'.padEnd(4)} ${'Username'.padEnd(20)} ${'Platform'.padEnd(12)} ${'Score'.padEnd(8)} Followers`);
        console.log("-".repeat(70));
        
        influencers.influencers.slice(0, 15).forEach((inf, i) => {
            const score = inf.score || 0;
            const followers = inf.followers || 0;
            const scoreBar = "★".repeat(Math.floor(score / 20)) + "☆".repeat(5 - Math.floor(score / 20));
            const followersStr = followers >= 1e6 ? `${(followers/1e6).toFixed(1)}M` : `${(followers/1e3).toFixed(0)}K`;
            
            console.log(`${(i+1).toString().padEnd(4)} @${inf.username?.slice(0,18).padEnd(19)} ${inf.platform?.slice(0,10).padEnd(12)} ${scoreBar} ${score.toFixed(0).padEnd(6)} ${followersStr}`);
        });
    }
    
    // Detailed analysis
    console.log("\n" + "=".repeat(70));
    console.log("🔍 Detailed Analysis:");
    
    if (influencers.influencers?.length > 0) {
        const topInf = influencers.influencers[0];
        const details = await getInfluencerScore(topInf.username);
        
        if (details.metrics) {
            console.log(`\n   @${topInf.username} Breakdown:`);
            console.log(`   ├─ Reach: ${details.metrics.reach}/100`);
            console.log(`   ├─ Engagement: ${details.metrics.engagement}/100`);
            console.log(`   ├─ Credibility: ${details.metrics.credibility}/100`);
            console.log(`   └─ Overall: ${details.metrics.overall}/100`);
        }
    }
    ```

=== "cURL"
    ```bash
    # Get influencer rankings
    curl "https://news-crypto.vercel.app/api/social/influencer-score" | jq
    
    # Get specific influencer
    curl "https://news-crypto.vercel.app/api/social/influencer-score?username=VitalikButerin" | jq
    
    # Filter by platform
    curl "https://news-crypto.vercel.app/api/social/influencer-score?platform=twitter" | jq
    
    # Get top 10 by score
    curl "https://news-crypto.vercel.app/api/social/influencer-score" | jq '.influencers[:10]'
    ```

---

## Complete Social Intelligence Application

Build a comprehensive social intelligence dashboard:

```python
#!/usr/bin/env python3
"""Complete social intelligence dashboard."""

import requests
from datetime import datetime
from typing import Dict, Any

class SocialIntelligence:
    """Social intelligence dashboard client."""
    
    BASE_URL = "https://news-crypto.vercel.app"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def get_sentiment(self, asset: str = None) -> Dict[str, Any]:
        params = {"asset": asset} if asset else {}
        return self._get("/api/social", params)
    
    def get_twitter(self, query: str = None) -> Dict[str, Any]:
        params = {"query": query} if query else {}
        return self._get("/api/social/x/sentiment", params)
    
    def get_monitor(self, hours: int = 24) -> Dict[str, Any]:
        return self._get("/api/social/monitor", {"hours": hours})
    
    def get_influencers(self) -> Dict[str, Any]:
        return self._get("/api/social/influencer-score")
    
    def run_dashboard(self):
        """Run complete social intelligence dashboard."""
        print("=" * 80)
        print("📱 SOCIAL INTELLIGENCE DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Overall Sentiment
        print("\n📊 OVERALL SOCIAL SENTIMENT")
        print("-" * 80)
        try:
            sentiment = self.get_sentiment()
            overall = sentiment.get('overall', {})
            score = overall.get('score', 0)
            
            # Visual meter
            bar_pos = int((score + 1) * 10)
            bar = "░" * bar_pos + "█" + "░" * (20 - bar_pos)
            
            label = overall.get('label', 'Unknown')
            emoji = "🟢" if score > 0.2 else "🔴" if score < -0.2 else "⚪"
            
            print(f"   {emoji} Sentiment: {label} ({score:+.2f})")
            print(f"   Bearish [{bar}] Bullish")
            
            if 'platforms' in sentiment:
                print("\n   By Platform:")
                for platform, data in sentiment['platforms'].items():
                    p_score = data.get('score', 0)
                    p_emoji = "🟢" if p_score > 0.2 else "🔴" if p_score < -0.2 else "⚪"
                    print(f"      {p_emoji} {platform}: {p_score:+.2f}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Asset Sentiment
        print("\n💰 ASSET SENTIMENT")
        print("-" * 80)
        for asset in ["BTC", "ETH", "SOL", "XRP"]:
            try:
                data = self.get_sentiment(asset)
                score = data.get('overall', {}).get('score', 0)
                emoji = "🟢" if score > 0.2 else "🔴" if score < -0.2 else "⚪"
                print(f"   {emoji} {asset}: {score:+.2f}")
            except Exception:
                print(f"   ⚪ {asset}: N/A")
        
        # Twitter Trends
        print("\n🐦 TWITTER TRENDS")
        print("-" * 80)
        try:
            twitter = self.get_twitter()
            if 'trending' in twitter:
                for topic in twitter['trending'][:5]:
                    print(f"   📈 {topic.get('topic')}: {topic.get('volume', 0):,} tweets")
            if 'topMentions' in twitter:
                print("\n   Top Hashtags:")
                for mention in twitter['topMentions'][:5]:
                    print(f"      #{mention.get('tag')}: {mention.get('count', 0):,}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Community Activity
        print("\n👥 COMMUNITY ACTIVITY (24h)")
        print("-" * 80)
        try:
            monitor = self.get_monitor(24)
            if 'summary' in monitor:
                summary = monitor['summary']
                print(f"   Total Posts: {summary.get('totalPosts', 0):,}")
                print(f"   Active Users: {summary.get('activeUsers', 0):,}")
                print(f"   Engagement: {summary.get('engagementRate', 0) * 100:.2f}%")
            
            if 'alerts' in monitor and monitor['alerts']:
                print("\n   🚨 Alerts:")
                for alert in monitor['alerts'][:3]:
                    print(f"      ⚠️ {alert.get('description', 'Unknown')[:50]}...")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Top Influencers
        print("\n🌟 TOP INFLUENCERS")
        print("-" * 80)
        try:
            influencers = self.get_influencers()
            for inf in influencers.get('influencers', [])[:5]:
                score = inf.get('score', 0)
                followers = inf.get('followers', 0)
                f_str = f"{followers/1e6:.1f}M" if followers >= 1e6 else f"{followers/1e3:.0f}K"
                stars = "★" * int(score / 20) + "☆" * (5 - int(score / 20))
                print(f"   @{inf.get('username', 'Unknown')[:15]:<17} {stars} {f_str}")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    dashboard = SocialIntelligence()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [AI Features Tutorial](ai-features.md) - Learn AI-powered analysis
- [Analytics Tutorial](analytics-research.md) - Deep research and analytics
- [Alerts Tutorial](user-alerts.md) - Set up social alerts
