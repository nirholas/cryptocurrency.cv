# Webhooks & Integrations Tutorial

This tutorial covers webhook endpoints for building automated integrations and real-time notifications.

## Endpoints Covered

| Endpoint | Description |
|----------|-------------|
| `/api/webhooks` | List webhooks |
| `/api/webhooks/create` | Create webhook |
| `/api/webhooks/[id]` | Get/update/delete webhook |
| `/api/webhooks/test` | Test webhook delivery |
| `/api/webhooks/logs` | Webhook delivery logs |
| `/api/webhooks/events` | Available webhook events |

---

## 1. Understanding Webhooks

Webhooks allow your application to receive real-time notifications when events occur, such as:

- **News Events**: New articles, breaking news, trending topics
- **Market Events**: Price alerts, volume spikes, whale movements
- **Sentiment Events**: Sentiment changes, social buzz, influencer mentions
- **Portfolio Events**: Holdings changes, P&L updates

=== "Python"
    ```python
    import requests
    
    def get_webhook_events():
        """Get available webhook event types."""
        response = requests.get(
            "https://cryptocurrency.cv/api/webhooks/events"
        )
        return response.json()
    
    # Get available events
    events = get_webhook_events()
    
    print("📋 Available Webhook Events")
    print("=" * 70)
    
    for category, category_events in events.get('events', {}).items():
        print(f"\n   📁 {category.upper()}")
        for event in category_events:
            name = event.get('name', 'Unknown')
            description = event.get('description', '')
            print(f"      • {name}")
            print(f"        {description}")
    ```

=== "JavaScript"
    ```javascript
    async function getWebhookEvents() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/webhooks/events'
        );
        return response.json();
    }
    
    const events = await getWebhookEvents();
    
    console.log("📋 Available Webhook Events");
    console.log("=".repeat(70));
    
    for (const [category, categoryEvents] of Object.entries(events.events || {})) {
        console.log(`\n   📁 ${category.toUpperCase()}`);
        categoryEvents.forEach(event => {
            console.log(`      • ${event.name}`);
            console.log(`        ${event.description}`);
        });
    }
    ```

=== "cURL"
    ```bash
    # Get available webhook events
    curl "https://cryptocurrency.cv/api/webhooks/events" | jq
    
    # Get just event names
    curl "https://cryptocurrency.cv/api/webhooks/events" | jq '.events | keys'
    ```

---

## 2. Creating Webhooks

Create webhooks to receive notifications at your endpoint.

=== "Python"
    ```python
    import requests
    import hmac
    import hashlib
    
    def create_webhook(
        url: str,
        events: list,
        secret: str = None,
        filters: dict = None,
        active: bool = True
    ):
        """Create a new webhook."""
        data = {
            "url": url,
            "events": events,
            "active": active
        }
        if secret:
            data["secret"] = secret
        if filters:
            data["filters"] = filters
        
        response = requests.post(
            "https://cryptocurrency.cv/api/webhooks/create",
            json=data
        )
        return response.json()
    
    def list_webhooks():
        """List all webhooks."""
        response = requests.get(
            "https://cryptocurrency.cv/api/webhooks"
        )
        return response.json()
    
    # Create a news webhook
    print("🔗 Creating Webhooks")
    print("=" * 70)
    
    # Breaking news webhook
    breaking_news = create_webhook(
        url="https://your-server.com/webhooks/breaking-news",
        events=["news.breaking", "news.trending"],
        secret="your-webhook-secret-123",
        filters={
            "assets": ["BTC", "ETH"],
            "minImportance": "high"
        }
    )
    
    if breaking_news.get('success'):
        print(f"   ✅ Breaking news webhook created")
        print(f"      ID: {breaking_news.get('webhook', {}).get('id')}")
        print(f"      URL: {breaking_news.get('webhook', {}).get('url')}")
    
    # Price alert webhook
    price_alert = create_webhook(
        url="https://your-server.com/webhooks/price-alerts",
        events=["market.price_alert", "market.volume_spike"],
        secret="price-secret-456",
        filters={
            "assets": ["BTC", "ETH", "SOL"],
            "priceChangePercent": 5.0,
            "volumeMultiplier": 2.0
        }
    )
    
    if price_alert.get('success'):
        print(f"   ✅ Price alert webhook created")
        print(f"      ID: {price_alert.get('webhook', {}).get('id')}")
    
    # Sentiment webhook
    sentiment = create_webhook(
        url="https://your-server.com/webhooks/sentiment",
        events=["sentiment.change", "sentiment.extreme"],
        filters={
            "assets": ["BTC"],
            "sentimentThreshold": 0.5
        }
    )
    
    if sentiment.get('success'):
        print(f"   ✅ Sentiment webhook created")
    
    # List all webhooks
    print("\n📋 Your Webhooks:")
    webhooks = list_webhooks()
    
    for wh in webhooks.get('webhooks', []):
        status = "🟢 Active" if wh.get('active') else "🔴 Inactive"
        print(f"   {status} {wh.get('id', 'N/A')[:8]}...")
        print(f"      URL: {wh.get('url', 'N/A')}")
        print(f"      Events: {', '.join(wh.get('events', []))}")
        print(f"      Created: {wh.get('createdAt', 'N/A')[:10]}")
    ```

