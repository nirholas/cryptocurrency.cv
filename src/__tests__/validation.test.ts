/**
 * Schema Validation Tests
 * 
 * Tests for Zod schema validation across all API endpoints
 */

import { describe, it, expect } from 'vitest';
import { 
  newsQuerySchema, 
  v1CoinsQuerySchema,
  aiSignalsQuerySchema,
  breakingNewsQuerySchema,
  paginationSchema,
  coinIdSchema,
} from '@/lib/schemas';

describe('Schema Validation', () => {
  describe('newsQuerySchema', () => {
    it('should validate valid news query', () => {
      const result = newsQuerySchema.safeParse({
        limit: '10',
        category: 'bitcoin',
        lang: 'en',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.category).toBe('bitcoin');
      }
    });
    
    it('should reject invalid limit', () => {
      const result = newsQuerySchema.safeParse({
        limit: '999', // exceeds max
      });
      expect(result.success).toBe(false);
    });
    
    it('should reject invalid category', () => {
      const result = newsQuerySchema.safeParse({
        category: 'invalid-category',
      });
      expect(result.success).toBe(false);
    });
    
    it('should use defaults', () => {
      const result = newsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.lang).toBe('en');
        expect(result.data.page).toBe(1);
      }
    });
    
    it('should coerce string numbers to integers', () => {
      const result = newsQuerySchema.safeParse({
        limit: '25',
        page: '2',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.page).toBe(2);
      }
    });
  });
  
  describe('v1CoinsQuerySchema', () => {
    it('should validate valid coins query', () => {
      const result = v1CoinsQuerySchema.safeParse({
        page: '1',
        per_page: '100',
        order: 'market_cap_desc',
      });
      expect(result.success).toBe(true);
    });
    
    it('should reject per_page exceeding limit', () => {
      const result = v1CoinsQuerySchema.safeParse({
        per_page: '500', // exceeds max of 250
      });
      expect(result.success).toBe(false);
    });
    
    it('should accept valid order values', () => {
      const validOrders = [
        'market_cap_desc',
        'market_cap_asc',
        'volume_desc',
        'volume_asc',
        'id_asc',
        'id_desc',
      ];
      
      validOrders.forEach(order => {
        const result = v1CoinsQuerySchema.safeParse({ order });
        expect(result.success).toBe(true);
      });
    });
    
    it('should reject invalid order value', () => {
      const result = v1CoinsQuerySchema.safeParse({
        order: 'invalid-order',
      });
      expect(result.success).toBe(false);
    });
  });
  
  describe('aiSignalsQuerySchema', () => {
    it('should validate valid AI signals query', () => {
      const result = aiSignalsQuerySchema.safeParse({
        coin: 'bitcoin',
        timeframe: '1d',
      });
      expect(result.success).toBe(true);
    });
    
    it('should reject invalid coin ID format', () => {
      const result = aiSignalsQuerySchema.safeParse({
        coin: 'Bitcoin_123', // uppercase and underscore not allowed
      });
      expect(result.success).toBe(false);
    });
    
    it('should accept valid coin ID formats', () => {
      const validCoinIds = ['bitcoin', 'ethereum', 'binance-coin', 'usd-coin'];
      
      validCoinIds.forEach(coin => {
        const result = aiSignalsQuerySchema.safeParse({ coin });
        expect(result.success).toBe(true);
      });
    });
    
    it('should use default timeframe', () => {
      const result = aiSignalsQuerySchema.safeParse({
        coin: 'bitcoin',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timeframe).toBe('1d');
      }
    });
  });
  
  describe('breakingNewsQuerySchema', () => {
    it('should validate valid breaking news query', () => {
      const result = breakingNewsQuerySchema.safeParse({
        limit: '10',
        priority: 'high',
      });
      expect(result.success).toBe(true);
    });
    
    it('should reject limit exceeding max', () => {
      const result = breakingNewsQuerySchema.safeParse({
        limit: '100', // exceeds max of 50
      });
      expect(result.success).toBe(false);
    });
    
    it('should accept valid priority values', () => {
      const result1 = breakingNewsQuerySchema.safeParse({ priority: 'high' });
      const result2 = breakingNewsQuerySchema.safeParse({ priority: 'critical' });
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
  
  describe('paginationSchema', () => {
    it('should validate valid pagination', () => {
      const result = paginationSchema.safeParse({
        page: '2',
        per_page: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.per_page).toBe(50);
      }
    });
    
    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({
        page: '0',
      });
      expect(result.success).toBe(false);
    });
    
    it('should reject per_page exceeding max', () => {
      const result = paginationSchema.safeParse({
        per_page: '200', // exceeds max of 100
      });
      expect(result.success).toBe(false);
    });
  });
  
  describe('coinIdSchema', () => {
    it('should accept valid coin IDs', () => {
      const validIds = [
        'bitcoin',
        'ethereum',
        'binance-coin',
        'cardano',
        'solana',
        'polkadot',
      ];
      
      validIds.forEach(id => {
        const result = coinIdSchema.safeParse(id);
        expect(result.success).toBe(true);
      });
    });
    
    it('should reject invalid coin IDs', () => {
      const invalidIds = [
        'Bitcoin', // uppercase
        'bit_coin', // underscore
        'bit coin', // space
        'bitcoin!', // special char
        '', // empty
        'a'.repeat(51), // too long
      ];
      
      invalidIds.forEach(id => {
        const result = coinIdSchema.safeParse(id);
        expect(result.success).toBe(false);
      });
    });
  });
});
