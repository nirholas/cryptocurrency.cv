#!/usr/bin/env node

/**
 * @fileoverview Free Crypto News CLI
 * 
 * Command-line interface for crypto news.
 * 
 * @example
 * npx crypto-news            # Latest news
 * npx crypto-news --bitcoin  # Bitcoin news
 * npx crypto-news --defi     # DeFi news
 * npx crypto-news -s "eth"   # Search
 * npx crypto-news --breaking # Breaking news
 */

const https = require('https');

const BASE_URL = 'https://cryptocurrency.cv';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const SOURCE_COLORS = {
  'CoinDesk': COLORS.blue,
  'The Block': COLORS.magenta,
  'Decrypt': COLORS.green,
  'CoinTelegraph': COLORS.yellow,
  'Bitcoin Magazine': COLORS.yellow,
  'Blockworks': COLORS.blue,
  'The Defiant': COLORS.magenta,
};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function printArticle(article, index) {
  const sourceColor = SOURCE_COLORS[article.source] || COLORS.cyan;
  
  console.log(`${COLORS.dim}${index}.${COLORS.reset} ${COLORS.bright}${article.title}${COLORS.reset}`);
  console.log(`   ${sourceColor}${article.source}${COLORS.reset} ${COLORS.dim}• ${article.timeAgo}${COLORS.reset}`);
  if (article.description) {
    const desc = article.description.length > 100 
      ? article.description.slice(0, 100) + '...' 
      : article.description;
    console.log(`   ${COLORS.dim}${desc}${COLORS.reset}`);
  }
  console.log();
}

function printBreaking(article) {
  console.log(`${COLORS.red}${COLORS.bright}🔴 BREAKING${COLORS.reset} ${article.title}`);
  console.log(`   ${COLORS.dim}${article.source} • ${article.timeAgo}${COLORS.reset}`);
  console.log();
}

function printHelp() {
  console.log(`
${COLORS.bright}Free Crypto News CLI${COLORS.reset}
${COLORS.dim}Real-time crypto news from 130+ sources${COLORS.reset}

${COLORS.bright}USAGE${COLORS.reset}
  crypto-news [options]

${COLORS.bright}OPTIONS${COLORS.reset}
  -h, --help       Show this help
  -n, --limit <n>  Number of articles (default: 10)
  -s, --search <q> Search for keywords
  --bitcoin        Bitcoin news only
  --defi           DeFi news only
  --breaking       Breaking news (< 2 hours)
  --trending       Trending topics
  --sources        List all sources
  --json           Output as JSON

${COLORS.bright}EXAMPLES${COLORS.reset}
  crypto-news                    Latest news
  crypto-news -n 5               Top 5 articles
  crypto-news --bitcoin          Bitcoin news
  crypto-news -s "ethereum ETF"  Search
  crypto-news --breaking         Breaking news
  crypto-news --trending         Trending topics

${COLORS.bright}MORE INFO${COLORS.reset}
  https://github.com/nirholas/free-crypto-news
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let endpoint = '/api/news';
  let limit = 10;
  let search = '';
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      printHelp();
      return;
    }
    
    if (arg === '-n' || arg === '--limit') {
      limit = parseInt(args[++i]) || 10;
    }
    
    if (arg === '-s' || arg === '--search') {
      search = args[++i] || '';
      endpoint = '/api/search';
    }
    
    if (arg === '--bitcoin') {
      endpoint = '/api/bitcoin';
    }
    
    if (arg === '--defi') {
      endpoint = '/api/defi';
    }
    
    if (arg === '--breaking') {
      endpoint = '/api/breaking';
    }
    
    if (arg === '--trending') {
      endpoint = '/api/trending';
    }
    
    if (arg === '--sources') {
      endpoint = '/api/sources';
    }
    
    if (arg === '--json') {
      json = true;
    }
  }

  try {
    let url = `${BASE_URL}${endpoint}?limit=${limit}`;
    if (search) {
      url += `&q=${encodeURIComponent(search)}`;
    }

    const data = await fetch(url);

    if (json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    // Handle different response types
    if (endpoint === '/api/trending') {
      console.log(`\n${COLORS.bright}📈 Trending Topics${COLORS.reset}\n`);
      (data.trending || []).forEach((topic, i) => {
        const sentiment = topic.sentiment === 'positive' ? COLORS.green :
                         topic.sentiment === 'negative' ? COLORS.red : COLORS.dim;
        console.log(`${COLORS.dim}${i + 1}.${COLORS.reset} ${COLORS.bright}${topic.topic}${COLORS.reset} ${sentiment}(${topic.sentiment})${COLORS.reset} - ${topic.count} mentions`);
      });
      return;
    }

    if (endpoint === '/api/sources') {
      console.log(`\n${COLORS.bright}📰 News Sources${COLORS.reset}\n`);
      (data.sources || []).forEach(source => {
        const color = SOURCE_COLORS[source.name] || COLORS.cyan;
        console.log(`${color}● ${source.name}${COLORS.reset} - ${source.url}`);
      });
      return;
    }

    // Regular news
    const articles = data.articles || [];
    
    if (articles.length === 0) {
      console.log(`${COLORS.dim}No articles found.${COLORS.reset}`);
      return;
    }

    console.log();
    
    if (endpoint === '/api/breaking') {
      console.log(`${COLORS.red}${COLORS.bright}🔴 BREAKING NEWS${COLORS.reset}\n`);
      articles.forEach(printBreaking);
    } else {
      const title = search ? `Search: "${search}"` :
                   endpoint === '/api/bitcoin' ? '₿ Bitcoin News' :
                   endpoint === '/api/defi' ? '🔷 DeFi News' :
                   '📰 Latest Crypto News';
      console.log(`${COLORS.bright}${title}${COLORS.reset}\n`);
      articles.forEach((article, i) => printArticle(article, i + 1));
    }

    console.log(`${COLORS.dim}---${COLORS.reset}`);
    console.log(`${COLORS.dim}Powered by Free Crypto News API${COLORS.reset}`);
    console.log(`${COLORS.dim}https://cryptocurrency.cv${COLORS.reset}\n`);

  } catch (error) {
    console.error(`${COLORS.red}Error: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
}

main();
