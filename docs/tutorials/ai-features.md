# AI Features Tutorial

This tutorial covers all AI-powered features of the Crypto News API, including summarization, sentiment analysis, AI agents, and content detection.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/ai` | Unified AI interface |
| `/api/digest` | AI-generated daily digest |
| `/api/summarize` | Article summarization |
| `/api/ask` | AI Q&A system |
| `/api/ai/brief` | AI market brief |
| `/api/ai/debate` | AI-generated debates |
| `/api/ai/counter` | Counter-argument generator |
| `/api/ai/agent` | AI research agent |
| `/api/detect/ai-content` | AI content detection |

---

## 1. AI-Generated Daily Digest

Get a comprehensive AI-generated summary of the day's most important crypto news.

=== "Python"
    ```python
    import requests
    
    def get_daily_digest(period: str = "24h", format: str = "detailed"):
        """Get AI-generated daily digest."""
        response = requests.get(
            "https://cryptocurrency.cv/api/digest",
            params={"period": period, "format": format}
        )
        return response.json()
    
    # Get daily digest
    digest = get_daily_digest()
    
    print("📰 Daily Crypto Digest")
    print("=" * 60)
    print(f"Generated: {digest.get('generatedAt')}")
    print(f"\n📝 Summary:\n{digest.get('summary')}")
    
    if 'highlights' in digest:
        print("\n🔥 Highlights:")
        for i, highlight in enumerate(digest['highlights'], 1):
            print(f"  {i}. {highlight}")
    
    if 'marketMood' in digest:
        mood = digest['marketMood']
        print(f"\n📊 Market Mood: {mood.get('sentiment')} ({mood.get('score')})")
    ```

=== "JavaScript"
    ```javascript
    async function getDailyDigest(period = '24h', format = 'detailed') {
        const params = new URLSearchParams({ period, format });
        const response = await fetch(
            `https://cryptocurrency.cv/api/digest?${params}`
        );
        return response.json();
    }
    
    // Usage
    const digest = await getDailyDigest();
    
    console.log("📰 Daily Crypto Digest");
    console.log("=".repeat(60));
    console.log(`Generated: ${digest.generatedAt}`);
    console.log(`\n📝 Summary:\n${digest.summary}`);
    
    if (digest.highlights) {
        console.log("\n🔥 Highlights:");
        digest.highlights.forEach((h, i) => console.log(`  ${i+1}. ${h}`));
    }
    ```

=== "cURL"
    ```bash
    # Get daily digest
    curl "https://cryptocurrency.cv/api/digest?period=24h&format=detailed" | jq
    
    # Get weekly digest
    curl "https://cryptocurrency.cv/api/digest?period=7d" | jq '.summary'
    ```

---

## 2. Article Summarization

Summarize any crypto article by URL.

=== "Python"
    ```python
    import requests
    
    def summarize_article(url: str, max_sentences: int = 3):
        """Summarize an article from URL."""
        response = requests.get(
            "https://cryptocurrency.cv/api/summarize",
            params={"url": url, "sentences": max_sentences}
        )
        return response.json()
    
    # Example usage
    article_url = "https://www.coindesk.com/markets/2024/01/15/bitcoin-etfs-mark-historic-first-week/"
    
    result = summarize_article(article_url)
    
    print(f"📄 Original: {article_url}")
    print(f"\n📝 Summary:\n{result.get('summary')}")
    print(f"\n🏷️ Key Topics: {', '.join(result.get('topics', []))}")
    print(f"⏱️ Read Time Saved: {result.get('timeSaved', 'N/A')}")
    ```

=== "JavaScript"
    ```javascript
    async function summarizeArticle(url, sentences = 3) {
        const params = new URLSearchParams({ url, sentences: sentences.toString() });
        const response = await fetch(
            `https://cryptocurrency.cv/api/summarize?${params}`
        );
        return response.json();
    }
    
    // Usage
    const url = "https://www.coindesk.com/markets/2024/01/15/bitcoin-etfs-mark-historic-first-week/";
    const result = await summarizeArticle(url);
    
    console.log(`📄 Original: ${url}`);
    console.log(`\n📝 Summary:\n${result.summary}`);
    console.log(`\n🏷️ Topics: ${result.topics?.join(', ')}`);
    ```

=== "cURL"
    ```bash
    # Summarize an article
    curl -G "https://cryptocurrency.cv/api/summarize" \
      --data-urlencode "url=https://www.coindesk.com/article-example" \
      | jq '.summary'
    ```

---

## 3. AI Question & Answer

Ask natural language questions about crypto markets and news.

=== "Python"
    ```python
    import requests
    
    def ask_ai(question: str, context: str = None):
        """Ask AI a question about crypto."""
        params = {"q": question}
        if context:
            params["context"] = context
        
        response = requests.get(
            "https://cryptocurrency.cv/api/ask",
            params=params
        )
        return response.json()
    
    # Example questions
    questions = [
        "What's driving Bitcoin's price today?",
        "What are the latest regulatory developments?",
        "How is the DeFi market performing?"
    ]
    
    for question in questions:
        result = ask_ai(question)
        print(f"❓ Q: {question}")
        print(f"💡 A: {result.get('answer')}")
        print("-" * 60)
    ```

=== "JavaScript"
    ```javascript
    async function askAI(question, context = null) {
        const params = new URLSearchParams({ q: question });
        if (context) params.set('context', context);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/ask?${params}`
        );
        return response.json();
    }
    
    // Interactive Q&A
    const questions = [
        "What's driving Bitcoin's price today?",
        "What are the latest regulatory developments?"
    ];
    
    for (const q of questions) {
        const result = await askAI(q);
        console.log(`❓ Q: ${q}`);
        console.log(`💡 A: ${result.answer}`);
        console.log("-".repeat(60));
    }
    ```

=== "cURL"
    ```bash
    # Ask a question
    curl -G "https://cryptocurrency.cv/api/ask" \
      --data-urlencode "q=What's driving Bitcoin's price today?" \
      | jq '.answer'
    
    # With context
    curl -G "https://cryptocurrency.cv/api/ask" \
      --data-urlencode "q=Should I buy?" \
      --data-urlencode "context=Bitcoin is at $60,000" \
      | jq '.answer'
    ```

---

## 4. AI Market Brief

Get a professionally formatted market brief suitable for newsletters or reports.

=== "Python"
    ```python
    import requests
    from datetime import datetime
    
    def get_market_brief(date: str = None, format: str = "newsletter"):
        """Get AI market brief."""
        params = {"format": format}
        if date:
            params["date"] = date
        
        response = requests.get(
            "https://cryptocurrency.cv/api/ai/brief",
            params=params
        )
        return response.json()
    
    # Get today's brief
    brief = get_market_brief(format="newsletter")
    
    print("📊 Market Brief")
    print("=" * 60)
    print(f"Date: {brief.get('date')}")
    print(f"\n{brief.get('content')}")
    
    if 'metrics' in brief:
        print("\n📈 Key Metrics:")
        for metric, value in brief['metrics'].items():
            print(f"  • {metric}: {value}")
    ```

=== "JavaScript"
    ```javascript
    async function getMarketBrief(date = null, format = 'newsletter') {
        const params = new URLSearchParams({ format });
        if (date) params.set('date', date);
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/ai/brief?${params}`
        );
        return response.json();
    }
    
    // Get today's brief
    const brief = await getMarketBrief();
    
    console.log("📊 Market Brief");
    console.log("=".repeat(60));
    console.log(`Date: ${brief.date}`);
    console.log(`\n${brief.content}`);
    
    if (brief.metrics) {
        console.log("\n📈 Key Metrics:");
        for (const [metric, value] of Object.entries(brief.metrics)) {
            console.log(`  • ${metric}: ${value}`);
        }
    }
    ```

=== "cURL"
    ```bash
    # Get newsletter format brief
    curl "https://cryptocurrency.cv/api/ai/brief?format=newsletter" | jq
    
    # Get specific date brief
    curl "https://cryptocurrency.cv/api/ai/brief?date=2024-01-15" | jq '.content'
    ```

---

## 5. AI Debate Generator

Generate balanced debates on controversial crypto topics.

=== "Python"
    ```python
    import requests
    
    def generate_debate(topic: str, article: dict = None):
        """Generate AI debate on a topic."""
        payload = {"topic": topic}
        if article:
            payload["article"] = article
        
        response = requests.post(
            "https://cryptocurrency.cv/api/ai/debate",
            json=payload
        )
        return response.json()
    
    # Generate debate
    topic = "Bitcoin will replace gold as the primary store of value"
    debate = generate_debate(topic)
    
    print(f"🎭 AI Debate: {topic}")
    print("=" * 60)
    
    if 'proArguments' in debate:
        print("\n✅ PRO Arguments:")
        for arg in debate['proArguments']:
            print(f"  • {arg}")
    
    if 'conArguments' in debate:
        print("\n❌ CON Arguments:")
        for arg in debate['conArguments']:
            print(f"  • {arg}")
    
    if 'conclusion' in debate:
        print(f"\n🎯 Conclusion: {debate['conclusion']}")
    ```

=== "JavaScript"
    ```javascript
    async function generateDebate(topic, article = null) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/ai/debate',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, article })
            }
        );
        return response.json();
    }
    
    // Generate debate
    const topic = "Bitcoin will replace gold as the primary store of value";
    const debate = await generateDebate(topic);
    
    console.log(`🎭 AI Debate: ${topic}`);
    console.log("=".repeat(60));
    
    if (debate.proArguments) {
        console.log("\n✅ PRO Arguments:");
        debate.proArguments.forEach(arg => console.log(`  • ${arg}`));
    }
    
    if (debate.conArguments) {
        console.log("\n❌ CON Arguments:");
        debate.conArguments.forEach(arg => console.log(`  • ${arg}`));
    }
    ```

=== "cURL"
    ```bash
    # Generate debate
    curl -X POST "https://cryptocurrency.cv/api/ai/debate" \
      -H "Content-Type: application/json" \
      -d '{"topic": "Bitcoin will replace gold as the primary store of value"}' \
      | jq
    ```

---

## 6. Counter-Argument Generator

Generate counter-arguments to any claim.

=== "Python"
    ```python
    import requests
    
    def generate_counter(claim: str, context: str = None):
        """Generate counter-arguments to a claim."""
        payload = {"claim": claim}
        if context:
            payload["context"] = context
        
        response = requests.post(
            "https://cryptocurrency.cv/api/ai/counter",
            json=payload
        )
        return response.json()
    
    # Example claims to counter
    claims = [
        "Ethereum will flip Bitcoin by 2025",
        "All altcoins are worthless",
        "Crypto regulation will kill the industry"
    ]
    
    for claim in claims:
        result = generate_counter(claim)
        print(f"📢 Claim: {claim}")
        print(f"🤔 Counter-Arguments:")
        for arg in result.get('counterArguments', []):
            print(f"   • {arg}")
        print("-" * 60)
    ```

=== "JavaScript"
    ```javascript
    async function generateCounter(claim, context = null) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/ai/counter',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claim, context })
            }
        );
        return response.json();
    }
    
    // Generate counter-arguments
    const claim = "Ethereum will flip Bitcoin by 2025";
    const result = await generateCounter(claim);
    
    console.log(`📢 Claim: ${claim}`);
    console.log("🤔 Counter-Arguments:");
    result.counterArguments?.forEach(arg => console.log(`   • ${arg}`));
    ```

=== "cURL"
    ```bash
    # Generate counter-arguments
    curl -X POST "https://cryptocurrency.cv/api/ai/counter" \
      -H "Content-Type: application/json" \
      -d '{"claim": "Ethereum will flip Bitcoin by 2025"}' \
      | jq '.counterArguments'
    ```

---

## 7. AI Research Agent

Query an AI agent that can perform complex research tasks.

=== "Python"
    ```python
    import requests
    
    def query_ai_agent(question: str, assets: list = None, time_horizon: str = None):
        """Query AI research agent."""
        payload = {"question": question}
        if assets:
            payload["assets"] = assets
        if time_horizon:
            payload["timeHorizon"] = time_horizon
        
        response = requests.post(
            "https://cryptocurrency.cv/api/ai/agent",
            json=payload
        )
        return response.json()
    
    # Example research queries
    research = query_ai_agent(
        question="What are the key factors affecting BTC price this week?",
        assets=["BTC", "ETH"],
        time_horizon="1w"
    )
    
    print("🤖 AI Agent Research")
    print("=" * 60)
    print(f"Query: {research.get('query')}")
    print(f"\n📝 Analysis:\n{research.get('analysis')}")
    
    if 'sources' in research:
        print("\n📚 Sources:")
        for source in research['sources'][:5]:
            print(f"  • {source.get('title')}")
    
    if 'recommendations' in research:
        print("\n💡 Recommendations:")
        for rec in research['recommendations']:
            print(f"  • {rec}")
    ```

=== "JavaScript"
    ```javascript
    async function queryAIAgent(question, options = {}) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/ai/agent',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    assets: options.assets,
                    timeHorizon: options.timeHorizon,
                    focusAreas: options.focusAreas
                })
            }
        );
        return response.json();
    }
    
    // Research query
    const research = await queryAIAgent(
        "What are the key factors affecting BTC price this week?",
        { assets: ["BTC", "ETH"], timeHorizon: "1w" }
    );
    
    console.log("🤖 AI Agent Research");
    console.log("=".repeat(60));
    console.log(`Query: ${research.query}`);
    console.log(`\n📝 Analysis:\n${research.analysis}`);
    ```

=== "cURL"
    ```bash
    # Query AI agent
    curl -X POST "https://cryptocurrency.cv/api/ai/agent" \
      -H "Content-Type: application/json" \
      -d '{
        "question": "What are the key factors affecting BTC price?",
        "assets": ["BTC", "ETH"],
        "timeHorizon": "1w"
      }' | jq
    ```

---

## 8. AI Content Detection

Detect AI-generated content in articles or text.

=== "Python"
    ```python
    import requests
    
    def detect_ai_content(text: str, quick: bool = False):
        """Detect if content is AI-generated."""
        response = requests.post(
            "https://cryptocurrency.cv/api/detect/ai-content",
            json={"text": text, "quick": quick}
        )
        return response.json()
    
    def detect_ai_content_batch(texts: list):
        """Batch detect AI content."""
        response = requests.post(
            "https://cryptocurrency.cv/api/detect/ai-content",
            json={"texts": texts}
        )
        return response.json()
    
    # Single text analysis
    sample_text = """
    Bitcoin's price action today reflects the broader market sentiment 
    as investors digest the latest macroeconomic data. The cryptocurrency 
    has shown resilience above key support levels.
    """
    
    result = detect_ai_content(sample_text)
    
    print("🔍 AI Content Detection")
    print("=" * 60)
    print(f"Is AI Generated: {result.get('isAI')}")
    print(f"Confidence: {result.get('confidence', 0) * 100:.1f}%")
    print(f"Classification: {result.get('classification')}")
    
    if 'signals' in result:
        print("\n📊 Detection Signals:")
        for signal, value in result['signals'].items():
            print(f"  • {signal}: {value}")
    ```

=== "JavaScript"
    ```javascript
    async function detectAIContent(text, quick = false) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/detect/ai-content',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, quick })
            }
        );
        return response.json();
    }
    
    async function detectAIContentBatch(texts) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/detect/ai-content',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts })
            }
        );
        return response.json();
    }
    
    // Single text analysis
    const text = `Bitcoin's price action today reflects the broader market 
    sentiment as investors digest the latest macroeconomic data.`;
    
    const result = await detectAIContent(text);
    
    console.log("🔍 AI Content Detection");
    console.log("=".repeat(60));
    console.log(`Is AI Generated: ${result.isAI}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Classification: ${result.classification}`);
    ```

=== "cURL"
    ```bash
    # Detect AI content in text
    curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
      -H "Content-Type: application/json" \
      -d '{"text": "Bitcoin is showing bullish momentum today."}' \
      | jq
    
    # Batch detection
    curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
      -H "Content-Type: application/json" \
      -d '{"texts": ["First article...", "Second article..."]}' \
      | jq
    ```

---

## 9. Unified AI Interface

Use the unified `/api/ai` endpoint for any AI action.

=== "Python"
    ```python
    import requests
    
    class AIClient:
        BASE_URL = "https://cryptocurrency.cv/api/ai"
        
        def request(self, action: str, **kwargs):
            """Make unified AI request."""
            payload = {"action": action, **kwargs}
            response = requests.post(self.BASE_URL, json=payload)
            return response.json()
        
        def summarize(self, text: str):
            return self.request("summarize", text=text)
        
        def analyze_sentiment(self, text: str):
            return self.request("sentiment", text=text)
        
        def translate(self, text: str, target_lang: str):
            return self.request("translate", text=text, targetLang=target_lang)
        
        def extract_entities(self, text: str):
            return self.request("entities", text=text)
    
    # Usage
    ai = AIClient()
    
    text = "Bitcoin ETF volumes reached $5 billion as BlackRock leads inflows"
    
    # Multiple AI operations
    summary = ai.summarize(text)
    sentiment = ai.analyze_sentiment(text)
    entities = ai.extract_entities(text)
    
    print(f"📝 Summary: {summary.get('result')}")
    print(f"📊 Sentiment: {sentiment.get('result')}")
    print(f"🏷️ Entities: {entities.get('result')}")
    ```

=== "JavaScript"
    ```javascript
    class AIClient {
        constructor(baseUrl = 'https://cryptocurrency.cv/api/ai') {
            this.baseUrl = baseUrl;
        }
        
        async request(action, options = {}) {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...options })
            });
            return response.json();
        }
        
        summarize(text) {
            return this.request('summarize', { text });
        }
        
        analyzeSentiment(text) {
            return this.request('sentiment', { text });
        }
        
        translate(text, targetLang) {
            return this.request('translate', { text, targetLang });
        }
        
        extractEntities(text) {
            return this.request('entities', { text });
        }
    }
    
    // Usage
    const ai = new AIClient();
    
    const text = "Bitcoin ETF volumes reached $5 billion";
    
    const [summary, sentiment, entities] = await Promise.all([
        ai.summarize(text),
        ai.analyzeSentiment(text),
        ai.extractEntities(text)
    ]);
    ```

=== "cURL"
    ```bash
    # Summarize
    curl -X POST "https://cryptocurrency.cv/api/ai" \
      -H "Content-Type: application/json" \
      -d '{"action": "summarize", "text": "Bitcoin ETF..."}' | jq
    
    # Sentiment analysis
    curl -X POST "https://cryptocurrency.cv/api/ai" \
      -H "Content-Type: application/json" \
      -d '{"action": "sentiment", "text": "Bitcoin ETF..."}' | jq
    ```

---

## Complete AI-Powered Application

Build a comprehensive AI analysis tool:

```python
#!/usr/bin/env python3
"""Complete AI-powered crypto analysis application."""