=== "JavaScript"
    ```javascript
    async function createWebhook(config) {
        const response = await fetch(
            'https://cryptocurrency.cv/api/webhooks/create',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            }
        );
        return response.json();
    }
    
    async function listWebhooks() {
        const response = await fetch(
            'https://cryptocurrency.cv/api/webhooks'
        );
        return response.json();
    }
    
    console.log("🔗 Creating Webhooks");
    console.log("=".repeat(70));
    
    // Breaking news webhook
    const breakingNews = await createWebhook({
        url: 'https://your-server.com/webhooks/breaking-news',
        events: ['news.breaking', 'news.trending'],
        secret: 'your-webhook-secret-123',
        filters: {
            assets: ['BTC', 'ETH'],
            minImportance: 'high'
        }
    });
    
    if (breakingNews.success) {
        console.log(`   ✅ Breaking news webhook created`);
        console.log(`      ID: ${breakingNews.webhook?.id}`);
    }
    
    // Price alerts
    const priceAlert = await createWebhook({
        url: 'https://your-server.com/webhooks/price-alerts',
        events: ['market.price_alert', 'market.volume_spike'],
        secret: 'price-secret-456',
        filters: {
            assets: ['BTC', 'ETH', 'SOL'],
            priceChangePercent: 5.0
        }
    });
    
    if (priceAlert.success) {
        console.log(`   ✅ Price alert webhook created`);
    }
    
    // List webhooks
    console.log("\n📋 Your Webhooks:");
    const webhooks = await listWebhooks();
    
    webhooks.webhooks?.forEach(wh => {
        const status = wh.active ? '🟢 Active' : '🔴 Inactive';
        console.log(`   ${status} ${wh.id?.slice(0, 8)}...`);
        console.log(`      URL: ${wh.url}`);
        console.log(`      Events: ${wh.events?.join(', ')}`);
    });
    ```

=== "cURL"
    ```bash
    # Create a webhook
    curl -X POST "https://cryptocurrency.cv/api/webhooks/create" \
      -H "Content-Type: application/json" \
      -d '{
        "url": "https://your-server.com/webhooks/news",
        "events": ["news.breaking", "news.trending"],
        "secret": "your-secret-123",
        "filters": {
          "assets": ["BTC", "ETH"],
          "minImportance": "high"
        }
      }' | jq
    
    # List all webhooks
    curl "https://cryptocurrency.cv/api/webhooks" | jq
    ```

---

## 3. Managing Webhooks

Update, pause, and delete webhooks.

