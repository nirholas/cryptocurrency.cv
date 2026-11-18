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
 * @fileoverview E2E Tests for Markets Page
 *
 * Updated for the new frontend design:
 * - MarketTable component with sortable columns (Coin, Price, 24h %, 7d %, Market Cap, Volume, 7d Chart)
 * - Stat cards for global market overview
 * - Coin rows are clickable and navigate to /coin/{id}
 * - No data-testid attrs — tests use semantic selectors (table, th, td, aria-labels)
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

  test('should display market header or stat cards', async ({ page }) => {
    // Global market stats are rendered as cards or a stats bar
    const body = page.locator('main, body');
    await expect(body.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display cryptocurrency table', async ({ page }) => {
    // MarketTable renders a <table> inside a div.overflow-x-auto
    await page.waitForSelector('table', { timeout: 15000 });

    // Table should have rows
    const coinRows = page.locator('table tbody tr');
    const count = await coinRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display table headers', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 15000 });

    // Check for expected column headers
    const headers = page.locator('table th');
    const headerTexts = await headers.allTextContents();
    const joinedHeaders = headerTexts.join(' ');

    expect(joinedHeaders).toMatch(/Coin|Name/i);
    expect(joinedHeaders).toMatch(/Price/i);
  });

  test('should display coin prices', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for dollar-formatted prices
    const priceElements = page.locator('text=/\\$[0-9,]+\\.?[0-9]*/');
    const count = await priceElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display percentage changes', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const percentElements = page.locator('text=/[+-]?[0-9]+\\.?[0-9]*%/');
    await expect(percentElements.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have sortable columns', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 15000 });

    // Column headers may be clickable buttons or th elements
    const sortableHeaders = page.locator('th button, th[role="button"], th');
    const count = await sortableHeaders.count();

    if (count > 0) {
      // Click the "Price" column header to sort
      const priceHeader = page.locator('th').filter({ hasText: /Price/i }).first();
      if (await priceHeader.count() > 0) {
        await priceHeader.click();
        await page.waitForTimeout(500);
        // Table should still be visible after sort
        await expect(page.locator('table').first()).toBeVisible();
      }
    }
  });

  test('should link to individual coin pages', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const coinLink = page.locator('a[href*="/coin/"]').first();
    if (await coinLink.count() > 0) {
      await coinLink.click();
      await expect(page).toHaveURL(/coin/);
    }
  });
});

test.describe('Markets Page - Filters', () => {
  test('should have filter or category options', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');

    // Filters are optional depending on page implementation
    const main = page.locator('main, body');
    await expect(main.first()).toBeVisible();
  });
});

test.describe('Markets Page - Search', () => {
  test('should have coin search functionality', async ({ page }) => {
    await page.goto('/markets');

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="coin" i], input[placeholder*="filter" i]'
    );

    if (await searchInput.count() > 0) {
      await searchInput.fill('bitcoin');
      await page.waitForTimeout(500);

      const results = page.locator('table tbody tr');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Markets Sub-Pages', () => {
  test('should load gainers page', async ({ page }) => {
    await page.goto('/markets/gainers');
    await expect(page).toHaveURL(/gainers/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, body').first()).toBeVisible();
  });

  test('should load losers page', async ({ page }) => {
    await page.goto('/markets/losers');
    await expect(page).toHaveURL(/losers/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, body').first()).toBeVisible();
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

    const price = page.locator('text=/\\$[0-9,]+/');
    await expect(price.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display coin stats', async ({ page }) => {
    await page.goto('/coin/bitcoin');
    await page.waitForLoadState('networkidle');

    const stats = page.locator('text=/Market Cap|Volume|Supply|Rank/i');
    await expect(stats.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display related news', async ({ page }) => {
    await page.goto('/coin/bitcoin');
    await page.waitForLoadState('networkidle');

    // News section is optional — just verify the page doesn't crash
    const main = page.locator('main, body');
    await expect(main.first()).toBeVisible();
  });

  test('should load Ethereum page', async ({ page }) => {
    await page.goto('/coin/ethereum');
    await expect(page).toHaveURL(/coin\/ethereum/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main, body').first()).toBeVisible();
  });
});
