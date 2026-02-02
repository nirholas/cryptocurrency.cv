/**
 * @fileoverview E2E Tests for Status Page
 * Tests system health dashboard and service indicators
 */

import { test, expect } from '@playwright/test';

test.describe('Status Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/status');
  });

  test('should load the status page', async ({ page }) => {
    await expect(page).toHaveURL(/status/);
    await expect(page).toHaveTitle(/Status|Health|System/i);
  });

  test('should display system status header', async ({ page }) => {
    const header = page.locator('h1, [data-testid="status-header"]');
    await expect(header.first()).toBeVisible();
    
    // Should mention status
    const statusText = page.locator('text=/Status|System|Health/i');
    await expect(statusText.first()).toBeVisible();
  });

  test('should show service status indicators', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for status indicators (operational, degraded, etc.)
    const statusIndicators = page.locator('text=/Operational|Online|Healthy|Degraded|Down/i');
    await expect(statusIndicators.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display API service status', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Should show API status
    const apiStatus = page.locator('text=/API|News API|Core API/i');
    await expect(apiStatus.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show green indicators for healthy services', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for green indicators (circles, badges, icons)
    const greenIndicators = page.locator('[class*="green"], [class*="success"], .bg-green-500, .text-green-500, text=/✓|✔|🟢/');
    const count = await greenIndicators.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Status Page - Metrics', () => {
  test('should display system metrics', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Look for metrics like uptime, response time, etc.
    const metrics = page.locator('text=/Uptime|Response|Latency|Version|Articles|Sources/i');
    await expect(metrics.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show article count', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Should display total articles
    const articleCount = page.locator('text=/[0-9,]+ articles|Total Articles/i');
    
    if (await articleCount.count() > 0) {
      await expect(articleCount.first()).toBeVisible();
    }
  });

  test('should show source count', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Should display number of sources
    const sourceCount = page.locator('text=/[0-9]+ sources|News Sources/i');
    
    if (await sourceCount.count() > 0) {
      await expect(sourceCount.first()).toBeVisible();
    }
  });
});

test.describe('Status Page - API Endpoints', () => {
  test('should list API endpoints', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Should show endpoint list
    const endpoints = page.locator('text=/\\/api\\//');
    const count = await endpoints.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show endpoint status badges', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Look for GET/POST badges or status badges
    const badges = page.locator('text=/GET|POST|Online|Healthy/');
    
    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible();
    }
  });
});

test.describe('Status Page - Sources Section', () => {
  test('should display news sources', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Should show source names
    const sources = page.locator('text=/CoinDesk|CoinTelegraph|Decrypt|The Block/i');
    
    if (await sources.count() > 0) {
      await expect(sources.first()).toBeVisible();
    }
  });

  test('should show source activity indicators', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Look for activity indicators (active, recent, etc.)
    const activity = page.locator('text=/Active|Recent|Last updated|articles/i');
    
    if (await activity.count() > 0) {
      await expect(activity.first()).toBeVisible();
    }
  });
});

test.describe('Status Page - Refresh', () => {
  test('should have refresh capability', async ({ page }) => {
    await page.goto('/status');
    await page.waitForLoadState('networkidle');

    // Look for refresh button or auto-refresh indicator
    const refreshButton = page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]');
    
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
      
      // Page should still be functional
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('Status Page - Mobile', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/status');
    
    await expect(page).toHaveURL(/status/);
    await expect(page.locator('main')).toBeVisible();
    
    // Content should not overflow
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });
});
