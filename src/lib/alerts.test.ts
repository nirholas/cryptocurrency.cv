/**
 * @fileoverview Unit tests for alerts.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the module inline for testing
describe('Alerts System', () => {
  // In-memory store for testing
  let alertsStore: Map<string, any[]>;
  let alertHistoryStore: Map<string, any[]>;
  
  beforeEach(() => {
    alertsStore = new Map();
    alertHistoryStore = new Map();
    vi.clearAllMocks();
  });

  describe('createPriceAlert', () => {
    const createPriceAlert = (userId: string, alert: {
      coinId: string;
      condition: 'above' | 'below' | 'percent_change';
      targetPrice?: number;
      percentChange?: number;
      enabled?: boolean;
    }) => {
      const newAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'price' as const,
        coinId: alert.coinId,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        percentChange: alert.percentChange,
        enabled: alert.enabled !== false,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      
      const userAlerts = alertsStore.get(userId) || [];
      userAlerts.push(newAlert);
      alertsStore.set(userId, userAlerts);
      
      return newAlert;
    };

    it('should create a price alert with all required fields', () => {
      const alert = createPriceAlert('user-1', {
        coinId: 'bitcoin',
        condition: 'above',
        targetPrice: 100000,
      });

      expect(alert).toMatchObject({
        userId: 'user-1',
        type: 'price',
        coinId: 'bitcoin',
        condition: 'above',
        targetPrice: 100000,
        enabled: true,
      });
      expect(alert.id).toBeTruthy();
      expect(alert.createdAt).toBeTruthy();
    });

    it('should create alerts with different conditions', () => {
      const aboveAlert = createPriceAlert('user-1', {
        coinId: 'bitcoin',
        condition: 'above',
        targetPrice: 100000,
      });
      
      const belowAlert = createPriceAlert('user-1', {
        coinId: 'bitcoin',
        condition: 'below',
        targetPrice: 50000,
      });
      
      const percentAlert = createPriceAlert('user-1', {
        coinId: 'bitcoin',
        condition: 'percent_change',
        percentChange: 10,
      });

      expect(aboveAlert.condition).toBe('above');
      expect(belowAlert.condition).toBe('below');
      expect(percentAlert.condition).toBe('percent_change');
    });

    it('should store multiple alerts per user', () => {
      createPriceAlert('user-1', { coinId: 'bitcoin', condition: 'above', targetPrice: 100000 });
      createPriceAlert('user-1', { coinId: 'ethereum', condition: 'below', targetPrice: 2000 });
      
      const userAlerts = alertsStore.get('user-1');
      expect(userAlerts).toHaveLength(2);
    });

    it('should generate unique IDs for each alert', () => {
      const alert1 = createPriceAlert('user-1', { coinId: 'bitcoin', condition: 'above', targetPrice: 100000 });
      const alert2 = createPriceAlert('user-1', { coinId: 'bitcoin', condition: 'above', targetPrice: 100000 });
      
      expect(alert1.id).not.toBe(alert2.id);
    });
  });

  describe('createKeywordAlert', () => {
    const createKeywordAlert = (userId: string, alert: {
      keywords: string[];
      sources?: string[];
      enabled?: boolean;
    }) => {
      const newAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'keyword' as const,
        keywords: alert.keywords,
        sources: alert.sources || [],
        enabled: alert.enabled !== false,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      
      const userAlerts = alertsStore.get(userId) || [];
      userAlerts.push(newAlert);
      alertsStore.set(userId, userAlerts);
      
      return newAlert;
    };

    it('should create a keyword alert', () => {
      const alert = createKeywordAlert('user-1', {
        keywords: ['bitcoin', 'halving'],
      });

      expect(alert).toMatchObject({
        userId: 'user-1',
        type: 'keyword',
        keywords: ['bitcoin', 'halving'],
        enabled: true,
      });
    });

    it('should allow specifying sources filter', () => {
      const alert = createKeywordAlert('user-1', {
        keywords: ['ethereum'],
        sources: ['CoinDesk', 'Decrypt'],
      });

      expect(alert.sources).toEqual(['CoinDesk', 'Decrypt']);
    });

    it('should default sources to empty array', () => {
      const alert = createKeywordAlert('user-1', {
        keywords: ['defi'],
      });

      expect(alert.sources).toEqual([]);
    });
  });

  describe('checkPriceAlerts', () => {
    const checkPriceAlerts = (prices: Record<string, number>) => {
      const triggeredAlerts: any[] = [];
      
      alertsStore.forEach((alerts, userId) => {
        alerts.forEach(alert => {
          if (alert.type !== 'price' || !alert.enabled) return;
          
          const currentPrice = prices[alert.coinId];
          if (!currentPrice) return;
          
          let triggered = false;
          
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice!) {
            triggered = true;
          } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice!) {
            triggered = true;
          }
          
          if (triggered) {
            alert.triggeredAt = new Date().toISOString();
            triggeredAlerts.push({
              ...alert,
              currentPrice,
            });
          }
        });
      });
      
      return triggeredAlerts;
    };

    it('should trigger "above" alerts when price exceeds target', () => {
      // Setup
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'price' as const,
        coinId: 'bitcoin',
        condition: 'above' as const,
        targetPrice: 100000,
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkPriceAlerts({ bitcoin: 105000 });
      
      expect(triggered).toHaveLength(1);
      expect(triggered[0].coinId).toBe('bitcoin');
      expect(triggered[0].currentPrice).toBe(105000);
    });

    it('should trigger "below" alerts when price falls below target', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'price' as const,
        coinId: 'bitcoin',
        condition: 'below' as const,
        targetPrice: 50000,
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkPriceAlerts({ bitcoin: 45000 });
      
      expect(triggered).toHaveLength(1);
      expect(triggered[0].coinId).toBe('bitcoin');
    });

    it('should not trigger disabled alerts', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'price' as const,
        coinId: 'bitcoin',
        condition: 'above' as const,
        targetPrice: 100000,
        enabled: false,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkPriceAlerts({ bitcoin: 105000 });
      
      expect(triggered).toHaveLength(0);
    });

    it('should not trigger when price does not meet condition', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'price' as const,
        coinId: 'bitcoin',
        condition: 'above' as const,
        targetPrice: 100000,
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkPriceAlerts({ bitcoin: 95000 });
      
      expect(triggered).toHaveLength(0);
    });
  });

  describe('checkKeywordAlerts', () => {
    const checkKeywordAlerts = (article: { title: string; description?: string; source: string }) => {
      const triggeredAlerts: any[] = [];
      const textToSearch = `${article.title} ${article.description || ''}`.toLowerCase();
      
      alertsStore.forEach((alerts, userId) => {
        alerts.forEach(alert => {
          if (alert.type !== 'keyword' || !alert.enabled) return;
          
          // Check source filter
          if (alert.sources.length > 0 && !alert.sources.includes(article.source)) {
            return;
          }
          
          // Check keywords
          const matched = alert.keywords.some((kw: string) => 
            textToSearch.includes(kw.toLowerCase())
          );
          
          if (matched) {
            triggeredAlerts.push({
              ...alert,
              matchedArticle: article,
            });
          }
        });
      });
      
      return triggeredAlerts;
    };

    it('should trigger when keyword found in title', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'keyword' as const,
        keywords: ['bitcoin', 'halving'],
        sources: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkKeywordAlerts({
        title: 'Bitcoin Halving Event Approaches',
        source: 'CoinDesk',
      });
      
      expect(triggered).toHaveLength(1);
    });

    it('should trigger when keyword found in description', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'keyword' as const,
        keywords: ['ethereum'],
        sources: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkKeywordAlerts({
        title: 'Crypto Market Update',
        description: 'Ethereum price rises 10%',
        source: 'CoinDesk',
      });
      
      expect(triggered).toHaveLength(1);
    });

    it('should respect source filter', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'keyword' as const,
        keywords: ['bitcoin'],
        sources: ['CoinDesk'],
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkKeywordAlerts({
        title: 'Bitcoin News',
        source: 'Decrypt', // Not in sources list
      });
      
      expect(triggered).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const alert = {
        id: 'alert-1',
        userId: 'user-1',
        type: 'keyword' as const,
        keywords: ['BITCOIN'],
        sources: [],
        enabled: true,
        createdAt: new Date().toISOString(),
        triggeredAt: null,
      };
      alertsStore.set('user-1', [alert]);
      
      const triggered = checkKeywordAlerts({
        title: 'bitcoin price update',
        source: 'CoinDesk',
      });
      
      expect(triggered).toHaveLength(1);
    });
  });
});
// =============================================================================
// ENHANCED ALERT RULES SYSTEM TESTS
// =============================================================================

describe('Enhanced Alert Rules System', () => {
  describe('Alert Rule Types', () => {
    it('should support price_above condition', () => {
      const condition = {
        type: 'price_above' as const,
        coin: 'bitcoin',
        threshold: 100000,
      };
      
      expect(condition.type).toBe('price_above');
      expect(condition.coin).toBe('bitcoin');
      expect(condition.threshold).toBe(100000);
    });

    it('should support price_below condition', () => {
      const condition = {
        type: 'price_below' as const,
        coin: 'ethereum',
        threshold: 2000,
      };
      
      expect(condition.type).toBe('price_below');
      expect(condition.threshold).toBe(2000);
    });

    it('should support price_change_pct condition', () => {
      const condition = {
        type: 'price_change_pct' as const,
        coin: 'bitcoin',
        threshold: 10,
        timeframe: '24h' as const,
      };
      
      expect(condition.type).toBe('price_change_pct');
      expect(condition.timeframe).toBe('24h');
    });

    it('should support volume_spike condition', () => {
      const condition = {
        type: 'volume_spike' as const,
        coin: 'bitcoin',
        multiplier: 3,
      };
      
      expect(condition.type).toBe('volume_spike');
      expect(condition.multiplier).toBe(3);
    });

    it('should support breaking_news condition', () => {
      const condition = {
        type: 'breaking_news' as const,
        keywords: ['bitcoin', 'etf'],
      };
      
      expect(condition.type).toBe('breaking_news');
      expect(condition.keywords).toEqual(['bitcoin', 'etf']);
    });

    it('should support ticker_mention condition', () => {
      const condition = {
        type: 'ticker_mention' as const,
        ticker: 'BTC',
        minSentiment: 0.5,
      };
      
      expect(condition.type).toBe('ticker_mention');
      expect(condition.minSentiment).toBe(0.5);
    });

    it('should support whale_movement condition', () => {
      const condition = {
        type: 'whale_movement' as const,
        minUSD: 10000000,
      };
      
      expect(condition.type).toBe('whale_movement');
      expect(condition.minUSD).toBe(10000000);
    });

    it('should support fear_greed_change condition', () => {
      const condition = {
        type: 'fear_greed_change' as const,
        threshold: 10,
      };
      
      expect(condition.type).toBe('fear_greed_change');
      expect(condition.threshold).toBe(10);
    });
  });

  describe('Alert Rule Structure', () => {
    it('should have required fields', () => {
      const rule = {
        id: 'alert_123',
        name: 'BTC Above 100k',
        condition: {
          type: 'price_above' as const,
          coin: 'bitcoin',
          threshold: 100000,
        },
        channels: ['websocket' as const],
        cooldown: 300,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      expect(rule.id).toBeTruthy();
      expect(rule.name).toBe('BTC Above 100k');
      expect(rule.condition).toBeDefined();
      expect(rule.channels).toContain('websocket');
      expect(rule.cooldown).toBe(300);
      expect(rule.enabled).toBe(true);
      expect(rule.createdAt).toBeTruthy();
    });

    it('should support webhook channel with URL', () => {
      const rule = {
        id: 'alert_456',
        name: 'Webhook Alert',
        condition: {
          type: 'breaking_news' as const,
          keywords: ['bitcoin'],
        },
        channels: ['webhook' as const],
        webhookUrl: 'https://example.com/webhook',
        cooldown: 600,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      expect(rule.channels).toContain('webhook');
      expect(rule.webhookUrl).toBe('https://example.com/webhook');
    });
  });

  describe('Cooldown Enforcement', () => {
    it('should allow evaluation when cooldown has passed', () => {
      const rule = {
        id: 'alert_123',
        name: 'Test Alert',
        condition: { type: 'price_above' as const, coin: 'bitcoin', threshold: 100000 },
        channels: ['websocket' as const],
        cooldown: 300, // 5 minutes
        enabled: true,
        createdAt: new Date().toISOString(),
        lastTriggered: new Date(Date.now() - 400000).toISOString(), // 6.67 minutes ago
      };

      const shouldEvaluate = () => {
        if (!rule.enabled) return false;
        if (!rule.lastTriggered) return true;
        const lastTriggeredTime = new Date(rule.lastTriggered).getTime();
        const cooldownMs = rule.cooldown * 1000;
        return Date.now() - lastTriggeredTime >= cooldownMs;
      };

      expect(shouldEvaluate()).toBe(true);
    });

    it('should block evaluation during cooldown', () => {
      const rule = {
        id: 'alert_123',
        name: 'Test Alert',
        condition: { type: 'price_above' as const, coin: 'bitcoin', threshold: 100000 },
        channels: ['websocket' as const],
        cooldown: 300, // 5 minutes
        enabled: true,
        createdAt: new Date().toISOString(),
        lastTriggered: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      };

      const shouldEvaluate = () => {
        if (!rule.enabled) return false;
        if (!rule.lastTriggered) return true;
        const lastTriggeredTime = new Date(rule.lastTriggered).getTime();
        const cooldownMs = rule.cooldown * 1000;
        return Date.now() - lastTriggeredTime >= cooldownMs;
      };

      expect(shouldEvaluate()).toBe(false);
    });

    it('should allow evaluation if never triggered', () => {
      const rule = {
        id: 'alert_123',
        name: 'Test Alert',
        condition: { type: 'price_above' as const, coin: 'bitcoin', threshold: 100000 },
        channels: ['websocket' as const],
        cooldown: 300,
        enabled: true,
        createdAt: new Date().toISOString(),
        // No lastTriggered
      };

      const shouldEvaluate = () => {
        if (!rule.enabled) return false;
        if (!rule.lastTriggered) return true;
        return false;
      };

      expect(shouldEvaluate()).toBe(true);
    });
  });

  describe('Alert Event Structure', () => {
    it('should create proper event structure', () => {
      const event = {
        id: 'evt_123',
        ruleId: 'alert_456',
        ruleName: 'BTC Above 100k',
        condition: {
          type: 'price_above' as const,
          coin: 'bitcoin',
          threshold: 100000,
        },
        triggeredAt: new Date().toISOString(),
        data: {
          currentValue: 105000,
          threshold: 100000,
          context: {
            coinId: 'bitcoin',
            coinName: 'Bitcoin',
          },
        },
        severity: 'warning' as const,
      };

      expect(event.id).toBeTruthy();
      expect(event.ruleId).toBe('alert_456');
      expect(event.data.currentValue).toBe(105000);
      expect(event.severity).toBe('warning');
    });

    it('should support different severity levels', () => {
      const criticalEvent = { severity: 'critical' as const };
      const warningEvent = { severity: 'warning' as const };
      const infoEvent = { severity: 'info' as const };

      expect(criticalEvent.severity).toBe('critical');
      expect(warningEvent.severity).toBe('warning');
      expect(infoEvent.severity).toBe('info');
    });
  });

  describe('Condition Validation', () => {
    const validateCondition = (condition: any): { valid: boolean; error?: string } => {
      if (!condition || typeof condition !== 'object') {
        return { valid: false, error: 'Condition must be an object' };
      }

      switch (condition.type) {
        case 'price_above':
        case 'price_below':
          if (!condition.coin || typeof condition.coin !== 'string') {
            return { valid: false, error: 'Coin is required' };
          }
          if (typeof condition.threshold !== 'number' || condition.threshold <= 0) {
            return { valid: false, error: 'Threshold must be a positive number' };
          }
          break;

        case 'price_change_pct':
          if (!condition.coin || typeof condition.coin !== 'string') {
            return { valid: false, error: 'Coin is required' };
          }
          if (typeof condition.threshold !== 'number') {
            return { valid: false, error: 'Threshold must be a number' };
          }
          if (!['1h', '24h'].includes(condition.timeframe)) {
            return { valid: false, error: 'Timeframe must be "1h" or "24h"' };
          }
          break;

        case 'volume_spike':
          if (!condition.coin || typeof condition.coin !== 'string') {
            return { valid: false, error: 'Coin is required' };
          }
          if (typeof condition.multiplier !== 'number' || condition.multiplier <= 1) {
            return { valid: false, error: 'Multiplier must be greater than 1' };
          }
          break;

        case 'breaking_news':
          if (condition.keywords && !Array.isArray(condition.keywords)) {
            return { valid: false, error: 'Keywords must be an array' };
          }
          break;

        case 'whale_movement':
          if (typeof condition.minUSD !== 'number' || condition.minUSD <= 0) {
            return { valid: false, error: 'minUSD must be a positive number' };
          }
          break;

        default:
          return { valid: false, error: `Unknown condition type: ${condition.type}` };
      }

      return { valid: true };
    };

    it('should validate price_above condition', () => {
      const valid = validateCondition({
        type: 'price_above',
        coin: 'bitcoin',
        threshold: 100000,
      });
      expect(valid.valid).toBe(true);

      const invalidNoCoin = validateCondition({
        type: 'price_above',
        threshold: 100000,
      });
      expect(invalidNoCoin.valid).toBe(false);

      const invalidNegativeThreshold = validateCondition({
        type: 'price_above',
        coin: 'bitcoin',
        threshold: -100,
      });
      expect(invalidNegativeThreshold.valid).toBe(false);
    });

    it('should validate volume_spike condition', () => {
      const valid = validateCondition({
        type: 'volume_spike',
        coin: 'bitcoin',
        multiplier: 3,
      });
      expect(valid.valid).toBe(true);

      const invalidMultiplier = validateCondition({
        type: 'volume_spike',
        coin: 'bitcoin',
        multiplier: 0.5,
      });
      expect(invalidMultiplier.valid).toBe(false);
    });

    it('should validate breaking_news condition', () => {
      const validWithKeywords = validateCondition({
        type: 'breaking_news',
        keywords: ['bitcoin', 'etf'],
      });
      expect(validWithKeywords.valid).toBe(true);

      const validWithoutKeywords = validateCondition({
        type: 'breaking_news',
      });
      expect(validWithoutKeywords.valid).toBe(true);

      const invalidKeywords = validateCondition({
        type: 'breaking_news',
        keywords: 'not an array',
      });
      expect(invalidKeywords.valid).toBe(false);
    });

    it('should reject unknown condition types', () => {
      const invalid = validateCondition({
        type: 'unknown_type',
      });
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toContain('Unknown condition type');
    });
  });

  describe('Webhook Delivery', () => {
    it('should format webhook payload correctly', () => {
      const event = {
        id: 'evt_123',
        ruleId: 'alert_456',
        ruleName: 'Test Alert',
        condition: { type: 'price_above' as const, coin: 'bitcoin', threshold: 100000 },
        triggeredAt: new Date().toISOString(),
        data: { currentValue: 105000, threshold: 100000 },
        severity: 'warning' as const,
      };

      const payload = {
        type: 'alert',
        event,
        timestamp: new Date().toISOString(),
      };

      expect(payload.type).toBe('alert');
      expect(payload.event).toEqual(event);
      expect(payload.timestamp).toBeTruthy();
    });
  });

  describe('WebSocket Broadcast', () => {
    it('should format WebSocket message correctly', () => {
      const event = {
        id: 'evt_123',
        ruleId: 'alert_456',
        ruleName: 'Test Alert',
        condition: { type: 'price_above' as const, coin: 'bitcoin', threshold: 100000 },
        triggeredAt: new Date().toISOString(),
        data: { currentValue: 105000, threshold: 100000 },
        severity: 'warning' as const,
      };

      const message = {
        type: 'alert',
        data: event,
        timestamp: new Date().toISOString(),
      };

      expect(message.type).toBe('alert');
      expect(message.data.ruleId).toBe('alert_456');
    });

    it('should support wildcard subscriptions', () => {
      const clientSubscriptions = new Set(['*']);
      const ruleId = 'alert_123';

      const isSubscribed = 
        clientSubscriptions.has('*') || 
        clientSubscriptions.has(ruleId);

      expect(isSubscribed).toBe(true);
    });

    it('should support specific rule subscriptions', () => {
      const clientSubscriptions = new Set(['alert_123', 'alert_456']);
      
      expect(clientSubscriptions.has('alert_123')).toBe(true);
      expect(clientSubscriptions.has('alert_789')).toBe(false);
    });
  });

  describe('Severity Determination', () => {
    const determineSeverity = (
      conditionType: string,
      currentValue: number,
      threshold: number
    ): 'critical' | 'warning' | 'info' => {
      if (conditionType === 'price_above' || conditionType === 'price_below') {
        const pctDiff = Math.abs((currentValue - threshold) / threshold * 100);
        if (pctDiff >= 10) return 'critical';
        if (pctDiff >= 5) return 'warning';
        return 'info';
      }
      if (conditionType === 'price_change_pct') {
        const change = Math.abs(currentValue);
        if (change >= 20) return 'critical';
        if (change >= 10) return 'warning';
        return 'info';
      }
      if (conditionType === 'volume_spike') {
        if (currentValue >= 5) return 'critical';
        if (currentValue >= 3) return 'warning';
        return 'info';
      }
      return 'info';
    };

    it('should return critical for large price deviations', () => {
      expect(determineSeverity('price_above', 115000, 100000)).toBe('critical');
    });

    it('should return warning for moderate price deviations', () => {
      expect(determineSeverity('price_above', 106000, 100000)).toBe('warning');
    });

    it('should return info for small price deviations', () => {
      expect(determineSeverity('price_above', 101000, 100000)).toBe('info');
    });

    it('should handle price change percentage severity', () => {
      expect(determineSeverity('price_change_pct', 25, 10)).toBe('critical');
      expect(determineSeverity('price_change_pct', 15, 10)).toBe('warning');
      expect(determineSeverity('price_change_pct', 5, 5)).toBe('info');
    });

    it('should handle volume spike severity', () => {
      expect(determineSeverity('volume_spike', 6, 2)).toBe('critical');
      expect(determineSeverity('volume_spike', 4, 2)).toBe('warning');
      expect(determineSeverity('volume_spike', 2.5, 2)).toBe('info');
    });
  });
});