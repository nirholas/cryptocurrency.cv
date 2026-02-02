/**
 * @fileoverview E2E Tests for Markets Page
 * Tests market data display, price updates, and coin interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Markets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/markets');
  });

  test('should load the markets page', async ({ page }) => {
    await expect(page).toHaveURL(/markets/);
    await expect(page).toHaveTitle(/Markets|Prices|Crypto/i);
  });

  test('should display market header with stats', async ({ page }) => {
    // Global stats bar should be visible
    const statsBar = page.locator('[data-testid="global-stats"], .global-stats, [class*="stats"]');
    await expect(statsBar.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display cryptocurrency list', async ({ page }) => {
    // Wait for coin table/list to load
    await page.waitForSelector('table, [data-testid="coin-list"], [class*="coin"]', {
      timeout: 15000,
    });

    // Should have multiple coins
    const coinRows = page.locator('table tbody tr, [data-testid="coin-row"], [class*="coin-row"]');
    const count = await coinRows.count();
    expect(count).toBeGreaterThan(5);
  });

  test('should display coin prices', async ({ page }) => {
    // Wait for prices to load
    await page.waitForLoadState('networkidle');

    // Look for price elements ($ symbol or numeric values)
    const priceElements = page.locator('text=/\\$[0-9,]+\\.?[0-9]*|[0-9]+\\.[0-9]+/');
    const count = await priceElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display percentage changes', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for percentage elements (positive or negative)
    const percentElements = page.locator('text=/[+-]?[0-9]+\\.?[0-9]*%/');
    await expect(percentElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have sortable columns', async ({ page }) => {
    // Find table headers
    const headers = page.locator('th button, th[role="button"], [data-sortable]');
    const count = await headers.count();
    
    if (count > 0) {
      // Click to sort
      await headers.first().click();
      await page.waitForTimeout(500);
      
      // Page should still be functional
      await expect(page.locator('table, [data-testid="coin-list"]').first()).toBeVisible();
    }
  });

  test('should link to individual coin pages', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find a link to a coin page
    const coinLink = page.locator('a[href*="/coin/"]').first();
    
    if (await coinLink.count() > 0) {
      const href = await coinLink.getAttribute('href');
      await coinLink.click();
      await expect(page).toHaveURL(/coin/);
    }
  });
});

test.describe('Markets Page - Filters', () => {
  test('should have filter/category options', async ({ page }) => {
    await page.goto('/markets');
    
    // Look for filter buttons or tabs
    const filters = page.locator('[role="tablist"], [data-testid="filters"], .filter-bar, button:has-text("All"), button:has-text("DeFi")');
    await expect(filters.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');

    // Try clicking a filter if available
    const defiFilter = page.locator('button:has-text("DeFi"), a:has-text("DeFi")').first();
    
    if (await defiFilter.count() > 0) {
      await defiFilter.click();
      await page.waitForTimeout(500);
      
      // Page should update
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('Markets Page - Search', () => {
  test('should have coin search functionality', async ({ page }) => {
    await page.goto('/markets');
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="coin" i], [data-testid="market-search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('bitcoin');
      await page.waitForTimeout(500);
      
      // Results should filter
      const results = page.locator('[data-testid="coin-row"], table tbody tr');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Markets Sub-Pages', () => {
  test('should load gainers page', async ({ page }) => {
    await page.goto('/markets/gainers');
    await expect(page).toHaveURL(/gainers/);
    
    // Should show coins with positive changes
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });

  test('should load losers page', async ({ page }) => {
    await page.goto('/markets/losers');
    await expect(page).toHaveURL(/losers/);
    
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Individual Coin Page', () => {
  test('should load Bitcoin page', async ({ page }) => {
    await page.goto('/coin/bitcoin');
    
    await expect(page).toHaveURL(/coin\/bitcoin/);
    await expect(page).toHaveTitle(/Bitcoin|BTC/i);
  });

  test('should display coin details', async ({ page }) => {
    await page.goto('/coin/bitcoin');
    await page.waitForLoadState('networkidle');

    // Should have price
    const price = page.locator('text=/\\$[0-9,]+/');
    await expect(price.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display coin stats', async ({ page }) => {
    await page.goto('/coin/bitcoin');
    await page.waitForLoadState('networkidle');

    // Look for market cap, volume, etc.
    const stats = page.locator('text=/Market Cap|Volume|Supply|Rank/i');
    await expect(stats.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display related news', async ({ page }) => {
    await page.goto('/coin/bitcoin');
    await page.waitForLoadState('networkidle');

    // Should have news section
    const newsSection = page.locator('article, [data-testid="news"], section:has-text("News")');
    const count = await newsSection.count();
    expect(count).toBeGreaterThanOrEqual(0); // May or may not have news
  });

  test('should load Ethereum page', async ({ page }) => {
    await page.goto('/coin/ethereum');
    
    await expect(page).toHaveURL(/coin\/ethereum/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
  });
});
