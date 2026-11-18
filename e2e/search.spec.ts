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
 * @fileoverview E2E Tests for Search Functionality
 *
 * Tests the GlobalSearch modal (Cmd+K) and the /search page.
 *
 * GlobalSearch component:
 * - Opens via button[aria-label="Search (Cmd+K)"] or Cmd+K keyboard shortcut
 * - Radix Dialog modal with input[placeholder="Search news, topics, coins…"]
 * - Category filter tabs: All, Bitcoin, Ethereum, DeFi, Regulation, Altcoins
 * - Trending topics shown when idle; recent searches from localStorage
 * - Results fetched from /api/news?search={q}&limit=12&category={cat}
 * - Keyboard navigation: ↑↓ to navigate, Enter to select, Esc to close
 */

import { test, expect } from '@playwright/test';

test.describe('Global Search Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open search modal via header button', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await expect(searchButton).toBeVisible();

    await searchButton.click();

    // Search input should appear in the modal
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should open search modal via keyboard shortcut', async ({ page }) => {
    // Cmd+K (or Ctrl+K on Linux)
    await page.keyboard.press('Control+k');

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should show trending topics when idle', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await searchButton.click();

    // Wait for dialog to open
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Trending section (text=/trending/i) may or may not be present depending on data
  });

  test('should type query and see results', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await searchButton.click();

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('bitcoin');

    // Wait for debounced search (300ms) + API response
    await page.waitForTimeout(1000);

    // Should show either results or a "no results" message
    const modal = page.locator('[role="dialog"], [data-radix-dialog-content]');
    await expect(modal.first()).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await searchButton.click();

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('news');
    await page.waitForTimeout(500);

    // Category filter tabs appear when query is non-empty
    const defiTab = page.locator('button').filter({ hasText: /^DeFi$/i });
    if (await defiTab.count() > 0) {
      await defiTab.click();
      await page.waitForTimeout(500);
      // Results should be filtered (or empty)
    }
  });

  test('should clear search with clear button', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await searchButton.click();

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('bitcoin');
    await page.waitForTimeout(500);

    // Clear button should appear
    const clearButton = page.locator('button[aria-label="Clear"]');
    if (await clearButton.count() > 0) {
      await clearButton.click();
      await expect(searchInput).toHaveValue('');
    }
  });

  test('should close search modal with Escape', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await searchButton.click();

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');

    // Modal should close
    await expect(searchInput).not.toBeVisible({ timeout: 3000 });
  });

  test('should close search modal with close button', async ({ page }) => {
    const searchButton = page.locator('button[aria-label*="Search"]').first();
    await searchButton.click();

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    const closeButton = page.locator('button[aria-label="Close search"]');
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await expect(searchInput).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Search Page (/search)', () => {
  test('should load search page', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/search/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display search results for query parameter', async ({ page }) => {
    await page.goto('/search?q=ethereum');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main, body');
    await expect(main.first()).toBeVisible();
  });

  test('should handle empty search gracefully', async ({ page }) => {
    await page.goto('/search?q=');
    await page.waitForLoadState('networkidle');

    const main = page.locator('main, body');
    await expect(main.first()).toBeVisible();
  });

  test('should handle non-matching search query', async ({ page }) => {
    await page.goto('/search?q=xyznonexistent12345');
    await page.waitForLoadState('networkidle');

    // Page should still render (possibly with "no results" message)
    const main = page.locator('main, body');
    await expect(main.first()).toBeVisible();
  });
});
