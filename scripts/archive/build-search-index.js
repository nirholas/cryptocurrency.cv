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
 * Archive Search Index Builder
 * 
 * Creates optimized search indexes for the v2 archive:
 * - Full-text inverted index for title/description search
 * - n-gram index for fuzzy matching
 * - Entity index (people, companies, protocols)
 * 
 * Indexes are stored in memory-efficient format for fast Edge Runtime queries.
 * 
 * Usage:
 *   node build-search-index.js [options]
 * 
 * Options:
 *   --verbose       Detailed output
 *   --months N      Process last N months only (default: all)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/workspaces/free-crypto-news';
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive/articles');
const INDEX_DIR = path.join(WORKSPACE, 'archive/search');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const MONTHS = parseInt(args.find((a, i) => args[i-1] === '--months') || '0');

// Stop words to exclude from index
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
  'the', 'to', 'was', 'were', 'will', 'with', 'this', 'but', 'they',
  'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'can', 'just', 'should', 'now', 'new', 'says', 'said', 'could',
  'would', 'also', 'may', 'about', 'after', 'before', 'over', 'under',
  'between', 'out', 'into', 'during', 'through', 'up', 'down', 'using'
]);

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Tokenize text into searchable terms
 */
function tokenize(text) {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s$]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= 2 && 
      word.length <= 30 &&
      !STOP_WORDS.has(word)
    );
}

/**
 * Stream articles from JSONL file
 */
function* streamArticles(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  
  for (const line of lines) {
    try {
      yield JSON.parse(line);
    } catch {}
  }
}

/**
 * Compact inverted index format
 * Maps: term -> [articleId1, articleId2, ...]
 */
class InvertedIndex {
  constructor() {
    this.index = new Map();
    this.docCount = 0;
  }
  
  addDocument(id, terms) {
    this.docCount++;
    for (const term of terms) {
      if (!this.index.has(term)) {
        this.index.set(term, []);
      }
      // Only store first 1000 docs per term to keep size manageable
      if (this.index.get(term).length < 1000) {
        this.index.get(term).push(id);
      }
    }
  }
  
  toJSON() {
    const obj = {};
    for (const [term, ids] of this.index.entries()) {
      if (ids.length >= 2) { // Only include terms that appear in multiple docs
        obj[term] = ids;
      }
    }
    return obj;
  }
}

/**
 * Main build function
 */
