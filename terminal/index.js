#!/usr/bin/env node

/**
 * 🆓 Free Crypto News - Terminal Dashboard
 * 
 * Real-time crypto news in your terminal with live updates,
 * price charts, sentiment analysis, and more.
 * 
 * Usage:
 *   npx crypto-news-cli
 *   npx crypto-news-cli --watch
 *   npx crypto-news-cli --ticker BTC
 */

import blessed from 'blessed';
import contrib from 'blessed-contrib';
import chalk from 'chalk';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';
import EventSource from 'eventsource';

const API_BASE = 'https://cryptocurrency.cv/api';

// Parse CLI arguments
program
  .name('crypto-news')
  .description('Real-time crypto news dashboard in your terminal')
  .version('1.0.0')
  .option('-w, --watch', 'Enable real-time updates via SSE')
  .option('-t, --ticker <symbol>', 'Filter by ticker (BTC, ETH, etc.)')
  .option('-l, --limit <number>', 'Number of articles', '20')
  .option('-s, --source <source>', 'Filter by source')
  .option('--sentiment', 'Show sentiment analysis')
  .option('--fear-greed', 'Show Fear & Greed Index')
  .option('--minimal', 'Minimal mode - just headlines')
  .parse();

const options = program.opts();

// Colors
const colors = {
  bullish: chalk.green,
  bearish: chalk.red,
  neutral: chalk.gray,
  breaking: chalk.bgRed.white.bold,
  source: chalk.cyan,
  time: chalk.dim,
  title: chalk.white.bold,
};

// Fetch data from API
async function fetchNews(opts = {}) {
  const params = new URLSearchParams({
    limit: opts.limit || options.limit,
    ...(opts.source && { source: opts.source }),
    ...(options.source && { source: options.source }),
  });
  
  const response = await fetch(`${API_BASE}/news?${params}`);
  return response.json();
}

async function fetchSentiment() {
  const response = await fetch(`${API_BASE}/sentiment?limit=10`);
  return response.json();
}

async function fetchFearGreed() {
  const response = await fetch(`${API_BASE}/fear-greed`);
  return response.json();
}

async function fetchTrending() {
  const response = await fetch(`${API_BASE}/trending?limit=5`);
  return response.json();
}

async function fetchPrices() {
  const response = await fetch(`${API_BASE}/market/coins?ids=bitcoin,ethereum,solana,cardano,dogecoin&vs_currency=usd`);
  return response.json();
}

// Minimal mode - just print headlines
async function runMinimal() {
  console.log(gradient.pastel.multiline(figlet.textSync('Crypto News', { horizontalLayout: 'full' })));
  console.log();
  
  const { articles } = await fetchNews();
  
  articles.forEach((article, i) => {
    const sentiment = article.sentiment || 'neutral';
    const sentimentIcon = sentiment === 'bullish' ? '🟢' : sentiment === 'bearish' ? '🔴' : '⚪';
    const isBreaking = article.isBreaking ? colors.breaking(' BREAKING ') + ' ' : '';
    
    console.log(
      chalk.dim(`${String(i + 1).padStart(2, '0')}.`) +
      ` ${isBreaking}${colors.title(article.title)}`
    );
    console.log(
      `    ${sentimentIcon} ${colors.source(article.source)} • ${colors.time(article.timeAgo)}`
    );
    console.log();
  });
  
  process.exit(0);
}

