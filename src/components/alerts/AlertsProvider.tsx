'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useToast } from '@/components/Toast';
import { playNotification } from '@/lib/sounds';

// Types
export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  condition: 'above' | 'below' | 'percent_up' | 'percent_down';
  targetPrice: number;
  targetPercent?: number;
  createdAt: string;
  createdPrice: number;
  triggered: boolean;
  triggeredAt?: string;
  repeat: boolean;
  notifyBrowser: boolean;
}

interface AlertsContextType {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => { success: boolean; error?: string };
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  clearTriggeredAlerts: () => void;
  clearAllAlerts: () => void;
  getAlertsForCoin: (coinId: string) => PriceAlert[];
  isLoaded: boolean;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export function useAlerts() {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within AlertsProvider');
  }
  return context;
}

const STORAGE_KEY = 'crypto-price-alerts-v2';
const MAX_ALERTS = 20;
const CHECK_INTERVAL = 30000; // 30 seconds

interface AlertsProviderProps {
  children: ReactNode;
}

export function AlertsProvider({ children }: AlertsProviderProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToast } = useToast();
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationPermission = useRef<NotificationPermission>('default');

  // Load alerts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAlerts(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);

    // Check notification permission
    if ('Notification' in window) {
      notificationPermission.current = Notification.permission;
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
      } catch {
        console.error('Failed to save alerts');
      }
    }
  }, [alerts, isLoaded]);

  // Check prices periodically
  const checkAlerts = useCallback(async () => {
    const activeAlerts = alerts.filter(a => !a.triggered || a.repeat);
    if (activeAlerts.length === 0) return;

    try {
      const coinIds = [...new Set(activeAlerts.map(a => a.coinId))].join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
      );
      
      if (!response.ok) return;
      
      const prices = await response.json();
      
      const triggeredAlertIds: string[] = [];
      
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => {
          if (alert.triggered && !alert.repeat) return alert;
          
          const priceData = prices[alert.coinId];
          if (!priceData) return alert;
          
          const currentPrice = priceData.usd;
          let shouldTrigger = false;
          
          switch (alert.condition) {
            case 'above':
              shouldTrigger = currentPrice >= alert.targetPrice;
              break;
            case 'below':
              shouldTrigger = currentPrice <= alert.targetPrice;
              break;
            case 'percent_up':
              const percentUp = ((currentPrice - alert.createdPrice) / alert.createdPrice) * 100;
              shouldTrigger = percentUp >= (alert.targetPercent || 0);
              break;
            case 'percent_down':
              const percentDown = ((alert.createdPrice - currentPrice) / alert.createdPrice) * 100;
              shouldTrigger = percentDown >= (alert.targetPercent || 0);
              break;
          }
          
          if (shouldTrigger && !alert.triggered) {
            triggeredAlertIds.push(alert.id);
            
            // Show toast notification
            const message = getAlertMessage(alert, currentPrice);
            addToast({
              type: 'warning',
              title: `🔔 ${alert.coinSymbol.toUpperCase()} Alert`,
              message,
              duration: 8000,
            });
            
            // Browser notification
            if (alert.notifyBrowser && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`🔔 ${alert.coinSymbol.toUpperCase()} Price Alert`, {
                body: message,
                icon: '/icons/icon-192x192.png',
                tag: alert.id,
              });
            }
            
            // Play sound
            try {
              playNotification();
            } catch {
              // Ignore sound errors
            }
            
            return {
              ...alert,
              triggered: true,
              triggeredAt: new Date().toISOString(),
            };
          }
          
          return alert;
        })
      );
    } catch (error) {
      console.error('Failed to check prices:', error);
    }
  }, [alerts, addToast]);

  // Start price checking interval
  useEffect(() => {
    if (!isLoaded) return;
    
    // Initial check
    checkAlerts();
    
    // Set up interval
    checkIntervalRef.current = setInterval(checkAlerts, CHECK_INTERVAL);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isLoaded, checkAlerts]);

  const addAlert = useCallback((alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    if (alerts.length >= MAX_ALERTS) {
      return { success: false, error: `Maximum ${MAX_ALERTS} alerts allowed` };
    }

    // Request notification permission if browser notifications enabled
    if (alertData.notifyBrowser && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        notificationPermission.current = permission;
      });
    }

    const newAlert: PriceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    setAlerts(prev => [newAlert, ...prev]);
    return { success: true };
  }, [alerts.length]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => 
      prev.map(a => 
        a.id === id ? { ...a, triggered: false, triggeredAt: undefined } : a
      )
    );
  }, []);

  const clearTriggeredAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(a => !a.triggered));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getAlertsForCoin = useCallback((coinId: string) => {
    return alerts.filter(a => a.coinId === coinId);
  }, [alerts]);

  return (
    <AlertsContext.Provider
      value={{
        alerts,
        addAlert,
        removeAlert,
        toggleAlert,
        clearTriggeredAlerts,
        clearAllAlerts,
        getAlertsForCoin,
        isLoaded,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

function getAlertMessage(alert: PriceAlert, currentPrice: number): string {
  const priceStr = `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`;
  
  switch (alert.condition) {
    case 'above':
      return `Price is now above $${alert.targetPrice.toLocaleString()} (Current: ${priceStr})`;
    case 'below':
      return `Price is now below $${alert.targetPrice.toLocaleString()} (Current: ${priceStr})`;
    case 'percent_up':
      return `Price increased by ${alert.targetPercent}%+ (Current: ${priceStr})`;
    case 'percent_down':
      return `Price decreased by ${alert.targetPercent}%+ (Current: ${priceStr})`;
    default:
      return `Alert triggered (Current: ${priceStr})`;
  }
}

export default AlertsProvider;
