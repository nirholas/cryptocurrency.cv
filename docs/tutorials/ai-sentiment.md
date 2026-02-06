# 🤖 AI Sentiment Analysis Tutorial

Use AI-powered sentiment analysis to understand market mood and analyze articles.

---

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `GET /api/sentiment` | Market sentiment overview |
| `POST /api/ai` | Analyze custom text sentiment |
| `GET /api/fear-greed` | Fear & Greed Index |
| `GET /api/social` | Social media sentiment |

---

## Market Sentiment Overview

Get an AI-analyzed summary of current market sentiment across all news.

=== "Python"

    ```python
    import requests
    from typing import Optional
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def get_sentiment(asset: Optional[str] = None, limit: int = 20) -> dict:
        """
        Get AI-powered sentiment analysis.
        
        Args:
            asset: Filter by asset (BTC, ETH, SOL, etc.)
            limit: Number of articles to analyze
        
        Returns:
            Sentiment analysis with scores and breakdown
        """
        params = {"limit": limit}
        if asset:
            params["asset"] = asset
        
        response = requests.get(f"{BASE_URL}/api/sentiment", params=params)
        response.raise_for_status()
        return response.json()
    
    
    # Get overall market sentiment
    sentiment = get_sentiment(limit=50)
    
    print("📊 MARKET SENTIMENT ANALYSIS")
    print("=" * 50)
    
    market = sentiment.get("market", {})
    print(f"\n🎯 Overall Sentiment: {market.get('overall', 'N/A')}")
    print(f"   Score: {market.get('score', 0):.2f} (-1 to +1)")
    print(f"   Confidence: {market.get('confidence', 0) * 100:.1f}%")
    
    # Breakdown
    breakdown = market.get("breakdown", {})
    print(f"\n📈 Breakdown:")
    print(f"   Bullish:  {breakdown.get('bullish', 0):.1%}")
    print(f"   Neutral:  {breakdown.get('neutral', 0):.1%}")
    print(f"   Bearish:  {breakdown.get('bearish', 0):.1%}")
    
    # Per-article sentiment
    print(f"\n📰 Article Sentiments:")
    for article in sentiment.get("articles", [])[:5]:
        title = article.get("title", "")[:50]
        sent = article.get("sentiment", {})
        label = sent.get("label", "N/A")
        score = sent.get("score", 0)
        emoji = "🟢" if label == "bullish" else "🔴" if label == "bearish" else "⚪"
        print(f"   {emoji} {title}... ({label}: {score:.2f})")
    ```

=== "JavaScript"

    ```javascript
    const BASE_URL = "https://cryptocurrency.cv";
    
    /**
     * Get AI-powered sentiment analysis.
     */
    async function getSentiment(asset, limit = 20) {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (asset) params.set("asset", asset);
        
        const response = await fetch(`${BASE_URL}/api/sentiment?${params}`);
        return response.json();
    }
    
    // Example
    const sentiment = await getSentiment(null, 50);
    
    console.log("📊 MARKET SENTIMENT ANALYSIS");
    console.log("=".repeat(50));
    
    const { market } = sentiment;
    console.log(`\n🎯 Overall: ${market?.overall}`);
    console.log(`   Score: ${market?.score?.toFixed(2)}`);
    console.log(`   Confidence: ${(market?.confidence * 100)?.toFixed(1)}%`);
    
    console.log("\n📈 Breakdown:");
    const { breakdown } = market || {};
    console.log(`   Bullish: ${(breakdown?.bullish * 100)?.toFixed(1)}%`);
    console.log(`   Neutral: ${(breakdown?.neutral * 100)?.toFixed(1)}%`);
    console.log(`   Bearish: ${(breakdown?.bearish * 100)?.toFixed(1)}%`);
    ```

=== "cURL"

    ```bash
    # Overall market sentiment
    curl "https://cryptocurrency.cv/api/sentiment?limit=50"
    
    # Bitcoin-specific sentiment
    curl "https://cryptocurrency.cv/api/sentiment?asset=BTC&limit=30"
    
    # Pretty print
    curl -s "https://cryptocurrency.cv/api/sentiment" | jq '.market'
    ```

---

## Asset-Specific Sentiment

Analyze sentiment for a specific cryptocurrency.

=== "Python"

    ```python
    def get_asset_sentiment(asset: str, limit: int = 30) -> dict:
        """Get sentiment for a specific asset."""
        return get_sentiment(asset=asset.upper(), limit=limit)
    
    
    # Compare sentiment across assets
    assets = ["BTC", "ETH", "SOL", "XRP"]
    
    print("📊 SENTIMENT COMPARISON")
    print("-" * 60)
    print(f"{'Asset':<8} {'Sentiment':<12} {'Score':>8} {'Articles':>10}")
    print("-" * 60)
    
    for asset in assets:
        result = get_asset_sentiment(asset, limit=20)
        market = result.get("market", {})
        
        label = market.get("overall", "N/A")
        score = market.get("score", 0)
        articles = len(result.get("articles", []))
        
        emoji = "🟢" if "bull" in label.lower() else "🔴" if "bear" in label.lower() else "⚪"
        print(f"{emoji} {asset:<6} {label:<12} {score:>+8.3f} {articles:>10}")
    ```

