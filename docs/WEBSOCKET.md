# WebSocket Server — Client Guide

## Connection

Connect to the WebSocket server:

```
ws://localhost:8080
ws://localhost:8080?apiKey=YOUR_KEY
```

## Health Endpoints

A separate HTTP health server runs on port 8081 (configurable via `WS_HEALTH_PORT`):

| Endpoint     | Description                                  |
| ------------ | -------------------------------------------- |
| `/health`    | Full health check with connection stats      |
| `/healthz`   | Alias for `/health` (Kubernetes-compatible)  |
| `/ready`     | Readiness probe (checks Redis when required) |
| `/metrics`   | Prometheus-compatible metrics                |

## WebSocket Client Reconnection

The server sends a `server_shutdown` event before planned restarts. Implement exponential backoff for resilient connections:

### Server Shutdown Event

When the server is shutting down, all connected clients receive:

```json
{
  "type": "system",
  "event": "server_shutdown",
  "message": "Server is restarting. Please reconnect.",
  "reconnectAfter": 5000
}
```

### JavaScript Example

```js
class CryptoNewsSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.maxRetries = options.maxRetries || 10;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.retries = 0;
    this.onMessage = null;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retries = 0; // Reset on successful connection
      console.log('Connected to crypto news stream');
    };

    this.ws.onclose = (event) => {
      if (event.code === 1000) return; // Normal close
      this.reconnect();
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'system' && data.event === 'server_shutdown') {
        // Server is restarting — reconnect after suggested delay
        setTimeout(() => this.connect(), data.reconnectAfter || 5000);
        return;
      }
      this.onMessage?.(data);
    };
  }

  reconnect() {
    if (this.retries >= this.maxRetries) {
      console.error('Max reconnection attempts reached');
      return;
    }
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retries) + Math.random() * 1000,
      this.maxDelay
    );
    this.retries++;
    console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${this.retries})`);
    setTimeout(() => this.connect(), delay);
  }

  close() {
    if (this.ws) {
      this.ws.close(1000, 'Client closing');
    }
  }
}
```

### Usage

```js
const socket = new CryptoNewsSocket('ws://localhost:8080?apiKey=YOUR_KEY');

socket.onMessage = (data) => {
  switch (data.type) {
    case 'news':
      console.log('News:', data.payload.articles);
      break;
    case 'prices':
      console.log('Prices:', data.payload.prices);
      break;
    case 'whales':
      console.log('Whale alert:', data.payload);
      break;
    case 'sentiment':
      console.log('Sentiment:', data.payload);
      break;
  }
};

socket.connect();
```

### Python Example

```python
import asyncio
import json
import random
import websockets

class CryptoNewsSocket:
    def __init__(self, url, max_retries=10, base_delay=1.0, max_delay=30.0):
        self.url = url
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.retries = 0

    async def connect(self, on_message):
        while self.retries < self.max_retries:
            try:
                async with websockets.connect(self.url) as ws:
                    self.retries = 0
                    async for raw in ws:
                        data = json.loads(raw)
                        if data.get("type") == "system" and data.get("event") == "server_shutdown":
                            delay = data.get("reconnectAfter", 5000) / 1000
                            await asyncio.sleep(delay)
                            break
                        await on_message(data)
            except (websockets.ConnectionClosed, OSError):
                pass

            delay = min(self.base_delay * (2 ** self.retries) + random.random(), self.max_delay)
            self.retries += 1
            print(f"Reconnecting in {delay:.1f}s (attempt {self.retries})")
            await asyncio.sleep(delay)
```

## Session Restoration

After reconnecting, you can restore your previous session by sending:

```json
{
  "type": "restore",
  "payload": {
    "previousClientId": "ws_1234567890_abc123def"
  }
}
```

The server preserves session state in Redis for 5 minutes after disconnection, allowing any instance to restore subscriptions, channel memberships, and stream flags.

## Backpressure

The server monitors each client's send buffer. If a client is consuming messages too slowly (buffer exceeds 256 KB), non-critical messages are dropped silently. Breaking news alerts are never dropped. Clients are not disconnected due to backpressure.

## Heartbeat

The server sends WebSocket protocol-level pings every 30 seconds (configurable via `WS_HEARTBEAT_INTERVAL`). If a client does not respond with a pong within 10 seconds (`WS_HEARTBEAT_TIMEOUT`), the connection is terminated with an error payload containing reconnection guidance.
