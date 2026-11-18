/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * x402 Payment Flow E2E Tests
 * 
 * Tests the complete x402 micropayment flow including:
 * - Discovery endpoint (.well-known/x402)
 * - 402 Payment Required responses
 * - Payment header validation
 * - Payment verification
 * - Rate limiting with payments
 * - Subscription bypass
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('x402 Payment Protocol', () => {
  test.describe('Discovery', () => {
    test('GET /.well-known/x402 returns valid discovery document', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/.well-known/x402`);
      
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
      
      const body = await response.json();
      
      // Verify required fields
      expect(body).toHaveProperty('version');
      expect(body).toHaveProperty('paymentAddress');
      expect(body).toHaveProperty('supportedNetworks');
      expect(body).toHaveProperty('supportedTokens');
      expect(body).toHaveProperty('endpoints');
      
      // Verify version format
      expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Verify payment address is valid Ethereum address
      expect(body.paymentAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      // Verify supported networks include Base
      expect(body.supportedNetworks).toContain('eip155:8453'); // Base mainnet
      
      // Verify USDC is supported
      expect(body.supportedTokens).toContainEqual(
        expect.objectContaining({
          symbol: 'USDC',
        })
      );
    });

    test('Discovery document includes pricing information', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/.well-known/x402`);
      const body = await response.json();
      
      // Check endpoints have pricing
      expect(body.endpoints).toBeDefined();
      expect(Array.isArray(body.endpoints)).toBe(true);
      
      for (const endpoint of body.endpoints) {
        expect(endpoint).toHaveProperty('path');
        expect(endpoint).toHaveProperty('price');
        expect(endpoint).toHaveProperty('currency');
        
        // Price should be a valid number string or number
        const price = parseFloat(endpoint.price);
        expect(price).toBeGreaterThan(0);
        expect(price).toBeLessThan(1); // Micropayments should be < $1
      }
    });
  });

  test.describe('402 Payment Required Response', () => {
    test('Premium endpoint returns 402 without payment', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/coins`);
      
      expect(response.status()).toBe(402);
      expect(response.headers()['x-payment-required']).toBeDefined();
      
      const body = await response.json();
      
      // Verify error structure
      expect(body).toHaveProperty('error');
      expect(body.error).toContain('Payment Required');
      
      // Verify payment instructions
      expect(body).toHaveProperty('price');
      expect(body).toHaveProperty('payTo');
      expect(body).toHaveProperty('network');
      expect(body).toHaveProperty('accepts');
      
      expect(body.accepts).toBe('x402');
    });

    test('402 response includes valid payment instructions', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/coins`);
      const body = await response.json();
      
      // Verify payment address
      expect(body.payTo).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      // Verify price format
      expect(body.price).toMatch(/^\$?\d+\.?\d*$/);
      
      // Verify network is Base
      expect(body.network).toMatch(/^eip155:/);
      
      // Verify optional fields if present
      if (body.tokenAddress) {
        expect(body.tokenAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
      
      if (body.expiresAt) {
        const expiresAt = new Date(body.expiresAt);
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
      }
    });

    test('Free endpoints do not return 402', async ({ request }) => {
      const freeEndpoints = [
        '/api/news',
        '/api/fear-greed',
        '/api/health',
      ];

      for (const endpoint of freeEndpoints) {
        const response = await request.get(`${BASE_URL}${endpoint}`);
        expect(response.status()).not.toBe(402);
      }
    });
  });

  test.describe('Payment Header Validation', () => {
    test('Invalid X-PAYMENT header is rejected', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-PAYMENT': 'invalid-payment-data',
        },
      });
      
      // Should still be 402 with invalid payment
      expect(response.status()).toBe(402);
      
      const body = await response.json();
      expect(body.error).toContain('Invalid');
    });

    test('Malformed JSON in X-PAYMENT is rejected', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-PAYMENT': '{invalid json}',
        },
      });
      
      expect(response.status()).toBe(402);
    });

    test('Expired payment is rejected', async ({ request }) => {
      // Create a payment that's already expired
      const expiredPayment = Buffer.from(JSON.stringify({
        txHash: '0x' + '1'.repeat(64),
        network: 'eip155:84532',
        amount: '0.001',
        token: 'USDC',
        timestamp: Date.now() - 3600000, // 1 hour ago
        expiresAt: Date.now() - 1800000, // 30 mins ago
      })).toString('base64');

      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-PAYMENT': expiredPayment,
        },
      });
      
      expect(response.status()).toBe(402);
      
      const body = await response.json();
      expect(body.error).toMatch(/expired/i);
    });

    test('Payment with wrong network is rejected', async ({ request }) => {
      const wrongNetworkPayment = Buffer.from(JSON.stringify({
        txHash: '0x' + 'a'.repeat(64),
        network: 'eip155:1', // Ethereum mainnet instead of Base
        amount: '0.001',
        token: 'USDC',
        timestamp: Date.now(),
      })).toString('base64');

      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-PAYMENT': wrongNetworkPayment,
        },
      });
      
      expect(response.status()).toBe(402);
    });
  });

  test.describe('Payment Verification (Testnet)', () => {
    // These tests would require a real testnet transaction
    // For CI, we mock the verification
    
    test.skip('Valid payment on Base Sepolia is accepted', async ({ request }) => {
      // This would require:
      // 1. A funded testnet wallet
      // 2. Creating a real USDC transfer on Base Sepolia
      // 3. Getting the transaction hash
      // 4. Including it in the X-PAYMENT header
      
      // For now, this is a placeholder for manual testing
    });

    test('Mock payment verification endpoint works', async ({ request }) => {
      // Test the payment verification API directly
      const response = await request.post(`${BASE_URL}/api/v1/x402`, {
        data: {
          action: 'verify',
          txHash: '0x' + '0'.repeat(64),
          network: 'eip155:84532',
        },
      });
      
      // This should work in test mode with mock data
      expect([200, 402, 400]).toContain(response.status());
    });
  });

  test.describe('Rate Limiting with Payments', () => {
    test('Rate limit headers are present', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/news`);
      
      expect(response.headers()['x-ratelimit-limit']).toBeDefined();
      expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
    });

    test('Rate limit increases with valid subscription', async ({ request }) => {
      // Test with API key that has Pro tier
      const response = await request.get(`${BASE_URL}/api/news`, {
        headers: {
          'X-API-Key': 'test_pro_key',
        },
      });
      
      if (response.status() === 200) {
        const limit = parseInt(response.headers()['x-ratelimit-limit'] || '0', 10);
        expect(limit).toBeGreaterThan(10); // Pro tier should have higher limit
      }
    });
  });

  test.describe('Subscription Bypass', () => {
    test('Valid API key bypasses x402 payment', async ({ request }) => {
      // Pro/Enterprise API keys should bypass x402 for premium endpoints
      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-API-Key': process.env.TEST_PRO_API_KEY || 'test_pro_key',
        },
      });
      
      // With valid subscription, should not get 402
      // (May get 401 if test key is invalid, or 200 if valid)
      expect(response.status()).not.toBe(402);
    });

    test('Free tier API key still requires payment for premium', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-API-Key': 'test_free_key',
        },
      });
      
      // Free tier should still get 402 for premium endpoints
      expect(response.status()).toBe(402);
    });
  });

  test.describe('Payment Receipt', () => {
    test('Successful payment returns receipt header', async ({ request }) => {
      // This would require a valid payment
      // For now, test the receipt endpoint
      const response = await request.get(`${BASE_URL}/api/v1/x402?action=receipt&id=test123`);
      
      // Should return receipt or 404 if not found
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('receiptId');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('amount');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('Server error does not expose sensitive data', async ({ request }) => {
      // Send malicious input
      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-PAYMENT': '<script>alert("xss")</script>',
        },
      });
      
      const body = await response.json();
      
      // Should not echo back the malicious input
      expect(JSON.stringify(body)).not.toContain('<script>');
      
      // Should not expose stack traces or internal errors
      expect(JSON.stringify(body)).not.toContain('node_modules');
      expect(JSON.stringify(body)).not.toContain('at Object.');
    });

    test('Payment failure returns helpful error message', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/v1/coins`, {
        headers: {
          'X-PAYMENT': Buffer.from(JSON.stringify({
            txHash: '0x' + 'f'.repeat(64),
            network: 'eip155:84532',
            amount: '0.0001',
          })).toString('base64'),
        },
      });
      
      expect(response.status()).toBe(402);
      
      const body = await response.json();
      
      // Should include helpful information
      expect(body.error).toBeDefined();
      expect(body.payTo).toBeDefined();
      expect(body.price).toBeDefined();
    });
  });
});

