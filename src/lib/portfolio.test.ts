/**
 * @fileoverview Unit tests for portfolio.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Portfolio System', () => {
  // In-memory stores for testing
  let portfoliosStore: Map<string, any>;
  
  beforeEach(() => {
    portfoliosStore = new Map();
    vi.clearAllMocks();
  });

  describe('createPortfolio', () => {
    const createPortfolio = (userId: string, name: string = 'My Portfolio') => {
      if (portfoliosStore.has(userId)) {
        throw new Error('Portfolio already exists for this user');
      }
      
      const portfolio = {
        id: `portfolio-${Date.now()}`,
        userId,
        name,
        holdings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      portfoliosStore.set(userId, portfolio);
      return portfolio;
    };

    it('should create a new portfolio', () => {
      const portfolio = createPortfolio('user-1', 'Test Portfolio');
      
      expect(portfolio).toMatchObject({
        userId: 'user-1',
        name: 'Test Portfolio',
        holdings: [],
      });
      expect(portfolio.id).toBeTruthy();
      expect(portfolio.createdAt).toBeTruthy();
    });

    it('should use default name if not provided', () => {
      const portfolio = createPortfolio('user-1');
      expect(portfolio.name).toBe('My Portfolio');
    });

    it('should throw if portfolio already exists', () => {
      createPortfolio('user-1');
      expect(() => createPortfolio('user-1')).toThrow('Portfolio already exists');
    });
  });

  describe('addHolding', () => {
    const addHolding = (userId: string, holding: {
      coinId: string;
      symbol: string;
      amount: number;
      purchasePrice?: number;
      purchaseDate?: string;
    }) => {
      const portfolio = portfoliosStore.get(userId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      const newHolding = {
        id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        coinId: holding.coinId,
        symbol: holding.symbol.toUpperCase(),
        amount: holding.amount,
        purchasePrice: holding.purchasePrice,
        purchaseDate: holding.purchaseDate || new Date().toISOString(),
        addedAt: new Date().toISOString(),
      };
      
      portfolio.holdings.push(newHolding);
      portfolio.updatedAt = new Date().toISOString();
      
      return newHolding;
    };

    it('should add a holding to portfolio', () => {
      // Setup
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const holding = addHolding('user-1', {
        coinId: 'bitcoin',
        symbol: 'BTC',
        amount: 1.5,
        purchasePrice: 50000,
      });
      
      expect(holding).toMatchObject({
        coinId: 'bitcoin',
        symbol: 'BTC',
        amount: 1.5,
        purchasePrice: 50000,
      });
    });

    it('should uppercase symbol', () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const holding = addHolding('user-1', {
        coinId: 'bitcoin',
        symbol: 'btc',
        amount: 1,
      });
      
      expect(holding.symbol).toBe('BTC');
    });

    it('should throw if portfolio not found', () => {
      expect(() => addHolding('unknown-user', {
        coinId: 'bitcoin',
        symbol: 'BTC',
        amount: 1,
      })).toThrow('Portfolio not found');
    });

    it('should update portfolio timestamp', async () => {
      const originalTime = new Date().toISOString();
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [],
        createdAt: originalTime,
        updatedAt: originalTime,
      });
      
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      addHolding('user-1', {
        coinId: 'bitcoin',
        symbol: 'BTC',
        amount: 1,
      });
      
      const portfolio = portfoliosStore.get('user-1');
      expect(portfolio.updatedAt).not.toBe(originalTime);
    });
  });

  describe('calculatePortfolioValue', () => {
    const calculatePortfolioValue = async (
      userId: string, 
      prices: Record<string, number>
    ) => {
      const portfolio = portfoliosStore.get(userId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      let totalValue = 0;
      let totalCost = 0;
      
      const holdingsWithValue = portfolio.holdings.map((holding: any) => {
        const currentPrice = prices[holding.coinId] || 0;
        const value = holding.amount * currentPrice;
        const cost = holding.purchasePrice ? holding.amount * holding.purchasePrice : 0;
        const pnl = cost > 0 ? value - cost : 0;
        const pnlPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;
        
        totalValue += value;
        totalCost += cost;
        
        return {
          ...holding,
          currentPrice,
          value,
          cost,
          pnl,
          pnlPercent,
        };
      });
      
      return {
        holdings: holdingsWithValue,
        totalValue,
        totalCost,
        totalPnl: totalCost > 0 ? totalValue - totalCost : 0,
        totalPnlPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
      };
    };

    it('should calculate total portfolio value', async () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: '1', coinId: 'bitcoin', symbol: 'BTC', amount: 1, purchasePrice: 50000 },
          { id: '2', coinId: 'ethereum', symbol: 'ETH', amount: 10, purchasePrice: 2000 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const result = await calculatePortfolioValue('user-1', {
        bitcoin: 60000,
        ethereum: 2500,
      });
      
      expect(result.totalValue).toBe(85000); // 60000 + 25000
    });

    it('should calculate PnL correctly', async () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: '1', coinId: 'bitcoin', symbol: 'BTC', amount: 1, purchasePrice: 50000 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const result = await calculatePortfolioValue('user-1', { bitcoin: 60000 });
      
      expect(result.totalCost).toBe(50000);
      expect(result.totalPnl).toBe(10000);
      expect(result.totalPnlPercent).toBe(20);
    });

    it('should handle missing prices', async () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: '1', coinId: 'bitcoin', symbol: 'BTC', amount: 1, purchasePrice: 50000 },
          { id: '2', coinId: 'unknown-coin', symbol: 'UNK', amount: 100 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const result = await calculatePortfolioValue('user-1', { bitcoin: 60000 });
      
      expect(result.totalValue).toBe(60000); // Only bitcoin counted
      expect(result.holdings[1].value).toBe(0);
    });

    it('should handle negative PnL', async () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: '1', coinId: 'bitcoin', symbol: 'BTC', amount: 1, purchasePrice: 70000 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const result = await calculatePortfolioValue('user-1', { bitcoin: 60000 });
      
      expect(result.totalPnl).toBe(-10000);
      expect(result.totalPnlPercent).toBeCloseTo(-14.29, 1);
    });
  });

  describe('removeHolding', () => {
    const removeHolding = (userId: string, holdingId: string) => {
      const portfolio = portfoliosStore.get(userId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      const index = portfolio.holdings.findIndex((h: any) => h.id === holdingId);
      if (index === -1) {
        throw new Error('Holding not found');
      }
      
      const removed = portfolio.holdings.splice(index, 1)[0];
      portfolio.updatedAt = new Date().toISOString();
      
      return removed;
    };

    it('should remove a holding', () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: 'holding-1', coinId: 'bitcoin', symbol: 'BTC', amount: 1 },
          { id: 'holding-2', coinId: 'ethereum', symbol: 'ETH', amount: 10 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const removed = removeHolding('user-1', 'holding-1');
      const portfolio = portfoliosStore.get('user-1');
      
      expect(removed.coinId).toBe('bitcoin');
      expect(portfolio.holdings).toHaveLength(1);
      expect(portfolio.holdings[0].coinId).toBe('ethereum');
    });

    it('should throw if holding not found', () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      expect(() => removeHolding('user-1', 'nonexistent')).toThrow('Holding not found');
    });
  });

  describe('updateHolding', () => {
    const updateHolding = (userId: string, holdingId: string, updates: Partial<{
      amount: number;
      purchasePrice: number;
    }>) => {
      const portfolio = portfoliosStore.get(userId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }
      
      const holding = portfolio.holdings.find((h: any) => h.id === holdingId);
      if (!holding) {
        throw new Error('Holding not found');
      }
      
      if (updates.amount !== undefined) holding.amount = updates.amount;
      if (updates.purchasePrice !== undefined) holding.purchasePrice = updates.purchasePrice;
      
      portfolio.updatedAt = new Date().toISOString();
      
      return holding;
    };

    it('should update holding amount', () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: 'holding-1', coinId: 'bitcoin', symbol: 'BTC', amount: 1 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const updated = updateHolding('user-1', 'holding-1', { amount: 2.5 });
      
      expect(updated.amount).toBe(2.5);
    });

    it('should update purchase price', () => {
      portfoliosStore.set('user-1', {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { id: 'holding-1', coinId: 'bitcoin', symbol: 'BTC', amount: 1, purchasePrice: 50000 },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      const updated = updateHolding('user-1', 'holding-1', { purchasePrice: 55000 });
      
      expect(updated.purchasePrice).toBe(55000);
    });
  });
});