=== "Python"
    ```python
    import requests
    
    def get_webhook(webhook_id: str):
        """Get a specific webhook."""
        response = requests.get(
            f"https://cryptocurrency.cv/api/webhooks/{webhook_id}"
        )
        return response.json()
    
    def update_webhook(webhook_id: str, updates: dict):
        """Update a webhook."""
        response = requests.patch(
            f"https://cryptocurrency.cv/api/webhooks/{webhook_id}",
            json=updates
        )
        return response.json()
    
    def delete_webhook(webhook_id: str):
        """Delete a webhook."""
        response = requests.delete(
            f"https://cryptocurrency.cv/api/webhooks/{webhook_id}"
        )
        return response.json()
    
    webhook_id = "wh_123456789"
    
    # Get webhook details
    print("📋 Webhook Details")
    print("=" * 70)
    
    webhook = get_webhook(webhook_id)
    
    print(f"   ID: {webhook.get('id', 'N/A')}")
    print(f"   URL: {webhook.get('url', 'N/A')}")
    print(f"   Events: {', '.join(webhook.get('events', []))}")
    print(f"   Active: {'✅ Yes' if webhook.get('active') else '❌ No'}")
    print(f"   Created: {webhook.get('createdAt', 'N/A')}")
    
    # Delivery stats
    stats = webhook.get('stats', {})
    print(f"\n   📊 Delivery Stats:")
    print(f"      Total Deliveries: {stats.get('totalDeliveries', 0)}")
    print(f"      Successful: {stats.get('successful', 0)}")
    print(f"      Failed: {stats.get('failed', 0)}")
    print(f"      Success Rate: {stats.get('successRate', 0):.1f}%")
    
    # Update webhook
    print("\n🔄 Updating Webhook...")
    
    updated = update_webhook(webhook_id, {
        "events": ["news.breaking", "news.trending", "news.major"],
        "filters": {
            "assets": ["BTC", "ETH", "SOL", "AVAX"],
            "minImportance": "medium"
        }
    })
    
    if updated.get('success'):
        print(f"   ✅ Webhook updated")
        print(f"      New events: {', '.join(updated.get('webhook', {}).get('events', []))}")
    
    # Pause webhook
    print("\n⏸️ Pausing Webhook...")
    
    paused = update_webhook(webhook_id, {"active": False})
    if paused.get('success'):
        print(f"   ✅ Webhook paused")
    
    # Resume webhook
    print("\n▶️ Resuming Webhook...")
    
    resumed = update_webhook(webhook_id, {"active": True})
    if resumed.get('success'):
        print(f"   ✅ Webhook resumed")
    
    # Delete webhook (uncomment to actually delete)
    # print("\n🗑️ Deleting Webhook...")
    # deleted = delete_webhook(webhook_id)
    # if deleted.get('success'):
    #     print(f"   ✅ Webhook deleted")
    ```

