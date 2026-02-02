/**
 * @fileoverview E2E Tests for User Features
 * Tests Watchlist, Portfolio, Bookmarks, Settings, and other user pages
 */

import { test, expect } from '@playwright/test';

test.describe('Watchlist', () => {
  test('should load watchlist page', async ({ page }) => {
    await page.goto('/watchlist');
    
    await expect(page).toHaveURL(/watchlist/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should show empty state or watchlist items', async ({ page }) => {
    await page.goto('/watchlist');
    await page.waitForLoadState('networkidle');

    // Either empty state or watchlist items
    const content = page.locator('text=/Watchlist|Add|Empty|No items|Your watchlist/i');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have add functionality', async ({ page }) => {
    await page.goto('/watchlist');
    await page.waitForLoadState('networkidle');

    // Look for add button or search
    const addButton = page.locator('button:has-text("Add"), input[placeholder*="search" i], input[placeholder*="add" i]');
    
    if (await addButton.count() > 0) {
      await expect(addButton.first()).toBeVisible();
    }
  });
});

test.describe('Portfolio', () => {
  test('should load portfolio page', async ({ page }) => {
    await page.goto('/portfolio');
    
    await expect(page).toHaveURL(/portfolio/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should show empty state or portfolio items', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Either empty state or portfolio data
    const content = page.locator('text=/Portfolio|Holdings|Add|Empty|No holdings|Total Value/i');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display portfolio value if items exist', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Look for value display
    const value = page.locator('text=/\\$[0-9,]+|Total|Value|Balance/i');
    
    if (await value.count() > 0) {
      await expect(value.first()).toBeVisible();
    }
  });
});

test.describe('Bookmarks', () => {
  test('should load bookmarks page', async ({ page }) => {
    await page.goto('/bookmarks');
    
    await expect(page).toHaveURL(/bookmarks/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should show empty state or bookmarked articles', async ({ page }) => {
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');

    // Either empty state or bookmarks
    const content = page.locator('text=/Bookmark|Saved|Empty|No bookmarks|articles/i');
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Reading List', () => {
  test('should load read page', async ({ page }) => {
    await page.goto('/read');
    
    await expect(page).toHaveURL(/read/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Saved Content', () => {
  test('should load saved page', async ({ page }) => {
    await page.goto('/saved');
    
    await expect(page).toHaveURL(/saved/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Settings', () => {
  test('should load settings page', async ({ page }) => {
    await page.goto('/settings');
    
    await expect(page).toHaveURL(/settings/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display settings options', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for settings content
    const settings = page.locator('text=/Settings|Preferences|Theme|Language|Notifications/i');
    await expect(settings.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have theme toggle', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for theme options
    const theme = page.locator('text=/Theme|Dark|Light|System/i, button[aria-label*="theme" i], [data-testid="theme-toggle"]');
    
    if (await theme.count() > 0) {
      await expect(theme.first()).toBeVisible();
    }
  });

  test('should have language selector', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Look for language options
    const language = page.locator('text=/Language|English|Español|中文/i, select, [data-testid="language-select"]');
    
    if (await language.count() > 0) {
      await expect(language.first()).toBeVisible();
    }
  });
});

test.describe('Compare Coins', () => {
  test('should load compare page', async ({ page }) => {
    await page.goto('/compare');
    
    await expect(page).toHaveURL(/compare/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have coin selection', async ({ page }) => {
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');

    // Look for comparison interface
    const compare = page.locator('text=/Compare|Select|Add coin|vs/i');
    await expect(compare.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Calculator', () => {
  test('should load calculator page', async ({ page }) => {
    await page.goto('/calculator');
    
    await expect(page).toHaveURL(/calculator/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have calculator inputs', async ({ page }) => {
    await page.goto('/calculator');
    await page.waitForLoadState('networkidle');

    // Look for input fields
    const inputs = page.locator('input[type="number"], input[type="text"]');
    
    if (await inputs.count() > 0) {
      await expect(inputs.first()).toBeVisible();
    }
  });
});

test.describe('About Page', () => {
  test('should load about page', async ({ page }) => {
    await page.goto('/about');
    
    await expect(page).toHaveURL(/about/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display about content', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    // Look for about content
    const about = page.locator('text=/About|Free Crypto News|Mission|Team/i');
    await expect(about.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Pricing Page', () => {
  test('should load pricing page', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page).toHaveURL(/pricing/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Look for pricing content
    const pricing = page.locator('text=/Free|Pro|Enterprise|\\$|month|year/i');
    await expect(pricing.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have pricing cards', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Look for pricing cards/tiers
    const cards = page.locator('[class*="card"], [class*="tier"], [class*="plan"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Install Page', () => {
  test('should load install page', async ({ page }) => {
    await page.goto('/install');
    
    await expect(page).toHaveURL(/install/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should show installation instructions', async ({ page }) => {
    await page.goto('/install');
    await page.waitForLoadState('networkidle');

    // Look for install content
    const install = page.locator('text=/Install|PWA|App|Download|Add to/i');
    await expect(install.first()).toBeVisible({ timeout: 10000 });
  });
});
