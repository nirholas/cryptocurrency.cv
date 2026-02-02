# 🛡️ Admin Dashboard Guide

Documentation for the Admin Dashboard and analytics system.

---

## Table of Contents

- [Overview](#overview)
- [Access & Authentication](#access-authentication)
- [Dashboard Features](#dashboard-features)
- [API Endpoints](#api-endpoints)
- [Analytics Tracking](#analytics-tracking)
- [Alerts & Monitoring](#alerts-monitoring)

---

## Overview

The Admin Dashboard provides real-time insights into API usage, system health, and errors.

**URL:** `/admin`

**Features:**

| Feature | Description |
|---------|-------------|
| 📊 **Usage Stats** | Total requests, unique users, cache hits |
| 📈 **Hourly Graph** | Request volume over time |
| 🎯 **Top Endpoints** | Most popular API routes |
| 💚 **System Health** | Memory, external services status |
| ❌ **Error Log** | Recent errors with details |

---

## Access & Authentication

### Token-Based Auth

Set an admin token in environment variables:

```env
ADMIN_TOKEN=your-secure-admin-token
```

### Accessing Dashboard

**Option 1: Query Parameter**

```
https://your-domain.com/admin?token=your-secure-admin-token
```

**Option 2: Authorization Header (API)**

```bash
curl https://your-domain.com/api/admin \
  -H "Authorization: Bearer your-secure-admin-token"
```

### Security Recommendations

- Use a long, random token (32+ characters)
- Rotate token periodically
- Use HTTPS only
- Restrict access via IP allowlist if possible

---

## Dashboard Features

### Stats Overview

| Metric | Description |
|--------|-------------|
| **Total Requests** | All API calls in the period |
| **Unique Users** | Distinct IPs/user agents |
| **Avg Response Time** | Mean API latency |
| **Cache Hit Rate** | % served from cache |
| **Error Rate** | % of failed requests |

### Hourly Graph

Visual chart showing request volume over the past 24 hours:

- Blue bars: Successful requests
- Red bars: Errors
- Line: Average response time

### Top Endpoints

Most frequently called API routes:

```
1. /api/news        45,231 calls  avg 142ms
2. /api/bitcoin     12,456 calls  avg 128ms
3. /api/search      8,923 calls   avg 256ms
4. /api/trending    6,234 calls   avg 189ms
5. /api/defi        4,567 calls   avg 145ms
```

### System Health

| Service | Status | Details |
|---------|--------|---------|
| Memory | ✅ OK | 245MB / 512MB (48%) |
| Redis | ✅ Connected | Latency: 2ms |
| News Sources | ✅ OK | 7/7 responding |
| AI Provider | ✅ OK | OpenAI (gpt-4o-mini) |

### Error Log

Recent errors with:
- Timestamp
- Endpoint
- Error message
- Stack trace (expandable)
- User agent
- IP (anonymized)

---

## API Endpoints

### `GET /api/admin`

Fetch dashboard data programmatically.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "stats": {
    "totalRequests": 145231,
    "uniqueUsers": 3456,
    "avgResponseTime": 156,
    "cacheHitRate": 0.72,
    "errorRate": 0.02,
    "period": "24h"
  },
  "hourlyData": [
    { "hour": "2026-01-22T00:00:00Z", "requests": 4523, "errors": 12, "avgTime": 145 },
    { "hour": "2026-01-22T01:00:00Z", "requests": 3245, "errors": 8, "avgTime": 152 }
  ],
  "topEndpoints": [
    { "path": "/api/news", "count": 45231, "avgTime": 142 },
    { "path": "/api/bitcoin", "count": 12456, "avgTime": 128 }
  ],
  "health": {
    "memory": { "used": 245, "total": 512, "percent": 48 },
    "services": {
      "redis": { "status": "connected", "latency": 2 },
      "sources": { "status": "ok", "healthy": 7, "total": 7 },
      "ai": { "status": "ok", "provider": "openai" }
    }
  },
  "recentErrors": [
    {
      "timestamp": "2026-01-22T10:23:45Z",
      "endpoint": "/api/search",
      "message": "Query timeout",
      "count": 3
    }
  ]
}
```

### `GET /api/admin/export`

Export analytics data as CSV.

```bash
curl "https://your-domain.com/api/admin/export?format=csv&period=7d" \
  -H "Authorization: Bearer <token>" \
  -o analytics.csv
```

### `POST /api/admin/clear-cache`

Clear specific caches.

```bash
curl -X POST "https://your-domain.com/api/admin/clear-cache" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"caches": ["news", "ai"]}'
```

---

## Analytics Tracking

### How It Works

Every API request is tracked:

```typescript
import { trackAPICall } from '@/lib/analytics';

// In API route
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const result = await fetchNews();
    
    trackAPICall({
      endpoint: '/api/news',
      method: 'GET',
      statusCode: 200,
      responseTime: Date.now() - startTime,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip,
      cacheHit: false,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    trackAPICall({
      endpoint: '/api/news',
      method: 'GET',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      error: error.message,
    });
    
    throw error;
  }
}
```

### Tracked Data

| Field | Description |
|-------|-------------|
| `endpoint` | API path called |
| `method` | HTTP method |
| `statusCode` | Response status |
| `responseTime` | Time in ms |
| `cacheHit` | Served from cache? |
| `userAgent` | Client identifier |
| `ip` | Anonymized IP |
| `error` | Error message (if any) |

### Data Retention

- **Real-time stats:** Last 24 hours
- **Hourly aggregates:** 7 days
- **Daily aggregates:** 90 days
- **Error logs:** 30 days

---

## Alerts & Monitoring

### Setting Up Alerts

Create alerts for anomalies:

```typescript
// src/lib/analytics.ts
export const alertThresholds = {
  errorRate: 0.05,        // Alert if > 5% errors
  responseTime: 2000,     // Alert if avg > 2s
  requestSpike: 10,       // Alert if 10x normal
};
```

### Webhook Notifications

Send alerts to external services:

```env
ADMIN_WEBHOOK_URL=https://hooks.slack.com/services/...
```

Alert payload:
```json
{
  "type": "alert",
  "level": "warning",
  "message": "Error rate exceeded 5% threshold",
  "current": 0.08,
  "threshold": 0.05,
  "timestamp": "2026-01-22T10:00:00Z"
}
```

### Integrations

| Service | Setup |
|---------|-------|
| Slack | Webhook URL |
| Discord | Webhook URL |
| PagerDuty | Integration key |
| Email | SMTP settings |

---

## Custom Dashboard

### Using Analytics Data

```typescript
import { getDashboardStats, getSystemHealth } from '@/lib/analytics';

// In your custom admin page
export default async function CustomAdmin() {
  const stats = await getDashboardStats();
  const health = await getSystemHealth();
  
  return (
    <div>
      <h1>API Analytics</h1>
      <p>Total Requests: {stats.totalRequests.toLocaleString()}</p>
      <p>Error Rate: {(stats.errorRate * 100).toFixed(2)}%</p>
      
      <h2>System Health</h2>
      <p>Memory: {health.memory.percent}%</p>
      <p>Redis: {health.services.redis.status}</p>
    </div>
  );
}
```

### Embedding Charts

```tsx
import { PriceLineChart } from '@/components/charts';

// Convert hourly data for chart
const chartData = hourlyData.map(h => ({
  time: new Date(h.hour).toLocaleTimeString(),
  requests: h.requests,
  errors: h.errors,
}));

<PriceLineChart
  data={chartData}
  dataKey="requests"
  height={300}
  color="#3B82F6"
/>
```

---

## Troubleshooting

### Dashboard Not Loading

1. Check `ADMIN_TOKEN` is set
2. Verify token in URL/header matches
3. Check browser console for errors

### Stats Not Updating

1. Verify analytics tracking is enabled
2. Check Redis connection (if used)
3. Look for errors in server logs

### High Memory Usage

1. Check for memory leaks in custom code
2. Review cache sizes
3. Consider increasing server resources

---

## Need Help?

- 📖 [API Documentation](./API.md)
- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
