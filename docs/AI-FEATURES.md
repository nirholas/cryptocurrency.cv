# 🤖 AI Features Guide

Advanced AI capabilities for news analysis, summarization, and insights.

---

## Table of Contents

- [Overview](#overview)
- [Configuration](#configuration)
- [AI API Endpoint](#ai-api-endpoint)
- [Features](#features)
  - [Summarization](#summarization)
  - [Sentiment Analysis](#sentiment-analysis)
  - [Fact Extraction](#fact-extraction)
  - [Fact Checking](#fact-checking)
  - [Question Generation](#question-generation)
  - [Categorization](#categorization)
  - [Translation](#translation)
- [AI Products](#ai-products)
  - [Daily Brief](#daily-brief)
  - [Bull vs Bear Debate](#bull-vs-bear-debate)
  - [Counter-Arguments](#counter-arguments)
- [AI Intelligence Suite](#ai-intelligence-suite)
  - [News Synthesis](#news-synthesis)
  - [Trending Explainer](#trending-explainer)
  - [Portfolio News](#portfolio-news)
  - [News-Price Correlation](#news-price-correlation)
  - [Flash Briefing](#flash-briefing)
  - [Narrative Tracker](#narrative-tracker)
  - [Cross-Lingual Intelligence](#cross-lingual-intelligence)
  - [Source Quality Scoring](#source-quality-scoring)
  - [Research Agent](#research-agent)
- [AI Market Intelligence Agent](#ai-market-intelligence-agent)
- [The Oracle (AI Chat Interface)](#the-oracle-ai-chat-interface)
- [AI Content Detection](#ai-content-detection)
- [Enterprise Entity Extraction](#enterprise-entity-extraction)
- [Relationship Extraction](#relationship-extraction)
- [Event Classification](#event-classification)
- [Claim Extraction](#claim-extraction)
- [Intelligence Features](#intelligence-features)
  - [Anomaly Detection](#anomaly-detection)
  - [Headline Tracking](#headline-tracking)
  - [Causal Inference](#causal-inference)
  - [Regulatory Intelligence](#regulatory-intelligence)
  - [Prediction Tracking](#prediction-tracking)
  - [Influencer Tracking](#influencer-tracking)
  - [Citation Network](#citation-network)
- [Translation Service](#translation-service)
- [Provider Comparison](#provider-comparison)
- [SDK Usage](#sdk-usage)
- [Best Practices](#best-practices)

---

## Overview

Free Crypto News provides comprehensive AI-powered features for deeper news analysis:

### Core AI Features

| Feature | Description |
|---------|-------------|
| **Summarization** | Generate concise article summaries (5 styles: brief/detailed/bullet/eli5/technical) |
| **Sentiment Analysis** | Analyze market sentiment with confidence scores (-1 to 1 scale) |
| **Entity Extraction** | Extract entities (12 types: person/org/crypto/token/exchange/protocol/event/regulation/tech/location/financial_metric/other) |
| **Relationship Mapping** | Extract relationships between entities (11 relationship types) |
| **Fact Checking** | Verify claims in articles (verified/likely/unverified/disputed) |
| **Question Generation** | Generate follow-up questions readers might have |
| **Categorization** | Auto-categorize articles by topic |
| **Translation** | Translate content to 18 languages |

### AI Products

| Feature | Description |
|---------|-------------|
| **Daily Brief** | Comprehensive daily crypto news digest with market overview |
| **Bull vs Bear Debate** | Generate balanced perspectives on any topic |
| **Counter-Arguments** | Challenge claims with structured counter-arguments |
| **The Oracle** | Natural language crypto intelligence chat interface |
| **AI Market Agent** | Multi-source signal aggregation with regime detection |

### AI Intelligence Suite (NEW)

| Feature | Description |
|---------|-------------|
| **News Synthesis** | Auto-cluster duplicate articles and synthesize into comprehensive summaries |
| **Trending Explainer** | AI explains why any topic is trending with full context |
| **Portfolio News** | Score news by relevance to your portfolio holdings |
| **News-Price Correlation** | Detect correlations between news and price movements |
| **Flash Briefing** | Ultra-short AI summaries for voice assistants |
| **Narrative Tracker** | Track crypto narratives through lifecycle phases |
| **Cross-Lingual Intelligence** | Detect regional sentiment divergence and alpha signals |
| **Source Quality** | AI-powered source scoring and clickbait detection |
| **Research Agent** | Deep-dive research reports on any crypto topic |

### Intelligence Features

| Feature | Description |
|---------|-------------|
| **AI Content Detection** | Detect AI-generated content (offline, no API needed) |
| **Event Classification** | Classify news events (13 types) |
| **Claim Extraction** | Extract verifiable claims with attribution |
| **Anomaly Detection** | Detect unusual news patterns (6 anomaly types) |
| **Headline Tracking** | Track headline mutations over time |
| **Causal Inference** | Analyze news-price causality (5 methods) |
| **Regulatory Intelligence** | Track regulations (15 jurisdictions, 30+ agencies) |
| **Prediction Tracking** | Track and score predictions with leaderboards |
| **Influencer Tracking** | Score influencer reliability and accuracy |
| **Citation Network** | Academic citation tracking with bibliometrics |

---

## Configuration

### Supported Providers

The AI system supports multiple providers (priority order):

| Provider | Model | API Key Env |
|----------|-------|-------------|
| OpenAI | gpt-4o-mini | `OPENAI_API_KEY` |
| Anthropic | claude-3-haiku | `ANTHROPIC_API_KEY` |
| Groq | mixtral-8x7b | `GROQ_API_KEY` |
| OpenRouter | llama-3-8b | `OPENROUTER_API_KEY` |

### Environment Variables

```env
# Choose ONE provider (first available is used)

# Option 1: OpenAI (recommended)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # optional, default shown

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-haiku-20240307

# Option 3: Groq (free tier available)
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768

# Option 4: OpenRouter (many models)
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct
```

### Check Configuration

```bash
curl https://cryptocurrency.cv/api/ai
```

Response:
```json
{
  "configured": true,
  "provider": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  "availableActions": [
    "summarize",
    "sentiment",
    "facts",
    "factcheck",
    "questions",
    "categorize",
    "translate"
  ]
}
```

---

## AI API Endpoint

### `POST /api/ai`

**Request Body:**

```json
{
  "action": "summarize | sentiment | facts | factcheck | questions | categorize | translate",
  "title": "Article title (optional for some actions)",
  "content": "Article content to analyze",
  "options": {
    "length": "short | medium | long",
    "targetLanguage": "es | fr | de | ..."
  }
}
```

**Response:**

```json
{
  "success": true,
  "action": "summarize",
  "provider": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  "result": "..."
}
```

---

## Features

### Summarization

Generate concise summaries of articles.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "summarize",
    "title": "Bitcoin ETF Finally Approved",
    "content": "The SEC has officially approved the first spot Bitcoin ETF...",
    "options": {
      "length": "short"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "summarize",
  "result": "The SEC approved the first spot Bitcoin ETF, marking a major milestone for institutional crypto adoption."
}
```

**Length Options:**

| Length | Output |
|--------|--------|
| `short` | 1-2 sentences (max 50 words) |
| `medium` | 2-3 sentences (max 100 words) |
| `long` | 3-5 sentences (max 200 words) |

---

### Sentiment Analysis

Analyze market sentiment with confidence scores.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sentiment",
    "title": "Bitcoin Crashes 20% in One Day",
    "content": "Bitcoin experienced its largest single-day drop since..."
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "sentiment",
  "result": {
    "sentiment": "bearish",
    "confidence": 0.92,
    "reasoning": "Large price drop indicates strong selling pressure and negative market sentiment",
    "marketImpact": "high",
    "affectedAssets": ["BTC", "ETH", "altcoins"]
  }
}
```

**Sentiment Values:**

| Value | Meaning |
|-------|---------|
| `bullish` | Positive market outlook |
| `bearish` | Negative market outlook |
| `neutral` | No clear direction |

---

### Fact Extraction

Extract structured information from articles.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "facts",
    "title": "MicroStrategy Buys More Bitcoin",
    "content": "MicroStrategy announced another $500 million BTC purchase, bringing total holdings to 190,000 BTC..."
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "facts",
  "result": {
    "keyPoints": [
      "MicroStrategy purchased additional $500M in Bitcoin",
      "Total holdings now 190,000 BTC",
      "Company remains largest corporate Bitcoin holder"
    ],
    "entities": [
      { "name": "MicroStrategy", "type": "company" },
      { "name": "Bitcoin", "type": "crypto" },
      { "name": "Michael Saylor", "type": "person" }
    ],
    "numbers": [
      { "value": "$500 million", "context": "purchase amount" },
      { "value": "190,000 BTC", "context": "total holdings" }
    ],
    "dates": [
      { "date": "2026-01-22", "event": "purchase announced" }
    ]
  }
}
```

---

### Fact Checking

Evaluate claims made in articles.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "factcheck",
    "title": "Bitcoin to Replace Dollar by 2030",
    "content": "Experts claim Bitcoin will completely replace the US dollar..."
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "factcheck",
  "result": {
    "claims": [
      {
        "claim": "Bitcoin will replace the US dollar by 2030",
        "verdict": "disputed",
        "explanation": "Highly speculative prediction without concrete evidence"
      },
      {
        "claim": "Experts support this view",
        "verdict": "unverified",
        "explanation": "No specific experts named or cited"
      }
    ],
    "overallCredibility": "low",
    "warnings": [
      "Article contains speculative predictions",
      "No sources cited for expert claims"
    ]
  }
}
```

**Verdicts:**

| Verdict | Meaning |
|---------|---------|
| `verified` | Claim is accurate and verifiable |
| `unverified` | Cannot confirm or deny |
| `disputed` | Claim is contested |
| `false` | Claim is demonstrably incorrect |

---

### Question Generation

Generate follow-up questions readers might have.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "questions",
    "title": "New DeFi Protocol Launches",
    "content": "A new decentralized exchange protocol launched today with unique AMM features..."
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "questions",
  "result": [
    "What makes this AMM different from existing protocols like Uniswap?",
    "Has the protocol been audited for security vulnerabilities?",
    "What is the total value locked (TVL) at launch?",
    "Who are the team members behind this project?"
  ]
}
```

---

### Categorization

Auto-categorize articles by topic.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "categorize",
    "title": "SEC Sues Major Crypto Exchange",
    "content": "The Securities and Exchange Commission filed a lawsuit against..."
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "categorize",
  "result": {
    "primaryCategory": "regulation",
    "secondaryCategories": ["market", "security"],
    "tags": ["SEC", "lawsuit", "exchange", "compliance"],
    "topics": ["regulatory enforcement", "crypto exchanges", "securities law"]
  }
}
```

**Categories:**

- `bitcoin` - Bitcoin-specific news
- `ethereum` - Ethereum & L2s
- `defi` - Decentralized finance
- `nft` - NFTs & digital art
- `regulation` - Laws & compliance
- `market` - Price & trading
- `technology` - Tech developments
- `adoption` - Mainstream adoption
- `security` - Hacks & security
- `altcoins` - Other cryptocurrencies

---

### Translation

Translate content to any language.

**Request:**

```bash
curl -X POST https://cryptocurrency.cv/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "action": "translate",
    "content": "Bitcoin reached a new all-time high today, surpassing $100,000 for the first time in history.",
    "options": {
      "targetLanguage": "Spanish"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "action": "translate",
  "result": "Bitcoin alcanzó un nuevo máximo histórico hoy, superando los $100,000 por primera vez en la historia."
}
```

**Supported Languages:**

Any language supported by the AI provider (100+ languages including Chinese, Japanese, Korean, Spanish, French, German, Portuguese, Russian, Arabic, Hindi, etc.)

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { CryptoNewsClient } from '@cryptonews/sdk';

const client = new CryptoNewsClient();

// Summarize article
const summary = await client.ai.summarize(
  'Bitcoin Hits $100K',
  'Bitcoin has surged past the $100,000 mark...',
  { length: 'short' }
);

// Analyze sentiment
const sentiment = await client.ai.sentiment(
  'Market Crash',
  'Crypto markets plunged today...'
);

console.log(sentiment);
// { sentiment: 'bearish', confidence: 0.89, ... }

// Extract facts
const facts = await client.ai.extractFacts(title, content);

// Fact check
const check = await client.ai.factCheck(title, content);

// Translate
const spanish = await client.ai.translate(content, 'Spanish');
```

### Python

```python
from cryptonews import CryptoNews

news = CryptoNews()

# Summarize
summary = news.ai.summarize(
    title="Bitcoin ETF Approved",
    content="The SEC has officially approved...",
    length="medium"
)

# Sentiment analysis
sentiment = news.ai.sentiment(
    title="Market Crash",
    content="Crypto markets experienced..."
)
print(f"Sentiment: {sentiment['sentiment']}, Confidence: {sentiment['confidence']}")

# Extract facts
facts = news.ai.extract_facts(title, content)
for entity in facts['entities']:
    print(f"- {entity['name']} ({entity['type']})")

# Fact check
result = news.ai.fact_check(title, content)
print(f"Credibility: {result['overallCredibility']}")

# Translate
spanish = news.ai.translate(content, "Spanish")
```

### React Hook

```tsx
import { useAI } from '@cryptonews/react';

function ArticleAnalysis({ article }) {
  const { summarize, sentiment, loading, error } = useAI();
  const [analysis, setAnalysis] = useState(null);

  const analyze = async () => {
    const [summary, sentimentResult] = await Promise.all([
      summarize(article.title, article.content, { length: 'short' }),
      sentiment(article.title, article.content),
    ]);
    
    setAnalysis({ summary, sentiment: sentimentResult });
  };

  return (
    <div>
      <button onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Article'}
      </button>
      
      {analysis && (
        <div>
          <h3>Summary</h3>
          <p>{analysis.summary}</p>
          
          <h3>Sentiment</h3>
          <span className={`badge ${analysis.sentiment.sentiment}`}>
            {analysis.sentiment.sentiment}
          </span>
          <span>({Math.round(analysis.sentiment.confidence * 100)}% confidence)</span>
        </div>
      )}
    </div>
  );
}
```

---

## AI Products

Advanced AI-powered products for comprehensive market analysis.

### Daily Brief

Generate a comprehensive daily digest of crypto news with market overview, top stories, sector analysis, and risk alerts.

**Endpoint:** `GET /api/ai/brief`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string | today | Date in YYYY-MM-DD format |
| `format` | string | `full` | `full` or `summary` |

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/brief?date=2026-01-22&format=full"
```

**Response:**

```json
{
  "success": true,
  "brief": {
    "date": "2026-01-22",
    "executiveSummary": "Crypto markets showed strength today with BTC leading...",
    "marketOverview": {
      "sentiment": "bullish",
      "btcTrend": "upward",
      "keyMetrics": {
        "fearGreedIndex": 65,
        "btcDominance": 52.5,
        "totalMarketCap": "$2.5T"
      }
    },
    "topStories": [
      {
        "headline": "Bitcoin ETF sees record inflows",
        "summary": "Institutional demand continues to grow...",
        "impact": "high",
        "relatedTickers": ["BTC"]
      }
    ],
    "sectorsInFocus": [
      {
        "sector": "DeFi",
        "trend": "up",
        "reason": "TVL increasing across major protocols"
      }
    ],
    "upcomingEvents": [
      {
        "event": "Fed Meeting",
        "date": "2026-01-28",
        "potentialImpact": "Could affect risk asset sentiment"
      }
    ],
    "riskAlerts": ["Regulatory uncertainty in EU markets"],
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

**Caching:** Briefs are cached for 1 hour.

---

### Bull vs Bear Debate

Generate balanced bull and bear perspectives on any article or topic.

**Endpoint:** `POST /api/ai/debate`

**Request Body:**

```json
{
  "article": {
    "title": "Article title",
    "content": "Article content..."
  },
  // OR
  "topic": "Bitcoin reaching $200k in 2026"
}
```

**Request:**

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/debate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Bitcoin reaching $200k in 2026"
  }'
```

**Response:**

```json
{
  "success": true,
  "debate": {
    "topic": "Bitcoin reaching $200k in 2026",
    "bullCase": {
      "thesis": "Bitcoin is positioned for significant gains due to institutional adoption and supply dynamics.",
      "arguments": [
        "ETF inflows continue at record pace",
        "Post-halving supply shock in effect",
        "Corporate treasury adoption accelerating"
      ],
      "supportingEvidence": [
        "BlackRock ETF holds over 500k BTC",
        "On-chain metrics show accumulation"
      ],
      "priceTarget": "$200,000",
      "timeframe": "12 months",
      "confidence": 0.7
    },
    "bearCase": {
      "thesis": "Macro headwinds and regulatory uncertainty pose significant risks.",
      "arguments": [
        "Fed policy remains restrictive",
        "Regulatory crackdown intensifying",
        "Technical resistance at $120k"
      ],
      "supportingEvidence": [
        "Rising interest rates globally",
        "SEC enforcement actions"
      ],
      "priceTarget": "$80,000",
      "timeframe": "6 months",
      "confidence": 0.5
    },
    "neutralAnalysis": {
      "keyUncertainties": [
        "Fed policy direction",
        "Regulatory clarity timeline"
      ],
      "whatToWatch": [
        "ETF flow data",
        "On-chain accumulation metrics"
      ],
      "consensus": "Market divided with slight bullish bias"
    },
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

**Caching:** Debates are cached for 24 hours.

---

### Counter-Arguments

Challenge any claim with structured counter-arguments, assumption analysis, and alternative interpretations.

**Endpoint:** `POST /api/ai/counter`

**Request Body:**

```json
{
  "claim": "Bitcoin will replace the US dollar by 2030",
  "context": "Optional additional context about the claim"
}
```

**Request:**

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/counter" \
  -H "Content-Type: application/json" \
  -d '{
    "claim": "Bitcoin will replace the US dollar by 2030"
  }'
```

**Response:**

```json
{
  "success": true,
  "counter": {
    "originalClaim": "Bitcoin will replace the US dollar by 2030",
    "counterArguments": [
      {
        "argument": "The US dollar is backed by the world's largest economy and military, providing stability Bitcoin cannot match.",
        "type": "factual",
        "strength": "strong"
      },
      {
        "argument": "Bitcoin's volatility makes it unsuitable as a medium of exchange for everyday transactions.",
        "type": "logical",
        "strength": "strong"
      },
      {
        "argument": "The claim ignores the regulatory power governments have to resist monetary displacement.",
        "type": "contextual",
        "strength": "moderate"
      },
      {
        "argument": "Bitcoin could coexist with fiat as a store of value without replacing it.",
        "type": "alternative",
        "strength": "moderate"
      }
    ],
    "assumptions": [
      {
        "assumption": "Governments will not effectively regulate or ban Bitcoin",
        "challenge": "Many governments have already shown willingness to restrict crypto"
      },
      {
        "assumption": "Bitcoin can scale to handle global transaction volume",
        "challenge": "Current throughput is ~7 TPS vs Visa's 65,000 TPS"
      }
    ],
    "alternativeInterpretations": [
      "Bitcoin may become a reserve asset alongside gold rather than replacing fiat",
      "Stablecoins may bridge the gap between crypto and traditional finance"
    ],
    "missingContext": [
      "Network effects of existing monetary systems",
      "Central bank digital currency (CBDC) development"
    ],
    "overallAssessment": {
      "claimStrength": "weak",
      "mainVulnerability": "Underestimates institutional inertia and regulatory resistance"
    },
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

**Counter-Argument Types:**

| Type | Description |
|------|-------------|
| `factual` | Disputes facts or data in the claim |
| `logical` | Identifies logical fallacies or reasoning errors |
| `contextual` | Points out missing context or oversimplifications |
| `alternative` | Presents alternative explanations |

**Caching:** Counter-arguments are cached for 24 hours.

---

## AI Intelligence Suite

Advanced AI-powered features for market intelligence, research, and cross-lingual analysis.

---

### News Synthesis

Automatically clusters duplicate/similar news articles and synthesizes them into comprehensive, deduplicated summaries.

**Endpoint:** `GET /api/ai/synthesize`

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 5 | Number of stories to synthesize (max 10) |
| `threshold` | float | 0.4 | Similarity threshold for clustering |

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/synthesize?limit=5"
```

**Response:**

```json
{
  "success": true,
  "synthesizedStories": [
    {
      "headline": "SEC Approves Spot Bitcoin ETF Applications",
      "summary": "The SEC approved multiple spot Bitcoin ETF applications...",
      "keyFacts": ["11 ETFs approved", "BlackRock leads volume"],
      "sourceCount": 8,
      "sources": [{"name": "CoinDesk", "url": "..."}],
      "sentiment": "bullish",
      "confidence": 0.92,
      "marketImpact": "high",
      "relatedCoins": ["BTC", "ETH"],
      "disagreements": ["Some sources report 10 ETFs, others 11"]
    }
  ],
  "clustersFound": 12,
  "articlesAnalyzed": 100
}
```

**Use Cases:**
- Reduce noise from duplicate coverage
- Get comprehensive view of major stories
- Identify source disagreements

---

### Trending Explainer

AI-powered explanation for why any topic is trending, with background context and market implications.

**Endpoint:** `GET /api/ai/explain`

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | **required** | Topic to explain (e.g., "Bitcoin", "ETF") |
| `includePrice` | boolean | false | Include price change context |

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/explain?topic=Bitcoin&includePrice=true"
```

**Response:**

```json
{
  "success": true,
  "explanation": {
    "topic": "Bitcoin",
    "whyTrending": "ETF approval driving unprecedented institutional interest",
    "background": "After years of SEC rejections, spot Bitcoin ETFs were finally approved...",
    "keyEvents": [
      {"event": "SEC approves 11 spot ETFs", "date": "2024-01-10", "significance": "Historic milestone"}
    ],
    "marketImplications": "Opens Bitcoin to traditional portfolios",
    "sentiment": "bullish",
    "priceContext": "Up 15% in 24 hours",
    "whatToWatch": ["ETF volume", "Institutional inflows"],
    "relatedTopics": ["ETF", "SEC", "Institutions"]
  },
  "articleCount": 45
}
```

**Use Cases:**
- Quick context on trending topics
- Onboard new users to current events
- Research background for trading decisions

---

### Portfolio News

Scores news articles by relevance to your specific portfolio holdings, categorized by urgency.

**Endpoint:** `POST /api/ai/portfolio-news`

**Request Body:**

```json
{
  "holdings": [
    {"symbol": "BTC", "name": "Bitcoin", "allocation": 0.5},
    {"symbol": "ETH", "name": "Ethereum", "allocation": 0.3},
    {"symbol": "SOL", "name": "Solana", "allocation": 0.2}
  ]
}
```

**Request:**

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/portfolio-news" \
  -H "Content-Type: application/json" \
  -d '{"holdings": [{"symbol": "BTC", "name": "Bitcoin", "allocation": 0.5}]}'
```

**Response:**

```json
{
  "success": true,
  "portfolioSize": 3,
  "articlesAnalyzed": 50,
  "relevantArticles": 12,
  "byUrgency": {"immediate": 2, "important": 5, "informational": 5},
  "articles": {
    "immediate": [
      {
        "articleTitle": "Solana Network Outage Reported",
        "relevanceScore": 95,
        "relevantHoldings": [
          {"symbol": "SOL", "impact": "negative", "reason": "Direct impact"}
        ],
        "urgency": "immediate",
        "actionSuggestion": "Monitor network status"
      }
    ]
  }
}
```

**Urgency Levels:**

| Level | Description |
|-------|-------------|
| `immediate` | Requires immediate attention (>80 relevance) |
| `important` | Should review soon (60-80 relevance) |
| `informational` | Good to know (40-60 relevance) |

---

### News-Price Correlation

Detects potential correlations between news articles and cryptocurrency price movements.

**Endpoint:** `GET /api/ai/correlation`

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/correlation"
```

**Response:**

```json
{
  "success": true,
  "correlations": [
    {
      "article": "SEC Chair Hints at Ethereum ETF Approval",
      "coin": "ETH",
      "priceMove": 8.5,
      "confidence": 0.85,
      "explanation": "Regulatory news directly impacted price",
      "timing": "News came 15 mins before price surge"
    }
  ],
  "summary": "Strong correlation between regulatory news and large-cap prices today",
  "significantMovers": [
    {"symbol": "ETH", "price": 3500, "change1h": 5.2, "change24h": 12.3}
  ],
  "articlesAnalyzed": 50,
  "coinsAnalyzed": 50
}
```

**Use Cases:**
- Understand what's moving markets
- Validate trading hypotheses
- Research news impact patterns

---

### Flash Briefing

Ultra-short AI-generated summary of top crypto stories. Perfect for voice assistants, notifications, or quick updates.

**Endpoint:** `GET /api/ai/flash-briefing`

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stories` | integer | 5 | Number of stories to include (max 10) |

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/flash-briefing?stories=3"
```

**Response:**

```json
{
  "success": true,
  "briefing": "Crypto markets are buzzing today with Bitcoin pushing past $100k...",
  "stories": [
    {
      "headline": "Bitcoin Breaks $100k",
      "oneLineSummary": "BTC hits all-time high on institutional demand",
      "sentiment": "bullish"
    }
  ],
  "marketMood": "bullish",
  "articlesAnalyzed": 50
}
```

**Integration Ideas:**
- Alexa/Google Home skills
- Morning notification digests
- Slack/Discord bots
- Apple Watch complications

---

### Narrative Tracker

Tracks crypto narratives through their complete lifecycle: emerging → growing → peak → declining → dormant.

**Endpoint:** `GET /api/ai/narratives`

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `predict` | string | - | Get prediction for specific narrative |

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/narratives"
```

**Response:**

```json
{
  "success": true,
  "activeNarratives": [
    {
      "id": "bitcoin-etf",
      "name": "Bitcoin ETF",
      "lifecycle": "peak",
      "strength": 95,
      "velocity": 0.1,
      "sentiment": 0.8,
      "relatedCoins": ["BTC"],
      "prediction": {
        "nextPhase": "Narrative will stabilize as ETF becomes normalized",
        "confidence": 0.7,
        "timeframe": "2-4 weeks"
      }
    }
  ],
  "emergingNarratives": [...],
  "decliningNarratives": [...],
  "marketCycle": {
    "cyclePhase": "markup",
    "confidence": 0.7,
    "dominantNarratives": ["Bitcoin ETF", "Institutional Adoption"],
    "historicalAnalog": "Similar to Q4 2020 - Early 2021 bull run"
  }
}
```

**Lifecycle Phases:**

| Phase | Description |
|-------|-------------|
| `emerging` | New narrative gaining traction (<30 strength) |
| `growing` | Rapidly expanding coverage (30-60 strength) |
| `peak` | Maximum attention (>80 strength, slowing velocity) |
| `declining` | Fading interest (dropping strength) |
| `dormant` | Minimal coverage (<10 strength) |

---

### Cross-Lingual Intelligence

Detects when Asian/European sources break news before Western sources. Identifies regional sentiment divergence for potential alpha signals.

**Endpoint:** `GET /api/ai/cross-lingual`

**Request:**

```bash
curl "https://cryptocurrency.cv/api/ai/cross-lingual"
```

**Response:**

```json
{
  "success": true,
  "alphaSignals": [
    {
      "topic": "New Binance regulatory compliance",
      "firstRegion": "asia",
      "firstSource": "Block Media (Korea)",
      "confidence": 0.85,
      "potentialImpact": "medium",
      "summary": "First reported 2 hours before English sources",
      "relatedCoins": ["BNB"]
    }
  ],
  "regionalSentiments": [
    {
      "region": "asia",
      "overallSentiment": "bullish",
      "confidence": 0.75,
      "topTopics": ["Bitcoin ETF", "Korean adoption"],
      "divergenceFromGlobal": 0.15
    }
  ],
  "divergenceAlerts": [
    {
      "topic": "Altcoin season",
      "asianSentiment": "bullish",
      "westernSentiment": "neutral",
      "significance": "Asian traders may be front-running altcoin moves"
    }
  ],
  "articleCounts": {"asia": 45, "europe": 30, "anglosphere": 80}
}
```

**Regions Analyzed:**

| Region | Languages | Sources |
|--------|-----------|---------|
| Asia | Korean, Chinese, Japanese | 25+ sources |
| Europe | German, French, Italian, Spanish | 15+ sources |
| Anglosphere | English | 130+ sources |

---

### Source Quality Scoring

AI-powered analysis of news source quality, reliability, and clickbait detection.

**Endpoint:** `GET /api/ai/source-quality`

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | - | Analyze specific source |
| `category` | string | - | Rank sources in category |
| `clickbait` | boolean | false | Detect clickbait articles |

**Analyze Source:**

```bash
curl "https://cryptocurrency.cv/api/ai/source-quality?source=CoinDesk"
```

```json
{
  "success": true,
  "sourceQuality": {
    "sourceName": "CoinDesk",
    "overallScore": 85,
    "accuracyScore": 88,
    "speedScore": 82,
    "originalityScore": 90,
    "clickbaitScore": 15,
    "strengths": ["Original reporting", "Fast breaking news"],
    "weaknesses": ["Occasional sponsored content"],
    "bestFor": ["Breaking news", "Regulatory coverage"],
    "trustLevel": "high"
  }
}
```

**Detect Clickbait:**

```bash
curl "https://cryptocurrency.cv/api/ai/source-quality?clickbait=true"
```

```json
{
  "success": true,
  "articlesAnalyzed": 50,
  "clickbaitCount": 8,
  "clickbaitPercentage": "16.0",
  "worstOffenders": [
    {
      "title": "YOU WON'T BELIEVE What Bitcoin Did!!!",
      "source": "CryptoHype",
      "isClickbait": true,
      "score": 85,
      "reasons": ["Sensational keywords", "Excessive punctuation"]
    }
  ]
}
```

**Quality Scores:**

| Score | Meaning |
|-------|---------|
| 90-100 | Excellent - Tier 1 source |
| 70-89 | Good - Reliable for most content |
| 50-69 | Average - Verify important claims |
| <50 | Poor - Use with caution |

---

### Research Agent

Deep-dive AI research on any crypto topic. Generates comprehensive reports with investment thesis, risks, and opportunities.

**Endpoint:** `GET /api/ai/research`

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | **required** | Topic to research |
| `mode` | string | full | `full` for complete report, `quick` for quick take |
| `compare` | string | - | Compare assets: `BTC,ETH` |
| `contrarian` | boolean | false | Find contrarian opportunities |

**Full Research Report:**

```bash
curl "https://cryptocurrency.cv/api/ai/research?topic=Solana"
```

```json
{
  "success": true,
  "report": {
    "topic": "Solana",
    "executiveSummary": "Solana experiencing renewed institutional interest...",
    "newsAnalysis": {
      "totalArticles": 35,
      "sentimentBreakdown": {"bullish": 60, "bearish": 15, "neutral": 25},
      "keyThemes": ["Network reliability", "DeFi growth"],
      "recentDevelopments": [
        {"date": "2026-02-01", "event": "TVL hits $10B", "significance": "high"}
      ]
    },
    "investmentThesis": {
      "bullCase": {
        "summary": "Technical improvements position Solana for gains",
        "arguments": ["Improved uptime", "Growing TVL"],
        "priceTarget": "$300-400",
        "confidence": 0.65
      },
      "bearCase": {
        "summary": "Competition and past issues remain concerns",
        "arguments": ["Ethereum L2 competition", "Historical outages"],
        "confidence": 0.55
      },
      "verdict": "bullish"
    },
    "risks": [
      {"risk": "Network outage", "severity": "high", "probability": 0.2}
    ],
    "opportunities": [
      {"opportunity": "DeFi TVL growth", "timeframe": "medium term", "potentialReturn": "50-100%"}
    ]
  }
}
```

**Quick Take:**

```bash
curl "https://cryptocurrency.cv/api/ai/research?topic=DeFi&mode=quick"
```

**Compare Assets:**

```bash
curl "https://cryptocurrency.cv/api/ai/research?compare=BTC,ETH"
```

**Contrarian Opportunities:**

```bash
curl "https://cryptocurrency.cv/api/ai/research?contrarian=true"
```

```json
{
  "success": true,
  "opportunities": [
    {
      "asset": "XRP",
      "currentSentiment": -0.6,
      "contraryReason": "Oversold on FUD, legal clarity improving",
      "potentialCatalysts": ["SEC case resolution", "Utility expansion"],
      "riskLevel": "high",
      "confidence": 0.6
    }
  ]
}
```

---

## Best Practices

### Caching

Results are cached for 24 hours. Same inputs return cached results:

```typescript
// These will use the same cached result
await summarize('Bitcoin Hits ATH', content);
await summarize('Bitcoin Hits ATH', content); // Cached
```

### Rate Limiting

- API requests are rate-limited by provider
- OpenAI: ~3,500 RPM (requests per minute)
- Anthropic: ~1,000 RPM
- Groq: ~30 RPM (free tier)

### Error Handling

```typescript
try {
  const result = await client.ai.summarize(title, content);
} catch (error) {
  if (error.status === 503) {
    console.log('AI not configured');
  } else if (error.status === 429) {
    console.log('Rate limited, retry later');
  } else {
    console.log('AI error:', error.message);
  }
}
```

### Content Length

- Maximum content: 3,000 characters (auto-truncated)
- Title: Optional but improves accuracy
- For longer content, split into sections

### Cost Optimization

| Action | Tokens (approx) | Cost (GPT-4o-mini) |
|--------|-----------------|-------------------|
| Summarize (short) | ~200 | $0.0001 |
| Sentiment | ~300 | $0.0002 |
| Facts | ~500 | $0.0003 |
| Fact Check | ~600 | $0.0004 |
| Questions | ~200 | $0.0001 |
| Categorize | ~200 | $0.0001 |
| Translate | ~varies | ~$0.0003/1000 chars |

### Provider Selection

| Need | Recommended |
|------|-------------|
| Best quality | OpenAI (gpt-4o) |
| Best value | Groq (free tier) |
| Fastest | Groq (Mixtral) |
| Privacy | Anthropic (Claude) |
| Flexibility | OpenRouter |

---

## Existing AI Endpoints

The original AI endpoints are still available:

| Endpoint | Description |
|----------|-------------|
| `/api/summarize` | Quick article summaries |
| `/api/ask?q=...` | Ask questions about news |
| `/api/digest` | AI daily digest |
| `/api/sentiment` | Article sentiment |
| `/api/entities` | Entity extraction |
| `/api/factcheck` | Fact verification |

The new `/api/ai` endpoint provides a unified interface with more options.

---

## Need Help?

- 📖 [API Documentation](./API.md)
- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
---

## AI Market Intelligence Agent

The AI Market Agent provides revolutionary market analysis through multi-source signal aggregation and natural language insights.

**Endpoint:** `GET /api/ai/agent` or `POST /api/ai/agent`

### Features

| Feature | Description |
|---------|-------------|
| **Regime Detection** | Identifies market phases: accumulation, markup, distribution, markdown, ranging, capitulation, euphoria |
| **Signal Aggregation** | Synthesizes signals from news, social, on-chain, technical, derivatives, whale activity |
| **Trading Opportunities** | Generates actionable trading ideas with entry/exit levels |
| **Risk Alerts** | Real-time risk monitoring with severity scoring |
| **Natural Language Interface** | Ask questions in plain English |

### Signal Sources

| Source | Signal Types |
|--------|--------------|
| `news` | News catalysts, regulatory events |
| `social` | Sentiment shifts, narrative momentum |
| `on-chain` | Whale movements, smart money flows |
| `technical` | Breakouts, divergences |
| `derivatives` | Funding extremes, OI divergence, liquidations |
| `whale` | Large transfers, accumulation patterns |
| `smart-money` | Institutional flow tracking |

### Signal Types

| Type | Description |
|------|-------------|
| `sentiment-shift` | Major change in market sentiment |
| `volume-spike` | Unusual trading volume |
| `whale-movement` | Large wallet transfers |
| `liquidation-cascade` | Mass liquidation events |
| `funding-extreme` | Extreme funding rates |
| `oi-divergence` | Open interest divergence |
| `news-catalyst` | Market-moving news events |
| `regulatory-event` | Regulatory announcements |
| `smart-money-flow` | Institutional movements |
| `narrative-momentum` | Trending narrative strength |
| `correlation-break` | Unusual correlation changes |
| `regime-change` | Market phase transition |
| `anomaly` | Detected anomalies |

### GET Request (Market Intelligence)

```bash
# Full market intelligence
curl "https://cryptocurrency.cv/api/ai/agent"

# Summary format
curl "https://cryptocurrency.cv/api/ai/agent?format=summary"

# Signals only
curl "https://cryptocurrency.cv/api/ai/agent?format=signals"

# Trading opportunities
curl "https://cryptocurrency.cv/api/ai/agent?format=opportunities"

# Risk alerts
curl "https://cryptocurrency.cv/api/ai/agent?format=risks"
```

### POST Request (Query the Agent)

```bash
curl -X POST "https://cryptocurrency.cv/api/ai/agent" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is driving Bitcoin price action today?",
    "assets": ["BTC"],
    "timeHorizon": "1d",
    "focusAreas": ["news", "technical", "derivatives"]
  }'
```

### Response Structure

```json
{
  "success": true,
  "data": {
    "overallRegime": "markup",
    "regimeConfidence": 75,
    "fearGreedIndex": 65,
    "volatilityRegime": "medium",
    "dominantNarrative": "ETF inflows driving institutional adoption",
    "activeSignals": [...],
    "topOpportunities": [...],
    "riskAlerts": [...],
    "marketNarrative": "Bitcoin continues its upward trajectory...",
    "sectorRotation": [...],
    "correlationAnomalies": [...],
    "keyLevels": [...],
    "upcomingCatalysts": [...],
    "generatedAt": "2026-01-22T10:30:00Z"
  }
}
```

---

## The Oracle (AI Chat Interface)

The Oracle provides a natural language query interface for cryptocurrency intelligence.

**Endpoint:** `POST /api/oracle` or `GET /api/ai/oracle`

### Features

- Conversation sessions with context memory
- Structured or natural responses
- Market data integration
- News context integration
- Rate limiting (10/hour anonymous, 100/hour authenticated)

### Request

```bash
curl -X POST "https://cryptocurrency.cv/api/oracle" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is happening with Bitcoin today?",
    "sessionId": "optional-session-id",
    "options": {
      "includeMarketData": true,
      "includeNews": true,
      "responseFormat": "structured"
    }
  }'
```

### Response

```json
{
  "success": true,
  "response": {
    "answer": "Bitcoin is showing strength today...",
    "confidence": 0.85,
    "sources": [...],
    "relatedQueries": [
      "What is driving the rally?",
      "What are the key resistance levels?"
    ],
    "marketContext": {...}
  }
}
```

---

## AI Content Detection

Detect AI-generated content in news articles using statistical and linguistic analysis. Works entirely offline - no external APIs required.

**Endpoint:** `POST /api/detect/ai-content`

### Detection Methods

| Method | Description |
|--------|-------------|
| **Perplexity** | N-gram frequency analysis (lower = more likely AI) |
| **Burstiness** | Sentence length variance (higher = more human) |
| **Vocabulary** | Type-Token Ratio and hapax legomena |
| **Stylometry** | Avg sentence/word length, punctuation density |
| **Patterns** | Repetitive structures, formulaic openings |
| **Phrases** | Common AI phrases detection (high/medium/low confidence) |

### Request (Single Text)

```bash
curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "In today'\''s fast-paced world of cryptocurrency..."
  }'
```

### Request (Batch)

```bash
curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Article 1 content...", "Article 2 content..."]
  }'
```

### Quick Check (Faster, Less Detailed)

```bash
curl -X POST "https://cryptocurrency.cv/api/detect/ai-content" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Content to check...",
    "quick": true
  }'
```

### Response

```json
{
  "mode": "full",
  "isLikelyAI": true,
  "confidence": 78,
  "humanScore": 22,
  "verdict": "likely_ai",
  "analysis": {
    "perplexity": {
      "score": 0.35,
      "ngramFrequency": 0.8,
      "unusualWordRatio": 0.05,
      "description": "Low perplexity suggests predictable text patterns"
    },
    "burstiness": {
      "score": 0.25,
      "sentenceLengthVariance": 12,
      "paragraphLengthVariance": 8,
      "rhythmScore": 0.3,
      "description": "Low burstiness indicates uniform sentence structure"
    },
    "vocabulary": {...},
    "stylometry": {...},
    "patterns": {...},
    "phrases": {
      "aiPhrasesFound": ["in today's fast-paced world", "it's important to note"],
      "aiPhraseCount": 2,
      "hedgingLanguage": 0.15,
      "overlyFormalTone": 0.6,
      "description": "Multiple high-confidence AI phrases detected"
    }
  },
  "signals": [...],
  "explanation": "Text shows characteristics typical of AI generation...",
  "recommendations": ["Consider verifying source", "Check for attribution"],
  "timestamp": "2026-01-22T10:30:00Z"
}
```

### Verdict Scale

| Verdict | Confidence Range | Description |
|---------|------------------|-------------|
| `human` | 0-20% | Very likely human-written |
| `likely_human` | 20-40% | Probably human-written |
| `uncertain` | 40-60% | Cannot determine |
| `likely_ai` | 60-80% | Probably AI-generated |
| `ai` | 80-100% | Very likely AI-generated |

---

## Enterprise Entity Extraction

Extract comprehensive named entities from crypto news with relationship mapping.

**Endpoint:** `GET /api/entities` or `POST /api/ai/entities`

### Entity Types

| Type | Examples |
|------|----------|
| `person` | CEOs, founders, analysts |
| `organization` | Companies, DAOs, foundations |
| `cryptocurrency` | Bitcoin, Ethereum |
| `token` | Specific tokens mentioned |
| `exchange` | Binance, Coinbase, Kraken |
| `protocol` | Uniswap, Aave, Lido |
| `event` | Conferences, launches |
| `regulation` | Laws, regulatory actions |
| `technology` | Blockchain tech, features |
| `location` | Countries, cities |
| `financial_metric` | Prices, market caps, percentages |

### Request

```bash
curl "https://cryptocurrency.cv/api/entities?limit=30&type=person"
```

### Response

```json
{
  "entities": [
    {
      "id": "ent_abc123",
      "name": "Vitalik Buterin",
      "type": "person",
      "mentions": 5,
      "sentiment": 0.6,
      "confidence": 0.95,
      "aliases": ["Vitalik", "Buterin"],
      "context": ["Ethereum founder Vitalik Buterin announced..."]
    }
  ],
  "totalMentions": 127,
  "dominantEntities": [...],
  "entityGraph": {...},
  "byType": {
    "person": 12,
    "organization": 8,
    "cryptocurrency": 15
  }
}
```

---

## Relationship Extraction

Extract entity relationships and build knowledge graphs from news content.

**Endpoint:** `GET /api/relationships` or `POST /api/ai/relationships`

### Relationship Types

| Type | Description | Example |
|------|-------------|---------|
| `partnership` | Business partnership | "Coinbase partners with BlackRock" |
| `competition` | Competitive relationship | "Binance vs FTX market share" |
| `investment` | Investment activity | "a16z invests in Uniswap" |
| `acquisition` | M&A activity | "Circle acquires Poloniex" |
| `collaboration` | Technical collaboration | "Polygon collaborates with Ethereum" |
| `conflict` | Disputes or legal action | "SEC vs Ripple lawsuit" |
| `regulation` | Regulatory oversight | "SEC regulates crypto exchanges" |
| `development` | Development activity | "Ethereum develops rollups" |
| `market_impact` | Market influence | "Bitcoin impacts altcoin prices" |
| `mention` | General mention | "Elon Musk mentions Dogecoin" |
| `association` | General association | "Vitalik associated with Ethereum" |

### Response

```json
{
  "relationships": [
    {
      "id": "rel_abc123",
      "source": "BlackRock",
      "target": "Bitcoin ETF",
      "type": "investment",
      "strength": 0.9,
      "sentiment": 0.8,
      "evidence": ["BlackRock's Bitcoin ETF sees record inflows"],
      "confidence": 0.95
    }
  ],
  "entityCount": 45,
  "relationshipCount": 23,
  "clusters": [
    {
      "id": "cluster_1",
      "name": "Institutional Adoption",
      "entities": ["BlackRock", "Fidelity", "Bitcoin ETF"],
      "centralEntity": "Bitcoin ETF",
      "theme": "ETF-driven institutional investment"
    }
  ],
  "processingTime": 1250
}
```

---

## Event Classification

Automatically classify crypto news events by type with confidence scoring.

**Endpoint:** `POST /api/classify`

### Event Types (13 Categories)

| Type | Description | Examples |
|------|-------------|----------|
| `funding_round` | Fundraising events | Series A, seed, Series B |
| `hack_exploit` | Security breaches | Flash loan attack, bridge hack |
| `regulation` | Government/legal actions | SEC lawsuit, CFTC guidance |
| `product_launch` | New products/features | Platform launch, feature release |
| `partnership` | Business partnerships | Strategic alliance |
| `listing` | Exchange listings | Binance listing, Coinbase listing |
| `airdrop` | Token distributions | Governance token airdrop |
| `network_upgrade` | Protocol upgrades | Hard fork, migration |
| `legal_action` | Lawsuits, enforcement | SEC enforcement, class action |
| `market_movement` | Price/market analysis | Bull run, correction |
| `executive_change` | Leadership changes | CEO hired, founder steps down |
| `acquisition` | M&A activity | Merger, buyout |
| `general` | Other news | General crypto news |

### Request

```bash
curl -X POST "https://cryptocurrency.cv/api/classify" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Coinbase Raises $500M in Series E Funding",
    "content": "Cryptocurrency exchange Coinbase announced today..."
  }'
```

### Response

```json
{
  "classification": {
    "eventType": "funding_round",
    "confidence": 0.95,
    "subType": "Series E",
    "entities": {
      "primary": "Coinbase",
      "secondary": ["cryptocurrency exchange"]
    },
    "magnitude": {
      "value": 500000000,
      "unit": "USD"
    },
    "urgency": "important",
    "marketRelevance": "high"
  },
  "processingTime": 450
}
```

---

## Claim Extraction

Extract verifiable claims with proper attribution from news articles.

**Endpoint:** `POST /api/claims`

### Claim Types

| Type | Description |
|------|-------------|
| `fact` | Verifiable facts (amounts, dates, events) |
| `opinion` | Subjective views or assessments |
| `prediction` | Forward-looking statements |
| `announcement` | Official declarations |

### Verifiability Levels

| Level | Description |
|-------|-------------|
| `verifiable` | Can be fact-checked with data/sources |
| `subjective` | Opinion-based, cannot be objectively verified |
| `future` | Will only be verifiable in the future |

### Response

```json
{
  "result": {
    "claims": [
      {
        "claim": "Coinbase raised $300 million in Series E funding",
        "attribution": {
          "source": "Coinbase press release",
          "role": "Official statement",
          "organization": "Coinbase"
        },
        "type": "fact",
        "verifiability": "verifiable",
        "relatedEntities": ["Coinbase", "Series E"],
        "timestamp": "2026-01-22"
      }
    ],
    "primaryNarrative": "Coinbase secures major funding round",
    "conflictingClaims": false
  },
  "quality": {
    "totalClaims": 5,
    "verifiableClaims": 3,
    "hasAttribution": 4,
    "qualityScore": 85
  },
  "processingTime": 890
}
```

---

## Intelligence Features

### Anomaly Detection

Detect unusual patterns in news flow.

**Endpoint:** `GET /api/analytics/anomalies`

#### Anomaly Types

| Type | Description | Threshold |
|------|-------------|-----------|
| `volume_spike` | Article volume surge | >3 std dev from mean |
| `coordinated_publishing` | Multiple sources, similar content | 3+ sources in 5 min, >80% similarity |
| `sentiment_shift` | Dramatic sentiment change | >0.4 shift in 6 hours |
| `ticker_surge` | Ticker mention spike | 5x baseline |
| `source_outage` | Source goes silent | 12+ hours silence |
| `unusual_timing` | Off-hours publishing | Statistical anomaly |

### Headline Tracking

Track how headlines change over time.

**Endpoint:** `GET /api/analytics/headlines`

### Causal Inference

Analyze causal relationships between news and market movements.

**Endpoint:** `GET /api/analytics/causality` or `POST /api/analytics/causality`

#### Analysis Methods

| Method | Description |
|--------|-------------|
| `granger` | Granger causality test |
| `diff_in_diff` | Difference-in-differences |
| `event_study` | Event study with abnormal returns |
| `synthetic_control` | Synthetic control method |
| `regression_discontinuity` | Regression discontinuity design |

### Regulatory Intelligence

Multi-jurisdictional regulatory tracking.

**Endpoint:** `GET /api/regulatory`

#### Covered Jurisdictions (15)

| Region | Jurisdictions |
|--------|---------------|
| Americas | US, Canada, Brazil |
| Europe | EU (MiCA), UK, Switzerland |
| Asia-Pacific | Japan, Singapore, Hong Kong, South Korea, Australia, China, India |
| Middle East | UAE |
| Global | International orgs |

#### Covered Agencies (30+)

- **US:** SEC, CFTC, FinCEN, OCC, FDIC, Fed, DOJ, IRS, NYSDFS
- **EU:** ESMA, EBA, ECB, MiCA framework
- **UK:** FCA, BoE, PRA
- **Asia:** JFSA, MAS, SFC, HKMA, FSC-KR, ASIC, RBI, PBoC
- **Global:** FINMA, FATF, BIS, IMF, FSB

### Prediction Tracking

Track and score predictions.

**Endpoint:** `GET /api/predictions` or `POST /api/predictions`

#### Prediction Types

| Type | Description |
|------|-------------|
| `price_above` | Price exceeds target |
| `price_below` | Price drops below target |
| `price_range` | Price stays in range |
| `percentage_up` | Percentage increase |
| `percentage_down` | Percentage decrease |
| `event` | Event occurrence |
| `trend` | Trend prediction |
| `dominance` | Market dominance |
| `custom` | Custom prediction |

### Influencer Tracking

Score influencer reliability.

**Endpoint:** `GET /api/influencers`

#### Metrics

| Metric | Description |
|--------|-------------|
| `reliabilityScore` | Overall reliability (0-100) |
| `accuracyRate` | Percentage of correct calls |
| `avgReturn` | Average return per call |
| `sharpeRatio` | Risk-adjusted returns |
| `maxDrawdown` | Worst peak-to-trough decline |
| `sentimentBias` | -1 (perma-bear) to 1 (perma-bull) |

### Citation Network

Academic citation tracking and bibliometric analysis.

**Endpoint:** `GET /api/citations`

#### Features

- Citation graph construction
- H-index computation
- Co-citation analysis
- Research front detection
- Export to BibTeX, RIS, CSL-JSON

---

## Translation Service

Translate news content to 18 languages.

**Endpoint:** `GET /api/i18n/translate` or `/api/news?lang=xx`

### Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| `en` | English | `ko` | 한국어 |
| `es` | Español | `ar` | العربية |
| `fr` | Français | `ru` | Русский |
| `de` | Deutsch | `it` | Italiano |
| `pt` | Português | `nl` | Nederlands |
| `ja` | 日本語 | `pl` | Polski |
| `zh-CN` | 简体中文 | `tr` | Türkçe |
| `zh-TW` | 繁體中文 | `vi` | Tiếng Việt |
| | | `th` | ไทย |
| | | `id` | Bahasa Indonesia |

### Requirements

- `GROQ_API_KEY` environment variable
- `FEATURE_TRANSLATION=true` to enable real-time translation
- Translations cached for 7 days

---

## Provider Comparison

| Provider | Model | Speed | Quality | Cost | Best For |
|----------|-------|-------|---------|------|----------|
| **Groq** | llama-3.3-70b | ⚡⚡⚡ | ⭐⭐⭐⭐ | FREE | Development, high-volume |
| **OpenAI** | gpt-4o-mini | ⚡⚡ | ⭐⭐⭐⭐⭐ | $0.15/1M | Production, best quality |
| **Anthropic** | claude-3-haiku | ⚡⚡ | ⭐⭐⭐⭐ | $0.25/1M | Privacy-focused |
| **OpenRouter** | Various | ⚡⚡ | ⭐⭐⭐ | Varies | Model flexibility |