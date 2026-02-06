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
 * - Database persistence via unified database layer
 */

import { getTopCoins, getFearGreedIndex } from '@/lib/market-data';
import { getLatestNews, getBreakingNews } from '@/lib/crypto-news';
import { db } from '@/lib/database';
import { generateShortId } from '@/lib/utils/id';
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

// Database collections
const PRICE_ALERTS_COLLECTION = 'price_alerts';
const KEYWORD_ALERTS_COLLECTION = 'keyword_alerts';
const ALERT_HISTORY_COLLECTION = 'alert_history';
const ALERT_RULES_COLLECTION = 'alert_rules';
const ALERT_EVENTS_COLLECTION = 'alert_events';

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

// Database-backed storage helper functions
async function getAllPriceAlerts(): Promise<PriceAlert[]> {
  try {
    const docs = await db.listDocuments<PriceAlert>(PRICE_ALERTS_COLLECTION, { limit: 10000 });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get price alerts from database:', error);
    return [];
  }
}

async function getPriceAlertById(id: string): Promise<PriceAlert | null> {
  try {
    const doc = await db.getDocument<PriceAlert>(PRICE_ALERTS_COLLECTION, id);
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function savePriceAlert(alert: PriceAlert): Promise<void> {
  await db.saveDocument(PRICE_ALERTS_COLLECTION, alert.id, alert, {
    userId: alert.userId,
    coinId: alert.coinId,
    active: alert.active,
  });
}

async function deletePriceAlertById(id: string): Promise<boolean> {
  return db.deleteDocument(PRICE_ALERTS_COLLECTION, id);
}

async function getAllKeywordAlerts(): Promise<KeywordAlert[]> {
  try {
    const docs = await db.listDocuments<KeywordAlert>(KEYWORD_ALERTS_COLLECTION, { limit: 10000 });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get keyword alerts from database:', error);
    return [];
  }
}

async function getKeywordAlertById(id: string): Promise<KeywordAlert | null> {
  try {
    const doc = await db.getDocument<KeywordAlert>(KEYWORD_ALERTS_COLLECTION, id);
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function saveKeywordAlert(alert: KeywordAlert): Promise<void> {
  await db.saveDocument(KEYWORD_ALERTS_COLLECTION, alert.id, alert, {
    userId: alert.userId,
    active: alert.active,
  });
}

async function deleteKeywordAlertById(id: string): Promise<boolean> {
  return db.deleteDocument(KEYWORD_ALERTS_COLLECTION, id);
}

async function getAlertHistoryForUser(userId: string): Promise<AlertNotification[]> {
  try {
    const doc = await db.getDocument<{ notifications: AlertNotification[] }>(ALERT_HISTORY_COLLECTION, userId);
    return doc?.data?.notifications || [];
  } catch {
    return [];
  }
}

async function saveAlertHistoryForUser(userId: string, notifications: AlertNotification[]): Promise<void> {
  await db.saveDocument(ALERT_HISTORY_COLLECTION, userId, { notifications: notifications.slice(0, 100) });
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
    id: generateShortId('pa'),
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

  await savePriceAlert(alert);
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
    id: generateShortId('ka'),
    userId,
    keywords: options.keywords.map(k => k.toLowerCase()),
    sources: options.sources,
    notifyVia: options.notifyVia || ['push'],
    active: true,
    createdAt: new Date().toISOString(),
  };

  await saveKeywordAlert(alert);
  return alert;
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: string): Promise<boolean> {
  const priceAlert = await getPriceAlertById(alertId);
  if (priceAlert) {
    return deletePriceAlertById(alertId);
  }
  const keywordAlert = await getKeywordAlertById(alertId);
  if (keywordAlert) {
    return deleteKeywordAlertById(alertId);
  }
  return false;
}

/**
 * Toggle alert active status
 */
export async function toggleAlert(alertId: string, active: boolean): Promise<boolean> {
  const priceAlert = await getPriceAlertById(alertId);
  if (priceAlert) {
    priceAlert.active = active;
    await savePriceAlert(priceAlert);
    return true;
  }
  
  const keywordAlert = await getKeywordAlertById(alertId);
  if (keywordAlert) {
    keywordAlert.active = active;
    await saveKeywordAlert(keywordAlert);
    return true;
  }
  
  return false;
}

/**
 * Get alerts for a user
 */
export async function getUserAlerts(userId: string): Promise<{
  priceAlerts: PriceAlert[];
  keywordAlerts: KeywordAlert[];
}> {
  const [allPrice, allKeyword] = await Promise.all([
    getAllPriceAlerts(),
    getAllKeywordAlerts(),
  ]);
  
  return {
    priceAlerts: allPrice.filter(a => a.userId === userId),
    keywordAlerts: allKeyword.filter(a => a.userId === userId),
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
    const allPriceAlerts = await getAllPriceAlerts();

    for (const alert of allPriceAlerts) {
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
        await savePriceAlert(alert);

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
        const history = await getAlertHistoryForUser(alert.userId);
        history.unshift(notification);
        await saveAlertHistoryForUser(alert.userId, history.slice(0, 100));
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
    const allKeywordAlerts = await getAllKeywordAlerts();
    
    for (const alert of allKeywordAlerts) {
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
          const history = await getAlertHistoryForUser(alert.userId);
          const alreadyNotified = history.some(
            n => n.type === 'keyword' && (n.data as Record<string, unknown>).link === article.link
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
            await saveAlertHistoryForUser(alert.userId, history.slice(0, 100));

            // Update alert
            alert.lastTriggeredAt = new Date().toISOString();
            await saveKeywordAlert(alert);
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
export async function getAlertHistory(userId: string, limit = 50): Promise<AlertNotification[]> {
  const history = await getAlertHistoryForUser(userId);
  return history.slice(0, limit);
}

/**
 * Get alert stats
 */
export async function getAlertStats(): Promise<{
  totalPriceAlerts: number;
  activePriceAlerts: number;
  triggeredPriceAlerts: number;
  totalKeywordAlerts: number;
  activeKeywordAlerts: number;
}> {
  const [allPrice, allKeyword] = await Promise.all([
    getAllPriceAlerts(),
    getAllKeywordAlerts(),
  ]);

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

// Database-backed alert rules storage
async function getAllAlertRulesFromDb(): Promise<AlertRule[]> {
  try {
    const docs = await db.listDocuments<AlertRule>(ALERT_RULES_COLLECTION, { limit: 1000 });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get alert rules from database:', error);
    return [];
  }
}

async function getAlertRuleFromDb(id: string): Promise<AlertRule | null> {
  try {
    const doc = await db.getDocument<AlertRule>(ALERT_RULES_COLLECTION, id);
    return doc?.data || null;
  } catch {
    return null;
  }
}

async function saveAlertRuleToDb(rule: AlertRule): Promise<void> {
  await db.saveDocument(ALERT_RULES_COLLECTION, rule.id, rule, {
    name: rule.name,
    enabled: rule.enabled,
    type: rule.condition.type,
  });
}

async function deleteAlertRuleFromDb(id: string): Promise<boolean> {
  return db.deleteDocument(ALERT_RULES_COLLECTION, id);
}

async function getAllAlertEventsFromDb(): Promise<AlertEvent[]> {
  try {
    const docs = await db.listDocuments<AlertEvent>(ALERT_EVENTS_COLLECTION, { limit: 1000, orderBy: 'desc' });
    return docs.map(doc => doc.data);
  } catch (error) {
    console.error('Failed to get alert events from database:', error);
    return [];
  }
}

async function saveAlertEventToDb(event: AlertEvent): Promise<void> {
  await db.saveDocument(ALERT_EVENTS_COLLECTION, event.id, event, {
    ruleId: event.ruleId,
    severity: event.severity,
  });
}

// Runtime state (not persisted)
let lastFearGreedValue: number | null = null;
let volumeBaseline: Map<string, number> = new Map();

/**
 * Get all alert rules
 */
export async function getAllAlertRules(): Promise<AlertRule[]> {
  return getAllAlertRulesFromDb();
}

/**
 * Get enabled alert rules
 */
export async function getEnabledAlertRules(): Promise<AlertRule[]> {
  const all = await getAllAlertRulesFromDb();
  return all.filter(r => r.enabled);
}

/**
 * Get a single alert rule by ID
 */
export async function getAlertRule(id: string): Promise<AlertRule | undefined> {
  const rule = await getAlertRuleFromDb(id);
  return rule || undefined;
}

/**
 * Create a new alert rule
 */
export async function createAlertRule(
  name: string,
  condition: AlertCondition,
  channels: AlertChannel[],
  options?: {
    webhookUrl?: string;
    cooldown?: number;
    enabled?: boolean;
  }
): Promise<AlertRule> {
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

  await saveAlertRuleToDb(rule);
  return rule;
}

/**
 * Update an alert rule
 */
export async function updateAlertRule(
  id: string,
  updates: Partial<Omit<AlertRule, 'id' | 'createdAt'>>
): Promise<AlertRule | null> {
  const rule = await getAlertRuleFromDb(id);
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

  await saveAlertRuleToDb(updatedRule);
  return updatedRule;
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(id: string): Promise<boolean> {
  return deleteAlertRuleFromDb(id);
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
export async function updateLastTriggered(ruleId: string): Promise<void> {
  const rule = await getAlertRuleFromDb(ruleId);
  if (rule) {
    rule.lastTriggered = new Date().toISOString();
    await saveAlertRuleToDb(rule);
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
        // Fetch real whale transaction data
        const coin = 'bitcoin'; // Default to bitcoin
        const minThreshold = condition.minUSD || 1000000; // Default $1M
        
        try {
          // Fetch from our whale alerts API
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptocurrency.cv';
          const response = await fetch(
            `${baseUrl}/api/premium/alerts/whales?coins=${coin}&minThreshold=${minThreshold}`,
            { 
              cache: 'no-store',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const transactions = data.transactions || [];
            
            // Filter transactions above threshold
            const significantTxs = transactions.filter(
              (tx: { valueUsd: number }) => tx.valueUsd >= minThreshold
            );
            
            if (significantTxs.length > 0) {
              const largestTx = significantTxs.reduce(
                (max: { valueUsd: number }, tx: { valueUsd: number }) => 
                  tx.valueUsd > max.valueUsd ? tx : max,
                significantTxs[0]
              );
              
              return {
                triggered: true,
                currentValue: largestTx.valueUsd,
                context: {
                  coin,
                  transactionCount: significantTxs.length,
                  largestTransaction: {
                    amount: largestTx.amount,
                    valueUsd: largestTx.valueUsd,
                    signal: largestTx.signal,
                    significance: largestTx.significance,
                  },
                  netFlow: data.stats?.[0]?.netFlow24h || 0,
                  flowSignal: data.stats?.[0]?.flowSignal || 'neutral',
                },
              };
            }
          }
        } catch (error) {
          console.error('Error fetching whale data:', error);
        }
        
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
export async function createAlertEvent(
  rule: AlertRule,
  evalResult: { currentValue: number | string; context?: Record<string, unknown> }
): Promise<AlertEvent> {
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

  // Store event in database
  await saveAlertEventToDb(event);

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
  const rules = await getEnabledAlertRules();
  const events: AlertEvent[] = [];

  for (const rule of rules) {
    if (!shouldEvaluateRule(rule)) continue;

    try {
      const result = await evaluateCondition(rule.condition);
      
      if (result?.triggered) {
        const event = await createAlertEvent(rule, result);
        events.push(event);
        await updateLastTriggered(rule.id);

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
  const rule = await getAlertRule(ruleId);
  if (!rule) return null;

  // Create a mock event
  const event = await createAlertEvent(rule, {
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
export async function getAlertEvents(limit = 100): Promise<AlertEvent[]> {
  const events = await getAllAlertEventsFromDb();
  return events.slice(0, limit);
}

/**
 * Get events for a specific rule
 */
export async function getAlertEventsByRule(ruleId: string, limit = 50): Promise<AlertEvent[]> {
  const events = await getAllAlertEventsFromDb();
  return events
    .filter(e => e.ruleId === ruleId)
    .slice(0, limit);
}

/**
 * Get enhanced alert stats including rules
 */
export async function getEnhancedAlertStats(): Promise<{
  totalRules: number;
  enabledRules: number;
  totalEvents: number;
  rulesByType: Record<string, number>;
  recentEvents: AlertEvent[];
}> {
  const [rules, events] = await Promise.all([
    getAllAlertRules(),
    getAllAlertEventsFromDb(),
  ]);
  const rulesByType: Record<string, number> = {};

  for (const rule of rules) {
    const type = rule.condition.type;
    rulesByType[type] = (rulesByType[type] || 0) + 1;
  }

  return {
    totalRules: rules.length,
    enabledRules: rules.filter(r => r.enabled).length,
    totalEvents: events.length,
    rulesByType,
    recentEvents: events.slice(0, 10),
  };
}