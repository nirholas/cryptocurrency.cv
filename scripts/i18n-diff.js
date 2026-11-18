const en = require('../messages/en.json');
const es = require('../messages/es.json');

function flatKeys(obj, prefix) {
  prefix = prefix || '';
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (typeof v === 'object' && v !== null) {
      keys = keys.concat(flatKeys(v, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

const enKeys = new Set(flatKeys(en));
const esKeys = new Set(flatKeys(es));
const missing = [...enKeys].filter((k) => !esKeys.has(k));
const extra = [...esKeys].filter((k) => !enKeys.has(k));

console.log('Missing in es.json (' + missing.length + '):');
missing.forEach((k) => console.log('  ' + k));
console.log('Extra in es.json (' + extra.length + '):');
extra.forEach((k) => console.log('  ' + k));
