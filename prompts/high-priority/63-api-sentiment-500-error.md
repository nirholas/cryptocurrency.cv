# 63 — Fix /api/sentiment Returning 500 Internal Server Error

## Goal

Fix the 500 error on the sentiment API endpoint:

```
GET /api/sentiment?limit=30  500 (Internal Server Error)
```

## Context

- **Framework:** Next.js 16 with App Router on Vercel
- **File:** `src/app/api/sentiment/route.ts`
- **Runtime:** `edge`
- **Revalidate:** 300 (5 minutes ISR)
- **Dependencies:** Imports `getLatestNews`, `promptAIJson`, `AIAuthError` from internal libs; uses telemetry middleware (`instrumented`)
- **Behavior:** Fetches latest news articles, then calls an AI model (via `promptAIJson`) to generate sentiment analysis with fields: `sentiment`, `confidence` (0-100), `reasoning`, `impactLevel`, `timeHorizon`, `affectedAssets`

## Likely Root Causes

1. **AI provider authentication failure** — The `AIAuthError` import suggests the route handles missing/invalid API keys. If the AI provider key (Groq, OpenAI, etc.) is not configured or expired, it would 500.
2. **Edge runtime incompatibility** — Same issue as #62. The route uses `runtime: 'edge'` but may import Node.js-only code transitively through telemetry or the AI client library.
3. **News data fetch failure** — If `getLatestNews()` fails (upstream 503 or empty data), the AI prompt may crash on empty input.
4. **AI response parsing failure** — `promptAIJson` expects structured JSON from the AI model. Malformed responses would throw.

## Task

### 1. Check the AI provider configuration

Verify the AI provider API key is set in Vercel environment variables:
```bash
# Check which AI provider is used
grep -rn 'GROQ_API_KEY\|OPENAI_API_KEY\|AI_API_KEY\|ANTHROPIC_API_KEY' src/lib/
```

Ensure the key is configured in Vercel dashboard → Settings → Environment Variables.

### 2. Audit edge compatibility

Check if `promptAIJson` or `getLatestNews` use Node.js APIs:
```bash
grep -rn "import.*from" src/app/api/sentiment/route.ts
# Then trace each import for Node.js API usage
```

If incompatible, switch to Node.js runtime by removing `export const runtime = 'edge'`.

### 3. Add robust error handling

```typescript
export async function GET(request: Request) {
  try {
    const news = await getLatestNews();
    if (!news || news.length === 0) {
      return Response.json(
        { error: 'No news data available for sentiment analysis' },
        { status: 503 }
      );
    }
    const sentiment = await promptAIJson(/* ... */);
    return Response.json(sentiment);
  } catch (error) {
    if (error instanceof AIAuthError) {
      console.error('[sentiment] AI authentication failed:', error.message);
      return Response.json(
        { error: 'Sentiment analysis temporarily unavailable' },
        { status: 503 }
      );
    }
    console.error('[sentiment] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Add a fallback/cached response

If the AI call fails, return the last cached sentiment data rather than a 500:
- Check if Redis has a cached sentiment result
- Return stale data with a `X-Cache: stale` header
- Log the failure for monitoring

## Acceptance Criteria

- [ ] `GET /api/sentiment?limit=30` returns 200 with valid sentiment JSON
- [ ] AI authentication errors return 503 with helpful message (not 500)
- [ ] Empty news data handled gracefully
- [ ] Edge runtime compatibility verified or switched to Node.js
- [ ] Fallback to cached data when AI provider is down
