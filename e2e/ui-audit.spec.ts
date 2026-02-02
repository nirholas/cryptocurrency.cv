/**
 * UI Audit E2E Test
 * 
 * Crawls all pages and captures screenshots for visual audit
 * 
 * Usage:
 *   npx playwright test e2e/ui-audit.spec.ts --project=chromium
 *   npx playwright test e2e/ui-audit.spec.ts --project=chromium --headed
 * 
 * Output:
 *   - Screenshots in test-results/ui-audit/
 *   - HTML report in playwright-report/
 *   - Console errors logged
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// All static pages
const PAGES = [
  // Core
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/search', name: 'search' },
  { path: '/trending', name: 'trending' },
  { path: '/sources', name: 'sources' },
  { path: '/tags', name: 'tags' },
  { path: '/topics', name: 'topics' },
  
  // News & Content
  { path: '/digest', name: 'digest' },
  { path: '/buzz', name: 'buzz' },
  { path: '/origins', name: 'origins' },
  { path: '/clickbait', name: 'clickbait' },
  { path: '/factcheck', name: 'factcheck' },
  { path: '/claims', name: 'claims' },
  { path: '/citations', name: 'citations' },
  { path: '/entities', name: 'entities' },
  { path: '/coverage-gap', name: 'coverage-gap' },
  
  // Markets
  { path: '/markets', name: 'markets' },
  { path: '/markets/trending', name: 'markets-trending' },
  { path: '/markets/gainers', name: 'markets-gainers' },
  { path: '/markets/losers', name: 'markets-losers' },
  { path: '/markets/new', name: 'markets-new' },
  { path: '/markets/categories', name: 'markets-categories' },
  { path: '/markets/exchanges', name: 'markets-exchanges' },
  { path: '/movers', name: 'movers' },
  { path: '/dominance', name: 'dominance' },
  { path: '/heatmap', name: 'heatmap' },
  { path: '/correlation', name: 'correlation' },
  { path: '/compare', name: 'compare' },
  { path: '/screener', name: 'screener' },
  
  // Trading
  { path: '/charts', name: 'charts' },
  { path: '/orderbook', name: 'orderbook' },
  { path: '/arbitrage', name: 'arbitrage' },
  { path: '/signals', name: 'signals' },
  { path: '/backtest', name: 'backtest' },
  { path: '/options', name: 'options' },
  { path: '/funding', name: 'funding' },
  { path: '/liquidations', name: 'liquidations' },
  { path: '/whales', name: 'whales' },
  { path: '/gas', name: 'gas' },
  
  // DeFi
  { path: '/defi', name: 'defi' },
  { path: '/protocol-health', name: 'protocol-health' },
  { path: '/onchain', name: 'onchain' },
  
  // Sentiment & Analysis
  { path: '/sentiment', name: 'sentiment' },
  { path: '/fear-greed', name: 'fear-greed' },
  { path: '/narratives', name: 'narratives' },
  { path: '/predictions', name: 'predictions' },
  { path: '/influencers', name: 'influencers' },
  { path: '/analytics', name: 'analytics' },
  { path: '/analytics/headlines', name: 'analytics-headlines' },
  
  // AI
  { path: '/ai', name: 'ai' },
  { path: '/ai/brief', name: 'ai-brief' },
  { path: '/ai/debate', name: 'ai-debate' },
  { path: '/ai/counter', name: 'ai-counter' },
  { path: '/ai/oracle', name: 'ai-oracle' },
  { path: '/ai-agent', name: 'ai-agent' },
  { path: '/oracle', name: 'oracle' },
  
  // User Features
  { path: '/portfolio', name: 'portfolio' },
  { path: '/watchlist', name: 'watchlist' },
  { path: '/bookmarks', name: 'bookmarks' },
  { path: '/saved', name: 'saved' },
  { path: '/settings', name: 'settings' },
  { path: '/calculator', name: 'calculator' },
  
  // Regulatory
  { path: '/regulatory', name: 'regulatory' },
  
  // Pricing
  { path: '/pricing', name: 'pricing' },
  { path: '/pricing/premium', name: 'pricing-premium' },
  { path: '/pricing/upgrade', name: 'pricing-upgrade' },
  { path: '/billing', name: 'billing' },
  
  // Developer
  { path: '/developers', name: 'developers' },
  { path: '/install', name: 'install' },
  { path: '/examples', name: 'examples' },
  { path: '/examples/cards', name: 'examples-cards' },
  
  // Blog
  { path: '/blog', name: 'blog' },
  
  // Admin
  { path: '/admin', name: 'admin' },
];

// Dynamic pages with sample data
const DYNAMIC_PAGES = [
  { path: '/coin/bitcoin', name: 'coin-bitcoin' },
  { path: '/coin/ethereum', name: 'coin-ethereum' },
  { path: '/source/coindesk', name: 'source-coindesk' },
  { path: '/category/bitcoin', name: 'category-bitcoin' },
  { path: '/defi/chain/ethereum', name: 'defi-chain-ethereum' },
];

test.describe('UI Audit - All Pages', () => {
  // Collect console errors
  const consoleErrors: { page: string; errors: string[] }[] = [];
  
  test.afterAll(async () => {
    // Output error summary
    const pagesWithErrors = consoleErrors.filter(p => p.errors.length > 0);
    if (pagesWithErrors.length > 0) {
      console.log('\n⚠️  Pages with console errors:');
      pagesWithErrors.forEach(p => {
        console.log(`\n  ${p.page}:`);
        p.errors.forEach(e => console.log(`    - ${e}`));
      });
    }
  });
  
  for (const { path, name } of [...PAGES, ...DYNAMIC_PAGES]) {
    test(`Screenshot: ${name} (${path})`, async ({ page }) => {
      const errors: string[] = [];
      
      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Navigate with timeout
      const response = await page.goto(`${BASE_URL}${path}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Check response
      const status = response?.status() || 0;
      expect(status).toBeLessThan(500); // No server errors
      
      // Wait for content to load
      await page.waitForTimeout(1000);
      
      // Take full-page screenshot
      await page.screenshot({
        path: `test-results/ui-audit/${name}.png`,
        fullPage: true,
      });
      
      // Store errors for summary
      consoleErrors.push({ page: path, errors });
      
      // Basic accessibility check - page should have title
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Check for main content area
      const main = await page.$('main, [role="main"], #__next');
      expect(main).toBeTruthy();
    });
  }
});

test.describe('UI Audit - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];
  
  const criticalPages = ['/', '/markets', '/ai', '/pricing', '/portfolio'];
  
  for (const viewport of viewports) {
    for (const path of criticalPages) {
      test(`Responsive ${viewport.name}: ${path}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
        
        await page.screenshot({
          path: `test-results/ui-audit/responsive/${viewport.name}-${path.replace(/\//g, '-') || 'home'}.png`,
          fullPage: true,
        });
      });
    }
  }
});

test.describe('UI Audit - Dark/Light Mode', () => {
  const criticalPages = ['/', '/markets', '/pricing'];
  
  for (const path of criticalPages) {
    test(`Dark mode: ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
      
      await page.screenshot({
        path: `test-results/ui-audit/themes/dark-${path.replace(/\//g, '-') || 'home'}.png`,
        fullPage: true,
      });
    });
    
    test(`Light mode: ${path}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
      
      await page.screenshot({
        path: `test-results/ui-audit/themes/light-${path.replace(/\//g, '-') || 'home'}.png`,
        fullPage: true,
      });
    });
  }
});