=== "JavaScript"
    ```javascript
    async function getWebhook(webhookId) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/webhooks/${webhookId}`
        );
        return response.json();
    }
    
    async function updateWebhook(webhookId, updates) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/webhooks/${webhookId}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            }
        );
        return response.json();
    }
    
    async function deleteWebhook(webhookId) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/webhooks/${webhookId}`,
            { method: 'DELETE' }
        );
        return response.json();
    }
    
    const webhookId = 'wh_123456789';
    
    // Get details
    const webhook = await getWebhook(webhookId);
    
    console.log("📋 Webhook Details");
    console.log("=".repeat(70));
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Events: ${webhook.events?.join(', ')}`);
    console.log(`   Active: ${webhook.active ? '✅' : '❌'}`);
    
    // Stats
    console.log("\n   📊 Delivery Stats:");
    console.log(`      Total: ${webhook.stats?.totalDeliveries}`);
    console.log(`      Success Rate: ${webhook.stats?.successRate}%`);
    
    // Update
    console.log("\n🔄 Updating Webhook...");
    const updated = await updateWebhook(webhookId, {
        events: ['news.breaking', 'news.trending', 'news.major'],
        filters: { assets: ['BTC', 'ETH', 'SOL'] }
    });
    
    if (updated.success) {
        console.log("   ✅ Webhook updated");
    }
    
    // Pause/Resume
    console.log("\n⏸️ Pausing...");
    await updateWebhook(webhookId, { active: false });
    
    console.log("▶️ Resuming...");
    await updateWebhook(webhookId, { active: true });
    ```

=== "cURL"
    ```bash
    # Get webhook
    curl "https://cryptocurrency.cv/api/webhooks/wh_123456789" | jq
    
    # Update webhook
    curl -X PATCH "https://cryptocurrency.cv/api/webhooks/wh_123456789" \
      -H "Content-Type: application/json" \
      -d '{
        "events": ["news.breaking", "news.trending"],
        "active": true
      }' | jq
    
    # Pause webhook
    curl -X PATCH "https://cryptocurrency.cv/api/webhooks/wh_123456789" \
      -H "Content-Type: application/json" \
      -d '{"active": false}' | jq
    
    # Delete webhook
    curl -X DELETE "https://cryptocurrency.cv/api/webhooks/wh_123456789" | jq
    ```

---

## 4. Testing Webhooks

Test webhook delivery before going live.

=== "Python"
    ```python
    import requests
    
    def test_webhook(webhook_id: str, event_type: str = None):
        """Send a test webhook delivery."""
        data = {}
        if event_type:
            data["eventType"] = event_type
        
        response = requests.post(
            f"https://cryptocurrency.cv/api/webhooks/{webhook_id}/test",
            json=data
        )
        return response.json()
    
    def get_webhook_logs(webhook_id: str, limit: int = 50):
        """Get webhook delivery logs."""
        response = requests.get(
            f"https://cryptocurrency.cv/api/webhooks/{webhook_id}/logs",
            params={"limit": limit}
        )
        return response.json()
    
    webhook_id = "wh_123456789"
    
    # Test webhook
    print("🧪 Testing Webhook")
    print("=" * 70)
    
    test_result = test_webhook(webhook_id, "news.breaking")
    
    if test_result.get('success'):
        print(f"   ✅ Test delivery sent!")
        print(f"      Event: {test_result.get('eventType', 'N/A')}")
        print(f"      Status: {test_result.get('statusCode', 'N/A')}")
        print(f"      Response Time: {test_result.get('responseTime', 'N/A')}ms")
    else:
        print(f"   ❌ Test failed: {test_result.get('error', 'Unknown error')}")
    
    # Test different event types
    print("\n📋 Testing All Event Types:")
    
    event_types = [
        "news.breaking",
        "news.trending",
        "market.price_alert",
        "market.volume_spike",
        "sentiment.change"
    ]
    
    for event_type in event_types:
        result = test_webhook(webhook_id, event_type)
        status = "✅" if result.get('success') else "❌"
        code = result.get('statusCode', 'N/A')
        time = result.get('responseTime', 'N/A')
        print(f"   {status} {event_type:<25} HTTP {code} ({time}ms)")
    
    # View delivery logs
    print("\n📊 Recent Delivery Logs:")
    print("-" * 70)
    
    logs = get_webhook_logs(webhook_id, limit=20)
    
    print(f"   {'Timestamp':<20} {'Event':<20} {'Status':<10} {'Time':<10}")
    print("   " + "-" * 60)
    
    for log in logs.get('logs', [])[:15]:
        timestamp = log.get('timestamp', 'N/A')[:19]
        event = log.get('eventType', 'N/A')[:18]
        status = log.get('statusCode', 'N/A')
        response_time = log.get('responseTime', 0)
        
        status_icon = "✅" if status == 200 else "🟡" if status < 500 else "❌"
        
        print(f"   {timestamp:<20} {event:<20} {status_icon} {status:<6} {response_time}ms")
    
    # Delivery stats
    print("\n📈 Delivery Statistics:")
    stats = logs.get('stats', {})
    print(f"   Total Deliveries: {stats.get('total', 0)}")
    print(f"   Successful: {stats.get('successful', 0)} ({stats.get('successRate', 0):.1f}%)")
    print(f"   Failed: {stats.get('failed', 0)}")
    print(f"   Avg Response Time: {stats.get('avgResponseTime', 0):.0f}ms")
    ```

=== "JavaScript"
    ```javascript
    async function testWebhook(webhookId, eventType = null) {
        const body = eventType ? { eventType } : {};
        
        const response = await fetch(
            `https://cryptocurrency.cv/api/webhooks/${webhookId}/test`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );
        return response.json();
    }
    
    async function getWebhookLogs(webhookId, limit = 50) {
        const response = await fetch(
            `https://cryptocurrency.cv/api/webhooks/${webhookId}/logs?limit=${limit}`
        );
        return response.json();
    }
    
    const webhookId = 'wh_123456789';
    
    // Test webhook
    console.log("🧪 Testing Webhook");
    console.log("=".repeat(70));
    
    const testResult = await testWebhook(webhookId, 'news.breaking');
    
    if (testResult.success) {
        console.log("   ✅ Test delivery sent!");
        console.log(`      Status: ${testResult.statusCode}`);
        console.log(`      Response Time: ${testResult.responseTime}ms`);
    } else {
        console.log(`   ❌ Test failed: ${testResult.error}`);
    }
    
    // Test multiple events
    console.log("\n📋 Testing Event Types:");
    
    const eventTypes = ['news.breaking', 'market.price_alert', 'sentiment.change'];
    
    for (const eventType of eventTypes) {
        const result = await testWebhook(webhookId, eventType);
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${eventType}: HTTP ${result.statusCode} (${result.responseTime}ms)`);
    }
    
    // View logs
    console.log("\n📊 Recent Logs:");
    const logs = await getWebhookLogs(webhookId, 20);
    
    logs.logs?.slice(0, 10).forEach(log => {
        const icon = log.statusCode === 200 ? '✅' : '❌';
        console.log(`   ${icon} ${log.eventType}: ${log.statusCode} (${log.responseTime}ms)`);
    });
    ```

=== "cURL"
    ```bash
    # Test webhook
    curl -X POST "https://cryptocurrency.cv/api/webhooks/wh_123/test" \
      -H "Content-Type: application/json" \
      -d '{"eventType": "news.breaking"}' | jq
    
    # Get delivery logs
    curl "https://cryptocurrency.cv/api/webhooks/wh_123/logs?limit=20" | jq
    
    # Get just recent failures
    curl "https://cryptocurrency.cv/api/webhooks/wh_123/logs" | jq '.logs | map(select(.statusCode != 200))'
    ```

---

## 5. Handling Webhook Payloads

Example server implementation for receiving webhooks.

### Python (Flask)

```python
#!/usr/bin/env python3
"""Flask webhook receiver."""

from flask import Flask, request, jsonify
import hmac
import hashlib
import json

app = Flask(__name__)

WEBHOOK_SECRET = "your-webhook-secret-123"

def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify webhook signature."""
    expected = hmac.new(
        WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

@app.route('/webhooks/news', methods=['POST'])
def handle_news_webhook():
    """Handle news webhooks."""
    # Verify signature
    signature = request.headers.get('X-Webhook-Signature', '')
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401
    
    # Parse payload
    payload = request.json
    event_type = payload.get('eventType', 'unknown')
    
    print(f"📰 Received {event_type} webhook")
    
    # Handle different event types
    if event_type == 'news.breaking':
        article = payload.get('data', {}).get('article', {})
        print(f"   Breaking: {article.get('title', 'Unknown')}")
        print(f"   URL: {article.get('url', 'N/A')}")
        
        # Send alert, store in DB, etc.
        # send_telegram_alert(article)
        
    elif event_type == 'news.trending':
        topics = payload.get('data', {}).get('topics', [])
        print(f"   Trending topics: {', '.join(topics)}")
        
    elif event_type == 'news.major':
        article = payload.get('data', {}).get('article', {})
        importance = payload.get('data', {}).get('importance', 'unknown')
        print(f"   Major news ({importance}): {article.get('title', 'Unknown')}")
    
    return jsonify({"received": True}), 200

@app.route('/webhooks/market', methods=['POST'])
def handle_market_webhook():
    """Handle market webhooks."""
    signature = request.headers.get('X-Webhook-Signature', '')
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401
    
    payload = request.json
    event_type = payload.get('eventType', 'unknown')
    
    print(f"📊 Received {event_type} webhook")
    
    if event_type == 'market.price_alert':
        data = payload.get('data', {})
        asset = data.get('asset', 'Unknown')
        price = data.get('price', 0)
        change = data.get('changePercent', 0)
        
        print(f"   {asset}: ${price:,.2f} ({change:+.2f}%)")
        
        # Execute trading logic
        # if change > 10:
        #     execute_trade(asset, 'sell')
        
    elif event_type == 'market.volume_spike':
        data = payload.get('data', {})
        asset = data.get('asset', 'Unknown')
        volume = data.get('volume', 0)
        multiplier = data.get('multiplier', 1)
        
        print(f"   {asset}: Volume spike {multiplier}x (${volume:,.0f})")
    
    return jsonify({"received": True}), 200

@app.route('/webhooks/sentiment', methods=['POST'])
def handle_sentiment_webhook():
    """Handle sentiment webhooks."""
    signature = request.headers.get('X-Webhook-Signature', '')
    if not verify_signature(request.data, signature):
        return jsonify({"error": "Invalid signature"}), 401
    
    payload = request.json
    event_type = payload.get('eventType', 'unknown')
    
    print(f"😊 Received {event_type} webhook")
    
    if event_type == 'sentiment.change':
        data = payload.get('data', {})
        asset = data.get('asset', 'Unknown')
        old_sentiment = data.get('oldSentiment', 0)
        new_sentiment = data.get('newSentiment', 0)
        
        direction = "📈" if new_sentiment > old_sentiment else "📉"
        print(f"   {asset}: {old_sentiment:.2f} → {new_sentiment:.2f} {direction}")
        
    elif event_type == 'sentiment.extreme':
        data = payload.get('data', {})
        asset = data.get('asset', 'Unknown')
        sentiment = data.get('sentiment', 0)
        level = data.get('level', 'unknown')  # 'extreme_fear' or 'extreme_greed'
        
        print(f"   ⚠️ {asset}: Extreme {level} ({sentiment:.2f})")
    
    return jsonify({"received": True}), 200

if __name__ == '__main__':
    print("🚀 Starting webhook server on port 5000...")
    app.run(port=5000, debug=True)
```

### JavaScript (Express)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'your-webhook-secret-123';

function verifySignature(payload, signature) {
    const expected = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');
    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
    );
}

