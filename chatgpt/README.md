# ChatGPT Custom GPT Integration

Use the Free Crypto News API in your Custom GPT!

## Setup Instructions

1. Go to [ChatGPT](https://chat.openai.com) → Explore GPTs → Create
2. Click "Configure" → scroll to "Actions" → "Create new action"
3. Copy the contents of `openapi.yaml` and paste into the schema editor
4. No authentication required! Leave auth settings empty
5. Save and test your GPT

## Example GPT Instructions

Add this to your GPT's instructions:

```
You are a crypto news assistant. You have access to real-time crypto news from 130+ sources.

When users ask about crypto news:
1. Use getLatestNews for general news
2. Use searchNews when they mention specific topics
3. Use getDefiNews for DeFi-related queries
4. Use getBitcoinNews for Bitcoin-related queries
5. Use getBreakingNews for "what's happening now" queries
6. Use getTrendingTopics for trending topics and sentiment
7. Use analyzeNews for sentiment analysis
8. Use getArchive for historical news
9. Use findOriginalSources to trace news origins

Always format the news nicely with:
- 📰 Headline
- 🔗 Link
- ⏰ Time ago
- 📌 Source
```

## Available Actions

| Action | Description |
|--------|-------------|
| `getLatestNews` | Get latest crypto news |
| `searchNews` | Search by keywords |
| `getDefiNews` | DeFi-specific news |
| `getBitcoinNews` | Bitcoin-specific news |
| `getBreakingNews` | Breaking news (last 2h) |
| `getTrendingTopics` | Trending topics with sentiment |
| `getStats` | API statistics |
| `analyzeNews` | News with sentiment analysis |
| `getArchive` | Historical news archive |
| `findOriginalSources` | Trace news origins |

## Test Prompts

**Basic News:**
- "What's the latest crypto news?"
- "Any news about Ethereum ETF?"
- "What's happening in DeFi?"
- "Breaking crypto news"
- "Bitcoin news from today"

**Analytics:**
- "What are the trending crypto topics?"
- "Is market sentiment bullish or bearish?"
- "Analyze recent news about Bitcoin"

**Historical:**
- "What crypto news happened last week?"
- "Find the original source of the SEC news"
