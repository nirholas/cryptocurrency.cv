/**
 * Price & Keyword Alerts System
 * 
 * Features:
 * - Price threshold alerts (above/below)
 * - Percent change alerts (24h)
 * - Keyword mention alerts
 * - Multiple notification channels
 * - Advanced alert rules with configurable conditions
 * - WebSocket and webhook delivery
 * - JSON file persistence
 */

import { getTopCoins, getFearGreedIndex } from '@/lib/market-data';
import { getLatestNews, getBreakingNews } from '@/lib/crypto-news';
import {
  AlertRule,
  AlertCondition,
  AlertEvent,
  AlertChannel,
  validateCondition,
  generateAlertId,
  generateEventId,
  determineSeverity,
  getConditionDescription,
} from '@/lib/alert-rules';
// Note: fs/path removed for Edge Runtime compatibility
// Using in-memory storage only (use external DB for persistence)

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
// =============================================================================
// ENHANCED ALERT RULES SYSTEM
// =============================================================================

// Re-export types from alert-rules
export type { AlertRule, AlertCondition, AlertEvent, AlertChannel } from '@/lib/alert-rules';

// In-memory storage (Edge Runtime compatible)
// For persistence, use external database (e.g., Vercel KV, Upstash Redis)

// In-memory cache for alert rules
let alertRulesCache: Map<string, AlertRule> = new Map();
let alertEventsCache: AlertEvent[] = [];
let lastFearGreedValue: number | null = null;
let volumeBaseline: Map<string, number> = new Map();

/**
 * Load alert rules from storage (in-memory only for Edge Runtime)
 */
export function loadAlertRules(): AlertRule[] {
  // In Edge Runtime, we only use in-memory cache
  // Data will be lost on cold starts - use external DB for persistence
  return Array.from(alertRulesCache.values());
}

/**
 * Save alert rules to storage (in-memory only for Edge Runtime)
 */
export function saveAlertRules(): void {
  // In Edge Runtime, data is kept in memory only
  // For persistence, integrate with Vercel KV, Upstash Redis, or similar
  // The in-memory cache is already updated by create/update/delete operations
}

/**
 * Get all alert rules
 */
export function getAllAlertRules(): AlertRule[] {
  if (alertRulesCache.size === 0) {
    loadAlertRules();
  }
  return Array.from(alertRulesCache.values());
}

/**
 * Get enabled alert rules
 */
export function getEnabledAlertRules(): AlertRule[] {
  return getAllAlertRules().filter(r => r.enabled);
}

/**
 * Get a single alert rule by ID
 */
export function getAlertRule(id: string): AlertRule | undefined {
  if (alertRulesCache.size === 0) {
    loadAlertRules();
  }
  return alertRulesCache.get(id);
}

/**
 * Create a new alert rule
 */
export function createAlertRule(
  name: string,
  condition: AlertCondition,
  channels: AlertChannel[],
  options?: {
    webhookUrl?: string;
    cooldown?: number;
    enabled?: boolean;
  }
): AlertRule {
  const validation = validateCondition(condition);
  if (!validation.valid) {
    throw new Error(`Invalid condition: ${validation.error}`);
  }

  const rule: AlertRule = {
    id: generateAlertId(),
    name,
    condition,
    channels,
    webhookUrl: options?.webhookUrl,
    cooldown: options?.cooldown ?? 300, // Default 5 minutes
    enabled: options?.enabled ?? true,
    createdAt: new Date().toISOString(),
  };

  alertRulesCache.set(rule.id, rule);
  saveAlertRules();
  return rule;
}

/**
 * Update an alert rule
 */
export function updateAlertRule(
  id: string,
  updates: Partial<Omit<AlertRule, 'id' | 'createdAt'>>
): AlertRule | null {
  const rule = alertRulesCache.get(id);
  if (!rule) return null;

  if (updates.condition) {
    const validation = validateCondition(updates.condition);
    if (!validation.valid) {
      throw new Error(`Invalid condition: ${validation.error}`);
    }
  }

  const updatedRule: AlertRule = {
    ...rule,
    ...updates,
    id: rule.id,
    createdAt: rule.createdAt,
  };

  alertRulesCache.set(id, updatedRule);
  saveAlertRules();
  return updatedRule;
}

/**
 * Delete an alert rule
 */
export function deleteAlertRule(id: string): boolean {
  const deleted = alertRulesCache.delete(id);
  if (deleted) {
    saveAlertRules();
  }
  return deleted;
}

/**
 * Check if an alert rule should be evaluated (cooldown check)
 */
export function shouldEvaluateRule(rule: AlertRule): boolean {
  if (!rule.enabled) return false;
  if (!rule.lastTriggered) return true;

  const lastTriggeredTime = new Date(rule.lastTriggered).getTime();
  const cooldownMs = rule.cooldown * 1000;
  return Date.now() - lastTriggeredTime >= cooldownMs;
}

