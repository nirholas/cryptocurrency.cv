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
 * Archive V2 Master Orchestrator
 * 
 * Unified CLI for managing the v2 archive system.
 * Coordinates all archive operations in the correct order.
 * 
 * Usage:
 *   node orchestrate.js <command> [options]
 * 
 * Commands:
 *   status          Show archive status and health
 *   import          Import data from CryptoPanic CSV dataset
 *   enrich          Run enrichment pipeline (URLs and dates)
 *   build           Build all indexes and metadata
 *   analyze         Analyze data quality
 *   search          Search the archive (interactive)
 *   full-pipeline   Run complete pipeline (import → enrich → build)
 *   help            Show this help message
 * 
 * Examples:
 *   node orchestrate.js status
 *   node orchestrate.js enrich --batch-size 100 --max-batches 5
 *   node orchestrate.js build --verbose
 *   node orchestrate.js full-pipeline --dry-run
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const WORKSPACE = '/workspaces/free-crypto-news';
const SCRIPTS_DIR = path.join(WORKSPACE, 'scripts/archive');
const ARCHIVE_DIR = path.join(WORKSPACE, 'archive');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function banner(title) {
  console.log();
  log('═'.repeat(70), 'cyan');
  log(`  ${title}`, 'bright');
  log('═'.repeat(70), 'cyan');
  console.log();
}

/**
 * Run a script and stream output
 */
function runScript(scriptPath, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath, ...args], {
      cwd: WORKSPACE,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    proc.on('error', reject);
  });
}

/**
 * Command: status
 */
async function cmdStatus() {
  banner('ARCHIVE V2 STATUS');
  
  // Check archive structure
  const articlesDir = path.join(ARCHIVE_DIR, 'articles');
  const metaDir = path.join(ARCHIVE_DIR, 'meta');
  const indexDir = path.join(ARCHIVE_DIR, 'index');
  const searchDir = path.join(ARCHIVE_DIR, 'search');
  
  console.log('Directory Structure:');
  console.log(`  articles/   ${fs.existsSync(articlesDir) ? '✓ exists' : '✗ missing'}`);
  console.log(`  meta/       ${fs.existsSync(metaDir) ? '✓ exists' : '✗ missing'}`);
  console.log(`  index/      ${fs.existsSync(indexDir) ? '✓ exists' : '✗ missing'}`);
  console.log(`  search/     ${fs.existsSync(searchDir) ? '✓ exists' : '✗ missing'}`);
  console.log();
  
  // Count articles
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.jsonl'));
    let totalLines = 0;
    let unknownDateLines = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      const lines = content.split('\n').filter(Boolean).length;
      totalLines += lines;
      if (file === 'unknown-date.jsonl') {
        unknownDateLines = lines;
      }
    }
    
    console.log('Article Files:');
    console.log(`  Total files:       ${files.length}`);
    console.log(`  Total articles:    ${totalLines.toLocaleString()}`);
    console.log(`  Dated articles:    ${(totalLines - unknownDateLines).toLocaleString()}`);
    console.log(`  Unknown date:      ${unknownDateLines.toLocaleString()}`);
    console.log();
  }
  
  // Check stats.json
  const statsPath = path.join(metaDir, 'stats.json');
  if (fs.existsSync(statsPath)) {
    const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    console.log('Stats (from meta/stats.json):');
    console.log(`  Total articles:    ${stats.total_articles?.toLocaleString() || 'N/A'}`);
    console.log(`  With URL:          ${stats.total_with_url?.toLocaleString() || 'N/A'}`);
    console.log(`  With date:         ${stats.total_with_date?.toLocaleString() || 'N/A'}`);
    console.log(`  Date range:        ${stats.first_article_date?.substring(0, 10) || 'N/A'} to ${stats.last_article_date?.substring(0, 10) || 'N/A'}`);
    console.log(`  Last updated:      ${stats.last_updated || 'N/A'}`);
    console.log();
  } else {
    log('  ⚠ meta/stats.json not found - run "build" command', 'yellow');
    console.log();
  }
  
  // Check search index
  const searchManifestPath = path.join(searchDir, 'manifest.json');
  if (fs.existsSync(searchManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(searchManifestPath, 'utf-8'));
    console.log('Search Index:');
    console.log(`  Articles indexed:  ${manifest.total_articles?.toLocaleString() || 'N/A'}`);
    console.log(`  Unique terms:      ${manifest.unique_terms?.toLocaleString() || 'N/A'}`);
    console.log(`  Created:           ${manifest.created_at || 'N/A'}`);
    console.log();
  } else {
    log('  ⚠ Search index not found - run "build" command', 'yellow');
    console.log();
  }
  
  // Check enrichment progress
  const progressPath = path.join(WORKSPACE, '.temp-import/enrichment-progress.json');
  if (fs.existsSync(progressPath)) {
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    console.log('Enrichment Progress:');
    console.log(`  Last file:         ${progress.lastFile || 'N/A'}`);
    console.log(`  Batches completed: ${progress.batchesCompleted || 0}`);
    console.log();
  }
  
  // Recommendations
  console.log('Recommendations:');
  
  if (!fs.existsSync(statsPath)) {
    log('  → Run: node orchestrate.js build', 'blue');
  }
  
  const urlCachePath = path.join(WORKSPACE, '.temp-import/enrichment-url-cache.json');
  if (fs.existsSync(urlCachePath)) {
    const cache = JSON.parse(fs.readFileSync(urlCachePath, 'utf-8'));
    const cacheSize = Object.keys(cache).length;
    console.log(`  ℹ URL cache has ${cacheSize.toLocaleString()} entries`);
  }
  
  log('  → Run: node orchestrate.js enrich --verbose (to enrich more articles)', 'blue');
  console.log();
}