async function main() {
  console.log('═'.repeat(70));
  console.log('  BUILD ARCHIVE SEARCH INDEX');
  console.log('═'.repeat(70));
  console.log();
  
  ensureDir(INDEX_DIR);
  
  // Get files to process
  let files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.jsonl') && f !== 'unknown-date.jsonl')
    .sort()
    .reverse(); // Process most recent first
  
  if (MONTHS > 0) {
    files = files.slice(0, MONTHS);
  }
  
  console.log(`Processing ${files.length} month files...\n`);
  
  // Initialize indexes
  const titleIndex = new InvertedIndex();
  const entityIndex = {
    people: {},     // name -> [articleIds]
    companies: {},  // name -> [articleIds]
    protocols: {}   // name -> [articleIds]
  };
  const tagIndex = {};  // tag -> [articleIds]
  
  // Article metadata for search results
  const articleMeta = {}; // id -> { title, source, date, month }
  
  let totalArticles = 0;
  let totalTerms = 0;
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(ARCHIVE_DIR, file);
    const month = file.replace('.jsonl', '');
    
    if (VERBOSE) process.stdout.write(`Indexing ${file}...`);
    
    let fileCount = 0;
    
    for (const article of streamArticles(filePath)) {
      const id = article.id || article.content_hash;
      
      // Index title
      const titleTerms = tokenize(article.title);
      titleIndex.addDocument(id, titleTerms);
      totalTerms += titleTerms.length;
      
      // Store minimal metadata for search results
      articleMeta[id] = {
        t: article.title.substring(0, 100), // title (truncated)
        s: article.source_key || 'unknown', // source
        d: (article.pub_date || article.first_seen || '').substring(0, 10), // date
        m: month // month file
      };
      
      // Index entities
      if (article.entities) {
        for (const person of (article.entities.people || [])) {
          if (!entityIndex.people[person]) entityIndex.people[person] = [];
          if (entityIndex.people[person].length < 500) {
            entityIndex.people[person].push(id);
          }
        }
        for (const company of (article.entities.companies || [])) {
          if (!entityIndex.companies[company]) entityIndex.companies[company] = [];
          if (entityIndex.companies[company].length < 500) {
            entityIndex.companies[company].push(id);
          }
        }
        for (const protocol of (article.entities.protocols || [])) {
          if (!entityIndex.protocols[protocol]) entityIndex.protocols[protocol] = [];
          if (entityIndex.protocols[protocol].length < 500) {
            entityIndex.protocols[protocol].push(id);
          }
        }
      }
      
      // Index tags
      for (const tag of (article.tags || [])) {
        if (!tagIndex[tag]) tagIndex[tag] = [];
        if (tagIndex[tag].length < 1000) {
          tagIndex[tag].push(id);
        }
      }
      
      fileCount++;
      totalArticles++;
    }
    
    if (VERBOSE) console.log(` ${fileCount.toLocaleString()} articles`);
  }
  
  // Write indexes
  console.log('\nWriting indexes...');
  
  // Title inverted index (split into chunks if too large)
  const titleIndexData = titleIndex.toJSON();
  const titleTermCount = Object.keys(titleIndexData).length;
  fs.writeFileSync(
    path.join(INDEX_DIR, 'title-index.json'),
    JSON.stringify(titleIndexData)
  );
  console.log(`✓ Title index: ${titleTermCount.toLocaleString()} unique terms`);
  
  // Entity index
  fs.writeFileSync(
    path.join(INDEX_DIR, 'entity-index.json'),
    JSON.stringify(entityIndex)
  );
  const entityCount = Object.keys(entityIndex.people).length + 
                      Object.keys(entityIndex.companies).length + 
                      Object.keys(entityIndex.protocols).length;
  console.log(`✓ Entity index: ${entityCount.toLocaleString()} entities`);
  
  // Tag index
  fs.writeFileSync(
    path.join(INDEX_DIR, 'tag-index.json'),
    JSON.stringify(tagIndex)
  );
  console.log(`✓ Tag index: ${Object.keys(tagIndex).length.toLocaleString()} tags`);
  
  // Article metadata (for displaying search results)
  fs.writeFileSync(
    path.join(INDEX_DIR, 'article-meta.json'),
    JSON.stringify(articleMeta)
  );
  console.log(`✓ Article metadata: ${Object.keys(articleMeta).length.toLocaleString()} entries`);
  
  // Write search manifest
  const manifest = {
    version: '1.0.0',
    created_at: new Date().toISOString(),
    total_articles: totalArticles,
    total_terms: totalTerms,
    unique_terms: titleTermCount,
    entity_counts: {
      people: Object.keys(entityIndex.people).length,
      companies: Object.keys(entityIndex.companies).length,
      protocols: Object.keys(entityIndex.protocols).length
    },
    tag_count: Object.keys(tagIndex).length,
    months_indexed: files.length
  };
  fs.writeFileSync(
    path.join(INDEX_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Print summary
  console.log(`
═══════════════════════════════════════════════════════════════════════
  SEARCH INDEX COMPLETE
═══════════════════════════════════════════════════════════════════════

Articles Indexed:     ${totalArticles.toLocaleString()}
Unique Terms:         ${titleTermCount.toLocaleString()}
Total Terms:          ${totalTerms.toLocaleString()}
Months Covered:       ${files.length}

Entity Index:
  - People:           ${Object.keys(entityIndex.people).length.toLocaleString()}
  - Companies:        ${Object.keys(entityIndex.companies).length.toLocaleString()}
  - Protocols:        ${Object.keys(entityIndex.protocols).length.toLocaleString()}

Tag Count:            ${Object.keys(tagIndex).length.toLocaleString()}

Index Files:
  - ${path.join(INDEX_DIR, 'title-index.json')}
  - ${path.join(INDEX_DIR, 'entity-index.json')}
  - ${path.join(INDEX_DIR, 'tag-index.json')}
  - ${path.join(INDEX_DIR, 'article-meta.json')}
  - ${path.join(INDEX_DIR, 'manifest.json')}
`);
}

main().catch(console.error);
