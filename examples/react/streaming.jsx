/**
 * Real-Time Streaming React Examples
 * 
 * WebSocket connections for live news, prices, and alerts.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  useNewsStream,
  usePriceStream,
  useWhaleStream,
  useCombinedStream,
  StreamStatus,
} from '@nirholas/react-crypto-news';

// ═══════════════════════════════════════════════════════════════
// Live News Stream
// ═══════════════════════════════════════════════════════════════

/**
 * Real-time news feed
 */
export function LiveNewsFeed() {
  const { 
    articles, 
    status, 
    connect, 
    disconnect,
    error 
  } = useNewsStream({
    maxItems: 50,
    onNewArticle: (article) => {
      // Optional: Play notification sound
      // playNotificationSound();
    },
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">📰 Live News</h2>
          <StreamStatusBadge status={status} />
        </div>
        
        <div className="flex gap-2">
          {status === 'disconnected' ? (
            <button 
              onClick={connect}
              className="px-3 py-1 bg-green-600 rounded hover:bg-green-700"
            >
              Connect
            </button>
          ) : (
            <button 
              onClick={disconnect}
              className="px-3 py-1 bg-red-600 rounded hover:bg-red-700"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 text-sm">
          {error.message}
        </div>
      )}

      <div className="divide-y max-h-[600px] overflow-y-auto">
        {articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {status === 'connected' 
              ? 'Waiting for news...' 
              : 'Connect to start receiving live news'}
          </div>
        ) : (
          articles.map((article, i) => (
            <NewsItem 
              key={article.id || i} 
              article={article} 
              isNew={i === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NewsItem({ article, isNew }: { article: any; isNew: boolean }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`block p-4 hover:bg-gray-50 transition-all ${
        isNew ? 'animate-highlight bg-yellow-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded shrink-0">
          {article.source}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {article.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span>{article.timeAgo || 'Just now'}</span>
            {article.tickers?.length > 0 && (
              <>
                <span>•</span>
                <span className="text-blue-600">
                  ${article.tickers.slice(0, 3).join(', $')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════
// Live Price Ticker
// ═══════════════════════════════════════════════════════════════

/**
 * Real-time price updates
 */
export function LivePriceTicker() {
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK'];
  
  const { prices, status } = usePriceStream({
    symbols,
    onPriceUpdate: (update) => {
      // Flash effect handled in component
    },
  });

  return (
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">💹 Live Prices</h2>
        <StreamStatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-700">
        {symbols.map((symbol) => {
          const price = prices[symbol];
          return (
            <PriceCell 
              key={symbol} 
              symbol={symbol} 
              price={price?.current}
              change={price?.change24h}
              flash={price?.flash}
            />
          );
        })}
      </div>
    </div>
  );
}

function PriceCell({ symbol, price, change, flash }: {
  symbol: string;
  price?: number;
  change?: number;
  flash?: 'up' | 'down';
}) {
  return (
    <div className={`bg-gray-800 p-4 transition-colors duration-300 ${
      flash === 'up' ? 'bg-green-900/50' :
      flash === 'down' ? 'bg-red-900/50' : ''
    }`}>
      <div className="text-gray-400 text-sm">{symbol}</div>
      <div className="text-xl font-mono font-bold">
        {price ? `$${price.toLocaleString(undefined, { 
          minimumFractionDigits: 2,
          maximumFractionDigits: price < 1 ? 6 : 2 
        })}` : '—'}
      </div>
      {change !== undefined && (
        <div className={`text-sm ${
          change >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Live Whale Alerts
// ═══════════════════════════════════════════════════════════════

/**
 * Real-time whale transaction alerts
 */
export function LiveWhaleAlerts() {
  const { alerts, status } = useWhaleStream({
    minValue: 1000000, // Min $1M transactions
    maxItems: 30,
    onNewAlert: (alert) => {
      // Optional: Desktop notification
      if (Notification.permission === 'granted' && alert.usdValue >= 10000000) {
        new Notification(`🐋 ${alert.symbol} Whale Alert`, {
          body: `${formatUsd(alert.usdValue)} moved from ${alert.fromLabel} to ${alert.toLabel}`,
        });
      }
    },
  });

  const requestNotifications = () => {
    Notification.requestPermission();
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">🐋 Whale Watch</h2>
          <StreamStatusBadge status={status} />
        </div>
        
        {Notification.permission === 'default' && (
          <button 
            onClick={requestNotifications}
            className="text-sm bg-blue-600 px-3 py-1 rounded"
          >
            Enable Alerts
          </button>
        )}
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Waiting for whale movements...
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {alerts.map((alert, i) => (
              <WhaleAlertRow key={alert.id || i} alert={alert} isNew={i === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WhaleAlertRow({ alert, isNew }: { alert: any; isNew: boolean }) {
  const icon = alert.type === 'exchange_inflow' ? '📥' :
               alert.type === 'exchange_outflow' ? '📤' : '🔄';
  
  const sizeClass = alert.usdValue >= 100000000 ? 'text-yellow-400' :
                    alert.usdValue >= 10000000 ? 'text-orange-400' : '';

  return (
    <div className={`p-4 transition-all ${
      isNew ? 'animate-slide-in bg-blue-900/30' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <div className={`font-bold ${sizeClass}`}>
              {alert.symbol} • {formatUsd(alert.usdValue)}
            </div>
            <div className="text-sm text-gray-400">
              {formatAmount(alert.amount)} {alert.symbol}
            </div>
          </div>
        </div>
        
        <div className="text-right text-sm">
          <div className="text-gray-300">{alert.fromLabel}</div>
          <div className="text-gray-500">↓</div>
          <div className="text-gray-300">{alert.toLabel}</div>
        </div>
      </div>
      
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <span>{alert.blockchain}</span>
        <span>•</span>
        <span>{alert.timeAgo || 'Just now'}</span>
        {alert.txHash && (
          <>
            <span>•</span>
            <a 
              href={`https://etherscan.io/tx/${alert.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              View TX
            </a>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Combined Stream Dashboard
// ═══════════════════════════════════════════════════════════════

/**
 * All-in-one streaming dashboard
 */
export function CombinedStreamDashboard() {
  const [filter, setFilter] = useState<'all' | 'news' | 'prices' | 'whales'>('all');
  
  const { events, status, connect, disconnect } = useCombinedStream({
    maxItems: 100,
    subscriptions: ['news', 'prices', 'whales', 'liquidations'],
  });

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter.slice(0, -1); // Remove 's' from filter
  });

  return (
    <div className="bg-gray-900 text-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">🔴 Live Feed</h2>
            <StreamStatusBadge status={status} />
          </div>
          
          <button 
            onClick={status === 'connected' ? disconnect : connect}
            className={`px-4 py-2 rounded font-medium ${
              status === 'connected' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {status === 'connected' ? 'Disconnect' : 'Connect'}
          </button>
        </div>

        <div className="flex gap-2">
          {(['all', 'news', 'prices', 'whales'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm ${
                filter === f 
                  ? 'bg-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-700">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {status === 'connected' 
              ? 'Waiting for events...' 
              : 'Connect to start receiving live updates'}
          </div>
        ) : (
          filteredEvents.map((event, i) => (
            <EventRow key={event.id || i} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const icons = {
    news: '📰',
    price: '💹',
    whale: '🐋',
    liquidation: '💥',
    signal: '📊',
  };

  const colors = {
    news: 'bg-blue-500/20',
    price: 'bg-green-500/20',
    whale: 'bg-purple-500/20',
    liquidation: 'bg-red-500/20',
    signal: 'bg-yellow-500/20',
  };

  return (
    <div className={`p-4 ${colors[event.type as keyof typeof colors] || ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[event.type as keyof typeof icons] || '📌'}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium line-clamp-1">{event.title || event.summary}</div>
          <div className="text-sm text-gray-400">
            {event.type} • {event.timeAgo || 'Just now'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════

function StreamStatusBadge({ status }: { status: StreamStatus }) {
  const config = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Live' },
    disconnected: { color: 'bg-gray-500', text: 'Offline' },
    error: { color: 'bg-red-500', text: 'Error' },
  };

  const { color, text } = config[status];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${color} ${
        status === 'connected' ? 'animate-pulse' : ''
      }`} />
      <span className="text-gray-400">{text}</span>
    </div>
  );
}

function formatAmount(amount: number): string {
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(2)}M`;
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K`;
  return amount.toFixed(2);
}

function formatUsd(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════
// Styles (add to your CSS)
// ═══════════════════════════════════════════════════════════════

const styles = `
@keyframes highlight {
  from { background-color: rgb(254 240 138); }
  to { background-color: transparent; }
}

@keyframes slide-in {
  from { 
    opacity: 0;
    transform: translateX(-20px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-highlight {
  animation: highlight 2s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
`;

// ═══════════════════════════════════════════════════════════════
// Full App
// ═══════════════════════════════════════════════════════════════

export default function StreamingApp() {
  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <style>{styles}</style>
      
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">
          🔴 Real-Time Crypto Streaming
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveNewsFeed />
          <div className="space-y-6">
            <LivePriceTicker />
            <LiveWhaleAlerts />
          </div>
        </div>

        <div className="mt-8">
          <CombinedStreamDashboard />
        </div>
      </div>
    </div>
  );
}
