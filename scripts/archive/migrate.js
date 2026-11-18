#!/usr/bin/env node

/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Migration Script: v1 → v2 Archive Format
 * 
 * Converts existing archive files (JSON per day) to new format (JSONL per month)
 * with full enrichment.
 */

const fs = require('fs');
const path = require('path');
const { enrichArticle } = require('./enrich');

const ARCHIVE_DIR = process.env.ARCHIVE_DIR || path.join(__dirname, '../../archive');

/**
 * Find all v1 archive files
 */
function findV1Files() {
  const files = [];
  
  // Look for year directories
  const entries = fs.readdirSync(ARCHIVE_DIR);
  
  for (const entry of entries) {
    const yearPath = path.join(ARCHIVE_DIR, entry);
    
    // Skip non-directories and v2 directory
    if (!fs.statSync(yearPath).isDirectory() || entry === 'v2') {
      continue;
    }
    
    // Check if it's a year directory (4 digits)
    if (!/^\d{4}$/.test(entry)) {
      continue;
    }
    
    // Look for month directories
    const months = fs.readdirSync(yearPath);
    
    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      
      if (!fs.statSync(monthPath).isDirectory()) {
        continue;
      }
      
      // Look for day JSON files
      const days = fs.readdirSync(monthPath);
      
      for (const day of days) {
        if (day.endsWith('.json')) {
          files.push({
            path: path.join(monthPath, day),
            year: entry,
            month: month,
            date: day.replace('.json', '')
          });
        }
      }
    }
  }
  
  return files.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Migrate a single v1 file to v2 format
 */
function migrateFile(fileInfo, existingArticles) {
  console.log(`  Migrating ${fileInfo.date}...`);
  
  try {
    const content = fs.readFileSync(fileInfo.path, 'utf-8');
    const data = JSON.parse(content);
    
    const articles = data.articles || [];
    let newCount = 0;
    
    for (const article of articles) {
      const enriched = enrichArticle(article, null);
      
      // Use the file's date for first_seen if pubDate not available
      enriched.first_seen = article.pubDate || `${fileInfo.date}T00:00:00.000Z`;
      enriched.last_seen = data.fetchedAt || enriched.first_seen;
      
      if (!existingArticles.has(enriched.id)) {
        existingArticles.set(enriched.id, enriched);
        newCount++;
      }
    }
    
    return newCount;
  } catch (error) {
    console.error(`  ❌ Error migrating ${fileInfo.path}: ${error.message}`);
    return 0;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🔄 Starting v1 → v2 archive migration...\n');
  
  const v1Files = findV1Files();
  console.log(`📁 Found ${v1Files.length} v1 archive files\n`);
  
  if (v1Files.length === 0) {
    console.log('ℹ️ No v1 files to migrate');
    return;
  }
  
  // Group by year-month
  const byMonth = {};
  
  for (const file of v1Files) {
    const key = `${file.year}-${file.month}`;
    if (!byMonth[key]) {
      byMonth[key] = [];
    }
    byMonth[key].push(file);
  }
  
  // Process each month
  const v2Dir = path.join(ARCHIVE_DIR, 'v2', 'articles');
  if (!fs.existsSync(v2Dir)) {
    fs.mkdirSync(v2Dir, { recursive: true });
  }
  
  let totalMigrated = 0;
  
  for (const [monthKey, files] of Object.entries(byMonth)) {
    console.log(`\n📅 Processing ${monthKey} (${files.length} days)...`);
    
    const jsonlPath = path.join(v2Dir, `${monthKey}.jsonl`);
    
    // Load existing v2 articles for this month
    const existingArticles = new Map();
    let content = null;
    try {
      content = fs.readFileSync(jsonlPath, 'utf-8');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
    if (content !== null) {
      const lines = content.trim().split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const article = JSON.parse(line);
          existingArticles.set(article.id, article);
        } catch {}
      }
      console.log(`  Existing v2 articles: ${existingArticles.size}`);
    }
    
    // Migrate each file
    let monthMigrated = 0;
    for (const file of files) {
      monthMigrated += migrateFile(file, existingArticles);
    }
    
    // Write the merged JSONL
    const lines = Array.from(existingArticles.values())
      .sort((a, b) => (a.first_seen || '').localeCompare(b.first_seen || ''))
      .map(a => JSON.stringify(a))
      .join('\n') + '\n';
    
    fs.writeFileSync(jsonlPath, lines);
    
    console.log(`  ✅ Migrated ${monthMigrated} new articles (${existingArticles.size} total)`);
    totalMigrated += monthMigrated;
  }
  
  // Create meta directory and stats
  const metaDir = path.join(ARCHIVE_DIR, 'v2', 'meta');
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true });
  }
  
  // Copy schema
  const schemaSource = path.join(__dirname, 'schema.json');
  const schemaDest = path.join(metaDir, 'schema.json');
  if (fs.existsSync(schemaSource)) {
    fs.copyFileSync(schemaSource, schemaDest);
  }
  
  console.log(`\n✅ Migration complete!`);
  console.log(`   Total migrated: ${totalMigrated} articles`);
  console.log(`   V2 archive: ${v2Dir}`);
}

// CLI
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrate };
