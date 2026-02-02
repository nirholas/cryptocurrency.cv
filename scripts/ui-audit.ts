/**
 * UI Audit Script
 * 
 * Crawls all pages and generates screenshots + reports
 * 
 * Usage:
 *   npx ts-node scripts/ui-audit.ts
 *   npx playwright test scripts/ui-audit.spec.ts --project=chromium
 */

// All 96 pages in the app
export const ALL_PAGES = [
  // Home & Core
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/search', name: 'Search' },
  { path: '/trending', name: 'Trending' },
  { path: '/sources', name: 'Sources' },
  { path: '/source', name: 'Source Index' },
  { path: '/category', name: 'Category Index' },
  { path: '/tags', name: 'Tags' },
  { path: '/topic', name: 'Topic Index' },
  { path: '/topics', name: 'Topics' },
  
  // News & Articles
  { path: '/article', name: 'Article Index' },
  { path: '/read', name: 'Read Mode' },
  { path: '/digest', name: 'Digest' },
  { path: '/buzz', name: 'Buzz' },
  { path: '/origins', name: 'Origins' },
  { path: '/clickbait', name: 'Clickbait Detector' },
  { path: '/factcheck', name: 'Fact Check' },
  { path: '/claims', name: 'Claims' },
  { path: '/citations', name: 'Citations' },
  { path: '/entities', name: 'Entities' },
  { path: '/coverage-gap', name: 'Coverage Gap' },
  
  // Markets
  { path: '/markets', name: 'Markets' },
  { path: '/markets/trending', name: 'Markets Trending' },
  { path: '/markets/gainers', name: 'Market Gainers' },
  { path: '/markets/losers', name: 'Market Losers' },
  { path: '/markets/new', name: 'New Coins' },
  { path: '/markets/categories', name: 'Market Categories' },
  { path: '/markets/exchanges', name: 'Exchanges' },
  { path: '/coin', name: 'Coin Index' },
  { path: '/movers', name: 'Movers' },
  { path: '/dominance', name: 'Dominance' },
  { path: '/heatmap', name: 'Heatmap' },
  { path: '/correlation', name: 'Correlation' },
  { path: '/compare', name: 'Compare' },
  { path: '/screener', name: 'Screener' },
  
  // Trading & Analytics
  { path: '/charts', name: 'Charts' },
  { path: '/orderbook', name: 'Orderbook' },
  { path: '/arbitrage', name: 'Arbitrage' },
  { path: '/signals', name: 'Signals' },
  { path: '/backtest', name: 'Backtest' },
  { path: '/options', name: 'Options' },
  { path: '/funding', name: 'Funding Rates' },
  { path: '/liquidations', name: 'Liquidations' },
  { path: '/whales', name: 'Whales' },
  { path: '/gas', name: 'Gas Tracker' },
  
  // DeFi
  { path: '/defi', name: 'DeFi' },
  { path: '/protocol-health', name: 'Protocol Health' },
  { path: '/onchain', name: 'On-Chain' },
  
  // Sentiment & Analysis
  { path: '/sentiment', name: 'Sentiment' },
  { path: '/fear-greed', name: 'Fear & Greed' },
  { path: '/narratives', name: 'Narratives' },
  { path: '/predictions', name: 'Predictions' },
  { path: '/influencers', name: 'Influencers' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/analytics/headlines', name: 'Headlines Analytics' },
  
  // AI Features
  { path: '/ai', name: 'AI Hub' },
  { path: '/ai/brief', name: 'AI Brief' },
  { path: '/ai/debate', name: 'AI Debate' },
  { path: '/ai/counter', name: 'AI Counter' },
  { path: '/ai/oracle', name: 'AI Oracle' },
  { path: '/ai-agent', name: 'AI Agent' },
  { path: '/oracle', name: 'Oracle' },
  
  // User Features
  { path: '/portfolio', name: 'Portfolio' },
  { path: '/watchlist', name: 'Watchlist' },
  { path: '/bookmarks', name: 'Bookmarks' },
  { path: '/saved', name: 'Saved' },
  { path: '/settings', name: 'Settings' },
  { path: '/share', name: 'Share' },
  { path: '/calculator', name: 'Calculator' },
  
  // Regulatory
  { path: '/regulatory', name: 'Regulatory' },
  
  // Pricing & Billing
  { path: '/pricing', name: 'Pricing' },
  { path: '/pricing/premium', name: 'Premium' },
  { path: '/pricing/upgrade', name: 'Upgrade' },
  { path: '/billing', name: 'Billing' },
  
  // Developer
  { path: '/developers', name: 'Developers' },
  { path: '/install', name: 'Install' },
  { path: '/examples', name: 'Examples' },
  { path: '/examples/cards', name: 'Card Examples' },
  
  // Blog
  { path: '/blog', name: 'Blog' },
  
  // Admin
  { path: '/admin', name: 'Admin' },
  
  // Misc
  { path: '/offline', name: 'Offline' },
];

// Dynamic routes that need sample IDs
export const DYNAMIC_PAGES = [
  { path: '/article/sample-article-id', name: 'Article Detail' },
  { path: '/coin/bitcoin', name: 'Coin Detail (BTC)' },
  { path: '/coin/ethereum', name: 'Coin Detail (ETH)' },
  { path: '/source/coindesk', name: 'Source Detail' },
  { path: '/category/bitcoin', name: 'Category Detail' },
  { path: '/topic/regulation', name: 'Topic Detail' },
  { path: '/tags/bitcoin', name: 'Tag Detail' },
  { path: '/defi/chain/ethereum', name: 'DeFi Chain' },
  { path: '/defi/protocol/aave', name: 'DeFi Protocol' },
  { path: '/markets/categories/defi', name: 'Market Category' },
  { path: '/markets/exchanges/binance', name: 'Exchange Detail' },
  { path: '/blog/sample-post', name: 'Blog Post' },
  { path: '/blog/category/news', name: 'Blog Category' },
  { path: '/blog/tag/crypto', name: 'Blog Tag' },
];

// Categories for audit report
export const PAGE_CATEGORIES = {
  'Core': ['/', '/about', '/search', '/trending', '/sources'],
  'News': ['/article', '/read', '/digest', '/buzz', '/origins', '/factcheck'],
  'Markets': ['/markets', '/coin', '/movers', '/heatmap', '/screener'],
  'Trading': ['/charts', '/orderbook', '/signals', '/arbitrage', '/options'],
  'DeFi': ['/defi', '/protocol-health', '/onchain'],
  'Sentiment': ['/sentiment', '/fear-greed', '/narratives', '/predictions'],
  'AI': ['/ai', '/ai/brief', '/ai/debate', '/ai/oracle', '/ai-agent'],
  'User': ['/portfolio', '/watchlist', '/bookmarks', '/settings'],
  'Pricing': ['/pricing', '/billing'],
  'Developer': ['/developers', '/install', '/examples'],
};

console.log(`
📊 UI Audit Summary
==================
Total Pages: ${ALL_PAGES.length + DYNAMIC_PAGES.length}
Static Pages: ${ALL_PAGES.length}
Dynamic Pages: ${DYNAMIC_PAGES.length}

Categories:
${Object.entries(PAGE_CATEGORIES).map(([cat, pages]) => `  ${cat}: ${pages.length} pages`).join('\n')}

Run audit with:
  npm run dev                           # Start dev server
  npx playwright test e2e/ui-audit.spec.ts --project=chromium
`);
