/**
 * Standalone WebSocket Server v2.0
 * 
 * Deploy to Railway, Render, or any Node.js host for full WebSocket support.
 * 
 * Features:
 * - Real-time news broadcasting
 * - Live price streaming (Bitcoin, Ethereum, top coins)
 * - Whale alert streaming (large transactions)
 * - Market sentiment updates (Fear & Greed Index)
 * - Subscription-based filtering (sources, topics, coins, keywords)
 * - Alert system integration
 * - Topic channels (bitcoin, defi, nft, regulation, etc.)
 * - Rate limiting protection
 * - Connection health monitoring
 * - Graceful backpressure handling
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
const POLL_INTERVAL = 30000; // 30 seconds for news
const PRICE_INTERVAL = 10000; // 10 seconds for prices
const WHALE_INTERVAL = 60000; // 1 minute for whales
const SENTIMENT_INTERVAL = 300000; // 5 minutes for Fear & Greed
const ALERT_EVAL_INTERVAL = 30000; // 30 seconds for alert evaluation
const NEWS_API = process.env.NEWS_API || 'https://cryptocurrency.cv';

// =============================================================================
// MESSAGE TYPES
// =============================================================================

const WS_MSG_TYPES = {
  // Connection
  CONNECTED: 'connected',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
  RATE_LIMITED: 'rate_limited',
  
  // Subscriptions
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  
  // News
  NEWS: 'news',
  BREAKING: 'breaking',
  TOPIC: 'topic',
  
  // Market Data
  PRICES: 'prices',
  WHALES: 'whales',
  SENTIMENT: 'sentiment',
  LIQUIDATIONS: 'liquidations',
  
  // Alerts
  ALERT: 'alert',
  SUBSCRIBE_ALERTS: 'subscribe_alerts',
  UNSUBSCRIBE_ALERTS: 'unsubscribe_alerts',
  ALERTS_SUBSCRIBED: 'alerts_subscribed',
  ALERTS_UNSUBSCRIBED: 'alerts_unsubscribed',
  
  // Channels
  JOIN_CHANNEL: 'join_channel',
  LEAVE_CHANNEL: 'leave_channel',
  CHANNEL_JOINED: 'channel_joined',
  CHANNEL_LEFT: 'channel_left',
};

// Available topic channels
const CHANNELS = {
  bitcoin: { name: 'Bitcoin', keywords: ['bitcoin', 'btc', 'lightning', 'ordinals', 'satoshi'] },
  ethereum: { name: 'Ethereum', keywords: ['ethereum', 'eth', 'vitalik', 'erc-20', 'layer2'] },
  defi: { name: 'DeFi', keywords: ['defi', 'yield', 'lending', 'dex', 'amm', 'liquidity'] },
  nft: { name: 'NFTs', keywords: ['nft', 'opensea', 'blur', 'ordinals', 'digital art'] },
  regulation: { name: 'Regulation', keywords: ['sec', 'regulation', 'cftc', 'lawsuit', 'compliance'] },
  stablecoins: { name: 'Stablecoins', keywords: ['usdt', 'usdc', 'stablecoin', 'tether', 'circle'] },
  altcoins: { name: 'Altcoins', keywords: ['solana', 'cardano', 'polkadot', 'avalanche', 'altcoin'] },
  exchanges: { name: 'Exchanges', keywords: ['binance', 'coinbase', 'kraken', 'exchange', 'cex'] },
  markets: { name: 'Markets', keywords: ['price', 'rally', 'crash', 'bull', 'bear', 'ath'] },
  whales: { name: 'Whales', keywords: ['whale', 'accumulation', 'large', 'institutional'] },
};

// Rate limiting
const RATE_LIMIT = {
  messagesPerMinute: 60,
  subscriptionsMax: 50,
};

// Client management
const clients = new Map();

// Market data cache
let priceCache = {};
let sentimentCache = null;
let whaleCache = [];

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      version: '2.0.0',
      clients: clients.size,
      uptime: process.uptime(),
      features: ['news', 'breaking', 'alerts', 'prices', 'whales', 'sentiment', 'channels'],
    }));
    return;
  }
  
  if (req.url === '/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStats()));
    return;
  }
  
  if (req.url === '/channels') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ channels: Object.keys(CHANNELS).map(id => ({ id, ...CHANNELS[id] })) }));
    return;
  }

  if (req.url === '/prices') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ prices: priceCache, updatedAt: new Date().toISOString() }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Free Crypto News WebSocket Server v2.0

Connect via ws://${req.headers.host}

Features:
  - Real-time news streaming
  - Live price updates (BTC, ETH, SOL, etc.)
  - Whale alert notifications
  - Market sentiment (Fear & Greed)
  - Topic channels (bitcoin, defi, nft, etc.)
  - Custom alert subscriptions

Endpoints:
  /health   - Server health check
  /stats    - Connection statistics
  /channels - Available topic channels
  /prices   - Current price cache
`);
});

// Create WebSocket server with compression
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: {
    zlibDeflateOptions: { chunkSize: 1024, level: 3 },
    zlibInflateOptions: { chunkSize: 10 * 1024 },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    threshold: 1024,
  },
});

// Generate client ID
function generateClientId() {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Handle new connection
wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  clients.set(clientId, {
    ws,
    ip,
    subscription: {
      sources: [],
      categories: [],
      keywords: [],
      coins: [],
    },
    channels: new Set(), // Topic channels
    alertSubscriptions: new Set(), // Alert rule IDs or '*' for all
    streamPrices: false, // Subscribe to price updates
    streamWhales: false, // Subscribe to whale alerts
    streamSentiment: false, // Subscribe to sentiment updates
    connectedAt: Date.now(),
    lastPing: Date.now(),
    messageCount: 0,
    lastMessageReset: Date.now(),
  });

  console.log(`[${new Date().toISOString()}] Client connected: ${clientId} from ${ip} (total: ${clients.size})`);

  // Send welcome message with available features
  ws.send(JSON.stringify({
    type: WS_MSG_TYPES.CONNECTED,
    payload: {
      clientId,
      message: 'Connected to Free Crypto News WebSocket v2.0',
      serverTime: new Date().toISOString(),
      features: ['news', 'breaking', 'alerts', 'prices', 'whales', 'sentiment', 'channels'],
      availableChannels: Object.keys(CHANNELS),
      rateLimit: RATE_LIMIT,
    },
  }));

  // Handle messages
  ws.on('message', (data) => {
    const client = clients.get(clientId);
    if (!client) return;

    // Rate limiting
    const now = Date.now();
    if (now - client.lastMessageReset > 60000) {
      client.messageCount = 0;
      client.lastMessageReset = now;
    }
    
    client.messageCount++;
    if (client.messageCount > RATE_LIMIT.messagesPerMinute) {
      ws.send(JSON.stringify({
        type: WS_MSG_TYPES.RATE_LIMITED,
        payload: { message: 'Rate limit exceeded. Please slow down.', retryAfter: 60 },
      }));
      return;
    }

    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      ws.send(JSON.stringify({
        type: WS_MSG_TYPES.ERROR,
        payload: { message: 'Invalid JSON message' },
      }));
    }
  });

  // Handle close
  ws.on('close', (code, reason) => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${clientId} (code: ${code})`);
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
    case 'join_channel':
    case WS_MSG_TYPES.JOIN_CHANNEL:
      handleJoinChannel(clientId, message.payload);
      break;
    case 'leave_channel':
    case WS_MSG_TYPES.LEAVE_CHANNEL:
      handleLeaveChannel(clientId, message.payload);
      break;
    case 'stream_prices':
      client.streamPrices = message.payload?.enabled !== false;
      client.ws.send(JSON.stringify({
        type: 'prices_stream',
        payload: { enabled: client.streamPrices, interval: '10s' },
      }));
      // Send current prices immediately
      if (client.streamPrices && Object.keys(priceCache).length > 0) {
        client.ws.send(JSON.stringify({
          type: WS_MSG_TYPES.PRICES,
          payload: { prices: priceCache },
          timestamp: new Date().toISOString(),
        }));
      }
      break;
    case 'stream_whales':
      client.streamWhales = message.payload?.enabled !== false;
      client.ws.send(JSON.stringify({
        type: 'whales_stream',
        payload: { enabled: client.streamWhales, interval: '60s' },
      }));
      break;
    case 'stream_sentiment':
      client.streamSentiment = message.payload?.enabled !== false;
      client.ws.send(JSON.stringify({
        type: 'sentiment_stream',
        payload: { enabled: client.streamSentiment, interval: '5m' },
      }));
      // Send current sentiment immediately
      if (client.streamSentiment && sentimentCache) {
        client.ws.send(JSON.stringify({
          type: WS_MSG_TYPES.SENTIMENT,
          payload: sentimentCache,
          timestamp: new Date().toISOString(),
        }));
      }
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

// Handle channel join
function handleJoinChannel(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const channelId = payload?.channel;
  if (!channelId || !CHANNELS[channelId]) {
    client.ws.send(JSON.stringify({
      type: WS_MSG_TYPES.ERROR,
      payload: { message: `Invalid channel: ${channelId}. Available: ${Object.keys(CHANNELS).join(', ')}` },
    }));
    return;
  }

  // Check subscription limit
  if (client.channels.size >= RATE_LIMIT.subscriptionsMax) {
    client.ws.send(JSON.stringify({
      type: WS_MSG_TYPES.ERROR,
      payload: { message: `Maximum ${RATE_LIMIT.subscriptionsMax} subscriptions reached` },
    }));
    return;
  }

  client.channels.add(channelId);

  client.ws.send(JSON.stringify({
    type: WS_MSG_TYPES.CHANNEL_JOINED,
    payload: {
      channel: channelId,
      channelInfo: CHANNELS[channelId],
      subscribedChannels: Array.from(client.channels),
    },
    timestamp: new Date().toISOString(),
  }));

  console.log(`[${new Date().toISOString()}] Client ${clientId} joined channel: ${channelId}`);
}

// Handle channel leave
function handleLeaveChannel(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const channelId = payload?.channel;
  
  if (channelId) {
    client.channels.delete(channelId);
  } else {
    // Leave all channels
    client.channels.clear();
  }

  client.ws.send(JSON.stringify({
    type: WS_MSG_TYPES.CHANNEL_LEFT,
    payload: {
      channel: channelId || 'all',
      subscribedChannels: Array.from(client.channels),
    },
    timestamp: new Date().toISOString(),
  }));
}

// Broadcast news to channel subscribers
function broadcastToChannel(channelId, articles) {
  const channel = CHANNELS[channelId];
  if (!channel) return;

  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    if (!client.channels.has(channelId)) return;

    client.ws.send(JSON.stringify({
      type: WS_MSG_TYPES.TOPIC,
      payload: {
        channel: channelId,
        channelName: channel.name,
        articles,
      },
      timestamp: new Date().toISOString(),
    }));
  });
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
  let priceSubscribers = 0;
  let whaleSubscribers = 0;
  let sentimentSubscribers = 0;
  const channelStats = {};
  const subscriptions = { sources: 0, categories: 0, keywords: 0, coins: 0, alerts: 0, channels: 0 };

  Object.keys(CHANNELS).forEach(ch => channelStats[ch] = 0);

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      activeConnections++;
      subscriptions.sources += client.subscription.sources.length;
      subscriptions.categories += client.subscription.categories.length;
      subscriptions.keywords += client.subscription.keywords.length;
      subscriptions.coins += client.subscription.coins.length;
      subscriptions.alerts += client.alertSubscriptions.size;
      subscriptions.channels += client.channels.size;
      
      if (client.alertSubscriptions.size > 0) alertSubscribers++;
      if (client.streamPrices) priceSubscribers++;
      if (client.streamWhales) whaleSubscribers++;
      if (client.streamSentiment) sentimentSubscribers++;
      
      client.channels.forEach(ch => {
        if (channelStats[ch] !== undefined) channelStats[ch]++;
      });
    }
  });

  return {
    version: '2.0.0',
    totalConnections: clients.size,
    activeConnections,
    subscribers: {
      alerts: alertSubscribers,
      prices: priceSubscribers,
      whales: whaleSubscribers,
      sentiment: sentimentSubscribers,
    },
    channels: channelStats,
    subscriptions,
    cache: {
      prices: Object.keys(priceCache).length,
      sentiment: sentimentCache ? true : false,
      whales: whaleCache.length,
    },
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
        const newArticles = data.articles.slice(0, 5);
        console.log(`[${new Date().toISOString()}] Broadcasting ${newArticles.length} articles to ${clients.size} clients`);
        broadcastNews(newArticles);
        
        // Also distribute to topic channels
        distributeToChannels(newArticles);
      }
    }

    // Fetch breaking news
    const breakingResponse = await fetch(`${NEWS_API}/api/breaking?limit=3`);
    const breakingData = await breakingResponse.json();
    
    if (breakingData.articles && breakingData.articles.length > 0) {
      broadcastNews(breakingData.articles, true);
      distributeToChannels(breakingData.articles);
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

// =============================================================================
// PRICE STREAMING
// =============================================================================

async function pollPrices() {
  try {
    const response = await fetch(`${NEWS_API}/api/market?coins=bitcoin,ethereum,solana,cardano,polkadot,avalanche-2,chainlink,polygon`);
    const data = await response.json();

    if (data.coins) {
      priceCache = data.coins;
      
      // Broadcast to price subscribers
      clients.forEach((client) => {
        if (client.ws.readyState !== WebSocket.OPEN) return;
        if (!client.streamPrices) return;

        client.ws.send(JSON.stringify({
          type: WS_MSG_TYPES.PRICES,
          payload: { prices: priceCache },
          timestamp: new Date().toISOString(),
        }));
      });
    }
  } catch (error) {
    console.error('Price poll error:', error.message);
  }
}

// =============================================================================
// WHALE ALERT STREAMING
// =============================================================================

async function pollWhales() {
  try {
    const response = await fetch(`${NEWS_API}/api/whales?limit=10&min_usd=1000000`);
    const data = await response.json();

    if (data.alerts && data.alerts.length > 0) {
      // Check for new whales
      const newWhales = data.alerts.filter(whale => {
        return !whaleCache.some(cached => cached.hash === whale.hash);
      });

      if (newWhales.length > 0) {
        whaleCache = data.alerts;
        
        // Broadcast to whale subscribers
        clients.forEach((client) => {
          if (client.ws.readyState !== WebSocket.OPEN) return;
          if (!client.streamWhales) return;

          client.ws.send(JSON.stringify({
            type: WS_MSG_TYPES.WHALES,
            payload: { 
              alerts: newWhales,
              isNew: true,
            },
            timestamp: new Date().toISOString(),
          }));
        });

        console.log(`[${new Date().toISOString()}] Broadcast ${newWhales.length} new whale alerts`);
      }
    }
  } catch (error) {
    console.error('Whale poll error:', error.message);
  }
}

// =============================================================================
// SENTIMENT STREAMING (Fear & Greed Index)
// =============================================================================

async function pollSentiment() {
  try {
    const response = await fetch(`${NEWS_API}/api/fear-greed?days=1`);
    const data = await response.json();

    if (data.current) {
      const hasChanged = !sentimentCache || sentimentCache.value !== data.current.value;
      sentimentCache = data.current;

      if (hasChanged) {
        // Broadcast to sentiment subscribers
        clients.forEach((client) => {
          if (client.ws.readyState !== WebSocket.OPEN) return;
          if (!client.streamSentiment) return;

          client.ws.send(JSON.stringify({
            type: WS_MSG_TYPES.SENTIMENT,
            payload: sentimentCache,
            timestamp: new Date().toISOString(),
          }));
        });

        console.log(`[${new Date().toISOString()}] Broadcast sentiment update: ${sentimentCache.value} (${sentimentCache.classification})`);
      }
    }
  } catch (error) {
    console.error('Sentiment poll error:', error.message);
  }
}

// =============================================================================
// CHANNEL NEWS DISTRIBUTION
// =============================================================================

function distributeToChannels(articles) {
  for (const [channelId, channel] of Object.entries(CHANNELS)) {
    const channelArticles = articles.filter(article => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      return channel.keywords.some(kw => text.includes(kw.toLowerCase()));
    });

    if (channelArticles.length > 0) {
      broadcastToChannel(channelId, channelArticles);
    }
  }
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
╔══════════════════════════════════════════════════════════════════╗
║     Free Crypto News WebSocket Server v2.0                       ║
╠══════════════════════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}                                  ║
║  Health:    http://localhost:${PORT}/health                         ║
║  Stats:     http://localhost:${PORT}/stats                          ║
║  Channels:  http://localhost:${PORT}/channels                       ║
║  Prices:    http://localhost:${PORT}/prices                         ║
╠══════════════════════════════════════════════════════════════════╣
║  Features:                                                       ║
║    📰 Real-time news streaming                                   ║
║    🚨 Breaking news alerts                                       ║
║    💰 Live price updates (10s)                                   ║
║    🐳 Whale alert notifications (60s)                            ║
║    😱 Fear & Greed sentiment (5m)                                ║
║    📺 Topic channels (bitcoin, defi, nft, etc.)                  ║
║    🔔 Custom alert subscriptions                                 ║
║    ⚡ WebSocket compression                                      ║
║    🛡️  Rate limiting protection                                  ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  // Start news polling (30s)
  setInterval(pollNews, POLL_INTERVAL);
  pollNews();

  // Start price streaming (10s)
  setInterval(pollPrices, PRICE_INTERVAL);
  pollPrices();

  // Start whale alert polling (60s)
  setInterval(pollWhales, WHALE_INTERVAL);
  pollWhales();

  // Start sentiment polling (5m)
  setInterval(pollSentiment, SENTIMENT_INTERVAL);
  pollSentiment();

  // Start alert evaluation (30s)
  setInterval(evaluateAndBroadcastAlerts, ALERT_EVAL_INTERVAL);
  
  // Cleanup stale connections every minute
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