// Middleware to verify signature
function verifyWebhook(req, res, next) {
    const signature = req.headers['x-webhook-signature'];
    
    if (!signature || !verifySignature(req.body, signature)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    next();
}

// News webhooks
app.post('/webhooks/news', verifyWebhook, (req, res) => {
    const { eventType, data } = req.body;
    
    console.log(`📰 Received ${eventType} webhook`);
    
    switch (eventType) {
        case 'news.breaking':
            console.log(`   Breaking: ${data.article?.title}`);
            // Handle breaking news
            break;
            
        case 'news.trending':
            console.log(`   Trending: ${data.topics?.join(', ')}`);
            break;
            
        case 'news.major':
            console.log(`   Major: ${data.article?.title}`);
            break;
    }
    
    res.json({ received: true });
});

// Market webhooks
app.post('/webhooks/market', verifyWebhook, (req, res) => {
    const { eventType, data } = req.body;
    
    console.log(`📊 Received ${eventType} webhook`);
    
    switch (eventType) {
        case 'market.price_alert':
            console.log(`   ${data.asset}: $${data.price} (${data.changePercent}%)`);
            break;
            
        case 'market.volume_spike':
            console.log(`   ${data.asset}: ${data.multiplier}x volume`);
            break;
    }
    
    res.json({ received: true });
});

// Sentiment webhooks
app.post('/webhooks/sentiment', verifyWebhook, (req, res) => {
    const { eventType, data } = req.body;
    
    console.log(`😊 Received ${eventType} webhook`);
    
    switch (eventType) {
        case 'sentiment.change':
            console.log(`   ${data.asset}: ${data.oldSentiment} → ${data.newSentiment}`);
            break;
            
        case 'sentiment.extreme':
            console.log(`   ⚠️ ${data.asset}: Extreme ${data.level}`);
            break;
    }
    
    res.json({ received: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Webhook server running on port ${PORT}`);
});
```

---

## Complete Webhook Manager

```python
#!/usr/bin/env python3
"""Complete webhook management application."""

import requests
from typing import Dict, Any, List
from datetime import datetime

class WebhookManager:
    """Webhook management client."""
    
    BASE_URL = "https://cryptocurrency.cv"
    
    def __init__(self):
        self.session = requests.Session()
    
    def _get(self, endpoint: str, params: Dict = None) -> Dict[str, Any]:
        response = self.session.get(
            f"{self.BASE_URL}{endpoint}",
            params=params or {}
        )
        return response.json()
    
    def _post(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.BASE_URL}{endpoint}",
            json=data
        )
        return response.json()
    
    def _patch(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        response = self.session.patch(
            f"{self.BASE_URL}{endpoint}",
            json=data
        )
        return response.json()
    
    def _delete(self, endpoint: str) -> Dict[str, Any]:
        response = self.session.delete(f"{self.BASE_URL}{endpoint}")
        return response.json()
    
    # Webhook operations
    def list_webhooks(self):
        return self._get("/api/webhooks")
    
    def create_webhook(self, url: str, events: List[str], **kwargs):
        data = {"url": url, "events": events, **kwargs}
        return self._post("/api/webhooks/create", data)
    
    def get_webhook(self, webhook_id: str):
        return self._get(f"/api/webhooks/{webhook_id}")
    
    def update_webhook(self, webhook_id: str, updates: Dict):
        return self._patch(f"/api/webhooks/{webhook_id}", updates)
    
    def delete_webhook(self, webhook_id: str):
        return self._delete(f"/api/webhooks/{webhook_id}")
    
    def test_webhook(self, webhook_id: str, event_type: str = None):
        data = {"eventType": event_type} if event_type else {}
        return self._post(f"/api/webhooks/{webhook_id}/test", data)
    
    def get_logs(self, webhook_id: str, limit: int = 50):
        return self._get(f"/api/webhooks/{webhook_id}/logs", {"limit": limit})
    
    def get_events(self):
        return self._get("/api/webhooks/events")
    
    def run_dashboard(self):
        """Run webhook management dashboard."""
        print("=" * 80)
        print("🔗 WEBHOOK MANAGEMENT DASHBOARD")
        print(f"   Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # List webhooks
        print("\n📋 YOUR WEBHOOKS")
        print("-" * 80)
        try:
            webhooks = self.list_webhooks()
            for wh in webhooks.get('webhooks', []):
                status = "🟢" if wh.get('active') else "🔴"
                print(f"   {status} {wh.get('id', 'N/A')[:12]}...")
                print(f"      URL: {wh.get('url', 'N/A')[:50]}")
                print(f"      Events: {', '.join(wh.get('events', []))}")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Available events
        print("\n📦 AVAILABLE EVENTS")
        print("-" * 80)
        try:
            events = self.get_events()
            for cat, cat_events in events.get('events', {}).items():
                print(f"   {cat}: {len(cat_events)} events")
        except Exception as e:
            print(f"   Error: {e}")
        
        # Recent activity
        print("\n📊 RECENT DELIVERY ACTIVITY")
        print("-" * 80)
        try:
            webhooks = self.list_webhooks()
            for wh in webhooks.get('webhooks', [])[:3]:
                wh_id = wh.get('id', '')
                logs = self.get_logs(wh_id, 5)
                print(f"\n   Webhook: {wh_id[:12]}...")
                for log in logs.get('logs', [])[:3]:
                    icon = "✅" if log.get('statusCode') == 200 else "❌"
                    print(f"      {icon} {log.get('eventType', 'N/A')}: {log.get('statusCode', 'N/A')}")
        except Exception as e:
            print(f"   Error: {e}")
        
        print("\n" + "=" * 80)
        print("✅ Dashboard complete!")

def main():
    manager = WebhookManager()
    manager.run_dashboard()

if __name__ == "__main__":
    main()
```

---

## Next Steps

- [User Alerts](user-alerts.md) - Configure alert notifications
- [Real-time SSE](realtime-sse.md) - Server-sent events
- [Premium Features](premium-features.md) - Advanced webhook options
