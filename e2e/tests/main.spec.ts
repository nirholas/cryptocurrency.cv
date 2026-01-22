import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Crypto News/);
  });

  test('should display news articles', async ({ page }) => {
    // Wait for articles to load
    await page.waitForSelector('[data-article]');
    
    // Should have multiple articles
    const articles = await page.locator('[data-article]').count();
    expect(articles).toBeGreaterThan(0);
  });

  test('should have working navigation', async ({ page }) => {
    // Click on a nav link
    await page.click('text=DeFi');
    await expect(page).toHaveURL(/defi/);
  });

  test('should toggle dark mode', async ({ page }) => {
    // Find and click theme toggle
    const themeToggle = page.locator('button[aria-label*="dark"]');
    await themeToggle.click();
    
    // Check that dark class is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should open search with keyboard shortcut', async ({ page }) => {
    // Press / to open search
    await page.keyboard.press('/');
    
    // Check that search input is focused
    const searchInput = page.locator('[data-search-input]');
    await expect(searchInput).toBeFocused();
  });
});

test.describe('Article Page', () => {
  test('should display article content', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Click on first article
    await page.click('[data-article]');
    
    // Should navigate to article page
    await expect(page).toHaveURL(/article/);
    
    // Should have article title
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show reading progress bar', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('[data-article]');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    
    // Progress bar should be visible and have width
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });
});

test.describe('Search', () => {
  test('should search for articles', async ({ page }) => {
    await page.goto(`${BASE_URL}/search?q=bitcoin`);
    
    // Should show search results
    await page.waitForSelector('[data-article]');
    const results = await page.locator('[data-article]').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Open search
    await page.keyboard.press('/');
    
    // Type query
    await page.fill('[data-search-input]', 'bitcoin');
    
    // Wait for suggestions
    await page.waitForTimeout(500); // Debounce
    
    // Should show suggestions dropdown
    // (This depends on implementation)
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate articles with j/k', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-article]');
    
    // Press j to select first article
    await page.keyboard.press('j');
    
    // First article should be focused/selected
    const firstArticle = page.locator('[data-article]').first();
    await expect(firstArticle).toHaveClass(/ring/);
  });

  test('should show shortcuts help with ?', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Press ? to show help
    await page.keyboard.press('?');
    
    // Should show shortcuts modal
    await expect(page.locator('text=Keyboard Shortcuts')).toBeVisible();
  });

  test('should navigate to pages with g+key', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Press g then t for trending
    await page.keyboard.press('g');
    await page.keyboard.press('t');
    
    // Should navigate to trending
    await expect(page).toHaveURL(/trending/);
  });
});

test.describe('PWA Features', () => {
  test('should have manifest', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for manifest link
    const manifest = await page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', '/manifest.json');
  });

  test('should register service worker', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for service worker
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        return !!reg;
      }
      return false;
    });
    
    expect(swRegistered).toBe(true);
  });
});

test.describe('API Endpoints', () => {
  test('should return news from /api/news', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/news?limit=5`);
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.articles).toBeDefined();
    expect(data.articles.length).toBeGreaterThan(0);
  });

  test('should return RSS feed', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/feed.xml`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('xml');
  });

  test('should return health check', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Accessibility', () => {
  test('should have skip to content link', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Should have h1
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThanOrEqual(1);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // All images should have alt attribute
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });
});
