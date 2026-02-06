# Postman Collection

Import the collection into Postman to explore the Free Crypto News API.

## Quick Import

1. Open Postman
2. Click **Import** (top left)
3. Drag `Free_Crypto_News_API.postman_collection.json` or paste the URL:

```
https://raw.githubusercontent.com/nirholas/free-crypto-news/main/postman/Free_Crypto_News_API.postman_collection.json
```

## Endpoints Included

### News
- Get Latest News
- Search News
- Get DeFi News
- Get Bitcoin News
- Get Breaking News
- Get Trending Topics

### Analytics
- Analyze News (Sentiment)
- Get Statistics
- Get Archive
- Find Original Sources

### Meta
- List Sources
- Health Check

### Feeds
- RSS Feed
- Atom Feed
- OPML Export

### Push Notifications
- Get VAPID Public Key
- Subscribe to Push
- Unsubscribe from Push
- Update Subscription Topics

### Webhooks
- Webhook Info
- Register Webhook
- Test Webhook Payload

## Variables

| Variable | Default Value |
|----------|---------------|
| `baseUrl` | `https://cryptocurrency.cv` |

Change `baseUrl` to test against your self-hosted instance.

## No Authentication Required! 🆓

All endpoints work without API keys.
