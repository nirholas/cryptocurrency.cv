const fs = require('fs');
const en = JSON.parse(fs.readFileSync('messages/en.json', 'utf-8'));
const es = JSON.parse(fs.readFileSync('messages/es.json', 'utf-8'));

function getAllKeys(obj, prefix) {
  prefix = prefix || '';
  return Object.keys(obj).reduce(function(keys, key) {
    const fullKey = prefix ? prefix+'.'+key : key;
    const val = obj[key];
    if (typeof val === 'object' && val !== null && Array.isArray(val) === false) {
      return keys.concat(getAllKeys(val, fullKey));
    }
    return keys.concat([fullKey]);
  }, []);
}

const enKeys = getAllKeys(en);
const esKeys = getAllKeys(es);
const missing = enKeys.filter(function(k) { return esKeys.indexOf(k) === -1; });

// Show unique top-level sections missing
const sections = {};
missing.forEach(function(k) {
  const section = k.split('.')[0];
  sections[section] = (sections[section] || 0) + 1;
});
console.log('Missing sections and counts:');
Object.keys(sections).forEach(function(s) {
  console.log('  ' + s + ': ' + sections[s] + ' keys');
});
