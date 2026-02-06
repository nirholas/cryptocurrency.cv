# React Examples

Complete React component examples for building crypto news applications.

## Overview

| Example | File | Description |
|---------|------|-------------|
| Basic Usage | `basic.tsx` | News feed, search, sentiment |
| Market Data | `market-data.tsx` | Prices, charts, Fear & Greed |
| Portfolio | `portfolio.tsx` | Watchlist, alerts, tracking |
| Streaming | `streaming.tsx` | Real-time SSE updates |
| Trading | `trading.tsx` | Signals, orderbook, arbitrage |

## Installation

```bash
cd examples/react
npm install
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

---

## Basic Usage

News feed with search and sentiment display.

```tsx
import React, { useState, useEffect } from 'react';

const BASE_URL = 'https://cryptocurrency.cv';

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
}

// News Feed Component
export function NewsFeed({ limit = 10 }: { limit?: number }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/news?limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        setArticles(data.articles);
        setLoading(false);
      });
  }, [limit]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="news-feed">
      {articles.map((article, i) => (
        <article key={i} className="news-card">
          <h3>
            <a href={article.link} target="_blank" rel="noopener">
              {article.title}
            </a>
          </h3>
          <p>{article.source} • {article.timeAgo}</p>
        </article>
      ))}
    </div>
  );
}

// Search Component
export function NewsSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const response = await fetch(
      `${BASE_URL}/api/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setResults(data.articles);
    setLoading(false);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search crypto news..."
        onKeyPress={e => e.key === 'Enter' && search()}
      />
      <button onClick={search} disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
      <div>
        {results.map((article, i) => (
          <div key={i}>{article.title}</div>
        ))}
      </div>
    </div>
  );
}

// Sentiment Display
export function SentimentBadge({ asset = 'BTC' }: { asset?: string }) {
  const [sentiment, setSentiment] = useState<any>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/ai/sentiment?asset=${asset}`)
      .then(r => r.json())
      .then(setSentiment);
  }, [asset]);

  if (!sentiment) return null;

  const color = sentiment.label === 'bullish' ? 'green' 
    : sentiment.label === 'bearish' ? 'red' : 'gray';

  return (
    <span style={{ color, fontWeight: 'bold' }}>
      {sentiment.label.toUpperCase()} ({sentiment.score.toFixed(2)})
    </span>
  );
}
```

---

## Market Data

Live prices, charts, and Fear & Greed Index.

```tsx
import React, { useState, useEffect } from 'react';

const BASE_URL = 'https://cryptocurrency.cv';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
}