/**
 * Update last triggered timestamp for a rule
 */
export function updateLastTriggered(ruleId: string): void {
  const rule = alertRulesCache.get(ruleId);
  if (rule) {
    rule.lastTriggered = new Date().toISOString();
    alertRulesCache.set(ruleId, rule);
    saveAlertRules();
  }
}

/**
 * Evaluate a single alert condition
 */
export async function evaluateCondition(
  condition: AlertCondition
): Promise<{ triggered: boolean; currentValue: number | string; context?: Record<string, unknown> } | null> {
  try {
    switch (condition.type) {
      case 'price_above':
      case 'price_below': {
        const coins = await getTopCoins(100);
        const coin = coins.find(
          c => c.id.toLowerCase() === condition.coin.toLowerCase() ||
               c.symbol.toLowerCase() === condition.coin.toLowerCase()
        );
        if (!coin) return null;

        const triggered = condition.type === 'price_above'
          ? coin.current_price >= condition.threshold
          : coin.current_price <= condition.threshold;

        return {
          triggered,
          currentValue: coin.current_price,
          context: {
            coinId: coin.id,
            coinName: coin.name,
            symbol: coin.symbol,
            change24h: coin.price_change_percentage_24h,
          },
        };
      }

      case 'price_change_pct': {
        const coins = await getTopCoins(100);
        const coin = coins.find(
          c => c.id.toLowerCase() === condition.coin.toLowerCase() ||
               c.symbol.toLowerCase() === condition.coin.toLowerCase()
        );
        if (!coin) return null;

        // For 24h, use the built-in value; for 1h, we'd need historical data
        // Using 24h change as approximation for now
        const changeValue = condition.timeframe === '24h'
          ? coin.price_change_percentage_24h
          : coin.price_change_percentage_24h / 24; // Rough approximation

        const triggered = condition.threshold > 0
          ? changeValue >= condition.threshold
          : changeValue <= condition.threshold;

        return {
          triggered,
          currentValue: changeValue,
          context: {
            coinId: coin.id,
            coinName: coin.name,
            symbol: coin.symbol,
            timeframe: condition.timeframe,
            price: coin.current_price,
          },
        };
      }

      case 'volume_spike': {
        const coins = await getTopCoins(100);
        const coin = coins.find(
          c => c.id.toLowerCase() === condition.coin.toLowerCase() ||
               c.symbol.toLowerCase() === condition.coin.toLowerCase()
        );
        if (!coin) return null;

        // Get baseline volume (store average)
        const baseline = volumeBaseline.get(coin.id) || coin.total_volume;
        const currentMultiplier = coin.total_volume / baseline;

        // Update baseline (rolling average)
        volumeBaseline.set(coin.id, (baseline + coin.total_volume) / 2);

        return {
          triggered: currentMultiplier >= condition.multiplier,
          currentValue: currentMultiplier,
          context: {
            coinId: coin.id,
            coinName: coin.name,
            symbol: coin.symbol,
            currentVolume: coin.total_volume,
            baselineVolume: baseline,
          },
        };
      }

      case 'breaking_news': {
        const news = await getBreakingNews(10);
        if (!news.articles || news.articles.length === 0) {
          return { triggered: false, currentValue: 0 };
        }

        const matchingArticles = condition.keywords?.length
          ? news.articles.filter(article => {
              const titleLower = article.title.toLowerCase();
              const descLower = (article.description || '').toLowerCase();
              return condition.keywords!.some(
                kw => titleLower.includes(kw.toLowerCase()) || descLower.includes(kw.toLowerCase())
              );
            })
          : news.articles;

        if (matchingArticles.length > 0) {
          return {
            triggered: true,
            currentValue: matchingArticles.length,
            context: {
              articles: matchingArticles.slice(0, 3).map(a => ({
                title: a.title,
                source: a.source,
                link: a.link,
              })),
              keywords: condition.keywords,
            },
          };
        }
        return { triggered: false, currentValue: 0 };
      }

      case 'ticker_mention': {
        const news = await getLatestNews(50);
        const tickerLower = condition.ticker.toLowerCase();
        
        const matchingArticles = news.articles.filter(article => {
          const titleLower = article.title.toLowerCase();
          const descLower = (article.description || '').toLowerCase();
          const mentions = titleLower.includes(tickerLower) || descLower.includes(tickerLower);
          
          if (!mentions) return false;
          
          // Check sentiment if specified
          if (condition.minSentiment !== undefined) {
            const sentiment = (article as unknown as Record<string, unknown>).sentiment;
            if (typeof sentiment === 'number' && sentiment < condition.minSentiment) {
              return false;
            }
          }
          
          return true;
        });

        if (matchingArticles.length > 0) {
          return {
            triggered: true,
            currentValue: matchingArticles.length,
            context: {
              ticker: condition.ticker,
              articles: matchingArticles.slice(0, 3).map(a => ({
                title: a.title,
                source: a.source,
                link: a.link,
              })),
            },
          };
        }
        return { triggered: false, currentValue: 0 };
      }

      case 'whale_movement': {
        // Whale movements would typically come from on-chain data providers
        // This is a placeholder that could be connected to Whale Alert API
        // For now, return not triggered
        return { triggered: false, currentValue: 0 };
      }

      case 'fear_greed_change': {
        const fearGreed = await getFearGreedIndex();
        if (!fearGreed) return null;

        const currentValue = fearGreed.value;
        
        if (lastFearGreedValue === null) {
          lastFearGreedValue = currentValue;
          return { triggered: false, currentValue: 0 };
        }

        const change = Math.abs(currentValue - lastFearGreedValue);
        const triggered = change >= condition.threshold;
        
        const result = {
          triggered,
          currentValue: change,
          context: {
            previousValue: lastFearGreedValue,
            currentValue,
            classification: fearGreed.value_classification,
          },
        };

        lastFearGreedValue = currentValue;
        return result;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error evaluating condition ${condition.type}:`, error);
    return null;
  }
}

/**
 * Create an alert event from a triggered rule
 */
export function createAlertEvent(
  rule: AlertRule,
  evalResult: { currentValue: number | string; context?: Record<string, unknown> }
): AlertEvent {
  const threshold = 'threshold' in rule.condition
    ? (rule.condition as { threshold: number }).threshold
    : 'multiplier' in rule.condition
    ? (rule.condition as { multiplier: number }).multiplier
    : 'minUSD' in rule.condition
    ? (rule.condition as { minUSD: number }).minUSD
    : 0;

  const event: AlertEvent = {
    id: generateEventId(),
    ruleId: rule.id,
    ruleName: rule.name,
    condition: rule.condition,
    triggeredAt: new Date().toISOString(),
    data: {
      currentValue: evalResult.currentValue,
      threshold: threshold,
      context: evalResult.context,
    },
    severity: determineSeverity(rule.condition, evalResult.currentValue, threshold),
  };

  // Store event in cache
  alertEventsCache.unshift(event);
  alertEventsCache = alertEventsCache.slice(0, 1000);

  return event;
}

/**
 * Send webhook notification
 */
export async function sendWebhook(url: string, event: AlertEvent): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Alert-Event-Id': event.id,
        'X-Alert-Rule-Id': event.ruleId,
      },
      body: JSON.stringify({
        type: 'alert',
        event,
        timestamp: new Date().toISOString(),
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook delivery failed:', error);
    return false;
  }
}

/**
 * Evaluate all enabled alert rules
 * Returns events for rules that triggered
 */
export async function evaluateAllAlerts(): Promise<AlertEvent[]> {
  const rules = getEnabledAlertRules();
  const events: AlertEvent[] = [];

  for (const rule of rules) {
    if (!shouldEvaluateRule(rule)) continue;

    try {
      const result = await evaluateCondition(rule.condition);
      
      if (result?.triggered) {
        const event = createAlertEvent(rule, result);
        events.push(event);
        updateLastTriggered(rule.id);

        // Send webhook if configured
        if (rule.channels.includes('webhook') && rule.webhookUrl) {
          await sendWebhook(rule.webhookUrl, event);
        }
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  return events;
}

/**
 * Test trigger an alert rule (for testing purposes)
 */
export async function testTriggerAlert(ruleId: string): Promise<AlertEvent | null> {
  const rule = getAlertRule(ruleId);
  if (!rule) return null;

  // Create a mock event
  const event = createAlertEvent(rule, {
    currentValue: 'test',
    context: { testMode: true },
  });

  // Send webhook if configured (but don't update lastTriggered)
  if (rule.channels.includes('webhook') && rule.webhookUrl) {
    await sendWebhook(rule.webhookUrl, event);
  }

  return event;
}

/**
 * Get recent alert events
 */
export function getAlertEvents(limit = 100): AlertEvent[] {
  return alertEventsCache.slice(0, limit);
}

/**
 * Get events for a specific rule
 */
export function getAlertEventsByRule(ruleId: string, limit = 50): AlertEvent[] {
  return alertEventsCache
    .filter(e => e.ruleId === ruleId)
    .slice(0, limit);
}

/**
 * Get enhanced alert stats including rules
 */
export function getEnhancedAlertStats(): {
  totalRules: number;
  enabledRules: number;
  totalEvents: number;
  rulesByType: Record<string, number>;
  recentEvents: AlertEvent[];
} {
  const rules = getAllAlertRules();
  const rulesByType: Record<string, number> = {};

  for (const rule of rules) {
    const type = rule.condition.type;
    rulesByType[type] = (rulesByType[type] || 0) + 1;
  }

  return {
    totalRules: rules.length,
    enabledRules: rules.filter(r => r.enabled).length,
    totalEvents: alertEventsCache.length,
    rulesByType,
    recentEvents: alertEventsCache.slice(0, 10),
  };
}