import requests
from datetime import datetime
from typing import Optional

class CryptoAIAnalyzer:
    """AI-powered crypto analysis client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def get_digest(self) -> dict:
        """Get AI daily digest."""
        response = self.session.get(f"{self.BASE_URL}/api/digest")
        return response.json()
    
    def summarize(self, url: str) -> dict:
        """Summarize article."""
        response = self.session.get(
            f"{self.BASE_URL}/api/summarize",
            params={"url": url}
        )
        return response.json()
    
    def ask(self, question: str) -> dict:
        """Ask AI a question."""
        response = self.session.get(
            f"{self.BASE_URL}/api/ask",
            params={"q": question}
        )
        return response.json()
    
    def get_brief(self) -> dict:
        """Get market brief."""
        response = self.session.get(f"{self.BASE_URL}/api/ai/brief")
        return response.json()
    
    def debate(self, topic: str) -> dict:
        """Generate debate."""
        response = self.session.post(
            f"{self.BASE_URL}/api/ai/debate",
            json={"topic": topic}
        )
        return response.json()
    
    def detect_ai(self, text: str) -> dict:
        """Detect AI content."""
        response = self.session.post(
            f"{self.BASE_URL}/api/detect/ai-content",
            json={"text": text}
        )
        return response.json()
    
    def agent_query(self, question: str) -> dict:
        """Query AI agent."""
        response = self.session.post(
            f"{self.BASE_URL}/api/ai/agent",
            json={"question": question}
        )
        return response.json()
    
    def run_full_analysis(self):
        """Run complete AI analysis."""
        print("🤖 AI-Powered Crypto Analysis")
        print("=" * 60)
        print(f"Time: {datetime.now().isoformat()}")
        
        # Daily Digest
        print("\n📰 Daily Digest:")
        try:
            digest = self.get_digest()
            print(f"  {digest.get('summary', 'No summary available')[:200]}...")
        except Exception as e:
            print(f"  Error: {e}")
        
        # Market Brief
        print("\n📊 Market Brief:")
        try:
            brief = self.get_brief()
            print(f"  {brief.get('content', 'No brief available')[:200]}...")
        except Exception as e:
            print(f"  Error: {e}")
        
        # AI Q&A
        print("\n❓ AI Analysis:")
        questions = [
            "What's the current market sentiment?",
            "What are today's biggest movers?"
        ]
        for q in questions:
            try:
                answer = self.ask(q)
                print(f"  Q: {q}")
                print(f"  A: {answer.get('answer', 'No answer')[:150]}...")
            except Exception as e:
                print(f"  Error: {e}")
        
        # Agent Research
        print("\n🔬 Agent Research:")
        try:
            research = self.agent_query(
                "What are the top narratives in crypto this week?"
            )
            print(f"  {research.get('analysis', 'No analysis')[:200]}...")
        except Exception as e:
            print(f"  Error: {e}")
        
        print("\n" + "=" * 60)
        print("✅ Analysis complete!")

def main():
    analyzer = CryptoAIAnalyzer()
    analyzer.run_full_analysis()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [Trading Signals Tutorial](trading-signals.md) - Learn trading and market APIs
- [Analytics Tutorial](analytics-research.md) - Explore research and analytics
- [Real-time Streaming](realtime-sse.md) - Build real-time applications