// Full dashboard mode
async function runDashboard() {
  // Create screen
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Free Crypto News Dashboard',
  });

  // Create grid layout
  const grid = new contrib.grid({ rows: 12, cols: 12, screen });

  // Header
  const header = grid.set(0, 0, 1, 12, blessed.box, {
    content: gradient.cristal(' 🆓 FREE CRYPTO NEWS ') + chalk.dim(' | Press q to quit | r to refresh'),
    style: { fg: 'white' },
  });

  // News list (main area)
  const newsList = grid.set(1, 0, 8, 8, contrib.log, {
    label: ' 📰 Latest News ',
    border: { type: 'line', fg: 'cyan' },
    style: { border: { fg: 'cyan' } },
    scrollable: true,
    scrollbar: { ch: ' ', track: { bg: 'gray' }, style: { inverse: true } },
  });

  // Fear & Greed Gauge
  const fearGreedGauge = grid.set(1, 8, 2, 4, contrib.gauge, {
    label: ' 😱 Fear & Greed ',
    border: { type: 'line', fg: 'yellow' },
    style: { border: { fg: 'yellow' } },
    stroke: 'green',
    fill: 'white',
  });

  // Trending topics
  const trendingBox = grid.set(3, 8, 3, 4, blessed.list, {
    label: ' 🔥 Trending ',
    border: { type: 'line', fg: 'magenta' },
    style: { 
      border: { fg: 'magenta' },
      selected: { bg: 'magenta' },
    },
    items: ['Loading...'],
  });

  // Prices sparkline
  const pricesTable = grid.set(6, 8, 3, 4, contrib.table, {
    label: ' 💰 Prices ',
    border: { type: 'line', fg: 'green' },
    style: { border: { fg: 'green' } },
    columnWidth: [8, 12, 8],
    columnSpacing: 1,
  });

  // Sentiment donut
  const sentimentDonut = grid.set(9, 0, 3, 4, contrib.donut, {
    label: ' 📊 Market Sentiment ',
    border: { type: 'line', fg: 'blue' },
    style: { border: { fg: 'blue' } },
    radius: 8,
    arcWidth: 3,
  });

  // Sources breakdown
  const sourcesBar = grid.set(9, 4, 3, 4, contrib.bar, {
    label: ' 📡 Sources ',
    border: { type: 'line', fg: 'cyan' },
    style: { border: { fg: 'cyan' } },
    barWidth: 6,
    barSpacing: 2,
    xOffset: 0,
    maxHeight: 9,
  });

  // Status/footer
  const statusBox = grid.set(9, 8, 3, 4, blessed.box, {
    label: ' ℹ️ Status ',
    border: { type: 'line', fg: 'gray' },
    style: { border: { fg: 'gray' } },
    content: 'Initializing...',
  });

  // Update functions
  async function updateNews() {
    try {
      const { articles } = await fetchNews();
      newsList.setContent('');
      
      articles.forEach((article, i) => {
        const sentiment = article.sentiment || 'neutral';
        const sentimentIcon = sentiment === 'bullish' ? '🟢' : sentiment === 'bearish' ? '🔴' : '⚪';
        const isBreaking = article.isBreaking ? chalk.bgRed.white(' BREAKING ') + ' ' : '';
        
        newsList.log(
          `${isBreaking}${chalk.white.bold(article.title)}`
        );
        newsList.log(
          `  ${sentimentIcon} ${chalk.cyan(article.source)} • ${chalk.dim(article.timeAgo)}`
        );
        newsList.log('');
      });
    } catch (e) {
      newsList.log(chalk.red(`Error: ${e.message}`));
    }
  }

  async function updateFearGreed() {
    try {
      const data = await fetchFearGreed();
      fearGreedGauge.setPercent(data.value);
      fearGreedGauge.setLabel(` 😱 Fear & Greed: ${data.value} (${data.classification}) `);
      
      // Color based on value
      if (data.value < 25) fearGreedGauge.setOptions({ stroke: 'red' });
      else if (data.value < 50) fearGreedGauge.setOptions({ stroke: 'yellow' });
      else if (data.value < 75) fearGreedGauge.setOptions({ stroke: 'green' });
      else fearGreedGauge.setOptions({ stroke: 'cyan' });
    } catch (e) {
      // Ignore errors
    }
  }

  async function updateTrending() {
    try {
      const data = await fetchTrending();
      const items = data.topics?.map(t => `${t.topic} (${t.count})`) || ['No data'];
      trendingBox.setItems(items);
    } catch (e) {
      trendingBox.setItems(['Error loading']);
    }
  }

  async function updatePrices() {
    try {
      const data = await fetchPrices();
      const coins = data.coins || data || [];
      const tableData = coins.slice(0, 5).map(coin => [
        coin.symbol?.toUpperCase() || 'N/A',
        `$${(coin.current_price || coin.price || 0).toLocaleString()}`,
        `${(coin.price_change_percentage_24h || 0).toFixed(1)}%`,
      ]);
      pricesTable.setData({
        headers: ['Coin', 'Price', '24h'],
        data: tableData,
      });
    } catch (e) {
      // Ignore
    }
  }

  async function updateSentiment() {
    try {
      const data = await fetchSentiment();
      const market = data.market || {};
      
      sentimentDonut.setData([
        { label: 'Bullish', percent: market.score || 50, color: 'green' },
        { label: 'Bearish', percent: 100 - (market.score || 50), color: 'red' },
      ]);
    } catch (e) {
      // Ignore
    }
  }

  async function updateSources() {
    try {
      const { articles } = await fetchNews({ limit: 50 });
      const sourceCounts = {};
      articles.forEach(a => {
        sourceCounts[a.sourceKey || a.source] = (sourceCounts[a.sourceKey || a.source] || 0) + 1;
      });
      
      const sorted = Object.entries(sourceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      sourcesBar.setData({
        titles: sorted.map(s => s[0].slice(0, 6)),
        data: sorted.map(s => s[1]),
      });
    } catch (e) {
      // Ignore
    }
  }

  function updateStatus(message) {
    const now = new Date().toLocaleTimeString();
    statusBox.setContent([
      `Last update: ${now}`,
      '',
      message || 'Connected',
      '',
      options.watch ? '🔴 LIVE' : '⏸️ Static',
    ].join('\n'));
  }

  // Initial load
  async function initialLoad() {
    updateStatus('Loading...');
    screen.render();
    
    await Promise.all([
      updateNews(),
      updateFearGreed(),
      updateTrending(),
      updatePrices(),
      updateSentiment(),
      updateSources(),
    ]);
    
    updateStatus('Ready');
    screen.render();
  }

  // SSE for real-time updates
  function startSSE() {
    if (!options.watch) return;
    
    const es = new EventSource(`${API_BASE}/sse`);
    
    es.addEventListener('news', (event) => {
      const data = JSON.parse(event.data);
      updateNews();
      updateStatus(`New: ${data.articles?.[0]?.title?.slice(0, 30)}...`);
      screen.render();
    });
    
    es.addEventListener('breaking', (event) => {
      const article = JSON.parse(event.data);
      newsList.log(chalk.bgRed.white.bold(' 🚨 BREAKING '));
      newsList.log(chalk.white.bold(article.title));
      newsList.log(`  ${chalk.cyan(article.source)}`);
      newsList.log('');
      screen.render();
    });
    
    es.onerror = () => {
      updateStatus('SSE disconnected, reconnecting...');
      screen.render();
    };
  }

  // Key bindings
  screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
  screen.key(['r'], async () => {
    updateStatus('Refreshing...');
    screen.render();
    await initialLoad();
  });

  // Auto refresh every 60s
  setInterval(async () => {
    if (!options.watch) {
      await updateNews();
      await updatePrices();
      updateStatus('Auto-refreshed');
      screen.render();
    }
  }, 60000);

  // Start
  await initialLoad();
  startSSE();
  screen.render();
}

// Main
async function main() {
  if (options.minimal) {
    await runMinimal();
  } else {
    await runDashboard();
  }
}

main().catch(console.error);