/**
 * Command: import
 */
async function cmdImport(args) {
  banner('IMPORT CRYPTOPANIC DATASET');
  
  const scriptPath = path.join(SCRIPTS_DIR, 'import-cryptopanic-dataset.js');
  
  if (!fs.existsSync(scriptPath)) {
    log('Import script not found!', 'red');
    return;
  }
  
  await runScript(scriptPath, args);
}

/**
 * Command: enrich
 */
async function cmdEnrich(args) {
  banner('RUN ENRICHMENT PIPELINE');
  
  const scriptPath = path.join(SCRIPTS_DIR, 'enrichment-pipeline.js');
  await runScript(scriptPath, args);
}

/**
 * Command: build
 */
async function cmdBuild(args) {
  banner('BUILD INDEXES AND METADATA');
  
  console.log('Step 1/2: Building archive indexes...\n');
  await runScript(path.join(SCRIPTS_DIR, 'build-indexes.js'), args);
  
  console.log('\nStep 2/2: Building search index...\n');
  await runScript(path.join(SCRIPTS_DIR, 'build-search-index.js'), args);
  
  log('\n✓ All indexes built successfully!', 'green');
}

/**
 * Command: analyze
 */
async function cmdAnalyze(args) {
  banner('ANALYZE DATA QUALITY');
  
  const scriptPath = path.join(SCRIPTS_DIR, 'analyze-archive.js');
  await runScript(scriptPath, args);
}

/**
 * Command: full-pipeline
 */
async function cmdFullPipeline(args) {
  banner('FULL ARCHIVE PIPELINE');
  
  const isDryRun = args.includes('--dry-run');
  
  console.log('This will run the complete archive pipeline:');
  console.log('  1. Analyze current data quality');
  console.log('  2. Run enrichment (URLs + dates)');
  console.log('  3. Build all indexes');
  console.log('  4. Generate final statistics');
  console.log();
  
  if (isDryRun) {
    log('DRY RUN MODE - No changes will be made\n', 'yellow');
  }
  
  // Step 1: Analyze
  console.log('\n' + '─'.repeat(70));
  log('STEP 1: ANALYZING DATA QUALITY', 'bright');
  console.log('─'.repeat(70) + '\n');
  await runScript(path.join(SCRIPTS_DIR, 'analyze-archive.js'), ['--sources']);
  
  // Step 2: Enrich
  console.log('\n' + '─'.repeat(70));
  log('STEP 2: RUNNING ENRICHMENT', 'bright');
  console.log('─'.repeat(70) + '\n');
  
  const enrichArgs = ['--mode', 'all', '--batch-size', '50', '--max-batches', '20'];
  if (isDryRun) enrichArgs.push('--dry-run');
  enrichArgs.push('--verbose');
  
  await runScript(path.join(SCRIPTS_DIR, 'enrichment-pipeline.js'), enrichArgs);
  
  // Step 3: Build indexes
  if (!isDryRun) {
    console.log('\n' + '─'.repeat(70));
    log('STEP 3: BUILDING INDEXES', 'bright');
    console.log('─'.repeat(70) + '\n');
    await runScript(path.join(SCRIPTS_DIR, 'build-indexes.js'), ['--verbose']);
    await runScript(path.join(SCRIPTS_DIR, 'build-search-index.js'), ['--verbose']);
  }
  
  // Final summary
  console.log('\n' + '═'.repeat(70));
  log('  PIPELINE COMPLETE', 'green');
  console.log('═'.repeat(70));
  
  if (!isDryRun) {
    console.log('\nNext steps:');
    console.log('  1. Commit the updated archive files');
    console.log('  2. Push to GitHub for API access');
    console.log('  3. Run "node orchestrate.js status" to verify');
  }
  console.log();
}

