/**
 * WebSocket Server for Real-time News Updates
 * 
 * Provides live news push to connected clients.
 * Compatible with Vercel Edge, Node.js, and standalone deployment.
 */

// Types
export interface WSMessage {
  type: 'news' | 'breaking' | 'price' | 'alert' | 'ping' | 'subscribe' | 'unsubscribe';
  payload: unknown;
  timestamp: string;
}

export interface NewsUpdate {
  id: string;
  title: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  isBreaking?: boolean;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

export interface Subscription {
  sources: string[];
  categories: string[];
  keywords: string[];
  coins: string[];
}

// Client management
const clients = new Map<string, {
  ws: WebSocket;
  subscription: Subscription;
  lastPing: number;
}>();

// Generate unique client ID
function generateClientId(): string {
  return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default subscription
const defaultSubscription: Subscription = {
  sources: [],
  categories: [],
  keywords: [],
  coins: [],
};

/**
 * Handle new WebSocket connection
 */
export function handleConnection(ws: WebSocket): string {
  const clientId = generateClientId();
  
  clients.set(clientId, {
    ws,
    subscription: { ...defaultSubscription },
    lastPing: Date.now(),
  });

  // Send welcome message
  sendToClient(clientId, {
    type: 'ping',
    payload: { 
      clientId,
      message: 'Connected to Free Crypto News WebSocket',
      serverTime: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });

  return clientId;
}

/**
 * Handle client disconnection
 */
export function handleDisconnection(clientId: string): void {
  clients.delete(clientId);
}

/**
 * Handle incoming message from client
 */
export function handleMessage(clientId: string, message: string): void {
  try {
    const parsed: WSMessage = JSON.parse(message);
    const client = clients.get(clientId);
    
    if (!client) return;

    switch (parsed.type) {
      case 'subscribe':
        handleSubscribe(clientId, parsed.payload as Partial<Subscription>);
        break;
      case 'unsubscribe':
        handleUnsubscribe(clientId, parsed.payload as Partial<Subscription>);
        break;
      case 'ping':
        client.lastPing = Date.now();
        sendToClient(clientId, {
          type: 'ping',
          payload: { pong: true },
          timestamp: new Date().toISOString(),
        });
        break;
    }
  } catch (error) {
    console.error('WebSocket message parse error:', error);
  }
}

/**
 * Handle subscription request
 */
function handleSubscribe(clientId: string, sub: Partial<Subscription>): void {
  const client = clients.get(clientId);
  if (!client) return;

  if (sub.sources) {
    client.subscription.sources = [...new Set([...client.subscription.sources, ...sub.sources])];
  }
  if (sub.categories) {
    client.subscription.categories = [...new Set([...client.subscription.categories, ...sub.categories])];
  }
  if (sub.keywords) {
    client.subscription.keywords = [...new Set([...client.subscription.keywords, ...sub.keywords])];
  }
  if (sub.coins) {
    client.subscription.coins = [...new Set([...client.subscription.coins, ...sub.coins])];
  }

  sendToClient(clientId, {
    type: 'subscribe',
    payload: { success: true, subscription: client.subscription },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle unsubscribe request
 */
function handleUnsubscribe(clientId: string, sub: Partial<Subscription>): void {
  const client = clients.get(clientId);
  if (!client) return;

  if (sub.sources) {
    client.subscription.sources = client.subscription.sources.filter(s => !sub.sources!.includes(s));
  }
  if (sub.categories) {
    client.subscription.categories = client.subscription.categories.filter(c => !sub.categories!.includes(c));
  }
  if (sub.keywords) {
    client.subscription.keywords = client.subscription.keywords.filter(k => !sub.keywords!.includes(k));
  }
  if (sub.coins) {
    client.subscription.coins = client.subscription.coins.filter(c => !sub.coins!.includes(c));
  }

  sendToClient(clientId, {
    type: 'unsubscribe',
    payload: { success: true, subscription: client.subscription },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send message to specific client
 */
export function sendToClient(clientId: string, message: WSMessage): void {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

/**
 * Broadcast news update to relevant subscribers
 */
export function broadcastNews(news: NewsUpdate): void {
  const message: WSMessage = {
    type: news.isBreaking ? 'breaking' : 'news',
    payload: news,
    timestamp: new Date().toISOString(),
  };

  clients.forEach((client, clientId) => {
    const sub = client.subscription;
    const shouldSend = 
      sub.sources.length === 0 || sub.sources.includes(news.source.toLowerCase()) ||
      sub.categories.length === 0 || sub.categories.includes(news.category) ||
      sub.keywords.some(kw => news.title.toLowerCase().includes(kw.toLowerCase()));

    if (shouldSend && client.ws.readyState === WebSocket.OPEN) {
      sendToClient(clientId, message);
    }
  });
}

/**
 * Broadcast price update to relevant subscribers
 */
export function broadcastPrice(price: PriceUpdate): void {
  const message: WSMessage = {
    type: 'price',
    payload: price,
    timestamp: new Date().toISOString(),
  };

  clients.forEach((client, clientId) => {
    const sub = client.subscription;
    if (sub.coins.length === 0 || sub.coins.includes(price.symbol.toLowerCase())) {
      if (client.ws.readyState === WebSocket.OPEN) {
        sendToClient(clientId, message);
      }
    }
  });
}

/**
 * Broadcast alert to specific client
 */
export function broadcastAlert(clientId: string, alert: { type: string; message: string; data?: unknown }): void {
  sendToClient(clientId, {
    type: 'alert',
    payload: alert,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get connection stats
 */
export function getStats(): { 
  totalConnections: number; 
  activeConnections: number;
  subscriptions: { sources: number; categories: number; keywords: number; coins: number };
} {
  let activeConnections = 0;
  const subscriptions = { sources: 0, categories: 0, keywords: 0, coins: 0 };

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      activeConnections++;
      subscriptions.sources += client.subscription.sources.length;
      subscriptions.categories += client.subscription.categories.length;
      subscriptions.keywords += client.subscription.keywords.length;
      subscriptions.coins += client.subscription.coins.length;
    }
  });

  return {
    totalConnections: clients.size,
    activeConnections,
    subscriptions,
  };
}

/**
 * Clean up stale connections (call periodically)
 */
export function cleanupStaleConnections(maxIdleMs = 5 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;

  clients.forEach((client, clientId) => {
    if (now - client.lastPing > maxIdleMs || client.ws.readyState !== WebSocket.OPEN) {
      clients.delete(clientId);
      cleaned++;
    }
  });

  return cleaned;
}

// Export client count for monitoring
export function getClientCount(): number {
  return clients.size;
}
