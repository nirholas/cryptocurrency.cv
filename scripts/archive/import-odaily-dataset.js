#!/usr/bin/env node
/**
 * Import Odaily (星球日报) Chinese Crypto News Dataset
 * 
 * Dataset: 325,940 articles from 2018-01 to 2025-02
 * Source: https://github.com/tanyazhang/Chinese-Crypto-News-dataset-2018-Jan---2025-Feb
 * 
 * CSV columns: title, id, news_url, link, type, published_at, scraped_date
 * 
 * Usage:
 *   node import-odaily-dataset.js [--verbose]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const WORKSPACE = '/workspaces/free-crypto-news';
const CSV_PATH = path.join(WORKSPACE, '.temp-import/chinese/Odaily_news_2018Jan_2025Feb.csv');
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/v2/articles');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// Chinese ticker patterns
const TICKER_PATTERNS = {
  'BTC': /比特币|Bitcoin|BTC/i,
  'ETH': /以太坊|以太币|Ethereum|ETH/i,
  'SOL': /Solana|SOL/i,
  'XRP': /瑞波|Ripple|XRP/i,
  'ADA': /卡尔达诺|Cardano|ADA/i,
  'DOGE': /狗狗币|Dogecoin|DOGE/i,
  'DOT': /波卡|Polkadot|DOT/i,
  'AVAX': /雪崩|Avalanche|AVAX/i,
  'MATIC': /Polygon|MATIC/i,
  'LINK': /Chainlink|LINK/i,
  'UNI': /Uniswap|UNI/i,
  'ATOM': /Cosmos|ATOM/i,
  'LTC': /莱特币|Litecoin|LTC/i,
  'BCH': /比特现金|Bitcoin Cash|BCH/i,
  'USDT': /泰达币|Tether|USDT/i,
  'USDC': /USDC/i,
  'BNB': /币安币|Binance|BNB/i,
  'TRX': /波场|Tron|TRX/i,
  'SHIB': /柴犬币|Shiba|SHIB/i,
  'FTT': /FTX|FTT/i,
  'LUNA': /Terra|LUNA/i,
  'APT': /Aptos|APT/i,
  'ARB': /Arbitrum|ARB/i,
  'OP': /Optimism|OP/i,
};

// Tag patterns for Chinese content
const TAG_PATTERNS = {
  'defi': /DeFi|去中心化金融|流动性挖矿|DEX|AMM/i,
  'nft': /NFT|非同质化代币|数字藏品|元宇宙/i,
  'regulation': /监管|政策|法规|合规|央行|SEC/i,
  'exchange': /交易所|币安|Coinbase|OKX|火币|Huobi/i,
  'mining': /挖矿|矿机|算力|矿工|矿池/i,
  'stablecoin': /稳定币|USDT|USDC|DAI/i,
  'layer2': /Layer2|L2|Rollup|扩容/i,
  'hack': /黑客|攻击|漏洞|被盗|安全/i,
  'airdrop': /空投|Airdrop/i,
  'ipo': /上市|IPO|融资/i,
};

/**
 * Generate content hash
 */
function generateHash(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 16);
}

/**
 * Generate article ID
 */
function generateId(title, pubDate) {
  const content = `${title}-${pubDate}`;
  return generateHash(content);
}

/**
 * Extract tickers from Chinese text
 */
function extractTickers(title) {
  const tickers = [];
  for (const [ticker, pattern] of Object.entries(TICKER_PATTERNS)) {
    if (pattern.test(title)) {
      tickers.push(ticker);
    }
  }
  return [...new Set(tickers)];
}

/**
 * Extract tags from Chinese text
 */
function extractTags(title) {
  const tags = [];
  for (const [tag, pattern] of Object.entries(TAG_PATTERNS)) {
    if (pattern.test(title)) {
      tags.push(tag);
    }
  }
  return tags;
}

/**
 * Determine category from title
 */
function extractCategory(title, type) {
  if (/比特币|Bitcoin|BTC/i.test(title)) return 'bitcoin';
  if (/以太坊|Ethereum|ETH/i.test(title)) return 'ethereum';
  if (/NFT|数字藏品/i.test(title)) return 'nft';
  if (/DeFi|去中心化金融/i.test(title)) return 'defi';
  if (/监管|政策/i.test(title)) return 'regulation';
  if (/交易所/i.test(title)) return 'exchange';
  return 'general';
}

/**
 * Simple sentiment from Chinese title
 */
function extractSentiment(title) {
  const positiveWords = /上涨|暴涨|突破|利好|牛市|新高|增长|成功|获批|合作/;
  const negativeWords = /下跌|暴跌|崩盘|利空|熊市|骗局|被盗|黑客|清算|破产/;
  
  const hasPositive = positiveWords.test(title);
  const hasNegative = negativeWords.test(title);
  
  if (hasPositive && !hasNegative) {
    return { score: 0.6, label: 'positive', confidence: 0.6 };
  } else if (hasNegative && !hasPositive) {
    return { score: -0.6, label: 'negative', confidence: 0.6 };
  }
  return { score: 0, label: 'neutral', confidence: 0.5 };
}

/**
 * Parse CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

/**
 * Convert to v2 article format
 */
