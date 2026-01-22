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
- [SDK Usage](#sdk-usage)
- [Best Practices](#best-practices)

---

## Overview

Free Crypto News provides AI-powered features for deeper news analysis:

| Feature | Description |
|---------|-------------|
| **Summarization** | Generate concise article summaries |
| **Sentiment Analysis** | Analyze market sentiment with confidence scores |
| **Fact Extraction** | Extract entities, numbers, dates |
| **Fact Checking** | Verify claims in articles |
| **Question Generation** | Generate follow-up questions |
| **Categorization** | Auto-categorize articles |
| **Translation** | Translate content to any language |
| **Daily Brief** | Comprehensive daily crypto news digest |
| **Bull vs Bear Debate** | Generate balanced perspectives on any topic |
| **Counter-Arguments** | Challenge claims with counter-arguments |

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
curl https://free-crypto-news.vercel.app/api/ai
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl -X POST https://free-crypto-news.vercel.app/api/ai \
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
curl "https://free-crypto-news.vercel.app/api/ai/brief?date=2026-01-22&format=full"
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
curl -X POST "https://free-crypto-news.vercel.app/api/ai/debate" \
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
curl -X POST "https://free-crypto-news.vercel.app/api/ai/counter" \
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
