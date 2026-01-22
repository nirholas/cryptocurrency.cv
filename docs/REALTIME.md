# 🔌 Real-Time Features Guide

Guide for WebSocket, Server-Sent Events (SSE), and real-time news updates.

---

## Table of Contents

- [Overview](#overview)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [WebSocket Server](#websocket-server)
- [Client Integration](#client-integration)
- [Push Notifications](#push-notifications)
- [Webhooks](#webhooks)
- [Deployment](#deployment)

---

## Overview

Free Crypto News supports multiple real-time delivery methods:

| Method | Best For | Supported Platforms |
|--------|----------|---------------------|
| **SSE** | Simple streaming | Vercel, Cloudflare, all Edge |
| **WebSocket** | Bi-directional, subscriptions | Railway, Render, VPS |
| **Push** | Mobile/browser notifications | All with service worker |
| **Webhooks** | Server-to-server | Any backend |

---

## Server-Sent Events (SSE)

SSE is the recommended method for Vercel deployments.

### Endpoint

```
GET /api/sse
```

### Usage

**JavaScript/Browser:**

```javascript
const eventSource = new EventSource('/api/sse');

// Breaking news
eventSource.addEventListener('breaking', (event) => {
  const data = JSON.parse(event.data);
  console.log('Breaking news:', data);
  showNotification(data.title);
});

// Regular news updates
eventSource.addEventListener('news', (event) => {
  const articles = JSON.parse(event.data);
  updateNewsFeed(articles);
});

// Price updates
eventSource.addEventListener('price', (event) => {
  const prices = JSON.parse(event.data);
  updatePriceDisplay(prices);
});

// Connection status
eventSource.addEventListener('connected', (event) => {
  console.log('Connected to real-time feed');
});

// Heartbeat (keep-alive)
eventSource.addEventListener('heartbeat', () => {
  // Connection is alive
});

// Handle errors
eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // EventSource will auto-reconnect
};

// Clean up
window.addEventListener('beforeunload', () => {
  eventSource.close();
});
```

**React Hook:**

```typescript
import { useEffect, useState } from 'react';

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

export function useRealTimeNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [breaking, setBreaking] = useState<Article | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/sse');

    eventSource.addEventListener('connected', () => {
      setConnected(true);
    });

    eventSource.addEventListener('news', (event) => {
      const data = JSON.parse(event.data);
      setArticles(data.articles);
    });

    eventSource.addEventListener('breaking', (event) => {
      const data = JSON.parse(event.data);
      setBreaking(data);
      // Clear after 30 seconds
      setTimeout(() => setBreaking(null), 30000);
    });

    eventSource.onerror = () => {
      setConnected(false);
    };

    return () => eventSource.close();
  }, []);

  return { articles, breaking, connected };
}
```

**Python Client:**

```python
import sseclient
import requests
import json

def stream_news():
    url = 'https://free-crypto-news.vercel.app/api/sse'
    
    with requests.get(url, stream=True) as response:
        client = sseclient.SSEClient(response)
        
        for event in client.events():
            if event.event == 'news':
                articles = json.loads(event.data)
                for article in articles.get('articles', []):
                    print(f"📰 {article['title']}")
            
            elif event.event == 'breaking':
                data = json.loads(event.data)
                print(f"🚨 BREAKING: {data['title']}")

if __name__ == '__main__':
    stream_news()
```

---

## WebSocket Server

For full bi-directional communication with subscriptions.

### Standalone Server

The WebSocket server runs separately (for Railway, Render, VPS):

```bash
# Start WebSocket server
node ws-server.js
```

**Environment Variables:**

```env
WS_PORT=8080
NEWS_API_URL=https://free-crypto-news.vercel.app
POLL_INTERVAL=30000
```

### WebSocket Protocol

**Connect:**

```javascript
const ws = new WebSocket('wss://your-ws-server.railway.app');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to specific sources
  ws.send(JSON.stringify({
    type: 'subscribe',
    sources: ['coindesk', 'theblock'],
    categories: ['defi', 'bitcoin'],
    coins: ['BTC', 'ETH'],
    keywords: ['SEC', 'ETF'],
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'news':
      handleNewsUpdate(message.articles);
      break;
    case 'price':
      handlePriceUpdate(message.prices);
      break;
    case 'alert':
      handleAlert(message.alert);
      break;
  }
};

ws.onclose = () => {
  console.log('Disconnected, reconnecting...');
  setTimeout(connect, 5000);
};
```

**Message Types:**

| Type | Direction | Description |
|------|-----------|-------------|
| `subscribe` | Client → Server | Set subscription filters |
| `unsubscribe` | Client → Server | Remove filters |
| `ping` | Client → Server | Keep-alive |
| `news` | Server → Client | News articles |
| `price` | Server → Client | Price updates |
| `alert` | Server → Client | Breaking alerts |
| `pong` | Server → Client | Keep-alive response |

**Subscribe Message:**

```json
{
  "type": "subscribe",
  "sources": ["coindesk", "theblock"],
  "categories": ["defi", "bitcoin", "regulation"],
  "coins": ["BTC", "ETH", "SOL"],
  "keywords": ["SEC", "BlackRock", "ETF"]
}
```

**News Update:**

```json
{
  "type": "news",
  "articles": [
    {
      "title": "Bitcoin ETF Approval Expected",
      "link": "https://...",
      "source": "CoinDesk",
      "pubDate": "2026-01-22T10:00:00Z",
      "categories": ["bitcoin", "regulation"]
    }
  ],
  "timestamp": "2026-01-22T10:00:05Z"
}
```

### Health Endpoints

```bash
# Health check
curl https://your-ws-server.railway.app/health

# Statistics
curl https://your-ws-server.railway.app/stats
```

---

## Client Integration

### React Real-Time Component

```tsx
import { useRealTimeNews } from '@/hooks/useRealTimeNews';

export function LiveNewsFeed() {
  const { articles, breaking, connected } = useRealTimeNews();

  return (
    <div>
      {/* Connection status */}
      <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? '🟢 Live' : '🔴 Reconnecting...'}
      </div>

      {/* Breaking news banner */}
      {breaking && (
        <div className="breaking-banner">
          🚨 BREAKING: {breaking.title}
        </div>
      )}

      {/* News feed */}
      <div className="news-feed">
        {articles.map((article) => (
          <ArticleCard key={article.link} article={article} />
        ))}
      </div>
    </div>
  );
}
```

### Vanilla JavaScript

```html
<script>
class CryptoNewsStream {
  constructor(options = {}) {
    this.onNews = options.onNews || (() => {});
    this.onBreaking = options.onBreaking || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.eventSource = null;
  }

  connect() {
    this.eventSource = new EventSource('/api/sse');

    this.eventSource.addEventListener('connected', () => {
      this.onConnect();
    });

    this.eventSource.addEventListener('news', (e) => {
      this.onNews(JSON.parse(e.data));
    });

    this.eventSource.addEventListener('breaking', (e) => {
      this.onBreaking(JSON.parse(e.data));
    });

    this.eventSource.onerror = () => {
      this.onDisconnect();
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Usage
const stream = new CryptoNewsStream({
  onNews: (data) => {
    console.log('New articles:', data.articles);
  },
  onBreaking: (article) => {
    alert(`🚨 Breaking: ${article.title}`);
  },
  onConnect: () => {
    document.getElementById('status').textContent = 'Live';
  },
  onDisconnect: () => {
    document.getElementById('status').textContent = 'Reconnecting...';
  },
});

stream.connect();
</script>
```

---

## Push Notifications

Web Push for browser/mobile notifications even when the app is closed.

### Setup

**1. Get VAPID Keys:**

```bash
# Generate keys (once)
npx web-push generate-vapid-keys
```

**2. Set Environment Variables:**

```env
VAPID_PUBLIC_KEY=BNx...
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

### Client Registration

```javascript
// Check support
if ('serviceWorker' in navigator && 'PushManager' in window) {
  
  // Get public key from server
  const { publicKey } = await fetch('/api/push').then(r => r.json());

  // Register service worker
  const registration = await navigator.serviceWorker.register('/sw.js');

  // Subscribe to push
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  // Send subscription to server
  await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'subscribe',
      subscription,
      filters: {
        sources: ['coindesk'],
        keywords: ['bitcoin'],
        breakingOnly: false,
      },
    }),
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
```

### Service Worker

```javascript
// sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New crypto news available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'crypto-news',
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Read More' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Crypto News', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
```

---

## Webhooks

Server-to-server notifications with HMAC signatures.

### Register Webhook

```bash
curl -X POST https://free-crypto-news.vercel.app/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["news.breaking", "news.new"],
    "secret": "your-webhook-secret",
    "filters": {
      "sources": ["coindesk"],
      "keywords": ["SEC", "ETF"]
    }
  }'
```

### Event Types

| Event | Description |
|-------|-------------|
| `news.new` | New article published |
| `news.breaking` | Breaking news detected |
| `price.alert` | Price threshold reached |
| `market.significant` | Major market movement |
| `system.health` | System status change |

### Webhook Payload

```json
{
  "event": "news.breaking",
  "timestamp": "2026-01-22T10:00:00Z",
  "data": {
    "article": {
      "title": "SEC Approves Bitcoin ETF",
      "link": "https://...",
      "source": "CoinDesk",
      "pubDate": "2026-01-22T09:58:00Z"
    }
  }
}
```

### Verify Signature

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}

// Express middleware
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  const { event, data } = req.body;
  
  switch (event) {
    case 'news.breaking':
      handleBreakingNews(data.article);
      break;
    case 'news.new':
      handleNewArticle(data.article);
      break;
  }
  
  res.status(200).send('OK');
});
```

**Python:**

```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, f'sha256={expected}')
```

---

## Deployment

### SSE on Vercel

SSE works out of the box on Vercel Edge Runtime:

```typescript
// src/app/api/sse/route.ts
export const runtime = 'edge';
```

### WebSocket on Railway

```yaml
# railway.toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "node ws-server.js"
  healthcheckPath = "/health"
  healthcheckTimeout = 10

[[services]]
  name = "websocket"
  port = 8080
```

### WebSocket on Render

```yaml
# render.yaml
services:
  - type: web
    name: crypto-news-ws
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: node ws-server.js
    healthCheckPath: /health
```

### WebSocket on Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY ws-server.js package.json ./
RUN npm install ws
EXPOSE 8080
CMD ["node", "ws-server.js"]
```

```bash
docker build -t crypto-news-ws .
docker run -p 8080:8080 -e NEWS_API_URL=https://free-crypto-news.vercel.app crypto-news-ws
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Clients                                │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Browser SSE   │   WebSocket     │   Push Subscribers      │
│   (EventSource) │   (Full-duplex) │   (Service Workers)     │
└────────┬────────┴────────┬────────┴────────────┬────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌────────────────┐ ┌───────────────┐  ┌──────────────────────┐
│ /api/sse       │ │ ws-server.js  │  │ /api/push            │
│ (Edge Runtime) │ │ (Standalone)  │  │ (Web Push)           │
└────────┬───────┘ └───────┬───────┘  └──────────┬───────────┘
         │                 │                     │
         └─────────────────┴─────────────────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │  News Sources    │
                 │  (RSS Feeds)     │
                 └──────────────────┘
```

---

## Rate Limits

| Method | Limit |
|--------|-------|
| SSE | Unlimited connections |
| WebSocket | 1000 concurrent |
| Push | 10,000 subscribers |
| Webhooks | 100 per account |

---

## Need Help?

- 📖 [API Documentation](./API.md)
- 💬 [GitHub Discussions](https://github.com/nirholas/free-crypto-news/discussions)
- 🐛 [Report Issues](https://github.com/nirholas/free-crypto-news/issues)