function convertToV2Article(row) {
  const [title, id, newsUrl, link, type, publishedAt, scrapedDate] = row;
  
  if (!title || !publishedAt) return null;
  
  // Parse date
  let pubDate;
  try {
    pubDate = new Date(publishedAt);
    if (isNaN(pubDate.getTime())) return null;
    if (pubDate.getFullYear() < 2017 || pubDate.getFullYear() > 2026) return null;
  } catch {
    return null;
  }
  
  const articleId = generateId(title, publishedAt);
  const contentHash = generateHash(title);
  const tickers = extractTickers(title);
  const tags = extractTags(title);
  const category = extractCategory(title, type);
  const sentiment = extractSentiment(title);
  
  // Use the actual URL
  const url = link || newsUrl || `https://www.odaily.news/post/${id}`;
  
  return {
    id: articleId,
    schema_version: '2.0.0',
    title: title.trim(),
    link: url,
    canonical_link: url,
    pub_date: pubDate.toISOString(),
    first_seen: pubDate.toISOString(),
    last_seen: pubDate.toISOString(),
    fetch_count: 1,
    source: 'Odaily 星球日报',
    source_key: 'odaily',
    category,
    tickers,
    tags,
    sentiment,
    market_context: null,
    content_hash: contentHash,
    meta: {
      word_count: title.length,
      has_numbers: /\d/.test(title),
      is_breaking: false,
      is_opinion: false,
      has_url: true,
      url_source: 'csv',
      original_id: id,
      import_source: 'odaily-dataset',
      language: 'zh',
      has_valid_title: true,
      has_valid_date: true
    }
  };
}

/**
 * Main import function
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('  IMPORT ODAILY CHINESE CRYPTO NEWS DATASET');
  console.log('═'.repeat(70));
  console.log();
  
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }
  
  // Read CSV
  console.log(`Reading ${CSV_PATH}...`);
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`Total lines: ${lines.length.toLocaleString()}`);
  
  // Skip header
  const dataLines = lines.slice(1).filter(line => line.trim());
  console.log(`Data rows: ${dataLines.length.toLocaleString()}\n`);
  
  // Group by month
  const monthlyArticles = {};
  const seenHashes = new Set();
  
  let processed = 0;
  let imported = 0;
  let duplicates = 0;
  let invalid = 0;
  
  for (const line of dataLines) {
    processed++;
    
    if (VERBOSE && processed % 50000 === 0) {
      console.log(`  Processing row ${processed.toLocaleString()}...`);
    }
    
    const row = parseCSVLine(line);
    if (row.length < 6) {
      invalid++;
      continue;
    }
    
    const article = convertToV2Article(row);
    if (!article) {
      invalid++;
      continue;
    }
    
    // Dedup by content hash
    if (seenHashes.has(article.content_hash)) {
      duplicates++;
      continue;
    }
    seenHashes.add(article.content_hash);
    
    // Get month key (YYYY-MM)
    const monthKey = article.pub_date.substring(0, 7);
    
    if (!monthlyArticles[monthKey]) {
      monthlyArticles[monthKey] = [];
    }
    monthlyArticles[monthKey].push(article);
    imported++;
  }
  
  console.log(`\nProcessed: ${processed.toLocaleString()}`);
  console.log(`Imported:  ${imported.toLocaleString()}`);
  console.log(`Duplicates: ${duplicates.toLocaleString()}`);
  console.log(`Invalid:   ${invalid.toLocaleString()}`);
  
  // Write to archive files (append to existing)
  console.log('\nWriting to archive files...');
  
  const months = Object.keys(monthlyArticles).sort();
  let totalWritten = 0;
  
  for (const month of months) {
    const articles = monthlyArticles[month];
    const filePath = path.join(ARCHIVE_DIR, `${month}.jsonl`);
    
    // Load existing articles
    let existing = [];
    let existingHashes = new Set();
    
    if (fs.existsSync(filePath)) {
      const existingContent = fs.readFileSync(filePath, 'utf-8');
      existing = existingContent.trim().split('\n').filter(Boolean).map(line => {
        try {
          const a = JSON.parse(line);
          existingHashes.add(a.content_hash);
          return a;
        } catch { return null; }
      }).filter(Boolean);
    }
    
    // Filter out duplicates with existing
    const newArticles = articles.filter(a => !existingHashes.has(a.content_hash));
    
    if (newArticles.length === 0) {
      if (VERBOSE) console.log(`  ${month}: 0 new (${existing.length} existing)`);
      continue;
    }
    
    // Merge and sort
    const all = [...existing, ...newArticles];
    all.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));
    
    // Write
    const jsonl = all.map(a => JSON.stringify(a)).join('\n');
    fs.writeFileSync(filePath, jsonl + '\n');
    
    totalWritten += newArticles.length;
    console.log(`  ${month}: +${newArticles.length.toLocaleString()} new (${all.length.toLocaleString()} total)`);
  }
  
  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  IMPORT COMPLETE');
  console.log('═'.repeat(70));
  console.log(`
Articles imported:  ${imported.toLocaleString()}
New articles added: ${totalWritten.toLocaleString()}
Month files:        ${months.length}
Date range:         ${months[0]} to ${months[months.length - 1]}

Source: Odaily 星球日报 (Chinese Crypto News)
Language: Chinese (zh)

Next steps:
  1. Rebuild indexes: node scripts/archive/build-indexes.js --verbose
  2. Rebuild search:  node scripts/archive/build-search-index.js --verbose
`);
}

main().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
