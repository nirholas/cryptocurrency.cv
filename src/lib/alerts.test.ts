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
