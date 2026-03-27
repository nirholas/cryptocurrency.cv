# 👤 User Alerts Tutorial

Create custom alerts and receive real-time notifications.

---

## Endpoints Covered

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET/POST | List/create alerts |
| `/api/alerts/[id]` | GET/PUT/DELETE | Manage specific alert |

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
        cooldown: int = 300
    ) -> dict:
        """
        Create a new alert rule.

        Args:
            name: Alert name
            condition: Alert condition (see examples below)
            channels: Notification channels (websocket, email, push)
            cooldown: Minimum seconds between alerts (default: 300)

        Returns:
            Created alert object
        """
        payload = {
            "name": name,
            "condition": condition,
            "channels": channels or ["websocket"],
            "cooldown": cooldown
        }

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
        }
    )


    # Example: Sentiment alert
    sentiment_alert = create_alert(
        name="Market Sentiment Shift",
        condition={
            "type": "sentiment",
            "asset": "BTC",
            "threshold": -0.5,  # Alert when sentiment drops below -0.5
            "operator": "below"
        }
    )


    # Example: Breaking news alert
    breaking_alert = create_alert(
        name="All Breaking News",
        condition={
            "type": "breaking",
            "sources": ["coindesk", "theblock", "cointelegraph"]
        },
        channels=["websocket", "email"],
        cooldown=0  # Immediate for breaking news
    )
    ```

=== "JavaScript"

    ```javascript
    const BASE_URL = "https://cryptocurrency.cv";
    
    async function createAlert(options) {
        const { name, condition, channels = ["websocket"], cooldown = 300 } = options;

        const payload = {
            name,
            condition,
            channels,
            cooldown
        };

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
        }
    });

    console.log(`✅ Created alert: ${alert.alert?.id}`);


    // Whale transaction alert
    const whaleAlert = await createAlert({
        name: "Large BTC Transactions",
        condition: {
            type: "whale",
            asset: "BTC",
            minValue: 10000000  // $10M+
        }
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
        "channels": ["websocket"],
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
        }
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

## Complete Alert System Example

=== "Python"

    ```python
    #!/usr/bin/env python3
    """
    Complete Alert System
    Demonstrates creating and managing a full alert workflow.
    """

    import requests

    BASE_URL = "https://cryptocurrency.cv"


    class AlertManager:
        def __init__(self):
            self.alerts = {}

        def create_alert(self, name: str, condition: dict) -> dict:
            response = requests.post(
                f"{BASE_URL}/api/alerts",
                json={
                    "name": name,
                    "condition": condition,
                    "channels": ["websocket"],
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


    if __name__ == "__main__":
        # Setup alerts
        manager = AlertManager()
        manager.setup_standard_alerts()
    ```

---

## Next Steps

- [Newsletter Subscription](user-newsletter.md) - Email digests
- [Portfolio Tracking](user-portfolio.md) - Track your holdings
- [Real-Time Streaming](realtime-sse.md) - SSE streaming
