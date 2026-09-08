# 💎 Premium Features

Premium tier features and API access for Free Crypto News.

---

## Overview

The core news and market endpoints stay free and keyless. Paid tiers unlock the
rest of the surface for power users, traders and institutions.

---

## Tiers

Tier definitions live in `src/lib/x402/pricing.ts` (`API_TIERS`), which is the
single source of truth for what follows.

| | Anonymous (free tier) | x402 pay-per-request | Pro | Enterprise |
|---|---|---|---|---|
| **Price** | Free | $0.001 / request | **$29/mo** | **$99/mo** |
| **Rate limit** | 120 req/hour per IP | Per payment | 50,000/day (500/min) | 500,000/day (2,000/min) |
| **API key** | None needed | None needed | Yes | Yes |
| **News API** | ✅ (3 articles/request) | ✅ full | ✅ full | ✅ full |
| **Market, DeFi, sources, archive** | ✅ | ✅ | ✅ | ✅ |
| **AI endpoints** | ❌ | ✅ | ✅ | ✅ |
| **Trading signals** | ❌ | ✅ | ✅ | ✅ |
| **Whale alerts** | ❌ | ✅ | ✅ | ✅ |
| **Historical data** | Archive endpoints | Per request | 1 year | Full history |
| **Export formats** | JSON | JSON | JSON, CSV | JSON, CSV |
| **Priority routing / dedicated cache** | ❌ | ❌ | ❌ | ✅ |
| **Support** | Community | Community | Priority | Dedicated |
| **SLA** | — | — | — | 99.9% |

!!! warning "The free API-key tier is discontinued"
    Free API keys are no longer issued. `API_TIERS.free` still exists so that
    previously-issued keys resolve, but its quota is zero. The free path is now
    the **anonymous free tier** described above (no key at all), plus
    `/api/sample` for a preview and x402 micropayments for pay-per-request
    access to paid endpoints.

---

## Premium Endpoints

All premium endpoints require authentication via API key:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://cryptocurrency.cv/api/premium/..."
```

---

### Trading Signals

#### GET /api/premium/ai/signals

Advanced AI trading signals with backtesting.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `assets` | string | all | Comma-separated assets |
| `strategy` | string | momentum | momentum, mean_reversion, trend |
| `timeframe` | string | 4h | 1h, 4h, 1d, 1w |
| `backtest` | boolean | false | Include historical performance |

**Response:**

```json
{
  "signals": [
    {
      "asset": "BTC",
      "action": "buy",
      "confidence": 0.85,
      "entry": 98500,
      "target": 105000,
      "stopLoss": 94000,
      "riskReward": 2.1,
      "reasoning": [
        "Strong bullish sentiment from ETF inflows",
        "Technical breakout above $98K resistance",
        "On-chain accumulation pattern detected"
      ],
      "backtestPerformance": {
        "winRate": 0.68,
        "avgReturn": 4.2,
        "sharpe": 1.8,
        "maxDrawdown": -12.5
      }
    }
  ],
  "modelVersion": "2.4.0",
  "generatedAt": "2026-01-22T12:30:00Z"
}
```

---

#### GET /api/premium/ai/sentiment

Advanced sentiment analysis with source breakdown.

**Response:**

```json
{
  "asset": "BTC",
  "sentiment": {
    "overall": 0.72,
    "news": 0.68,
    "social": 0.75,
    "onchain": 0.70
  },
  "sources": {
    "coindesk": { "sentiment": 0.65, "articles": 12 },
    "theblock": { "sentiment": 0.72, "articles": 8 },
    "twitter": { "sentiment": 0.78, "volume": 125000 }
  },
  "trendDirection": "improving",
  "confidence": 0.88
}
```

---

### Whale Alerts

#### GET /api/premium/whales/transactions

Real-time whale transaction feed.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minValue` | number | 100000 | Minimum USD value |
| `assets` | string | all | Asset filter |
| `type` | string | all | transfer, exchange_in, exchange_out |
| `realtime` | boolean | false | WebSocket stream |

**Response:**

```json
{
  "transactions": [
    {
      "txHash": "abc123...",
      "asset": "BTC",
      "amount": 500,
      "valueUsd": 49500000,
      "from": {
        "address": "bc1q...",
        "label": "Unknown Wallet",
        "type": "unknown"
      },
      "to": {
        "address": "3FHN...",
        "label": "Coinbase",
        "type": "exchange"
      },
      "type": "exchange_in",
      "sentiment": "bearish",
      "timestamp": "2026-01-22T12:20:00Z"
    }
  ],
  "summary": {
    "exchangeInflow": 125000000,
    "exchangeOutflow": 95000000,
    "netFlow": "inflow",
    "largestTx": 49500000
  }
}
```

---

#### GET /api/premium/whales/alerts

Configure custom whale alert rules.

**Request Body (POST):**

```json
{
  "rules": [
    {
      "asset": "BTC",
      "minValue": 10000000,
      "type": "exchange_in",
      "alertChannel": "websocket"
    }
  ]
}
```

---

### Smart Money Tracking

#### GET /api/premium/smart-money

Track known institutional and smart money wallets.

**Response:**

```json
{
  "wallets": [
    {
      "address": "0x...",
      "label": "Galaxy Digital",
      "category": "institutional",
      "holdings": [
        { "asset": "ETH", "balance": 50000, "valueUsd": 175000000 }
      ],
      "recentTrades": [
        {
          "asset": "ETH",
          "action": "buy",
          "amount": 1000,
          "price": 3450,
          "timestamp": "2026-01-22T10:00:00Z"
        }
      ],
      "pnl30d": 12.5,
      "accuracy": 0.72
    }
  ],
  "aggregatedActivity": {
    "netBuying": ["ETH", "SOL"],
    "netSelling": ["DOGE"],
    "accumulating": ["BTC"]
  }
}
```

