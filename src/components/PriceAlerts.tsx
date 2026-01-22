'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Bell, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface PriceAlert {
  id: string;
  coin: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: Date;
  triggered: boolean;
}

interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
];

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [currentPrices, setCurrentPrices] = useState<PriceData>({});
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([]);
  const checkInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('crypto-price-alerts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.map((a: PriceAlert) => ({ ...a, createdAt: new Date(a.createdAt) })));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('crypto-price-alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Fetch prices and check alerts
  useEffect(() => {
    const checkPrices = async () => {
      if (alerts.filter(a => !a.triggered).length === 0) return;
      
      try {
        const coinIds = [...new Set(alerts.map(a => a.coin))].join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
        );
        const data: PriceData = await response.json();
        setCurrentPrices(data);
        
        // Check alerts
        const newTriggered: PriceAlert[] = [];
        const updatedAlerts = alerts.map(alert => {
          if (alert.triggered) return alert;
          
          const price = data[alert.coin]?.usd;
          if (!price) return alert;
          
          const shouldTrigger = alert.direction === 'above' 
            ? price >= alert.targetPrice
            : price <= alert.targetPrice;
          
          if (shouldTrigger) {
            const triggered = { ...alert, triggered: true };
            newTriggered.push(triggered);
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`🚨 Price Alert: ${alert.symbol}`, {
                body: `${alert.symbol} is now ${alert.direction} $${alert.targetPrice.toLocaleString()} (Current: $${price.toLocaleString()})`,
                icon: '/icons/icon-192x192.png',
              });
            }
            
            return triggered;
          }
          
          return alert;
        });
        
        if (newTriggered.length > 0) {
          setAlerts(updatedAlerts);
          setTriggeredAlerts(prev => [...prev, ...newTriggered]);
        }
      } catch (error) {
        console.error('Failed to check prices:', error);
      }
    };

    checkPrices();
    checkInterval.current = setInterval(checkPrices, 30000); // Check every 30 seconds

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [alerts]);

  const addAlert = () => {
    if (!targetPrice || isNaN(parseFloat(targetPrice))) return;
    
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      coin: selectedCoin.id,
      symbol: selectedCoin.symbol,
      targetPrice: parseFloat(targetPrice),
      direction,
      createdAt: new Date(),
      triggered: false,
    };
    
    setAlerts(prev => [...prev, newAlert]);
    setTargetPrice('');
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const dismissTriggered = (id: string) => {
    setTriggeredAlerts(prev => prev.filter(a => a.id !== id));
  };

  const activeAlerts = alerts.filter(a => !a.triggered);

  return (
    <>
      {/* Alert Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        aria-label="Price Alerts"
        title="Price Alerts"
      >
        <Bell className="w-5 h-5" />
        {activeAlerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
            {activeAlerts.length}
          </span>
        )}
      </button>

      {/* Triggered Alert Toasts */}
      {triggeredAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slideUp z-50"
          style={{ bottom: `${1 + index * 4.5}rem` }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <div className="font-medium">
                {alert.symbol} {alert.direction === 'above' ? '↑' : '↓'} ${alert.targetPrice.toLocaleString()}
              </div>
              <div className="text-sm text-amber-100">
                Alert triggered!
              </div>
            </div>
            <button
              onClick={() => dismissTriggered(alert.id)}
              className="ml-2 p-1 hover:bg-amber-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Price Alerts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Add Alert Form */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Create Alert</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedCoin.id}
                    onChange={(e) => setSelectedCoin(COINS.find(c => c.id === e.target.value) || COINS[0])}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  >
                    {COINS.map(coin => (
                      <option key={coin.id} value={coin.id}>
                        {coin.symbol} - {coin.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as 'above' | 'below')}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  >
                    <option value="above">Goes above</option>
                    <option value="below">Goes below</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="Target price"
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={addAlert}
                    disabled={!targetPrice}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {currentPrices[selectedCoin.id] && (
                  <div className="text-xs text-gray-500">
                    Current price: ${currentPrices[selectedCoin.id].usd.toLocaleString()}
                  </div>
                )}
              </div>

              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Active Alerts</h3>
                  {activeAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {alert.direction === 'above' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium text-sm">
                            {alert.symbol} {alert.direction} ${alert.targetPrice.toLocaleString()}
                          </div>
                          {currentPrices[alert.coin] && (
                            <div className="text-xs text-gray-500">
                              Current: ${currentPrices[alert.coin].usd.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Triggered History */}
              {alerts.filter(a => a.triggered).length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Triggered (History)</h3>
                  {alerts.filter(a => a.triggered).slice(-5).reverse().map(alert => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium text-sm line-through">
                            {alert.symbol} {alert.direction} ${alert.targetPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Triggered</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {alerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No price alerts set</p>
                  <p className="text-sm">Create an alert to get notified when prices move</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
