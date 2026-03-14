# 46 — Harden WebSocket Server Resilience

## Goal

Improve the production resilience of `ws-server.js` — the standalone WebSocket server handling real-time news broadcasting, price streaming, whale alerts, and market sentiment. Add health check endpoints, structured graceful shutdown, reconnection documentation, and monitoring hooks.

## Context

- **File:** `ws-server.js` (standalone Node.js process, not part of Next.js)
- **Features already implemented:**
  - Real-time news broadcasting
  - Live price streaming (BTC, ETH, top coins)
  - Whale alert streaming
  - Market sentiment updates (Fear & Greed)
  - Subscription-based filtering (sources, topics, coins, keywords)
  - Topic channels (bitcoin, defi, nft, regulation, etc.)
  - API key authentication via query param
  - Per-API-key connection limits
  - Server-initiated ping/pong heartbeat
  - permessage-deflate compression
  - Rate limiting
  - Redis pub/sub for cross-instance broadcasting
  - Redis-backed global connection counting
  - Graceful shutdown with 30s drain
  - Leader election for upstream polling
- **Docker:** 2 replicas, 0.5 CPU / 256MB each, health checks configured
- **Dependencies:** ws library, ioredis (optional)

## Task

### 1. Read ws-server.js Fully

Read the entire `ws-server.js` to understand the current implementation before making changes.

### 2. Add HTTP Health Check Endpoint

The WebSocket server should expose an HTTP health endpoint for Docker/load balancer health checks. If one doesn't exist, add it:

```javascript
// HTTP health check server (runs alongside WebSocket)
const http = require('http');

const healthServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    const health = {
      status: 'ok',
      uptime: process.uptime(),
      connections: {
        total: wss.clients.size,
        authenticated: countAuthenticated(),
        anonymous: wss.clients.size - countAuthenticated(),
      },
      channels: getChannelStats(),
      redis: {
        connected: redisClient?.status === 'ready',
        pubsub: redisSub?.status === 'ready',
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
    return;
  }

  if (req.url === '/ready') {
    // Readiness probe — only ready if Redis is connected (when required)
    const ready = !process.env.REDIS_URL || redisClient?.status === 'ready';
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready }));
    return;
  }

  if (req.url === '/metrics') {
    // Prometheus-compatible metrics
    const metrics = [
      `# HELP ws_connections_total Total WebSocket connections`,
      `# TYPE ws_connections_total gauge`,
      `ws_connections_total ${wss.clients.size}`,
      `# HELP ws_messages_sent_total Total messages sent`,
      `# TYPE ws_messages_sent_total counter`,
      `ws_messages_sent_total ${messagesSent}`,
      `# HELP ws_messages_received_total Total messages received`,
      `# TYPE ws_messages_received_total counter`,
      `ws_messages_received_total ${messagesReceived}`,
      `# HELP ws_uptime_seconds Server uptime in seconds`,
      `# TYPE ws_uptime_seconds gauge`,
      `ws_uptime_seconds ${Math.floor(process.uptime())}`,
      `# HELP process_memory_rss_bytes Process RSS memory`,
      `# TYPE process_memory_rss_bytes gauge`,
      `process_memory_rss_bytes ${process.memoryUsage().rss}`,
    ].join('\n');

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(metrics);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const HEALTH_PORT = parseInt(process.env.WS_HEALTH_PORT || '8081');
healthServer.listen(HEALTH_PORT, () => {
  console.log(`Health check server on :${HEALTH_PORT}`);
});
```

### 3. Improve Graceful Shutdown

Ensure the existing graceful shutdown:
- Stops accepting new connections
- Sends a close frame to all connected clients with code 1001 (Going Away)
- Waits for in-flight messages to drain (max 30 seconds)
- Closes Redis connections
- Closes the health HTTP server
- Logs shutdown progress

```javascript
async function gracefulShutdown(signal) {
  console.log(`\n⏳ Received ${signal}, starting graceful shutdown...`);
  
  // 1. Stop accepting new connections
  wss.close();
  healthServer.close();
  
  // 2. Notify all clients
  const closePromises = [];
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'system',
        event: 'server_shutdown',
        message: 'Server is restarting. Please reconnect.',
        reconnectAfter: 5000,
      }));
      closePromises.push(new Promise((resolve) => {
        client.close(1001, 'Server shutting down');
        client.on('close', resolve);
        setTimeout(resolve, 5000); // Force close after 5s
      }));
    }
  });
  
  // 3. Wait for clients to disconnect (max 30s)
  const drainTimeout = setTimeout(() => {
    console.log('⚠️  Drain timeout reached, forcing shutdown');
    wss.clients.forEach(c => c.terminate());
  }, 30000);
  
  await Promise.allSettled(closePromises);
  clearTimeout(drainTimeout);
  
  // 4. Clean up Redis
  if (redisClient) {
    await redisClient.quit().catch(() => {});
  }
  if (redisSub) {
    await redisSub.quit().catch(() => {});
  }
  
  console.log('✅ Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### 4. Add Connection Lifecycle Logging

Add structured logging for key connection events:

```javascript
// On connection
console.log(JSON.stringify({
  event: 'ws_connect',
  ip: req.socket.remoteAddress,
  authenticated: !!apiKey,
  totalConnections: wss.clients.size,
  timestamp: new Date().toISOString(),
}));

// On disconnect
console.log(JSON.stringify({
  event: 'ws_disconnect',
  code: code,
  reason: reason,
  duration: Date.now() - client._connectedAt,
  totalConnections: wss.clients.size,
  timestamp: new Date().toISOString(),
}));

// On error
console.error(JSON.stringify({
  event: 'ws_error',
  error: error.message,
  ip: client._ip,
  timestamp: new Date().toISOString(),
}));
```

### 5. Add Reconnection Documentation

Create or update `docs/WEBSOCKET.md` with client reconnection guidance:

```markdown
## WebSocket Client Reconnection

The server sends a `server_shutdown` event before planned restarts. Implement exponential backoff:

### JavaScript Example
```js
class CryptoNewsSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.maxRetries = options.maxRetries || 10;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.retries = 0;
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
}
```
```