=== "JavaScript"

    ```javascript
    async function getAssetSentiment(asset, limit = 30) {
        return getSentiment(asset.toUpperCase(), limit);
    }
    
    // Compare assets
    const assets = ["BTC", "ETH", "SOL", "XRP"];
    
    console.log("📊 SENTIMENT COMPARISON");
    console.log("-".repeat(60));
    
    for (const asset of assets) {
        const result = await getAssetSentiment(asset, 20);
        const { market } = result;
        
        const emoji = market?.overall?.includes("bull") ? "🟢" : 
                      market?.overall?.includes("bear") ? "🔴" : "⚪";
        
        console.log(`${emoji} ${asset}: ${market?.overall} (${market?.score?.toFixed(3)})`);
    }
    ```

---

## Analyze Custom Text

Analyze the sentiment of any text using the AI endpoint.

=== "Python"

    ```python
    def analyze_text_sentiment(title: str, content: str = None) -> dict:
        """
        Analyze sentiment of custom text.
        
        Args:
            title: Text title or headline
            content: Optional longer content
        
        Returns:
            Sentiment analysis result
        """
        payload = {
            "action": "sentiment",
            "title": title
        }
        
        if content:
            payload["content"] = content
        
        response = requests.post(
            f"{BASE_URL}/api/ai",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json()
    
    
    # Analyze headlines
    headlines = [
        "Bitcoin Surges to New All-Time High as Institutions Load Up",
        "Major Exchange Hacked, $500M in User Funds Stolen",
        "SEC Delays Decision on Ethereum ETF Until Q2",
        "Solana Network Experiences 5-Hour Outage",
        "Coinbase Reports Record Q4 Revenue"
    ]
    
    print("📰 HEADLINE SENTIMENT ANALYSIS")
    print("=" * 70)
    
    for headline in headlines:
        result = analyze_text_sentiment(headline)
        
        if result.get("success"):
            sent = result.get("result", {})
            label = sent.get("label", sent.get("sentiment", "N/A"))
            score = sent.get("score", sent.get("confidence", 0))
            
            emoji = "🟢" if "bull" in str(label).lower() or "positive" in str(label).lower() else \
                    "🔴" if "bear" in str(label).lower() or "negative" in str(label).lower() else "⚪"
            
            print(f"\n{emoji} {headline[:60]}...")
            print(f"   Sentiment: {label} (Score: {score:.2f})")
        else:
            print(f"\n⚠️ {headline[:60]}... - Analysis failed")
    ```

=== "JavaScript"

    ```javascript
    async function analyzeTextSentiment(title, content = null) {
        const payload = {
            action: "sentiment",
            title
        };
        
        if (content) payload.content = content;
        
        const response = await fetch(`${BASE_URL}/api/ai`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        return response.json();
    }
    
    // Example
    const headlines = [
        "Bitcoin Surges to New All-Time High",
        "Major Exchange Hacked, Funds Stolen",
        "SEC Delays Ethereum ETF Decision"
    ];
    
    console.log("📰 HEADLINE SENTIMENT ANALYSIS");
    
    for (const headline of headlines) {
        const result = await analyzeTextSentiment(headline);
        
        if (result.success) {
            const { label, score } = result.result;
            const emoji = label?.includes("bull") ? "🟢" : 
                          label?.includes("bear") ? "🔴" : "⚪";
            console.log(`${emoji} ${headline.slice(0, 50)}... (${label})`);
        }
    }
    ```

=== "cURL"

    ```bash
    # Analyze a headline
    curl -X POST "https://cryptocurrency.cv/api/ai" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "sentiment",
        "title": "Bitcoin Surges to New All-Time High"
      }'
    
    # Analyze with content
    curl -X POST "https://cryptocurrency.cv/api/ai" \
      -H "Content-Type: application/json" \
      -d '{
        "action": "sentiment",
        "title": "Market Update",
        "content": "Bitcoin and Ethereum both posted significant gains today..."
      }'
    ```

---

## Fear & Greed Index

Get the crypto market Fear & Greed Index with historical data.

