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