### 6. Update Docker Health Check

Check `docker-compose.yml` and ensure the WebSocket service health check points to the HTTP health endpoint:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8081/health"]
  interval: 15s
  timeout: 5s
  retries: 3
  start_period: 10s
```

### 7. Add Backpressure Protection

If not already implemented, add backpressure handling to prevent slow clients from causing memory issues:

```javascript
function safeSend(client, data) {
  if (client.readyState !== WebSocket.OPEN) return;
  
  // Check buffered amount — skip if client is too slow
  if (client.bufferedAmount > 1024 * 64) { // 64KB buffer limit
    console.warn(JSON.stringify({
      event: 'ws_backpressure',
      bufferedAmount: client.bufferedAmount,
      ip: client._ip,
    }));
    return; // Drop message for slow client
  }
  
  client.send(typeof data === 'string' ? data : JSON.stringify(data));
}
```

## Requirements

- Do NOT break any existing WebSocket functionality
- Health endpoint must be a separate HTTP server on a different port (not WebSocket)
- Graceful shutdown must notify clients before closing
- All logging must be structured JSON (one object per line) for log aggregation
- Backpressure protection must drop messages rather than disconnecting clients
- Memory tracking should use process.memoryUsage(), not external packages

## Success Criteria

- `curl http://localhost:8081/health` returns JSON with connection stats
- `curl http://localhost:8081/ready` returns 200 when Redis is connected
- `curl http://localhost:8081/metrics` returns Prometheus-format metrics
- Sending SIGTERM shows graceful drain with client notification
- Docker health check passes within 10 seconds of startup
- No new npm dependencies added
