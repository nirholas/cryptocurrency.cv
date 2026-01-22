/**
 * Standalone WebSocket Server
 * 
 * Deploy to Railway, Render, or any Node.js host for full WebSocket support.
 * 
 * Features:
 * - Real-time news broadcasting
 * - Subscription-based filtering
 * - Alert system integration
 * - Health monitoring
 * 
 * Usage:
 *   npm install ws
 *   node ws-server.js
 * 
 * Or with environment:
 *   PORT=8080 node ws-server.js
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const POLL_INTERVAL = 30000; // 30 seconds
const ALERT_EVAL_INTERVAL = 30000; // 30 seconds for alert evaluation
const NEWS_API = process.env.NEWS_API || 'https://free-crypto-news.vercel.app';

// =============================================================================
// MESSAGE TYPES
// =============================================================================

const WS_MSG_TYPES = {
  // Connection
  CONNECTED: 'connected',
  PING: 'ping',
  PONG: 'pong',
  
  // Subscriptions
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  
  // News
  NEWS: 'news',
  BREAKING: 'breaking',
  
  // Alerts
  ALERT: 'alert',
  SUBSCRIBE_ALERTS: 'subscribe_alerts',
  UNSUBSCRIBE_ALERTS: 'unsubscribe_alerts',
  ALERTS_SUBSCRIBED: 'alerts_subscribed',
  ALERTS_UNSUBSCRIBED: 'alerts_unsubscribed',
};

// Client management
const clients = new Map();

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      clients: clients.size,
      uptime: process.uptime(),
    }));
    return;
  }
  
  if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStats()));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Free Crypto News WebSocket Server\n\nConnect via ws://' + req.headers.host);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Generate client ID
function generateClientId() {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Handle new connection
wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const ip = req.socket.remoteAddress;
  
  clients.set(clientId, {
    ws,
    ip,
    subscription: {
      sources: [],
      categories: [],
      keywords: [],
      coins: [],
    },
    alertSubscriptions: new Set(), // Alert rule IDs or '*' for all
    connectedAt: Date.now(),
    lastPing: Date.now(),
  });

  console.log(`[${new Date().toISOString()}] Client connected: ${clientId} from ${ip}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: WS_MSG_TYPES.CONNECTED,
    payload: {
      clientId,
      message: 'Connected to Free Crypto News WebSocket',
      serverTime: new Date().toISOString(),
      features: ['news', 'breaking', 'alerts'],
    },
  }));

  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      console.error('Parse error:', error.message);
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId}`);
    clients.delete(clientId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`Client ${clientId} error:`, error.message);
    clients.delete(clientId);
  });
});

// Handle incoming message
function handleMessage(clientId, message) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'subscribe':
    case WS_MSG_TYPES.SUBSCRIBE:
      handleSubscribe(clientId, message.payload);
      break;
    case 'unsubscribe':
    case WS_MSG_TYPES.UNSUBSCRIBE:
      handleUnsubscribe(clientId, message.payload);
      break;
    case 'ping':
    case WS_MSG_TYPES.PING:
      client.lastPing = Date.now();
      client.ws.send(JSON.stringify({
        type: WS_MSG_TYPES.PONG,
        timestamp: new Date().toISOString(),
      }));
      break;
    case WS_MSG_TYPES.SUBSCRIBE_ALERTS:
      handleSubscribeAlerts(clientId, message.payload);
      break;
    case WS_MSG_TYPES.UNSUBSCRIBE_ALERTS:
      handleUnsubscribeAlerts(clientId, message.payload);
      break;
    default:
      console.log(`Unknown message type: ${message.type}`);
  }
}

// Handle subscribe
function handleSubscribe(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  if (payload.sources) {
    client.subscription.sources = [...new Set([...client.subscription.sources, ...payload.sources])];
  }
  if (payload.categories) {
    client.subscription.categories = [...new Set([...client.subscription.categories, ...payload.categories])];
  }
  if (payload.keywords) {
    client.subscription.keywords = [...new Set([...client.subscription.keywords, ...payload.keywords])];
  }
  if (payload.coins) {
    client.subscription.coins = [...new Set([...client.subscription.coins, ...payload.coins])];
  }

  client.ws.send(JSON.stringify({
    type: WS_MSG_TYPES.SUBSCRIBED,
    payload: { subscription: client.subscription },
    timestamp: new Date().toISOString(),
  }));

  console.log(`[${new Date().toISOString()}] Client ${clientId} subscribed:`, client.subscription);
}

// Handle unsubscribe
function handleUnsubscribe(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  if (payload.sources) {
    client.subscription.sources = client.subscription.sources.filter(s => !payload.sources.includes(s));
  }
  if (payload.categories) {
    client.subscription.categories = client.subscription.categories.filter(c => !payload.categories.includes(c));
  }
  if (payload.keywords) {
    client.subscription.keywords = client.subscription.keywords.filter(k => !payload.keywords.includes(k));
  }
  if (payload.coins) {
    client.subscription.coins = client.subscription.coins.filter(c => !payload.coins.includes(c));
  }

  client.ws.send(JSON.stringify({
    type: WS_MSG_TYPES.UNSUBSCRIBED,
    payload: { subscription: client.subscription },
    timestamp: new Date().toISOString(),
  }));
}

// Handle alert subscription
function handleSubscribeAlerts(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  // Subscribe to specific rule IDs or '*' for all alerts
  const ruleIds = payload?.ruleIds || ['*'];
  
  for (const ruleId of ruleIds) {
    client.alertSubscriptions.add(ruleId);
  }

  client.ws.send(JSON.stringify({
    type: WS_MSG_TYPES.ALERTS_SUBSCRIBED,
    payload: {
      subscribedTo: Array.from(client.alertSubscriptions),
    },
    timestamp: new Date().toISOString(),
  }));

  console.log(`[${new Date().toISOString()}] Client ${clientId} subscribed to alerts:`, Array.from(client.alertSubscriptions));
}

// Handle alert unsubscription
function handleUnsubscribeAlerts(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const ruleIds = payload?.ruleIds;

  if (!ruleIds || ruleIds.length === 0) {
    // Unsubscribe from all
    client.alertSubscriptions.clear();
  } else {
    for (const ruleId of ruleIds) {
      client.alertSubscriptions.delete(ruleId);
    }
  }

  client.ws.send(JSON.stringify({
    type: WS_MSG_TYPES.ALERTS_UNSUBSCRIBED,
    payload: {
      subscribedTo: Array.from(client.alertSubscriptions),
    },
    timestamp: new Date().toISOString(),
  }));
}

// Broadcast news to clients
function broadcastNews(articles, isBreaking = false) {
  const type = isBreaking ? WS_MSG_TYPES.BREAKING : WS_MSG_TYPES.NEWS;
  
  clients.forEach((client, clientId) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    const sub = client.subscription;
    const filteredArticles = articles.filter(article => {
      // If no subscriptions, send everything
      if (sub.sources.length === 0 && sub.categories.length === 0 && sub.keywords.length === 0) {
        return true;
      }
      
      // Check source match
      if (sub.sources.length > 0 && sub.sources.includes(article.sourceKey || article.source.toLowerCase())) {
        return true;
      }
      
      // Check category match
      if (sub.categories.length > 0 && sub.categories.includes(article.category)) {
        return true;
      }
      
      // Check keyword match
      if (sub.keywords.length > 0) {
        const title = article.title.toLowerCase();
        if (sub.keywords.some(kw => title.includes(kw.toLowerCase()))) {
          return true;
        }
      }
      
      return false;
    });

    if (filteredArticles.length > 0) {
      client.ws.send(JSON.stringify({
        type,
        payload: { articles: filteredArticles },
        timestamp: new Date().toISOString(),
      }));
    }
  });
}

// Broadcast alert to subscribed clients
function broadcastAlert(alertEvent) {
  let delivered = 0;
  
  clients.forEach((client, clientId) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    
    // Check if client is subscribed to this alert
    const isSubscribed = 
      client.alertSubscriptions.has('*') || 
      client.alertSubscriptions.has(alertEvent.ruleId);
    
    if (isSubscribed) {
      try {
        client.ws.send(JSON.stringify({
          type: WS_MSG_TYPES.ALERT,
          data: alertEvent,
          timestamp: new Date().toISOString(),
        }));
        delivered++;
      } catch (error) {
        console.error(`Failed to send alert to client ${clientId}:`, error.message);
      }
    }
  });

  if (delivered > 0) {
    console.log(`[${new Date().toISOString()}] Alert ${alertEvent.id} delivered to ${delivered} clients`);
  }
  
  return delivered;
}

// Broadcast multiple alerts
function broadcastAlerts(alertEvents) {
  for (const event of alertEvents) {
    broadcastAlert(event);
  }
}

// Get server stats
function getStats() {
  let activeConnections = 0;
  let alertSubscribers = 0;
  const subscriptions = { sources: 0, categories: 0, keywords: 0, coins: 0, alerts: 0 };

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      activeConnections++;
      subscriptions.sources += client.subscription.sources.length;
      subscriptions.categories += client.subscription.categories.length;
      subscriptions.keywords += client.subscription.keywords.length;
      subscriptions.coins += client.subscription.coins.length;
      subscriptions.alerts += client.alertSubscriptions.size;
      if (client.alertSubscriptions.size > 0) {
        alertSubscribers++;
      }
    }
  });

  return {
    totalConnections: clients.size,
    activeConnections,
    alertSubscribers,
    subscriptions,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
}

// Fetch and broadcast news periodically
let lastArticleLink = '';

async function pollNews() {
  try {
    // Fetch latest news
    const response = await fetch(`${NEWS_API}/api/news?limit=10`);
    const data = await response.json();

    if (data.articles && data.articles.length > 0) {
      const latestLink = data.articles[0].link;
      
      // Only broadcast if there's new content
      if (latestLink !== lastArticleLink) {
        lastArticleLink = latestLink;
        console.log(`[${new Date().toISOString()}] Broadcasting ${data.articles.length} articles to ${clients.size} clients`);
        broadcastNews(data.articles.slice(0, 5));
      }
    }

    // Fetch breaking news
    const breakingResponse = await fetch(`${NEWS_API}/api/breaking?limit=3`);
    const breakingData = await breakingResponse.json();
    
    if (breakingData.articles && breakingData.articles.length > 0) {
      broadcastNews(breakingData.articles, true);
    }

  } catch (error) {
    console.error('Poll error:', error.message);
  }
}

// Cleanup stale connections
function cleanupStale() {
  const now = Date.now();
  const maxIdle = 5 * 60 * 1000; // 5 minutes

  clients.forEach((client, clientId) => {
    if (now - client.lastPing > maxIdle || client.ws.readyState !== WebSocket.OPEN) {
      console.log(`[${new Date().toISOString()}] Cleaning up stale client: ${clientId}`);
      clients.delete(clientId);
    }
  });
}

// Evaluate alerts and broadcast triggered ones
async function evaluateAndBroadcastAlerts() {
  try {
    const response = await fetch(`${NEWS_API}/api/alerts?action=evaluate`);
    const data = await response.json();

    if (data.events && data.events.length > 0) {
      console.log(`[${new Date().toISOString()}] Triggered ${data.events.length} alerts`);
      broadcastAlerts(data.events);
    }
  } catch (error) {
    console.error('Alert evaluation error:', error.message);
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Free Crypto News WebSocket Server                     ║
╠═══════════════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}                           ║
║  Health:    http://localhost:${PORT}/health                  ║
║  Stats:     http://localhost:${PORT}/stats                   ║
║  Features:  news, breaking news, alerts                   ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start news polling
  setInterval(pollNews, POLL_INTERVAL);
  pollNews(); // Initial poll

  // Start alert evaluation
  setInterval(evaluateAndBroadcastAlerts, ALERT_EVAL_INTERVAL);
  
  // Cleanup every minute
  setInterval(cleanupStale, 60000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  wss.clients.forEach((client) => {
    client.close(1001, 'Server shutting down');
  });
  server.close(() => {
    process.exit(0);
  });
});
