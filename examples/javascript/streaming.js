/**
 * Real-time Streaming Examples - JavaScript/Node.js
 * Free Crypto News API - https://github.com/nirholas/free-crypto-news
 * 
 * Examples for WebSocket and Server-Sent Events (SSE) streaming.
 */

const WebSocket = require('ws');
const EventSource = require('eventsource');

const BASE_URL = 'https://cryptocurrency.cv';
const WS_URL = 'wss://cryptocurrency.cv';

// =============================================================================
// WebSocket - Real-time News Stream
// =============================================================================

/**
 * Connect to real-time news WebSocket stream.
 * @param {Object} options - Connection options
 * @param {Function} options.onMessage - Message handler
 * @param {Function} [options.onError] - Error handler
 * @param {Function} [options.onClose] - Close handler
 * @param {string[]} [options.categories] - Filter by categories
 * @returns {WebSocket} WebSocket connection
 */
function connectNewsStream({ onMessage, onError, onClose, categories } = {}) {
  const ws = new WebSocket(`${WS_URL}/api/stream/news`);
  
  ws.on('open', () => {
    console.log('📡 Connected to news stream');
    
    // Subscribe to specific categories if provided
    if (categories && categories.length > 0) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        categories: categories
      }));
    }
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (onMessage) onMessage(message);
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  });
  
  ws.on('close', () => {
    console.log('🔌 Disconnected from news stream');
    if (onClose) onClose();
  });
  
  return ws;
}

// =============================================================================
// WebSocket - Market Data Stream
// =============================================================================

/**
 * Connect to real-time market data stream.
 * @param {Object} options - Connection options
 * @param {string[]} options.symbols - Symbols to subscribe to
 * @param {Function} options.onTick - Tick handler
 * @returns {WebSocket} WebSocket connection
 */
