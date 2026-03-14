/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Standalone WebSocket Server v4.0 — Production-Grade, Horizontally Scalable
 *
 * Deploy to Railway, Render, or any Node.js host for full WebSocket support.
 * Designed for 1M+ concurrent connections across multiple instances.
 *
 * Features:
 * - Real-time news broadcasting
 * - Live price streaming (Bitcoin, Ethereum, top coins)
 * - Whale alert streaming (large transactions)
 * - Market sentiment updates (Fear & Greed Index)
 * - Subscription-based filtering (sources, topics, coins, keywords)
 * - Topic-based subscriptions (prices:BTC, news:breaking, sentiment:global)
 * - Alert system integration
 * - Topic channels (bitcoin, defi, nft, regulation, etc.)
 * - API key authentication via query param
 * - Per-API-key connection limits
 * - Server-initiated WebSocket ping/pong heartbeat
 * - Auto-reconnection guidance in error payloads
 * - permessage-deflate compression
 * - Rate limiting protection
 * - Connection health monitoring
 * - Graceful backpressure handling
 * - Redis pub/sub for cross-instance broadcasting
 * - Redis-backed global connection & channel subscriber counting
 * - Graceful shutdown with 30s connection drain
 * - Leader election for upstream polling
 *
 * Usage:
 *   npm install ws
 *   node ws-server.js
 *
 * Or with environment:
 *   PORT=8080 REDIS_URL=redis://... WS_API_KEYS=key1,key2 node ws-server.js
 *
 * Authentication:
 *   ws://host:port?apiKey=YOUR_KEY
 *   Anonymous connections allowed when WS_REQUIRE_AUTH=false (default)
 */

const WebSocket = require('ws');
const http = require('http');

// Redis pub/sub for horizontal scaling (optional — graceful fallback to single-process)
let redisPub = null; // publish instance
let redisSub = null; // subscribe instance
const REDIS_CHANNEL = 'ws:broadcast';

// Redis keys for cross-instance observability
const REDIS_KEY_TOTAL_CONNS = 'ws:connections:total';
const REDIS_KEY_INSTANCE_CONNS = (id) => `ws:connections:${id}`;
const REDIS_KEY_CHANNEL_SUBS = (ch) => `ws:channel:${ch}:subscribers`;
const REDIS_KEY_STREAM_SUBS = (stream) => `ws:stream:${stream}:subscribers`;
const INSTANCE_CONN_TTL = 120; // seconds — auto-expire if instance crashes without cleanup

async function initRedis() {
  const url = process.env.REDIS_URL || process.env.REDIS_PRIVATE_URL;
  if (!url) {
    console.log('[redis] No REDIS_URL — running single-process (no cross-instance fan-out)');
    return;
  }
  try {
    const { createClient } = require('redis');
    redisPub = createClient({
      url,
      socket: { reconnectStrategy: (retries) => Math.min(retries * 500, 5000) },
    });
    redisSub = redisPub.duplicate();

    // Reconnection logging
    for (const client of [redisPub, redisSub]) {
      client.on('error', (err) => console.error('[redis] Connection error:', err.message));
      client.on('reconnecting', () => console.log('[redis] Reconnecting...'));
    }

    await redisPub.connect();
    await redisSub.connect();

    // Subscribe to broadcast channel — forward messages to local clients
    await redisSub.subscribe(REDIS_CHANNEL, (raw) => {
      try {
        const { type, payload, timestamp, meta } = JSON.parse(raw);
        // Ignore messages from this instance (already delivered locally)
        if (meta?.instanceId === INSTANCE_ID) return;
        localBroadcastRaw(type, payload, timestamp, meta);
      } catch (e) {
        console.error('[redis] Bad message on channel:', e.message);
      }
    });

    // Initialize this instance's connection counter with TTL (auto-expire on crash)
    await redisPub.set(REDIS_KEY_INSTANCE_CONNS(INSTANCE_ID), '0', {
      EX: INSTANCE_CONN_TTL,
    });

    console.log('[redis] Pub/Sub connected — cross-instance broadcasting enabled');
  } catch (err) {
    console.error('[redis] Init failed, falling back to single-process:', err.message);
    redisPub = null;
    redisSub = null;
  }
}

// ---------------------------------------------------------------------------
// Redis connection & channel counters
// ---------------------------------------------------------------------------

/** Increment global + instance connection counters in Redis. */
async function redisTrackConnect() {
  if (!redisPub) return;
  try {
    await Promise.all([
      redisPub.incr(REDIS_KEY_TOTAL_CONNS),
      redisPub.incr(REDIS_KEY_INSTANCE_CONNS(INSTANCE_ID)),
      // Refresh TTL so the per-instance key stays alive while we're running
      redisPub.expire(REDIS_KEY_INSTANCE_CONNS(INSTANCE_ID), INSTANCE_CONN_TTL),
    ]);
  } catch (err) {
    console.error('[redis] Track connect error:', err.message);
  }
}

/** Decrement global + instance connection counters in Redis. */
async function redisTrackDisconnect() {
  if (!redisPub) return;
  try {
    await Promise.all([
      redisPub.decr(REDIS_KEY_TOTAL_CONNS),
      redisPub.decr(REDIS_KEY_INSTANCE_CONNS(INSTANCE_ID)),
    ]);
  } catch (err) {
    console.error('[redis] Track disconnect error:', err.message);
  }
}

/** Increment per-channel subscriber count in Redis. */
async function redisTrackChannelJoin(channelId) {
  if (!redisPub) return;
  try {
    await redisPub.incr(REDIS_KEY_CHANNEL_SUBS(channelId));
  } catch (err) {
    console.error('[redis] Track channel join error:', err.message);
  }
}

/** Decrement per-channel subscriber count in Redis. */
async function redisTrackChannelLeave(channelId) {
  if (!redisPub) return;
  try {
    await redisPub.decr(REDIS_KEY_CHANNEL_SUBS(channelId));
  } catch (err) {
    console.error('[redis] Track channel leave error:', err.message);
  }
}

/** Increment per-stream subscriber count in Redis (prices, whales, sentiment). */
async function redisTrackStreamSubscribe(stream) {
  if (!redisPub) return;
  try {
    await redisPub.incr(REDIS_KEY_STREAM_SUBS(stream));
  } catch (err) {
    console.error('[redis] Track stream subscribe error:', err.message);
  }
}

/** Decrement per-stream subscriber count in Redis. */
async function redisTrackStreamUnsubscribe(stream) {
  if (!redisPub) return;
  try {
    await redisPub.decr(REDIS_KEY_STREAM_SUBS(stream));
  } catch (err) {
    console.error('[redis] Track stream unsubscribe error:', err.message);
  }
}

/** Fetch cross-instance global stats from Redis. Returns null if Redis unavailable. */
async function redisGetGlobalStats() {
  if (!redisPub) return null;
  try {
    const pipeline = redisPub.multi();
    pipeline.get(REDIS_KEY_TOTAL_CONNS);
    for (const ch of Object.keys(CHANNELS)) {
      pipeline.get(REDIS_KEY_CHANNEL_SUBS(ch));
    }
    for (const stream of ['prices', 'whales', 'sentiment']) {
      pipeline.get(REDIS_KEY_STREAM_SUBS(stream));
    }
    const results = await pipeline.exec();

    let idx = 0;
    const totalConnections = parseInt(results[idx++] || '0', 10);
    const channelSubs = {};
    for (const ch of Object.keys(CHANNELS)) {
      channelSubs[ch] = Math.max(0, parseInt(results[idx++] || '0', 10));
    }
    const streamSubs = {};
    for (const stream of ['prices', 'whales', 'sentiment']) {
      streamSubs[stream] = Math.max(0, parseInt(results[idx++] || '0', 10));
    }
    return {
      totalConnections: Math.max(0, totalConnections),
      channelSubs,
      streamSubs,
    };
  } catch (err) {
    console.error('[redis] Global stats error:', err.message);
    return null;
  }
}

/** Periodically refresh the per-instance key TTL so it doesn't expire while we're alive. */
function startInstanceHeartbeat() {
  if (!redisPub) return;
  setInterval(
    () => {
      redisPub.expire(REDIS_KEY_INSTANCE_CONNS(INSTANCE_ID), INSTANCE_CONN_TTL).catch(() => {});
    },
    (INSTANCE_CONN_TTL / 2) * 1000,
  );
}

// ---------------------------------------------------------------------------
// Redis-backed connection state (for cross-instance reconnection)
// ---------------------------------------------------------------------------
const CONN_STATE_TTL = 300; // 5 min — enough for reconnection window

