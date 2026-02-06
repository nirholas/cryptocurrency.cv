/**
 * Real-Time News Stream Example
 * 
 * Demonstrates using Server-Sent Events (SSE) to get real-time crypto news updates.
 * Works in browser and Node.js (with eventsource package).
 */

// For Node.js, install: npm install eventsource
// const EventSource = require('eventsource');

const API_URL = 'https://cryptocurrency.cv';

class CryptoNewsStream {
  constructor(options = {}) {
    this.onNews = options.onNews || (() => {});
    this.onBreaking = options.onBreaking || (() => {});
    this.onPrice = options.onPrice || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onError = options.onError || console.error;
    
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  connect() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    console.log('Connecting to real-time news stream...');
    this.eventSource = new EventSource(`${API_URL}/api/sse`);

    // Connection established
    this.eventSource.addEventListener('connected', (event) => {
      console.log('✅ Connected to news stream');
      this.reconnectAttempts = 0;
      this.onConnect(JSON.parse(event.data));
    });

    // Regular news updates
    this.eventSource.addEventListener('news', (event) => {
      const data = JSON.parse(event.data);
      console.log(`📰 ${data.articles.length} new articles`);
      this.onNews(data.articles);
    });

    // Breaking news alerts
    this.eventSource.addEventListener('breaking', (event) => {
      const article = JSON.parse(event.data);
      console.log(`🚨 BREAKING: ${article.title}`);
      this.onBreaking(article);
    });

    // Price updates
    this.eventSource.addEventListener('price', (event) => {
      const prices = JSON.parse(event.data);
      this.onPrice(prices);
    });

    // Heartbeat (keep-alive)
    this.eventSource.addEventListener('heartbeat', () => {
      // Connection is alive
    });

    // Handle errors
    this.eventSource.onerror = (error) => {
      console.error('❌ Stream error:', error);
      this.onError(error);
      this.onDisconnect();

      // Auto-reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`Reconnecting in ${delay}ms...`);
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log('Disconnected from news stream');
    }
  }
}

// Example usage
const stream = new CryptoNewsStream({
  onNews: (articles) => {
    articles.forEach(article => {
      console.log(`  - ${article.source}: ${article.title}`);
    });
  },
  
  onBreaking: (article) => {
    // In a real app, show a notification
    console.log(`\n🚨🚨🚨 BREAKING NEWS 🚨🚨🚨`);
    console.log(`Title: ${article.title}`);
    console.log(`Source: ${article.source}`);
    console.log(`Link: ${article.link}\n`);
  },
  
  onPrice: (prices) => {
    console.log('Price update:', prices);
  },
  
  onConnect: (data) => {
    console.log('Stream info:', data);
  },
  
  onDisconnect: () => {
    console.log('Stream disconnected');
  },
  
  onError: (error) => {
    // Handle error (log, show UI message, etc.)
  }
});

// Start streaming
stream.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  stream.disconnect();
  process.exit(0);
});

// Keep the process running
console.log('Listening for real-time crypto news updates...');
console.log('Press Ctrl+C to stop.\n');
