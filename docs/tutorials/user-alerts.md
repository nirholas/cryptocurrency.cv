# 👤 User Alerts & Webhooks Tutorial

Create custom alerts and receive real-time notifications via webhooks.

---

## Endpoints Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET/POST | List/create alerts |
| `/api/alerts/[id]` | GET/PUT/DELETE | Manage specific alert |
| `/api/webhooks` | POST | Register webhooks |
| `/api/webhooks/test` | POST | Test webhook delivery |
| `/api/webhooks/queue` | GET | View webhook queue |

---

## Create an Alert

=== "Python"

    ```python
    import requests
    from typing import Optional, List
    
    BASE_URL = "https://cryptocurrency.cv"
    
    
    def create_alert(
        name: str,
        condition: dict,
        channels: List[str] = None,
        webhook_url: Optional[str] = None,
        cooldown: int = 300
    ) -> dict:
        """
        Create a new alert rule.
        
        Args:
            name: Alert name
            condition: Alert condition (see examples below)
            channels: Notification channels (email, webhook, push)
            webhook_url: Webhook URL for notifications
            cooldown: Minimum seconds between alerts (default: 300)
        
        Returns:
            Created alert object
        """
        payload = {
            "name": name,
            "condition": condition,
            "channels": channels or ["webhook"],
            "cooldown": cooldown
        }
        
        if webhook_url:
            payload["webhookUrl"] = webhook_url
        
        response = requests.post(
            f"{BASE_URL}/api/alerts",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json()
    
    
    # Example: Create keyword alert
    alert = create_alert(
        name="Bitcoin ETF News",
        condition={
            "type": "keyword",
            "keywords": ["bitcoin", "btc", "etf"],
            "operator": "AND"  # or "OR"
        },
        webhook_url="https://your-server.com/webhook",
        cooldown=600  # 10 minutes between alerts
    )
    
    print(f"✅ Created alert: {alert.get('alert', {}).get('id', 'N/A')}")
    
    
    # Example: Price alert
    price_alert = create_alert(
        name="BTC Above $100K",
        condition={
            "type": "price",
            "asset": "BTC",
            "operator": "above",
            "value": 100000
        },
        webhook_url="https://your-server.com/webhook"
    )
    
    
    # Example: Sentiment alert
    sentiment_alert = create_alert(
        name="Market Sentiment Shift",
        condition={
            "type": "sentiment",
            "asset": "BTC",
            "threshold": -0.5,  # Alert when sentiment drops below -0.5
            "operator": "below"
        },
        webhook_url="https://your-server.com/webhook"
    )
    
    
    # Example: Breaking news alert
    breaking_alert = create_alert(
        name="All Breaking News",
        condition={
            "type": "breaking",
            "sources": ["coindesk", "theblock", "cointelegraph"]
        },
        channels=["webhook", "email"],
        webhook_url="https://your-server.com/webhook",
        cooldown=0  # Immediate for breaking news
    )
    ```

