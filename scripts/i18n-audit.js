#!/usr/bin/env node
/**
 * i18n Audit Script
 * Finds hardcoded strings that should be translated
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate hardcoded strings
const PATTERNS = [
  // String literals in JSX
  />\s*([A-Z][a-z]+(?:\s+[A-Za-z]+)*)\s*</g,
  // Error messages
  /(?:error|message|title|label|placeholder|description):\s*['"]([^'"]+)['"]/gi,
  // console.log/error with strings
  /console\.(log|error|warn)\(['"]([^'"]+)['"]/g,
];

// Directories to scan
const SCAN_DIRS = [
  'src/app',
  'src/components',
  'src/lib',
  'mobile/src',
  'widget',
  'cli',
];

// File extensions to check
const EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// Strings to ignore (common non-translatable content)
const IGNORE_PATTERNS = [
  /^[A-Z_]+$/, // Constants like API_URL
  /^\d+/, // Numbers
  /^https?:\/\//, // URLs
  /^[a-z-]+$/, // kebab-case (likely CSS classes or IDs)
  /^[a-z_]+$/, // snake_case (likely API fields)
  /^\.[a-z]+$/, // File extensions
  /^#[a-fA-F0-9]+$/, // Color codes
  /^[<>=!]+$/, // Operators
  /^\s*$/, // Whitespace only
  /^(?:true|false|null|undefined)$/, // Boolean/null values
  /^(?:GET|POST|PUT|DELETE|PATCH)$/, // HTTP methods
  /^(?:utf-8|application\/json)$/i, // MIME types
];

// Known translatable strings that should be in messages/*.json
const KNOWN_TRANSLATABLE = new Set([
  'Loading',
  'Error',
  'Success',
  'Submit',
  'Cancel',
  'Save',
  'Delete',
  'Edit',
  'Close',
  'Back',
  'Next',
  'Previous',
  'Search',
  'Filter',
  'Sort',
  'Refresh',
  'Share',
  'Copy',
  'View all',
  'See more',
  'Show more',
]);

function shouldIgnore(str) {
  if (!str || str.length < 2) return true;
  if (str.length > 100) return true; // Likely not UI text
  return IGNORE_PATTERNS.some(pattern => pattern.test(str.trim()));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const findings = [];
  
  // Check for hardcoded strings in common patterns
  const patterns = [
    // JSX text content
    { regex: />\s*([A-Z][a-z]+(?:\s+[a-zA-Z]+)*)\s*</g, type: 'JSX text' },
    // String props
    { regex: /(?:title|label|placeholder|message|error|description|text)=["']([^"']+)["']/gi, type: 'String prop' },
    // Error objects
    { regex: /{\s*(?:error|message):\s*["']([^"']+)["']/gi, type: 'Error object' },
    // toast/alert messages
    { regex: /(?:toast|alert|showMessage)\(['"]([^'"]+)['"]/gi, type: 'Toast/Alert' },
  ];
  
  const lines = content.split('\n');
  
  patterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const str = match[1];
      if (!shouldIgnore(str)) {
        // Find line number
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        findings.push({
          file: filePath,
          line: lineNumber,
          type,
          string: str.trim(),
          isKnownTranslatable: KNOWN_TRANSLATABLE.has(str.trim()),
        });
      }
    }
  });
  
  return findings;
}

function scanDirectory(dir) {
  const findings = [];
  
  if (!fs.existsSync(dir)) {
    return findings;
  }
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(file.name)) {
        findings.push(...scanDirectory(fullPath));
      }
    } else if (EXTENSIONS.some(ext => file.name.endsWith(ext))) {
      findings.push(...scanFile(fullPath));
    }
  }
  
  return findings;
}

function main() {
  console.log('🔍 i18n Audit - Scanning for hardcoded strings...\n');
  
  const allFindings = [];
  
  SCAN_DIRS.forEach(dir => {
    console.log(`Scanning ${dir}...`);
    allFindings.push(...scanDirectory(dir));
  });
  
  // Group by file
  const byFile = {};
  allFindings.forEach(finding => {
    if (!byFile[finding.file]) {
      byFile[finding.file] = [];
    }
    byFile[finding.file].push(finding);
  });
  
  // Report
  console.log('\n📋 AUDIT REPORT\n');
  console.log('=' .repeat(60));
  
  let totalStrings = 0;
  let knownTranslatable = 0;
  
  Object.entries(byFile)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([file, findings]) => {
      console.log(`\n📁 ${file}`);
      findings.forEach(f => {
        const marker = f.isKnownTranslatable ? '⚠️' : '❓';
        console.log(`  ${marker} L${f.line}: "${f.string}" (${f.type})`);
        totalStrings++;
        if (f.isKnownTranslatable) knownTranslatable++;
      });
    });
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 SUMMARY\n');
  console.log(`Total hardcoded strings found: ${totalStrings}`);
  console.log(`Known translatable (need i18n): ${knownTranslatable}`);
  console.log(`Unknown (review needed): ${totalStrings - knownTranslatable}`);
  
  console.log('\n💡 RECOMMENDATIONS:\n');
  console.log('1. Replace hardcoded strings with useTranslations() hook');
  console.log('2. Add missing strings to messages/en.json');
  console.log('3. Run translation script to generate all language files');
  console.log('4. Use <FormattedMessage> for JSX text content');
  
  // Write report to file
  const reportPath = 'i18n-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalStrings,
    knownTranslatable,
    findings: allFindings,
  }, null, 2));
  
  console.log(`\n📝 Full report saved to ${reportPath}`);
}

main();
