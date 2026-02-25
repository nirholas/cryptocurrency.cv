# Prompt 04: WebSocket Horizontal Scaling

## Context

`ws-server.js` is a 1,097-line Node.js WebSocket server that already has:
- Redis pub/sub for cross-instance broadcasting
- Leader election (only leader polls upstream APIs)
- Per-message deflate compression
- Rate limiting (60 msg/min, 50 max subscriptions)
- Max 10,000 connections per instance

**But it needs work for 100K+ concurrent connections:**
- Connection state is still partially in-memory (subscriptions, user metadata)
- No sticky sessions for reconnection (client reconnects to different instance, loses state)
- No backpressure mechanism when Redis pub/sub lags
- No connection draining for zero-downtime deploys
- No metrics export (can't alert on connection counts, message rates)

## Task

### 1. Shared State via Redis

Move all per-connection state to Redis so any instance can serve any client:

```typescript
// Store subscriptions in Redis sets
await redis.sadd(`ws:subs:${connectionId}`, ...channels);
await redis.sadd(`ws:channel:${channel}`, connectionId);

// Store connection metadata
await redis.hset(`ws:conn:${connectionId}`, {
  instanceId,
  connectedAt: Date.now(),
  lastPingAt: Date.now(),
  clientIp,
  subscriptions: JSON.stringify(channels),
});

// TTL for auto-cleanup of stale connections
await redis.expire(`ws:conn:${connectionId}`, 300); // 5min heartbeat
```

### 2. Connection Draining for Zero-Downtime Deploys

When an instance receives SIGTERM:
1. Stop accepting new connections
2. Send `{type: "reconnect", reason: "server-shutdown"}` to all clients
3. Wait up to 30s for clients to reconnect to other instances
4. Force-close remaining connections
5. Exit cleanly

```typescript
process.on('SIGTERM', async () => {
  server.close(); // Stop accepting new connections

  // Notify all clients
  for (const ws of wss.clients) {
    ws.send(JSON.stringify({ type: 'reconnect', reason: 'server-shutdown' }));
  }

  // Grace period
  await new Promise(resolve => setTimeout(resolve, 30_000));

  // Force close
  for (const ws of wss.clients) {
    ws.terminate();
  }

  process.exit(0);
});
```

### 3. Backpressure on Redis Pub/Sub

When a subscriber falls behind (slow client, network congestion):

```typescript
// Track per-client message queue depth
const clientBuffers = new Map<string, number>();

function sendToClient(ws, message) {
  if (ws.bufferedAmount > MAX_BUFFER_SIZE) {
    // Client is slow — drop non-critical messages
    if (message.type !== 'breaking_news') {
      metrics.droppedMessages.inc();
      return;
    }
  }
  ws.send(JSON.stringify(message));
}
```

### 4. Prometheus Metrics Export

Add a `/metrics` HTTP endpoint on the WS server:

```
# HELP ws_connections_total Current WebSocket connections
# TYPE ws_connections_total gauge
ws_connections_total{instance="ws-1"} 4523

# HELP ws_messages_sent_total Messages sent to clients
# TYPE ws_messages_sent_total counter
ws_messages_sent_total{channel="bitcoin"} 152847

# HELP ws_messages_dropped_total Messages dropped due to backpressure
# TYPE ws_messages_dropped_total counter
ws_messages_dropped_total 42

# HELP ws_subscriptions_total Active channel subscriptions
# TYPE ws_subscriptions_total gauge
ws_subscriptions_total{channel="bitcoin"} 3201
```

### 5. Client Reconnection Protocol

Update the client SDK to handle reconnection gracefully:

```typescript
// Client-side reconnection with exponential backoff
class CryptoNewsWS {
  private reconnectAttempts = 0;
  private subscriptions = new Set<string>();

  connect() {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Re-subscribe to all channels
      for (const channel of this.subscriptions) {
        this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
      }
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'reconnect') {
        this.ws.close();
        this.scheduleReconnect();
      }
    };

    this.ws.onclose = () => this.scheduleReconnect();
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => this.connect(), delay + Math.random() * 1000);
    this.reconnectAttempts++;
  }
}
```

### 6. Docker Compose Scale Config

Update `docker-compose.scale.yml`:

```yaml
websocket:
  build: .
  command: node ws-server.js
  deploy:
    replicas: 4
    resources:
      limits:
        memory: 512M
        cpus: '1.0'
  environment:
    - REDIS_URL=redis://redis:6379
    - WS_MAX_CONNECTIONS=25000  # 25K per instance × 4 = 100K total
    - WS_PORT=3001
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
    interval: 10s
    timeout: 5s
    retries: 3
```

Nginx config for sticky sessions:
```nginx
upstream websocket {
    ip_hash;  # Sticky sessions for WebSocket
    server websocket:3001;
}
```

## Success Criteria

- [ ] All connection state stored in Redis (survives instance restart)
- [ ] Graceful connection draining on SIGTERM
- [ ] Backpressure handling prevents slow clients from affecting others
- [ ] Prometheus metrics endpoint on WS server
- [ ] Client reconnection with exponential backoff and subscription restore
- [ ] Docker compose scales to 4+ WS instances with shared Redis
- [ ] Load test: 10K concurrent connections across 4 instances