/** Persist full connection state to Redis so any instance can restore it. */
async function redisSaveConnectionState(clientId, clientData) {
  if (!redisPub) return;
  try {
    const state = {
      instanceId: INSTANCE_ID,
      connectedAt: clientData.connectedAt,
      lastPingAt: clientData.lastPing,
      clientIp: clientData.ip,
      channels: Array.from(clientData.channels || []),
      subscriptions: clientData.subscription || {},
      alertSubscriptions: Array.from(clientData.alertSubscriptions || []),
      streamPrices: !!clientData.streamPrices,
      streamWhales: !!clientData.streamWhales,
      streamSentiment: !!clientData.streamSentiment,
    };
    await redisPub.set(`ws:conn:${clientId}`, JSON.stringify(state), {
      EX: CONN_STATE_TTL,
    });

    // Also maintain per-channel membership sets for O(1) lookup
    for (const ch of state.channels) {
      await redisPub.sAdd(`ws:channel:${ch}:members`, clientId);
      await redisPub.expire(`ws:channel:${ch}:members`, CONN_STATE_TTL);
    }
  } catch (err) {
    console.error('[redis] Save connection state error:', err.message);
  }
}

/** Load connection state from Redis (for reconnection to a different instance). */
async function redisLoadConnectionState(clientId) {
  if (!redisPub) return null;
  try {
    const raw = await redisPub.get(`ws:conn:${clientId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('[redis] Load connection state error:', err.message);
    return null;
  }
}

/** Remove connection state from Redis on disconnect. */
async function redisRemoveConnectionState(clientId, clientData) {
  if (!redisPub) return;
  try {
    await redisPub.del(`ws:conn:${clientId}`);
    // Remove from per-channel membership sets
    if (clientData) {
      for (const ch of clientData.channels || []) {
        await redisPub.sRem(`ws:channel:${ch}:members`, clientId).catch(() => {});
      }
    }
  } catch (err) {
    console.error('[redis] Remove connection state error:', err.message);
  }
}

/** Refresh TTL on connection state (called on each ping/pong). */
async function redisRefreshConnectionTTL(clientId) {
  if (!redisPub) return;
  try {
    await redisPub.expire(`ws:conn:${clientId}`, CONN_STATE_TTL);
  } catch {
    // non-critical
  }
}

/**
 * Simple leader election via Redis.  One instance acquires a key with a TTL;
 * only the leader runs the polling loops.  Other instances just relay
 * broadcasts received via pub/sub.  Falls back to "everyone polls" when
 * Redis is unavailable (safe — just duplicated upstream calls).
 */
let isLeader = false;
const LEADER_KEY = 'ws:leader';
const LEADER_TTL = 30; // seconds — must be shorter than the longest poll interval

async function tryAcquireLeadership() {
  if (!redisPub) {
    isLeader = true;
    return;
  } // No Redis → single-process, always leader
  try {
    const result = await redisPub.set(LEADER_KEY, INSTANCE_ID, {
      NX: true,
      EX: LEADER_TTL,
    });
    isLeader = result === 'OK';
  } catch {
    isLeader = true; // Redis down → poll anyway to avoid data blackout
  }
}

async function renewOrReacquireLeadership() {
  if (!redisPub) {
    isLeader = true;
    return;
  }
  try {
    const currentLeader = await redisPub.get(LEADER_KEY);
    if (currentLeader === INSTANCE_ID) {
      await redisPub.expire(LEADER_KEY, LEADER_TTL);
      isLeader = true;
    } else if (!currentLeader) {
      await tryAcquireLeadership();
    } else {
      isLeader = false;
    }
  } catch {
    isLeader = true;
  }
}

const INSTANCE_ID = `ws_${process.pid}_${Date.now().toString(36)}`;

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
  bitcoin: {
    name: 'Bitcoin',
    keywords: ['bitcoin', 'btc', 'lightning', 'ordinals', 'satoshi'],
  },
  ethereum: {
    name: 'Ethereum',
    keywords: ['ethereum', 'eth', 'vitalik', 'erc-20', 'layer2'],
  },
  defi: {
    name: 'DeFi',
    keywords: ['defi', 'yield', 'lending', 'dex', 'amm', 'liquidity'],
  },
  nft: {
    name: 'NFTs',
    keywords: ['nft', 'opensea', 'blur', 'ordinals', 'digital art'],
  },
  regulation: {
    name: 'Regulation',
    keywords: ['sec', 'regulation', 'cftc', 'lawsuit', 'compliance'],
  },
  stablecoins: {
    name: 'Stablecoins',
    keywords: ['usdt', 'usdc', 'stablecoin', 'tether', 'circle'],
  },
  altcoins: {
    name: 'Altcoins',
    keywords: ['solana', 'cardano', 'polkadot', 'avalanche', 'altcoin'],
  },
  exchanges: {
    name: 'Exchanges',
    keywords: ['binance', 'coinbase', 'kraken', 'exchange', 'cex'],
  },
  markets: {
    name: 'Markets',
    keywords: ['price', 'rally', 'crash', 'bull', 'bear', 'ath'],
  },
  whales: {
    name: 'Whales',
    keywords: ['whale', 'accumulation', 'large', 'institutional'],
  },
};

// Rate limiting
const RATE_LIMIT = {
  messagesPerMinute: 60,
  subscriptionsMax: 50,
};

// Connection limits
const MAX_CONNECTIONS = parseInt(process.env.WS_MAX_CONNECTIONS || '10000', 10);
const MAX_PAYLOAD = 64 * 1024; // 64 KB max message size from clients
const MAX_BUFFER_SIZE = 256 * 1024; // 256 KB — backpressure threshold

// =============================================================================
// API KEY AUTHENTICATION & PER-KEY CONNECTION LIMITS
// =============================================================================

const WS_REQUIRE_AUTH = (process.env.WS_REQUIRE_AUTH || 'false') === 'true';
const WS_API_KEYS = new Set(
  (process.env.WS_API_KEYS || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
);
const CONNECTIONS_PER_KEY = parseInt(process.env.WS_CONNECTIONS_PER_KEY || '100', 10);
const CONNECTIONS_ANONYMOUS = parseInt(process.env.WS_CONNECTIONS_ANONYMOUS || '5', 10);

// Per-key and per-IP connection tracking
const connectionsByKey = new Map(); // apiKey → Set<clientId>
const connectionsByIp = new Map(); // ip → Set<clientId> (for anonymous)

/**
 * Validate an API key. Returns { valid, tier } or { valid: false, reason }.
 * Keys in WS_API_KEYS env are "static" keys. Redis-backed lookup optional.
 */
async function validateApiKey(apiKey) {
  if (!apiKey) {
    return WS_REQUIRE_AUTH
      ? {
          valid: false,
          reason: 'API key required. Pass ?apiKey=YOUR_KEY in the connection URL.',
        }
      : { valid: true, tier: 'anonymous' };
  }

  // Check static keys
  if (WS_API_KEYS.size > 0 && WS_API_KEYS.has(apiKey)) {
    return { valid: true, tier: 'standard' };
  }

  // Check Redis-stored keys
  if (redisPub) {
    try {
      const keyData = await redisPub.get(`ws:apikey:${apiKey}`);
      if (keyData) {
        const parsed = JSON.parse(keyData);
        return { valid: true, tier: parsed.tier || 'standard', meta: parsed };
      }
    } catch (err) {
      console.error('[auth] Redis key lookup failed:', err.message);
    }
  }

  // If no keys are configured, allow everything (open mode)
  if (WS_API_KEYS.size === 0 && !WS_REQUIRE_AUTH) {
    return { valid: true, tier: 'anonymous' };
  }

  return { valid: false, reason: 'Invalid API key.' };
}

/**
 * Check per-key connection limit. Returns true if allowed.
 */
function checkConnectionLimit(apiKey, ip) {
  if (apiKey && apiKey !== '__anonymous__') {
    const existing = connectionsByKey.get(apiKey);
    const count = existing ? existing.size : 0;
    return count < CONNECTIONS_PER_KEY;
  }
  // Anonymous: limit per IP
  const existing = connectionsByIp.get(ip);
  const count = existing ? existing.size : 0;
  return count < CONNECTIONS_ANONYMOUS;
}

function trackConnection(clientId, apiKey, ip) {
  if (apiKey && apiKey !== '__anonymous__') {
    if (!connectionsByKey.has(apiKey)) connectionsByKey.set(apiKey, new Set());
    connectionsByKey.get(apiKey).add(clientId);
  } else {
    if (!connectionsByIp.has(ip)) connectionsByIp.set(ip, new Set());
    connectionsByIp.get(ip).add(clientId);
  }
}

function untrackConnection(clientId, apiKey, ip) {
  if (apiKey && apiKey !== '__anonymous__') {
    const set = connectionsByKey.get(apiKey);
    if (set) {
      set.delete(clientId);
      if (set.size === 0) connectionsByKey.delete(apiKey);
    }
  } else {
    const set = connectionsByIp.get(ip);
    if (set) {
      set.delete(clientId);
      if (set.size === 0) connectionsByIp.delete(ip);
    }
  }
}

// =============================================================================
// TOPIC-BASED SUBSCRIPTIONS (prices:BTC, news:breaking, sentiment:global)
// =============================================================================

/**
 * Topic subscriptions allow fine-grained pub/sub:
 *   prices:BTC, prices:ETH, prices:SOL, prices:*
 *   news:breaking, news:bitcoin, news:defi, news:*
 *   sentiment:global, sentiment:*
 *   whales:BTC, whales:*, whales:ETH
 *   alerts:*
 *
 * Clients send: { type: "subscribe_topics", payload: { topics: ["prices:BTC", "news:breaking"] } }
 */
const VALID_TOPIC_PREFIXES = ['prices', 'news', 'sentiment', 'whales', 'alerts'];
const COIN_SYMBOLS = [
  'BTC',
  'ETH',
  'SOL',
  'ADA',
  'DOT',
  'AVAX',
  'LINK',
  'MATIC',
  'DOGE',
  'XRP',
  'BNB',
  'UNI',
  'AAVE',
  'ATOM',
];
const COIN_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  MATIC: 'polygon',
  DOGE: 'dogecoin',
  XRP: 'ripple',
  BNB: 'binancecoin',
  UNI: 'uniswap',
  AAVE: 'aave',
  ATOM: 'cosmos',
};
// Precomputed reverse map: coinGecko ID → symbol (avoids O(n) lookup per price per client)
const ID_TO_COIN = Object.fromEntries(Object.entries(COIN_TO_ID).map(([sym, id]) => [id, sym]));

function isValidTopic(topic) {
  const [prefix, suffix] = topic.split(':');
  if (!VALID_TOPIC_PREFIXES.includes(prefix)) return false;
  if (!suffix) return false;
  if (suffix === '*') return true;
  switch (prefix) {
    case 'prices':
      return COIN_SYMBOLS.includes(suffix.toUpperCase());
    case 'news':
      return suffix === 'breaking' || Object.keys(CHANNELS).includes(suffix);
    case 'sentiment':
      return suffix === 'global';
    case 'whales':
      return suffix === '*' || COIN_SYMBOLS.includes(suffix.toUpperCase());
    case 'alerts':
      return true;
    default:
      return false;
  }
}

// =============================================================================
// RECONNECTION GUIDANCE
// =============================================================================

/**
 * Build a reconnection guidance object for error/close payloads.
 * Gives clients actionable instructions on how to reconnect.
 */
function reconnectGuidance(code, extra = {}) {
  const base = {
    shouldReconnect: true,
    delay: 1000,
    maxDelay: 30000,
    strategy: 'exponential-backoff',
    jitter: true,
    url: extra.url || null,
    message:
      'Reconnect with exponential backoff: delay = min(1000 * 2^attempt, 30000) + random(0..1000)',
  };
  switch (code) {
    case 4001: // Auth failed
      return {
        ...base,
        shouldReconnect: false,
        message: 'Authentication failed. Check your API key and retry.',
      };
    case 4002: // Connection limit
      return {
        ...base,
        delay: 5000,
        message: 'Connection limit reached. Close other connections or upgrade your plan.',
      };
    case 4003: // Server at capacity
      return {
        ...base,
        delay: 10000,
        maxDelay: 60000,
        message: 'Server at capacity. Retry with backoff.',
      };
    case 1001: // Going away (shutdown)
      return {
        ...base,
        delay: 500,
        message: 'Server is restarting. Reconnect shortly.',
      };
    case 4008: // Heartbeat timeout
      return {
        ...base,
        delay: 1000,
        message: 'Connection timed out. Check your network and reconnect.',
      };
    default:
      return base;
  }
}

// =============================================================================
// SERVER-INITIATED HEARTBEAT (WebSocket protocol-level ping/pong)
// =============================================================================

const HEARTBEAT_INTERVAL = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10); // 30s
const HEARTBEAT_TIMEOUT = parseInt(process.env.WS_HEARTBEAT_TIMEOUT || '10000', 10); // 10s grace

function startHeartbeat() {
  setInterval(() => {
    clients.forEach((client, clientId) => {
      if (client._pongReceived === false) {
        // Didn't respond to last ping — terminate
        console.log(`[heartbeat] Client ${clientId} failed ping/pong — terminating`);
        // Send error with reconnection guidance before terminating
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(
              JSON.stringify({
                type: WS_MSG_TYPES.ERROR,
                payload: {
                  message: 'Heartbeat timeout — no pong received',
                  code: 4008,
                  reconnect: reconnectGuidance(4008),
                },
              }),
            );
          }
        } catch {
          /* ignore send errors on dying socket */
        }
        client.ws.terminate();
        return;
      }
      // Mark as waiting for pong, send protocol-level ping
      client._pongReceived = false;
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.ping();
      }
    });
  }, HEARTBEAT_INTERVAL);
}

// Prometheus metrics counters
const metricsCounters = {
  messagesSent: 0,
  messagesReceived: 0,
  messagesDropped: 0,
  authFailures: 0,
  connectionLimitHits: 0,
};

// Client management
const clients = new Map();

// Shutdown state
let isShuttingDown = false;
const DRAIN_TIMEOUT_MS = 30000; // 30s drain window for graceful shutdown

// Market data cache
let priceCache = {};
let sentimentCache = null;
let whaleCache = [];

// =============================================================================
// SEPARATE HEALTH CHECK HTTP SERVER (port 8081)
// =============================================================================

function countAuthenticated() {
  let count = 0;
  clients.forEach((client) => {
    if (client.apiKey && client.apiKey !== '__anonymous__') count++;
  });
  return count;
}

function getChannelStats() {
  const stats = {};
  Object.keys(CHANNELS).forEach((ch) => {
    let count = 0;
    clients.forEach((client) => {
      if (client.channels.has(ch)) count++;
    });
    stats[ch] = count;
  });
  return stats;
}

const healthServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/health' || req.url === '/healthz') {
    const authed = countAuthenticated();
    const health = {
      status: isShuttingDown ? 'draining' : 'ok',
      uptime: process.uptime(),
      connections: {
        total: clients.size,
        authenticated: authed,
        anonymous: clients.size - authed,
      },
      channels: getChannelStats(),
      redis: {
        connected: redisPub ? redisPub.isOpen === true : false,
        pubsub: redisSub ? redisSub.isOpen === true : false,
      },
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };

    res.writeHead(isShuttingDown ? 503 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
    return;
  }

  if (req.url === '/ready') {
    const ready = !process.env.REDIS_URL || (redisPub ? redisPub.isOpen === true : false);
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ready }));
    return;
  }

  if (req.url === '/metrics') {
    let pricesSubs = 0,
      whalesSubs = 0,
      sentimentSubs = 0;
    clients.forEach((client) => {
      if (client.streamPrices) pricesSubs++;
      if (client.streamWhales) whalesSubs++;
      if (client.streamSentiment) sentimentSubs++;
    });

    const metrics = [
      `# HELP ws_connections_total Total WebSocket connections`,
      `# TYPE ws_connections_total gauge`,
      `ws_connections_total ${clients.size}`,
      `# HELP ws_messages_sent_total Total messages sent`,
      `# TYPE ws_messages_sent_total counter`,
      `ws_messages_sent_total ${metricsCounters.messagesSent}`,
      `# HELP ws_messages_received_total Total messages received`,
      `# TYPE ws_messages_received_total counter`,
      `ws_messages_received_total ${metricsCounters.messagesReceived}`,
      `# HELP ws_messages_dropped_total Messages dropped due to backpressure`,
      `# TYPE ws_messages_dropped_total counter`,
      `ws_messages_dropped_total ${metricsCounters.messagesDropped}`,
      `# HELP ws_uptime_seconds Server uptime in seconds`,
      `# TYPE ws_uptime_seconds gauge`,
      `ws_uptime_seconds ${Math.floor(process.uptime())}`,
      `# HELP process_memory_rss_bytes Process RSS memory`,
      `# TYPE process_memory_rss_bytes gauge`,
      `process_memory_rss_bytes ${process.memoryUsage().rss}`,
      `# HELP ws_stream_subscribers Active stream subscribers`,
      `# TYPE ws_stream_subscribers gauge`,
      `ws_stream_subscribers{stream="prices"} ${pricesSubs}`,
      `ws_stream_subscribers{stream="whales"} ${whalesSubs}`,
      `ws_stream_subscribers{stream="sentiment"} ${sentimentSubs}`,
      `# HELP ws_leader Is this instance the leader`,
      `# TYPE ws_leader gauge`,
      `ws_leader ${isLeader ? 1 : 0}`,
    ].join('\n');

    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(metrics);
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const HEALTH_PORT = parseInt(process.env.WS_HEALTH_PORT || '8081', 10);

// Create HTTP server for health checks
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    const globalStats = await redisGetGlobalStats();
    res.writeHead(isShuttingDown ? 503 : 200, {
      'Content-Type': 'application/json',
    });
    res.end(
      JSON.stringify({
        status: isShuttingDown ? 'draining' : 'ok',
        version: '4.0.0',
        instanceId: INSTANCE_ID,
        isLeader,
        redis: redisPub ? 'connected' : 'unavailable',
        auth: { required: WS_REQUIRE_AUTH, keysConfigured: WS_API_KEYS.size },
        clients: clients.size,
        globalClients: globalStats?.totalConnections ?? clients.size,
        maxClients: MAX_CONNECTIONS,
        connectionsPerKey: CONNECTIONS_PER_KEY,
        uptime: process.uptime(),
        features: [
          'news',
          'breaking',
          'alerts',
          'prices',
          'whales',
          'sentiment',
          'channels',
          'topics',
          'api-key-auth',
          'heartbeat',
          'compression',
        ],
        heartbeat: { interval: HEARTBEAT_INTERVAL, timeout: HEARTBEAT_TIMEOUT },
      }),
    );
    return;
  }

  if (req.url === '/stats') {
    const stats = await getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
    return;
  }

  if (req.url === '/channels') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        channels: Object.keys(CHANNELS).map((id) => ({ id, ...CHANNELS[id] })),
      }),
    );
    return;
  }

  if (req.url === '/prices') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        prices: priceCache,
        updatedAt: new Date().toISOString(),
      }),
    );
    return;
  }

  if (req.url === '/metrics') {
    // Per-channel subscription counts (local)
    const channelLines = Object.keys(CHANNELS)
      .map((ch) => {
        let count = 0;
        clients.forEach((client) => {
          if (client.channels.has(ch)) count++;
        });
        return `ws_subscriptions_total{channel="${ch}"} ${count}`;
      })
      .join('\n');

    // Per-stream subscriber counts (local)
    let pricesSubs = 0,
      whalesSubs = 0,
      sentimentSubs = 0;
    clients.forEach((client) => {
      if (client.streamPrices) pricesSubs++;
      if (client.streamWhales) whalesSubs++;
      if (client.streamSentiment) sentimentSubs++;
    });

    const body = [
      '# HELP ws_connections_total Current WebSocket connections on this instance',
      '# TYPE ws_connections_total gauge',
      `ws_connections_total{instance="${INSTANCE_ID}"} ${clients.size}`,
      '',
      '# HELP ws_messages_sent_total Messages sent to clients',
      '# TYPE ws_messages_sent_total counter',
      `ws_messages_sent_total ${metricsCounters.messagesSent}`,
      '',
      '# HELP ws_messages_received_total Messages received from clients',
      '# TYPE ws_messages_received_total counter',
      `ws_messages_received_total ${metricsCounters.messagesReceived}`,
      '',
      '# HELP ws_messages_dropped_total Messages dropped due to backpressure',
      '# TYPE ws_messages_dropped_total counter',
      `ws_messages_dropped_total ${metricsCounters.messagesDropped}`,
      '',
      '# HELP ws_subscriptions_total Active channel subscriptions',
      '# TYPE ws_subscriptions_total gauge',
      channelLines,
      '',
      '# HELP ws_stream_subscribers Active stream subscribers',
      '# TYPE ws_stream_subscribers gauge',
      `ws_stream_subscribers{stream="prices"} ${pricesSubs}`,
      `ws_stream_subscribers{stream="whales"} ${whalesSubs}`,
      `ws_stream_subscribers{stream="sentiment"} ${sentimentSubs}`,
      '',
      '# HELP ws_uptime_seconds Server uptime',
      '# TYPE ws_uptime_seconds gauge',
      `ws_uptime_seconds ${Math.floor(process.uptime())}`,
      '',
      '# HELP ws_leader Is this instance the leader',
      '# TYPE ws_leader gauge',
      `ws_leader ${isLeader ? 1 : 0}`,
      '',
    ].join('\n');

    res.writeHead(200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
    res.end(body);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Free Crypto News WebSocket Server v4.0

Connect via ws://${req.headers.host}?apiKey=YOUR_KEY

Authentication:
  Pass your API key as a query parameter: ?apiKey=YOUR_KEY
  ${WS_REQUIRE_AUTH ? 'Authentication is REQUIRED.' : 'Anonymous connections allowed (limited).'}

Topic Subscriptions:
  Subscribe to fine-grained topics:
    prices:BTC, prices:ETH, prices:*
    news:breaking, news:bitcoin, news:defi, news:*
    sentiment:global, sentiment:*
    whales:BTC, whales:*, alerts:*

Features:
  - Real-time news streaming
  - Live price updates (BTC, ETH, SOL, etc.)
  - Whale alert notifications
  - Market sentiment (Fear & Greed)
  - Topic channels (bitcoin, defi, nft, etc.)
  - Custom alert subscriptions
  - API key authentication
  - Per-key connection limits
  - Server-side heartbeat (ping/pong)
  - permessage-deflate compression
  - Auto-reconnection guidance

Endpoints:
  /health   - Server health check
  /stats    - Connection statistics
  /channels - Available topic channels
  /prices   - Current price cache
  /metrics  - Prometheus metrics
`);
});

// Create WebSocket server with compression
const wss = new WebSocket.Server({
  server,
  maxPayload: MAX_PAYLOAD,
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

// Handle new connection — async for API key validation
wss.on('connection', async (ws, req) => {
  // Reject during shutdown
  if (isShuttingDown) {
    const guidance = reconnectGuidance(1001);
    ws.close(1001, JSON.stringify({ reason: 'Server shutting down', reconnect: guidance }));
    return;
  }

  // Enforce global connection cap
  if (clients.size >= MAX_CONNECTIONS) {
    metricsCounters.connectionLimitHits++;
    const guidance = reconnectGuidance(4003);
    ws.close(4003, JSON.stringify({ reason: 'Server at capacity', reconnect: guidance }));
    return;
  }

  const clientId = generateClientId();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // ── API Key Authentication ──
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const apiKey = url.searchParams.get('apiKey') || null;

  const authResult = await validateApiKey(apiKey);
  if (!authResult.valid) {
    metricsCounters.authFailures++;
    const guidance = reconnectGuidance(4001);
    ws.close(
      4001,
      JSON.stringify({
        reason: authResult.reason || 'Authentication failed',
        reconnect: guidance,
      }),
    );
    console.log(`[${new Date().toISOString()}] Auth rejected from ${ip}: ${authResult.reason}`);
    return;
  }

  // ── Per-Key / Per-IP Connection Limits ──
  const effectiveKey = apiKey || '__anonymous__';
  if (!checkConnectionLimit(effectiveKey, ip)) {
    metricsCounters.connectionLimitHits++;
    const guidance = reconnectGuidance(4002);
    ws.close(
      4002,
      JSON.stringify({
        reason: 'Connection limit reached for your API key / IP.',
        reconnect: guidance,
      }),
    );
    console.log(
      `[${new Date().toISOString()}] Connection limit hit for ${effectiveKey} from ${ip}`,
    );
    return;
  }

  // ── Register client ──
  trackConnection(clientId, effectiveKey, ip);

  clients.set(clientId, {
    ws,
    ip,
    apiKey: effectiveKey,
    tier: authResult.tier || 'anonymous',
    subscription: {
      sources: [],
      categories: [],
      keywords: [],
      coins: [],
    },
    channels: new Set(), // Topic channels
    topics: new Set(), // Fine-grained topic subscriptions (prices:BTC, news:breaking, etc.)
    alertSubscriptions: new Set(), // Alert rule IDs or '*' for all
    streamPrices: false, // Subscribe to price updates
    streamWhales: false, // Subscribe to whale alerts
    streamSentiment: false, // Subscribe to sentiment updates
    connectedAt: Date.now(),
    lastPing: Date.now(),
    messageCount: 0,
    lastMessageReset: Date.now(),
    _pongReceived: true, // Heartbeat: assume alive on connect
  });

  // Track connection in Redis
  redisTrackConnect();

  console.log(
    JSON.stringify({
      event: 'ws_connect',
      clientId,
      ip,
      authenticated: !!apiKey,
      tier: authResult.tier,
      totalConnections: clients.size,
      timestamp: new Date().toISOString(),
    }),
  );

  // Send welcome message with available features
  ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.CONNECTED,
      payload: {
        clientId,
        message: 'Connected to Free Crypto News WebSocket v4.0',
        serverTime: new Date().toISOString(),
        tier: authResult.tier,
        features: [
          'news',
          'breaking',
          'alerts',
          'prices',
          'whales',
          'sentiment',
          'channels',
          'topics',
          'heartbeat',
          'compression',
        ],
        availableChannels: Object.keys(CHANNELS),
        availableTopics: [
          'prices:BTC',
          'prices:ETH',
          'prices:SOL',
          'prices:*',
          'news:breaking',
          'news:bitcoin',
          'news:defi',
          'news:*',
          'sentiment:global',
          'sentiment:*',
          'whales:BTC',
          'whales:*',
          'alerts:*',
        ],
        rateLimit: RATE_LIMIT,
        heartbeat: { interval: HEARTBEAT_INTERVAL, timeout: HEARTBEAT_TIMEOUT },
        reconnect: reconnectGuidance(1000),
      },
    }),
  );

  // ── WebSocket protocol-level pong handler (response to server ping) ──
  ws.on('pong', () => {
    const client = clients.get(clientId);
    if (client) {
      client._pongReceived = true;
      client.lastPing = Date.now();
      redisRefreshConnectionTTL(clientId);
    }
  });

  // Handle messages
  ws.on('message', (data) => {
    const client = clients.get(clientId);
    if (!client) return;

    metricsCounters.messagesReceived++;

    // Rate limiting
    const now = Date.now();
    if (now - client.lastMessageReset > 60000) {
      client.messageCount = 0;
      client.lastMessageReset = now;
    }

    client.messageCount++;
    if (client.messageCount > RATE_LIMIT.messagesPerMinute) {
      ws.send(
        JSON.stringify({
          type: WS_MSG_TYPES.RATE_LIMITED,
          payload: {
            message: 'Rate limit exceeded. Please slow down.',
            retryAfter: 60,
          },
        }),
      );
      return;
    }

    try {
      const message = JSON.parse(data.toString());
      handleMessage(clientId, message);
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: WS_MSG_TYPES.ERROR,
          payload: { message: 'Invalid JSON message' },
        }),
      );
    }
  });

  // Handle close — include reconnection guidance
  ws.on('close', (code, reason) => {
    const client = clients.get(clientId);
    console.log(
      JSON.stringify({
        event: 'ws_disconnect',
        clientId,
        code,
        reason: reason ? reason.toString() : undefined,
        duration: client ? Date.now() - client.connectedAt : undefined,
        totalConnections: Math.max(0, clients.size - 1),
        timestamp: new Date().toISOString(),
      }),
    );
    if (client) {
      // Keep state in Redis for reconnection window (don't delete — TTL auto-expires)
      redisSaveConnectionState(clientId, client);
      // Decrement Redis channel counters for all channels this client was in
      for (const ch of client.channels) {
        redisTrackChannelLeave(ch);
      }
      // Decrement Redis stream counters
      if (client.streamPrices) redisTrackStreamUnsubscribe('prices');
      if (client.streamWhales) redisTrackStreamUnsubscribe('whales');
      if (client.streamSentiment) redisTrackStreamUnsubscribe('sentiment');
      // Untrack per-key / per-IP connection
      untrackConnection(clientId, client.apiKey, client.ip);
    }
    clients.delete(clientId);
    redisTrackDisconnect();
  });

  // Handle errors — include reconnection guidance
  ws.on('error', (error) => {
    console.error(
      JSON.stringify({
        event: 'ws_error',
        clientId,
        error: error.message,
        ip,
        timestamp: new Date().toISOString(),
      }),
    );
    const client = clients.get(clientId);
    if (client) {
      for (const ch of client.channels) {
        redisTrackChannelLeave(ch);
      }
      if (client.streamPrices) redisTrackStreamUnsubscribe('prices');
      if (client.streamWhales) redisTrackStreamUnsubscribe('whales');
      if (client.streamSentiment) redisTrackStreamUnsubscribe('sentiment');
      untrackConnection(clientId, client.apiKey, client.ip);
    }
    clients.delete(clientId);
    redisTrackDisconnect();
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
      client.ws.send(
        JSON.stringify({
          type: WS_MSG_TYPES.PONG,
          timestamp: new Date().toISOString(),
        }),
      );
      redisRefreshConnectionTTL(clientId);
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
    case 'stream_prices': {
      const wasEnabled = client.streamPrices;
      client.streamPrices = message.payload?.enabled !== false;
      client.ws.send(
        JSON.stringify({
          type: 'prices_stream',
          payload: { enabled: client.streamPrices, interval: '10s' },
        }),
      );
      // Track in Redis
      if (client.streamPrices && !wasEnabled) redisTrackStreamSubscribe('prices');
      if (!client.streamPrices && wasEnabled) redisTrackStreamUnsubscribe('prices');
      // Send current prices immediately
      if (client.streamPrices && Object.keys(priceCache).length > 0) {
        client.ws.send(
          JSON.stringify({
            type: WS_MSG_TYPES.PRICES,
            payload: { prices: priceCache },
            timestamp: new Date().toISOString(),
          }),
        );
      }
      redisSaveConnectionState(clientId, client);
      break;
    }
    case 'stream_whales': {
      const wasEnabled = client.streamWhales;
      client.streamWhales = message.payload?.enabled !== false;
      client.ws.send(
        JSON.stringify({
          type: 'whales_stream',
          payload: { enabled: client.streamWhales, interval: '60s' },
        }),
      );
      if (client.streamWhales && !wasEnabled) redisTrackStreamSubscribe('whales');
      if (!client.streamWhales && wasEnabled) redisTrackStreamUnsubscribe('whales');
      redisSaveConnectionState(clientId, client);
      break;
    }
    case 'stream_sentiment': {
      const wasEnabled = client.streamSentiment;
      client.streamSentiment = message.payload?.enabled !== false;
      client.ws.send(
        JSON.stringify({
          type: 'sentiment_stream',
          payload: { enabled: client.streamSentiment, interval: '5m' },
        }),
      );
      if (client.streamSentiment && !wasEnabled) redisTrackStreamSubscribe('sentiment');
      if (!client.streamSentiment && wasEnabled) redisTrackStreamUnsubscribe('sentiment');
      // Send current sentiment immediately
      if (client.streamSentiment && sentimentCache) {
        client.ws.send(
          JSON.stringify({
            type: WS_MSG_TYPES.SENTIMENT,
            payload: sentimentCache,
            timestamp: new Date().toISOString(),
          }),
        );
      }
      redisSaveConnectionState(clientId, client);
      break;
    }
    default:
    // ── Topic-based subscriptions (prices:BTC, news:breaking, etc.) ──
    case 'subscribe_topics':
      handleSubscribeTopics(clientId, message.payload);
      break;
    case 'unsubscribe_topics':
      handleUnsubscribeTopics(clientId, message.payload);
      break;
      // Handle reconnection restore: client sends previous clientId to restore state
      if (message.type === 'restore' && message.payload?.previousClientId) {
        handleRestore(clientId, message.payload.previousClientId);
        break;
      }
      console.log(`Unknown message type: ${message.type}`);
  }
}

// =============================================================================
// TOPIC SUBSCRIPTION HANDLERS (prices:BTC, news:breaking, sentiment:global)
// =============================================================================

function handleSubscribeTopics(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const topics = payload?.topics;
  if (!Array.isArray(topics) || topics.length === 0) {
    client.ws.send(
      JSON.stringify({
        type: WS_MSG_TYPES.ERROR,
        payload: { message: 'topics must be a non-empty array' },
      }),
    );
    return;
  }

  const subscribed = [];
  const invalid = [];

  for (const topic of topics) {
    if (typeof topic !== 'string') {
      invalid.push(topic);
      continue;
    }
    if (!isValidTopic(topic)) {
      invalid.push(topic);
      continue;
    }
    if (client.topics.size >= RATE_LIMIT.subscriptionsMax) {
      client.ws.send(
        JSON.stringify({
          type: WS_MSG_TYPES.ERROR,
          payload: {
            message: `Maximum ${RATE_LIMIT.subscriptionsMax} topic subscriptions reached`,
          },
        }),
      );
      break;
    }
    client.topics.add(topic);
    subscribed.push(topic);

    // Auto-enable the relevant stream when subscribing to a topic
    const [prefix] = topic.split(':');
    if (prefix === 'prices' && !client.streamPrices) {
      client.streamPrices = true;
      redisTrackStreamSubscribe('prices');
    } else if (prefix === 'whales' && !client.streamWhales) {
      client.streamWhales = true;
      redisTrackStreamSubscribe('whales');
    } else if (prefix === 'sentiment' && !client.streamSentiment) {
      client.streamSentiment = true;
      redisTrackStreamSubscribe('sentiment');
    } else if (prefix === 'news') {
      // Map news topics to channels where applicable
      const [, suffix] = topic.split(':');
      if (suffix && suffix !== 'breaking' && suffix !== '*' && CHANNELS[suffix]) {
        client.channels.add(suffix);
        redisTrackChannelJoin(suffix);
      }
    }
  }

  client.ws.send(
    JSON.stringify({
      type: 'topics_subscribed',
      payload: {
        subscribed,
        invalid: invalid.length > 0 ? invalid : undefined,
        activeTopics: Array.from(client.topics),
      },
      timestamp: new Date().toISOString(),
    }),
  );

  if (subscribed.length > 0) {
    console.log(
      `[${new Date().toISOString()}] Client ${clientId} subscribed to topics:`,
      subscribed,
    );
  }
  redisSaveConnectionState(clientId, client);
}

function handleUnsubscribeTopics(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const topics = payload?.topics;
  if (!Array.isArray(topics) || topics.length === 0) {
    // Unsubscribe from all topics
    client.topics.clear();
  } else {
    for (const topic of topics) {
      client.topics.delete(topic);
    }
  }

  client.ws.send(
    JSON.stringify({
      type: 'topics_unsubscribed',
      payload: {
        activeTopics: Array.from(client.topics),
      },
      timestamp: new Date().toISOString(),
    }),
  );
  redisSaveConnectionState(clientId, client);
}

// Handle restore (reconnect to previous session)
async function handleRestore(clientId, previousClientId) {
  const client = clients.get(clientId);
  if (!client) return;

  const state = await redisLoadConnectionState(previousClientId);
  if (!state) {
    client.ws.send(
      JSON.stringify({
        type: 'restore_failed',
        payload: {
          message: 'Previous session not found or expired',
          previousClientId,
        },
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Restore subscriptions
  if (state.subscriptions) {
    client.subscription = {
      sources: state.subscriptions.sources || [],
      categories: state.subscriptions.categories || [],
      keywords: state.subscriptions.keywords || [],
      coins: state.subscriptions.coins || [],
    };
  }

  // Restore channels
  if (state.channels) {
    for (const ch of state.channels) {
      if (CHANNELS[ch]) {
        client.channels.add(ch);
        redisTrackChannelJoin(ch);
      }
    }
  }

  // Restore alert subscriptions
  if (state.alertSubscriptions) {
    for (const alertId of state.alertSubscriptions) {
      client.alertSubscriptions.add(alertId);
    }
  }

  // Restore stream flags
  if (state.streamPrices) {
    client.streamPrices = true;
    redisTrackStreamSubscribe('prices');
  }
  if (state.streamWhales) {
    client.streamWhales = true;
    redisTrackStreamSubscribe('whales');
  }
  if (state.streamSentiment) {
    client.streamSentiment = true;
    redisTrackStreamSubscribe('sentiment');
  }

  // Clean up old session
  await redisRemoveConnectionState(previousClientId, null);

  // Save new state
  redisSaveConnectionState(clientId, client);

  client.ws.send(
    JSON.stringify({
      type: 'restored',
      payload: {
        previousClientId,
        subscription: client.subscription,
        channels: Array.from(client.channels),
        alertSubscriptions: Array.from(client.alertSubscriptions),
        streamPrices: client.streamPrices,
        streamWhales: client.streamWhales,
        streamSentiment: client.streamSentiment,
      },
      timestamp: new Date().toISOString(),
    }),
  );

  console.log(
    `[${new Date().toISOString()}] Client ${clientId} restored session from ${previousClientId}`,
  );
}

// Handle subscribe
function handleSubscribe(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  if (payload.sources) {
    client.subscription.sources = [
      ...new Set([...client.subscription.sources, ...payload.sources]),
    ];
  }
  if (payload.categories) {
    client.subscription.categories = [
      ...new Set([...client.subscription.categories, ...payload.categories]),
    ];
  }
  if (payload.keywords) {
    client.subscription.keywords = [
      ...new Set([...client.subscription.keywords, ...payload.keywords]),
    ];
  }
  if (payload.coins) {
    client.subscription.coins = [...new Set([...client.subscription.coins, ...payload.coins])];
  }

  client.ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.SUBSCRIBED,
      payload: { subscription: client.subscription },
      timestamp: new Date().toISOString(),
    }),
  );

  console.log(`[${new Date().toISOString()}] Client ${clientId} subscribed:`, client.subscription);
  redisSaveConnectionState(clientId, client);
}

// Handle unsubscribe
function handleUnsubscribe(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  if (payload.sources) {
    client.subscription.sources = client.subscription.sources.filter(
      (s) => !payload.sources.includes(s),
    );
  }
  if (payload.categories) {
    client.subscription.categories = client.subscription.categories.filter(
      (c) => !payload.categories.includes(c),
    );
  }
  if (payload.keywords) {
    client.subscription.keywords = client.subscription.keywords.filter(
      (k) => !payload.keywords.includes(k),
    );
  }
  if (payload.coins) {
    client.subscription.coins = client.subscription.coins.filter((c) => !payload.coins.includes(c));
  }

  client.ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.UNSUBSCRIBED,
      payload: { subscription: client.subscription },
      timestamp: new Date().toISOString(),
    }),
  );
  redisSaveConnectionState(clientId, client);
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

  client.ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.ALERTS_SUBSCRIBED,
      payload: {
        subscribedTo: Array.from(client.alertSubscriptions),
      },
      timestamp: new Date().toISOString(),
    }),
  );

  console.log(
    `[${new Date().toISOString()}] Client ${clientId} subscribed to alerts:`,
    Array.from(client.alertSubscriptions),
  );
  redisSaveConnectionState(clientId, client);
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

  client.ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.ALERTS_UNSUBSCRIBED,
      payload: {
        subscribedTo: Array.from(client.alertSubscriptions),
      },
      timestamp: new Date().toISOString(),
    }),
  );
}

// Handle channel join
function handleJoinChannel(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const channelId = payload?.channel;
  if (!channelId || !CHANNELS[channelId]) {
    client.ws.send(
      JSON.stringify({
        type: WS_MSG_TYPES.ERROR,
        payload: {
          message: `Invalid channel: ${channelId}. Available: ${Object.keys(CHANNELS).join(', ')}`,
        },
      }),
    );
    return;
  }

  // Check subscription limit
  if (client.channels.size >= RATE_LIMIT.subscriptionsMax) {
    client.ws.send(
      JSON.stringify({
        type: WS_MSG_TYPES.ERROR,
        payload: {
          message: `Maximum ${RATE_LIMIT.subscriptionsMax} subscriptions reached`,
        },
      }),
    );
    return;
  }

  client.channels.add(channelId);
  redisTrackChannelJoin(channelId);

  client.ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.CHANNEL_JOINED,
      payload: {
        channel: channelId,
        channelInfo: CHANNELS[channelId],
        subscribedChannels: Array.from(client.channels),
      },
      timestamp: new Date().toISOString(),
    }),
  );

  console.log(`[${new Date().toISOString()}] Client ${clientId} joined channel: ${channelId}`);
  redisSaveConnectionState(clientId, client);
}

// Handle channel leave
function handleLeaveChannel(clientId, payload) {
  const client = clients.get(clientId);
  if (!client) return;

  const channelId = payload?.channel;

  if (channelId) {
    if (client.channels.has(channelId)) {
      client.channels.delete(channelId);
      redisTrackChannelLeave(channelId);
    }
  } else {
    // Leave all channels — decrement each in Redis
    for (const ch of client.channels) {
      redisTrackChannelLeave(ch);
    }
    client.channels.clear();
  }

  client.ws.send(
    JSON.stringify({
      type: WS_MSG_TYPES.CHANNEL_LEFT,
      payload: {
        channel: channelId || 'all',
        subscribedChannels: Array.from(client.channels),
      },
      timestamp: new Date().toISOString(),
    }),
  );
  redisSaveConnectionState(clientId, client);
}

// =============================================================================
// CROSS-INSTANCE BROADCASTING (Redis pub/sub)
// =============================================================================

/**
 * Publish a broadcast event.
 *
 * ALWAYS delivers to local clients first (immediate, zero-latency for this
 * instance's connections).  When Redis is available, also publishes to the
 * shared channel so OTHER instances deliver to their clients.
 *
 * The subscriber callback skips messages from this instance (INSTANCE_ID
 * match) to prevent double-delivery.
 */
function publishBroadcast(type, payload, meta = {}) {
  const timestamp = new Date().toISOString();
  const enrichedMeta = { ...meta, instanceId: INSTANCE_ID };

  // 1. Always deliver locally — this instance's clients get it NOW
  localBroadcastRaw(type, payload, timestamp, enrichedMeta);

  // 2. Publish to Redis so other instances also deliver
  if (redisPub) {
    const msg = JSON.stringify({
      type,
      payload,
      timestamp,
      meta: enrichedMeta,
    });
    redisPub.publish(REDIS_CHANNEL, msg).catch((err) => {
      console.error('[redis] Publish failed (local delivery already done):', err.message);
    });
  }
}

/**
 * Safely send a JSON message to a client. Returns false if the send fails
 * (client disconnected between readyState check and send).
 */
function safeSend(client, clientId, data) {
  if (client.ws.readyState !== WebSocket.OPEN) return false;

  // Backpressure: drop non-critical messages when the send buffer is full
  if (client.ws.bufferedAmount > MAX_BUFFER_SIZE) {
    const parsed =
      typeof data === 'string'
        ? (() => {
            try {
              return JSON.parse(data);
            } catch {
              return null;
            }
          })()
        : data;
    const isCritical = parsed && parsed.type === WS_MSG_TYPES.BREAKING;
    if (!isCritical) {
      metricsCounters.messagesDropped++;
      console.warn(
        JSON.stringify({
          event: 'ws_backpressure',
          clientId,
          bufferedAmount: client.ws.bufferedAmount,
          ip: client.ip,
          timestamp: new Date().toISOString(),
        }),
      );
      return false;
    }
  }

  try {
    client.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    metricsCounters.messagesSent++;
    return true;
  } catch (err) {
    console.error(`[send] Failed for ${clientId}:`, err.message);
    clients.delete(clientId);
    return false;
  }
}

/**
 * Deliver a broadcast to clients connected to THIS instance only.
 * Called directly (single-process) or from the Redis subscriber handler.
 */
function localBroadcastRaw(type, payload, timestamp, meta = {}) {
  switch (meta?.broadcastKind) {
    case 'news':
      localBroadcastNews(payload.articles, type === WS_MSG_TYPES.BREAKING);
      break;
    case 'channel':
      localBroadcastToChannel(payload.channel, payload.articles);
      break;
    case 'prices':
      localBroadcastPrices(payload.prices);
      break;
    case 'whales':
      localBroadcastWhales(payload);
      break;
    case 'sentiment':
      localBroadcastSentiment(payload);
      break;
    case 'alert':
      localBroadcastAlert(payload);
      break;
    default:
      // Generic: pre-serialize once and send to every open socket
      const rawMsg = JSON.stringify({ type, payload, timestamp });
      clients.forEach((client, clientId) => {
        safeSend(client, clientId, rawMsg);
      });
  }
}

// Broadcast news to channel subscribers (local only)
function localBroadcastToChannel(channelId, articles) {
  const channel = CHANNELS[channelId];
  if (!channel) return;

  const msg = JSON.stringify({
    type: WS_MSG_TYPES.TOPIC,
    payload: { channel: channelId, channelName: channel.name, articles },
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client, clientId) => {
    if (!client.channels.has(channelId)) return;
    safeSend(client, clientId, msg);
  });
}

// Public wrappers (these publish through Redis when available)
function broadcastToChannel(channelId, articles) {
  publishBroadcast(
    WS_MSG_TYPES.TOPIC,
    { channel: channelId, articles },
    { broadcastKind: 'channel' },
  );
}

// Local news broadcast (called from localBroadcastRaw) — also deliver to topic subscribers
function localBroadcastNews(articles, isBreaking = false) {
  const type = isBreaking ? WS_MSG_TYPES.BREAKING : WS_MSG_TYPES.NEWS;
  const ts = new Date().toISOString();
  // Pre-serialize the full payload once for unfiltered clients
  const fullMsg = JSON.stringify({ type, payload: { articles }, timestamp: ts });

  clients.forEach((client, clientId) => {
    // ── Topic-based news filtering ──
    // If client has news:breaking topic and this IS breaking → deliver all
    if (isBreaking && (client.topics.has('news:breaking') || client.topics.has('news:*'))) {
      safeSend(client, clientId, fullMsg);
      return;
    }
    // news:* wildcard gets everything
    if (client.topics.has('news:*')) {
      safeSend(client, clientId, fullMsg);
      return;
    }

    const sub = client.subscription;
    // Fast path: no filters → send pre-serialized full message
    if (sub.sources.length === 0 && sub.categories.length === 0 && sub.keywords.length === 0) {
      safeSend(client, clientId, fullMsg);
      return;
    }

    const filteredArticles = articles.filter((article) => {
      if (
        sub.sources.length > 0 &&
        sub.sources.includes(article.sourceKey || article.source.toLowerCase())
      ) {
        return true;
      }
      if (sub.categories.length > 0 && sub.categories.includes(article.category)) {
        return true;
      }
      if (sub.keywords.length > 0) {
        const title = article.title.toLowerCase();
        if (sub.keywords.some((kw) => title.includes(kw.toLowerCase()))) {
          return true;
        }
      }
      return false;
    });

    if (filteredArticles.length === articles.length) {
      // All articles matched — reuse pre-serialized message
      safeSend(client, clientId, fullMsg);
    } else if (filteredArticles.length > 0) {
      safeSend(client, clientId, JSON.stringify({
        type,
        payload: { articles: filteredArticles },
        timestamp: ts,
      }));
    }
  });
}

// Public wrapper
function broadcastNews(articles, isBreaking = false) {
  const type = isBreaking ? WS_MSG_TYPES.BREAKING : WS_MSG_TYPES.NEWS;
  publishBroadcast(type, { articles }, { broadcastKind: 'news' });
}

// Local alert broadcast (called from localBroadcastRaw)
function localBroadcastAlert(alertEvent) {
  let delivered = 0;
  // Pre-serialize once for all recipients
  const msg = JSON.stringify({
    type: WS_MSG_TYPES.ALERT,
    data: alertEvent,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client, clientId) => {
    const isSubscribed =
      client.alertSubscriptions.has('*') || client.alertSubscriptions.has(alertEvent.ruleId);

    if (isSubscribed) {
      if (safeSend(client, clientId, msg)) {
        delivered++;
      }
    }
  });

  if (delivered > 0) {
    console.log(
      `[${new Date().toISOString()}] Alert ${alertEvent.id} delivered to ${delivered} clients`,
    );
  }
  return delivered;
}

// Public wrapper — publishes through Redis
function broadcastAlert(alertEvent) {
  publishBroadcast(WS_MSG_TYPES.ALERT, alertEvent, { broadcastKind: 'alert' });
}

// Broadcast multiple alerts
function broadcastAlerts(alertEvents) {
  for (const event of alertEvents) {
    broadcastAlert(event);
  }
}

// Local price broadcast — also deliver to topic subscribers
function localBroadcastPrices(prices) {
  const ts = new Date().toISOString();
  // Full prices message for stream subscribers
  const fullMsg = JSON.stringify({
    type: WS_MSG_TYPES.PRICES,
    payload: { prices },
    timestamp: ts,
  });

  clients.forEach((client, clientId) => {
    // Legacy stream subscribers get everything
    if (client.streamPrices && client.topics.size === 0) {
      safeSend(client, clientId, fullMsg);
      return;
    }

    // Topic-based subscribers: check for specific coin topics
    if (client.topics.size > 0) {
      const hasWild = client.topics.has('prices:*');
      if (hasWild) {
        safeSend(client, clientId, fullMsg);
        return;
      }
      // Filter to only subscribed coins
      const filtered = {};
      let hasAny = false;
      for (const [coinId, data] of Object.entries(prices)) {
        // Find symbol for this coinId
        const sym = ID_TO_COIN[coinId];
        if (sym && client.topics.has(`prices:${sym}`)) {
          filtered[coinId] = data;
          hasAny = true;
        }
      }
      if (hasAny) {
        safeSend(
          client,
          clientId,
          JSON.stringify({
            type: WS_MSG_TYPES.PRICES,
            payload: { prices: filtered },
            timestamp: ts,
          }),
        );
      } else if (client.streamPrices) {
        // Fallback: stream enabled but no topic match — send all
        safeSend(client, clientId, fullMsg);
      }
    } else if (client.streamPrices) {
      safeSend(client, clientId, fullMsg);
    }
  });
}

// Local whale broadcast — also deliver to topic subscribers
function localBroadcastWhales(payload) {
  const ts = new Date().toISOString();
  const fullMsg = JSON.stringify({
    type: WS_MSG_TYPES.WHALES,
    payload,
    timestamp: ts,
  });
  clients.forEach((client, clientId) => {
    if (client.streamWhales && client.topics.size === 0) {
      safeSend(client, clientId, fullMsg);
      return;
    }
    // Topic-based: whales:* or whales:BTC etc.
    if (client.topics.has('whales:*')) {
      safeSend(client, clientId, fullMsg);
      return;
    }
    // Check for specific coin whale topics
    if (client.topics.size > 0) {
      const alerts = payload.alerts || [];
      const filtered = alerts.filter((alert) => {
        const sym = (alert.symbol || '').toUpperCase();
        return sym && client.topics.has(`whales:${sym}`);
      });
      if (filtered.length > 0) {
        safeSend(
          client,
          clientId,
          JSON.stringify({
            type: WS_MSG_TYPES.WHALES,
            payload: { ...payload, alerts: filtered },
            timestamp: ts,
          }),
        );
      } else if (client.streamWhales) {
        safeSend(client, clientId, fullMsg);
      }
    } else if (client.streamWhales) {
      safeSend(client, clientId, fullMsg);
    }
  });
}

// Local sentiment broadcast — also deliver to topic subscribers
function localBroadcastSentiment(payload) {
  const msg = JSON.stringify({
    type: WS_MSG_TYPES.SENTIMENT,
    payload,
    timestamp: new Date().toISOString(),
  });
  clients.forEach((client, clientId) => {
    if (client.streamSentiment) {
      safeSend(client, clientId, msg);
      return;
    }
    // Topic-based: sentiment:global or sentiment:*
    if (client.topics.has('sentiment:global') || client.topics.has('sentiment:*')) {
      safeSend(client, clientId, msg);
    }
  });
}

// Get server stats (includes cross-instance Redis stats when available)
async function getStats() {
  let activeConnections = 0;
  let alertSubscribers = 0;
  let priceSubscribers = 0;
  let whaleSubscribers = 0;
  let sentimentSubscribers = 0;
  const channelStats = {};
  const subscriptions = {
    sources: 0,
    categories: 0,
    keywords: 0,
    coins: 0,
    alerts: 0,
    channels: 0,
  };

  Object.keys(CHANNELS).forEach((ch) => (channelStats[ch] = 0));

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

      client.channels.forEach((ch) => {
        if (channelStats[ch] !== undefined) channelStats[ch]++;
      });
    }
  });

  // Cross-instance stats from Redis
  const globalStats = await redisGetGlobalStats();

  return {
    version: '4.0.0',
    instanceId: INSTANCE_ID,
    isLeader,
    redis: redisPub ? 'connected' : 'unavailable',
    // Local (this instance)
    local: {
      totalConnections: clients.size,
      activeConnections,
      subscribers: {
        alerts: alertSubscribers,
        prices: priceSubscribers,
        whales: whaleSubscribers,
        sentiment: sentimentSubscribers,
      },
      channels: channelStats,
    },
    // Global (across all instances, via Redis)
    global: globalStats
      ? {
          totalConnections: globalStats.totalConnections,
          channels: globalStats.channelSubs,
          streams: globalStats.streamSubs,
        }
      : null,
    // Legacy flat fields for backward compatibility
    totalConnections: globalStats?.totalConnections ?? clients.size,
    activeConnections,
    subscribers: {
      alerts: alertSubscribers,
      prices: priceSubscribers,
      whales: whaleSubscribers,
      sentiment: sentimentSubscribers,
    },
    channels: globalStats?.channelSubs ?? channelStats,
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
        console.log(
          `[${new Date().toISOString()}] Broadcasting ${newArticles.length} articles to ${clients.size} clients`,
        );
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
    const response = await fetch(
      `${NEWS_API}/api/market?coins=bitcoin,ethereum,solana,cardano,polkadot,avalanche-2,chainlink,polygon`,
    );
    const data = await response.json();

    if (data.coins) {
      priceCache = data.coins;
      publishBroadcast(WS_MSG_TYPES.PRICES, { prices: priceCache }, { broadcastKind: 'prices' });
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
      const newWhales = data.alerts.filter((whale) => {
        return !whaleCache.some((cached) => cached.hash === whale.hash);
      });

      if (newWhales.length > 0) {
        whaleCache = data.alerts;
        publishBroadcast(
          WS_MSG_TYPES.WHALES,
          { alerts: newWhales, isNew: true },
          { broadcastKind: 'whales' },
        );
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
        publishBroadcast(WS_MSG_TYPES.SENTIMENT, sentimentCache, {
          broadcastKind: 'sentiment',
        });
        console.log(
          `[${new Date().toISOString()}] Broadcast sentiment update: ${sentimentCache.value} (${sentimentCache.classification})`,
        );
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
    const channelArticles = articles.filter((article) => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      return channel.keywords.some((kw) => text.includes(kw.toLowerCase()));
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

// Start health check server
healthServer.listen(HEALTH_PORT, () => {
  console.log(
    JSON.stringify({
      event: 'health_server_started',
      port: HEALTH_PORT,
      endpoints: ['/health', '/healthz', '/ready', '/metrics'],
      timestamp: new Date().toISOString(),
    }),
  );
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     Free Crypto News WebSocket Server v4.0                       ║
╠══════════════════════════════════════════════════════════════════╣
║  WebSocket: ws://localhost:${PORT}                                  ║
║  Health:    http://localhost:${PORT}/health                         ║
║  Stats:     http://localhost:${PORT}/stats                          ║
║  Channels:  http://localhost:${PORT}/channels                       ║
║  Prices:    http://localhost:${PORT}/prices                         ║
║  Metrics:   http://localhost:${PORT}/metrics                        ║
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
║    🔑 API key authentication                                     ║
║    💓 Server-initiated heartbeat (ping/pong)                     ║
║    🔄 Auto-reconnection guidance                                 ║
║    📊 Topic subscriptions (prices:BTC, news:breaking, etc.)      ║
╚══════════════════════════════════════════════════════════════════╝
  `);

  // Start server-initiated WebSocket ping/pong heartbeat
  startHeartbeat();

  // Initialize Redis pub/sub for horizontal scaling (non-blocking)
  initRedis().then(async () => {
    await tryAcquireLeadership();
    startInstanceHeartbeat();
    console.log(
      `[${new Date().toISOString()}] Instance ${INSTANCE_ID} ready (leader: ${isLeader})`,
    );
  });

  // Leader heartbeat — renew or acquire leadership every 15s
  setInterval(renewOrReacquireLeadership, 15000);

  // Polling loops — only the leader fetches from upstream APIs.
  // Non-leaders receive data via Redis pub/sub.
  setInterval(() => {
    if (isLeader) pollNews();
  }, POLL_INTERVAL);
  setTimeout(() => {
    if (isLeader) pollNews();
  }, 1000); // first poll after 1s startup

  setInterval(() => {
    if (isLeader) pollPrices();
  }, PRICE_INTERVAL);
  setTimeout(() => {
    if (isLeader) pollPrices();
  }, 1000);

  setInterval(() => {
    if (isLeader) pollWhales();
  }, WHALE_INTERVAL);
  setTimeout(() => {
    if (isLeader) pollWhales();
  }, 1000);

  setInterval(() => {
    if (isLeader) pollSentiment();
  }, SENTIMENT_INTERVAL);
  setTimeout(() => {
    if (isLeader) pollSentiment();
  }, 1000);

  setInterval(() => {
    if (isLeader) evaluateAndBroadcastAlerts();
  }, ALERT_EVAL_INTERVAL);

  // Cleanup stale connections every minute
  setInterval(cleanupStale, 60000);
});