// Coin Prices Table
export function CoinPrices({ limit = 20 }: { limit?: number }) {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      const response = await fetch(`${BASE_URL}/api/market/coins?limit=${limit}`);
      const data = await response.json();
      setCoins(data.coins);
      setLoading(false);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [limit]);

  if (loading) return <div>Loading prices...</div>;

  return (
    <table className="coin-table">
      <thead>
        <tr>
          <th>Coin</th>
          <th>Price</th>
          <th>24h Change</th>
          <th>Market Cap</th>
        </tr>
      </thead>
      <tbody>
        {coins.map(coin => (
          <tr key={coin.id}>
            <td>{coin.symbol.toUpperCase()} - {coin.name}</td>
            <td>${coin.price.toLocaleString()}</td>
            <td style={{ color: coin.change24h >= 0 ? 'green' : 'red' }}>
              {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
            </td>
            <td>${(coin.marketCap / 1e9).toFixed(2)}B</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Fear & Greed Gauge
export function FearGreedGauge() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/fear-greed`)
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;

  const getColor = (value: number) => {
    if (value <= 25) return '#ef4444';
    if (value <= 45) return '#f97316';
    if (value <= 55) return '#eab308';
    if (value <= 75) return '#84cc16';
    return '#22c55e';
  };

  return (
    <div className="fear-greed-gauge">
      <h3>Fear & Greed Index</h3>
      <div 
        className="gauge-value"
        style={{ color: getColor(data.value) }}
      >
        {data.value}
      </div>
      <div className="gauge-label">{data.classification}</div>
      <div className="gauge-bar">
        <div 
          className="gauge-fill"
          style={{ 
            width: `${data.value}%`,
            backgroundColor: getColor(data.value)
          }}
        />
      </div>
    </div>
  );
}

// OHLC Chart Data
export function useOHLC(coinId: string, days: number = 30) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/market/ohlc/${coinId}?days=${days}`)
      .then(r => r.json())
      .then(response => {
        setData(response.ohlc);
        setLoading(false);
      });
  }, [coinId, days]);

  return { data, loading };
}
```

---

## Portfolio Tracking

Watchlist management with alerts.

```tsx
import React, { useState, useEffect, useCallback } from 'react';

const BASE_URL = 'https://cryptocurrency.cv';

interface WatchlistItem {
  symbol: string;
  addedAt: string;
  targetPrice?: number;
  notes?: string;
}

// Watchlist Component
export function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [newSymbol, setNewSymbol] = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/api/watchlist`)
      .then(r => r.json())
      .then(data => setItems(data.items || []));
  }, []);

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return;
    
    const response = await fetch(`${BASE_URL}/api/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: newSymbol.toUpperCase() })
    });
    
    if (response.ok) {
      const data = await response.json();
      setItems([...items, data.item]);
      setNewSymbol('');
    }
  };

  const removeFromWatchlist = async (symbol: string) => {
    await fetch(`${BASE_URL}/api/watchlist?symbol=${symbol}`, {
      method: 'DELETE'
    });
    setItems(items.filter(i => i.symbol !== symbol));
  };

  return (
    <div className="watchlist">
      <h2>My Watchlist</h2>
      <div className="add-form">
        <input
          type="text"
          value={newSymbol}
          onChange={e => setNewSymbol(e.target.value)}
          placeholder="Add symbol (e.g., BTC)"
        />
        <button onClick={addToWatchlist}>Add</button>
      </div>
      <ul>
        {items.map(item => (
          <li key={item.symbol}>
            <span>{item.symbol}</span>
            <button onClick={() => removeFromWatchlist(item.symbol)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Alert Manager
export function AlertManager() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    asset: 'BTC',
    type: 'price_above',
    value: ''
  });

  useEffect(() => {
    fetch(`${BASE_URL}/api/alerts`)
      .then(r => r.json())
      .then(data => setAlerts(data.alerts || []));
  }, []);

  const createAlert = async () => {
    const response = await fetch(`${BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asset: formData.asset,
        type: formData.type,
        value: parseFloat(formData.value)
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      setAlerts([...alerts, data.alert]);
      setFormData({ ...formData, value: '' });
    }
  };

  return (
    <div className="alert-manager">
      <h2>Price Alerts</h2>
      <div className="create-alert">
        <select 
          value={formData.asset}
          onChange={e => setFormData({ ...formData, asset: e.target.value })}
        >
          <option value="BTC">Bitcoin</option>
          <option value="ETH">Ethereum</option>
          <option value="SOL">Solana</option>
        </select>
        <select
          value={formData.type}
          onChange={e => setFormData({ ...formData, type: e.target.value })}
        >
          <option value="price_above">Price Above</option>
          <option value="price_below">Price Below</option>
        </select>
        <input
          type="number"
          value={formData.value}
          onChange={e => setFormData({ ...formData, value: e.target.value })}
          placeholder="Price"
        />
        <button onClick={createAlert}>Create Alert</button>
      </div>
      <ul>
        {alerts.map(alert => (
          <li key={alert.id}>
            {alert.asset} {alert.type}: ${alert.value}
            <span className={`status ${alert.triggered ? 'triggered' : 'active'}`}>
              {alert.triggered ? '✓ Triggered' : 'Active'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Real-Time Streaming

Server-Sent Events for live updates.

```tsx
import React, { useState, useEffect, useRef } from 'react';

const BASE_URL = 'https://cryptocurrency.cv';

interface StreamEvent {
  type: string;
  data: any;
  timestamp: string;
}

// Live News Stream
export function LiveNewsStream() {
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/api/sse`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
      console.log('Connected to news stream');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [{
        type: 'news',
        data,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 49)]); // Keep last 50
    };

    eventSource.onerror = () => {
      setConnected(false);
      console.log('Stream disconnected, reconnecting...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="live-stream">
      <div className="stream-header">
        <h2>Live News Stream</h2>
        <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      <div className="stream-events">
        {events.map((event, i) => (
          <div key={i} className="stream-event">
            <span className="timestamp">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span className="title">{event.data.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Real-Time Price Ticker
export function LivePriceTicker({ symbols = ['BTC', 'ETH', 'SOL'] }) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const eventSource = new EventSource(
      `${BASE_URL}/api/sse?type=prices&symbols=${symbols.join(',')}`
    );

    eventSource.addEventListener('price', (event) => {
      const data = JSON.parse(event.data);
      setPrices(prev => ({ ...prev, [data.symbol]: data.price }));
    });

    return () => eventSource.close();
  }, [symbols]);

  return (
    <div className="price-ticker">
      {symbols.map(symbol => (
        <div key={symbol} className="ticker-item">
          <span className="symbol">{symbol}</span>
          <span className="price">
            ${prices[symbol]?.toLocaleString() || '---'}
          </span>
        </div>
      ))}
    </div>
  );
}

// Custom Hook for SSE
export function useNewsStream(options?: { limit?: number }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const limit = options?.limit || 50;

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/api/sse`);

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setArticles(prev => [data, ...prev.slice(0, limit - 1)]);
    };

    return () => eventSource.close();
  }, [limit]);

  return { articles, connected };
}
```

---

## Trading Components

Signals, orderbook, and arbitrage opportunities.

```tsx
import React, { useState, useEffect } from 'react';

const BASE_URL = 'https://cryptocurrency.cv';

// Trading Signals
export function TradingSignals() {
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/signals`)
      .then(r => r.json())
      .then(data => setSignals(data.signals || []));
  }, []);

  return (
    <div className="trading-signals">
      <h2>Trading Signals</h2>
      {signals.map((signal, i) => (
        <div key={i} className={`signal ${signal.action}`}>
          <div className="signal-header">
            <span className="asset">{signal.asset}</span>
            <span className={`action ${signal.action}`}>
              {signal.action.toUpperCase()}
            </span>
          </div>
          <div className="signal-details">
            <span>Entry: ${signal.entry}</span>
            <span>Target: ${signal.target}</span>
            <span>Stop: ${signal.stopLoss}</span>
          </div>
          <div className="confidence">
            Confidence: {(signal.confidence * 100).toFixed(0)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// Orderbook Display
export function Orderbook({ pair = 'BTC/USDT' }: { pair?: string }) {
  const [orderbook, setOrderbook] = useState<any>(null);

  useEffect(() => {
    const fetchOrderbook = async () => {
      const response = await fetch(
        `${BASE_URL}/api/orderbook?pair=${encodeURIComponent(pair)}`
      );
      const data = await response.json();
      setOrderbook(data);
    };

    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, 1000);
    return () => clearInterval(interval);
  }, [pair]);

  if (!orderbook) return <div>Loading orderbook...</div>;

  return (
    <div className="orderbook">
      <h3>{pair} Orderbook</h3>
      <div className="orderbook-sides">
        <div className="bids">
          <h4>Bids</h4>
          {orderbook.bids?.slice(0, 10).map((bid: any, i: number) => (
            <div key={i} className="order bid">
              <span>${bid[0]}</span>
              <span>{bid[1]}</span>
            </div>
          ))}
        </div>
        <div className="asks">
          <h4>Asks</h4>
          {orderbook.asks?.slice(0, 10).map((ask: any, i: number) => (
            <div key={i} className="order ask">
              <span>${ask[0]}</span>
              <span>{ask[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Arbitrage Opportunities
export function ArbitrageOpportunities() {
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/arbitrage`)
      .then(r => r.json())
      .then(data => setOpportunities(data.opportunities || []));
  }, []);

  return (
    <div className="arbitrage">
      <h2>Arbitrage Opportunities</h2>
      {opportunities.map((opp, i) => (
        <div key={i} className="arb-opportunity">
          <div className="pair">{opp.pair}</div>
          <div className="exchanges">
            <span className="buy">
              Buy @ {opp.buyExchange}: ${opp.buyPrice}
            </span>
            <span className="sell">
              Sell @ {opp.sellExchange}: ${opp.sellPrice}
            </span>
          </div>
          <div className="profit">
            Profit: {opp.profitPercent.toFixed(2)}%
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Usage

Import components into your React application:

```tsx
import { 
  NewsFeed, 
  NewsSearch, 
  SentimentBadge,
  CoinPrices,
  FearGreedGauge,
  Watchlist,
  LiveNewsStream,
  TradingSignals
} from './examples/react';

function App() {
  return (
    <div>
      <FearGreedGauge />
      <SentimentBadge asset="BTC" />
      <LiveNewsStream />
      <CoinPrices limit={10} />
      <NewsFeed limit={20} />
      <TradingSignals />
    </div>
  );
}
```

---

## Related

- [React SDK](../sdks/react.md)
- [React Hooks Documentation](../HOOKS.md)
- [Real-Time API](../REALTIME.md)
