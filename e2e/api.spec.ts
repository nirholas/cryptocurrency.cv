/**
 * @fileoverview E2E Tests for API Endpoints
 */

import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test.describe('GET /api/news', () => {
    test('should return news articles', async ({ request }) => {
      const response = await request.get('/api/news');
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('articles');
      expect(Array.isArray(data.articles)).toBeTruthy();
    });

    test('should support pagination', async ({ request }) => {
      const response = await request.get('/api/news?page=1&limit=5');
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.articles.length).toBeLessThanOrEqual(5);
    });

    test('should filter by source', async ({ request }) => {
      const response = await request.get('/api/news?source=coindesk');
      
      if (response.ok()) {
        const data = await response.json();
        // All articles should be from CoinDesk
        for (const article of data.articles) {
          expect(article.source.toLowerCase()).toContain('coindesk');
        }
      }
    });

    test('should filter by category', async ({ request }) => {
      const response = await request.get('/api/news?category=bitcoin');
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('GET /api/search', () => {
    test('should search articles', async ({ request }) => {
      const response = await request.get('/api/search?q=bitcoin');
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('articles');
    });

    test('should return empty for no matches', async ({ request }) => {
      const response = await request.get('/api/search?q=xyznonexistentquery12345');
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.articles.length).toBe(0);
    });
  });

  test.describe('GET /api/sources', () => {
    test('should return available sources', async ({ request }) => {
      const response = await request.get('/api/sources');
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('sources');
      expect(Array.isArray(data.sources)).toBeTruthy();
      expect(data.sources.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/trending', () => {
    test('should return trending articles', async ({ request }) => {
      const response = await request.get('/api/trending');
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('articles');
    });
  });

  test.describe('GET /api/breaking', () => {
    test('should return breaking news', async ({ request }) => {
      const response = await request.get('/api/breaking');
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('articles');
    });
  });

  test.describe('Content-Type Headers', () => {
    test('should return JSON content type', async ({ request }) => {
      const response = await request.get('/api/news');
      
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  test.describe('CORS Headers', () => {
    test('should have CORS headers', async ({ request }) => {
      const response = await request.get('/api/news');
      
      // CORS headers should be present for public API
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).toBeDefined();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid parameters gracefully', async ({ request }) => {
      const response = await request.get('/api/news?page=-1');
      
      // Should either handle gracefully or return error
      expect([200, 400]).toContain(response.status());
    });

    test('should return 404 for unknown endpoints', async ({ request }) => {
      const response = await request.get('/api/nonexistent');
      
      expect(response.status()).toBe(404);
    });
  });
});

test.describe('Newsletter API', () => {
  test('should accept valid email subscription', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: { email: 'test@example.com' },
    });
    
    // Should either succeed or indicate already subscribed
    expect([200, 201, 409]).toContain(response.status());
  });

  test('should reject invalid email', async ({ request }) => {
    const response = await request.post('/api/newsletter', {
      data: { email: 'invalid-email' },
    });
    
    expect(response.status()).toBe(400);
  });
});

test.describe('SSE Endpoint', () => {
  test('should return event stream', async ({ request }) => {
    const response = await request.get('/api/sse');
    
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/event-stream');
  });
});
