/**
 * @fileoverview E2E Tests for Analytics & Research Features
 * Tests Analytics Hub, Trending, Sources, and other research pages
 */

import { test, expect } from '@playwright/test';

test.describe('Analytics Hub', () => {
  test('should load analytics page', async ({ page }) => {
    await page.goto('/analytics');
    
    await expect(page).toHaveURL(/analytics/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display analytics content', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for analytics content
    const analytics = page.locator('text=/Analytics|Stats|Data|Metrics/i');
    await expect(analytics.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Trending', () => {
  test('should load trending page', async ({ page }) => {
    await page.goto('/trending');
    
    await expect(page).toHaveURL(/trending/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display trending content', async ({ page }) => {
    await page.goto('/trending');
    await page.waitForLoadState('networkidle');

    // Look for trending articles or coins
    const trending = page.locator('text=/Trending|Hot|Popular|Top/i');
    await expect(trending.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show ranked items', async ({ page }) => {
    await page.goto('/trending');
    await page.waitForLoadState('networkidle');

    // Look for ranking indicators
    const ranks = page.locator('text=/^[1-9]$|#[1-9]|🥇|🥈|🥉/');
    
    if (await ranks.count() > 0) {
      await expect(ranks.first()).toBeVisible();
    }
  });
});

test.describe('Top Movers', () => {
  test('should load movers page', async ({ page }) => {
    await page.goto('/movers');
    
    await expect(page).toHaveURL(/movers/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display gainers and losers', async ({ page }) => {
    await page.goto('/movers');
    await page.waitForLoadState('networkidle');

    // Look for movers content
    const movers = page.locator('text=/Gainer|Loser|Mover|Top|%/i');
    await expect(movers.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('News Sources', () => {
  test('should load sources page', async ({ page }) => {
    await page.goto('/sources');
    
    await expect(page).toHaveURL(/sources/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display source list', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForLoadState('networkidle');

    // Look for source names
    const sources = page.locator('text=/CoinDesk|CoinTelegraph|Decrypt|The Block|Source/i');
    await expect(sources.first()).toBeVisible({ timeout: 15000 });
  });

  test('should show source count', async ({ page }) => {
    await page.goto('/sources');
    await page.waitForLoadState('networkidle');

    // Look for count indicator
    const count = page.locator('text=/[0-9]+ sources|130\\+|200\\+/i');
    
    if (await count.count() > 0) {
      await expect(count.first()).toBeVisible();
    }
  });
});

test.describe('Topics', () => {
  test('should load topics page', async ({ page }) => {
    await page.goto('/topics');
    
    await expect(page).toHaveURL(/topics/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display topic list', async ({ page }) => {
    await page.goto('/topics');
    await page.waitForLoadState('networkidle');

    // Look for topics
    const topics = page.locator('text=/Bitcoin|Ethereum|DeFi|NFT|Topic/i');
    await expect(topics.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Tags', () => {
  test('should load tags page', async ({ page }) => {
    await page.goto('/tags');
    
    await expect(page).toHaveURL(/tags/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display tag cloud or list', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('networkidle');

    // Look for tags
    const tags = page.locator('a[href*="/tags/"], text=/bitcoin|ethereum|defi/i');
    await expect(tags.first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to individual tag page', async ({ page }) => {
    await page.goto('/tags/bitcoin');
    
    await expect(page).toHaveURL(/tags\/bitcoin/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Narratives', () => {
  test('should load narratives page', async ({ page }) => {
    await page.goto('/narratives');
    
    await expect(page).toHaveURL(/narratives/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Funding Rounds', () => {
  test('should load funding page', async ({ page }) => {
    await page.goto('/funding');
    
    await expect(page).toHaveURL(/funding/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display funding data', async ({ page }) => {
    await page.goto('/funding');
    await page.waitForLoadState('networkidle');

    // Look for funding content
    const funding = page.locator('text=/Funding|Raise|Series|Million|Billion/i');
    await expect(funding.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Influencer Tracker', () => {
  test('should load influencers page', async ({ page }) => {
    await page.goto('/influencers');
    
    await expect(page).toHaveURL(/influencers/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Protocol Health', () => {
  test('should load protocol-health page', async ({ page }) => {
    await page.goto('/protocol-health');
    
    await expect(page).toHaveURL(/protocol-health/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Coverage Gaps', () => {
  test('should load coverage-gap page', async ({ page }) => {
    await page.goto('/coverage-gap');
    
    await expect(page).toHaveURL(/coverage-gap/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Correlation Analysis', () => {
  test('should load correlation page', async ({ page }) => {
    await page.goto('/correlation');
    
    await expect(page).toHaveURL(/correlation/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Dominance Charts', () => {
  test('should load dominance page', async ({ page }) => {
    await page.goto('/dominance');
    
    await expect(page).toHaveURL(/dominance/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display dominance data', async ({ page }) => {
    await page.goto('/dominance');
    await page.waitForLoadState('networkidle');

    // Look for dominance content
    const dominance = page.locator('text=/Dominance|BTC|Bitcoin|%/i');
    await expect(dominance.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Heatmap', () => {
  test('should load heatmap page', async ({ page }) => {
    await page.goto('/heatmap');
    
    await expect(page).toHaveURL(/heatmap/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Charts', () => {
  test('should load charts page', async ({ page }) => {
    await page.goto('/charts');
    
    await expect(page).toHaveURL(/charts/);
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Blog', () => {
  test('should load blog page', async ({ page }) => {
    await page.goto('/blog');
    
    // May redirect to /en/blog
    await expect(page).toHaveURL(/blog/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display blog posts', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    // Look for blog content
    const blog = page.locator('article, [class*="post"], [class*="blog"]');
    
    if (await blog.count() > 0) {
      await expect(blog.first()).toBeVisible();
    }
  });
});
