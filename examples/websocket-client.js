/**
 * WebSocket Client Example v2.0
 * 
 * Demonstrates using the WebSocket server for real-time crypto data:
 * - News streaming
 * - Live price updates
 * - Whale alerts
 * - Fear & Greed sentiment
 * - Topic channels
 * - Custom alerts
 * 
 * Usage:
 *   npm install ws
 *   node websocket-client.js
 */

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'ws://localhost:8080';

class CryptoWebSocketClient {
  constructor(options = {}) {
    this.url = options.url || WS_URL;
    this.handlers = {
      connected: options.onConnected || (() => {}),
      news: options.onNews || (() => {}),
      breaking: options.onBreaking || (() => {}),
      topic: options.onTopic || (() => {}),
      prices: options.onPrices || (() => {}),
      whales: options.onWhales || (() => {}),
      sentiment: options.onSentiment || (() => {}),
      alert: options.onAlert || (() => {}),
      error: options.onError || console.error,
      close: options.onClose || (() => {}),
    };
    
    this.ws = null;
    this.clientId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.pingInterval = null;
  }

  connect() {
    console.log(`🔌 Connecting to ${this.url}...`);
    
    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Start ping interval
      this.pingInterval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    this.ws.on('close', (code, reason) => {
      console.log(`🔴 WebSocket closed (${code}): ${reason}`);
      clearInterval(this.pingInterval);
      this.handlers.close(code, reason);
      
      // Auto-reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms...`);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      this.handlers.error(error);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connected':
        this.clientId = message.payload.clientId;
        console.log(`📡 Client ID: ${this.clientId}`);
        console.log(`   Features: ${message.payload.features.join(', ')}`);
        console.log(`   Channels: ${message.payload.availableChannels.join(', ')}`);
        this.handlers.connected(message.payload);
        break;
        
      case 'news':
        this.handlers.news(message.payload.articles);
        break;
        
      case 'breaking':
        console.log('🚨 BREAKING NEWS!');
        this.handlers.breaking(message.payload.articles);
        break;
        
      case 'topic':
        console.log(`📺 [${message.payload.channelName}] ${message.payload.articles.length} articles`);
        this.handlers.topic(message.payload.channel, message.payload.articles);
        break;
        
      case 'prices':
        this.handlers.prices(message.payload.prices);
        break;
        
      case 'whales':
        console.log(`🐳 ${message.payload.alerts.length} whale alerts!`);
        this.handlers.whales(message.payload.alerts);
        break;
        
      case 'sentiment':
        console.log(`😱 Fear & Greed: ${message.payload.value} (${message.payload.classification})`);
        this.handlers.sentiment(message.payload);
        break;
        
      case 'alert':
        console.log(`🔔 Alert: ${message.data.name}`);
        this.handlers.alert(message.data);
        break;
        
      case 'subscribed':
        console.log('✅ Subscription updated:', message.payload.subscription);
        break;
        
      case 'channel_joined':
        console.log(`📺 Joined channel: ${message.payload.channel}`);
        break;
        
      case 'channel_left':
        console.log(`📺 Left channel: ${message.payload.channel}`);
        break;
        
      case 'prices_stream':
        console.log(`💰 Price streaming: ${message.payload.enabled ? 'enabled' : 'disabled'}`);
        break;
        
      case 'whales_stream':
        console.log(`🐳 Whale streaming: ${message.payload.enabled ? 'enabled' : 'disabled'}`);
        break;
        
      case 'sentiment_stream':
        console.log(`😱 Sentiment streaming: ${message.payload.enabled ? 'enabled' : 'disabled'}`);
        break;
        
      case 'rate_limited':
        console.warn('⚠️ Rate limited! Slow down.');
        break;
        
      case 'pong':
        // Keep-alive response
        break;
        
      case 'error':
        console.error('Server error:', message.payload.message);
        break;
        
      default:
        console.log('Unknown message:', message.type);
    }
  }

  // Subscribe to news with filters
  subscribe(filters = {}) {
    this.send('subscribe', filters);
  }

  // Unsubscribe from news
  unsubscribe(filters = {}) {
    this.send('unsubscribe', filters);
  }

  // Join a topic channel
  joinChannel(channel) {
    this.send('join_channel', { channel });
  }

  // Leave a topic channel
  leaveChannel(channel) {
    this.send('leave_channel', { channel });
  }

  // Enable/disable price streaming
  streamPrices(enabled = true) {
    this.send('stream_prices', { enabled });
  }

  // Enable/disable whale alerts
  streamWhales(enabled = true) {
    this.send('stream_whales', { enabled });
  }

  // Enable/disable sentiment updates
  streamSentiment(enabled = true) {
    this.send('stream_sentiment', { enabled });
  }

  // Subscribe to custom alerts
  subscribeAlerts(ruleIds = ['*']) {
    this.send('subscribe_alerts', { ruleIds });
  }

  // Unsubscribe from alerts
  unsubscribeAlerts(ruleIds = []) {
    this.send('unsubscribe_alerts', { ruleIds });
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  disconnect() {
    if (this.ws) {
      clearInterval(this.pingInterval);
      this.ws.close();
      this.ws = null;
    }
  }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

const client = new CryptoWebSocketClient({
  url: WS_URL,
  
  onConnected: (info) => {
    console.log('\n🎉 Ready to receive real-time data!\n');
    
    // Subscribe to news filters
    client.subscribe({
      sources: ['coindesk', 'theblock'],
      keywords: ['bitcoin', 'ETF'],
    });
    
    // Join topic channels
    client.joinChannel('bitcoin');
    client.joinChannel('defi');
    
    // Enable live data streams
    client.streamPrices(true);
    client.streamWhales(true);
    client.streamSentiment(true);
    
    // Subscribe to all alerts
    client.subscribeAlerts(['*']);
  },
  
  onNews: (articles) => {
    console.log(`\n📰 ${articles.length} new articles:`);
    articles.forEach(a => console.log(`   ${a.source}: ${a.title}`));
  },
  
  onBreaking: (articles) => {
    articles.forEach(a => {
      console.log(`\n🚨 BREAKING: ${a.title}`);
      console.log(`   Source: ${a.source}`);
      console.log(`   Link: ${a.link}`);
    });
  },
  
  onTopic: (channel, articles) => {
    console.log(`\n📺 [${channel.toUpperCase()}] ${articles.length} articles:`);
    articles.slice(0, 3).forEach(a => console.log(`   ${a.title}`));
  },
  
  onPrices: (prices) => {
    console.log('\n💰 Price Update:');
    for (const [coin, data] of Object.entries(prices)) {
      const change = data.usd_24h_change?.toFixed(2) || 0;
      const arrow = change >= 0 ? '📈' : '📉';
      console.log(`   ${arrow} ${coin.toUpperCase()}: $${data.usd?.toLocaleString()} (${change}%)`);
    }
  },
  
  onWhales: (alerts) => {
    alerts.forEach(whale => {
      console.log(`\n🐳 WHALE ALERT:`);
      console.log(`   ${whale.amount} ${whale.symbol} ($${(whale.usd_value / 1e6).toFixed(1)}M)`);
      console.log(`   From: ${whale.from} → To: ${whale.to}`);
    });
  },
  
  onSentiment: (sentiment) => {
    const emoji = sentiment.value >= 50 ? '😀' : '😰';
    console.log(`\n${emoji} Market Sentiment: ${sentiment.value}/100 (${sentiment.classification})`);
  },
  
  onAlert: (alert) => {
    console.log(`\n🔔 ALERT TRIGGERED: ${alert.name}`);
    console.log(`   Condition: ${alert.condition.type}`);
  },
  
  onError: (error) => {
    console.error('Error:', error.message);
  },
  
  onClose: () => {
    console.log('Connection closed');
  },
});

// Connect to WebSocket server
client.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  client.disconnect();
  process.exit(0);
});

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║     Free Crypto News WebSocket Client Example                    ║
╠══════════════════════════════════════════════════════════════════╣
║  Connecting to: ${WS_URL.padEnd(46)}║
║                                                                  ║
║  This example demonstrates:                                      ║
║    • Real-time news streaming                                    ║
║    • Live price updates                                          ║
║    • Whale transaction alerts                                    ║
║    • Fear & Greed sentiment                                      ║
║    • Topic channels (bitcoin, defi)                              ║
║                                                                  ║
║  Press Ctrl+C to exit                                            ║
╚══════════════════════════════════════════════════════════════════╝
`);
