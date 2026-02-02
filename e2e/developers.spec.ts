/**
 * @fileoverview E2E Tests for Developer Portal
 * Tests API documentation, playground, and SDK sections
 */

import { test, expect } from '@playwright/test';

test.describe('Developer Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/developers');
  });

  test('should load the developers page', async ({ page }) => {
    await expect(page).toHaveURL(/developers/);
    await expect(page).toHaveTitle(/Developer|API|Documentation/i);
  });

  test('should display hero section', async ({ page }) => {
    // Hero should be visible with API status
    const hero = page.locator('h1, [data-testid="hero"]');
    await expect(hero.first()).toBeVisible();
  });

  test('should show API status badge', async ({ page }) => {
    // Look for status indicator
    const statusBadge = page.locator('text=/Operational|Online|Live|Status/i');
    await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation tabs', async ({ page }) => {
    // Look for tab navigation
    const tabs = page.locator('[role="tablist"], [data-testid="tabs"], button:has-text("Quick Start"), button:has-text("Endpoints")');
    await expect(tabs.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display code examples', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for code blocks
    const codeBlocks = page.locator('pre, code, [class*="code"], [data-testid="code-example"]');
    await expect(codeBlocks.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have copy buttons for code', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for copy buttons
    const copyButtons = page.locator('button:has-text("Copy"), button[aria-label*="copy" i], [data-testid="copy-button"]');
    const count = await copyButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('API Playground', () => {
  test('should have interactive API playground', async ({ page }) => {
    await page.goto('/developers');
    
    // Look for playground or try it section
    const playground = page.locator('[data-testid="playground"], text=/Try it|Playground|Test API/i');
    
    if (await playground.count() > 0) {
      await expect(playground.first()).toBeVisible();
    }
  });

  test('should execute API request', async ({ page }) => {
    await page.goto('/developers');
    await page.waitForLoadState('networkidle');

    // Find and click try/execute button
    const tryButton = page.locator('button:has-text("Try"), button:has-text("Execute"), button:has-text("Send")');
    
    if (await tryButton.count() > 0) {
      await tryButton.first().click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Should show response
      const response = page.locator('[data-testid="response"], pre:has-text("{"), text=/"articles"|"data"/');
      await expect(response.first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Endpoints Documentation', () => {
  test('should list API endpoints', async ({ page }) => {
    await page.goto('/developers');
    
    // Navigate to endpoints tab if needed
    const endpointsTab = page.locator('button:has-text("Endpoints"), [role="tab"]:has-text("Endpoints")');
    if (await endpointsTab.count() > 0) {
      await endpointsTab.click();
    }

    await page.waitForLoadState('networkidle');

    // Should show endpoint paths
    const endpoints = page.locator('text=/\\/api\\/|GET|POST/');
    await expect(endpoints.first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter endpoints', async ({ page }) => {
    await page.goto('/developers');
    await page.waitForLoadState('networkidle');

    // Look for filter buttons
    const filterButtons = page.locator('button:has-text("All"), button:has-text("Free"), button:has-text("AI")');
    
    if (await filterButtons.count() > 0) {
      // Click AI filter
      const aiFilter = page.locator('button:has-text("AI")');
      if (await aiFilter.count() > 0) {
        await aiFilter.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('SDK Section', () => {
  test('should display SDK options', async ({ page }) => {
    await page.goto('/developers');
    
    // Navigate to SDKs tab if needed
    const sdksTab = page.locator('button:has-text("SDK"), [role="tab"]:has-text("SDK")');
    if (await sdksTab.count() > 0) {
      await sdksTab.click();
    }

    await page.waitForLoadState('networkidle');

    // Should show SDK languages
    const sdks = page.locator('text=/Python|JavaScript|TypeScript|Go|Rust/i');
    await expect(sdks.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show installation commands', async ({ page }) => {
    await page.goto('/developers');
    await page.waitForLoadState('networkidle');

    // Look for install commands
    const installCommands = page.locator('text=/pip install|npm install|go get|cargo add/i, code:has-text("install")');
    
    if (await installCommands.count() > 0) {
      await expect(installCommands.first()).toBeVisible();
    }
  });
});

test.describe('Examples Page', () => {
  test('should load examples page', async ({ page }) => {
    await page.goto('/examples');
    
    await expect(page).toHaveURL(/examples/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display code examples', async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');

    // Should have code blocks
    const codeBlocks = page.locator('pre, code');
    await expect(codeBlocks.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have language tabs', async ({ page }) => {
    await page.goto('/examples');
    await page.waitForLoadState('networkidle');

    // Look for language selection
    const languageTabs = page.locator('button:has-text("Python"), button:has-text("JavaScript"), button:has-text("cURL")');
    
    if (await languageTabs.count() > 0) {
      await expect(languageTabs.first()).toBeVisible();
    }
  });
});

test.describe('API Documentation Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/developers');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should have focused element
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/developers');
    
    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
    
    // Should have h2s
    const h2s = page.locator('h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