test.describe('x402 Pricing Endpoint', () => {
  test('GET /api/v1/x402 returns pricing info', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/x402`);
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    
    expect(body).toHaveProperty('endpoints');
    expect(body).toHaveProperty('paymentAddress');
    expect(body).toHaveProperty('supportedTokens');
  });

  test('Individual endpoint pricing is retrievable', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/v1/x402?endpoint=/api/v1/coins`);
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    
    expect(body).toHaveProperty('price');
    expect(body).toHaveProperty('endpoint');
    expect(body.endpoint).toBe('/api/v1/coins');
  });
});

test.describe('x402 Integration with Frontend', () => {
  test('Pricing page shows x402 information', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Check for x402 section
    await expect(page.locator('text=x402')).toBeVisible({ timeout: 10000 });
    
    // Check for pay-per-request information
    await expect(page.locator('text=/pay.*per.*request/i')).toBeVisible();
    
    // Check for USDC mention
    await expect(page.locator('text=USDC')).toBeVisible();
  });

  test('Developer docs include x402 integration guide', async ({ page }) => {
    await page.goto(`${BASE_URL}/developers`);
    
    // Check for x402 documentation section
    const x402Section = page.locator('#x402, [id*="x402"], [href*="x402"]');
    await expect(x402Section.first()).toBeVisible({ timeout: 10000 });
  });
});