=== "Python"

    ```python
    def get_fear_greed(days: int = 7) -> dict:
        """
        Get Fear & Greed Index.
        
        Args:
            days: Days of historical data (1-365)
        
        Returns:
            Current and historical Fear & Greed values
        """
        response = requests.get(
            f"{BASE_URL}/api/fear-greed",
            params={"days": days}
        )
        return response.json()
    
    
    # Get Fear & Greed Index
    fg = get_fear_greed(days=30)
    
    print("😨 FEAR & GREED INDEX")
    print("=" * 50)
    
    current = fg.get("value", 0)
    classification = fg.get("classification", "Unknown")
    
    # Emoji based on value
    if current < 25:
        emoji = "😱"
        color = "Extreme Fear"
    elif current < 45:
        emoji = "😰"
        color = "Fear"
    elif current < 55:
        emoji = "😐"
        color = "Neutral"
    elif current < 75:
        emoji = "😀"
        color = "Greed"
    else:
        emoji = "🤑"
        color = "Extreme Greed"
    
    print(f"\n{emoji} Current Value: {current}")
    print(f"   Classification: {classification}")
    
    # Visual bar
    bar_length = 50
    filled = int(current / 100 * bar_length)
    bar = "█" * filled + "░" * (bar_length - filled)
    print(f"\n   [Fear] {bar} [Greed]")
    print(f"          {'▲'.center(bar_length)}")
    
    # Historical trend
    print(f"\n📈 30-Day History:")
    history = fg.get("history", [])
    if history:
        values = [h.get("value", 0) for h in history[-7:]]
        avg = sum(values) / len(values) if values else 0
        print(f"   7-day average: {avg:.1f}")
        print(f"   Range: {min(values)} - {max(values)}")
    
    # Components
    components = fg.get("components", {})
    if components:
        print(f"\n📊 Components:")
        for name, value in components.items():
            print(f"   • {name}: {value}")
    ```

=== "JavaScript"

    ```javascript
    async function getFearGreed(days = 7) {
        const response = await fetch(`${BASE_URL}/api/fear-greed?days=${days}`);
        return response.json();
    }
    
    const fg = await getFearGreed(30);
    
    console.log("😨 FEAR & GREED INDEX");
    console.log("=".repeat(50));
    
    const current = fg.value;
    const emoji = current < 25 ? "😱" : current < 45 ? "😰" : 
                  current < 55 ? "😐" : current < 75 ? "😀" : "🤑";
    
    console.log(`\n${emoji} Current Value: ${current}`);
    console.log(`   Classification: ${fg.classification}`);
    
    // Visual bar
    const filled = Math.round(current / 100 * 50);
    const bar = "█".repeat(filled) + "░".repeat(50 - filled);
    console.log(`\n   [Fear] ${bar} [Greed]`);
    ```

=== "cURL"

    ```bash
    # Current Fear & Greed
    curl "https://cryptocurrency.cv/api/fear-greed"
    
    # With 30-day history
    curl "https://cryptocurrency.cv/api/fear-greed?days=30"
    
    # Just the value and classification
    curl -s "https://cryptocurrency.cv/api/fear-greed" | \
        jq '{value, classification}'
    ```

---

## Social Media Sentiment

Get sentiment aggregated from social media platforms.

=== "Python"

    ```python
    def get_social_sentiment(asset: str = None, platforms: str = None) -> dict:
        """
        Get aggregated social media sentiment.
        
        Args:
            asset: Filter by asset (BTC, ETH, etc.)
            platforms: Comma-separated platforms (twitter,reddit,telegram)
        
        Returns:
            Social sentiment analysis
        """
        params = {}
        if asset:
            params["asset"] = asset
        if platforms:
            params["platforms"] = platforms
        
        response = requests.get(f"{BASE_URL}/api/social", params=params)
        return response.json()
    
    
    # Get Bitcoin social sentiment
    social = get_social_sentiment(asset="BTC")
    
    print("📱 SOCIAL SENTIMENT - BITCOIN")
    print("=" * 50)
    
    overall = social.get("overallSentiment", {})
    print(f"\n🎯 Overall: {overall.get('label', 'N/A')}")
    print(f"   Score: {overall.get('score', 0):.2f}")
    
    # Platform breakdown
    print(f"\n📊 By Platform:")
    for platform in social.get("platforms", []):
        name = platform.get("name", "Unknown")
        score = platform.get("sentiment", {}).get("score", 0)
        volume = platform.get("volume", 0)
        
        emoji = "🟢" if score > 0.2 else "🔴" if score < -0.2 else "⚪"
        print(f"   {emoji} {name:<12} Score: {score:>+.2f}  Volume: {volume:>5}")
    
    # Top influencers
    print(f"\n👥 Top Influencers:")
    for influencer in social.get("topInfluencers", [])[:5]:
        name = influencer.get("name", "Unknown")
        followers = influencer.get("followers", 0)
        print(f"   • {name} ({followers:,} followers)")
    ```

