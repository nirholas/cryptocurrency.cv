/**
 * Price & Keyword Alerts System
 * 
 * Features:
 * - Price threshold alerts (above/below)
 * - Percent change alerts (24h)
 * - Keyword mention alerts
 * - Multiple notification channels
 */

import { getTopCoins } from '@/lib/market-data';
import { getLatestNews } from '@/lib/crypto-news';

// Types
export interface PriceAlert {
  id: string;
  userId: string;
  coin: string;
  coinId: string;
  condition: 'above' | 'below' | 'percent_up' | 'percent_down';
  threshold: number;
  notifyVia: ('push' | 'email' | 'webhook')[];
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface KeywordAlert {
  id: string;
  userId: string;
  keywords: string[];
  sources?: string[];
  notifyVia: ('push' | 'email' | 'webhook')[];
  active: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface AlertNotification {
  type: 'price' | 'keyword';
  alertId: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// In-memory store (replace with DB in production)
const priceAlerts = new Map<string, PriceAlert>();
const keywordAlerts = new Map<string, KeywordAlert>();
const alertHistory = new Map<string, AlertNotification[]>();

// Generate IDs
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a price alert
 */
export async function createPriceAlert(
  userId: string,
  options: {
    coin: string;
    coinId: string;
    condition: 'above' | 'below' | 'percent_up' | 'percent_down';
    threshold: number;
    notifyVia?: ('push' | 'email' | 'webhook')[];
  }
): Promise<PriceAlert> {
  const alert: PriceAlert = {
    id: generateId('pa'),
    userId,
    coin: options.coin,
    coinId: options.coinId,
    condition: options.condition,
    threshold: options.threshold,
    notifyVia: options.notifyVia || ['push'],
    active: true,
    triggered: false,
    createdAt: new Date().toISOString(),
  };

  priceAlerts.set(alert.id, alert);
  return alert;
}

/**
 * Create a keyword alert
 */
export async function createKeywordAlert(
  userId: string,
  options: {
    keywords: string[];
    sources?: string[];
    notifyVia?: ('push' | 'email' | 'webhook')[];
  }
): Promise<KeywordAlert> {
  const alert: KeywordAlert = {
    id: generateId('ka'),
    userId,
    keywords: options.keywords.map(k => k.toLowerCase()),
    sources: options.sources,
    notifyVia: options.notifyVia || ['push'],
    active: true,
    createdAt: new Date().toISOString(),
  };

  keywordAlerts.set(alert.id, alert);
  return alert;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
  if (priceAlerts.has(alertId)) {
    priceAlerts.delete(alertId);
    return true;
  }
  if (keywordAlerts.has(alertId)) {
    keywordAlerts.delete(alertId);
    return true;
  }
  return false;
}

/**
 * Toggle alert active status
 */
export async function toggleAlert(alertId: string, active: boolean): Promise<boolean> {
  const priceAlert = priceAlerts.get(alertId);
  if (priceAlert) {
    priceAlert.active = active;
    priceAlerts.set(alertId, priceAlert);
    return true;
  }
  
  const keywordAlert = keywordAlerts.get(alertId);
  if (keywordAlert) {
    keywordAlert.active = active;
    keywordAlerts.set(alertId, keywordAlert);
    return true;
  }
  
  return false;
}

/**
 * Get alerts for a user
 */
export function getUserAlerts(userId: string): {
  priceAlerts: PriceAlert[];
  keywordAlerts: KeywordAlert[];
} {
  return {
    priceAlerts: Array.from(priceAlerts.values()).filter(a => a.userId === userId),
    keywordAlerts: Array.from(keywordAlerts.values()).filter(a => a.userId === userId),
  };
}

/**
 * Check all price alerts against current prices
 */
export async function checkPriceAlerts(): Promise<AlertNotification[]> {
  const notifications: AlertNotification[] = [];
  
  try {
    const coins = await getTopCoins(100);
    const coinMap = new Map(coins.map(c => [c.id, c]));

    for (const [, alert] of priceAlerts) {
      if (!alert.active || alert.triggered) continue;

      const coin = coinMap.get(alert.coinId);
      if (!coin) continue;

      let triggered = false;
      let message = '';

      switch (alert.condition) {
        case 'above':
          if (coin.current_price >= alert.threshold) {
            triggered = true;
            message = `${coin.name} is now $${coin.current_price.toLocaleString()} (above $${alert.threshold.toLocaleString()})`;
          }
          break;
        case 'below':
          if (coin.current_price <= alert.threshold) {
            triggered = true;
            message = `${coin.name} dropped to $${coin.current_price.toLocaleString()} (below $${alert.threshold.toLocaleString()})`;
          }
          break;
        case 'percent_up':
          if (coin.price_change_percentage_24h >= alert.threshold) {
            triggered = true;
            message = `${coin.name} is up ${coin.price_change_percentage_24h.toFixed(2)}% in 24h`;
          }
          break;
        case 'percent_down':
          if (coin.price_change_percentage_24h <= -alert.threshold) {
            triggered = true;
            message = `${coin.name} is down ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}% in 24h`;
          }
          break;
      }

      if (triggered) {
        alert.triggered = true;
        alert.triggeredAt = new Date().toISOString();
        priceAlerts.set(alert.id, alert);

        const notification: AlertNotification = {
          type: 'price',
          alertId: alert.id,
          title: `💰 Price Alert: ${coin.name}`,
          message,
          data: {
            coin: coin.name,
            symbol: coin.symbol,
            price: coin.current_price,
            change24h: coin.price_change_percentage_24h,
            condition: alert.condition,
            threshold: alert.threshold,
          },
          timestamp: new Date().toISOString(),
        };

        notifications.push(notification);
        
        // Store in history
        const history = alertHistory.get(alert.userId) || [];
        history.unshift(notification);
        alertHistory.set(alert.userId, history.slice(0, 100)); // Keep last 100
      }
    }
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }

  return notifications;
}

/**
 * Check keyword alerts against latest news
 */
export async function checkKeywordAlerts(): Promise<AlertNotification[]> {
  const notifications: AlertNotification[] = [];
  
  try {
    const news = await getLatestNews(50);
    
    for (const [, alert] of keywordAlerts) {
      if (!alert.active) continue;

      for (const article of news.articles) {
        // Check source filter
        if (alert.sources && alert.sources.length > 0) {
          if (!alert.sources.includes(article.sourceKey)) continue;
        }

        // Check keywords
        const titleLower = article.title.toLowerCase();
        const descLower = (article.description || '').toLowerCase();
        
        const matchedKeywords = alert.keywords.filter(
          kw => titleLower.includes(kw) || descLower.includes(kw)
        );

        if (matchedKeywords.length > 0) {
          // Debounce: don't alert for same article twice
          const history = alertHistory.get(alert.userId) || [];
          const alreadyNotified = history.some(
            n => n.type === 'keyword' && (n.data as any).link === article.link
          );

          if (!alreadyNotified) {
            const notification: AlertNotification = {
              type: 'keyword',
              alertId: alert.id,
              title: `🔔 Keyword Alert: ${matchedKeywords.join(', ')}`,
              message: article.title,
              data: {
                keywords: matchedKeywords,
                article: {
                  title: article.title,
                  link: article.link,
                  source: article.source,
                },
                link: article.link,
              },
              timestamp: new Date().toISOString(),
            };

            notifications.push(notification);
            
            // Store in history
            history.unshift(notification);
            alertHistory.set(alert.userId, history.slice(0, 100));

            // Update alert
            alert.lastTriggeredAt = new Date().toISOString();
            keywordAlerts.set(alert.id, alert);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking keyword alerts:', error);
  }

  return notifications;
}

/**
 * Get alert history for user
 */
export function getAlertHistory(userId: string, limit = 50): AlertNotification[] {
  const history = alertHistory.get(userId) || [];
  return history.slice(0, limit);
}

/**
 * Get alert stats
 */
export function getAlertStats(): {
  totalPriceAlerts: number;
  activePriceAlerts: number;
  triggeredPriceAlerts: number;
  totalKeywordAlerts: number;
  activeKeywordAlerts: number;
} {
  const allPrice = Array.from(priceAlerts.values());
  const allKeyword = Array.from(keywordAlerts.values());

  return {
    totalPriceAlerts: allPrice.length,
    activePriceAlerts: allPrice.filter(a => a.active).length,
    triggeredPriceAlerts: allPrice.filter(a => a.triggered).length,
    totalKeywordAlerts: allKeyword.length,
    activeKeywordAlerts: allKeyword.filter(a => a.active).length,
  };
}