/**
 * Command: help
 */
function cmdHelp() {
  console.log(`
${colors.bright}Archive V2 Orchestrator${colors.reset}
${colors.dim}Unified CLI for managing the crypto news archive${colors.reset}

${colors.cyan}USAGE:${colors.reset}
  node orchestrate.js <command> [options]

${colors.cyan}COMMANDS:${colors.reset}
  ${colors.green}status${colors.reset}          Show archive status and health
  ${colors.green}import${colors.reset}          Import data from CryptoPanic CSV
  ${colors.green}enrich${colors.reset}          Run enrichment pipeline (URLs and dates)
  ${colors.green}build${colors.reset}           Build all indexes and metadata
  ${colors.green}analyze${colors.reset}         Analyze data quality
  ${colors.green}full-pipeline${colors.reset}   Run complete pipeline (analyze → enrich → build)
  ${colors.green}help${colors.reset}            Show this help message

${colors.cyan}ENRICH OPTIONS:${colors.reset}
  --mode <mode>       urls, dates, or all (default: all)
  --target <file>     Process specific file (e.g., unknown-date)
  --batch-size <n>    Articles per batch (default: 50)
  --max-batches <n>   Max batches to process (default: 10)
  --verbose           Show detailed output
  --dry-run           Preview without saving

${colors.cyan}BUILD OPTIONS:${colors.reset}
  --verbose           Show detailed output
  --stats-only        Only generate stats.json

${colors.cyan}ANALYZE OPTIONS:${colors.reset}
  --detailed          Show per-file breakdown
  --sources           Show top sources analysis
  --export            Export detailed report to JSON

${colors.cyan}EXAMPLES:${colors.reset}
  node orchestrate.js status
  node orchestrate.js enrich --batch-size 100 --verbose
  node orchestrate.js build --verbose
  node orchestrate.js analyze --sources --export
  node orchestrate.js full-pipeline

${colors.cyan}WORKFLOW:${colors.reset}
  For initial setup or after importing new data:
    1. node orchestrate.js import
    2. node orchestrate.js build
    3. node orchestrate.js status

  For ongoing enrichment:
    1. node orchestrate.js analyze
    2. node orchestrate.js enrich --max-batches 50 --verbose
    3. node orchestrate.js build

  For complete refresh:
    1. node orchestrate.js full-pipeline
`);
}

/**
 * Main entry point
 */
async function main() {
  const [command, ...args] = process.argv.slice(2);
  
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    cmdHelp();
    return;
  }
  
  try {
    switch (command) {
      case 'status':
        await cmdStatus();
        break;
      case 'import':
        await cmdImport(args);
        break;
      case 'enrich':
        await cmdEnrich(args);
        break;
      case 'build':
        await cmdBuild(args);
        break;
      case 'analyze':
        await cmdAnalyze(args);
        break;
      case 'full-pipeline':
        await cmdFullPipeline(args);
        break;
      default:
        log(`Unknown command: ${command}`, 'red');
        console.log('Run "node orchestrate.js help" for usage\n');
        process.exit(1);
    }
  } catch (error) {
    log(`\nError: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
