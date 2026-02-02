#!/usr/bin/env node
/**
 * Page Count Script
 * Calculates the total number of pages that will be generated at build time
 * 
 * Run with: node scripts/count-pages.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES = [
  'ar', 'de', 'en', 'es', 'fr', 'id', 'it', 'ja', 
  'ko', 'nl', 'pl', 'pt', 'ru', 'th', 'tr', 'vi', 
  'zh-CN', 'zh-TW'
];

const APP_DIR = path.join(process.cwd(), 'src/app');
const ARCHIVE_DIR = path.join(process.cwd(), 'archive/v2/articles');
const TAGS_FILE = path.join(process.cwd(), 'src/lib/tags.ts');
const BLOG_DIR = path.join(process.cwd(), 'content/blog');

// Recursively find files
function findFiles(dir, pattern, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, pattern, results);
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

function countArchivedArticles() {
  let total = 0;
  try {
    if (!fs.existsSync(ARCHIVE_DIR)) return 0;
    const files = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.jsonl'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(ARCHIVE_DIR, file), 'utf-8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      total += lines.length;
    }
  } catch (e) {
    console.warn('Could not count archived articles:', e.message);
  }
  return total;
}

function countTags() {
  try {
    const content = fs.readFileSync(TAGS_FILE, 'utf-8');
    const matches = content.match(/slug: '/g);
    return matches ? matches.length : 0;
  } catch (e) {
    return 0;
  }
}

function countBlogPosts() {
  try {
    const files = findFiles(BLOG_DIR, /\.(md|mdx)$/);
    return files.filter(f => !f.includes('README')).length;
  } catch (e) {
    return 0;
  }
}

function extractDynamicSegments(routePath) {
  const segments = [];
  const regex = /\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(routePath)) !== null) {
    segments.push(match[1]);
  }
  return segments;
}

function hasGenerateStaticParams(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('generateStaticParams');
  } catch (e) {
    return false;
  }
}

function analyzeRoutes() {
  const pageFiles = findFiles(APP_DIR, /^page\.tsx$/);
  const routes = [];

  for (const file of pageFiles) {
    const relativePath = file.replace(APP_DIR, '').replace('/page.tsx', '') || '/';
    const dynamicSegments = extractDynamicSegments(relativePath);
    const isDynamic = dynamicSegments.length > 0;
    const hasParams = hasGenerateStaticParams(file);

    routes.push({
      path: relativePath,
      type: isDynamic ? 'dynamic' : 'static',
      hasGenerateStaticParams: hasParams,
      dynamicSegments,
    });
  }

  return routes;
}

function main() {
  console.log('🔍 Analyzing pages in Free Crypto News...\n');
  console.log('=' .repeat(70));

  // Count data sources
  const articleCount = countArchivedArticles();
  const tagCount = countTags();
  const blogCount = countBlogPosts();

  console.log('\n📊 DATA SOURCES:\n');
  console.log(`  Locales:           ${LOCALES.length}`);
  console.log(`  Archived Articles: ${articleCount}`);
  console.log(`  Tags:              ${tagCount}`);
  console.log(`  Blog Posts:        ${blogCount}`);

  // Analyze routes
  const routes = analyzeRoutes();
  const localeOnlyRoutes = routes.filter(r => 
    r.dynamicSegments.length === 0 || 
    (r.dynamicSegments.length === 1 && r.dynamicSegments[0] === 'locale')
  );
  const nestedDynamicRoutes = routes.filter(r => 
    r.dynamicSegments.length > 1 || 
    (r.dynamicSegments.length === 1 && r.dynamicSegments[0] !== 'locale')
  );

  // Check for missing generateStaticParams
  const missingParams = nestedDynamicRoutes.filter(r => 
    !r.hasGenerateStaticParams && 
    r.dynamicSegments.some(s => s !== 'locale')
  );

  console.log('\n📁 ROUTE ANALYSIS:\n');
  console.log(`  Total page files:              ${routes.length}`);
  console.log(`  Static/locale-only routes:     ${localeOnlyRoutes.length}`);
  console.log(`  Nested dynamic routes:         ${nestedDynamicRoutes.length}`);
  console.log(`  With generateStaticParams:     ${nestedDynamicRoutes.filter(r => r.hasGenerateStaticParams).length}`);

  if (missingParams.length > 0) {
    console.log(`\n⚠️  MISSING generateStaticParams (${missingParams.length}):\n`);
    missingParams.forEach(r => {
      console.log(`    ${r.path} [${r.dynamicSegments.join(', ')}]`);
    });
  } else {
    console.log(`\n  ✅ All nested dynamic routes have generateStaticParams`);
  }

  // Calculate page counts
  const pageCounts = [
    { 
      route: 'Static pages (locale only)', 
      pagesPerLocale: localeOnlyRoutes.length, 
      totalPages: localeOnlyRoutes.length * LOCALES.length,
    },
    { 
      route: '/tags/[slug]', 
      pagesPerLocale: tagCount, 
      totalPages: tagCount * LOCALES.length,
    },
    { 
      route: '/article/[id]', 
      pagesPerLocale: articleCount, 
      totalPages: articleCount * LOCALES.length,
    },
    { 
      route: '/blog/[slug]', 
      pagesPerLocale: blogCount, 
      totalPages: blogCount * LOCALES.length,
    },
    { 
      route: '/category/[category]', 
      pagesPerLocale: 10, 
      totalPages: 10 * LOCALES.length,
    },
    { 
      route: '/topic/[topic]', 
      pagesPerLocale: 20, 
      totalPages: 20 * LOCALES.length,
    },
    { 
      route: '/source/[source]', 
      pagesPerLocale: 15, 
      totalPages: 15 * LOCALES.length,
    },
    { 
      route: '/coin/[coinId]', 
      pagesPerLocale: 100, 
      totalPages: 100 * LOCALES.length,
    },
    { 
      route: '/markets/exchanges/[id]', 
      pagesPerLocale: 50, 
      totalPages: 50 * LOCALES.length,
    },
    { 
      route: '/defi/protocol/[slug]', 
      pagesPerLocale: 50, 
      totalPages: 50 * LOCALES.length,
    },
    { 
      route: '/defi/chain/[slug]', 
      pagesPerLocale: 30, 
      totalPages: 30 * LOCALES.length,
    },
    { 
      route: '/markets/categories/[id]', 
      pagesPerLocale: 20, 
      totalPages: 20 * LOCALES.length,
    },
  ];

  console.log('\n📈 PAGE COUNT BREAKDOWN:\n');
  console.log('  ' + '-'.repeat(66));
  console.log(`  ${'Route'.padEnd(35)} ${'Per Locale'.padStart(12)} ${'Total'.padStart(10)}`);
  console.log('  ' + '-'.repeat(66));

  let grandTotal = 0;
  for (const count of pageCounts) {
    console.log(`  ${count.route.padEnd(35)} ${count.pagesPerLocale.toString().padStart(12)} ${count.totalPages.toString().padStart(10)}`);
    grandTotal += count.totalPages;
  }

  console.log('  ' + '-'.repeat(66));
  console.log(`  ${'GRAND TOTAL'.padEnd(35)} ${'-'.padStart(12)} ${grandTotal.toString().padStart(10)}`);
  console.log('  ' + '-'.repeat(66));

  console.log('\n' + '='.repeat(70));
  console.log(`\n🎉 TOTAL PAGES AT BUILD TIME: ${grandTotal.toLocaleString()}\n`);

  // Summary
  console.log('📋 SUMMARY:\n');
  console.log(`  ✅ ${LOCALES.length} locales supported`);
  console.log(`  ✅ ${tagCount} tags with individual pages`);
  console.log(`  ✅ ${articleCount} archived articles with individual pages`);
  console.log(`  ✅ ${blogCount} blog posts`);
  console.log(`  ✅ ${routes.length} page files in /src/app`);
  
  if (grandTotal >= 200) {
    console.log(`\n  ✅ Target of 200+ pages: ACHIEVED (${grandTotal.toLocaleString()} pages)`);
  } else {
    console.log(`\n  ❌ Target of 200+ pages: NOT MET (${grandTotal.toLocaleString()} pages)`);
  }

  console.log('\n');

  // Return for programmatic use
  return {
    locales: LOCALES.length,
    tags: tagCount,
    articles: articleCount,
    blogPosts: blogCount,
    pageFiles: routes.length,
    totalPages: grandTotal,
    missingGenerateStaticParams: missingParams.map(r => r.path),
  };
}

const result = main();