---

### Advanced Screener

#### GET /api/premium/screener/advanced

Custom token screening with complex filters.

**Request Body (POST):**

```json
{
  "filters": {
    "marketCap": { "min": 100000000, "max": 10000000000 },
    "volume24h": { "min": 10000000 },
    "priceChange24h": { "min": -5, "max": 50 },
    "sentiment": { "min": 0.6 },
    "fundingRate": { "max": 0.001 },
    "socialVolume": { "min": 10000 }
  },
  "sort": "volume24h",
  "order": "desc",
  "limit": 50
}
```

**Response:**

```json
{
  "tokens": [
    {
      "symbol": "SOL",
      "name": "Solana",
      "price": 125.50,
      "marketCap": 55000000000,
      "volume24h": 2500000000,
      "priceChange24h": 8.5,
      "sentiment": 0.72,
      "fundingRate": 0.0008,
      "socialVolume": 45000,
      "score": 87
    }
  ],
  "matchCount": 156,
  "filters": {...}
}
```

---

### Portfolio Analytics

#### GET /api/premium/portfolio/analytics

Advanced portfolio analytics and attribution.

**Response:**

```json
{
  "totalValue": 500000,
  "totalPnl": 75000,
  "pnlPercent": 17.6,
  "metrics": {
    "sharpe": 1.85,
    "sortino": 2.12,
    "maxDrawdown": -15.2,
    "volatility": 0.45,
    "beta": 1.2
  },
  "attribution": {
    "assetAllocation": 0.45,
    "timing": 0.25,
    "selection": 0.30
  },
  "riskMetrics": {
    "var95": -25000,
    "cvar95": -35000,
    "correlation": {...}
  }
}
```

---

### Historical Data

#### GET /api/premium/market/history

Extended historical data access.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `asset` | string | required | Asset symbol |
| `from` | date | - | Start date (YYYY-MM-DD) |
| `to` | date | - | End date |
| `interval` | string | 1d | 1m, 5m, 1h, 1d |
| `format` | string | json | json, csv, parquet |

**Tier Limits:**

| Tier | History Limit | Intervals |
|------|---------------|-----------|
| Pro | 1 year | 1h, 1d |
| Enterprise | Full history | 1m, 5m, 1h, 1d |

---

### Export Formats

#### GET /api/premium/export/portfolio

Export portfolio data in various formats.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | json, csv, parquet |
| `include` | string | holdings, trades, performance |

---

## API Key Management

### Generate API Key

```bash
curl -X POST "https://cryptocurrency.cv/api/premium/api-keys" \
  -H "Authorization: Bearer YOUR_MASTER_KEY" \
  -d '{"name": "Trading Bot", "permissions": ["read", "trade"]}'
```

### List API Keys

```bash
curl "https://cryptocurrency.cv/api/keys" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Revoke API Key

```bash
curl -X DELETE "https://cryptocurrency.cv/api/keys/KEY_ID" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Billing

### GET /api/billing

Get current billing status.

**Response:**

```json
{
  "subscription": {
    "tier": "pro",
    "status": "active",
    "currentPeriodStart": "2026-01-01",
    "currentPeriodEnd": "2026-02-01",
    "cancelAtPeriodEnd": false
  },
  "usage": {
    "requests": 45000,
    "limit": 1000000,
    "resetAt": "2026-02-01T00:00:00Z"
  },
  "invoices": [...]
}
```

### POST /api/upgrade

Upgrade subscription tier.

**Request Body:**

```json
{
  "tier": "pro",
  "billingCycle": "monthly",
  "paymentMethod": "card"
}
```

---

## Rate Limits by Tier

| Tier | Requests/min | Requests/day | Burst |
|------|--------------|--------------|-------|
| Free | 100 | 10,000 | 20/sec |
| Pro | 1,000 | 100,000 | 100/sec |
| Enterprise | 10,000 | Unlimited | 500/sec |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1706012400
X-RateLimit-Tier: pro
```

---

## Enterprise Features

Enterprise tier includes additional features:

### Dedicated Infrastructure
- Dedicated API endpoints
- Custom rate limits
- Priority routing

### Custom Integrations
- Custom data sources
- White-label options
- SSO integration

### Advanced Analytics
- Custom dashboards
- Data lake access
- ML model access

### Support
- Dedicated account manager
- 24/7 support
- Custom SLAs

---

## Getting Started

### 1. Sign Up

```bash
curl -X POST "https://cryptocurrency.cv/api/register" \
  -d '{"email": "you@example.com", "tier": "pro"}'
```

### 2. Get API Key

After payment confirmation, your API key will be emailed and available in the dashboard.

### 3. Make Requests

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://cryptocurrency.cv/api/premium/ai/signals"
```

---

## Pricing

| Tier | Monthly | Annual (20% off) |
|------|---------|------------------|
| Pro | $49 | $470 |
| Enterprise | Custom | Custom |

### Payment Methods
- Credit/Debit Card
- Crypto (BTC, ETH, USDC via X402)
- Wire Transfer (Enterprise)

---

## Support

- **Pro:** support@cryptocurrency.cv (24h response)
- **Enterprise:** Dedicated Slack channel, 4h response SLA

---

## Related Documentation

- [API Reference](API.md) - Complete API docs
- [SDKs](sdks/index.md) - Client libraries
