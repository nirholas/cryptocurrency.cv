/**
 * Fix missing translation keys by adding English fallbacks.
 * This script deep-merges en.json into each locale file for any missing keys.
 */
const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'messages');
const LOCALES = ['es','fr','de','pt','zh-CN','zh-TW','ko','ar','ru','it','nl','pl','tr','vi','th','id'];

const en = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf-8'));

/**
 * Deep merge source into target, only adding keys that don't exist in target.
 * Returns a new object.
 */
function deepMergeDefaults(target, source) {
  const result = Object.assign({}, target);
  Object.keys(source).forEach(function(key) {
    if (!(key in result)) {
      result[key] = source[key];
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      Array.isArray(source[key]) === false &&
      typeof result[key] === 'object' &&
      result[key] !== null &&
      Array.isArray(result[key]) === false
    ) {
      result[key] = deepMergeDefaults(result[key], source[key]);
    }
  });
  return result;
}

LOCALES.forEach(function(locale) {
  const filePath = path.join(MESSAGES_DIR, locale + '.json');
  try {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const merged = deepMergeDefaults(existing, en);
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
    console.log('Fixed: ' + locale);
  } catch(e) {
    console.error('Error fixing ' + locale + ': ' + e.message);
  }
});

console.log('Done!');