// =============================================================================
// GRACEFUL SHUTDOWN — 30s drain window
// =============================================================================

async function gracefulShutdown(signal) {
  if (isShuttingDown) return; // Prevent double-shutdown
  isShuttingDown = true;
  console.log(JSON.stringify({
    event: "shutdown_started",
    signal,
    drainTimeoutMs: DRAIN_TIMEOUT_MS,
    timestamp: new Date().toISOString(),
  }));

  // 1. Stop accepting new HTTP & WS connections
  server.close(() => {
    console.log(
      JSON.stringify({
        event: 'shutdown_http_closed',
        timestamp: new Date().toISOString(),
      }),
    );
  });
  healthServer.close(() => {
    console.log(
      JSON.stringify({
        event: 'shutdown_health_closed',
        timestamp: new Date().toISOString(),
      }),
    );
  });

  // 2. Release leadership immediately so another instance takes over polling
  if (redisPub && isLeader) {
    await redisPub.del(LEADER_KEY).catch(() => {});
    isLeader = false;
    console.log(JSON.stringify({
      event: "shutdown_leadership_released",
      timestamp: new Date().toISOString(),
    }));
  }

  // 3. Notify clients to reconnect with guidance, then send close frame
  const clientCount = clients.size;
  console.log(
    JSON.stringify({
      event: 'shutdown_draining',
      connections: clientCount,
      timestamp: new Date().toISOString(),
    }),
  );
  const shutdownGuidance = reconnectGuidance(1001);
  const closePromises = [];
  wss.clients.forEach((ws) => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'system',
            event: 'server_shutdown',
            message: 'Server is restarting. Please reconnect.',
            reconnectAfter: 5000,
            reconnect: shutdownGuidance,
          }),
        );
        closePromises.push(
          new Promise((resolve) => {
            ws.close(1001, 'Server shutting down');
            ws.on('close', resolve);
            setTimeout(resolve, 5000);
          }),
        );
      }
    } catch {
      /* ignore already-closed sockets */
    }
  });

  // 4. Wait for client close promises + drain timeout
  const drainTimeout = setTimeout(() => {
    console.log(
      JSON.stringify({
        event: 'shutdown_drain_timeout',
        remaining: clients.size,
        timestamp: new Date().toISOString(),
      }),
    );
    wss.clients.forEach((ws) => {
      try {
        ws.terminate();
      } catch {
        /* noop */
      }
    });
  }, DRAIN_TIMEOUT_MS);

  await Promise.allSettled(closePromises);
  clearTimeout(drainTimeout);

  // 5. Force-terminate any remaining connections
  if (clients.size > 0) {
    console.log(
      JSON.stringify({
        event: 'shutdown_force_close',
        remaining: clients.size,
        timestamp: new Date().toISOString(),
      }),
    );
    wss.clients.forEach((ws) => {
      try {
        ws.terminate();
      } catch {
        /* noop */
      }
    });
  }

  // 6. Clean up Redis counters and connections
  if (redisPub) {
    try {
      const localCount = clientCount; // snapshot from before drain
      await Promise.allSettled([
        // Remove this instance's counter and adjust global total
        redisPub.del(REDIS_KEY_INSTANCE_CONNS(INSTANCE_ID)),
        redisPub.decrBy(REDIS_KEY_TOTAL_CONNS, Math.max(0, localCount)).catch(() => {}),
      ]);
    } catch {
      /* best effort */
    }
    await Promise.allSettled([redisPub.quit().catch(() => {}), redisSub.quit().catch(() => {})]);
  }

  console.log(
    JSON.stringify({
      event: 'shutdown_complete',
      timestamp: new Date().toISOString(),
    }),
  );
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
