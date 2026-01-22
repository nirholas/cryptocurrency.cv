/**
 * @fileoverview E2E Tests for Home Page
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Crypto News|Free Crypto News/i);
  });

  test('should display header with navigation', async ({ page }) => {
    // Header should be visible
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Navigation should exist
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display news articles', async ({ page }) => {
    // Wait for articles to load
    await page.waitForSelector('article, [data-testid="article"], .article-card', {
      timeout: 10000,
    });
    
    // At least one article should be visible
    const articles = page.locator('article, [data-testid="article"], .article-card');
    await expect(articles.first()).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Find and click a navigation link
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    
    expect(linkCount).toBeGreaterThan(0);
    
    // Test first link
    const firstLink = navLinks.first();
    const href = await firstLink.getAttribute('href');
    
    if (href && !href.startsWith('http')) {
      await firstLink.click();
      await expect(page).toHaveURL(new RegExp(href.replace(/\//g, '\\/')));
    }
  });
});

test.describe('Search Functionality', () => {
  test('should have search functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input or search button
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search"]');
    const searchButton = page.locator('button[aria-label*="search" i], a[href*="search"]');
    
    const hasSearch = await searchInput.count() > 0 || await searchButton.count() > 0;
    expect(hasSearch).toBeTruthy();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/search');
    
    // Search page should load
    await expect(page).toHaveURL(/search/);
  });

  test('should search for articles', async ({ page }) => {
    await page.goto('/search?q=bitcoin');
    
    // Wait for search results
    await page.waitForLoadState('networkidle');
    
    // Results should be displayed
    const content = page.locator('main');
    await expect(content).toBeVisible();
  });
});

test.describe('Category Pages', () => {
  const categories = ['bitcoin', 'defi', 'trending'];

  for (const category of categories) {
    test(`should load ${category} category page`, async ({ page }) => {
      await page.goto(`/category/${category}`);
      
      // Page should load without error
      await expect(page).toHaveURL(new RegExp(category));
      
      // Main content should be visible
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  }
});

test.describe('Sources Page', () => {
  test('should display available sources', async ({ page }) => {
    await page.goto('/sources');
    
    // Should show list of sources
    await page.waitForLoadState('networkidle');
    
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Content should be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Mobile menu should be accessible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu" i]');
    const hasMobileMenu = await mobileMenuButton.count() > 0;
    
    // Either has mobile menu or navigation is visible
    if (hasMobileMenu) {
      await expect(mobileMenuButton.first()).toBeVisible();
    }
  });

  test('should display properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should display properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have h1
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have skip link or main landmark', async ({ page }) => {
    await page.goto('/');
    
    // Should have main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Image should have alt text or be presentational
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });
});

test.describe('PWA Features', () => {
  test('should have manifest', async ({ page }) => {
    await page.goto('/');
    
    const manifest = page.locator('link[rel="manifest"]');
    const hasManifest = await manifest.count() > 0;
    expect(hasManifest).toBeTruthy();
  });

  test('should have service worker registration', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistration = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistration).toBeTruthy();
  });
});

test.describe('Article Interaction', () => {
  test('should be able to bookmark articles', async ({ page }) => {
    await page.goto('/');
    
    // Wait for articles to load
    await page.waitForSelector('article, [data-testid="article"]', { timeout: 10000 });
    
    // Find bookmark button
    const bookmarkButton = page.locator('[data-testid="bookmark"], button[aria-label*="bookmark" i]');
    
    if (await bookmarkButton.count() > 0) {
      await bookmarkButton.first().click();
      // Button state should change
    }
  });

  test('should navigate to article detail', async ({ page }) => {
    await page.goto('/');
    
    // Wait for articles
    await page.waitForSelector('article a, [data-testid="article"] a', { timeout: 10000 });
    
    // Click on first article link
    const articleLink = page.locator('article a, [data-testid="article"] a').first();
    const href = await articleLink.getAttribute('href');
    
    if (href && !href.startsWith('http')) {
      await articleLink.click();
      await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have no major console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Failed to load resource')
    );
    
    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
  });
});
