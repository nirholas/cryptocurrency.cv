# 🔌 Real-Time Features Guide

Guide for WebSocket, Server-Sent Events (SSE), real-time news updates, and configurable alerts.

---

## Table of Contents

- [Overview](#overview)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [WebSocket Server](#websocket-server)
- [Alert System](#alert-system)
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
| **WebSocket** | Bi-directional, subscriptions, alerts | Railway, Render, VPS |
| **Alerts** | Configurable conditions, webhooks | All platforms |
| **Push** | Mobile/browser notifications | All with service worker |
| **Webhooks** | Server-to-server | Any backend |

---

## Server-Sent Events (SSE)

SSE is the recommended method for Vercel deployments.

### Endpoint

```
GET /api/sse
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sources` | string | all | Comma-separated source keys (e.g., `coindesk,theblock`) |
| `categories` | string | all | Comma-separated categories (e.g., `bitcoin,defi`) |
| `breaking` | boolean | true | Include breaking news events (`false` to disable) |

**Example with filters:**

```bash
curl -N "https://cryptocurrency.cv/api/sse?sources=coindesk,theblock&categories=bitcoin&breaking=true"
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{message, timestamp, config}` | Connection established |
| `news` | `{type, articles[], timestamp}` | New articles available |
| `breaking` | `{type, articles[], timestamp}` | Breaking news alerts |
| `heartbeat` | `{timestamp}` | Keep-alive ping (every 30s) |
| `error` | `{message, timestamp}` | Error notification |

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
  const data = JSON.parse(event.data);
  updateNewsFeed(data.articles);
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
    url = 'https://cryptocurrency.cv/api/sse'
    
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

Full bi-directional communication with subscriptions, live prices, whale alerts, and topic channels.

### Features (v2.0)

| Feature | Update Interval | Description |
|---------|-----------------|-------------|
| 📰 **News Streaming** | 30s | Real-time news from 130+ sources |
| 🚨 **Breaking News** | 30s | Urgent breaking news alerts |
| 💰 **Price Streaming** | 10s | Live prices (BTC, ETH, SOL, etc.) |
| 🐳 **Whale Alerts** | 60s | Large transactions ($1M+) |
| 😱 **Fear & Greed** | 5m | Market sentiment index |
| 📺 **Topic Channels** | Real-time | Bitcoin, DeFi, NFT, Regulation, etc. |
| 🔔 **Custom Alerts** | 30s | Your own alert rules |
| ⚡ **Compression** | - | WebSocket per-message deflate |
| 🛡️ **Rate Limiting** | - | 60 messages/minute protection |

### Standalone Server

The WebSocket server runs separately (for Railway, Render, VPS):

```bash
# Start WebSocket server
node ws-server.js
```

**Environment Variables:**

```env
PORT=8080
NEWS_API=https://cryptocurrency.cv
```

### HTTP Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Server statistics
curl http://localhost:8080/stats

# Available topic channels
curl http://localhost:8080/channels

# Current price cache
curl http://localhost:8080/prices
```

### WebSocket Protocol

**Connect:**

```javascript
const ws = new WebSocket('wss://your-ws-server.railway.app');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to news filters
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: {
      sources: ['coindesk', 'theblock'],
      categories: ['defi', 'bitcoin'],
      coins: ['BTC', 'ETH'],
      keywords: ['SEC', 'ETF'],
    }
  }));
  
  // Join topic channels
  ws.send(JSON.stringify({
    type: 'join_channel',
    payload: { channel: 'bitcoin' }
  }));
  
  ws.send(JSON.stringify({
    type: 'join_channel',
    payload: { channel: 'defi' }
  }));
  
  // Enable live price streaming
  ws.send(JSON.stringify({
    type: 'stream_prices',
    payload: { enabled: true }
  }));
  
  // Enable whale alerts
  ws.send(JSON.stringify({
    type: 'stream_whales',
    payload: { enabled: true }
  }));
  
  // Enable Fear & Greed updates
  ws.send(JSON.stringify({
    type: 'stream_sentiment',
    payload: { enabled: true }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'news':
      handleNewsUpdate(message.payload.articles);
      break;
    case 'breaking':
      handleBreakingNews(message.payload.articles);
      break;
    case 'topic':
      handleTopicNews(message.payload.channel, message.payload.articles);
      break;
    case 'prices':
      handlePriceUpdate(message.payload.prices);
      break;
    case 'whales':
      handleWhaleAlert(message.payload.alerts);
      break;
    case 'sentiment':
      handleSentiment(message.payload);
      break;
    case 'alert':
      handleAlert(message.data);
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
| `subscribe` | Client → Server | Set news subscription filters |
| `unsubscribe` | Client → Server | Remove news filters |
| `join_channel` | Client → Server | Join a topic channel |
| `leave_channel` | Client → Server | Leave a topic channel |
| `stream_prices` | Client → Server | Enable/disable price streaming |
| `stream_whales` | Client → Server | Enable/disable whale alerts |
| `stream_sentiment` | Client → Server | Enable/disable sentiment updates |
| `subscribe_alerts` | Client → Server | Subscribe to custom alerts |
| `unsubscribe_alerts` | Client → Server | Unsubscribe from alerts |
| `ping` | Client → Server | Keep-alive |
| `news` | Server → Client | News articles |
| `breaking` | Server → Client | Breaking news |
| `topic` | Server → Client | Topic channel news |
| `prices` | Server → Client | Live price updates |
| `whales` | Server → Client | Whale transaction alerts |
| `sentiment` | Server → Client | Fear & Greed Index |
| `alert` | Server → Client | Custom alert events |
| `pong` | Server → Client | Keep-alive response |
| `rate_limited` | Server → Client | Rate limit warning |

### Available Topic Channels

| Channel | Name | Keywords |
|---------|------|----------|
| `bitcoin` | Bitcoin | bitcoin, btc, lightning, ordinals |
| `ethereum` | Ethereum | ethereum, eth, vitalik, layer2 |
| `defi` | DeFi | defi, yield, lending, dex, amm |
| `nft` | NFTs | nft, opensea, blur, digital art |
| `regulation` | Regulation | sec, regulation, cftc, lawsuit |
| `stablecoins` | Stablecoins | usdt, usdc, stablecoin, tether |
| `altcoins` | Altcoins | solana, cardano, polkadot, avalanche |
| `exchanges` | Exchanges | binance, coinbase, kraken, exchange |
| `markets` | Markets | price, rally, crash, bull, bear |
| `whales` | Whales | whale, accumulation, institutional |

### Price Update Payload

```json
{
  "type": "prices",
  "payload": {
    "prices": {
      "bitcoin": {
        "usd": 98500,
        "usd_24h_change": 2.5,
        "usd_market_cap": 1950000000000
      },
      "ethereum": {
        "usd": 3450,
        "usd_24h_change": -1.2,
        "usd_market_cap": 415000000000
      }
    }
  },
  "timestamp": "2026-02-02T10:00:00Z"
}
```

### Whale Alert Payload

```json
{
  "type": "whales",
  "payload": {
    "alerts": [
      {
        "hash": "0x123...",
        "amount": 1500,
        "symbol": "BTC",
        "usd_value": 147750000,
        "from": "Binance",
        "to": "Unknown Wallet"
      }
    ],
    "isNew": true
  },
  "timestamp": "2026-02-02T10:00:00Z"
}
```

### Sentiment Payload

```json
{
  "type": "sentiment",
  "payload": {
    "value": 72,
    "classification": "Greed",
    "timestamp": "2026-02-02T00:00:00Z"
  },
  "timestamp": "2026-02-02T10:00:00Z"
}
```

### Subscribe Message:

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

# Statistics (includes alert subscribers)
curl https://your-ws-server.railway.app/stats
```

---

## Alert System

Configurable alerts for price movements, breaking news, and custom conditions with WebSocket and webhook delivery.

### Alert Condition Types

| Type | Description | Example |
|------|-------------|---------|
| `price_above` | Price exceeds threshold | BTC > $100,000 |
| `price_below` | Price drops below threshold | ETH < $2,000 |
| `price_change_pct` | Percentage change in timeframe | SOL +10% in 24h |
| `volume_spike` | Volume exceeds multiplier of baseline | BTC volume 3x normal |
| `breaking_news` | Breaking news with optional keywords | News with "SEC", "ETF" |
| `ticker_mention` | Ticker mentioned with optional sentiment | BTC with sentiment > 0.5 |
| `whale_movement` | Large transfers above threshold | Transfers > $10M |
| `fear_greed_change` | Fear & Greed index change | Change >= 10 points |

### Create Alert Rule

```bash
curl -X POST https://cryptocurrency.cv/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "BTC Above 100k",
    "condition": {
      "type": "price_above",
      "coin": "bitcoin",
      "threshold": 100000
    },
    "channels": ["websocket", "webhook"],
    "webhookUrl": "https://your-server.com/alerts",
    "cooldown": 300
  }'
```

**Response:**

```json
{
  "alert": {
    "id": "alert_1737507600_abc123def",
    "name": "BTC Above 100k",
    "condition": {
      "type": "price_above",
      "coin": "bitcoin",
      "threshold": 100000
    },
    "channels": ["websocket", "webhook"],
    "webhookUrl": "https://your-server.com/alerts",
    "cooldown": 300,
    "enabled": true,
    "createdAt": "2026-01-22T00:00:00.000Z"
  }
}
```

### Alert Condition Examples

**Price Above:**

```json
{
  "type": "price_above",
  "coin": "bitcoin",
  "threshold": 100000
}
```

**Price Change Percentage:**

```json
{
  "type": "price_change_pct",
  "coin": "ethereum",
  "threshold": 10,
  "timeframe": "24h"
}
```

**Volume Spike:**

```json
{
  "type": "volume_spike",
  "coin": "solana",
  "multiplier": 3
}
```

**Breaking News with Keywords:**

```json
{
  "type": "breaking_news",
  "keywords": ["SEC", "ETF", "regulation"]
}
```

**Ticker Mention with Sentiment:**

```json
{
  "type": "ticker_mention",
  "ticker": "BTC",
  "minSentiment": 0.5
}
```

**Fear & Greed Change:**

```json
{
  "type": "fear_greed_change",
  "threshold": 10
}
```

### Alert API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List all alert rules |
| POST | `/api/alerts` | Create alert rule |
| GET | `/api/alerts?action=evaluate` | Trigger alert evaluation |
| GET | `/api/alerts?action=stats` | Get alert statistics |
| GET | `/api/alerts?action=events` | Get recent alert events |
| GET | `/api/alerts/[id]` | Get single alert |
| PUT | `/api/alerts/[id]` | Update alert |
| PATCH | `/api/alerts/[id]` | Enable/disable alert |
| DELETE | `/api/alerts/[id]` | Delete alert |
| POST | `/api/alerts/[id]?action=test` | Test trigger alert |

### Subscribe to Alerts via WebSocket

```javascript
const ws = new WebSocket('wss://your-ws-server.railway.app');

ws.onopen = () => {
  // Subscribe to all alerts
  ws.send(JSON.stringify({
    type: 'subscribe_alerts',
    payload: { ruleIds: ['*'] }
  }));

  // Or subscribe to specific alerts
  ws.send(JSON.stringify({
    type: 'subscribe_alerts',
    payload: { ruleIds: ['alert_123', 'alert_456'] }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'alert') {
    const alertEvent = message.data;
    console.log(`🚨 Alert: ${alertEvent.ruleName}`);
    console.log(`Severity: ${alertEvent.severity}`);
    console.log(`Value: ${alertEvent.data.currentValue}`);
  }
};
```

### Alert Event Structure

When an alert triggers, this event is broadcast:

```json
{
  "type": "alert",
  "data": {
    "id": "evt_1737507600_xyz789",
    "ruleId": "alert_123",
    "ruleName": "BTC Above 100k",
    "condition": {
      "type": "price_above",
      "coin": "bitcoin",
      "threshold": 100000
    },
    "triggeredAt": "2026-01-22T10:30:00.000Z",
    "data": {
      "currentValue": 105000,
      "threshold": 100000,
      "context": {
        "coinId": "bitcoin",
        "coinName": "Bitcoin",
        "symbol": "btc",
        "change24h": 5.2
      }
    },
    "severity": "warning"
  },
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

### Severity Levels

| Severity | Description |
|----------|-------------|
| `critical` | Large deviation (>10% price, >5x volume) |
| `warning` | Moderate deviation (5-10% price, 3-5x volume) |
| `info` | Small deviation or informational |

### Webhook Delivery

Alert webhooks are sent as POST requests:

```json
{
  "type": "alert",
  "event": {
    "id": "evt_1737507600_xyz789",
    "ruleId": "alert_123",
    "ruleName": "BTC Above 100k",
    "condition": { "type": "price_above", "coin": "bitcoin", "threshold": 100000 },
    "triggeredAt": "2026-01-22T10:30:00.000Z",
    "data": { "currentValue": 105000, "threshold": 100000 },
    "severity": "warning"
  },
  "timestamp": "2026-01-22T10:30:00.000Z"
}
```

**Headers:**

```
Content-Type: application/json
X-Alert-Event-Id: evt_1737507600_xyz789
X-Alert-Rule-Id: alert_123
```

### Cooldown

Each alert has a configurable cooldown period (in seconds) to prevent spam:

- Default: 300 seconds (5 minutes)
- After triggering, the rule won't evaluate again until cooldown passes
- Test triggers (`?action=test`) do not affect cooldown

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
curl -X POST https://cryptocurrency.cv/api/webhooks \
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
docker run -p 8080:8080 -e NEWS_API_URL=https://cryptocurrency.cv crypto-news-ws
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
