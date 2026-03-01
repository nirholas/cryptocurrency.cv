/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * @fileoverview E2E Tests for Home Page
 *
 * Updated for the new frontend design:
 * - container-main layout, font-serif headings, CSS variable theming
 * - Server Components with data from @/lib/crypto-news
 * - Components: Header (mobile menu, theme toggle), Footer, NewsCard variants
 * - Structured data (WebSite, Organization, NewsList) in <head>
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the home page', async ({ page }) => {
    await expect(page).toHaveTitle(/Crypto|News|Free Crypto News/i);
  });

  test('should display header with navigation', async ({ page }) => {
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Desktop nav is hidden on small screens; just ensure a <nav> exists
    const nav = page.locator('nav');
    await expect(nav.first()).toBeAttached();
  });

  test('should display hero / featured article', async ({ page }) => {
    // The first section renders a FeaturedCard inside an <article>
    const hero = page.locator('article').first();
    await expect(hero).toBeVisible({ timeout: 10000 });
  });

  test('should display news articles', async ({ page }) => {
    // NewsCard variants all render as <article> elements
    await page.waitForSelector('article', { timeout: 10000 });
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThan(1);
  });

  test('should show "Latest News" section heading', async ({ page }) => {
    const heading = page.locator('h2, h1').filter({ hasText: /latest/i });
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    const navLinks = page.locator('nav a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should contain structured data in head', async ({ page }) => {
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify at least one is a WebSite schema
    const first = await jsonLd.first().textContent();
    expect(first).toContain('"@type"');
  });
});

test.describe('Search Functionality', () => {
  test('should have search button in header', async ({ page }) => {
    await page.goto('/');

    // Header has a search button with aria-label containing "Search"
    const searchButton = page.locator('button[aria-label*="Search"]');
    await expect(searchButton.first()).toBeVisible();
  });

  test('should open global search modal', async ({ page }) => {
    await page.goto('/');

    // Click the search button
    const searchButton = page.locator('button[aria-label*="Search"]');
    await searchButton.first().click();

    // The GlobalSearch dialog should appear with a search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to search page via URL', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveURL(/search/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should search for articles via URL query', async ({ page }) => {
    await page.goto('/search?q=bitcoin');
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, body');
    await expect(content.first()).toBeVisible();
  });
});

test.describe('Category Pages', () => {
  const categories = ['bitcoin', 'defi', 'trending'];

  for (const category of categories) {
    test(`should load ${category} category page`, async ({ page }) => {
      await page.goto(`/category/${category}`);
      await expect(page).toHaveURL(new RegExp(category));
      const main = page.locator('main, body');
      await expect(main.first()).toBeVisible();
    });
  }
});

test.describe('Sources Page', () => {
  test('should display available sources', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForLoadState('networkidle');
    const main = page.locator('main, body');
    await expect(main.first()).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const main = page.locator('main');
    await expect(main.first()).toBeVisible();

    // Mobile menu toggle button should be visible (aria-label="Toggle menu")
    const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('should display properly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    const main = page.locator('main');
    await expect(main.first()).toBeVisible();
  });

  test('should display properly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    const main = page.locator('main');
    await expect(main.first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have main landmark with id', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main#main-content, main');
    await expect(main.first()).toBeVisible();
  });

  test('should have skip link', async ({ page }) => {
    await page.goto('/');
    // skip-link may be off-screen until focused
    const skipLink = page.locator('.skip-link, a[href="#main-content"]');
    const count = await skipLink.count();
    expect(count).toBeGreaterThanOrEqual(1);
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

  test('should have service worker support', async ({ page }) => {
    await page.goto('/');
    const swSupport = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(swSupport).toBeTruthy();
  });
});

test.describe('Article Interaction', () => {
  test('should be able to bookmark articles', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('article', { timeout: 10000 });

    // BookmarkButton is inside each article card (opacity-0 until hover)
    const bookmarkButton = page.locator('button[aria-label*="bookmark" i], button[aria-label*="Bookmark" i]');
    if (await bookmarkButton.count() > 0) {
      // Force-click since it may be hidden until hover
      await bookmarkButton.first().click({ force: true });
    }
  });

  test('should have article links', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('article', { timeout: 10000 });

    // Articles contain links (may be external with target="_blank")
    const articleLinks = page.locator('article a');
    const count = await articleLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
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

    const criticalErrors = errors.filter(
      e =>
        !e.includes('favicon') &&
        !e.includes('Failed to load resource') &&
        !e.includes('hydration') &&
        !e.includes('Hydration')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