=== "JavaScript"

    ```javascript
    async function getSocialSentiment(asset, platforms) {
        const params = new URLSearchParams();
        if (asset) params.set("asset", asset);
        if (platforms) params.set("platforms", platforms);
        
        const response = await fetch(`${BASE_URL}/api/social?${params}`);
        return response.json();
    }
    
    const social = await getSocialSentiment("BTC");
    
    console.log("📱 SOCIAL SENTIMENT - BITCOIN");
    console.log("=".repeat(50));
    
    console.log(`\n🎯 Overall: ${social.overallSentiment?.label}`);
    console.log(`   Score: ${social.overallSentiment?.score?.toFixed(2)}`);
    
    console.log("\n📊 By Platform:");
    social.platforms?.forEach(platform => {
        const emoji = platform.sentiment?.score > 0.2 ? "🟢" : 
                      platform.sentiment?.score < -0.2 ? "🔴" : "⚪";
        console.log(`   ${emoji} ${platform.name}: ${platform.sentiment?.score?.toFixed(2)}`);
    });
    ```

=== "cURL"

    ```bash
    # Overall social sentiment
    curl "https://cryptocurrency.cv/api/social"
    
    # Bitcoin social sentiment
    curl "https://cryptocurrency.cv/api/social?asset=BTC"
    
    # Specific platforms
    curl "https://cryptocurrency.cv/api/social?asset=ETH&platforms=twitter,reddit"
    ```

---

## Complete Sentiment Dashboard

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Complete Sentiment Dashboard
    Aggregates all sentiment data sources.
    """
    
    import requests
    from datetime import datetime
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    class SentimentDashboard:
        def __init__(self):
            self.session = requests.Session()
        
        def get_market_sentiment(self, limit=50):
            return self.session.get(
                f"{BASE_URL}/api/sentiment",
                params={"limit": limit}
            ).json()
        
        def get_fear_greed(self):
            return self.session.get(f"{BASE_URL}/api/fear-greed").json()
        
        def get_social_sentiment(self, asset=None):
            params = {"asset": asset} if asset else {}
            return self.session.get(
                f"{BASE_URL}/api/social",
                params=params
            ).json()
        
        def analyze_headline(self, headline):
            return self.session.post(
                f"{BASE_URL}/api/ai",
                json={"action": "sentiment", "title": headline}
            ).json()
    
    
    def main():
        dashboard = SentimentDashboard()
        
        print("=" * 70)
        print("📊 CRYPTO SENTIMENT DASHBOARD")
        print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # 1. Fear & Greed Index
        print("\n😨 FEAR & GREED INDEX")
        print("-" * 70)
        fg = dashboard.get_fear_greed()
        value = fg.get("value", 50)
        classification = fg.get("classification", "Unknown")
        
        bar = "█" * int(value/2) + "░" * (50 - int(value/2))
        print(f"   Value: {value}/100 - {classification}")
        print(f"   [Fear] {bar} [Greed]")
        
        # 2. News Sentiment
        print("\n📰 NEWS SENTIMENT")
        print("-" * 70)
        sentiment = dashboard.get_market_sentiment(50)
        market = sentiment.get("market", {})
        
        overall = market.get("overall", "N/A")
        score = market.get("score", 0)
        breakdown = market.get("breakdown", {})
        
        print(f"   Overall: {overall} (Score: {score:+.3f})")
        print(f"   Bullish: {breakdown.get('bullish', 0):.1%} | "
              f"Neutral: {breakdown.get('neutral', 0):.1%} | "
              f"Bearish: {breakdown.get('bearish', 0):.1%}")
        
        # 3. Social Sentiment
        print("\n📱 SOCIAL SENTIMENT")
        print("-" * 70)
        for asset in ["BTC", "ETH"]:
            social = dashboard.get_social_sentiment(asset)
            overall = social.get("overallSentiment", {})
            label = overall.get("label", "N/A")
            score = overall.get("score", 0)
            emoji = "🟢" if score > 0.2 else "🔴" if score < -0.2 else "⚪"
            print(f"   {emoji} {asset}: {label} ({score:+.2f})")
        
        # 4. Recent Headlines
        print("\n📌 RECENT HEADLINE SENTIMENTS")
        print("-" * 70)
        for article in sentiment.get("articles", [])[:5]:
            title = article.get("title", "")[:55]
            sent = article.get("sentiment", {})
            label = sent.get("label", "N/A")
            emoji = "🟢" if "bull" in str(label).lower() else \
                    "🔴" if "bear" in str(label).lower() else "⚪"
            print(f"   {emoji} {title}...")
        
        print("\n" + "=" * 70)
        print("✅ Dashboard complete!")
    
    
    if __name__ == "__main__":
        main()
    ```

---

## Next Steps

- [AI Summarization](ai-summarization.md) - Summarize articles with AI
- [AI Market Brief](ai-market-brief.md) - Daily AI market reports
- [Narrative Detection](analytics-narratives.md) - Detect market narratives