=== "JavaScript"

    ```javascript
    const BASE_URL = "https://cryptocurrency.cv";
    
    async function createAlert(options) {
        const { name, condition, channels = ["webhook"], webhookUrl, cooldown = 300 } = options;
        
        const payload = {
            name,
            condition,
            channels,
            cooldown
        };
        
        if (webhookUrl) {
            payload.webhookUrl = webhookUrl;
        }
        
        const response = await fetch(`${BASE_URL}/api/alerts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        return response.json();
    }
    
    // Create keyword alert
    const alert = await createAlert({
        name: "Bitcoin ETF News",
        condition: {
            type: "keyword",
            keywords: ["bitcoin", "btc", "etf"],
            operator: "AND"
        },
        webhookUrl: "https://your-server.com/webhook"
    });
    
    console.log(`✅ Created alert: ${alert.alert?.id}`);
    
    
    // Whale transaction alert
    const whaleAlert = await createAlert({
        name: "Large BTC Transactions",
        condition: {
            type: "whale",
            asset: "BTC",
            minValue: 10000000  // $10M+
        },
        webhookUrl: "https://your-server.com/webhook"
    });
    ```

=== "cURL"

    ```bash
    # Create keyword alert
    curl -X POST "https://cryptocurrency.cv/api/alerts" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Bitcoin ETF News",
        "condition": {
          "type": "keyword",
          "keywords": ["bitcoin", "etf"],
          "operator": "AND"
        },
        "channels": ["webhook"],
        "webhookUrl": "https://your-server.com/webhook",
        "cooldown": 600
      }'
    
    # Create price alert
    curl -X POST "https://cryptocurrency.cv/api/alerts" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "BTC Above 100K",
        "condition": {
          "type": "price",
          "asset": "BTC",
          "operator": "above",
          "value": 100000
        },
        "webhookUrl": "https://your-server.com/webhook"
      }'
    ```

---

## Alert Condition Types

| Type | Description | Parameters |
|------|-------------|------------|
| `keyword` | Match keywords in news | `keywords`, `operator` (AND/OR) |
| `price` | Price threshold crossed | `asset`, `operator`, `value` |
| `sentiment` | Sentiment threshold | `asset`, `threshold`, `operator` |
| `breaking` | Breaking news published | `sources` (optional) |
| `whale` | Large transactions | `asset`, `minValue` |
| `liquidation` | Mass liquidations | `threshold`, `side` |
| `source` | News from specific source | `sources` |

---

## List Alerts

=== "Python"

    ```python
    def list_alerts(user_id: Optional[str] = None) -> dict:
        """List all alerts, optionally filtered by user."""
        params = {}
        if user_id:
            params["userId"] = user_id
        
        response = requests.get(f"{BASE_URL}/api/alerts", params=params)
        return response.json()
    
    
    # List all alerts
    alerts = list_alerts()
    
    print(f"📋 YOUR ALERTS ({alerts.get('total', 0)} total)")
    print("=" * 60)
    
    for alert in alerts.get("alerts", []):
        alert_id = alert.get("id", "N/A")
        name = alert.get("name", "Unnamed")
        condition = alert.get("condition", {})
        active = alert.get("active", True)
        
        status = "🟢" if active else "🔴"
        print(f"\n{status} {name}")
        print(f"   ID: {alert_id}")
        print(f"   Type: {condition.get('type', 'N/A')}")
        print(f"   Cooldown: {alert.get('cooldown', 0)}s")
    ```

=== "JavaScript"

    ```javascript
    async function listAlerts(userId) {
        const params = new URLSearchParams();
        if (userId) params.set("userId", userId);
        
        const response = await fetch(`${BASE_URL}/api/alerts?${params}`);
        return response.json();
    }
    
    const alerts = await listAlerts();
    
    console.log(`📋 YOUR ALERTS (${alerts.total} total)`);
    
    alerts.alerts?.forEach(alert => {
        const status = alert.active ? "🟢" : "🔴";
        console.log(`${status} ${alert.name} (${alert.condition?.type})`);
    });
    ```

=== "cURL"

    ```bash
    # List all alerts
    curl "https://cryptocurrency.cv/api/alerts"
    
    # Filter by user
    curl "https://cryptocurrency.cv/api/alerts?userId=user123"
    ```

---

## Get, Update, Delete Alert

=== "Python"

    ```python
    def get_alert(alert_id: str) -> dict:
        """Get a specific alert by ID."""
        response = requests.get(f"{BASE_URL}/api/alerts/{alert_id}")
        return response.json()
    
    
    def update_alert(alert_id: str, updates: dict) -> dict:
        """Update an alert."""
        response = requests.put(
            f"{BASE_URL}/api/alerts/{alert_id}",
            json=updates,
            headers={"Content-Type": "application/json"}
        )
        return response.json()
    
    
    def delete_alert(alert_id: str) -> dict:
        """Delete an alert."""
        response = requests.delete(f"{BASE_URL}/api/alerts/{alert_id}")
        return response.json()
    
    
    # Get alert details
    alert = get_alert("alert_abc123")
    print(f"Alert: {alert.get('name')}")
    
    # Update alert (e.g., disable it)
    updated = update_alert("alert_abc123", {
        "active": False,
        "cooldown": 900  # 15 minutes
    })
    print(f"Updated: {updated.get('success')}")
    
    # Delete alert
    deleted = delete_alert("alert_abc123")
    print(f"Deleted: {deleted.get('success')}")
    ```

=== "JavaScript"

    ```javascript
    async function getAlert(alertId) {
        const response = await fetch(`${BASE_URL}/api/alerts/${alertId}`);
        return response.json();
    }
    
    async function updateAlert(alertId, updates) {
        const response = await fetch(`${BASE_URL}/api/alerts/${alertId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates)
        });
        return response.json();
    }
    
    async function deleteAlert(alertId) {
        const response = await fetch(`${BASE_URL}/api/alerts/${alertId}`, {
            method: "DELETE"
        });
        return response.json();
    }
    
    // Pause an alert
    await updateAlert("alert_abc123", { active: false });
    
    // Resume an alert
    await updateAlert("alert_abc123", { active: true });
    ```

=== "cURL"

    ```bash
    # Get alert
    curl "https://cryptocurrency.cv/api/alerts/alert_abc123"
    
    # Update alert
    curl -X PUT "https://cryptocurrency.cv/api/alerts/alert_abc123" \
      -H "Content-Type: application/json" \
      -d '{"active": false}'
    
    # Delete alert
    curl -X DELETE "https://cryptocurrency.cv/api/alerts/alert_abc123"
    ```

---

## Test Alert

Trigger a test notification for an alert:

=== "Python"

    ```python
    def test_alert(alert_id: str) -> dict:
        """Send a test notification for an alert."""
        response = requests.post(
            f"{BASE_URL}/api/alerts/{alert_id}",
            params={"action": "test"}
        )
        return response.json()
    
    
    # Test an alert
    result = test_alert("alert_abc123")
    
    if result.get("success"):
        print("✅ Test notification sent!")
    else:
        print(f"❌ Test failed: {result.get('error')}")
    ```

=== "cURL"

    ```bash
    curl -X POST "https://cryptocurrency.cv/api/alerts/alert_abc123?action=test"
    ```

---

## Register Webhooks

Register a webhook to receive events:

=== "Python"

    ```python
    def register_webhook(
        url: str,
        events: List[str],
        secret: Optional[str] = None,
        filters: Optional[dict] = None
    ) -> dict:
        """
        Register a webhook endpoint.
        
        Args:
            url: Your webhook endpoint URL
            events: Events to subscribe to (news, breaking, price, whale, etc.)
            secret: Secret for signature verification
            filters: Optional filters (sources, assets, etc.)
        
        Returns:
            Webhook registration response
        """
        payload = {
            "url": url,
            "events": events
        }
        
        if secret:
            payload["secret"] = secret
        if filters:
            payload["filters"] = filters
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json()
    
    
    # Register for all news events
    webhook = register_webhook(
        url="https://your-server.com/webhook",
        events=["news", "breaking", "price"],
        secret="your-webhook-secret-123",
        filters={
            "sources": ["coindesk", "theblock"],
            "assets": ["BTC", "ETH"]
        }
    )
    
    print(f"✅ Webhook registered: {webhook.get('webhook', {}).get('id')}")
    ```

=== "JavaScript"

    ```javascript
    async function registerWebhook(options) {
        const { url, events, secret, filters } = options;
        
        const payload = { url, events };
        if (secret) payload.secret = secret;
        if (filters) payload.filters = filters;
        
        const response = await fetch(`${BASE_URL}/api/webhooks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        return response.json();
    }
    
    const webhook = await registerWebhook({
        url: "https://your-server.com/webhook",
        events: ["news", "breaking", "whale"],
        secret: "your-webhook-secret"
    });
    
    console.log(`✅ Webhook ID: ${webhook.webhook?.id}`);
    ```

=== "cURL"

    ```bash
    curl -X POST "https://cryptocurrency.cv/api/webhooks" \
      -H "Content-Type: application/json" \
      -d '{
        "url": "https://your-server.com/webhook",
        "events": ["news", "breaking", "price"],
        "secret": "your-webhook-secret",
        "filters": {
          "sources": ["coindesk"],
          "assets": ["BTC", "ETH"]
        }
      }'
    ```

---

## Webhook Event Types

| Event | Description | Payload |
|-------|-------------|---------|
| `news` | New article published | Article object |
| `breaking` | Breaking news alert | Article object |
| `price` | Price update | Price data |
| `whale` | Large transaction | Transaction data |
| `liquidation` | Liquidation event | Liquidation data |
| `sentiment` | Sentiment change | Sentiment data |

---

## Webhook Payload Format

Your endpoint will receive POST requests with this format:

```json
{
  "event": "news",
  "timestamp": "2026-02-02T12:00:00Z",
  "data": {
    "title": "Bitcoin Surges to New High",
    "link": "https://...",
    "source": "CoinDesk",
    "pubDate": "2026-02-02T11:55:00Z"
  },
  "signature": "sha256=abc123..."
}
```

---

## Verify Webhook Signature

=== "Python"

    ```python
    import hmac
    import hashlib
    from flask import Flask, request
    
    app = Flask(__name__)
    WEBHOOK_SECRET = "your-webhook-secret"
    
    
    def verify_signature(payload: bytes, signature: str) -> bool:
        """Verify webhook signature."""
        expected = hmac.new(
            WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(f"sha256={expected}", signature)
    
    
    @app.route("/webhook", methods=["POST"])
    def handle_webhook():
        # Get signature from header
        signature = request.headers.get("X-Webhook-Signature", "")
        
        # Verify signature
        if not verify_signature(request.data, signature):
            return {"error": "Invalid signature"}, 401
        
        # Parse payload
        event = request.json
        event_type = event.get("event")
        data = event.get("data")
        
        print(f"📥 Received {event_type} event")
        
        if event_type == "breaking":
            print(f"🔴 BREAKING: {data.get('title')}")
            # Handle breaking news
        
        elif event_type == "news":
            print(f"📰 {data.get('title')}")
            # Handle regular news
        
        elif event_type == "whale":
            print(f"🐋 Whale alert: ${data.get('value'):,.0f}")
            # Handle whale transaction
        
        return {"received": True}, 200
    
    
    if __name__ == "__main__":
        app.run(port=5000)
    ```

=== "JavaScript (Express)"

    ```javascript
    const express = require("express");
    const crypto = require("crypto");
    
    const app = express();
    const WEBHOOK_SECRET = "your-webhook-secret";
    
    // Raw body for signature verification
    app.use(express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        }
    }));
    
    function verifySignature(payload, signature) {
        const expected = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(payload)
            .digest("hex");
        
        return signature === `sha256=${expected}`;
    }
    
    app.post("/webhook", (req, res) => {
        const signature = req.headers["x-webhook-signature"] || "";
        
        // Verify signature
        if (!verifySignature(req.rawBody, signature)) {
            return res.status(401).json({ error: "Invalid signature" });
        }
        
        const { event, data } = req.body;
        
        console.log(`📥 Received ${event} event`);
        
        switch (event) {
            case "breaking":
                console.log(`🔴 BREAKING: ${data.title}`);
                break;
            case "news":
                console.log(`📰 ${data.title}`);
                break;
            case "whale":
                console.log(`🐋 Whale: $${data.value?.toLocaleString()}`);
                break;
        }
        
        res.json({ received: true });
    });
    
    app.listen(5000, () => {
        console.log("Webhook server running on port 5000");
    });
    ```

---

## Test Webhook

Test your webhook endpoint:

=== "Python"

    ```python
    def test_webhook(webhook_id: str) -> dict:
        """Send a test webhook delivery."""
        response = requests.post(
            f"{BASE_URL}/api/webhooks/test",
            json={"webhookId": webhook_id},
            headers={"Content-Type": "application/json"}
        )
        return response.json()
    
    
    result = test_webhook("webhook_abc123")
    
    if result.get("success"):
        print("✅ Test webhook sent!")
        print(f"   Response: {result.get('response')}")
    else:
        print(f"❌ Test failed: {result.get('error')}")
    ```

=== "cURL"

    ```bash
    curl -X POST "https://cryptocurrency.cv/api/webhooks/test" \
      -H "Content-Type: application/json" \
      -d '{"webhookId": "webhook_abc123"}'
    ```

---

## Webhook Queue Status

Monitor your webhook delivery queue:

=== "Python"

    ```python
    def get_webhook_queue() -> dict:
        """Get webhook queue status."""
        response = requests.get(f"{BASE_URL}/api/webhooks/queue")
        return response.json()
    
    
    queue = get_webhook_queue()
    
    print("📊 WEBHOOK QUEUE STATUS")
    print("=" * 50)
    print(f"Pending:    {queue.get('pending', 0)}")
    print(f"Processing: {queue.get('processing', 0)}")
    print(f"Completed:  {queue.get('completed', 0)}")
    print(f"Failed:     {queue.get('failed', 0)}")
    
    print("\n📋 Recent Jobs:")
    for job in queue.get("jobs", [])[:10]:
        status = job.get("status", "unknown")
        emoji = "✅" if status == "completed" else "❌" if status == "failed" else "⏳"
        print(f"   {emoji} {job.get('event')} - {status}")
    ```

=== "cURL"

    ```bash
    curl "https://cryptocurrency.cv/api/webhooks/queue"
    ```

---

## Complete Alert System Example

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Complete Alert System
    Demonstrates creating and managing a full alert workflow.
    """
    
    import requests
    from flask import Flask, request
    import hmac
    import hashlib
    
    BASE_URL = "https://cryptocurrency.cv"
    WEBHOOK_SECRET = "your-secret-key"
    
    
    class AlertManager:
        def __init__(self, webhook_url: str):
            self.webhook_url = webhook_url
            self.alerts = {}
        
        def create_alert(self, name: str, condition: dict) -> dict:
            response = requests.post(
                f"{BASE_URL}/api/alerts",
                json={
                    "name": name,
                    "condition": condition,
                    "channels": ["webhook"],
                    "webhookUrl": self.webhook_url,
                    "cooldown": 300
                }
            )
            result = response.json()
            
            if result.get("alert"):
                self.alerts[result["alert"]["id"]] = result["alert"]
            
            return result
        
        def setup_standard_alerts(self):
            """Set up a standard set of alerts."""
            
            # 1. Breaking news
            self.create_alert(
                "All Breaking News",
                {"type": "breaking"}
            )
            
            # 2. Bitcoin price alerts
            self.create_alert(
                "BTC Above $100K",
                {
                    "type": "price",
                    "asset": "BTC",
                    "operator": "above",
                    "value": 100000
                }
            )
            
            # 3. ETF news
            self.create_alert(
                "ETF News",
                {
                    "type": "keyword",
                    "keywords": ["ETF", "SEC", "approval"],
                    "operator": "OR"
                }
            )
            
            # 4. Whale alerts
            self.create_alert(
                "Large BTC Movements",
                {
                    "type": "whale",
                    "asset": "BTC",
                    "minValue": 10000000
                }
            )
            
            # 5. Sentiment shift
            self.create_alert(
                "Bearish Sentiment",
                {
                    "type": "sentiment",
                    "threshold": -0.5,
                    "operator": "below"
                }
            )
            
            print(f"✅ Created {len(self.alerts)} alerts")
    
    
    # Flask webhook handler
    app = Flask(__name__)
    
    @app.route("/webhook", methods=["POST"])
    def handle_alert():
        # Verify signature
        signature = request.headers.get("X-Webhook-Signature", "")
        expected = f"sha256={hmac.new(WEBHOOK_SECRET.encode(), request.data, hashlib.sha256).hexdigest()}"
        
        if not hmac.compare_digest(expected, signature):
            return {"error": "Invalid signature"}, 401
        
        event = request.json
        event_type = event.get("event")
        data = event.get("data")
        
        # Handle different event types
        if event_type == "breaking":
            handle_breaking_news(data)
        elif event_type == "price":
            handle_price_alert(data)
        elif event_type == "whale":
            handle_whale_alert(data)
        elif event_type == "sentiment":
            handle_sentiment_alert(data)
        
        return {"received": True}
    
    
    def handle_breaking_news(data):
        print(f"🔴 BREAKING: {data.get('title')}")
        # Send to Discord, Slack, Telegram, etc.
    
    
    def handle_price_alert(data):
        print(f"💰 PRICE ALERT: {data.get('asset')} = ${data.get('price'):,.2f}")
        # Execute trading logic
    
    
    def handle_whale_alert(data):
        print(f"🐋 WHALE: ${data.get('value'):,.0f} {data.get('asset')}")
        # Analyze whale movement
    
    
    def handle_sentiment_alert(data):
        print(f"📊 SENTIMENT: {data.get('sentiment')} ({data.get('score')})")
        # Adjust trading strategy
    
    
    if __name__ == "__main__":
        # Setup alerts
        manager = AlertManager("https://your-server.com/webhook")
        manager.setup_standard_alerts()
        
        # Start webhook server
        app.run(port=5000)
    ```

---

## Next Steps

- [Newsletter Subscription](user-newsletter.md) - Email digests
- [Portfolio Tracking](user-portfolio.md) - Track your holdings
- [Real-Time Streaming](realtime-sse.md) - SSE streaming