function connectMarketStream({ symbols, onTick } = {}) {
  const ws = new WebSocket(`${WS_URL}/api/stream/market`);
  
  ws.on('open', () => {
    console.log('📈 Connected to market stream');
    
    // Subscribe to symbols
    if (symbols && symbols.length > 0) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        symbols: symbols
      }));
    }
  });
  
  ws.on('message', (data) => {
    try {
      const tick = JSON.parse(data);
      if (onTick) onTick(tick);
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
  
  ws.on('error', console.error);
  
  return ws;
}

// =============================================================================
// WebSocket - Whale Alerts Stream
// =============================================================================

/**
 * Connect to real-time whale alerts stream.
 * @param {Object} options - Connection options
 * @param {number} [options.minValue=1000000] - Minimum transaction value
 * @param {Function} options.onAlert - Alert handler
 * @returns {WebSocket} WebSocket connection
 */
function connectWhaleStream({ minValue = 1000000, onAlert } = {}) {
  const ws = new WebSocket(`${WS_URL}/api/stream/whales`);
  
  ws.on('open', () => {
    console.log('🐋 Connected to whale alerts stream');
    
    ws.send(JSON.stringify({
      type: 'config',
      minValue: minValue
    }));
  });
  
  ws.on('message', (data) => {
    try {
      const alert = JSON.parse(data);
      if (onAlert) onAlert(alert);
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
  
  return ws;
}

// =============================================================================
// WebSocket - Sentiment Stream
// =============================================================================

/**
 * Connect to real-time sentiment updates stream.
 * @param {Object} options - Connection options
 * @param {string[]} [options.assets] - Assets to track
 * @param {Function} options.onUpdate - Update handler
 * @returns {WebSocket} WebSocket connection
 */
function connectSentimentStream({ assets, onUpdate } = {}) {
  const ws = new WebSocket(`${WS_URL}/api/stream/sentiment`);
  
  ws.on('open', () => {
    console.log('😊 Connected to sentiment stream');
    
    if (assets && assets.length > 0) {
      ws.send(JSON.stringify({
        type: 'subscribe',
        assets: assets
      }));
    }
  });
  
  ws.on('message', (data) => {
    try {
      const update = JSON.parse(data);
      if (onUpdate) onUpdate(update);
    } catch (e) {
      console.error('Parse error:', e);
    }
  });
  
  return ws;
}

// =============================================================================
// SSE - Server-Sent Events for News
// =============================================================================

/**
 * Connect to SSE news stream.
 * @param {Object} options - Connection options
 * @param {string} [options.category] - Filter by category
 * @param {Function} options.onNews - News handler
 * @returns {EventSource} EventSource connection
 */
function connectNewsSSE({ category, onNews } = {}) {
  const params = category ? `?category=${category}` : '';
  const es = new EventSource(`${BASE_URL}/api/sse/news${params}`);
  
  es.onopen = () => {
    console.log('📡 SSE Connected to news stream');
  };
  
  es.onmessage = (event) => {
    try {
      const news = JSON.parse(event.data);
      if (onNews) onNews(news);
    } catch (e) {
      console.error('Parse error:', e);
    }
  };
  
  es.onerror = (error) => {
    console.error('SSE Error:', error);
  };
  
  return es;
}

// =============================================================================
// SSE - Order Book Stream
// =============================================================================

/**
 * Connect to SSE order book stream.
 * @param {string} symbol - Trading pair
 * @param {Function} onUpdate - Update handler
 * @returns {EventSource} EventSource connection
 */
function connectOrderbookSSE(symbol = 'BTCUSDT', onUpdate) {
  const es = new EventSource(`${BASE_URL}/api/orderbook/stream?symbol=${symbol}`);
  
  es.onmessage = (event) => {
    try {
      const update = JSON.parse(event.data);
      if (onUpdate) onUpdate(update);
    } catch (e) {
      console.error('Parse error:', e);
    }
  };
  
  return es;
}

// =============================================================================
// SSE - Breaking News Stream
// =============================================================================

/**
 * Connect to SSE breaking news stream.
 * @param {Function} onBreaking - Breaking news handler
 * @returns {EventSource} EventSource connection
 */
function connectBreakingSSE(onBreaking) {
  const es = new EventSource(`${BASE_URL}/api/sse/breaking`);
  
  es.onmessage = (event) => {
    try {
      const breaking = JSON.parse(event.data);
      if (onBreaking) onBreaking(breaking);
    } catch (e) {
      console.error('Parse error:', e);
    }
  };
  
  return es;
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // WebSocket streams
  connectNewsStream,
  connectMarketStream,
  connectWhaleStream,
  connectSentimentStream,
  
  // SSE streams
  connectNewsSSE,
  connectOrderbookSSE,
  connectBreakingSSE,
  
  BASE_URL,
  WS_URL
};

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function runExamples() {
  console.log('\n' + '='.repeat(60));
  console.log('FREE CRYPTO NEWS API - STREAMING EXAMPLES');
  console.log('='.repeat(60));
  
  // Example 1: News Stream
  console.log('\n📰 1. Real-time News Stream (5 seconds)');
  const newsWs = connectNewsStream({
    categories: ['bitcoin', 'ethereum'],
    onMessage: (news) => {
      console.log(`   New article: ${news.title?.substring(0, 50)}...`);
    }
  });
  
  // Example 2: Market Stream
  console.log('\n📈 2. Market Data Stream (5 seconds)');
  const marketWs = connectMarketStream({
    symbols: ['BTC', 'ETH', 'SOL'],
    onTick: (tick) => {
      console.log(`   ${tick.symbol}: $${tick.price}`);
    }
  });
  
  // Example 3: Whale Alerts
  console.log('\n🐋 3. Whale Alerts Stream (5 seconds)');
  const whaleWs = connectWhaleStream({
    minValue: 5000000,
    onAlert: (alert) => {
      console.log(`   Whale: ${alert.amount} ${alert.asset} ($${alert.value})`);
    }
  });
  
  // Close after 5 seconds
  setTimeout(() => {
    console.log('\n🔌 Closing connections...');
    newsWs.close();
    marketWs.close();
    whaleWs.close();
    
    console.log('\n' + '='.repeat(60));
    console.log('Streaming examples completed!');
    console.log('='.repeat(60));
    process.exit(0);
  }, 5000);
}

if (require.main === module) {
  runExamples().catch(console.error);
}

// =============================================================================
// ADVANCED EXAMPLES
// =============================================================================

/**
 * Example: Trading Bot with Real-time Data
 */
class TradingBot {
  constructor(config) {
    this.config = config;
    this.streams = {};
  }
  
  start() {
    // Connect to market data
    this.streams.market = connectMarketStream({
      symbols: this.config.symbols,
      onTick: this.handleTick.bind(this)
    });
    
    // Connect to news for sentiment
    this.streams.news = connectNewsStream({
      categories: this.config.categories,
      onMessage: this.handleNews.bind(this)
    });
    
    // Connect to whale alerts
    this.streams.whales = connectWhaleStream({
      minValue: this.config.minWhaleValue,
      onAlert: this.handleWhaleAlert.bind(this)
    });
    
    console.log('🤖 Trading bot started');
  }
  
  handleTick(tick) {
    // Implement your trading logic
    console.log(`Tick: ${tick.symbol} = $${tick.price}`);
  }
  
  handleNews(news) {
    // React to news
    console.log(`News: ${news.title?.substring(0, 50)}`);
  }
  
  handleWhaleAlert(alert) {
    // React to whale movements
    console.log(`🐋 Whale Alert: ${alert.amount} ${alert.asset}`);
  }
  
  stop() {
    Object.values(this.streams).forEach(stream => stream.close());
    console.log('🤖 Trading bot stopped');
  }
}

/**
 * Example: News Aggregator with SSE
 */
function createNewsAggregator(categories, onArticle) {
  const streams = {};
  
  categories.forEach(category => {
    streams[category] = connectNewsSSE({
      category,
      onNews: (article) => {
        onArticle({ category, article });
      }
    });
  });
  
  return {
    streams,
    close: () => {
      Object.values(streams).forEach(stream => stream.close());
    }
  };
}

module.exports.TradingBot = TradingBot;
module.exports.createNewsAggregator = createNewsAggregator;
